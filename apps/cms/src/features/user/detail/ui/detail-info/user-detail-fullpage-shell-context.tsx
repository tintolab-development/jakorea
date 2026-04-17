import { createContext, useContext, type ReactNode } from 'react'
import type { Application, UserHistory } from '@/types/domain'
import type { ProgramEnrollmentDisplayStatus } from '@/shared/constants/status'
import type { User } from '@/types/user'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { TabState } from '@/features/user/detail/lib/user-detail-fullpage-helpers'
import type { UseUserDetailModalsResult } from '@/features/user/detail/lib/use-user-detail-modals'
import type { UserBasicInfoEntrySource } from '@/features/user/detail/ui/user-basic-info-section'
import type { AdminProvisionedMemberBasicInfoDraft } from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'
import type { UserDetailFullpageDerived } from '@/features/user/detail/lib/use-user-detail-fullpage-derived'
import type { InstructorPermissionRevokeNotifyTiming } from '@/features/user/detail/lib/use-user-detail-controller'
import type { AdminPermissionTagVariant } from '@/features/user/shared/lib/admin-permission-display'

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
  personalInfoRevealConfirmOpen: boolean
  onClosePersonalInfoRevealConfirm: () => void
  onSubmitPersonalInfoReveal: (reason: string) => void
  onProgressStatusChange: (
    app: Application,
    displayStatus: ProgramEnrollmentDisplayStatus
  ) => void | Promise<void>
  onOpenLectureAttendance: (record: Application) => void
  onOpenAssignmentSubmission: (record: Application) => void
  onOpenEnrollmentProgramDetail: (record: Application) => void
  onWithdrawModalCancel: () => void
  onWithdrawModalConfirm: () => void
  basicInfoEditing: boolean
  basicInfoDraft: AdminProvisionedMemberBasicInfoDraft | null
  basicInfoSaveLoading: boolean
  /** 관리자 상세 — 뷰 모드에서 권한 유형만 즉시 저장 중 */
  adminPermissionVariantPatching: boolean
  instructorPermissionRevokeOpen: boolean
  onStartBasicInfoEdit: () => void
  onCancelBasicInfoEdit: () => void
  onSaveBasicInfoEdit: () => void | Promise<void>
  onBasicInfoDraftChange: (partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => void
  /** 마스터 관리자 + ADMIN 대상일 때만 정의 — 뷰 모드 권한 유형 즉시 저장 */
  onPatchAdminPermissionVariantFromDetailView?: (
    nextPermission: AdminPermissionTagVariant
  ) => void | Promise<void>
  onOpenInstructorPermissionRevoke: () => void
  onCloseInstructorPermissionRevoke: () => void
  onConfirmInstructorPermissionRevoke: (payload: {
    reason: string
    notifyTiming: InstructorPermissionRevokeNotifyTiming
  }) => void
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
