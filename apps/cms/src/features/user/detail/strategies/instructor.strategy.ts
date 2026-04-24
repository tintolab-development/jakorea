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
        /** 일반 교사·교사 겸 강사·강사 공통: 학교 상세와 동일 필터·표(교육분야·학년·담당자·이력 삭제) */
        enrollmentMode: 'SCHOOL_PARTICIPATION',
        showLectureHistoryWhenLectureChild: true,
        useSchoolProgramParticipationSingleView: false,
      },
    }
  },
}
