import { describe, expect, it } from 'vitest'
import {
  formatJaKoreaActivityPeriod,
  instructorJaKoreaSectionDescription,
} from './blocks'
import {
  resolveInstructorResumeTimelineRightLabel,
  shouldShowInstructorResumeTimelineDivider,
} from './timeline-row'
import { instructorCmsProfileToApplicantInstructorRowPartial } from '@/features/user/api/map-instructor-cms-profile'
import type { InstructorCmsProfileProposal } from '@/features/user/api/types/instructor-cms-profile-proposal'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'

describe('instructor JA Korea resume blocks', () => {
  it('formats activity period with spaced dots', () => {
    expect(
      formatJaKoreaActivityPeriod({
        periodStart: '2024-02-15',
        periodEnd: '2024-09-15',
        title: '프로그램명',
      })
    ).toBe('2024. 02. 15 ~ 2024. 09. 15')
  })

  it('shows count summary for section header', () => {
    const row = {
      jaKoreaActivities: [{ title: 'A' }, { title: 'B' }],
    } as ApplicantInstructorRow

    expect(instructorJaKoreaSectionDescription(row)).toBe('2개')
  })
})

describe('InstructorResumeTimelineRow helpers', () => {
  it('shows divider only when primary and secondary are both present', () => {
    expect(shouldShowInstructorResumeTimelineDivider('1종 운전면허', '경찰청')).toBe(true)
    expect(shouldShowInstructorResumeTimelineDivider('프로그램명', undefined)).toBe(false)
    expect(shouldShowInstructorResumeTimelineDivider(undefined, '비고')).toBe(false)
  })

  it('resolves fallback label when primary and secondary are empty', () => {
    expect(resolveInstructorResumeTimelineRightLabel(undefined, undefined, '대학교 4년제')).toBe(
      'fallback'
    )
    expect(resolveInstructorResumeTimelineRightLabel('학교명', '전공')).toBe('content')
    expect(resolveInstructorResumeTimelineRightLabel(undefined, undefined)).toBe('empty')
  })
})

describe('instructorCmsProfileToApplicantInstructorRowPartial issuer mapping', () => {
  it('maps license and award issuer to resume view rows', () => {
    const partial = instructorCmsProfileToApplicantInstructorRowPartial({
      memberType: 'GENERAL',
      affiliation: { organizationNames: ['JA'] },
      homeAddress: { line: '' },
      education: { highestSchoolType: 'college4', highestStatus: 'graduated' },
      career: { level: 'experienced', rows: [] },
      jaKoreaActivities: [],
      licenses: [{ title: '1종 운전면허', acquiredYear: '2020', issuer: '경찰청' }],
      awards: [{ title: '우수 강사상', acquiredYear: '2023', issuer: 'JA Korea' }],
      essays: {},
      settlement: { businessIncome: false },
    } as InstructorCmsProfileProposal)

    expect(partial.qualifications?.[0]).toEqual({
      name: '1종 운전면허',
      year: '2020',
      issuer: '경찰청',
    })
    expect(partial.awards?.[0]).toEqual({
      name: '우수 강사상',
      year: '2023',
      issuer: 'JA Korea',
    })
  })
})
