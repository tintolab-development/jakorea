import type { UserDetailRoleStrategy } from './user-detail-role-strategy.types'

export const instructorStrategy: UserDetailRoleStrategy = {
  hasProgramsChildMenu: true,

  getEnrollmentRows: ({ enrollmentApplications }) => enrollmentApplications,

  getSections: () => ({
    basicTab: {
      showConsentAgreement: true,
      showSchoolAffiliatedTeachers: false,
    },
    historyTab: {
      useAdminManagedProgramHistory: false,
    },
    settlement: {
      showInstructorPayment: true,
    },
    withdraw: {
      isSchoolDelete: false,
    },
    programsHistory: {
      enrollmentSectionTitle: '프로그램 수강 이력',
      enrollmentEmptyDescription: '프로그램 수강 이력이 없습니다.',
      enrollmentChildUsesStudentMemberHistory: false,
      showLectureHistoryWhenLectureChild: true,
      useSchoolProgramParticipationSingleView: false,
    },
  }),
}
