import { openPortal1365Main } from '@/shared/constants'
import type { UserDetailRoleStrategy } from './user-detail-role-strategy.types'

export const schoolStrategy: UserDetailRoleStrategy = {
  hasProgramsChildMenu: false,

  getEnrollmentRows: ({ applications }) => applications,

  getSections: () => ({
    basicTab: {
      externalId1365: {
        maskedLabel: '0915***',
        fullLabel: '0915123456',
        onOpen: openPortal1365Main,
      },
      showConsentAgreement: false,
      showSchoolAffiliatedTeachers: true,
    },
    historyTab: {
      useAdminManagedProgramHistory: false,
    },
    settlement: {
      showInstructorPayment: false,
    },
    withdraw: {
      isSchoolDelete: true,
    },
    programsHistory: {
      enrollmentSectionTitle: '프로그램 수강 이력',
      enrollmentEmptyDescription: '프로그램 수강 이력이 없습니다.',
      enrollmentMode: 'SCHOOL_PARTICIPATION',
      showLectureHistoryWhenLectureChild: false,
      useSchoolProgramParticipationSingleView: true,
    },
  }),
}
