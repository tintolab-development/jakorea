import type { User, SchoolTeacherEmploymentStatus } from '@/types/user'
import type { AdminPermissionTagVariant } from '@/features/user/shared/lib/admin-permission-display'
import type { AdminProvisionedMemberBasicInfoDraft } from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'

export interface UserBasicInfoExternalId1365 {
  maskedLabel: string
  fullLabel?: string
  onOpen?: () => void
}

export interface BasicInfoViewContext {
  mode: 'view' | 'edit'
  role: 'all_users' | 'institution' | 'instructor' | 'admin'
  permissionView: boolean
  permissionRole?: 'instructor' | 'admin'
}

export interface BasicInfoSectionContext {
  user: Omit<User, 'password'>
  scheduleChangeCount?: number
  externalId1365?: UserBasicInfoExternalId1365 | null
  personalInfoRevealed: boolean
  memberInfoEditing?: boolean
  memberInfoDraft?: AdminProvisionedMemberBasicInfoDraft | null
  onMemberInfoDraftChange?: (partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => void
  cmsMayEditBasicProfileFields: boolean
  /** 본인인증 완료 후 강사·교사 — 강사비·JA만 인라인 수정 (레이아웃은 view 유지) */
  feeJaRestrictedEdit?: boolean
  adminPermissionVariantPatching?: boolean
  onPatchAdminPermissionVariantFromDetailView?: (
    nextPermission: AdminPermissionTagVariant
  ) => void | Promise<void>
  adminMemberProfileFieldsEditableWhenEditing?: boolean
  onPermissionResendNotification?: (ctx: {
    userId: string
    permissionRole: 'instructor' | 'admin'
  }) => void
  onOpenJaGradeEvaluation?: () => void
  viewContext: BasicInfoViewContext
  /** 교사(겸직 아님) 재직 현황 태그 — remote 저장 */
  onEmploymentStatusChange?: (status: SchoolTeacherEmploymentStatus) => void | Promise<void>
}
