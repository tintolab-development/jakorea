import { describe, expect, it } from 'vitest'
import {
  mapSchoolOrganizationProgramEnrollmentHistoryItem,
  toSchoolOrganizationEnrollmentRowId,
} from '@/features/user/api/map-school-organization-program-enrollment-history'

describe('mapSchoolOrganizationProgramEnrollmentHistoryItem', () => {
  it('maps API item to Application with org-enroll row id and customFields', () => {
    const app = mapSchoolOrganizationProgramEnrollmentHistoryItem(
      {
        historyRowId: 1001,
        organizationApplicationId: 880,
        programId: 42,
        programName: '2025 JA 경제교육',
        progressYear: 2025,
        enrollmentDisplayStatus: 'EDUCATION_IN_PROGRESS',
        businessArea: '경제·금융',
        educationGrade: '3학년',
        managerName: '홍길동 매니저',
        deletable: true,
        submittedAt: '2025-03-01T09:00:00+09:00',
      },
      'organization-12'
    )

    expect(app.id).toBe(toSchoolOrganizationEnrollmentRowId(1001))
    expect(app.programId).toBe('42')
    expect(app.subjectType).toBe('school')
    expect(app.subjectId).toBe('organization-12')
    expect(app.managerName).toBe('홍길동 매니저')
    expect(app.customFields).toMatchObject({
      programName: '2025 JA 경제교육',
      progressYear: 2025,
      enrollmentDisplayStatus: 'EDUCATION_IN_PROGRESS',
      businessArea: '경제·금융',
      educationGrade: '3학년',
      organizationApplicationId: 880,
      historyRowId: 1001,
      deletable: true,
    })
  })
})
