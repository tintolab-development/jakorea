import { createContext, useContext, type ReactNode } from 'react'
import type { Application, UserHistory } from '@/types/domain'
import type { ProgramEnrollmentDisplayStatus } from '@/shared/constants/status'
import type { User } from '@/types/user'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { TabState } from '@/features/user/detail/lib/user-detail-fullpage-helpers'
import type { UseUserDetailModalsResult } from '@/features/user/detail/lib/use-user-detail-modals'
import type { UserBasicInfoEntrySource } from '@/features/user/detail/ui/user-basic-info-section'
import type { UserDetailFullpageDerived } from '@/features/user/detail/lib/use-user-detail-fullpage-derived'

export interface UserDetailFullpageShellValue {
  displayUser: Omit<User, 'password'>
  tabState: TabState
  derived: UserDetailFullpageDerived
  applications: Application[]
  applicationsLoading: boolean
  volunteerHistories: UserHistory[]
  volunteerHistoriesLoading: boolean
  personalInfoRevealed: boolean
  instructorResumeApplicantRow: ApplicantInstructorRow | null
  basicInfoEntrySource?: UserBasicInfoEntrySource
  onNavigateToLinkedUser?: (userId: string) => void
  modals: UseUserDetailModalsResult
  withdrawConfirmOpen: boolean
  onProgressStatusChange: (
    app: Application,
    displayStatus: ProgramEnrollmentDisplayStatus
  ) => void | Promise<void>
  onOpenLectureAttendance: (record: Application) => void
  onOpenAssignmentSubmission: (record: Application) => void
  onOpenEnrollmentProgramDetail: (record: Application) => void
  onWithdrawModalCancel: () => void
  onWithdrawModalConfirm: () => void
}

const UserDetailFullpageShellContext = createContext<UserDetailFullpageShellValue | null>(null)

export function UserDetailFullpageShellProvider({
  value,
  children,
}: {
  value: UserDetailFullpageShellValue
  children: ReactNode
}) {
  return (
    <UserDetailFullpageShellContext.Provider value={value}>{children}</UserDetailFullpageShellContext.Provider>
  )
}

export function useUserDetailFullpageShell(): UserDetailFullpageShellValue {
  const ctx = useContext(UserDetailFullpageShellContext)
  if (!ctx) {
    throw new Error('useUserDetailFullpageShell must be used within UserDetailFullpageShellProvider')
  }
  return ctx
}
