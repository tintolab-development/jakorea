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
}: UserDetailFullpageBasicTabContentProps) {
  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
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
      <UserBasicInfoSection
        user={user}
        entrySource={basicInfoEntrySource}
        caption={basicTab.caption}
        externalId1365={basicTab.externalId1365}
        personalInfoRevealed={personalInfoRevealed}
        memberInfoEditing={memberInfoEditing}
        memberInfoDraft={memberInfoDraft}
        onMemberInfoDraftChange={onMemberInfoDraftChange}
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
          onLinkedUserClick={onNavigateToLinkedUser}
        />
      ) : null}
    </Space>
  )
}
