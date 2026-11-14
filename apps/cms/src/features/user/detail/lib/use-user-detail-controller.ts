import {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  useRef,
  createElement,
  type MutableRefObject,
} from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { nextSearchParamsIfChanged } from '@/shared/lib/search-params-diff'
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
import {
  fetchMemberConsentRecordsQuery,
  fetchMemberConsentSummariesQuery,
} from '@/features/user/api/hooks/use-member-detail-query'
import { fetchMemberDetailSettlementTabResources } from './fetch-member-detail-settlement-tab-resources'
import { resolveUserDetailBasicTabFetchSections } from './resolve-user-detail-basic-tab-sections'
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
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { User, SchoolTeacherEmploymentStatus } from '@/types/user'
import type { InstructorPermissionRevokeChannelType } from './instructor-permission-revoke-channel'
import type { ProgramEnrollmentDisplayStatus } from '@/shared/constants/status'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { navigateToProgramAdminDetail } from '@/features/program/general/lib/navigate-to-program-admin-detail'
import { stashMemberDetailReturnForProgramNavigation } from '@/features/user/detail/lib/member-detail-program-navigation-return'
import {
  getUserById,
  type PatchUserBasicInfoInput,
  type PatchUserBasicInfoOptions,
} from '@/entities/user/api/user-service'
import { resolveMemberDisplayAfterSave } from '@/features/user/detail/lib/member-save-display'
import {
  canAccessAdminCommentInAdminDetail,
  canEditAdminMemberInfo,
  canStartAdminMemberProfileEdit,
  isCmsInstructorFeeJaRestrictedEditTarget,
  shouldShowCmsMemberInfoEditButton,
  shouldShowCmsMemberInfoEditButtonOrInstructorRestricted,
  shouldShowAdminCommentForAdminPermissionApplicationDetail,
  shouldShowAdminCommentSectionForViewer,
} from '@/features/user/shared/lib/admin-provisioned-member-policy'
import {
  getAdminPermissionVariant,
  type AdminPermissionTagVariant,
} from '@/features/user/shared/lib/admin-permission-display'
import {
  applyJaEvaluationGradeToInstructorDraft,
  mergeInstructorDetailEditFlushIntoDraft,
  draftToAdminAccountBasicInfoPatch,
  draftToAdminMemberRestrictedPatch,
  draftToAdminProvisionedIndividualBasicInfoPatch,
  draftToAdminProvisionedInstructorBasicInfoPatch,
  draftToBasicInfoPatch,
  draftToInstructorFeeAndJaGradePatch,
  draftToSchoolAdminCommentOnlyPatch,
  draftToSchoolInstitutionBasicInfoPatch,
  splitUserAffiliationForDraft,
  userToAdminCommentOnlyDraft,
  userToAdminProvisionedBasicDraft,
  userToSchoolInstitutionEditDraft,
  type AdminProvisionedMemberBasicInfoDraft,
} from '@/features/user/detail/lib/admin-provisioned-member-basic-info-draft'
import {
  resolveIndividualEnrolledSchoolSubmitBlock,
  shouldSkipIndividualEnrolledSchoolReselectionGuard,
} from '@/features/user/api/individual-enrolled-school-selection'
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
import { EDIT_MODE_REVEAL } from '@/shared/lib/privacy-unmask-purpose'
import { useRevealedMemberOverlay } from '@/features/user/detail/lib/use-revealed-member-overlay'
import {
  MEMBER_DETAIL_SCREEN_CODE,
  type MemberAdminCommentQueryData,
} from '@/features/user/api/map-member-comments'
import { usePersonalInfoReveal } from '@/features/user/detail/lib/use-personal-info-reveal'
import {
  applyPrivacyUnmaskResponseToUser,
  enrichSchoolTeacherAffiliationFromOrganization,
} from '@/features/user/api/apply-privacy-unmask-to-user'
import {
  extract1365IdFromMemberPrivacyPayload,
  preferUnmasked1365Id,
} from '@/features/user/api/map-external-identifiers'
import { stripRestrictedPiiForSessionUser } from '@/features/user/api/strip-restricted-pii'
import { parseAdminAccountIdFromUserId } from '@/features/user/api/fetch-admin-member-detail'
import {
  applySavedBasicInfoPatchToUser,
  mergeListUserWithFetchedDetail,
} from '@/features/user/api/merge-list-user-with-detail'
import { institutionHasRegisteredTeachers } from '@/features/user/shared/lib/institution-delete-guard'
import {
  upsertMember1365ExternalIdentifierRemote,
  upsertMemberAdminCommentRemote,
  deleteMemberAdminCommentRemote,
  deleteMemberApplicationHistoryRemote,
  bulkDeleteProgramHistoryRemote,
  bulkDeleteSchoolOrganizationProgramEnrollmentHistoryRemote,
  fetchSchoolOrganizationRemote,
} from '@/features/user/api/members-api-client'
import { parseSchoolOrganizationEnrollmentRowId } from '@/features/user/api/map-school-organization-program-enrollment-history'
import {
  mapSchoolOrganizationToUser,
  parseOrganizationIdFromUserId,
} from '@/features/user/api/map-school-organization-to-user'
import { resolveAdminCommentResource } from '@/features/user/api/resolve-admin-comment-resource'
import { resolveAdminCommentSaveAction } from '@/features/user/detail/lib/admin-comment-save-action'
import {
  bulkIssueCertificatesRemote,
  bulkDownloadCertificatesRemote,
  issuedParticipantIdsFromBulkResult,
  type CertificateBulkType,
} from '@/features/user/api/certificates-api-client'
import { downloadBlob, fileNameFromContentDisposition, generateFilename } from '@/shared/utils/file-download'
import {
  collectParticipantIdsFromHistoryRows,
  parseMemberProgramHistoryRowId,
} from '@/features/user/api/member-program-history-ids'
import type { CertificateIssueReasonValue } from '@/features/user/detail/ui/modal/certificate-bulk-issue-reason-modal'
import { useCmsAlert } from '@/shared/ui/cms-alert-modal-provider'
import { updateTeacherMemberEmploymentStatusAndRefresh } from '@/features/user/api/update-teacher-member-employment-status'
import { invalidateMemberDetailHistoryQueries } from '@/features/user/api/invalidate-member-detail-history-queries'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import {
  getMemberApiEmailFieldErrorMessage,
  getMemberApiErrorMessage,
} from '@/features/user/api/get-member-api-error'
import { resolveInstructorRevokeBlockedAlert } from '@/features/user/permission-management/lib/instructor-permission-cancel-approval-blocked'
import { unmaskMemberForCertificateIssue } from '@/features/program/shared/lib/unmask-for-certificate-issue'
import { revokeInstructorPermission } from '@/entities/user/api/user-service'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { parseContentModalDescriptionLine } from '@/shared/ui/content-modal-description'
import {
  INSTRUCTOR_PERMISSION_REVOKE_COMPLETE_TITLE,
  buildInstructorPermissionRevokeCompleteMessage,
} from './instructor-permission-revoke-copy'
import { guardAdminAction, resolveAdminRoleCodeFromUser } from '@/shared/lib/admin-role-policy'
import { isValidJakoreaEmail } from '@/features/auth/lib/jakorea-email'
import {
  ADMIN_EMAIL_DOMAIN_ALERT_CONTENT,
  ADMIN_EMAIL_DOMAIN_ALERT_TITLE,
} from '@/features/user/shared/ui/admin-email-domain-alert'

