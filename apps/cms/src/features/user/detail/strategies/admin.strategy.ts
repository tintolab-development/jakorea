import type { UserDetailRoleStrategy } from './user-detail-role-strategy.types'

export const adminStrategy: UserDetailRoleStrategy = {
  hasProgramsChildMenu: false,

  getEnrollmentRows: ({ applications }) => applications,

  getSections: () => ({
    basicTab: {
      showConsentAgreement: true,
      showSchoolAffiliatedTeachers: false,
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
      enrollmentSectionTitle: '프로그램 담당 이력',
      enrollmentEmptyDescription: '프로그램 신청 이력이 없습니다.',
      enrollmentMode: 'TABLE',
      showLectureHistoryWhenLectureChild: false,
      useSchoolProgramParticipationSingleView: false,
    },
  }),
}
