import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'
import type { UserDetailRoleStrategy } from './user-detail-role-strategy.types'

export const instructorStrategy: UserDetailRoleStrategy = {
  hasProgramsChildMenu: true,

  getEnrollmentRows: ({ enrollmentApplications }) => enrollmentApplications,

  getSections: ({ displayUser }) => {
    const instructorProfile = resolveInstructorMemberProfile(displayUser)
    const showInstructorPayment =
      instructorProfile === 'instructor_only' || instructorProfile === 'instructor_dual'

    return {
      basicTab: {
        showConsentAgreement: true,
        showSchoolAffiliatedTeachers: false,
      },
      historyTab: {
        useAdminManagedProgramHistory: false,
      },
      settlement: {
        showInstructorPayment,
      },
      withdraw: {
        isSchoolDelete: false,
      },
      programsHistory: {
        enrollmentSectionTitle: '프로그램 수강 이력',
        enrollmentEmptyDescription: '프로그램 수강 이력이 없습니다.',
        /** 일반 회원 상세와 동일 — 출석·과제·담당자·필터·이력 삭제·수료증 */
        enrollmentMode: 'STUDENT_HISTORY',
        showLectureHistoryWhenLectureChild: true,
        useSchoolProgramParticipationSingleView: false,
      },
    }
  },
}
