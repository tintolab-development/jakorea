import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ApprovalStatusText } from './approval-status-text'
import { getApprovalStatusTag, getApprovalStatusTextPresentation, getApprovalStatusFilterOptions, type ApprovalStatusKey } from '../lib/status-tag-specs'
import { generalOrganizationApplicationFilterFields, generalIndividualApplicationFilterFields, generalInstructorApplicationFilterFields, generalInstructorCalendarFilterFields } from '@/features/program/general/lib/application-filter-fields'
import { institutionFilterFields, instructorFilterFields } from '@/features/program/general/ui/table/applicant-filter-fields'
import { ProgramApprovalStatusDetailValue } from '@/features/program/general/ui/detail-modal/applications/applicant-detail/program-approval-status-detail-value'

const statuses: ApprovalStatusKey[] = ['pending', 'rejected', 'approved', 'cancelled']
const source = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8')

describe('program application approval presentation and filter SSOT', () => {
  it.each(statuses)('preserves Text label/accent and separate Tag kind: %s', status => {
    const spec = getApprovalStatusTextPresentation(status)
    const html = renderToStaticMarkup(createElement(ApprovalStatusText, { status }))
    expect(html).toContain(spec.label)
    expect(html).toContain(`--status-accent:${spec.accentColor}`)
    expect(getApprovalStatusTag(status).label).toBe(spec.label)
  })
  it('does not force program approval into Gemini/instructor approval or Tag colors', () => {
    expect(getApprovalStatusTextPresentation('approved')).toEqual({ label: '승인 완료', accentColor: 'var(--Netural-black, #3d3d3d)' })
    expect(getApprovalStatusTag('approved').tone).toBe('gray')
    expect(getApprovalStatusTextPresentation('cancelled').accentColor).toBe('#e65100')
    expect(getApprovalStatusTag('cancelled').tone).toBe('orange')
  })
  it('preserves exact filter value/order and shares labels across six actual filter groups', () => {
    const expected = [
      { label: '전체', value: 'all' }, { label: '승인 대기', value: 'pending' },
      { label: '신청 반려', value: 'rejected' }, { label: '승인 완료', value: 'approved' },
    ]
    expect(getApprovalStatusFilterOptions()).toEqual(expected)
    expect(getApprovalStatusFilterOptions()).not.toBe(getApprovalStatusFilterOptions())
    for (const fields of [generalOrganizationApplicationFilterFields, generalIndividualApplicationFilterFields, generalInstructorApplicationFilterFields, generalInstructorCalendarFilterFields, institutionFilterFields, instructorFilterFields]) {
      expect(fields.find(f => f.key === 'approvalStatus')?.options).toEqual(expected)
    }
  })
  it('keeps unknown detail as dash and only renders resend for existing approved/rejected callbacks', () => {
    const callback = () => { throw new Error('Rendering must not trigger notification') }
    expect(renderToStaticMarkup(createElement(ProgramApprovalStatusDetailValue, { status: 'UNKNOWN' as ApprovalStatusKey }))).toBe('-')
    const pending = renderToStaticMarkup(createElement(ProgramApprovalStatusDetailValue, { status: 'pending', onResendNotificationClick: callback }))
    expect(pending).not.toContain('<button')
    for (const status of ['approved', 'rejected'] as const) {
      expect(renderToStaticMarkup(createElement(ProgramApprovalStatusDetailValue, { status }))).not.toContain('<button')
      expect(renderToStaticMarkup(createElement(ProgramApprovalStatusDetailValue, { status, onResendNotificationClick: callback }))).toContain('<button')
    }
  })
  it('leaves no independent approval Text color CSS or local filter mapping', () => {
    expect(source('./approval-status-text.css')).not.toContain('color:')
    expect(source('./approval-status-text.tsx')).toContain('getApprovalStatusTextPresentation(status)')
    for (const path of ['../../features/program/general/lib/application-filter-fields.ts', '../../features/program/general/ui/table/applicant-filter-fields.ts']) {
      expect(source(path)).toContain('getApprovalStatusFilterOptions()')
      expect(source(path)).not.toContain('const APPROVAL_STATUS_OPTIONS = [')
    }
  })
})
