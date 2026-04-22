import { Space } from 'antd'
import type { User } from '@/types/user'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { UserDetailStrategySectionConfig } from '@/features/user/detail/strategies'
import {
  UserBasicInfoSection,
  type UserBasicInfoEntrySource,
} from '@/features/user/detail/ui/user-basic-info-section'
import {
  UserConsentAgreementSection,
  resolveUserConsentAgreementPreset,
} from '@/features/user/detail/ui/user-consent-agreement-section'
import { InstructorResumeDetailForms } from '@/features/user/detail/ui/instructor-resume-detail-forms'
import { SchoolAffiliatedTeachersSection } from '@/features/user/detail/ui/school-affiliated-teachers-section'
import { UserDetailAdminCommentSection } from './user-detail-admin-comment-section'
import type { AdminProvisionedMemberBasicInfoDraft } from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'
import type { AdminPermissionTagVariant } from '@/features/user/shared/lib/admin-permission-display'
import {
  canEditAdminMemberInfo,
  shouldShowAdminCommentSectionForViewer,
} from '@/features/user/shared/lib/admin-provisioned-member-policy'
import { useAuthStore } from '@/features/auth/model/auth-store'

export interface UserDetailFullpageBasicTabContentProps {
  user: Omit<User, 'password'>
  basicTab: UserDetailStrategySectionConfig['basicTab']
  basicInfoEntrySource?: UserBasicInfoEntrySource
  personalInfoRevealed: boolean
  instructorResumeApplicantRow: ApplicantInstructorRow | null
  onNavigateToLinkedUser?: (userId: string) => void
  memberInfoEditing?: boolean
  memberInfoDraft?: AdminProvisionedMemberBasicInfoDraft | null
  onMemberInfoDraftChange?: (partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => void
  adminPermissionVariantPatching?: boolean
  onPatchAdminPermissionVariantFromDetailView?: (
    nextPermission: AdminPermissionTagVariant
  ) => void | Promise<void>
}

export function UserDetailFullpageBasicTabContent({
  user,
  basicTab,
  basicInfoEntrySource,
  personalInfoRevealed,
  instructorResumeApplicantRow,
  onNavigateToLinkedUser,
  memberInfoEditing = false,
  memberInfoDraft,
  onMemberInfoDraftChange,
  adminPermissionVariantPatching = false,
  onPatchAdminPermissionVariantFromDetailView,
}: UserDetailFullpageBasicTabContentProps) {
  const currentUser = useAuthStore(state => state.user)
  const adminMemberProfileFieldsEditableWhenEditing =
    user.role !== 'ADMIN' || canEditAdminMemberInfo(currentUser, user)
  const canShowAdminCommentForTarget = shouldShowAdminCommentSectionForViewer(currentUser, user)

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {canShowAdminCommentForTarget ? (
        <UserDetailAdminCommentSection
          user={user}
          memberInfoEditing={memberInfoEditing}
          adminCommentDraft={memberInfoDraft?.adminComment}
          onAdminCommentChange={
            memberInfoEditing && onMemberInfoDraftChange
              ? value => onMemberInfoDraftChange({ adminComment: value })
              : undefined
          }
        />
      ) : null}
      <UserBasicInfoSection
        user={user}
        entrySource={basicInfoEntrySource}
        caption={basicTab.caption}
        externalId1365={basicTab.externalId1365}
        personalInfoRevealed={personalInfoRevealed}
        memberInfoEditing={memberInfoEditing}
        memberInfoDraft={memberInfoDraft}
        onMemberInfoDraftChange={onMemberInfoDraftChange}
        adminPermissionVariantPatching={adminPermissionVariantPatching}
        onPatchAdminPermissionVariantFromDetailView={onPatchAdminPermissionVariantFromDetailView}
        adminMemberProfileFieldsEditableWhenEditing={adminMemberProfileFieldsEditableWhenEditing}
      />
      {basicTab.showConsentAgreement ? (
        <UserConsentAgreementSection preset={resolveUserConsentAgreementPreset(user)} />
      ) : null}
      {instructorResumeApplicantRow ? (
        <InstructorResumeDetailForms instructor={instructorResumeApplicantRow} />
      ) : null}
      {basicTab.showSchoolAffiliatedTeachers ? (
        <SchoolAffiliatedTeachersSection
          rows={user.schoolInfo?.affiliatedTeachers ?? []}
          personalInfoRevealed={personalInfoRevealed}
          onLinkedUserClick={onNavigateToLinkedUser}
        />
      ) : null}
    </Space>
  )
}
