import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  getInstructorSettlementStatusPresentation,
  getInstructorSettlementInvoiceStatusPresentation,
  INSTRUCTOR_SETTLEMENT_STATUS_ORDER,
  INSTRUCTOR_SETTLEMENT_STATUS_LABELS,
  INSTRUCTOR_SETTLEMENT_STATUS_LABELS_SHORT,
  INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE,
  resolveInstructorSettlementUiStatusFromListLabel,
  isInstructorSettlementEligibleForPaymentStatementIssue,
  isInstructorSettlementInactive,
} from '../constants/instructor-settlement-status'
import { getInstructorSettlementStatusTag } from '../lib/status-tag-specs'
import { StatusBadge } from './status-badge'
import { InstructorSettlementStatusText } from '../ui/instructor-settlement-status-text'

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

describe('instructor settlement presentation consumers share one registry', () => {
  it.each(INSTRUCTOR_SETTLEMENT_STATUS_ORDER)('preserves all labels and kind distinctions: %s', status => {
    const text = getInstructorSettlementStatusPresentation(status, 'text')
    const short = getInstructorSettlementStatusPresentation(status, 'short')
    const tag = getInstructorSettlementStatusPresentation(status, 'tag')
    expect(text.label).toBe(INSTRUCTOR_SETTLEMENT_STATUS_LABELS[status])
    expect(short.label).toBe(INSTRUCTOR_SETTLEMENT_STATUS_LABELS_SHORT[status])
    expect(tag.label).toBe(INSTRUCTOR_SETTLEMENT_STATUS_LABELS[status])
    expect(getInstructorSettlementInvoiceStatusPresentation(status)).toEqual(
      getInstructorSettlementStatusPresentation(status, 'invoice')
    )
    expect(getInstructorSettlementStatusTag(status)).toEqual({ label: tag.label, accentColor: tag.color })
    // Calendar colors remain raw fallbacks from the same palette, not a second semantic mapping.
    expect(tag.color).toContain(INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE[status].color)
    const standalone = renderToStaticMarkup(createElement(InstructorSettlementStatusText, { status }))
    const badge = renderToStaticMarkup(createElement(StatusBadge, { domain: 'settlement', status, variant: 'text' }))
    expect(standalone).toContain(text.label)
    expect(standalone).toContain(`--status-accent:${text.color}`)
    expect(badge).toContain(`--status-accent:${text.color}`)
    expect(renderToStaticMarkup(createElement(StatusBadge, { domain: 'settlement', status })))
      .toContain(`--status-accent:${tag.color}`)
  })

  it('does not collapse Text neutral into Tag neutral and keeps Short labels on the Figma Short spec', () => {
    expect(getInstructorSettlementStatusPresentation('none', 'text').color).toBe('var(--Netural-black, #3d3d3d)')
    expect(getInstructorSettlementStatusPresentation('none', 'tag').color).toBe('rgba(61, 61, 61, 0.8)')
    expect(getInstructorSettlementStatusPresentation('awaiting_confirmation', 'short').label).toBe('확인 대기')
    expect(getInstructorSettlementStatusPresentation('partial_confirmation', 'short').label).toBe('확인 중')
    expect(getInstructorSettlementStatusPresentation('account_paid', 'short').label).toBe('지급 완료')
    expect(getInstructorSettlementStatusPresentation('partial_confirmation', 'invoice').label).toBe('확인 진행 중')
  })

  it('preserves API aliases and unknown/null interpretation without changing the business axis', () => {
    const label = '계좌 지급 대기 중'
    const status = resolveInstructorSettlementUiStatusFromListLabel(label)
    expect(status).toBe('awaiting_confirmation')
    const rendered = renderToStaticMarkup(createElement(InstructorSettlementStatusText, { status: status!, label }))
    expect(rendered).toContain(label)
    expect(rendered).not.toContain('>확인 대기 중<')
    expect(resolveInstructorSettlementUiStatusFromListLabel('UNKNOWN')).toBeNull()
    expect(resolveInstructorSettlementUiStatusFromListLabel(null)).toBeNull()
    expect(resolveInstructorSettlementUiStatusFromListLabel('-')).toBeNull()
  })

  it.each(INSTRUCTOR_SETTLEMENT_STATUS_ORDER)('does not alter issuance or inactive predicates: %s', status => {
    expect(isInstructorSettlementEligibleForPaymentStatementIssue(status)).toBe(
      status === 'payment_statement_verified' || status === 'account_paid'
    )
    expect(isInstructorSettlementInactive(status)).toBe(
      status === 'application_rejected' || status === 'payment_correction_requested'
    )
  })

  it('removes independent settlement color CSS and alias-span callsites', () => {
    expect(source('./status-badge.css')).not.toMatch(/--instructor-settlement-[a-z-]+\s*\{/)
    expect(source('../ui/instructor-settlement-status-text.css')).not.toContain('color:')
    expect(source('../lib/status-tag-specs.ts')).not.toContain('const INSTRUCTOR_SETTLEMENT_ACCENT')
    for (const path of [
      '../../features/user/shared/ui/user-list.tsx',
      '../../features/user/detail/ui/user-basic-info/status/index.tsx',
    ]) {
      expect(source(path)).toContain('label={label}')
      expect(source(path)).not.toContain('getInstructorSettlementStatusTextClassName')
    }
  })
})
