import { describe, expect, it } from 'vitest'
import { fetchSchoolOrganizationProgramEnrollmentHistoryMock } from '@/features/user/api/fetch-school-organization-program-enrollment-history-mock'
import { MOCK_SCHOOL_SEOUL_USER_ID } from '@/data/mock/users'
import { parseSchoolOrganizationEnrollmentRowId } from '@/features/user/api/map-school-organization-program-enrollment-history'

describe('fetchSchoolOrganizationProgramEnrollmentHistoryMock', () => {
  it('returns school applications mapped to org-enroll row ids with table customFields', async () => {
    const rows = await fetchSchoolOrganizationProgramEnrollmentHistoryMock(MOCK_SCHOOL_SEOUL_USER_ID)

    expect(rows.length).toBeGreaterThan(0)
    for (const row of rows) {
      expect(row.subjectType).toBe('school')
      expect(row.subjectId).toBe(MOCK_SCHOOL_SEOUL_USER_ID)
      expect(parseSchoolOrganizationEnrollmentRowId(row.id)).not.toBeNull()
      expect(row.customFields?.programName).toBeTruthy()
      expect(typeof row.customFields?.progressYear).toBe('number')
      expect(row.customFields?.enrollmentDisplayStatus).toBeTruthy()
      expect(row.customFields?.businessArea).toBeTruthy()
      expect(row.customFields?.educationGrade).toBeTruthy()
      expect(row.managerName).toBeTruthy()
    }
  })
})
