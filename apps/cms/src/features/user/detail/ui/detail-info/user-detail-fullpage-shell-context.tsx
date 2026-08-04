import { createContext, useContext, type ReactNode } from 'react'
import type { Application, UserHistory } from '@/types/domain'
import type { ProgramEnrollmentDisplayStatus } from '@/shared/constants/status'
import type { AffiliatedTeacherLinkTarget, User } from '@/types/user'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { TabState } from '@/features/user/detail/lib/user-detail-fullpage-helpers'
import type { UseUserDetailModalsResult } from '@/features/user/detail/lib/use-user-detail-modals'
import type { UserBasicInfoEntrySource } from '@/features/user/detail/ui/user-basic-info-section'
import type { AdminProvisionedMemberBasicInfoDraft } from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'
import type { BasicInfoEditScope } from '@/features/user/detail/lib/use-user-detail-controller'
import type { UserDetailFullpageDerived } from '@/features/user/detail/lib/use-user-detail-fullpage-derived'
import type { InstructorPermissionRevokeNotifyTiming } from '@/features/user/detail/lib/use-user-detail-controller'
import type { AdminPermissionTagVariant } from '@/features/user/shared/lib/admin-permission-display'
export interface UserDetailFullpageShellValue {
  mode: 'default' | 'permission'
  permissionRole?: 'instructor' | 'admin'
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
  onNavigateToLinkedUser?: (target: AffiliatedTeacherLinkTarget) => void
  modals: UseUserDetailModalsResult
  withdrawConfirmOpen: boolean
  /** 학교(기관) 상세 — 소속 교사가 있을 때 삭제 시도 시 목록과 동일한 불가 안내 */
  institutionDeleteBlockedOpen: boolean
  onCloseInstitutionDeleteBlocked: () => void
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
  basicInfoEditScope: BasicInfoEditScope
  basicInfoDraft: AdminProvisionedMemberBasicInfoDraft | null
  basicInfoSaveLoading: boolean
  /** 관리자 상세 — 뷰 모드에서 권한 유형만 즉시 저장 중 */
  adminPermissionVariantPatching: boolean
  instructorPermissionRevokeOpen: boolean
  jaGradeEvaluationOpen: boolean
  onOpenJaGradeEvaluation: () => void
  onCloseJaGradeEvaluation: () => void
  onCompleteJaGradeEvaluation: (payload: {
    grade: string
    totalScore: number
  }) => void | Promise<void>
  scheduleChangeCount?: number
  onStartBasicInfoEdit: () => void
  onStartAdminCommentEdit: () => void
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
  }) => void | Promise<void>
  onPermissionResendNotification?: (ctx: {
    userId: string
    permissionRole: 'instructor' | 'admin'
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
