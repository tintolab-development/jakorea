import { useState, useEffect, useLayoutEffect, useCallback, useMemo, createElement, type MutableRefObject } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import type { Application, UserHistory } from '@/types/domain'
import type { ApplicationProgressStatus } from '@/types/application-progress'
import { applicationService } from '@/entities/application/api/application-service'
import {
  maskedUserForInstructorDetail,
  userToApplicantInstructorRow,
} from '@/features/user/shared/lib/user-to-applicant-instructor-row'
import {
  resolveInstructorMemberProfile,
  isInstructorSchoolTeacherProfile,
} from '@/entities/user/lib/resolve-instructor-member-profile'
import {
  programsHistoryHasChildMenu,
  clampProgramsChildForUser,
  instructorDetailLnbClickShowsPrepareMessage,
  resolveMemberDetailTabStateFromUrl,
  resolveUserDetailSubjectKey,
  type TabState,
  type UserDetailLnbKey,
  type UserDetailProgramsChildKey,
} from './user-detail-fullpage-helpers'
import { buildUserDetailSidebarItems } from '../ui/detail-info/user-detail-fullpage-sidebar-items'
import { fetchMemberDetailBasicTabResources } from './fetch-member-detail-basic-tab-resources'
import { fetchMemberDetailSettlementTabResources } from './fetch-member-detail-settlement-tab-resources'
import { roleStrategyMap } from '../strategies'
import { useUserDetailApplications } from './use-user-detail-applications'
import {
  resolveActiveProgramHistoryTabLoading,
  resolveMemberProgramHistoryResourceFlags,
  resolveProgramsChildForMemberDetail,
} from './resolve-member-program-history-resource-flags'
import {
  fetchSchoolOrganizationProgramEnrollmentHistoryQuery,
  useSchoolOrganizationProgramEnrollmentHistoryQuery,
} from '@/features/user/api/hooks/use-member-detail-subresource-queries'
import { useUserDetailUrlSync } from './use-user-detail-url-sync'
import type { UseUserDetailModalsResult } from './use-user-detail-modals'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { User, SchoolTeacherEmploymentStatus } from '@/types/user'
import type { ProgramEnrollmentDisplayStatus } from '@/shared/constants/status'
import { navigateToProgramAdminDetail } from '@/features/program/general/lib/navigate-to-program-admin-detail'
import type {
  PatchUserBasicInfoInput,
  PatchUserBasicInfoOptions,
} from '@/entities/user/api/user-service'
import {
  canAccessAdminCommentInAdminDetail,
  canEditAdminMemberInfo,
  canStartAdminMemberProfileEdit,
  isCmsInstructorFeeJaRestrictedEditTarget,
  shouldShowCmsMemberInfoEditButton,
  shouldShowCmsMemberInfoEditButtonOrInstructorRestricted,
  shouldShowAdminCommentSectionForViewer,
} from '@/features/user/shared/lib/admin-provisioned-member-policy'
import {
  getAdminPermissionVariant,
  type AdminPermissionTagVariant,
} from '@/features/user/shared/lib/admin-permission-display'
import {
  draftToAdminAccountBasicInfoPatch,
  draftToAdminMemberRestrictedPatch,
  draftToAdminProvisionedIndividualBasicInfoPatch,
  draftToAdminProvisionedInstructorBasicInfoPatch,
  draftToBasicInfoPatch,
  draftToInstructorFeeAndJaGradePatch,
  draftToSchoolAdminCommentOnlyPatch,
  draftToSchoolInstitutionBasicInfoPatch,
  userToAdminCommentOnlyDraft,
  userToAdminProvisionedBasicDraft,
  userToSchoolInstitutionEditDraft,
  type AdminProvisionedMemberBasicInfoDraft,
} from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'
import {
  resolveUserBasicInfoBodyKey,
  parseUserBasicInfoEntryQuery,
  USER_BASIC_INFO_ENTRY_QUERY_KEY,
  type UserBasicInfoEntrySource,
} from '@/features/user/detail/ui/user-basic-info-section'
import { handleError } from '@/shared/utils/error-handler'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { useQueryClient } from '@tanstack/react-query'
import { memberQueryKeys } from '@/features/user/api/member-query-keys'
import { MEMBER_DETAIL_SCREEN_CODE } from '@/features/user/api/map-member-comments'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import { applyPrivacyUnmaskResponseToUser } from '@/features/user/api/apply-privacy-unmask-to-user'
import { parseAdminAccountIdFromUserId } from '@/features/user/api/fetch-admin-member-detail'
import {
  applySavedBasicInfoPatchToUser,
  mergeListUserWithFetchedDetail,
} from '@/features/user/api/merge-list-user-with-detail'
import { institutionHasRegisteredTeachers } from '@/features/user/shared/lib/institution-delete-guard'
import { upsertMember1365ExternalIdentifierRemote, upsertMemberAdminCommentRemote, deleteMemberApplicationHistoryRemote, deleteMemberProgramHistoryRemote, bulkDeleteSchoolOrganizationProgramEnrollmentHistoryRemote } from '@/features/user/api/members-api-client'
import { parseSchoolOrganizationEnrollmentRowId } from '@/features/user/api/map-school-organization-program-enrollment-history'
import { parseOrganizationIdFromUserId } from '@/features/user/api/map-school-organization-to-user'
import { resolveAdminCommentResource } from '@/features/user/api/resolve-admin-comment-resource'
import { bulkIssueCertificatesRemote, bulkDownloadCertificatesRemote } from '@/features/user/api/certificates-api-client'
import { downloadFromBulkEndpoint } from '@/features/user/api/download-bulk-endpoint'
import {
  collectParticipantIdsFromHistoryRowIds,
  parseMemberProgramHistoryRowId,
} from '@/features/user/api/member-program-history-ids'
import type { CertificateIssueReasonValue } from '@/features/user/detail/ui/modal/certificate-bulk-issue-reason-modal'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { updateTeacherMemberEmploymentStatusAndRefresh } from '@/features/user/api/update-teacher-member-employment-status'
import { invalidateMemberDetailHistoryQueries } from '@/features/user/api/invalidate-member-detail-history-queries'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import { getMemberApiErrorMessage } from '@/features/user/api/get-member-api-error'
import { mockUserHistories } from '@/data/mock/mypage'
import { revokeInstructorPermission } from '@/entities/user/api/user-service'
import { ConfirmModal } from '@/shared/ui/confirm-modal'

const PERSONAL_INFO_REVEAL_MODAL_Z_INDEX = 1100

/** 관리자 등록 회원 정보 수정 시 unmask 감사 로그 사유 */
const BASIC_INFO_EDIT_UNMASK_REASON = '정보 수정'

const BASIC_INFO_EDIT_UNMASK_CONFIRM_CONTENT =
  "관리자에 의해 등록된 회원은 정보 수정 시 개인정보 마스킹이 해제되며, 개인정보 열람 사유는 '정보 수정'으로 로그 이력에 기록됩니다. 해당 회원의 개인정보 열람 및 정보를 수정하시겠습니까?"

export type BasicInfoEditScope = 'none' | 'profile' | 'comment' | 'instructor_fee_ja'

export type InstructorPermissionRevokeNotifyTiming = 'immediate' | 'manual'

export type UserDetailControllerModalMode = 'default' | 'permission'

export type MemberBasicInfoSavedOptions = {
  /** 코멘트만 저장 시 목록 invalidate(members all) 생략 */
  skipListInvalidate?: boolean
}

