import { describe, expect, it } from 'vitest'
import {
  affiliationDisplayFromInstructorCmsProfile,
  supplementApplicantInstructorBasicInfoFromMember,
} from './instructor-application-basic-info-supplement'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'

describe('instructor-application-basic-info-supplement', () => {
  it('formats affiliation from cms profile school and organization names', () => {
    expect(
      affiliationDisplayFromInstructorCmsProfile({
        affiliation: {
          schoolName: '테스트초',
          organizationNames: ['기관 A', '기관 B'],
        },
      })
    ).toBe('테스트초, 기관 A, 기관 B')
  })

  it('merges member settlement without overwriting application snapshot', () => {
    const row: ApplicantInstructorRow = {
      id: '1',
      no: 1,
      instructorName: '이강사',
      schoolName: '',
      lectureExperienceYears: 0,
      educationLevel: '',
      educationSchoolName: '',
      contact: '',
      email: '',
      address: '',
      affiliation: '신청 시 소속',
      approvalStatus: 'pending',
    }
    const merged = supplementApplicantInstructorBasicInfoFromMember(row, {
      id: 'm1',
      name: '이강사',
      role: 'INSTRUCTOR',
      instructorInfo: {
        bankName: '농협',
        accountNumber: '111',
        accountHolder: '이강사',
        isBusinessIncome: true,
      },
    } as never)
    expect(merged.affiliation).toBe('신청 시 소속')
    expect(merged.bankName).toBe('농협')
    expect(merged.businessIncomeEarnerStatus).toBe('해당')
  })
})
