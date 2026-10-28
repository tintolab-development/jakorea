import type { User } from '@/types/user'
import { roleStrategyMap } from '../strategies'

export interface UserDetailBasicTabFetchSections {
  showConsentAgreement: boolean
  showSchoolAffiliatedTeachers: boolean
  showInstructorPayment: boolean
}

/**
 * 회원 상세 기본정보 탭 서브리소스(consents·consent-records·소속교사) 조회 여부.
 * 권한 승인 상세(permission)는 기본적으로 모두 생략하되, 강사 신청 상세는 약관·동의 현재 상태만 조회한다.
 * (UI는 strategy 기준으로 약관·동의 섹션을 그리므로 조회가 꺼져 있으면 전부 미동의로 보인다.)
 */
export function resolveUserDetailBasicTabFetchSections(params: {
  displayUser: Omit<User, 'password'> | null
  mode: 'default' | 'permission'
}): UserDetailBasicTabFetchSections {
  const { displayUser, mode } = params
  if (!displayUser) {
    return {
      showConsentAgreement: false,
      showSchoolAffiliatedTeachers: false,
      showInstructorPayment: false,
    }
  }
  if (mode === 'permission') {
    return {
      showConsentAgreement: displayUser.role === 'INSTRUCTOR',
      showSchoolAffiliatedTeachers: false,
      showInstructorPayment: false,
    }
  }
  const sections = roleStrategyMap[displayUser.role].getSections({
    displayUser,
    applications: [],
    enrollmentApplications: [],
  })
  return {
    showConsentAgreement: sections.basicTab.showConsentAgreement,
    showSchoolAffiliatedTeachers: sections.basicTab.showSchoolAffiliatedTeachers,
    showInstructorPayment: sections.settlement.showInstructorPayment,
  }
}
