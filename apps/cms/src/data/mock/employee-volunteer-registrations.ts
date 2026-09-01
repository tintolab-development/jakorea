import type { EmployeeVolunteerInstitutionRegistration } from '@/features/program/general/lib/employee-volunteer-registration'

/** 데모 — 승인 기관 1건에 사전 입력된 임직원 자원봉사자 수 */
export const MOCK_EMPLOYEE_VOLUNTEER_REGISTRATIONS: EmployeeVolunteerInstitutionRegistration[] = [
  {
    institutionId: 'school-3',
    countsBySessionId: {
      pre_education: { newCount: 2, returningCount: 1 },
      round_1: { newCount: 3, returningCount: 0 },
      round_2: { newCount: 1, returningCount: 2 },
    },
  },
]
