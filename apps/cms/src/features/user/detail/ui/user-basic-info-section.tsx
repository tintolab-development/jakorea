/**
 * 회원 상세 — 기본 정보 (역할 기반 조립 전용)
 */

import type { ReactNode } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { User, SchoolTeacherEmploymentStatus } from '@/types/user'
import type { AdminPermissionTagVariant } from '@/features/user/shared/lib/admin-permission-display'
import type { AdminProvisionedMemberBasicInfoDraft } from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'
import { resolveInstructorMemberProfile } from '@/entities/user/lib/resolve-instructor-member-profile'
import { shouldShowCmsBasicProfileFieldsEdit } from '@/features/user/shared/lib/admin-provisioned-member-policy'
import { resolveBasicInfoLayout, type BasicInfoBodyKey } from './user-basic-info-layout-resolver'
import { BasicInfoLayoutRenderer } from './user-basic-info-layout-renderer'
import { AdminBasicInfoSection } from './user-basic-info/admin-basic-info-section'
import type { BasicInfoSectionRenderContext } from './user-basic-info-section-renderer'
import {
  parseUserBasicInfoEntryQuery,
  resolveUserBasicInfoBodyKey,
  USER_BASIC_INFO_ENTRY_QUERY_KEY,
  type UserBasicInfoEntrySource,
} from './user-basic-info/entry-resolver'
import type { UserBasicInfoExternalId1365 } from './user-basic-info/sections/types'
import { GuardianSection } from './user-basic-info/sections/guardian-section'
import './user-basic-info-section.css'

export {
  parseUserBasicInfoEntryQuery,
  resolveUserBasicInfoBodyKey,
  USER_BASIC_INFO_ENTRY_QUERY_KEY,
  type UserBasicInfoEntrySource,
}
export type { UserBasicInfoExternalId1365 }

export interface UserBasicInfoSectionProps {
  user: Omit<User, 'password'>
  entrySource?: UserBasicInfoEntrySource
  isInstructorPermissionDetail?: boolean
  isAdminPermissionDetail?: boolean
  onPermissionResendNotification?: (ctx: {
    userId: string
    permissionRole: 'instructor' | 'admin'
  }) => void
  onOpenJaGradeEvaluation?: () => void
  scheduleChangeCount?: number
  caption?: ReactNode
  externalId1365?: UserBasicInfoExternalId1365 | null
  personalInfoRevealed?: boolean
  memberInfoEditing?: boolean
  /** profile 전체 수정 | instructor_fee_ja 강사비 등급만 (조회 레이아웃 유지) */
  memberInfoEditScope?: 'profile' | 'instructor_fee_ja'
  memberInfoDraft?: AdminProvisionedMemberBasicInfoDraft | null
  /** 관리자 상세 이메일 입력란 서버 에러 문구 */
  memberInfoEmailError?: string | null
  onMemberInfoDraftChange?: (partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => void
  adminPermissionVariantPatching?: boolean
  onPatchAdminPermissionVariantFromDetailView?: (
    nextPermission: AdminPermissionTagVariant
  ) => void | Promise<void>
  adminMemberProfileFieldsEditableWhenEditing?: boolean
  onEmploymentStatusChange?: (status: SchoolTeacherEmploymentStatus) => void | Promise<void>
}

export function UserBasicInfoSection({
  user,
  entrySource: entrySourceProp,
  isInstructorPermissionDetail = false,
  isAdminPermissionDetail = false,
  onPermissionResendNotification,
  onOpenJaGradeEvaluation,
  caption,
  scheduleChangeCount,
  externalId1365,
  personalInfoRevealed = false,
  memberInfoEditing = false,
  memberInfoEditScope = 'profile',
  memberInfoDraft,
  memberInfoEmailError = null,
  onMemberInfoDraftChange,
  adminPermissionVariantPatching = false,
  onPatchAdminPermissionVariantFromDetailView,
  adminMemberProfileFieldsEditableWhenEditing = true,
  onEmploymentStatusChange,
}: UserBasicInfoSectionProps) {
  const [searchParams] = useSearchParams()
  const entryFromQuery = parseUserBasicInfoEntryQuery(
    searchParams.get(USER_BASIC_INFO_ENTRY_QUERY_KEY)
  )
  const bodyKey = resolveUserBasicInfoBodyKey(entrySourceProp, entryFromQuery, user.role)
  const instructorProfile = resolveInstructorMemberProfile(user)
  const resolvedLayout = resolveBasicInfoLayout({
    bodyKey: bodyKey as BasicInfoBodyKey,
    instructorProfile,
    permissionInstructor: isInstructorPermissionDetail,
  })
  const cmsMayEditBasicProfileFields = shouldShowCmsBasicProfileFieldsEdit(user)
  const feeJaRestrictedEdit =
    memberInfoEditing && memberInfoEditScope === 'instructor_fee_ja'
  const detailInfoFormMode: 'view' | 'edit' = memberInfoEditing ? 'edit' : 'view'

  const permissionRole =
    isInstructorPermissionDetail || isAdminPermissionDetail
      ? isInstructorPermissionDetail
        ? 'instructor'
        : 'admin'
      : undefined

  const sectionContext: BasicInfoSectionRenderContext = {
    user,
    scheduleChangeCount,
    externalId1365,
    personalInfoRevealed,
    onPermissionResendNotification,
    onOpenJaGradeEvaluation,
    memberInfoEditing,
    memberInfoDraft,
    onMemberInfoDraftChange,
    cmsMayEditBasicProfileFields,
    feeJaRestrictedEdit,
    adminPermissionVariantPatching,
    onPatchAdminPermissionVariantFromDetailView,
    adminMemberProfileFieldsEditableWhenEditing,
    onEmploymentStatusChange,
    viewContext: {
      mode: detailInfoFormMode,
      role: bodyKey,
      permissionView: Boolean(permissionRole),
      permissionRole,
    },
  }

  return (
    <div className="user-detail-modal__basic-inner">
      {/* 시안 4427:23703: 기본 정보 표 ↔ 보호자 정보 섹션 32px (다른 섹션 간격과 같음) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', width: '100%' }}>
        {bodyKey === 'admin' ? (
          <AdminBasicInfoSection
            user={user}
            mode={detailInfoFormMode}
            caption={caption}
            personalInfoRevealed={personalInfoRevealed}
            isAdminPermissionDetail={isAdminPermissionDetail}
            memberInfoDraft={memberInfoDraft}
            emailError={memberInfoEmailError}
            onMemberInfoDraftChange={onMemberInfoDraftChange}
            adminMemberProfileFieldsEditableWhenEditing={adminMemberProfileFieldsEditableWhenEditing}
            adminPermissionVariantPatching={adminPermissionVariantPatching}
            onPatchAdminPermissionVariantFromDetailView={onPatchAdminPermissionVariantFromDetailView}
            onPermissionResendNotification={onPermissionResendNotification}
          />
        ) : (
          <BasicInfoLayoutRenderer
            resolution={resolvedLayout}
            caption={caption}
            mode={detailInfoFormMode}
            shared={sectionContext}
          />
        )}
        <GuardianSection user={user} personalInfoRevealed={personalInfoRevealed} />
      </div>
    </div>
  )
}
