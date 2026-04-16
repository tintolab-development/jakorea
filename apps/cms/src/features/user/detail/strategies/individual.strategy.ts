import { openPortal1365Main } from '@/shared/constants'
import type { UserDetailRoleStrategy } from './user-detail-role-strategy.types'

export const individualStrategy: UserDetailRoleStrategy = {
  hasProgramsChildMenu: true,

  getEnrollmentRows: ({ applications }) => applications,

  getSections: () => ({
    basicTab: {
      externalId1365: {
        maskedLabel: '0915***',
        fullLabel: '0915123456',
        onOpen: openPortal1365Main,
      },
      showConsentAgreement: true,
      showSchoolAffiliatedTeachers: false,
    },
    historyTab: {
      useAdminManagedProgramHistory: false,
    },
    settlement: {
      showInstructorPayment: false,
    },
    withdraw: {
      isSchoolDelete: false,
    },
    programsHistory: {
      enrollmentSectionTitle: '프로그램 수강 이력',
      enrollmentEmptyDescription: '프로그램 신청 이력이 없습니다.',
      enrollmentChildUsesStudentMemberHistory: true,
      enrollmentChildUsesSchoolProgramParticipationView: false,
      showLectureHistoryWhenLectureChild: false,
      useSchoolProgramParticipationSingleView: false,
    },
  }),
}
