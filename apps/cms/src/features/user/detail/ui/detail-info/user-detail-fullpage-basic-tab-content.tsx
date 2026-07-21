import { useCallback, useMemo } from 'react'
import { Space } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import type { User, SchoolTeacherEmploymentStatus } from '@/types/user'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { UserDetailStrategySectionConfig } from '@/features/user/detail/strategies'
import {
  UserBasicInfoSection,
  type UserBasicInfoEntrySource,
} from '@/features/user/detail/ui/user-basic-info-section'
import {
  UserConsentAgreementSection,
  resolveUserConsentAgreementPreset,
  CONSENT_PRESET_SCHEMA,
  CONSENT_ROWS_PERMISSION_INSTRUCTOR,
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
import { useMemberConsentRecordsQuery } from '@/features/user/api/hooks/use-member-detail-query'
import {
  useAffiliatedTeachersQuery,
  useMemberCommentsQuery,
} from '@/features/user/api/hooks/use-member-detail-subresource-queries'
import { applyConsentRecordsToSchema } from '@/features/user/api/map-member-consent-records'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import { updateAffiliatedTeacherEmploymentStatusRemote } from '@/features/user/api/members-api-client'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { MemberDetailMockDataBanner } from '@/features/user/detail/ui/member-detail-mock-data-banner'
import { handleError } from '@/shared/utils/error-handler'

export interface UserDetailFullpageBasicTabContentProps {
  mode: 'default' | 'permission'
  permissionRole?: 'instructor' | 'admin'
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
  onPermissionResendNotification?: (ctx: {
    userId: string
    permissionRole: 'instructor' | 'admin'
  }) => void
}

export function UserDetailFullpageBasicTabContent({
  mode,
  permissionRole,
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
  onPermissionResendNotification,
}: UserDetailFullpageBasicTabContentProps) {
  const currentUser = useAuthStore(state => state.user)
  const queryClient = useQueryClient()
  const membersRemote = isMembersRemoteEnabled()
  const adminMemberProfileFieldsEditableWhenEditing =
    user.role !== 'ADMIN' || canEditAdminMemberInfo(currentUser, user)
  const canShowAdminCommentForTarget = shouldShowAdminCommentSectionForViewer(currentUser, user)

  const consentPreset = resolveUserConsentAgreementPreset(user)
  const consentViewVariant =
    mode === 'permission' && permissionRole === 'instructor' ? 'permission_instructor' : 'default'

  const { data: consentRecords = [], isLoading: consentLoading } = useMemberConsentRecordsQuery(
    user.memberId,
    membersRemote && basicTab.showConsentAgreement
  )

  const {
    data: commentsData,
    isError: commentsError,
    isLoading: commentsLoading,
  } = useMemberCommentsQuery(user.memberId, membersRemote && canShowAdminCommentForTarget)

  const { data: affiliatedTeachers = [], isError: teachersError } = useAffiliatedTeachersQuery(
    user.memberId,
    membersRemote && basicTab.showSchoolAffiliatedTeachers
  )

  const userForAdminComment = useMemo(() => {
    if (!commentsData?.latestComment) return user
    return { ...user, adminComment: commentsData.latestComment }
  }, [user, commentsData?.latestComment])

  const affiliatedTeacherRows = membersRemote
    ? affiliatedTeachers
    : (user.schoolInfo?.affiliatedTeachers ?? [])

  const handleEmploymentStatusChange = useCallback(
    async (teacherId: string, status: SchoolTeacherEmploymentStatus) => {
      if (!membersRemote || user.memberId == null) return
      const row = affiliatedTeacherRows.find(r => r.id === teacherId)
      const teacherMemberId = row?.teacherMemberId
      if (teacherMemberId == null) {
        handleError(new Error('교사 memberId가 없어 재직 현황을 저장할 수 없습니다.'), {
          context: 'userDetailBasicTab.employmentStatus.missingTeacherMemberId',
        })
        return
      }
      try {
        await updateAffiliatedTeacherEmploymentStatusRemote(
          user.memberId,
          teacherMemberId,
          status
        )
        await queryClient.invalidateQueries({
          queryKey: memberQueryKeys.affiliatedTeachers(user.memberId),
        })
      } catch (error) {
        handleError(error, {
          defaultMessage: getMemberApiErrorMessage(error, '재직 현황 변경에 실패했습니다.'),
        })
      }
    },
    [membersRemote, user.memberId, affiliatedTeacherRows, queryClient]
  )

  const remoteConsentRows = useMemo(() => {
    if (!membersRemote || !basicTab.showConsentAgreement) return undefined
    const baseSchema =
      consentViewVariant === 'permission_instructor'
        ? CONSENT_ROWS_PERMISSION_INSTRUCTOR
        : CONSENT_PRESET_SCHEMA[consentPreset]
    return applyConsentRecordsToSchema(baseSchema, consentRecords)
  }, [
    membersRemote,
    basicTab.showConsentAgreement,
    consentViewVariant,
    consentPreset,
    consentRecords,
  ])

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {canShowAdminCommentForTarget ? (
        <>
          {membersRemote && (commentsError || commentsLoading) ? (
            <MemberDetailMockDataBanner message="관리자 코멘트 API 조회에 실패했습니다. mock 데이터가 표시될 수 있습니다." />
          ) : null}
          <UserDetailAdminCommentSection
            user={userForAdminComment}
          />
        </>
      ) : null}
      <UserBasicInfoSection
        user={user}
        entrySource={basicInfoEntrySource}
        isInstructorPermissionDetail={mode === 'permission' && permissionRole === 'instructor'}
        isAdminPermissionDetail={mode === 'permission' && permissionRole === 'admin'}
        caption={basicTab.caption}
        externalId1365={basicTab.externalId1365}
        personalInfoRevealed={personalInfoRevealed}
        memberInfoEditing={memberInfoEditing}
        memberInfoDraft={memberInfoDraft}
        onMemberInfoDraftChange={onMemberInfoDraftChange}
        adminPermissionVariantPatching={adminPermissionVariantPatching}
        onPatchAdminPermissionVariantFromDetailView={onPatchAdminPermissionVariantFromDetailView}
        adminMemberProfileFieldsEditableWhenEditing={adminMemberProfileFieldsEditableWhenEditing}
        onPermissionResendNotification={onPermissionResendNotification}
      />
      {basicTab.showConsentAgreement ? (
        <UserConsentAgreementSection
          preset={consentPreset}
          viewVariant={consentViewVariant}
          remoteConsentRows={remoteConsentRows}
          remoteConsentLoading={membersRemote && consentLoading}
        />
      ) : null}
      {instructorResumeApplicantRow ? (
        <>
          {membersRemote ? (
            <MemberDetailMockDataBanner message="강사 이력서 중 계좌·학력 상세·자격증·수상 내역은 API 미제공 필드로 mock 또는 빈 값이 표시될 수 있습니다." />
          ) : null}
          <InstructorResumeDetailForms instructor={instructorResumeApplicantRow} />
        </>
      ) : null}
      {basicTab.showSchoolAffiliatedTeachers ? (
        <>
          {membersRemote && teachersError ? (
            <MemberDetailMockDataBanner message="소속 교사 목록 API 조회에 실패했습니다. mock 데이터가 표시될 수 있습니다." />
          ) : null}
          <SchoolAffiliatedTeachersSection
            rows={affiliatedTeacherRows}
            personalInfoRevealed={personalInfoRevealed}
            onLinkedUserClick={onNavigateToLinkedUser}
            onEmploymentStatusChange={
              membersRemote ? handleEmploymentStatusChange : undefined
            }
          />
        </>
      ) : null}
    </Space>
  )
}
