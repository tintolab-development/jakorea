import { message } from 'antd'
import type { UserDetailRoleStrategy } from './user-detail-role-strategy.types'

export const individualStrategy: UserDetailRoleStrategy = {
  hasProgramsChildMenu: true,

  getEnrollmentRows: ({ applications }) => applications,

  getSections: () => ({
    basicTab: {
      externalId1365: {
        maskedLabel: '0915***',
        fullLabel: '0915123456',
        onOpen: () => message.info('1365 바로가기는 추후 연결됩니다.'),
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
      showLectureHistoryWhenLectureChild: false,
      useSchoolProgramParticipationSingleView: false,
    },
  }),
}
