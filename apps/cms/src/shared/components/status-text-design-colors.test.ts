import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { PAYMENT_ORDER_STATUS_LIST_TEXT_COLOR } from '../constants/payment-order-status-list-colors'
import { getInstructorSettlementInvoiceStatusPresentation, getInstructorSettlementStatusPresentation, INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE } from '../constants/instructor-settlement-status'

const css = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const declaration = (source: string, selector: string) => {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return source.match(new RegExp(`(?:^|\\n)${escaped}\\s*\\{([^}]+)\\}`))?.[1]
}

// Figma Text: 14804:19563 / 19595 / 19668.
// Settlement Tag 14804:19759 / Short 14804:19841 and reserve Tag 14804:19719 verified separately.
describe('CMS Figma status Text colors', () => {
  it('uses orange for invoice Short Text and matches the independently verified settlement Tag palette', () => {
    expect(getInstructorSettlementInvoiceStatusPresentation('payment_statement_reapplication').color)
      .toBe('var(--Status-orange-main, #f07917)')
    expect(INSTRUCTOR_SETTLEMENT_STATUS_TAG_STYLE.payment_statement_reapplication.color).toBe('#f07917')
    expect(getInstructorSettlementInvoiceStatusPresentation('none').color).toBe('rgba(61, 61, 61, 0.8)')
  })

  it('uses independently verified blue for reserve Text and Tag', () => {
    const source = css('../../features/program/shared/ui/volunteer-screening/second-interview-screening-tone.css')
    expect(declaration(source, '.second-interview-screening-status-text.second-interview-screening-tone--reserve'))
      .toContain('color: var(--Status-blue-main, #017eaf)')
    expect(declaration(source, '.second-interview-screening-status-badge.second-interview-screening-tone--reserve'))
      .toContain('border: 1px solid var(--Status-blue-main, #017eaf)')
  })

  it('uses red for interview-failed Text only', () => {
    expect(declaration(css('./status-badge.css'), '.status-badge--variant-text.status-badge--program-enrollment-interview-failed'))
      .toContain('--status-accent: var(--Status-red-main, #c32f4a)')
  })

  it('shares standalone and StatusBadge settlement Text through the presentation registry', () => {
    expect(getInstructorSettlementStatusPresentation('payment_statement_reapplication', 'text').color)
      .toBe('var(--Status-orange-main, #f07917)')
    expect(getInstructorSettlementStatusPresentation('none', 'text').color)
      .toBe('var(--Netural-black, #3d3d3d)')
    expect(declaration(css('./status-badge.css'), '.status-badge--settlement-presentation'))
      .toContain('color: var(--status-accent)')
    expect(css('../ui/instructor-settlement-status-text.css')).not.toContain('color:')
    expect(css('./status-badge.css')).not.toContain('--instructor-settlement-reapplication {')
  })
  it('keeps line/menu colors aligned without changing state labels', () => {
    expect(PAYMENT_ORDER_STATUS_LIST_TEXT_COLOR).toEqual({
      pending: '#F07917', reapplication: '#F07917', confirmed: '#1E8C29',
      awaiting_payment: '#F07917', correction: '#E8007C', rejected: '#017EAF',
      application_rejected: '#C32F4A',
    })
    const source = css('../../pages/settlement-management/payment-order-admin-status-tag.css')
    expect(declaration(source, '.payment-order-admin__status-text--rejected'))
      .toContain('color: var(--Status-blue-main, #017eaf)')
  })

})