const PERSONAL_INFO_REVEAL_MODAL_Z_INDEX = 1100

/** 관리자 등록 회원 정보 수정 시 unmask 감사 로그 사유 */
const BASIC_INFO_EDIT_UNMASK_REASON = '회원 정보 수정'

const BASIC_INFO_EDIT_UNMASK_CONFIRM_CONTENT =
  "관리자에 의해 등록된 회원은 정보 수정 시 개인정보 마스킹이 해제되며,\n개인정보 열람 사유는 '회원 정보 수정'으로 로그 이력에 기록됩니다.\n해당 회원의 개인정보 열람 및 정보를 수정하시겠습니까?"

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
  onWithdraw?: (user: Omit<User, 'password'>, confirmInput?: string) => void | Promise<void>
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
  /** unmask 후 async 소속 보강 — 다른 회원으로 전환됐는지 판별 */
  const displayUserIdentityRef = useRef<string | null>(null)
  displayUserIdentityRef.current =
    displayUser != null ? `${displayUser.id}:${displayUser.memberId ?? ''}` : null
  /**
   * 원문(unmask) 응답은 이 상세 화면 안의 일시 상태로만 둔다.
   * 상위(drawer·목록) 상태와 공용 회원 목록·상세 캐시에는 쓰지 않는다(정책 4-2 재마스킹, P1 목록 잔류).
   * 다시 가리기·수정 취소·저장·다른 회원 이동·닫기 시 버리면 화면은 이미 받은 마스킹 GET 값으로 돌아간다.
   */
  const {
    revealedUser: overlayRevealedUser,
    holdRevealedUser,
    clearRevealedUser,
  } = useRevealedMemberOverlay(displayUser)

  const [tabState, setTabState] = useState<TabState>({ lnb: 'detail-info' })
  /** 권한 승인 상세는 신청 정보(기본/약관/이력서)만 — 프로그램 신청·참여 이력 API 생략 */
  const loadProgramHistoryResources = open && mode !== 'permission'
  /** 기본정보 등 다른 LNB — 프로그램 이력·수강 API는 history 탭 진입 시에만 */
  const shouldLoadProgramHistoryTab = loadProgramHistoryResources && tabState.lnb === 'history'
  /** 회원 상세 정보 탭 — consent-records·comments 등 기본정보 전용 API (권한 승인 상세도 comments 포함) */
  const shouldLoadDetailInfoTab = open && tabState.lnb === 'detail-info'
  /** 정산 현황 탭 — 강사·교사 겸 강사 settlement API */
  const shouldLoadPaymentStatusTab =
    open && mode !== 'permission' && tabState.lnb === 'payment-status'
  const isSchoolDetail = displayUser?.role === 'SCHOOL'
  const hasProgramsChildMenu = Boolean(displayUser && programsHistoryHasChildMenu(displayUser))
  const resolvedProgramsChild = useMemo(
    () => resolveProgramsChildForMemberDetail(displayUser, tabState.lnb, tabState.child),
    [displayUser, tabState.lnb, tabState.child]
  )

  const membersRemote = isMembersRemoteEnabled()

  const schoolOrganizationId = useMemo(() => {
    if (!isSchoolDetail || !displayUser) return undefined
    return displayUser.organizationId ?? parseOrganizationIdFromUserId(displayUser.id) ?? undefined
  }, [displayUser, isSchoolDetail])

  const basicTabSections = useMemo(
    () => resolveUserDetailBasicTabFetchSections({ displayUser, mode }),
    [displayUser, mode]
  )

  const adminCommentResource = useMemo(
    () => resolveAdminCommentResource(displayUser),
    [displayUser]
  )

  /** 상세 모달 재진입·대상 전환마다 comments GET (consent/teachers는 기존 key 유지) */
  const [detailVisitKey, setDetailVisitKey] = useState(0)
  useEffect(() => {
    if (!open || !displayUser) return
    setDetailVisitKey(key => key + 1)
  }, [open, displayUser?.id])

  const detailTabResourceFetchKey =
    shouldLoadDetailInfoTab && displayUser
      ? `${displayUser.id}:${displayUser.memberId ?? ''}:${displayUser.adminAccountId ?? ''}:${schoolOrganizationId ?? ''}:${adminCommentResource?.resourceId ?? ''}:${adminCommentResource?.target ?? ''}:${detailVisitKey}:${basicTabSections.showConsentAgreement}:${basicTabSections.showSchoolAffiliatedTeachers}`
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
  }, [membersRemote, schoolTabResourceFetchKey, schoolOrganizationId, displayUser?.id, queryClient])

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
  const [withdrawConfirmLoading, setWithdrawConfirmLoading] = useState(false)
  const [institutionDeleteBlockedOpen, setInstitutionDeleteBlockedOpen] = useState(false)
  const [basicInfoEditing, setBasicInfoEditing] = useState(false)
  const [basicInfoEditScope, setBasicInfoEditScope] = useState<BasicInfoEditScope>('none')
  const [basicInfoDraft, setBasicInfoDraft] = useState<AdminProvisionedMemberBasicInfoDraft | null>(
    null
  )
  const instructorEditDraftFlushRef = useRef<
    (() => Partial<AdminProvisionedMemberBasicInfoDraft>) | null
  >(null)
  const [basicInfoSaveLoading, setBasicInfoSaveLoading] = useState(false)
  /** 저장 실패 `error.field === 'email'` — 그때 보낸 이메일과 서버 문구. 입력값이 바뀌면 표시하지 않는다. */
  const [basicInfoEmailServerError, setBasicInfoEmailServerError] = useState<{
    email: string
    message: string
  } | null>(null)
  /** 코멘트 편집을 열 때 저장된 코멘트 — 있으면 비워 저장 = 삭제 (QA-0044) */
  const [adminCommentEditExisting, setAdminCommentEditExisting] = useState('')
  const [adminPermissionVariantPatching, setAdminPermissionVariantPatching] = useState(false)
  const [instructorPermissionRevokeOpen, setInstructorPermissionRevokeOpen] = useState(false)
  const [jaGradeEvaluationOpen, setJaGradeEvaluationOpen] = useState(false)

  const detailSubjectKey = useMemo(
    () => resolveUserDetailSubjectKey(displayUser),
    [displayUser?.id, displayUser?.memberId, displayUser?.adminAccountId]
  )
  const displayUserRolesKey = displayUser?.roles?.join('|') ?? ''

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
    () => displayUser?.schoolInfo?.schoolName?.trim() || displayUser?.name || '회원 상세 정보',
    [displayUser?.name, displayUser?.schoolInfo?.schoolName]
  )

  const handlePrivacyUnmasked = useCallback(
    (payload: unknown, role: User['role'] | undefined) => {
      if (!displayUser) return

      // 권한 승인(강사 권한 신청·관리자 승인) 상세도 원문은 오버레이(revealedUser)로만 표시한다.
      // instructorRoleRequests·adminApprovalRequests 상세 Query 캐시에 원문 응답을 쓰지 않는다
      // (공용 캐시 원문 잔류 원인, Step 5 P1).
      // 원문은 이 상세의 일시 상태로만 — 상위 drawer·목록 상태와 공용 회원 캐시에 쓰지 않는다.
      const applyMergedUser = (merged: Omit<User, 'password'>, onlyIfCurrent = false) => {
        holdRevealedUser(displayUser, merged, onlyIfCurrent)
      }

      const merged = stripRestrictedPiiForSessionUser(
        applyPrivacyUnmaskResponseToUser(displayUser, payload, role ?? displayUser.role),
        displayUser,
        useAuthStore.getState().user
      )
      applyMergedUser(merged)

      // legacy member unmask에 소속 원문이 없으면 organization 조회로 보강 (개인정보 상세보기 후)
      const enrichForIdentity = `${displayUser.id}:${displayUser.memberId ?? ''}`
      void enrichSchoolTeacherAffiliationFromOrganization(merged).then(enriched => {
        if (enriched.affiliatedSchoolName === merged.affiliatedSchoolName) return
        if (displayUserIdentityRef.current !== enrichForIdentity) return
        applyMergedUser(
          stripRestrictedPiiForSessionUser(enriched, displayUser, useAuthStore.getState().user),
          true
        )
      })
    },
    [displayUser, holdRevealedUser, queryClient]
  )

  const {
    personalInfoRevealed,
    personalInfoRevealConfirmOpen,
    openPersonalInfoRevealConfirm,
    closePersonalInfoRevealConfirm,
    submitPersonalInfoReveal,
    revealWithReason,
    remaskPersonalInfo,
    confirmModal: personalInfoRevealModal,
  } = usePersonalInfoReveal({
    resolveAccessItem: resolvePersonalInfoAccessItem,
    resolveMemberId: () => {
      if (displayUser?.memberId != null) return String(displayUser.memberId)
      return displayUser?.id
    },
    resolveMemberRole: () => displayUser?.role,
    resolveInstructorMemberProfile: () =>
      displayUser ? resolveInstructorMemberProfile(displayUser) : null,
    resolveAdminAccountId: () => {
      if (displayUser?.adminAccountId != null) return displayUser.adminAccountId
      const id = displayUser?.id
      return id ? parseAdminAccountIdFromUserId(id) : undefined
    },
    resolveInstructorRoleRequestId: () => displayUser?.instructorRoleRequestId,
    onPrivacyUnmasked: handlePrivacyUnmasked,
    onRemask: clearRevealedUser,
    resetDeps: [
      open,
      displayUser?.id,
      displayUser?.memberId,
      displayUser?.role,
      displayUserRolesKey,
      displayUser?.instructorMemberProfile,
      displayUser?.instructorRoleRequestId,
      displayUser?.adminAccountId,
    ],
    controlMode: 'hideWhenRevealed',
    modalZIndex: PERSONAL_INFO_REVEAL_MODAL_Z_INDEX,
  })

  /** 현재 회원·열람 상태와 일치할 때만 원문을 쓴다. 그 밖에는 null(마스킹 GET 값 표시). */
  const revealedUser = personalInfoRevealed ? overlayRevealedUser : null

  /** 원문 열람 종료: 훅이 일시 원문 폐기(onRemask)와 마스킹 상태 복귀를 한 번에 동기 수행한다. */
  const endPersonalInfoReveal = remaskPersonalInfo

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
      setMockVolunteerHistories([])
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
        const applicationIds: number[] = []
        const historyIds: number[] = []
        for (const rowId of rowIds) {
          const parsed = parseMemberProgramHistoryRowId(rowId)
          if (!parsed) continue
          if (parsed.kind === 'application') {
            applicationIds.push(parsed.numericId)
            continue
          }
          historyIds.push(parsed.numericId)
        }
        if (historyIds.length > 0) {
          await bulkDeleteProgramHistoryRemote(displayUser.memberId, {
            ids: historyIds.slice(0, 100),
            reason: 'CMS 회원 상세 프로그램 이력 일괄 삭제',
          })
        }
        if (applicationIds.length > 0) {
          await Promise.all(
            applicationIds.map(applicationId =>
              deleteMemberApplicationHistoryRemote(displayUser.memberId!, applicationId)
            )
          )
        }
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
    async (
      rowIds: readonly string[],
      _reason: CertificateIssueReasonValue,
      reasonLabel: string,
      certificateType: CertificateBulkType
    ) => {
      if (!membersRemote) return
      // 신청 이력 행은 응답의 participantId로, 참여 이력 행은 행 ID로 대상을 정한다(추가 호출 없음).
      const participantIds = collectParticipantIdsFromHistoryRows(rowIds, [
        ...applications,
        ...enrollmentApplications,
      ])
      if (participantIds.length === 0) {
        showAlert({
          title: '안내',
          content:
            '선택한 이력 중 증명서 발급 가능한 참여 건이 없습니다. 프로그램 배정이 완료된 이력을 선택해 주세요.',
        })
        return
      }
      try {
        if (displayUser?.memberId != null) {
          await unmaskMemberForCertificateIssue(displayUser.memberId, displayUser.role)
        }
        const issueBody = {
          participantIds,
          certificateType,
          issueReason: reasonLabel,
        }
        const result = await bulkIssueCertificatesRemote(issueBody)
        // 건별 실패는 200 안의 failures로 온다. 발급된 건만 집계하고 ZIP에 넣는다.
        const issuedParticipantIds = issuedParticipantIdsFromBulkResult(participantIds, result)
        const successCount = issuedParticipantIds.length
        if (successCount === 0) {
          showAlert({ title: '안내', content: '증명서 발급에 실패했습니다.' })
          return
        }
        try {
          // 서버가 ZIP을 바로 내려준다. 파일명은 서버 헤더([JA Korea] 증명서_일괄_YYMMDD.zip) 우선.
          // 이 ZIP은 서버 파일 다운로드 이력에 남지 않으므로 클라이언트 이력을 같은 이름으로 남긴다.
          const { zip, contentDisposition } = await bulkDownloadCertificatesRemote({
            participantIds: issuedParticipantIds,
            certificateType,
          })
          await downloadBlob(
            zip,
            fileNameFromContentDisposition(contentDisposition, generateFilename('증명서_일괄', 'zip'))
          )
        } catch (downloadError) {
          // 발급은 이미 성공했다. 서버 ZIP 오류 문구("…발급에 실패했습니다")는 사실과 달라 쓰지 않는다.
          handleError(downloadError, { context: 'userDetail.certificateBulkZipDownload' })
          showAlert({
            title: '안내',
            content: `${successCount}건 발급은 완료되었으나 ZIP 다운로드에 실패했습니다.`,
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
    [
      applications,
      displayUser,
      enrollmentApplications,
      membersRemote,
      refetchApplications,
      showAlert,
    ]
  )

  const handleStudentCertificateBulkIssue = useCallback(
    (rowIds: readonly string[], reason: CertificateIssueReasonValue, reasonLabel: string) => {
      void handleCertificateBulkIssue(rowIds, reason, reasonLabel, 'COMPLETION')
    },
    [handleCertificateBulkIssue]
  )

  const handleVolunteerCertificateBulkIssue = useCallback(
    (rowIds: readonly string[], reason: CertificateIssueReasonValue, reasonLabel: string) => {
      void handleCertificateBulkIssue(rowIds, reason, reasonLabel, 'VOLUNTEER_ACTIVITY')
    },
    [handleCertificateBulkIssue]
  )

  const handleInstructorCertificateBulkIssue = useCallback(
    (rowIds: readonly string[], reason: CertificateIssueReasonValue, reasonLabel: string) => {
      void handleCertificateBulkIssue(rowIds, reason, reasonLabel, 'INSTRUCTOR_ACTIVITY')
    },
    [handleCertificateBulkIssue]
  )

  const prepareLeaveMemberDetailForProgramNavigation = useCallback(() => {
    stashMemberDetailReturnForProgramNavigation()
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

  const refreshSchoolAfterAffiliatedTeachersChanged = useCallback(async () => {
    if (!displayUser || displayUser.role !== 'SCHOOL') return
    const organizationId =
      displayUser.organizationId ?? parseOrganizationIdFromUserId(displayUser.id)
    if (organizationId == null) return
    await queryClient.invalidateQueries({
      queryKey: memberQueryKeys.detailResource('org', organizationId),
    })
    await queryClient.invalidateQueries({
      queryKey: memberQueryKeys.schoolTeachers(organizationId),
    })
    await queryClient.invalidateQueries({ queryKey: memberQueryKeys.schoolsListAll() })
    if (displayUser.memberId != null) {
      await queryClient.invalidateQueries({
        queryKey: memberQueryKeys.affiliatedTeachers(displayUser.memberId),
      })
    }
    try {
      const next = mapSchoolOrganizationToUser(
        await fetchSchoolOrganizationRemote(organizationId)
      )
      onMemberBasicInfoSaved?.(mergeListUserWithFetchedDetail(displayUser, next), {
        skipListInvalidate: true,
      })
    } catch (error) {
      handleError(error, { defaultMessage: '소속 교사 변경 후 학교 정보를 갱신하지 못했습니다.' })
    }
  }, [displayUser, onMemberBasicInfoSaved, queryClient])

  const openWithdrawConfirm = useCallback(() => {
    if (displayUser?.role === 'SCHOOL' && institutionHasRegisteredTeachers(displayUser)) {
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

  const handleWithdrawConfirm = useCallback(
    async (confirmInput?: string) => {
      if (!displayUser || !onWithdraw) return
      setWithdrawConfirmLoading(true)
      try {
        await onWithdraw(displayUser, confirmInput)
        setWithdrawConfirmOpen(false)
      } finally {
        setWithdrawConfirmLoading(false)
      }
    },
    [displayUser, onWithdraw]
  )

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
      setBasicInfoEmailServerError(null)

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
        // 순수 교사: 수정 진입 없음.
        // 강사·겸직: 미본인인증=기본정보 전체(profile), 본인인증 후=강사비·JA만.
        if (resolveInstructorMemberProfile(target) === 'school_teacher') return
        setBasicInfoDraft(userToAdminProvisionedBasicDraft(target))
        setBasicInfoEditScope(
          shouldShowCmsMemberInfoEditButton(target) ? 'profile' : 'instructor_fee_ja'
        )
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
   * 강사·교사겸강사 **본인인증 후** 강사비 등급만 수정도 PII 없음 → 바로 수정 진입.
   * 미본인인증 강사·겸직(전체 기본정보)은 개인회원과 같이 unmask 안내. */
  const requestStartBasicInfoEdit = useCallback(() => {
    if (!displayUser) return
    if (!shouldShowCmsMemberInfoEditButtonOrInstructorRestricted(displayUser)) return
    const instructorFeeOnlyEdit =
      displayUser.role === 'INSTRUCTOR' &&
      resolveInstructorMemberProfile(displayUser) !== 'school_teacher' &&
      !shouldShowCmsMemberInfoEditButton(displayUser)
    if (instructorFeeOnlyEdit || displayUser.role === 'SCHOOL' || personalInfoRevealed) {
      // 이미 열람 중이면 일시 원문으로 수정 폼을 채운다(상위 displayUser는 마스킹 값).
      startBasicInfoEdit(personalInfoRevealed ? revealedUser : undefined)
      return
    }
    setEditUnmaskConfirmOpen(true)
  }, [displayUser, personalInfoRevealed, revealedUser, startBasicInfoEdit])

  const closeEditUnmaskConfirm = useCallback(() => {
    if (editUnmaskConfirmLoading) return
    setEditUnmaskConfirmOpen(false)
  }, [editUnmaskConfirmLoading])

  const confirmEditUnmaskAndStartEdit = useCallback(() => {
    if (editUnmaskConfirmLoading || !displayUser) return
    setEditUnmaskConfirmLoading(true)
    void revealWithReason(BASIC_INFO_EDIT_UNMASK_REASON, EDIT_MODE_REVEAL)
      .then(result => {
        if (!result.ok) return
        const unmaskedUser =
          result.payload !== undefined
            ? stripRestrictedPiiForSessionUser(
                applyPrivacyUnmaskResponseToUser(displayUser, result.payload, displayUser.role),
                displayUser,
                useAuthStore.getState().user
              )
            : displayUser
        setEditUnmaskConfirmOpen(false)
        // external-identifiers 마스킹보다 unmask/상세 원문 우선
        const id1365 = preferUnmasked1365Id(
          extract1365IdFromMemberPrivacyPayload(result.payload),
          unmaskedUser.id1365,
          displayUser.id1365
        )
        startBasicInfoEdit({
          ...unmaskedUser,
          ...(id1365 ? { id1365 } : {}),
        })
      })
      .finally(() => {
        setEditUnmaskConfirmLoading(false)
      })
  }, [displayUser, editUnmaskConfirmLoading, revealWithReason, startBasicInfoEdit])

  const editUnmaskConfirmModal = useMemo(
    () =>
      // 열려 있을 때만 마운트 — 닫힘 애니메이션 중 모달 레이어가 [취소]·헤더 클릭을 가로채지 않게 한다.
      !editUnmaskConfirmOpen
        ? null
        : createElement(ConfirmModal, {
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
    if (!shouldShowAdminCommentForAdminPermissionApplicationDetail(mode, displayUser)) return

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
            queryClient.getQueryData<MemberAdminCommentQueryData>(
              memberQueryKeys.comments(
                commentResource.resourceId,
                MEMBER_DETAIL_SCREEN_CODE,
                commentResource.target
              )
            )?.comment ?? ''
          ).trim()
        : ''
    const existingComment = fromUser || fromCommentsCache || draft.adminComment
    setAdminCommentEditExisting((existingComment ?? '').trim())
    setBasicInfoDraft({
      ...draft,
      adminComment: existingComment,
    })
    setBasicInfoEditScope('comment')
    setBasicInfoEditing(true)
    focusDetailInfoTab()
  }, [
    displayUser,
    mode,
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
    setBasicInfoEmailServerError(null)
    // 수정 취소 즉시 원문 폐기·재마스킹. 원문은 캐시에 쓰지 않았으므로 화면은 마스킹 GET 값으로 돌아간다.
    endPersonalInfoReveal()
  }, [endPersonalInfoReveal])

  const saveBasicInfoEdit = useCallback(async () => {
    if (!displayUser || !basicInfoDraft || !patchMemberBasicInfo) return
    const flushed = instructorEditDraftFlushRef.current?.()
    const draft = flushed
      ? mergeInstructorDetailEditFlushIntoDraft(basicInfoDraft, flushed)
      : basicInfoDraft
    if (flushed) setBasicInfoDraft(draft)
    setBasicInfoEmailServerError(null)
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
        const savedComment = (draft.adminComment ?? '').trim()
        const saveAction = resolveAdminCommentSaveAction({
          nextComment: savedComment,
          existingComment: adminCommentEditExisting,
        })
        if (saveAction === 'close') {
          setBasicInfoEditing(false)
          setBasicInfoEditScope('none')
          setBasicInfoDraft(null)
          return
        }
        const commentsQueryKey = memberQueryKeys.comments(
          commentResource.resourceId,
          MEMBER_DETAIL_SCREEN_CODE,
          commentResource.target
        )
        // 대상·화면마다 코멘트 1건 (QA-0044)
        const cachedComment =
          queryClient.getQueryData<MemberAdminCommentQueryData>(commentsQueryKey)
        if (saveAction === 'delete') {
          // 내용을 비워 저장 → 기존 코멘트 DELETE (별도 삭제 버튼 없음)
          await deleteMemberAdminCommentRemote(commentResource.resourceId, {
            existingCommentId: cachedComment?.commentId,
            screenCode: MEMBER_DETAIL_SCREEN_CODE,
            target: commentResource.target,
          })
          const cleared = { ...displayUser, adminComment: '' }
          queryClient.setQueryData<MemberAdminCommentQueryData>(commentsQueryKey, null)
          void queryClient.invalidateQueries({ queryKey: commentsQueryKey })
          if (displayUser.memberId != null) {
            queryClient.setQueryData(memberQueryKeys.detail(displayUser.memberId), cleared)
          }
          queryClient.setQueryData(
            [...memberQueryKeys.detailByUuid(displayUser.id), displayUser.role],
            cleared
          )
          setBasicInfoEditing(false)
          setBasicInfoEditScope('none')
          setBasicInfoDraft(null)
          endPersonalInfoReveal()
          onMemberBasicInfoSaved?.(cleared, { skipListInvalidate: true })
          return
        }
        // 등록 API 재호출 시 서버가 같은 건을 덮어쓴다 (조회·PATCH 분기 없음)
        const saved = await upsertMemberAdminCommentRemote(
          commentResource.resourceId,
          savedComment,
          {
            screenCode: MEMBER_DETAIL_SCREEN_CODE,
            target: commentResource.target,
          }
        )
        const commentId = saved.commentId ?? cachedComment?.commentId
        const merged = { ...displayUser, adminComment: savedComment }
        queryClient.setQueryData<MemberAdminCommentQueryData>(commentsQueryKey, {
          comment: savedComment,
          ...(commentId != null ? { commentId } : {}),
        })
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
        endPersonalInfoReveal()
        onMemberBasicInfoSaved?.(merged, { skipListInvalidate: true })
        return
      }

      let patch: PatchUserBasicInfoInput
      if (basicInfoEditScope === 'comment') {
        patch = draftToSchoolAdminCommentOnlyPatch(draft)
      } else if (basicInfoEditScope === 'instructor_fee_ja') {
        patch = draftToInstructorFeeAndJaGradePatch(draft)
      } else if (displayUser.role === 'SCHOOL') {
        patch = draftToSchoolInstitutionBasicInfoPatch(draft)
      } else if (displayUser.role === 'INSTRUCTOR') {
        patch = draftToAdminProvisionedInstructorBasicInfoPatch(draft)
      } else if (displayUser.role === 'ADMIN') {
        patch = canEditAdminMemberInfo(currentUser, displayUser)
          ? draftToAdminAccountBasicInfoPatch(draft)
          : draftToAdminMemberRestrictedPatch(draft)
        // 바뀐 이메일만 patch에 담긴다 — 관리자 계정은 @jakorea.org만 허용(신규 등록과 같은 안내).
        if (patch.email && !isValidJakoreaEmail(patch.email)) {
          showAlert({
            title: ADMIN_EMAIL_DOMAIN_ALERT_TITLE,
            content: ADMIN_EMAIL_DOMAIN_ALERT_CONTENT,
          })
          return
        }
      } else if (displayUser.role === 'INDIVIDUAL') {
        const enrolledSchoolBlock =
          draft.schoolEnrollmentStatus === 'enrolled' &&
          !shouldSkipIndividualEnrolledSchoolReselectionGuard({
            draftInstitution: draft.affiliationInstitution,
            originalInstitution: splitUserAffiliationForDraft(
              (revealedUser ?? displayUser).affiliation
            ).affiliationInstitution,
            schoolOrganizationId: draft.schoolOrganizationId,
            schoolProvider: draft.schoolProvider,
            schoolExternalCode: draft.schoolExternalCode,
          })
            ? resolveIndividualEnrolledSchoolSubmitBlock({
                schoolProvider: draft.schoolProvider,
                schoolOrganizationId: draft.schoolOrganizationId,
                schoolExternalCode: draft.schoolExternalCode,
                schoolEducationOfficeCode: draft.schoolEducationOfficeCode,
                schoolRegionSido: draft.schoolRegionSido,
              })
            : null
        if (enrolledSchoolBlock != null) {
          showAlert({ title: '안내', content: enrolledSchoolBlock })
          return
        }
        patch = draftToAdminProvisionedIndividualBasicInfoPatch(draft)
      } else {
        patch = draftToBasicInfoPatch(draft)
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

      const draftId1365 = (draft.id1365 ?? '').trim()
      const currentId1365 = ((revealedUser ?? displayUser).id1365 ?? '').trim()
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
            (prev: MemberAdminCommentQueryData | undefined): MemberAdminCommentQueryData => ({
              comment: savedComment,
              ...(prev?.commentId != null ? { commentId: prev.commentId } : {}),
            })
          )
        }
      }
      // 저장 후 표시·공용 캐시·목록은 마스킹 상세 GET 결과만 쓴다(입력 원문을 넘기지 않음).
      const display = await resolveMemberDisplayAfterSave({
        saved: merged,
        before: displayUser,
        scope: basicInfoEditScope,
        membersRemote,
        fetchMaskedDetail: async before => {
          const masked = await getUserById(before.id, {
            memberId: before.memberId ?? undefined,
            role: before.role,
            organizationId: before.organizationId ?? undefined,
            adminAccountId: before.adminAccountId ?? undefined,
            instructorMemberProfile: before.instructorMemberProfile,
            roles: before.roles,
          })
          if (!masked) throw new Error('masked member detail not found')
          return masked
        },
      })
      merged = display.user
      if (display.refetchNeeded) {
        void queryClient.invalidateQueries({ queryKey: memberQueryKeys.listAll() })
      }
      if (displayUser.memberId != null) {
        queryClient.setQueryData(memberQueryKeys.detail(displayUser.memberId), merged)
        if (basicInfoEditScope === 'profile' || basicInfoEditScope === 'instructor_fee_ja') {
          void queryClient.invalidateQueries({
            queryKey: memberQueryKeys.consentRecords(displayUser.memberId),
          })
          void queryClient.invalidateQueries({
            queryKey: memberQueryKeys.consentSummaries(displayUser.memberId),
          })
        }
        if (membersRemote && patch.termsAgreements?.length) {
          // 동의를 바꾼 저장(성범죄 원본 재동의 등) — 동의 일시·만료일은 서버 값으로 다시 받는다.
          // 동의 쿼리는 manualFetch(enabled=false)라 invalidate만으로는 다시 GET하지 않는다.
          void fetchMemberConsentSummariesQuery(queryClient, displayUser.memberId).catch(() => undefined)
          void fetchMemberConsentRecordsQuery(queryClient, displayUser.memberId).catch(() => undefined)
        }
      }
      if (basicInfoEditScope === 'profile') {
        void queryClient.invalidateQueries({
          queryKey: generalProgramProgressQueryKeys.educationScopes(),
        })
      }
      queryClient.setQueryData(
        [...memberQueryKeys.detailByUuid(displayUser.id), displayUser.role],
        merged
      )
      setBasicInfoEditing(false)
      setBasicInfoEditScope('none')
      setBasicInfoDraft(null)
      // 저장 완료로 수정 세션 종료 — 수정 진입 원문을 더 들고 있지 않는다.
      endPersonalInfoReveal()
      const skipListInvalidate =
        membersRemote &&
        (basicInfoEditScope === 'profile' || basicInfoEditScope === 'instructor_fee_ja')
      onMemberBasicInfoSaved?.(
        merged,
        skipListInvalidate ? { skipListInvalidate: true } : undefined
      )
    } catch (error) {
      // 관리자 계정 이메일 변경 실패(중복·형식·변경 불가)는 알럿 대신 이메일 입력란에 서버 문구를 표시한다.
      const emailFieldMessage =
        displayUser.role === 'ADMIN' ? getMemberApiEmailFieldErrorMessage(error) : null
      if (emailFieldMessage) {
        setBasicInfoEmailServerError({ email: draft.email.trim(), message: emailFieldMessage })
        return
      }
      handleError(error, {
        defaultMessage: getMemberApiErrorMessage(error, '회원 정보 저장에 실패했습니다.'),
      })
    } finally {
      setBasicInfoSaveLoading(false)
    }
  }, [
    displayUser,
    revealedUser,
    basicInfoDraft,
    basicInfoEditScope,
    patchMemberBasicInfo,
    onMemberBasicInfoSaved,
    currentUser,
    membersRemote,
    queryClient,
    endPersonalInfoReveal,
    adminCommentEditExisting,
  ])

  const updateBasicInfoDraft = useCallback(
    (partial: Partial<AdminProvisionedMemberBasicInfoDraft>) => {
      setBasicInfoDraft(prev => (prev ? { ...prev, ...partial } : prev))
    },
    []
  )

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
    async (payload: {
      reason: string
      notifyTiming: InstructorPermissionRevokeNotifyTiming
      channelType?: InstructorPermissionRevokeChannelType
      scheduledAt?: string
    }) => {
      if (!displayUser || displayUser.role !== 'INSTRUCTOR') return
      const reason = payload.reason.trim()
      if (!reason) return
      if (
        payload.notifyTiming === 'manual' &&
        (!payload.scheduledAt || new Date(payload.scheduledAt).getTime() <= Date.now())
      ) {
        showAlert({
          title: '안내',
          content: '직접 설정 알림은 현재 시각 이후의 예약 시각을 입력해 주세요.',
        })
        return
      }

      try {
        const revoked = await revokeInstructorPermission(
          displayUser.id,
          {
            reason,
            revokeReason: reason,
            channelType: payload.channelType,
            scheduledAt: payload.notifyTiming === 'manual' ? payload.scheduledAt : undefined,
          },
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
        showAlert({
          title: INSTRUCTOR_PERMISSION_REVOKE_COMPLETE_TITLE,
          content: parseContentModalDescriptionLine(
            buildInstructorPermissionRevokeCompleteMessage(displayUser.name ?? '')
          ),
        })
      } catch (error) {
        const blockedAlert = resolveInstructorRevokeBlockedAlert(error)
        if (blockedAlert) {
          setInstructorPermissionRevokeOpen(false)
          showAlert(blockedAlert)
          return
        }
        handleError(error, {
          defaultMessage: getMemberApiErrorMessage(error, '강사 권한 종료에 실패했습니다.'),
        })
      }
    },
    [displayUser, onMemberBasicInfoSaved, queryClient, showAlert]
  )

  const openJaGradeEvaluation = useCallback(() => {
    if (
      !guardAdminAction({
        roleCode: resolveAdminRoleCodeFromUser(currentUser),
        action: 'write',
      })
    ) {
      return
    }
    if (!displayUser || displayUser.role !== 'INSTRUCTOR') return
    setJaGradeEvaluationOpen(true)
  }, [currentUser, displayUser])

  const closeJaGradeEvaluation = useCallback(() => {
    setJaGradeEvaluationOpen(false)
  }, [])

  const completeJaGradeEvaluation = useCallback(
    async ({ grade }: { grade: string; totalScore: number; jaEvaluation?: unknown }) => {
      if (
        !guardAdminAction({
          roleCode: resolveAdminRoleCodeFromUser(currentUser),
          action: 'write',
        })
      ) {
        return
      }
      if (!displayUser) {
        throw new Error('강사 정보가 없어 평가 등급을 반영할 수 없습니다.')
      }

      if (basicInfoEditing) {
        setBasicInfoDraft(prev =>
          prev ? applyJaEvaluationGradeToInstructorDraft(prev, grade) : prev
        )
      }

      // remote: 모달에서 ja-evaluation POST 완료됨. mock만 상세 패치로 영속화.
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
        ...(displayUser.instructorCmsProfile
          ? {
              instructorCmsProfile: {
                ...displayUser.instructorCmsProfile,
                defaultJaGrade: grade,
              },
            }
          : {}),
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
      currentUser,
      displayUser,
      onMemberBasicInfoSaved,
      patchMemberBasicInfo,
      queryClient,
      basicInfoEditing,
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

      const changed = nextSearchParamsIfChanged(prev => {
        const nextParams = new URLSearchParams(prev)
        if (displayUser?.id) nextParams.set('id', displayUser.id)
        nextParams.set('lnb', k)
        if (k === 'history' && programsHistoryHasChildMenu(displayUser)) {
          nextParams.set(programsChildQueryKey, 'enrollment')
        } else {
          nextParams.delete(programsChildQueryKey)
        }
        return nextParams
      })
      // LNB = 브레드크럼 단계 → push (같은 메뉴 재선택은 엔트리를 만들지 않음)
      if (changed) setSearchParams(changed, { replace: false })
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
      const changed = nextSearchParamsIfChanged(prev => {
        const nextParams = new URLSearchParams(prev)
        if (displayUser?.id) nextParams.set('id', displayUser.id)
        nextParams.set('lnb', 'history')
        nextParams.set(programsChildQueryKey, child)
        return nextParams
      })
      // 하위 메뉴 = 브레드크럼 단계 → push
      if (changed) setSearchParams(changed, { replace: false })
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
        ? (revealedUser ?? displayUser)
        : maskedUserForInstructorDetail(displayUser)
      return userToApplicantInstructorRow(src)
    }

    if (displayUser.role !== 'INSTRUCTOR') return null
    const profile = resolveInstructorMemberProfile(displayUser)
    // 순수 교사(school_teacher): 기본 정보·약관만 — 학력·경력 등 강사 제출양식 미노출
    if (profile !== 'instructor_dual' && profile !== 'instructor_only') {
      return null
    }
    const src = personalInfoRevealed
      ? (revealedUser ?? displayUser)
      : maskedUserForInstructorDetail(displayUser)
    return userToApplicantInstructorRow(src)
  }, [displayUser, revealedUser, personalInfoRevealed, mode])

  return {
    state: {
      tabState,
      applications,
      enrollmentApplications,
      applicationsLoading,
      volunteerHistories,
      volunteerHistoriesLoading,
      withdrawConfirmOpen,
      withdrawConfirmLoading,
      institutionDeleteBlockedOpen,
      personalInfoRevealed,
      /** 열람 중인 원문 회원(일시 상태). 화면 표시는 `revealedUser ?? 상위 user`. */
      revealedUser,
      personalInfoRevealConfirmOpen,
      basicInfoEditing,
      basicInfoEditScope,
      basicInfoDraft,
      basicInfoSaveLoading,
      /** 관리자 상세 이메일 입력란 서버 에러 — 실패 당시 이메일과 지금 입력이 같을 때만 */
      basicInfoEmailError:
        basicInfoEmailServerError != null &&
        basicInfoDraft != null &&
        basicInfoDraft.email.trim() === basicInfoEmailServerError.email
          ? basicInfoEmailServerError.message
          : null,
      /** 코멘트 모달 — 저장된 코멘트가 있으면 비워 저장(삭제) 허용 */
      adminCommentAllowEmpty: adminCommentEditExisting.length > 0,
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
      handleInstructorCertificateBulkIssue,
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
      refreshSchoolAfterAffiliatedTeachersChanged,
      openInstructorPermissionRevoke,
      closeInstructorPermissionRevoke,
      confirmInstructorPermissionRevoke,
      openJaGradeEvaluation,
      closeJaGradeEvaluation,
      completeJaGradeEvaluation,
      instructorEditDraftFlushRef,
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