export interface UseUserDetailControllerParams {
  open: boolean
  displayUser: Omit<User, 'password'> | null
  mode: UserDetailControllerModalMode
  programsChildQueryKey: string
  basicInfoEntrySource?: UserBasicInfoEntrySource
  onWithdraw?: (user: Omit<User, 'password'>) => void
  modals: UseUserDetailModalsResult
  patchMemberBasicInfo?: (
    userId: string,
    patch: PatchUserBasicInfoInput,
    options?: PatchUserBasicInfoOptions
  ) => Promise<Omit<User, 'password'>>
  onMemberBasicInfoSaved?: (
    user: Omit<User, 'password'>,
    options?: MemberBasicInfoSavedOptions
  ) => void
  detailCloseIntentRef?: MutableRefObject<boolean>
}

export function useUserDetailController({
  open,
  displayUser,
  mode,
  programsChildQueryKey,
  basicInfoEntrySource,
  onWithdraw,
  modals,
  patchMemberBasicInfo,
  onMemberBasicInfoSaved,
  detailCloseIntentRef,
}: UseUserDetailControllerParams) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const currentUser = useAuthStore(state => state.user)
  const queryClient = useQueryClient()
  const { showAlert } = useCmsAlert()

  const [tabState, setTabState] = useState<TabState>({ lnb: 'detail-info' })
  /** 권한 승인 상세는 신청 정보(기본/약관/이력서)만 — 프로그램 신청·참여 이력 API 생략 */
  const loadProgramHistoryResources = open && mode !== 'permission'
  /** 기본정보 등 다른 LNB — 프로그램 이력·수강 API는 history 탭 진입 시에만 */
  const shouldLoadProgramHistoryTab = loadProgramHistoryResources && tabState.lnb === 'history'
  /** 회원 상세 정보 탭 — consent-records 등 기본정보 전용 API */
  const shouldLoadDetailInfoTab = open && mode !== 'permission' && tabState.lnb === 'detail-info'
  /** 정산 현황 탭 — 강사·교사 겸 강사 settlement API */
  const shouldLoadPaymentStatusTab =
    open && mode !== 'permission' && tabState.lnb === 'payment-status'
  const isSchoolDetail = displayUser?.role === 'SCHOOL'
  const hasProgramsChildMenu = Boolean(displayUser && programsHistoryHasChildMenu(displayUser))
  const resolvedProgramsChild = useMemo(
    () =>
      resolveProgramsChildForMemberDetail(displayUser, tabState.lnb, tabState.child),
    [displayUser, tabState.lnb, tabState.child]
  )

  const membersRemote = isMembersRemoteEnabled()

  const schoolOrganizationId = useMemo(() => {
    if (!isSchoolDetail || !displayUser) return undefined
    return (
      displayUser.organizationId ?? parseOrganizationIdFromUserId(displayUser.id) ?? undefined
    )
  }, [displayUser, isSchoolDetail])

  const basicTabSections = useMemo(() => {
    if (!displayUser || mode === 'permission') {
      return {
        showConsentAgreement: false,
        showSchoolAffiliatedTeachers: false,
        showInstructorPayment: false,
      }
    }
    const sections = roleStrategyMap[displayUser.role].getSections({
      displayUser,
      applications: [],
      enrollmentApplications: [],
    })
    return {
      showConsentAgreement: sections.basicTab.showConsentAgreement,
      showSchoolAffiliatedTeachers: sections.basicTab.showSchoolAffiliatedTeachers,
      showInstructorPayment: sections.settlement.showInstructorPayment,
    }
  }, [displayUser, mode])

  const adminCommentResource = useMemo(
    () => resolveAdminCommentResource(displayUser),
    [displayUser]
  )

  const detailTabResourceFetchKey =
    shouldLoadDetailInfoTab && displayUser
      ? `${displayUser.id}:${displayUser.memberId ?? ''}:${schoolOrganizationId ?? ''}:${adminCommentResource?.resourceId ?? ''}:${adminCommentResource?.target ?? ''}:${basicTabSections.showConsentAgreement}:${basicTabSections.showSchoolAffiliatedTeachers}`
      : ''

  useEffect(() => {
    if (!detailTabResourceFetchKey) return

    void fetchMemberDetailBasicTabResources(queryClient, {
      detailTabActive: true,
      membersRemote,
      displayUser,
      mode,
      showConsentAgreement: basicTabSections.showConsentAgreement,
      showSchoolAffiliatedTeachers: basicTabSections.showSchoolAffiliatedTeachers,
      organizationId: schoolOrganizationId,
      currentUser,
    })
    // displayUser 객체 identity 변경(저장·unmask)으로 consent/comments/teachers 재GET 방지
    // eslint-disable-next-line react-hooks/exhaustive-deps -- detailTabResourceFetchKey가 primitive SSOT
  }, [detailTabResourceFetchKey, membersRemote, mode, queryClient])

  const settlementTabResourceFetchKey =
    shouldLoadPaymentStatusTab &&
    basicTabSections.showInstructorPayment &&
    displayUser?.memberId != null
      ? `${displayUser.id}:${displayUser.memberId}`
      : ''

  useEffect(() => {
    if (!settlementTabResourceFetchKey || displayUser?.memberId == null) return

    void fetchMemberDetailSettlementTabResources(queryClient, {
      settlementTabActive: true,
      membersRemote,
      showInstructorPayment: basicTabSections.showInstructorPayment,
      instructorMemberId: displayUser.memberId,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- settlementTabResourceFetchKey가 primitive SSOT
  }, [settlementTabResourceFetchKey, membersRemote, queryClient])

  useEffect(() => {
    if (open) return
    setTabState({ lnb: 'detail-info' })
  }, [open])

  useLayoutEffect(() => {
    if (!open || !displayUser) return
    if (detailCloseIntentRef?.current) return

    const urlId = searchParams.get('id')?.trim()
    if (urlId && displayUser.id && urlId !== displayUser.id) return

    setTabState(prev => {
      const next = resolveMemberDetailTabStateFromUrl({
        searchParams,
        displayUser,
        programsChildQueryKey,
        mode,
      })
      if (prev.lnb === next.lnb && prev.child === next.child) {
        return prev
      }
      return next
    })
  }, [
    open,
    displayUser?.id,
    displayUser?.role,
    displayUser?.instructorMemberProfile,
    displayUser?.affiliatedSchoolUserId,
    mode,
    searchParams.get('id'),
    searchParams.get('lnb'),
    searchParams.get(programsChildQueryKey),
    programsChildQueryKey,
    detailCloseIntentRef,
  ])

  const {
    applications: memberApplications,
    enrollmentApplications,
    enrollmentTabLoading,
    lectureTabLoading,
    volunteerHistories: remoteVolunteerHistories,
    volunteerHistoriesLoading: remoteVolunteerHistoriesLoading,
    refetchApplications: refetchMemberApplications,
  } = useUserDetailApplications(open, displayUser, {
    enabled: shouldLoadProgramHistoryTab && !isSchoolDetail,
    programsChild: resolvedProgramsChild,
    hasProgramsChildMenu,
  })

  const {
    data: schoolEnrollmentApplications = [],
    isLoading: schoolEnrollmentLoading,
    isFetching: schoolEnrollmentFetching,
    isPending: schoolEnrollmentPending,
    refetch: refetchSchoolEnrollment,
  } = useSchoolOrganizationProgramEnrollmentHistoryQuery(
    schoolOrganizationId,
    displayUser?.id,
    shouldLoadProgramHistoryTab && isSchoolDetail,
    undefined,
    { manualFetch: membersRemote }
  )

  const schoolTabResourceFetchKey =
    shouldLoadProgramHistoryTab && isSchoolDetail && displayUser?.id
      ? `${displayUser.id}:${schoolOrganizationId ?? ''}`
      : ''

  useEffect(() => {
    if (
      !membersRemote ||
      !schoolTabResourceFetchKey ||
      schoolOrganizationId == null ||
      !displayUser?.id
    ) {
      return
    }

    void fetchSchoolOrganizationProgramEnrollmentHistoryQuery(
      queryClient,
      schoolOrganizationId,
      displayUser.id
    )
  }, [
    membersRemote,
    schoolTabResourceFetchKey,
    schoolOrganizationId,
    displayUser?.id,
    queryClient,
  ])

  const applications = isSchoolDetail ? schoolEnrollmentApplications : memberApplications
  const applicationsLoading = isSchoolDetail
    ? membersRemote
      ? schoolEnrollmentPending || schoolEnrollmentFetching
      : schoolEnrollmentLoading
    : resolveActiveProgramHistoryTabLoading({
        programsChild: resolvedProgramsChild,
        hasProgramsChildMenu,
        enrollmentTabLoading,
        lectureTabLoading,
        volunteerTabLoading: remoteVolunteerHistoriesLoading,
      })

  const refetchApplications = useCallback(async () => {
    if (isSchoolDetail) {
      if (membersRemote && schoolOrganizationId != null && displayUser?.id) {
        await invalidateMemberDetailHistoryQueries(queryClient, {
          organizationId: schoolOrganizationId,
        })
        await fetchSchoolOrganizationProgramEnrollmentHistoryQuery(
          queryClient,
          schoolOrganizationId,
          displayUser.id
        )
        return
      }
      await refetchSchoolEnrollment()
      return
    }
    if (membersRemote && displayUser?.memberId != null) {
      await invalidateMemberDetailHistoryQueries(queryClient, {
        memberId: displayUser.memberId,
      })
    }
    await refetchMemberApplications()
  }, [
    isSchoolDetail,
    membersRemote,
    schoolOrganizationId,
    displayUser?.id,
    displayUser?.memberId,
    queryClient,
    refetchMemberApplications,
    refetchSchoolEnrollment,
  ])

  const [mockVolunteerHistories, setMockVolunteerHistories] = useState<UserHistory[]>([])
  const [mockVolunteerHistoriesLoading, setMockVolunteerHistoriesLoading] = useState(false)

  const volunteerHistories = membersRemote ? remoteVolunteerHistories : mockVolunteerHistories
  const volunteerHistoriesLoading = membersRemote
    ? remoteVolunteerHistoriesLoading
    : mockVolunteerHistoriesLoading
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false)
  const [institutionDeleteBlockedOpen, setInstitutionDeleteBlockedOpen] = useState(false)
  const [basicInfoEditing, setBasicInfoEditing] = useState(false)
  const [basicInfoEditScope, setBasicInfoEditScope] = useState<BasicInfoEditScope>('none')
  const [basicInfoDraft, setBasicInfoDraft] = useState<AdminProvisionedMemberBasicInfoDraft | null>(
    null
  )
  const [basicInfoSaveLoading, setBasicInfoSaveLoading] = useState(false)
  const [adminPermissionVariantPatching, setAdminPermissionVariantPatching] = useState(false)
  const [instructorPermissionRevokeOpen, setInstructorPermissionRevokeOpen] = useState(false)
  const [jaGradeEvaluationOpen, setJaGradeEvaluationOpen] = useState(false)

  const detailSubjectKey = useMemo(
    () => resolveUserDetailSubjectKey(displayUser),
    [displayUser?.id, displayUser?.memberId, displayUser?.adminAccountId]
  )

  useUserDetailUrlSync({
    open,
    displayUser,
    mode,
    searchParams,
    setSearchParams,
    programsChildQueryKey,
    detailCloseIntentRef,
  })

  const resolvePersonalInfoAccessItem = useCallback(
    () =>
      displayUser?.schoolInfo?.schoolName?.trim() || displayUser?.name || '회원 상세 정보',
    [displayUser?.name, displayUser?.schoolInfo?.schoolName]
  )

  const handlePrivacyUnmasked = useCallback(
    (payload: unknown, role: User['role'] | undefined) => {
      if (!displayUser) return
      const merged = applyPrivacyUnmaskResponseToUser(
        displayUser,
        payload,
        role ?? displayUser.role
      )
      if (displayUser.memberId != null) {
        queryClient.setQueryData(memberQueryKeys.detail(displayUser.memberId), merged)
      }
      queryClient.setQueryData(
        [...memberQueryKeys.detailByUuid(displayUser.id), displayUser.role],
        merged
      )
      onMemberBasicInfoSaved?.(merged, { skipListInvalidate: true })
    },
    [displayUser, onMemberBasicInfoSaved, queryClient]
  )

  const {
    personalInfoRevealed,
    personalInfoRevealConfirmOpen,
    openPersonalInfoRevealConfirm,
    closePersonalInfoRevealConfirm,
    submitPersonalInfoReveal,
    revealWithReason,
    confirmModal: personalInfoRevealModal,
  } = usePersonalInfoReveal({
    resolveAccessItem: resolvePersonalInfoAccessItem,
    resolveMemberId: () => {
      if (displayUser?.memberId != null) return String(displayUser.memberId)
      return displayUser?.id
    },
    resolveMemberRole: () => displayUser?.role,
    resolveAdminAccountId: () => {
      if (displayUser?.adminAccountId != null) return displayUser.adminAccountId
      const id = displayUser?.id
      return id ? parseAdminAccountIdFromUserId(id) : undefined
    },
    resolveInstructorRoleRequestId: () => displayUser?.instructorRoleRequestId,
    onPrivacyUnmasked: handlePrivacyUnmasked,
    resetDeps: [
      open,
      displayUser?.id,
      displayUser?.memberId,
      displayUser?.role,
      displayUser?.instructorRoleRequestId,
    ],
    controlMode: 'hideWhenRevealed',
    modalZIndex: PERSONAL_INFO_REVEAL_MODAL_Z_INDEX,
  })

  const [editUnmaskConfirmOpen, setEditUnmaskConfirmOpen] = useState(false)
  const [editUnmaskConfirmLoading, setEditUnmaskConfirmLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      setBasicInfoEditing(false)
      setBasicInfoEditScope('none')
      setBasicInfoDraft(null)
      setBasicInfoSaveLoading(false)
      setAdminPermissionVariantPatching(false)
      setInstructorPermissionRevokeOpen(false)
      setJaGradeEvaluationOpen(false)
      setInstitutionDeleteBlockedOpen(false)
      setEditUnmaskConfirmOpen(false)
      setEditUnmaskConfirmLoading(false)
    }
  }, [open])

  useEffect(() => {
    setBasicInfoEditing(false)
    setBasicInfoEditScope('none')
    setBasicInfoDraft(null)
    setBasicInfoSaveLoading(false)
    setAdminPermissionVariantPatching(false)
    setInstructorPermissionRevokeOpen(false)
    setJaGradeEvaluationOpen(false)
    setInstitutionDeleteBlockedOpen(false)
    setEditUnmaskConfirmOpen(false)
    setEditUnmaskConfirmLoading(false)
  }, [detailSubjectKey])

  useEffect(() => {
    if (membersRemote) return

    const { loadProgramHistory } = resolveMemberProgramHistoryResourceFlags({
      historyTabActive: shouldLoadProgramHistoryTab,
      programsChild: resolvedProgramsChild,
      hasProgramsChildMenu,
    })

    if (shouldLoadProgramHistoryTab && loadProgramHistory && displayUser?.id) {
      setMockVolunteerHistoriesLoading(true)
      const volunteerOnly = mockUserHistories.filter(
        h => h.userId === displayUser.id && h.role === 'VOLUNTEER'
      )
      setMockVolunteerHistories(volunteerOnly)
      setMockVolunteerHistoriesLoading(false)
      return
    }

    setMockVolunteerHistories([])
    setMockVolunteerHistoriesLoading(false)
  }, [
    membersRemote,
    shouldLoadProgramHistoryTab,
    resolvedProgramsChild,
    hasProgramsChildMenu,
    displayUser?.id,
  ])

  const handleProgressStatusChange = useCallback(
    async (app: Application, displayStatus: ProgramEnrollmentDisplayStatus) => {
      if (!displayUser) return
      if (membersRemote) return
      try {
        if (displayStatus === 'REJECTED') {
          await applicationService.update(app.id, {
            status: 'rejected',
            rejectionKind: 'APPLICATION',
            progressStatus: undefined,
          })
        } else if (displayStatus === 'INTERVIEW_FAILED') {
          await applicationService.update(app.id, {
            status: 'rejected',
            rejectionKind: 'INTERVIEW',
            progressStatus: undefined,
          })
        } else if (displayStatus === 'WAITING_RESULT') {
          await applicationService.update(app.id, {
            status: 'submitted',
            rejectionKind: undefined,
            progressStatus: undefined,
          })
        } else if (displayStatus === 'DOCUMENT_PASS') {
          await applicationService.update(app.id, {
            status: 'reviewing',
            rejectionKind: undefined,
          })
        } else {
          const progressMap: Record<
            Exclude<
              ProgramEnrollmentDisplayStatus,
              'REJECTED' | 'INTERVIEW_FAILED' | 'WAITING_RESULT' | 'DOCUMENT_PASS'
            >,
            ApplicationProgressStatus
          > = {
            EDUCATION_SCHEDULED: 'RECEIVED',
            EDUCATION_IN_PROGRESS: 'IN_PROGRESS',
            PROGRAM_ENDED: 'REPORT_SUBMITTED',
          }
          await applicationService.update(app.id, {
            status: 'approved',
            progressStatus: progressMap[displayStatus],
            rejectionKind: undefined,
          })
        }
        await refetchApplications()
      } catch (e) {
        console.error('Failed to update progress status:', e)
      }
    },
    [displayUser, refetchApplications, membersRemote]
  )

  const handleBulkDeleteHistory = useCallback(
    async (rowIds: string[]) => {
      if (!displayUser || !membersRemote || rowIds.length === 0) return

      if (displayUser.role === 'SCHOOL') {
        const organizationId =
          displayUser.organizationId ?? parseOrganizationIdFromUserId(displayUser.id)
        if (organizationId == null) return
        const historyRowIds = rowIds
          .map(rowId => parseSchoolOrganizationEnrollmentRowId(rowId)?.historyRowId)
          .filter((id): id is number => id != null)
        if (historyRowIds.length === 0) return
        try {
          await bulkDeleteSchoolOrganizationProgramEnrollmentHistoryRemote(organizationId, {
            historyRowIds,
          })
          await refetchApplications()
        } catch (error) {
          showAlert({
            title: '안내',
            content: getMemberApiErrorMessage(error, '프로젝트 수강 이력 삭제에 실패했습니다.'),
          })
        }
        return
      }

      if (!displayUser.memberId) return
      try {
        await Promise.all(
          rowIds.map(async rowId => {
            const parsed = parseMemberProgramHistoryRowId(rowId)
            if (!parsed) return
            if (parsed.kind === 'application') {
              await deleteMemberApplicationHistoryRemote(displayUser.memberId!, parsed.numericId)
              return
            }
            await deleteMemberProgramHistoryRemote(displayUser.memberId!, parsed.numericId)
          })
        )
        await refetchApplications()
      } catch (error) {
        showAlert({
          title: '안내',
          content: getMemberApiErrorMessage(error, '프로그램 이력 삭제에 실패했습니다.'),
        })
      }
    },
    [displayUser, membersRemote, refetchApplications, showAlert]
  )

  const handleCertificateBulkIssue = useCallback(
    async (rowIds: readonly string[], _reason: CertificateIssueReasonValue, reasonLabel: string, certificateType: 'COMPLETION' | 'ACTIVITY') => {
      if (!membersRemote) return
      const participantIds = collectParticipantIdsFromHistoryRowIds(rowIds)
      if (participantIds.length === 0) {
        showAlert({
          title: '안내',
          content:
            '선택한 이력 중 증명서 발급 가능한 참여 건이 없습니다. 프로그램 배정이 완료된 이력을 선택해 주세요.',
        })
        return
      }
      try {
        const issueBody = {
          participantIds,
          certificateType,
          issueReason: reasonLabel,
        }
        const result = await bulkIssueCertificatesRemote(issueBody)
        const successCount = result.successCount ?? participantIds.length
        try {
          const download = await bulkDownloadCertificatesRemote(issueBody)
          if (download.downloadEndpoint) {
            await downloadFromBulkEndpoint(download.downloadEndpoint, '증명서_일괄')
          }
        } catch (downloadError) {
          showAlert({
            title: '안내',
            content: getMemberApiErrorMessage(
              downloadError,
              `${successCount}건 발급은 완료되었으나 ZIP 다운로드에 실패했습니다.`
            ),
          })
          await refetchApplications()
          return
        }
        showAlert({
          title: '안내',
          content: `${successCount}건의 증명서 발급 및 다운로드가 완료되었습니다.`,
        })
        await refetchApplications()
      } catch (error) {
        showAlert({
          title: '안내',
          content: getMemberApiErrorMessage(error, '증명서 발급에 실패했습니다.'),
        })
      }
    },
    [membersRemote, refetchApplications, showAlert]
  )

  const handleStudentCertificateBulkIssue = useCallback(
    (rowIds: readonly string[], reason: CertificateIssueReasonValue, reasonLabel: string) => {
      void handleCertificateBulkIssue(rowIds, reason, reasonLabel, 'COMPLETION')
    },
    [handleCertificateBulkIssue]
  )

  const handleVolunteerCertificateBulkIssue = useCallback(
    (rowIds: readonly string[], reason: CertificateIssueReasonValue, reasonLabel: string) => {
      void handleCertificateBulkIssue(rowIds, reason, reasonLabel, 'ACTIVITY')
    },
    [handleCertificateBulkIssue]
  )

  const prepareLeaveMemberDetailForProgramNavigation = useCallback(() => {
    if (detailCloseIntentRef) detailCloseIntentRef.current = true
  }, [detailCloseIntentRef])

  const openVolunteerProgramDetail = useCallback(
    (history: UserHistory) => {
      navigateToProgramAdminDetail(navigate, history.programId, {
        onBeforeNavigate: prepareLeaveMemberDetailForProgramNavigation,
        queryClient,
      })
    },
    [navigate, prepareLeaveMemberDetailForProgramNavigation, queryClient]
  )

  const openWithdrawConfirm = useCallback(() => {
    if (
      displayUser?.role === 'SCHOOL' &&
      institutionHasRegisteredTeachers(displayUser)
    ) {
      setInstitutionDeleteBlockedOpen(true)
      return
    }
    setWithdrawConfirmOpen(true)
  }, [displayUser])

  const closeWithdrawConfirm = useCallback(() => {
    setWithdrawConfirmOpen(false)
  }, [])

  const closeInstitutionDeleteBlocked = useCallback(() => {
    setInstitutionDeleteBlockedOpen(false)
  }, [])

  const handleWithdrawConfirm = useCallback(() => {
    if (displayUser && onWithdraw) {
      onWithdraw(displayUser)
      setWithdrawConfirmOpen(false)
    }
  }, [displayUser, onWithdraw])

  const focusDetailInfoTab = useCallback(() => {
    setTabState({ lnb: 'detail-info' })
    setSearchParams(
      prev => {
        const nextParams = new URLSearchParams(prev)
        const curId = prev.get('id')?.trim()
        // 목록·드릴다운이 이미 id를 넣은 경우 덮어쓰지 않음 — admin-account-{id}/uuid 혼용 시 URL·상태 리셋 방지
        if (displayUser?.id && !curId) {
          nextParams.set('id', displayUser.id)
        }
        nextParams.set('lnb', 'detail-info')
        nextParams.delete(programsChildQueryKey)
        return nextParams
      },
      { replace: true }
    )
  }, [displayUser?.id, programsChildQueryKey, setSearchParams])

  const startBasicInfoEdit = useCallback(
    (sourceUser?: Omit<User, 'password'> | null) => {
      const target = sourceUser ?? displayUser
      if (!target) return
      if (!shouldShowCmsMemberInfoEditButtonOrInstructorRestricted(target)) return

      const entryQ = parseUserBasicInfoEntryQuery(searchParams.get(USER_BASIC_INFO_ENTRY_QUERY_KEY))
      const bodyKey = resolveUserBasicInfoBodyKey(basicInfoEntrySource, entryQ, target.role)

      const restrictedFeeJa =
        isCmsInstructorFeeJaRestrictedEditTarget(target) &&
        !shouldShowCmsMemberInfoEditButton(target)

      if (target.role === 'SCHOOL' && bodyKey === 'institution') {
        if (restrictedFeeJa) return
        setBasicInfoDraft(userToSchoolInstitutionEditDraft(target))
        setBasicInfoEditScope('profile')
        setBasicInfoEditing(true)
        focusDetailInfoTab()
        return
      }

      if (target.role === 'INSTRUCTOR' && bodyKey === 'instructor') {
        setBasicInfoDraft(userToAdminProvisionedBasicDraft(target))
        setBasicInfoEditScope(restrictedFeeJa ? 'instructor_fee_ja' : 'profile')
        setBasicInfoEditing(true)
        focusDetailInfoTab()
        return
      }

      if (bodyKey === 'admin') {
        if (restrictedFeeJa) return
        if (!canStartAdminMemberProfileEdit(currentUser, target)) return
        setBasicInfoDraft(userToAdminProvisionedBasicDraft(target))
        setBasicInfoEditScope('profile')
        setBasicInfoEditing(true)
        focusDetailInfoTab()
        return
      }

      if (bodyKey !== 'all_users') return
      if (restrictedFeeJa) return
      setBasicInfoDraft(userToAdminProvisionedBasicDraft(target))
      setBasicInfoEditScope('profile')
      setBasicInfoEditing(true)
      focusDetailInfoTab()
    },
    [displayUser, basicInfoEntrySource, searchParams, currentUser, focusDetailInfoTab]
  )

  /** 관리자 등록 회원 — 마스킹 미해제 시 안내 모달 후 unmask, 이후 수정 진입.
   * 학교(기관) 상세는 마스킹 대상 없음 → 안내 모달 없이 바로 수정 진입.
   * 강사 등급 제한 수정도 PII 없음 → 바로 수정 진입. */
  const requestStartBasicInfoEdit = useCallback(() => {
    if (!displayUser) return
    if (!shouldShowCmsMemberInfoEditButtonOrInstructorRestricted(displayUser)) return
    const restrictedFeeJa =
      isCmsInstructorFeeJaRestrictedEditTarget(displayUser) &&
      !shouldShowCmsMemberInfoEditButton(displayUser)
    if (restrictedFeeJa || displayUser.role === 'SCHOOL' || personalInfoRevealed) {
      startBasicInfoEdit()
      return
    }
    setEditUnmaskConfirmOpen(true)
  }, [displayUser, personalInfoRevealed, startBasicInfoEdit])

  const closeEditUnmaskConfirm = useCallback(() => {
    if (editUnmaskConfirmLoading) return
    setEditUnmaskConfirmOpen(false)
  }, [editUnmaskConfirmLoading])

  const confirmEditUnmaskAndStartEdit = useCallback(() => {
    if (editUnmaskConfirmLoading || !displayUser) return
    setEditUnmaskConfirmLoading(true)
    void revealWithReason(BASIC_INFO_EDIT_UNMASK_REASON)
      .then(result => {
        if (!result.ok) return
        const unmaskedUser =
          result.payload !== undefined
            ? applyPrivacyUnmaskResponseToUser(displayUser, result.payload, displayUser.role)
            : displayUser
        setEditUnmaskConfirmOpen(false)
        startBasicInfoEdit(unmaskedUser)
      })
      .finally(() => {
        setEditUnmaskConfirmLoading(false)
      })
  }, [displayUser, editUnmaskConfirmLoading, revealWithReason, startBasicInfoEdit])

  const editUnmaskConfirmModal = useMemo(
    () =>
      createElement(ConfirmModal, {
        open: editUnmaskConfirmOpen,
        title: '정보 수정 안내',
        content: BASIC_INFO_EDIT_UNMASK_CONFIRM_CONTENT,
        confirmText: '정보 수정',
        cancelText: '취소',
        onConfirm: confirmEditUnmaskAndStartEdit,
        onCancel: closeEditUnmaskConfirm,
        confirmLoading: editUnmaskConfirmLoading,
        zIndex: PERSONAL_INFO_REVEAL_MODAL_Z_INDEX,
      }),
    [
      editUnmaskConfirmOpen,
      editUnmaskConfirmLoading,
      confirmEditUnmaskAndStartEdit,
      closeEditUnmaskConfirm,
    ]
  )

  const startAdminCommentEdit = useCallback(() => {
    if (!displayUser) return
    if (!shouldShowAdminCommentSectionForViewer(currentUser, displayUser)) return

    const entryQ = parseUserBasicInfoEntryQuery(searchParams.get(USER_BASIC_INFO_ENTRY_QUERY_KEY))
    const bodyKey = resolveUserBasicInfoBodyKey(basicInfoEntrySource, entryQ, displayUser.role)

    if (bodyKey === 'admin' && !canAccessAdminCommentInAdminDetail(currentUser)) return
    if (
      bodyKey !== 'all_users' &&
      bodyKey !== 'institution' &&
      bodyKey !== 'instructor' &&
      bodyKey !== 'admin'
    ) {
      return
    }

    const draft = userToAdminCommentOnlyDraft(displayUser)
    const fromUser = (displayUser.adminComment ?? '').trim()
    const commentResource = resolveAdminCommentResource(displayUser)
    const fromCommentsCache =
      !fromUser && membersRemote && commentResource
        ? (
            queryClient.getQueryData<{ latestComment?: string }>(
              memberQueryKeys.comments(
                commentResource.resourceId,
                MEMBER_DETAIL_SCREEN_CODE,
                commentResource.target
              )
            )?.latestComment ?? ''
          ).trim()
        : ''
    setBasicInfoDraft({
      ...draft,
      adminComment: fromUser || fromCommentsCache || draft.adminComment,
    })
    setBasicInfoEditScope('comment')
    setBasicInfoEditing(true)
    focusDetailInfoTab()
  }, [
    displayUser,
    basicInfoEntrySource,
    searchParams,
    currentUser,
    focusDetailInfoTab,
    membersRemote,
    queryClient,
  ])

  const cancelBasicInfoEdit = useCallback(() => {
    setBasicInfoEditing(false)
    setBasicInfoEditScope('none')
    setBasicInfoDraft(null)
  }, [])

  const saveBasicInfoEdit = useCallback(async () => {
    if (!displayUser || !basicInfoDraft || !patchMemberBasicInfo) return
    if (basicInfoEditScope === 'comment' && displayUser.role === 'ADMIN') {
      if (!canAccessAdminCommentInAdminDetail(currentUser)) return
    }
    if (basicInfoEditScope === 'profile' && displayUser.role === 'ADMIN') {
      if (!canStartAdminMemberProfileEdit(currentUser, displayUser)) return
    }
    setBasicInfoSaveLoading(true)
    try {
      // Remote 코멘트 전용: upsert만 호출 (상세 GET·목록 invalidate 없음)
      const commentResource = resolveAdminCommentResource(displayUser)
      if (basicInfoEditScope === 'comment' && membersRemote && commentResource) {
        const savedComment = (basicInfoDraft.adminComment ?? '').trim()
        if (!savedComment) {
          setBasicInfoEditing(false)
          setBasicInfoEditScope('none')
          setBasicInfoDraft(null)
          return
        }
        const cachedComments = queryClient.getQueryData<{
          comments?: unknown[]
          latestComment?: string
          latestCommentDetail?: { commentId?: number; comment: string }
        }>(
          memberQueryKeys.comments(
            commentResource.resourceId,
            MEMBER_DETAIL_SCREEN_CODE,
            commentResource.target
          )
        )
        const saved = await upsertMemberAdminCommentRemote(
          commentResource.resourceId,
          savedComment,
          {
            existingCommentId: cachedComments?.latestCommentDetail?.commentId,
            screenCode: MEMBER_DETAIL_SCREEN_CODE,
          }
        )
        const commentId = saved.commentId ?? cachedComments?.latestCommentDetail?.commentId
        const merged = { ...displayUser, adminComment: savedComment }
        queryClient.setQueryData(
          memberQueryKeys.comments(
            commentResource.resourceId,
            MEMBER_DETAIL_SCREEN_CODE,
            commentResource.target
          ),
          {
            comments: cachedComments?.comments ?? [],
            latestComment: savedComment,
            latestCommentDetail: {
              comment: savedComment,
              ...(commentId != null ? { commentId } : {}),
            },
          }
        )
        if (displayUser.memberId != null) {
          queryClient.setQueryData(memberQueryKeys.detail(displayUser.memberId), merged)
        }
        queryClient.setQueryData(
          [...memberQueryKeys.detailByUuid(displayUser.id), displayUser.role],
          merged
        )
        setBasicInfoEditing(false)
        setBasicInfoEditScope('none')
        setBasicInfoDraft(null)
        onMemberBasicInfoSaved?.(merged, { skipListInvalidate: true })
        return
      }

      let patch: PatchUserBasicInfoInput
      if (basicInfoEditScope === 'comment') {
        patch = draftToSchoolAdminCommentOnlyPatch(basicInfoDraft)
      } else if (basicInfoEditScope === 'instructor_fee_ja') {
        patch = draftToInstructorFeeAndJaGradePatch(basicInfoDraft)
      } else if (displayUser.role === 'SCHOOL') {
        patch = draftToSchoolInstitutionBasicInfoPatch(basicInfoDraft)
      } else if (displayUser.role === 'INSTRUCTOR') {
        patch = draftToAdminProvisionedInstructorBasicInfoPatch(basicInfoDraft)
      } else if (displayUser.role === 'ADMIN') {
        patch = canEditAdminMemberInfo(currentUser, displayUser)
          ? draftToAdminAccountBasicInfoPatch(basicInfoDraft)
          : draftToAdminMemberRestrictedPatch(basicInfoDraft)
      } else if (displayUser.role === 'INDIVIDUAL') {
        patch = draftToAdminProvisionedIndividualBasicInfoPatch(basicInfoDraft)
      } else {
        patch = draftToBasicInfoPatch(basicInfoDraft)
      }

      if (
        (basicInfoEditScope === 'profile' || basicInfoEditScope === 'instructor_fee_ja') &&
        Object.prototype.hasOwnProperty.call(patch, 'adminComment')
      ) {
        const { adminComment: _adminComment, ...patchWithoutComment } = patch
        patch = patchWithoutComment
      }

      const patchOptions: PatchUserBasicInfoOptions | undefined =
        membersRemote && displayUser
          ? {
              knownRole: displayUser.role,
              memberId: displayUser.memberId,
              organizationId:
                displayUser.organizationId ??
                parseOrganizationIdFromUserId(displayUser.id) ??
                undefined,
              baseUser: displayUser,
            }
          : undefined

      const updated = await patchMemberBasicInfo(displayUser.id, patch, patchOptions)
      let merged = applySavedBasicInfoPatchToUser(
        mergeListUserWithFetchedDetail(displayUser, updated),
        patch
      )

      const draftId1365 = (basicInfoDraft.id1365 ?? '').trim()
      const currentId1365 = (displayUser.id1365 ?? '').trim()
      if (
        displayUser.role === 'INDIVIDUAL' &&
        membersRemote &&
        displayUser.memberId != null &&
        draftId1365 !== currentId1365 &&
        draftId1365
      ) {
        await upsertMember1365ExternalIdentifierRemote(displayUser.memberId, draftId1365)
        merged = { ...merged, id1365: draftId1365 }
      }
      if (membersRemote && commentResource) {
        const savedComment = patch.adminComment?.trim()
        if (savedComment) {
          queryClient.setQueryData(
            memberQueryKeys.comments(
              commentResource.resourceId,
              MEMBER_DETAIL_SCREEN_CODE,
              commentResource.target
            ),
            (prev: {
              comments?: unknown[]
              latestComment?: string
              latestCommentDetail?: { comment: string; commentId?: number }
            } | undefined) => ({
              comments: prev?.comments ?? [],
              latestComment: savedComment,
              latestCommentDetail: {
                comment: savedComment,
                ...(prev?.latestCommentDetail?.commentId != null
                  ? { commentId: prev.latestCommentDetail.commentId }
                  : {}),
              },
            })
          )
        }
      }
      if (displayUser.memberId != null) {
        queryClient.setQueryData(memberQueryKeys.detail(displayUser.memberId), merged)
        if (basicInfoEditScope === 'profile' || basicInfoEditScope === 'instructor_fee_ja') {
          void queryClient.invalidateQueries({
            queryKey: memberQueryKeys.consentRecords(displayUser.memberId),
          })
        }
      }
      queryClient.setQueryData(
        [...memberQueryKeys.detailByUuid(displayUser.id), displayUser.role],
        merged
      )
      setBasicInfoEditing(false)
      setBasicInfoEditScope('none')
      setBasicInfoDraft(null)
      const skipListInvalidate =
        membersRemote &&
        (basicInfoEditScope === 'profile' || basicInfoEditScope === 'instructor_fee_ja')
      onMemberBasicInfoSaved?.(merged, skipListInvalidate ? { skipListInvalidate: true } : undefined)
    } catch (error) {
      handleError(error, { defaultMessage: '회원 정보 저장에 실패했습니다.' })
    } finally {
      setBasicInfoSaveLoading(false)
    }
  }, [
    displayUser,
    basicInfoDraft,
    basicInfoEditScope,
    patchMemberBasicInfo,
    onMemberBasicInfoSaved,
    currentUser,
    membersRemote,
    queryClient,
  ])

  const updateBasicInfoDraft = useCallback((partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => {
    setBasicInfoDraft(prev => (prev ? { ...prev, ...partial } : prev))
  }, [])

  const patchAdminPermissionVariantFromDetailView = useCallback(
    async (nextPermission: AdminPermissionTagVariant) => {
      if (!displayUser || displayUser.role !== 'ADMIN') return
      if (!canAccessAdminCommentInAdminDetail(currentUser)) return
      if (!patchMemberBasicInfo) return
      const current = getAdminPermissionVariant(displayUser)
      if (nextPermission === current) return
      setAdminPermissionVariantPatching(true)
      try {
        const updated = await patchMemberBasicInfo(
          displayUser.id,
          {
            listMetrics: { adminPermissionVariant: nextPermission },
          },
          {
            knownRole: 'ADMIN',
            memberId: displayUser.memberId,
            baseUser: displayUser,
          }
        )
        onMemberBasicInfoSaved?.(updated)
      } catch (error) {
        handleError(error, { defaultMessage: '관리자 권한 유형 변경에 실패했습니다.' })
      } finally {
        setAdminPermissionVariantPatching(false)
      }
    },
    [displayUser, currentUser, patchMemberBasicInfo, onMemberBasicInfoSaved]
  )

  const patchTeacherEmploymentStatus = useCallback(
    async (status: SchoolTeacherEmploymentStatus) => {
      if (!displayUser || !isInstructorSchoolTeacherProfile(displayUser)) return
      if (!membersRemote) return
      if (displayUser.memberId == null) {
        handleError(new Error('교사 memberId가 없어 재직 현황을 저장할 수 없습니다.'), {
          context: 'userDetail.employmentStatus.missingTeacherMemberId',
        })
        return
      }
      try {
        const refreshed = await updateTeacherMemberEmploymentStatusAndRefresh({
          memberId: displayUser.memberId,
          organizationId: displayUser.organizationId,
          employmentStatus: status,
        })
        const merged = mergeListUserWithFetchedDetail(displayUser, refreshed)
        queryClient.setQueryData(memberQueryKeys.detail(displayUser.memberId), merged)
        queryClient.setQueryData(
          [...memberQueryKeys.detailByUuid(displayUser.id), displayUser.role],
          merged
        )
        if (merged.organizationId != null) {
          void queryClient.invalidateQueries({
            queryKey: memberQueryKeys.schoolTeachers(merged.organizationId),
          })
        }
        onMemberBasicInfoSaved?.(merged, { skipListInvalidate: true })
      } catch (error) {
        handleError(error, {
          defaultMessage: getMemberApiErrorMessage(error, '재직 현황 변경에 실패했습니다.'),
        })
        throw error
      }
    },
    [displayUser, membersRemote, queryClient, onMemberBasicInfoSaved]
  )

  const openInstructorPermissionRevoke = useCallback(() => {
    if (!displayUser || displayUser.role !== 'INSTRUCTOR') return
    if (resolveInstructorMemberProfile(displayUser) === 'school_teacher') return
    if (displayUser.instructorApprovalStatus?.trim().toUpperCase() === 'REVOKED') return
    setInstructorPermissionRevokeOpen(true)
  }, [displayUser])

  const closeInstructorPermissionRevoke = useCallback(() => {
    setInstructorPermissionRevokeOpen(false)
  }, [])

  const confirmInstructorPermissionRevoke = useCallback(
    async (payload: { reason: string; notifyTiming: InstructorPermissionRevokeNotifyTiming }) => {
      if (!displayUser || displayUser.role !== 'INSTRUCTOR') return
      const reason = payload.reason.trim()
      if (!reason) return

      try {
        const revoked = await revokeInstructorPermission(
          displayUser.id,
          { reason, revokeReason: reason },
          { memberId: displayUser.memberId }
        )
        if (isMembersRemoteEnabled()) {
          await queryClient.invalidateQueries({ queryKey: memberQueryKeys.listAll() })
          await queryClient.invalidateQueries({ queryKey: memberQueryKeys.schoolsListAll() })
          if (displayUser.memberId != null) {
            await queryClient.invalidateQueries({
              queryKey: memberQueryKeys.detail(displayUser.memberId),
            })
          }
          await queryClient.invalidateQueries({
            queryKey: memberQueryKeys.detailByUuid(displayUser.id),
          })
        }
        onMemberBasicInfoSaved?.(revoked)
        setInstructorPermissionRevokeOpen(false)
      } catch (error) {
        handleError(error, {
          defaultMessage: getMemberApiErrorMessage(error, '강사 권한 박탈에 실패했습니다.'),
        })
      }
    },
    [displayUser, onMemberBasicInfoSaved, queryClient]
  )

  const openJaGradeEvaluation = useCallback(() => {
    if (!displayUser || displayUser.role !== 'INSTRUCTOR') return
    setJaGradeEvaluationOpen(true)
  }, [displayUser])

  const closeJaGradeEvaluation = useCallback(() => {
    setJaGradeEvaluationOpen(false)
  }, [])

  const completeJaGradeEvaluation = useCallback(
    async ({ grade }: { grade: string; totalScore: number }) => {
      if (!displayUser) {
        throw new Error('강사 정보가 없어 평가 등급을 반영할 수 없습니다.')
      }

      if (basicInfoEditing && basicInfoEditScope === 'instructor_fee_ja') {
        setBasicInfoDraft(prev => (prev ? { ...prev, jaEvaluationGrade: grade } : prev))
      }

      // remote: 모달에서 evaluation-grade POST 완료됨. mock만 상세 패치로 영속화.
      if (patchMemberBasicInfo && !isMembersRemoteEnabled()) {
        const persisted = await patchMemberBasicInfo(displayUser.id, {
          listMetrics: { jaEvaluationGrade: grade },
        })
        if (persisted.memberId != null) {
          queryClient.setQueryData(memberQueryKeys.detail(persisted.memberId), persisted)
        }
        queryClient.setQueryData(
          [...memberQueryKeys.detailByUuid(persisted.id), persisted.role],
          persisted
        )
        setJaGradeEvaluationOpen(false)
        onMemberBasicInfoSaved?.(persisted)
        return
      }

      const mergedUser: Omit<User, 'password'> = {
        ...displayUser,
        listMetrics: {
          ...displayUser.listMetrics,
          jaEvaluationGrade: grade,
        },
      }

      if (displayUser.memberId != null) {
        queryClient.setQueryData(memberQueryKeys.detail(displayUser.memberId), mergedUser)
      }
      queryClient.setQueryData(
        [...memberQueryKeys.detailByUuid(displayUser.id), displayUser.role],
        mergedUser
      )

      setJaGradeEvaluationOpen(false)
      onMemberBasicInfoSaved?.(mergedUser)
    },
    [
      displayUser,
      onMemberBasicInfoSaved,
      patchMemberBasicInfo,
      queryClient,
      basicInfoEditing,
      basicInfoEditScope,
    ]
  )

  const handleSidebarSelectTop = useCallback(
    (key: string) => {
      if (mode === 'permission') {
        setTabState({ lnb: 'detail-info' })
        return
      }
      if (!displayUser) return
      const k = key as UserDetailLnbKey

      if (k === 'payment-status') {
        if (instructorDetailLnbClickShowsPrepareMessage(displayUser, k, 'payment-top')) {
          window.alert('준비 중입니다.')
          return
        }
      }

      if (k === 'history' && programsHistoryHasChildMenu(displayUser)) {
        if (instructorDetailLnbClickShowsPrepareMessage(displayUser, k, 'history-top')) {
          window.alert('준비 중입니다.')
          return
        }
        setTabState({ lnb: 'history', child: 'enrollment' })
      } else {
        setTabState({ lnb: k })
      }

      setSearchParams(
        prev => {
          const nextParams = new URLSearchParams(prev)
          if (displayUser?.id) nextParams.set('id', displayUser.id)
          nextParams.set('lnb', k)
          if (k === 'history' && programsHistoryHasChildMenu(displayUser)) {
            nextParams.set(programsChildQueryKey, 'enrollment')
          } else {
            nextParams.delete(programsChildQueryKey)
          }
          return nextParams
        },
        { replace: true }
      )
    },
    [mode, displayUser, setSearchParams, programsChildQueryKey]
  )

  const handleSidebarSelectChild = useCallback(
    (_groupKey: string, childKey: string) => {
      if (mode === 'permission') return
      if (!displayUser) return
      const child = clampProgramsChildForUser(displayUser, childKey as UserDetailProgramsChildKey)
      if (
        instructorDetailLnbClickShowsPrepareMessage(displayUser, 'history', 'history-child', child)
      ) {
        window.alert('준비 중입니다.')
        return
      }
      setTabState({ lnb: 'history', child })
      setSearchParams(
        prev => {
          const nextParams = new URLSearchParams(prev)
          if (displayUser?.id) nextParams.set('id', displayUser.id)
          nextParams.set('lnb', 'history')
          nextParams.set(programsChildQueryKey, child)
          return nextParams
        },
        { replace: true }
      )
    },
    [mode, displayUser, setSearchParams, programsChildQueryKey]
  )

  const openEnrollmentProgramDetail = useCallback(
    (record: Application) => {
      navigateToProgramAdminDetail(navigate, record.programId, {
        onBeforeNavigate: prepareLeaveMemberDetailForProgramNavigation,
        queryClient,
      })
    },
    [navigate, prepareLeaveMemberDetailForProgramNavigation, queryClient]
  )

  const sidebarItems = useMemo(
    () => buildUserDetailSidebarItems(displayUser ?? undefined, mode),
    [displayUser, mode]
  )

  const sidebarExpandedGroupKeys = useMemo(() => {
    if (!displayUser || !programsHistoryHasChildMenu(displayUser)) return [] as const
    if (displayUser.role === 'INSTRUCTOR') {
      const p = resolveInstructorMemberProfile(displayUser)
      if (p === 'instructor_only') {
        if (tabState.lnb === 'payment-status') return [] as const
        return ['history'] as const
      }
    }
    if (tabState.lnb !== 'history') return [] as const
    return ['history'] as const
  }, [tabState.lnb, displayUser])

  const sidebarActiveChildKey = useMemo(
    () =>
      tabState.lnb === 'history' && displayUser && programsHistoryHasChildMenu(displayUser)
        ? (tabState.child ?? 'enrollment')
        : '',
    [tabState.lnb, tabState.child, displayUser]
  )

  const role = displayUser?.role

  const canPatchAdminPermissionInDetailView = useMemo(
    () =>
      Boolean(
        patchMemberBasicInfo &&
          displayUser?.role === 'ADMIN' &&
          canAccessAdminCommentInAdminDetail(currentUser)
      ),
    [patchMemberBasicInfo, displayUser?.role, currentUser]
  )

  const instructorResumeApplicantRow = useMemo((): ApplicantInstructorRow | null => {
    if (!displayUser) return null

    // 권한 승인(강사): getDetail → instructorCmsProfile 이 있으면 이력서 카드에 반영
    if (mode === 'permission') {
      if (!displayUser.instructorCmsProfile) return null
      const src = personalInfoRevealed
        ? displayUser
        : maskedUserForInstructorDetail(displayUser)
      return userToApplicantInstructorRow(src)
    }

    if (displayUser.role !== 'INSTRUCTOR') return null
    const profile = resolveInstructorMemberProfile(displayUser)
    // 순수 교사(school_teacher): 기본 정보·약관만 — 학력·경력 등 강사 제출양식 미노출
    if (profile !== 'instructor_dual' && profile !== 'instructor_only') {
      return null
    }
    const src = personalInfoRevealed ? displayUser : maskedUserForInstructorDetail(displayUser)
    return userToApplicantInstructorRow(src)
  }, [displayUser, personalInfoRevealed, mode])

  return {
    state: {
      tabState,
      applications,
      enrollmentApplications,
      applicationsLoading,
      volunteerHistories,
      volunteerHistoriesLoading,
      withdrawConfirmOpen,
      institutionDeleteBlockedOpen,
      personalInfoRevealed,
      personalInfoRevealConfirmOpen,
      basicInfoEditing,
      basicInfoEditScope,
      basicInfoDraft,
      basicInfoSaveLoading,
      adminPermissionVariantPatching,
      instructorPermissionRevokeOpen,
      jaGradeEvaluationOpen,
      personalInfoRevealModal,
      editUnmaskConfirmModal,
    },
    actions: {
      setTabState,
      handleProgressStatusChange,
      handleSidebarSelectTop,
      handleSidebarSelectChild,
      openLectureAttendance: modals.lectureAttendance.show,
      openAssignmentSubmission: modals.assignment.show,
      closeLectureAttendanceModal: modals.lectureAttendance.close,
      closeAssignmentSubmissionModal: modals.assignment.close,
      openEnrollmentProgramDetail,
      openVolunteerProgramDetail,
      prepareLeaveMemberDetailForProgramNavigation,
      handleBulkDeleteHistory,
      handleStudentCertificateBulkIssue,
      handleVolunteerCertificateBulkIssue,
      openWithdrawConfirm,
      closeWithdrawConfirm,
      closeInstitutionDeleteBlocked,
      handleWithdrawConfirm,
      openPersonalInfoRevealConfirm,
      closePersonalInfoRevealConfirm,
      submitPersonalInfoReveal,
      startBasicInfoEdit: requestStartBasicInfoEdit,
      startAdminCommentEdit,
      cancelBasicInfoEdit,
      saveBasicInfoEdit,
      updateBasicInfoDraft,
      patchAdminPermissionVariantFromDetailView,
      patchTeacherEmploymentStatus,
      openInstructorPermissionRevoke,
      closeInstructorPermissionRevoke,
      confirmInstructorPermissionRevoke,
      openJaGradeEvaluation,
      closeJaGradeEvaluation,
      completeJaGradeEvaluation,
    },
    derived: {
      role,
      sidebarItems,
      sidebarExpandedGroupKeys,
      sidebarActiveChildKey,
      instructorResumeApplicantRow,
      canPatchAdminPermissionInDetailView,
    },
  }
}
