import { useCallback, useMemo, useRef, useState } from 'react'
import { Space } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import type { User, AffiliatedTeacherLinkTarget, SchoolTeacherEmploymentStatus } from '@/types/user'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { UserDetailStrategySectionConfig } from '@/features/user/detail/strategies'
import {
  UserBasicInfoSection,
  type UserBasicInfoEntrySource,
} from '@/features/user/detail/ui/user-basic-info-section'
import {
  UserConsentAgreementSection,
  resolveUserConsentAgreementPreset,
  CONSENT_PRESET_SCHEMA,
  withGuardianConsentRows,
  CONSENT_ROWS_PERMISSION_INSTRUCTOR,
} from '@/features/user/detail/ui/user-consent-agreement-section'
import { InstructorResumeDetailForms } from '@/features/user/detail/ui/instructor-resume-detail-forms'
import { SchoolAffiliatedTeachersSection } from '@/features/user/detail/ui/school-affiliated-teachers-section'
import { UserDetailAdminCommentSection } from './user-detail-admin-comment-section'
import type { AdminProvisionedMemberBasicInfoDraft } from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'
import type { AdminPermissionTagVariant } from '@/features/user/shared/lib/admin-permission-display'
import {
  canEditAdminMemberInfo,
  shouldShowAdminCommentForAdminPermissionApplicationDetail,
  shouldShowAdminCommentSectionForViewer,
  shouldShowAdminRegisteredMemberDetailCaption,
} from '@/features/user/shared/lib/admin-provisioned-member-policy'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  useMemberConsentRecordsQuery,
  useMemberConsentSummariesQuery,
} from '@/features/user/api/hooks/use-member-detail-query'
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
import { isSchoolAffiliatedTeacherRowSelectable } from '@/features/user/detail/lib/school-teacher-employment-status'
import { deleteUser } from '@/entities/user/api/user-service'
import { resolveAffiliatedTeacherWithdrawTarget } from '@/features/user/api/map-affiliated-teacher-row'
import { MemberWithdrawGuideModal } from '@/features/user/shared/ui/member-withdraw-guide-modal'
import { DeleteGuideModal } from '@/shared/ui/delete-guide-modal'
import { buildMemberWithdrawMessageLines } from '@/features/user/shared/lib/member-withdraw-delete-guide'
import {
  WITHDRAW_GUIDE_TYPED_CONFIRM_PLACEHOLDER,
  WITHDRAW_GUIDE_TYPED_CONFIRM_VALUE,
} from '@/shared/constants'
import { guardAdminAction } from '@/shared/lib/admin-role-policy'
import { useSessionAdminRoleCode } from '@/shared/lib/use-session-admin-role-code'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { MemberDetailMockDataBanner } from '@/features/user/detail/ui/member-detail-mock-data-banner'
import { handleError } from '@/shared/utils/error-handler'

const INDIVIDUAL_CONSENT_CAPTION =
  '각 항목의 동의 현황과 해당 일시를 확인할 수 있으며, 미동의 항목은 일시가 표시되지 않습니다.'
