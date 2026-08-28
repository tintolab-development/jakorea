import { useCallback, useMemo } from 'react'
import { Space } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import type { User, AffiliatedTeacherLinkTarget, SchoolTeacherEmploymentStatus } from '@/types/user'
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
import {
  InstructorDetailEditForm,
  resolveInstructorRegisterLikeEdit,
} from '@/features/user/detail/ui/instructor-detail-edit/instructor-detail-edit-form'
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
import { parseOrganizationIdFromUserId } from '@/features/user/api/map-school-organization-to-user'
import { resolveAdminCommentResource } from '@/features/user/api/resolve-admin-comment-resource'
import { applyMemberConsentToSchema } from '@/features/user/api/map-member-consent-records'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import { shouldFetchMemberConsentRecords } from '@/features/user/detail/lib/fetch-member-detail-basic-tab-resources'
import { upsertEditableTermsAgreementInDraft } from '@/features/user/api/member-basic-info-terms-patch'
import { resolveMemberConsentTemplateByLabel } from '@/features/user/shared/lib/member-consent-template-map'
import {
  clearConsentWriteSnapshot,
  upsertConsentAgreementWriteSnapshot,
  upsertConsentCrimeWriteSnapshot,
  type MemberConsentAgreementDraftSnapshot,
  type MemberConsentCrimeDraftSnapshot,
} from '@/features/user/shared/lib/member-register-consent-write-snapshot'
import {
  updateAffiliatedTeacherEmploymentStatusRemote,
  updateTeacherEmploymentStatusRemote,
} from '@/features/user/api/members-api-client'
import { shouldShowCmsMemberInfoEditButton } from '@/features/user/shared/lib/admin-provisioned-member-policy'
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
  onNavigateToLinkedUser?: (target: AffiliatedTeacherLinkTarget) => void
  memberInfoEditing?: boolean
  /** profile = 전체 기본정보, instructor_fee_ja = 강사비·JA 등급만 */
  memberInfoEditScope?: 'profile' | 'instructor_fee_ja'
  memberInfoDraft?: AdminProvisionedMemberBasicInfoDraft | null
  onMemberInfoDraftChange?: (partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => void
  adminPermissionVariantPatching?: boolean
  onPatchAdminPermissionVariantFromDetailView?: (
    nextPermission: AdminPermissionTagVariant
  ) => void | Promise<void>
  onEmploymentStatusChange?: (status: SchoolTeacherEmploymentStatus) => void | Promise<void>
  onPermissionResendNotification?: (ctx: {
    userId: string
    permissionRole: 'instructor' | 'admin'
  }) => void
  onOpenJaGradeEvaluation?: () => void
  scheduleChangeCount?: number
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
  memberInfoEditScope = 'profile',
  memberInfoDraft,
  onMemberInfoDraftChange,
  adminPermissionVariantPatching = false,
  onPatchAdminPermissionVariantFromDetailView,
  onEmploymentStatusChange,
  onPermissionResendNotification,
  onOpenJaGradeEvaluation,
  scheduleChangeCount,
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

  /** 권한 승인 상세는 동의·소속교사 등은 신청 스냅샷 우선 — 관리자 코멘트는 resource id로 회원 상세와 동일 조회 */
  const loadMemberSubresources = mode !== 'permission'
  const adminCommentResource = resolveAdminCommentResource(user)
  const loadMemberAdminComments =
    membersRemote && canShowAdminCommentForTarget && adminCommentResource != null

  /** 작성본 메타는 consent-records에만 있음 — 관리자 계정은 상세 termsAgreements만 사용 */
  const shouldLoadConsentRecords = shouldFetchMemberConsentRecords({
    role: user.role,
    memberId: user.memberId,
    showConsentAgreement: loadMemberSubresources && basicTab.showConsentAgreement,
  })

  const consentQuery = useMemberConsentRecordsQuery(
    user.memberId,
    membersRemote && shouldLoadConsentRecords,
    { manualFetch: membersRemote }
  )
  const consentRecords = consentQuery.data ?? []
  /** 비활성 쿼리(manualFetch·memberId 없음)의 isPending을 로딩으로 보면 스피너가 멈추지 않음 */
  const consentLoading = Boolean(
    membersRemote && shouldLoadConsentRecords && !consentQuery.isFetched
  )

  const {
    data: commentsData,
    isError: commentsError,
  } = useMemberCommentsQuery(
    adminCommentResource?.resourceId,
    loadMemberAdminComments,
    undefined,
    adminCommentResource?.target,
    { manualFetch: membersRemote }
  )

  const schoolOrganizationId =
    user.organizationId ?? parseOrganizationIdFromUserId(user.id) ?? undefined

  const affiliatedTeachersQuery = useAffiliatedTeachersQuery(
    user.memberId,
    membersRemote && loadMemberSubresources && basicTab.showSchoolAffiliatedTeachers,
    schoolOrganizationId,
    { manualFetch: membersRemote }
  )
  const affiliatedTeachers = affiliatedTeachersQuery.data ?? []
  const teachersError = affiliatedTeachersQuery.isError

  const userForAdminComment = useMemo(() => {
    const fromUser = user.adminComment?.trim()
    const fromApi = commentsData?.latestComment?.trim()
    // 저장 직후 user.adminComment가 먼저 갱신되고 comments 쿼리는 지연될 수 있음 → user 우선
    if (fromUser) return { ...user, adminComment: fromUser }
    if (fromApi) return { ...user, adminComment: fromApi }
    return user
  }, [user, commentsData?.latestComment])

  const affiliatedTeacherRows = membersRemote
    ? affiliatedTeachers
    : (user.schoolInfo?.affiliatedTeachers ?? [])

  const handleEmploymentStatusChange = useCallback(
    async (teacherId: string, status: SchoolTeacherEmploymentStatus) => {
      if (!membersRemote) return
      const row = affiliatedTeacherRows.find(r => r.id === teacherId)
      const teacherMemberId = row?.teacherMemberId
      if (teacherMemberId == null) {
        handleError(new Error('교사 memberId가 없어 재직 현황을 저장할 수 없습니다.'), {
          context: 'userDetailBasicTab.employmentStatus.missingTeacherMemberId',
        })
        return
      }
      try {
        if (schoolOrganizationId != null) {
          await updateTeacherEmploymentStatusRemote(
            schoolOrganizationId,
            teacherMemberId,
            status
          )
          await queryClient.invalidateQueries({
            queryKey: memberQueryKeys.schoolTeachers(schoolOrganizationId),
          })
        } else if (user.memberId != null) {
          await updateAffiliatedTeacherEmploymentStatusRemote(
            user.memberId,
            teacherMemberId,
            status
          )
          await queryClient.invalidateQueries({
            queryKey: memberQueryKeys.affiliatedTeachers(user.memberId),
          })
        } else {
          handleError(new Error('학교 organizationId가 없어 재직 현황을 저장할 수 없습니다.'), {
            context: 'userDetailBasicTab.employmentStatus.missingOrganizationId',
          })
          return
        }
      } catch (error) {
        handleError(error, {
          defaultMessage: getMemberApiErrorMessage(error, '재직 현황 변경에 실패했습니다.'),
        })
      }
    },
    [membersRemote, schoolOrganizationId, user.memberId, affiliatedTeacherRows, queryClient]
  )

  const remoteConsentRows = useMemo(() => {
    if (!membersRemote || !basicTab.showConsentAgreement) return undefined
    const baseSchema =
      consentViewVariant === 'permission_instructor'
        ? CONSENT_ROWS_PERMISSION_INSTRUCTOR
        : CONSENT_PRESET_SCHEMA[consentPreset]
    const detailTerms = user.termsAgreements
    return applyMemberConsentToSchema(baseSchema, {
      termsAgreements: detailTerms,
      consentRecords,
    })
  }, [
    membersRemote,
    basicTab.showConsentAgreement,
    consentViewVariant,
    consentPreset,
    consentRecords,
    user.termsAgreements,
  ])

  const isInstructorPermissionDetail = mode === 'permission' && permissionRole === 'instructor'
  // 전체 프로필 수정만 등록 폼 재사용. 강사비·JA 제한 수정은 조회 레이아웃 + 해당 필드만 인라인 편집.
  const instructorRegisterLikeEdit =
    memberInfoEditScope === 'instructor_fee_ja'
      ? null
      : resolveInstructorRegisterLikeEdit({
          user,
          memberInfoEditing,
          memberInfoDraft,
          onMemberInfoDraftChange,
        })

  /** 개인·관리자 상세 — 선택 동의 편집 / 필수 동의는 라디오 disabled */
  const memberConsentEditing = Boolean(
    memberInfoEditing &&
      (user.role === 'INDIVIDUAL' || user.role === 'ADMIN') &&
      shouldShowCmsMemberInfoEditButton(user) &&
      (user.role !== 'ADMIN' || adminMemberProfileFieldsEditableWhenEditing) &&
      memberInfoDraft != null &&
      onMemberInfoDraftChange != null
  )

  const handleEditableConsentChange = useCallback(
    (label: string, agreed: boolean) => {
      if (!onMemberInfoDraftChange) return
      const fieldKey = resolveMemberConsentTemplateByLabel(label)?.fieldKey
      onMemberInfoDraftChange({
        termsAgreements: upsertEditableTermsAgreementInDraft(
          memberInfoDraft?.termsAgreements,
          label,
          agreed
        ),
        ...(!agreed && fieldKey
          ? {
              consentWriteSnapshots: clearConsentWriteSnapshot(
                memberInfoDraft?.consentWriteSnapshots,
                fieldKey
              ),
            }
          : {}),
      })
    },
    [memberInfoDraft?.consentWriteSnapshots, memberInfoDraft?.termsAgreements, onMemberInfoDraftChange]
  )

  const handleConsentAgreementSnapshotSave = useCallback(
    (label: string, snapshot: MemberConsentAgreementDraftSnapshot) => {
      if (!onMemberInfoDraftChange) return
      const fieldKey = resolveMemberConsentTemplateByLabel(label)?.fieldKey
      if (!fieldKey) return
      onMemberInfoDraftChange({
        consentWriteSnapshots: upsertConsentAgreementWriteSnapshot(
          memberInfoDraft?.consentWriteSnapshots,
          fieldKey,
          snapshot
        ),
      })
    },
    [memberInfoDraft?.consentWriteSnapshots, onMemberInfoDraftChange]
  )

  const handleConsentCrimeSnapshotSave = useCallback(
    (label: string, snapshot: MemberConsentCrimeDraftSnapshot) => {
      if (!onMemberInfoDraftChange) return
      const fieldKey = resolveMemberConsentTemplateByLabel(label)?.fieldKey
      if (!fieldKey) return
      onMemberInfoDraftChange({
        consentWriteSnapshots: upsertConsentCrimeWriteSnapshot(
          memberInfoDraft?.consentWriteSnapshots,
          fieldKey,
          snapshot
        ),
      })
    },
    [memberInfoDraft?.consentWriteSnapshots, onMemberInfoDraftChange]
  )

  return (
    <Space direction="vertical" size={24} style={{ width: '100%' }}>
      {canShowAdminCommentForTarget ? (
        <>
          {membersRemote && commentsError ? (
            <MemberDetailMockDataBanner message="관리자 코멘트 API 조회에 실패했습니다. 저장된 값 또는 빈 목록이 표시됩니다." />
          ) : null}
          <UserDetailAdminCommentSection
            user={userForAdminComment}
          />
        </>
      ) : null}
      {instructorRegisterLikeEdit ? (
        <InstructorDetailEditForm
          user={user}
          instructorResumeApplicantRow={instructorResumeApplicantRow}
          memberInfoDraft={instructorRegisterLikeEdit.memberInfoDraft}
          onMemberInfoDraftChange={instructorRegisterLikeEdit.onMemberInfoDraftChange}
          onOpenJaGradeEvaluation={onOpenJaGradeEvaluation}
          isInstructorPermissionDetail={isInstructorPermissionDetail}
        />
      ) : (
        <>
          <UserBasicInfoSection
            user={user}
            entrySource={basicInfoEntrySource}
            isInstructorPermissionDetail={isInstructorPermissionDetail}
            isAdminPermissionDetail={mode === 'permission' && permissionRole === 'admin'}
            caption={basicTab.caption}
            externalId1365={basicTab.externalId1365}
            personalInfoRevealed={personalInfoRevealed}
            memberInfoEditing={memberInfoEditing}
            memberInfoEditScope={memberInfoEditScope}
            memberInfoDraft={memberInfoDraft}
            onMemberInfoDraftChange={onMemberInfoDraftChange}
            adminPermissionVariantPatching={adminPermissionVariantPatching}
            onPatchAdminPermissionVariantFromDetailView={onPatchAdminPermissionVariantFromDetailView}
            adminMemberProfileFieldsEditableWhenEditing={adminMemberProfileFieldsEditableWhenEditing}
            onPermissionResendNotification={onPermissionResendNotification}
            onOpenJaGradeEvaluation={onOpenJaGradeEvaluation}
            scheduleChangeCount={scheduleChangeCount}
            onEmploymentStatusChange={membersRemote ? onEmploymentStatusChange : undefined}
          />
          {basicTab.showConsentAgreement ? (
            <UserConsentAgreementSection
              preset={consentPreset}
              viewVariant={consentViewVariant}
              remoteConsentRows={remoteConsentRows}
              remoteConsentLoading={membersRemote && consentLoading}
              editing={memberConsentEditing}
              draftTermsAgreements={memberInfoDraft?.termsAgreements}
              consentWriteSnapshots={memberInfoDraft?.consentWriteSnapshots}
              onEditableConsentChange={
                memberConsentEditing ? handleEditableConsentChange : undefined
              }
              onConsentAgreementSnapshotSave={
                memberConsentEditing ? handleConsentAgreementSnapshotSave : undefined
              }
              onConsentCrimeSnapshotSave={
                memberConsentEditing ? handleConsentCrimeSnapshotSave : undefined
              }
              memberId={user.memberId}
              membersRemote={membersRemote}
              memberUser={user}
            />
          ) : null}
          {instructorResumeApplicantRow ? (
            <InstructorResumeDetailForms instructor={instructorResumeApplicantRow} />
          ) : null}
        </>
      )}
      {basicTab.showSchoolAffiliatedTeachers ? (
        <>
          {membersRemote && teachersError ? (
            <MemberDetailMockDataBanner message="소속 교사 목록 API 조회에 실패했습니다. 저장된 값 또는 빈 목록이 표시됩니다." />
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
