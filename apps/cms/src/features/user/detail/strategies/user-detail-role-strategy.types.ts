import type { Application } from '@/types/domain'
import type { User } from '@/types/user'
import type { EnrollmentMode } from '../ui/user-programs-section'

export interface UserDetailStrategyCtx {
  displayUser: Omit<User, 'password'>
  applications: Application[]
  enrollmentApplications: Application[]
}

export interface UserDetailStrategyExternalId1365 {
  maskedLabel: string
  fullLabel: string
  onOpen: () => void
}

export interface UserDetailStrategySectionConfig {
  basicTab: {
    externalId1365?: UserDetailStrategyExternalId1365
    caption?: string
    showConsentAgreement: boolean
    showSchoolAffiliatedTeachers: boolean
  }
  historyTab: {
    useAdminManagedProgramHistory: boolean
  }
  settlement: {
    showInstructorPayment: boolean
  }
  withdraw: {
    isSchoolDelete: boolean
  }
  programsHistory: {
    enrollmentSectionTitle: string
    enrollmentEmptyDescription: string
    enrollmentMode: EnrollmentMode
    showLectureHistoryWhenLectureChild: boolean
    useSchoolProgramParticipationSingleView: boolean
  }
}

export interface UserDetailRoleStrategy {
  getEnrollmentRows(ctx: UserDetailStrategyCtx): Application[]
  getSections(ctx: UserDetailStrategyCtx): UserDetailStrategySectionConfig
  hasProgramsChildMenu: boolean
}