const INDIVIDUAL_ADMIN_REGISTERED_CONSENT_CAPTION =
  '당사자의 서면 동의를 확인한 후 동의 항목을 처리해 주세요.'

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
  /** profile = 전체 기본정보, instructor_fee_ja = 강사비 등급만 */
  memberInfoEditScope?: 'profile' | 'instructor_fee_ja'
  memberInfoDraft?: AdminProvisionedMemberBasicInfoDraft | null
  /** 관리자 상세 이메일 입력란 서버 에러 문구 */
  memberInfoEmailError?: string | null
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
  /** 소속 교사 탈퇴 후 목록·학교 정보 갱신 */
  onAffiliatedTeachersChanged?: () => void | Promise<void>
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
  memberInfoEmailError = null,
  onMemberInfoDraftChange,
  adminPermissionVariantPatching = false,
  onPatchAdminPermissionVariantFromDetailView,
  onEmploymentStatusChange,
  onPermissionResendNotification,
  onOpenJaGradeEvaluation,
  scheduleChangeCount,
  onAffiliatedTeachersChanged,
}: UserDetailFullpageBasicTabContentProps) {
  const currentUser = useAuthStore(state => state.user)
  const roleCode = useSessionAdminRoleCode()
  const { showAlert } = useCmsAlert()
  const queryClient = useQueryClient()
  const membersRemote = isMembersRemoteEnabled()
  const memberInfoDraftRef = useRef(memberInfoDraft)
  memberInfoDraftRef.current = memberInfoDraft
  const adminMemberProfileFieldsEditableWhenEditing =
    user.role !== 'ADMIN' || canEditAdminMemberInfo(currentUser, user)
  const canShowAdminCommentForTarget =
    shouldShowAdminCommentSectionForViewer(currentUser, user) &&
    shouldShowAdminCommentForAdminPermissionApplicationDetail(mode, user)

  const consentPreset = resolveUserConsentAgreementPreset(user)
  /**
   * 약관·동의 description (시안)
   * - 일반 회원: 관리자 등록 회원은 서면 동의 처리 안내, 그 외 동의 현황 안내
   * - 교사(4427:48695)·교사 겸 강사(4427:48874): 동의 현황 안내
   * - 강사 권한 신청 상세: 동의 현황 안내
   */
  const individualConsentCaption =
    mode !== 'default'
      ? mode === 'permission' && permissionRole === 'instructor'
        ? INDIVIDUAL_CONSENT_CAPTION
        : undefined
      : consentPreset === 'individual'
        ? shouldShowAdminRegisteredMemberDetailCaption(user)
          ? INDIVIDUAL_ADMIN_REGISTERED_CONSENT_CAPTION
          : INDIVIDUAL_CONSENT_CAPTION
        : consentPreset === 'school_teacher' || consentPreset === 'instructor_dual'
          ? INDIVIDUAL_CONSENT_CAPTION
          : undefined
  const consentViewVariant =
    mode === 'permission' && permissionRole === 'instructor' ? 'permission_instructor' : 'default'

  /** 권한 승인 상세는 동의·소속교사 등은 신청 스냅샷 우선 — 관리자 코멘트는 resource id로 회원 상세와 동일 조회 */
  const loadMemberSubresources = mode !== 'permission'
  const adminCommentResource = resolveAdminCommentResource(user)
  const loadMemberAdminComments =
    membersRemote && canShowAdminCommentForTarget && adminCommentResource != null

  /** 현재 동의 Summary + 작성본 메타(records) — 관리자 계정은 상세 termsAgreements만 사용 */
  const shouldLoadMemberConsentRecords = shouldFetchMemberConsentRecords({
    role: user.role,
    memberId: user.memberId,
    showConsentAgreement: basicTab.showConsentAgreement,
  })
  const shouldLoadMemberCurrentConsents = shouldLoadMemberConsentRecords

  const consentSummariesQuery = useMemberConsentSummariesQuery(
    user.memberId,
    membersRemote && shouldLoadMemberCurrentConsents,
    { manualFetch: membersRemote }
  )
  const consentQuery = useMemberConsentRecordsQuery(
    user.memberId,
    membersRemote && shouldLoadMemberConsentRecords,
    { manualFetch: membersRemote }
  )
  const consentRecords = consentQuery.data ?? []
  const consentSummariesError = Boolean(
    membersRemote && shouldLoadMemberCurrentConsents && consentSummariesQuery.isError
  )
  const hasInstructorPermissionConsentFallback =
    mode === 'permission' &&
    permissionRole === 'instructor' &&
    Boolean(user.termsAgreements?.length)
  const consentLoading = Boolean(
    membersRemote &&
      shouldLoadMemberCurrentConsents &&
      !consentSummariesError &&
      !hasInstructorPermissionConsentFallback &&
      consentSummariesQuery.data === undefined &&
      (consentSummariesQuery.isFetching ||
        (consentSummariesQuery.isPending && consentSummariesQuery.fetchStatus !== 'idle'))
  )

  const { data: commentsData } = useMemberCommentsQuery(
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
    const fromApi = commentsData?.comment?.trim()
    // 저장 직후 user.adminComment가 먼저 갱신되고 comments 쿼리는 지연될 수 있음 → user 우선
    if (fromUser) return { ...user, adminComment: fromUser }
    if (fromApi) return { ...user, adminComment: fromApi }
    return user
  }, [user, commentsData?.comment])

  const affiliatedTeacherRows = membersRemote
    ? affiliatedTeachers
    : (user.schoolInfo?.affiliatedTeachers ?? [])

  const [affiliatedTeacherWithdrawOpen, setAffiliatedTeacherWithdrawOpen] = useState(false)
  const [affiliatedTeacherWithdrawTargets, setAffiliatedTeacherWithdrawTargets] = useState<
    typeof affiliatedTeacherRows
  >([])
  const [affiliatedTeacherWithdrawLoading, setAffiliatedTeacherWithdrawLoading] = useState(false)

  const affiliatedTeacherWithdrawGuideLines = useMemo(() => {
    if (affiliatedTeacherWithdrawTargets.length === 0) return []
    if (affiliatedTeacherWithdrawTargets.length === 1) {
      return buildMemberWithdrawMessageLines({
        displayName: affiliatedTeacherWithdrawTargets[0].name,
      })
    }
    return [
      `선택한 ${affiliatedTeacherWithdrawTargets.length}명의 회원을 탈퇴 처리하시겠습니까?`,
      '탈퇴 처리 시 등록 및 관련된 정보는 모두 탈퇴됩니다.',
      '탈퇴된 목록 및 정보는 되돌릴 수 없습니다. 정말 탈퇴하시겠습니까?',
    ]
  }, [affiliatedTeacherWithdrawTargets])

  const handleOpenAffiliatedTeacherWithdraw = useCallback(
    (teacherIds: string[]) => {
      if (!guardAdminAction({ roleCode, action: 'delete' })) return
      const idSet = new Set(teacherIds)
      const targets = affiliatedTeacherRows.filter(row => {
        if (!idSet.has(row.id)) return false
        if (!isSchoolAffiliatedTeacherRowSelectable(row.employmentStatus)) return false
        return Boolean(row.linkedUserId?.trim() || row.teacherMemberId != null)
      })
      if (targets.length === 0) {
        showAlert({
          title: '안내',
          content: '탈퇴 처리할 수 있는 교사를 선택해 주세요. (재직 중·회원 연동된 교사만 가능)',
        })
        return
      }
      setAffiliatedTeacherWithdrawTargets(targets)
      setAffiliatedTeacherWithdrawOpen(true)
    },
    [affiliatedTeacherRows, roleCode, showAlert]
  )

  const handleAffiliatedTeacherWithdrawCancel = useCallback(() => {
    setAffiliatedTeacherWithdrawOpen(false)
    setAffiliatedTeacherWithdrawTargets([])
  }, [])

  const handleAffiliatedTeacherWithdrawConfirm = useCallback(
    async (withdrawConfirmationText?: string) => {
      if (affiliatedTeacherWithdrawTargets.length === 0) return
      setAffiliatedTeacherWithdrawLoading(true)
      try {
        let withdrawn = 0
        for (const row of affiliatedTeacherWithdrawTargets) {
          const target = resolveAffiliatedTeacherWithdrawTarget(row)
          if (!target) continue
          await deleteUser(target.userId, 'CMS 관리자 회원 탈퇴', {
            memberId: target.memberId,
            withdrawConfirmationText,
          })
          withdrawn += 1
        }
        if (withdrawn === 0) {
          throw new Error('탈퇴 처리할 교사 회원 식별자가 없습니다.')
        }
        if (user.memberId != null) {
          await queryClient.invalidateQueries({
            queryKey: memberQueryKeys.affiliatedTeachers(user.memberId),
          })
        }
        if (schoolOrganizationId != null) {
          await queryClient.invalidateQueries({
            queryKey: memberQueryKeys.schoolTeachers(schoolOrganizationId),
          })
        }
        await onAffiliatedTeachersChanged?.()
        handleAffiliatedTeacherWithdrawCancel()
      } catch (error) {
        handleError(error, { defaultMessage: '교사 회원 탈퇴 처리에 실패했습니다.' })
      } finally {
        setAffiliatedTeacherWithdrawLoading(false)
      }
    },
    [
      affiliatedTeacherWithdrawTargets,
      handleAffiliatedTeacherWithdrawCancel,
      onAffiliatedTeachersChanged,
      queryClient,
      schoolOrganizationId,
      user.memberId,
    ]
  )

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
          await updateTeacherEmploymentStatusRemote(schoolOrganizationId, teacherMemberId, status)
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
    const presetSchema =
      consentViewVariant === 'permission_instructor'
        ? CONSENT_ROWS_PERMISSION_INSTRUCTOR
        : CONSENT_PRESET_SCHEMA[consentPreset]
    /** 만 14세 미만 본인 가입 — 보호자 정보 섹션과 같은 조건으로 법정대리인 동의 행 추가 */
    const baseSchema =
      consentPreset === 'individual' && user.under14 === true && user.registeredByAdmin !== true
        ? withGuardianConsentRows(presetSchema)
        : presetSchema

    if (user.role === 'ADMIN') {
      return applyMemberConsentToSchema(baseSchema, {
        termsAgreements: user.termsAgreements,
      })
    }

    const summaries = consentSummariesQuery.data
    const hasSummaries = Array.isArray(summaries) && summaries.length > 0

    if (consentViewVariant === 'permission_instructor') {
      return applyMemberConsentToSchema(baseSchema, {
        ...(hasSummaries
          ? { consentSummaries: summaries }
          : { termsAgreements: user.termsAgreements }),
        consentRecords,
      })
    }

    if (!shouldLoadMemberCurrentConsents || consentLoading || consentSummariesError || !hasSummaries) {
      return applyMemberConsentToSchema(baseSchema, {})
    }

    return applyMemberConsentToSchema(baseSchema, {
      consentSummaries: summaries,
      consentRecords,
    })
  }, [
    membersRemote,
    basicTab.showConsentAgreement,
    consentViewVariant,
    consentPreset,
    consentRecords,
    consentLoading,
    consentSummariesError,
    consentSummariesQuery.data,
    shouldLoadMemberCurrentConsents,
    user.role,
    user.termsAgreements,
    user.under14,
    user.registeredByAdmin,
  ])

  const isInstructorPermissionDetail = mode === 'permission' && permissionRole === 'instructor'

  /** 개인·관리자·강사/교사 상세 — 프로필 수정 시 선택 동의 편집 (필수 항목은 라디오 disabled) */
  const memberConsentEditing = Boolean(
    memberInfoEditing &&
    memberInfoEditScope === 'profile' &&
    (user.role === 'INDIVIDUAL' || user.role === 'ADMIN' || user.role === 'INSTRUCTOR') &&
    shouldShowCmsMemberInfoEditButton(user) &&
    (user.role !== 'ADMIN' || adminMemberProfileFieldsEditableWhenEditing) &&
    memberInfoDraft != null &&
    onMemberInfoDraftChange != null
  )

  const handleEditableConsentChange = useCallback(
    (label: string, agreed: boolean) => {
      if (!onMemberInfoDraftChange) return
      const fieldKey = resolveMemberConsentTemplateByLabel(label)?.fieldKey
      const draft = memberInfoDraftRef.current
      onMemberInfoDraftChange({
        termsAgreements: upsertEditableTermsAgreementInDraft(draft?.termsAgreements, label, agreed),
        consentTermsDirty: true,
        ...(!agreed && fieldKey
          ? {
              consentWriteSnapshots: clearConsentWriteSnapshot(
                draft?.consentWriteSnapshots,
                fieldKey
              ),
            }
          : {}),
      })
    },
    [onMemberInfoDraftChange]
  )

  const handleConsentAgreementSnapshotSave = useCallback(
    (label: string, snapshot: MemberConsentAgreementDraftSnapshot) => {
      if (!onMemberInfoDraftChange) return
      const fieldKey = resolveMemberConsentTemplateByLabel(label)?.fieldKey
      if (!fieldKey) return
      onMemberInfoDraftChange({
        consentWriteSnapshots: upsertConsentAgreementWriteSnapshot(
          memberInfoDraftRef.current?.consentWriteSnapshots,
          fieldKey,
          snapshot
        ),
        consentTermsDirty: true,
      })
    },
    [onMemberInfoDraftChange]
  )

  const handleConsentCrimeSnapshotSave = useCallback(
    (label: string, snapshot: MemberConsentCrimeDraftSnapshot) => {
      if (!onMemberInfoDraftChange) return
      const fieldKey = resolveMemberConsentTemplateByLabel(label)?.fieldKey
      if (!fieldKey) return
      onMemberInfoDraftChange({
        consentWriteSnapshots: upsertConsentCrimeWriteSnapshot(
          memberInfoDraftRef.current?.consentWriteSnapshots,
          fieldKey,
          snapshot
        ),
        consentTermsDirty: true,
      })
    },
    [onMemberInfoDraftChange]
  )

  return (
    <Space direction="vertical" size={32} style={{ width: '100%' }}>
      {canShowAdminCommentForTarget ? (
        <UserDetailAdminCommentSection user={userForAdminComment} />
      ) : null}
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
        memberInfoEmailError={memberInfoEmailError}
        onMemberInfoDraftChange={onMemberInfoDraftChange}
        adminPermissionVariantPatching={adminPermissionVariantPatching}
        onPatchAdminPermissionVariantFromDetailView={
          onPatchAdminPermissionVariantFromDetailView
        }
        adminMemberProfileFieldsEditableWhenEditing={
          adminMemberProfileFieldsEditableWhenEditing
        }
        onPermissionResendNotification={onPermissionResendNotification}
        onOpenJaGradeEvaluation={onOpenJaGradeEvaluation}
        scheduleChangeCount={scheduleChangeCount}
        onEmploymentStatusChange={membersRemote ? onEmploymentStatusChange : undefined}
      />
      {basicTab.showConsentAgreement &&
      consentSummariesError &&
      consentViewVariant !== 'permission_instructor' ? (
        <MemberDetailMockDataBanner message="약관·동의 현재 상태 조회에 실패했습니다. 동의 여부를 표시하지 않습니다. 잠시 후 다시 시도해 주세요." />
      ) : null}
      {basicTab.showConsentAgreement ? (
        <UserConsentAgreementSection
          preset={consentPreset}
          caption={individualConsentCaption}
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
      {basicTab.showSchoolAffiliatedTeachers ? (
        <>
          {membersRemote && teachersError ? (
            <MemberDetailMockDataBanner message="소속 교사 목록 API 조회에 실패했습니다. 저장된 값 또는 빈 목록이 표시됩니다." />
          ) : null}
          <SchoolAffiliatedTeachersSection
            rows={affiliatedTeacherRows}
            personalInfoRevealed={personalInfoRevealed}
            onLinkedUserClick={onNavigateToLinkedUser}
            onWithdrawSelected={handleOpenAffiliatedTeacherWithdraw}
            onEmploymentStatusChange={membersRemote ? handleEmploymentStatusChange : undefined}
          />
        </>
      ) : null}
      {affiliatedTeacherWithdrawOpen && affiliatedTeacherWithdrawTargets.length === 1 ? (
        <MemberWithdrawGuideModal
          open
          onCancel={handleAffiliatedTeacherWithdrawCancel}
          onConfirm={handleAffiliatedTeacherWithdrawConfirm}
          variant="member_withdraw"
          displayName={affiliatedTeacherWithdrawTargets[0].name}
          confirmLoading={affiliatedTeacherWithdrawLoading}
        />
      ) : null}
      {affiliatedTeacherWithdrawOpen && affiliatedTeacherWithdrawTargets.length >= 2 ? (
        <DeleteGuideModal
          open
          onCancel={handleAffiliatedTeacherWithdrawCancel}
          onConfirm={handleAffiliatedTeacherWithdrawConfirm}
          title="회원 탈퇴 처리 안내"
          lines={affiliatedTeacherWithdrawGuideLines}
          confirmText="회원 탈퇴"
          confirmVariant="delete"
          requiredConfirmInput={WITHDRAW_GUIDE_TYPED_CONFIRM_VALUE}
          confirmInputPlaceholder={WITHDRAW_GUIDE_TYPED_CONFIRM_PLACEHOLDER}
          confirmLoading={affiliatedTeacherWithdrawLoading}
        />
      ) : null}
    </Space>
  )
}
