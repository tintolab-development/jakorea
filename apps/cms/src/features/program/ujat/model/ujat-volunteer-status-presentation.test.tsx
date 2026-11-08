import { GeneralInterviewAssignmentStatusText } from '@/features/program/general/ui/detail-modal/applications/volunteer-screening/status-text'
import { getGeneralInterviewAssignmentTextPresentation } from '@/features/program/general/lib/volunteer-screening-constants'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { getUjatDocumentScreeningTextPresentation, getUjatInterviewAssignmentTextPresentation, getUjatEducationVolunteerAssignmentTextPresentation, UJAT_EDU_PROGRESS_VOLUNTEER_ASSIGNMENT_STATUS_LABEL } from './ujat-volunteer-status-presentation'
import { UJAT_EDU_PROGRESS_VOLUNTEER_ASSIGNMENT_STATUS_LABEL as compatibilityLabels } from '../ui/detail-modal/progress/volunteers/types'
import { DocumentScreeningStatusText } from '../ui/detail-modal/application-volunteer/screening/shared/document-screening-status-text'
import { InterviewAssignmentStatusText } from '../ui/detail-modal/application-volunteer/screening/shared/interview-assignment-status-text'
import { UjatEducationProgressVolunteerAssignmentStatusLabel } from '../ui/detail-modal/progress/volunteers/assignment-status-label'

const green = 'var(--Status-green-main, #1e8c29)'
const black = 'var(--Netural-black, #3d3d3d)'
const red = 'var(--Status-red-main, #c32f4a)'
const cases = [
  ['document', 'pending', '신청 및 대기 중', green], ['document', 'pass', '서류 합격', black], ['document', 'fail', '서류 불합격', red],
  ['interview', 'waiting', '배정 대기', green], ['interview', 'assigned', '배정 완료', black], ['interview', 'withdrawn', '활동 포기', red],
  ['education', 'assignment_waiting', '배정 대기', green], ['education', 'assignment_completed', '배정 완료', black], ['education', 'activity_abandoned', '활동 포기', red],
] as const
const presentation = (domain: string, status: string) => domain === 'document' ? getUjatDocumentScreeningTextPresentation(status as never) : domain === 'interview' ? getUjatInterviewAssignmentTextPresentation(status as never) : getUjatEducationVolunteerAssignmentTextPresentation(status as never)
const html = (domain: string, status: string) => domain === 'document' ? renderToStaticMarkup(createElement(DocumentScreeningStatusText, { status: status as never })) : domain === 'interview' ? renderToStaticMarkup(createElement(InterviewAssignmentStatusText, { status: status as never })) : renderToStaticMarkup(createElement(UjatEducationProgressVolunteerAssignmentStatusLabel, { status: status as never }))

describe('UJAT distinct status axes, shared Text renderer', () => {
  it.each(cases)('preserves %s %s label and color', (domain, status, label, accentColor) => {
    expect(presentation(domain, status)).toEqual({ label, accentColor })
    expect(html(domain, status)).toContain(label)
    expect(html(domain, status)).toContain(`--status-accent:${accentColor}`)
  })
  it.each(['document', 'interview', 'education'])('does not invent unknown fallback in %s', domain => {
    expect(presentation(domain, 'unknown')).toEqual({ label: undefined, accentColor: undefined })
    expect(html(domain, 'unknown')).toMatch(/><\/span>$/)
  })
  it('keeps filter model compatibility as the same label authority, without raw key unification', () => {
    expect(compatibilityLabels).toBe(UJAT_EDU_PROGRESS_VOLUNTEER_ASSIGNMENT_STATUS_LABEL)
    expect(Object.keys(compatibilityLabels)).toEqual(['assignment_waiting', 'assignment_completed', 'activity_abandoned'])
    expect(presentation('interview', 'assigned').label).toBe(presentation('education', 'assignment_completed').label)
    expect(presentation('interview', 'assignment_completed').label).toBeUndefined()
  })
  it('removes local presentation CSS while preserving existing filter label authorities', () => {
    const source = (p: string) => readFileSync(new URL(p, import.meta.url), 'utf8')
    for (const p of ['../ui/detail-modal/progress/volunteers/assignment-status-label.css', '../ui/detail-modal/application-volunteer/screening/shared/document-screening-status-text.css', '../ui/detail-modal/application-volunteer/screening/shared/interview-assignment-status-text.css']) expect(source(p)).not.toContain('color:')
    for (const [p, authority] of [
      ['../ui/detail-modal/progress/volunteers/filter-fields.ts', 'UJAT_EDU_PROGRESS_VOLUNTEER_ASSIGNMENT_STATUS_LABEL'],
      ['../ui/detail-modal/application-volunteer/screening/doc-passed/filter-fields.ts', 'UJAT_INTERVIEW_ASSIGNMENT_STATUS_LABELS'],
      ['../ui/detail-modal/application-volunteer/screening/doc-screening/filter-fields.ts', 'UJAT_DOCUMENT_SCREENING_STATUS_LABELS'],
    ]) expect(source(p)).toContain(`Object.entries(${authority})`)
  })
})

describe('general program reused former UJAT CSS consumers', () => {
  it.each([
    ['waiting', '배정 대기', green], ['assigned', '배정 완료', black],
    ['withdrawn', '활동 포기', red], ['not_required', '면접 불필요', 'inherit'],
  ] as const)('preserves %s label/accent including general-only not_required', (status, label, accentColor) => {
    expect(getGeneralInterviewAssignmentTextPresentation(status)).toEqual({ label, accentColor })
    const rendered = renderToStaticMarkup(createElement(GeneralInterviewAssignmentStatusText, { status }))
    expect(rendered).toContain(label)
    expect(rendered).toContain(`--status-accent:${accentColor}`)
  })
})
