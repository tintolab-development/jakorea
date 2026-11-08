import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { StatusBadge } from '@/shared/components/status-badge'
import { GeminiApprovedTrainingStatusText } from '../ui/approved/training-status-text'
import { GeminiInstitutionApprovalStatusBadge } from '../ui/detail/gemini-institution-approval-status-badge'
import { getGeminiRecruitmentStatusPresentation } from './recruitment/status-presentation'
import { getGeminiApprovedTrainingStatusPresentation } from './approved/format-display'
import { getGeminiInstitutionApprovalStatusPresentation, getGeminiInstructorApprovalStatusPresentation } from './application-status-presentation'
import { resolveGeminiInstructorApprovalAction } from './approved/instructor-approval-action'
import { GEMINI_RECRUITMENT_FILTER_FIELDS } from '../model/recruitment/filter-fields'
import { GEMINI_APPROVED_TRAINING_FILTER_FIELDS } from '../model/approved/filter-fields'
import { GEMINI_INSTRUCTOR_APPLICATION_FILTER_FIELDS } from '../model/approved/instructor-application-filter-fields'
import type { GeminiApprovedTrainingStatus } from '../model/approved/types'
import type { GeminiRecruitmentDisplayStatus } from '../model/recruitment/types'
import type { GeminiInstructorApplicationApprovalStatus } from '../model/approved/instructor-application-types'

const source = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')
const progress: GeminiApprovedTrainingStatus[] = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'NOT_CONDUCTED']
const recruitment: GeminiRecruitmentDisplayStatus[] = ['SCHEDULED', 'IN_PROGRESS', 'ENDED', 'DRAFT']
const approvals: GeminiInstructorApplicationApprovalStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'UNKNOWN']

describe('Gemini status presentation uses domain registries and the common renderer', () => {
  it.each(progress)('renders identical progress status in list/detail: %s', status => {
    const presentation = getGeminiApprovedTrainingStatusPresentation(status)
    for (const context of ['list', 'detail'] as const) {
      const html = renderToStaticMarkup(createElement(GeminiApprovedTrainingStatusText, { status, context }))
      expect(html).toContain(presentation.label)
      expect(html).toContain(`--status-accent:${presentation.accentColor}`)
      expect(html.includes('status-badge--muted')).toBe(status === 'NOT_CONDUCTED')
    }
  })
  it('preserves a null detail status as a dash, without date-derived invented state', () => {
    expect(renderToStaticMarkup(createElement(GeminiApprovedTrainingStatusText, { status: null, context: 'detail' }))).toBe('-')
  })
  it.each(recruitment)('uses the same recruitment label for the filter and Text: %s', status => {
    const spec = getGeminiRecruitmentStatusPresentation(status)
    const options = GEMINI_RECRUITMENT_FILTER_FIELDS.find(f => f.key === 'status')?.options
    expect(options).toContainEqual({ label: spec.label, value: status })
    const html = renderToStaticMarkup(createElement(StatusBadge, { domain: 'custom', variant: 'text', ...spec }))
    expect(html).toContain(spec.label)
    expect(html).toContain(spec.accentColor)
  })
  it.each(progress)('preserves approved-training filter values and labels: %s', status => {
    const options = GEMINI_APPROVED_TRAINING_FILTER_FIELDS.find(f => f.key === 'status')?.options
    expect(options).toContainEqual({ label: getGeminiApprovedTrainingStatusPresentation(status).label, value: status })
  })
  it('keeps institution approval and instructor approval as distinct business axes', () => {
    expect(getGeminiInstitutionApprovalStatusPresentation('APPROVED')).toEqual({ label: '승인', accentColor: 'var(--Brand-500, #00a0af)' })
    expect(getGeminiInstructorApprovalStatusPresentation('APPROVED')).toEqual({ label: '승인 완료', accentColor: 'var(--color-blue, #017eaf)' })
    for (const status of ['PENDING', 'APPROVED', 'REJECTED'] as const) {
      expect(renderToStaticMarkup(createElement(GeminiInstitutionApprovalStatusBadge, { status })))
        .toContain(getGeminiInstitutionApprovalStatusPresentation(status).label)
      const options = GEMINI_INSTRUCTOR_APPLICATION_FILTER_FIELDS.find(f => f.key === 'approvalStatus')?.options
      expect(options).toContainEqual({ label: getGeminiInstructorApprovalStatusPresentation(status).label, value: status })
    }
    expect(getGeminiInstructorApprovalStatusPresentation('UNKNOWN').label).toBe('상태 확인 필요')
  })
  it.each(approvals)('does not change approve/change CTA semantics: %s', approvalStatus => {
    expect(resolveGeminiInstructorApprovalAction({ approvalStatus, instructorAssigned: false }))
      .toBe(approvalStatus === 'PENDING' ? 'approve' : 'invalid')
    expect(resolveGeminiInstructorApprovalAction({ approvalStatus, instructorAssigned: true }))
      .toBe(approvalStatus === 'PENDING' || approvalStatus === 'REJECTED' ? 'change' : 'invalid')
  })
  it('removes per-screen status color declarations and local label authorities', () => {
    for (const path of ['../ui/approved/list.css', '../ui/approved/detail-program-info-tab.css', '../ui/recruitment/list.css']) {
      expect(source(path)).not.toMatch(/__status(?:--[a-z-]+)?\s*\{/)
    }
    expect(source('../ui/detail/institution-application-tab.css')).not.toContain('.gemini-institution-approval-status')
    expect(source('../ui/approved/detail-instructor-application-tab.css')).not.toContain('__approval')
    expect(source('../ui/recruitment/list.tsx')).not.toContain('const RECRUITMENT_STATUS_LABEL')
    expect(source('../ui/approved/detail-instructor-application-tab.tsx')).not.toContain('const APPROVAL_STATUS_LABEL')
    // The existing server-action gates remain in place, independently of presentation.
    expect(source('../ui/approved/detail-instructor-application-tab.tsx')).toContain("availableActions?.includes('APPROVE') === true")
    expect(source('../ui/approved/detail-instructor-application-tab.tsx')).toContain("availableActions?.includes('RESEND_NOTIFICATION') === true")
  })
})
