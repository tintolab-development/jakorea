import { describe, expect, it } from 'vitest'
import { fromDetail, fromListItem } from '@/features/program/ujat/api/adapters'
import { parseServiceDetail, parseUjatServiceDetailExtras } from '@/features/program/ujat/api/service-detail'
import { resolveUjatPrimaryProgressById } from '@/features/program/ujat/lib/is-ujat-primary-program'
import { normalizeUjatProgressStatus } from '@/features/program/ujat/lib/normalize-ujat-progress-status'
import {
  normalizeUjatVolunteerApplicationStatus,
  projectUjatVolunteerApplicationStatus,
} from '@/features/program/ujat/lib/normalize-ujat-volunteer-application-status'
import type { ProgramResponse } from '@/shared/api/generated/logs/schemas/programResponse'

const PRIMARY_182103_FLAT = {
  ujatProgressStatus: 'VOLUNTEER_RECRUITING',
  semesterType: 'FULL_YEAR',
  educationForm: 'offline',
  preTrainingDeliveredBy: 'JA',
  blockedDatesH1: ['2026-05-01'],
  listCaps: { regionJeonbukMaxClass: 2 },
  surveyMenuKeys: ['survey-volunteer-satisfaction', 'survey-school-satisfaction'],
}

describe('UJAT Primary Case adapter', () => {
  it('maps Primary list ids and progress fallback for 182101–182105', () => {
    expect(resolveUjatPrimaryProgressById('182101')).toBe('EDUCATION_SCHEDULED')
    expect(resolveUjatPrimaryProgressById('182103')).toBe('VOLUNTEER_RECRUITING')
    expect(resolveUjatPrimaryProgressById('182105')).toBe('PROGRAM_ENDED')

    const row = fromListItem({
      id: 182103,
      nameKo: '2026년 JA Korea 초등 경제교육',
      periodStatus: 'RECRUITING',
      businessStartDate: '2026-01-01',
      businessEndDate: '2026-12-31',
      organizationApplicationCount: 0,
      instructorApplicantCount: 0,
    })

    expect(row.id).toBe('182103')
    expect(row.ujatProgressStatus).toBe('VOLUNTEER_RECRUITING')
    expect(row.instructors).toBe(0)
    expect(row.title).toContain('JA Korea')
  })

  it('parses flat Primary serviceDetailJson (not only {version,program} envelope)', () => {
    const partial = parseServiceDetail(JSON.stringify(PRIMARY_182103_FLAT))
    const extras = parseUjatServiceDetailExtras(JSON.stringify(PRIMARY_182103_FLAT))

    expect(partial.ujatProgressStatus).toBe('VOLUNTEER_RECRUITING')
    expect(partial.generalSurveyMenuKeys).toEqual([
      'survey-volunteer-satisfaction',
      'survey-school-satisfaction',
    ])
    expect(extras.semesterType).toBe('FULL_YEAR')
    expect(extras.preTrainingDeliveredBy).toBe('JA')
    expect(extras.educationForm).toBe('offline')
  })

  it('fromDetail hydrates progress + FULL_YEAR extras', () => {
    const mapped = fromDetail({
      id: '182104',
      title: 'UJAT Primary Case 04',
      periodStatus: 'IN_PROGRESS',
      businessStartDate: '2026-01-01',
      businessEndDate: '2026-12-31',
      instructors: 0,
      serviceDetailJson: JSON.stringify({
        ujatProgressStatus: 'EDUCATION_IN_PROGRESS',
        semesterType: 'FULL_YEAR',
        surveyMenuKeys: ['survey-volunteer-satisfaction'],
      }),
    } as ProgramResponse & { periodStatus?: string })

    expect(mapped.ujatProgressStatus).toBe('EDUCATION_IN_PROGRESS')
    expect(mapped.ujatServiceDetailExtras?.semesterType).toBe('FULL_YEAR')
    expect(mapped.instructors).toBe(0)
  })

  it('normalizes thin progress aliases to SoT', () => {
    expect(normalizeUjatProgressStatus('WAITING')).toBe('EDUCATION_SCHEDULED')
    expect(normalizeUjatProgressStatus('PASSED')).toBe('EDUCATION_SCHEDULED')
    expect(normalizeUjatProgressStatus('FINAL_ACCEPTED')).toBe('EDUCATION_SCHEDULED')
    expect(normalizeUjatProgressStatus('VOLUNTEER_RECRUITING')).toBe('VOLUNTEER_RECRUITING')
  })

  it('projects volunteer application_status canonical (not INTERVIEW_EVALUATED)', () => {
    expect(normalizeUjatVolunteerApplicationStatus('INTERVIEW_EVALUATED')).toBe(
      'INTERVIEW_ASSIGNED'
    )
    expect(normalizeUjatVolunteerApplicationStatus('PASSED')).toBe('DOCUMENT_PASSED')
    expect(normalizeUjatVolunteerApplicationStatus('FINAL_ACCEPTED')).toBe('FINAL_SELECTED')

    const reserve = projectUjatVolunteerApplicationStatus({
      applicationStatus: 'RESERVE',
      reserveRank: 3,
    })
    expect(reserve.secondInterviewScreeningStatus).toBe('reserve3')
    expect(reserve.documentScreeningStatus).toBe('pass')

    const waiting = projectUjatVolunteerApplicationStatus({
      applicationStatus: 'WAITING_REVIEW',
    })
    expect(waiting.documentScreeningStatus).toBe('pending')
  })
})
