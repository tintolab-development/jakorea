import type { UserDetailRoleStrategy } from './user-detail-role-strategy.types'

export const adminStrategy: UserDetailRoleStrategy = {
  hasProgramsChildMenu: false,

  getEnrollmentRows: ({ applications }) => applications,

  getSections: () => ({
    basicTab: {
      showConsentAgreement: true,
      showSchoolAffiliatedTeachers: false,
      caption: '*관리자에 의해 등록된 회원입니다.',
    },
    historyTab: {
      useAdminManagedProgramHistory: true,
    },
    settlement: {
      showInstructorPayment: false,
    },
    withdraw: {
      isSchoolDelete: false,
    },
    programsHistory: {
      enrollmentSectionTitle: '담당 프로그램 이력',
      enrollmentEmptyDescription: '프로그램 신청 이력이 없습니다.',
      enrollmentChildUsesStudentMemberHistory: false,
      enrollmentChildUsesSchoolProgramParticipationView: false,
      showLectureHistoryWhenLectureChild: false,
      useSchoolProgramParticipationSingleView: false,
    },
  }),
}
