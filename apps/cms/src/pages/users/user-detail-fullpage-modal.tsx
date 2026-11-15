/**
 * 회원 상세 풀페이지 모달
 * 전체 회원 목록 행 클릭 시 프로그램 상세와 동일한 LNB+메인 레이아웃으로 노출
 */

import { useCallback, useMemo, useState, type MutableRefObject } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { DetailModalSidebar } from '@/shared/ui/detail-modal-sidebar'
import { DetailFullpageBreadcrumb } from '@/shared/ui/detail-fullpage-breadcrumb'
import { MEMBER_LIST_KIND_LABELS, normalizeMemberListKind } from '@/shared/config/member-list-kinds'
import { buildSearchParams, makeBreadcrumbItem } from '@/shared/lib/detail-fullpage-query-stack'
import {
  userDetailModalLoadingTitle,
  userDetailModalTitle,
  userDetailSidebarNavAriaLabel,
} from '@/features/user/detail/lib/user-detail-fullpage-helpers'
import {
  UserDetailFullPageHeaderActions,
  type UserDetailPermissionRole,
} from '@/features/user/detail/ui/detail-info/user-detail-fullpage-header-actions'
import { UserDetailFullpageModalsStack } from '@/features/user/detail/ui/detail-info/user-detail-fullpage-modals-stack'
import {
  UserDetailFullpageShellProvider,
  type UserDetailFullpageShellValue,
} from '@/features/user/detail/ui/detail-info/user-detail-fullpage-shell-context'
import { UserDetailFullpageTabPanels } from '@/features/user/detail/ui/detail-info/user-detail-fullpage-tab-panels'
import type { User, AffiliatedTeacherLinkTarget } from '@/types/user'
import type {
  PatchUserBasicInfoInput,
  PatchUserBasicInfoOptions,
} from '@/entities/user/api/user-service'
import { useUserStore } from '@/features/user/shared/model/user-store'
import {
  useUserDetailController,
  type MemberBasicInfoSavedOptions,
} from '@/features/user/detail/lib/use-user-detail-controller'
import { useUserDetailFullpageDerived } from '@/features/user/detail/lib/use-user-detail-fullpage-derived'
import {
  isAdminApprovalRequestsRemoteEnabled,
  isInstructorRoleRequestsRemoteEnabled,
  isMembersRemoteEnabled,
} from '@/features/user/api/member-remote-capabilities'
import { useInstructorRoleRequestMutations } from '@/features/user/api/hooks/use-instructor-role-request-mutations'
import { useAdminApprovalRequestMutations } from '@/features/user/api/hooks/use-admin-approval-request-mutations'
import { PermissionNotificationResendModal } from '@/features/user/permission-management/permission-notification-resend-modal'
import {
  mapPermissionApprovalStatusForResend,
  type PermissionNotificationResendApprovalStatus,
  type PermissionNotificationResendRole,
} from '@/features/user/permission-management/lib/permission-notification-resend'
import { toScheduledOnlyNotifyTiming } from '@/features/program/general/lib/application-decision-notify-timing'
import { isNotifyTimingSupported, NOTIFY_TIMING_CAPABILITY } from '@/shared/lib/notify-timing-capability'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
import { handleError } from '@/shared/utils/error-handler'
import { showNotificationResendRequestCompletedAlert, useCmsAlert } from '@/shared/ui'
import { useUserDetailModals } from '@/features/user/detail/lib/use-user-detail-modals'
import { UserDetailLayout } from '@/features/user/detail/ui/detail-info/user-detail-layout'
import { USER_BASIC_INFO_ENTRY_QUERY_KEY } from '@/features/user/detail/ui/user-basic-info/entry-resolver'
import {
  USER_DETAIL_AFFILIATED_SCHOOL_QUERY_KEY,
  USER_DETAIL_INSTRUCTOR_PROFILE_QUERY_KEY,
} from '@/features/user/detail/lib/teacher-detail-url-context'
import type { UserBasicInfoEntrySource } from '@/features/user/detail/ui/user-basic-info-section'
import './user-detail-modal.css'
import './user-detail-fullpage-modal.css'

export type {
  UserDetailLnbKey,
  UserDetailProgramsChildKey,
  TabState,
} from '@/features/user/detail/lib/user-detail-fullpage-helpers'
export type { UserDetailPermissionRole } from '@/features/user/detail/ui/detail-info/user-detail-fullpage-header-actions'

/** 회원 목록·풀페이지 공통 URL — 새로고침 시 하위 탭 유지 */
export const USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY = 'programsChild' as const

export type UserDetailFullPageModalMode = 'default' | 'permission'

export interface UserDetailFullPageModalProps {
  open: boolean
  user: Omit<User, 'password'> | null
  onClose: () => void
  onWithdraw?: (user: Omit<User, 'password'>, confirmInput?: string) => void | Promise<void>
  basicInfoEntrySource?: UserBasicInfoEntrySource
  mode?: UserDetailFullPageModalMode
  permissionRole?: UserDetailPermissionRole
  onPermissionApprove?: (ctx: { userId: string; permissionRole: UserDetailPermissionRole }) => void
  onPermissionReject?: (ctx: { userId: string; permissionRole: UserDetailPermissionRole }) => void
  onPermissionResetToPending?: (ctx: {
    userId: string
    permissionRole: UserDetailPermissionRole
    fromStatus: 'APPROVED' | 'REJECTED'
  }) => void
  onPermissionResendNotification?: (ctx: {
    userId: string
    permissionRole: UserDetailPermissionRole
  }) => void
  onNavigateToLinkedUser?: (target: AffiliatedTeacherLinkTarget) => void
  /** 저장 후 목록·드로어 등 상위가 동일 회원 객체를 갱신할 때 */
  onMemberBasicInfoSaved?: (
    user: Omit<User, 'password'>,
    options?: MemberBasicInfoSavedOptions
  ) => void
  /** 목록 상세 닫기 중 URL 동기화 차단 */
  detailCloseIntentRef?: MutableRefObject<boolean>
}

export function UserDetailFullPageModal({
  open,
  user,
  onClose,
  onWithdraw,
  basicInfoEntrySource,
  mode = 'default',
  permissionRole,
  onPermissionApprove,
  onPermissionReject,
  onPermissionResetToPending,
  onPermissionResendNotification,
  onNavigateToLinkedUser,
  onMemberBasicInfoSaved,
  detailCloseIntentRef,
}: UserDetailFullPageModalProps) {
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const modals = useUserDetailModals()
  const patchMemberBasicInfo = useCallback(
    (userId: string, patch: PatchUserBasicInfoInput, options?: PatchUserBasicInfoOptions) =>
      useUserStore.getState().patchUserBasicInfo(userId, patch, options),
    []
  )
  const { state, actions, derived } = useUserDetailController({
    open,
    displayUser: user,
    mode,
    programsChildQueryKey: USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY,
    basicInfoEntrySource,
    onWithdraw,
    modals,
    patchMemberBasicInfo,
    onMemberBasicInfoSaved,
    detailCloseIntentRef,
  })
  /** 원문 열람 중에만 컨트롤러의 일시 원문을 표시한다. 상위 user(목록·drawer)는 항상 마스킹 값이다. */
  const visibleUser = state.revealedUser ?? user

  const fullpageDerived = useUserDetailFullpageDerived({
    displayUser: visibleUser,
    tabState: state.tabState,
    applications: state.applications,
    enrollmentApplications: state.enrollmentApplications,
    mode,
    permissionRole,
  })
  const { showAlert } = useCmsAlert()
  const { resendNotificationMutation, getResendNotificationError } =
    useInstructorRoleRequestMutations()
  const {
    resendNotificationMutation: adminResendNotificationMutation,
    getResendNotificationError: getAdminResendNotificationError,
  } = useAdminApprovalRequestMutations()
  const [permissionNotificationResend, setPermissionNotificationResend] = useState<{
    userId: string
    displayName: string
    permissionRole: PermissionNotificationResendRole
    approvalStatus: PermissionNotificationResendApprovalStatus
  } | null>(null)

  const handlePermissionResendNotification = useCallback(
    (ctx: { userId: string; permissionRole: UserDetailPermissionRole }) => {
      if (onPermissionResendNotification) {
        onPermissionResendNotification(ctx)
        return
      }
      const approvalStatus = mapPermissionApprovalStatusForResend(user?.permissionApprovalStatus)
      if (approvalStatus == null) {
        showAlert({
          title: '안내',
          content: '승인·반려 상태에서만 알림을 재발송할 수 있습니다.',
        })
        return
      }
      setPermissionNotificationResend({
        userId: ctx.userId,
        displayName: user?.name?.trim() || '회원',
        permissionRole: ctx.permissionRole,
        approvalStatus,
      })
    },
    [onPermissionResendNotification, showAlert, user]
  )

  const handlePermissionNotificationResendConfirm = useCallback(
    async (payload: PermissionModalPayload) => {
      if (!permissionNotificationResend) return
      if (resendNotificationMutation.isPending || adminResendNotificationMutation.isPending) {
        return
      }
      if (!isNotifyTimingSupported(payload.notifyTiming, NOTIFY_TIMING_CAPABILITY.scheduledOnly)) {
        return
      }
      const notify = toScheduledOnlyNotifyTiming(payload.notifyTiming, payload.manualNotifyAt)
      const { permissionRole: role } = permissionNotificationResend

      if (role === 'instructor' && isInstructorRoleRequestsRemoteEnabled()) {
        const requestId = user?.instructorRoleRequestId
        if (requestId == null) {
          showAlert({
            title: '안내',
            content: '알림 재발송할 강사 권한 신청 ID가 회원 상세에 없습니다.',
          })
          return
        }
        try {
          await resendNotificationMutation.mutateAsync({ requestId, notify })
          setPermissionNotificationResend(null)
          showNotificationResendRequestCompletedAlert()
        } catch (error) {
          handleError(error, { defaultMessage: getResendNotificationError(error) })
        }
        return
      }

      if (role === 'admin' && isAdminApprovalRequestsRemoteEnabled()) {
        const adminAccountId = user?.adminAccountId
        if (adminAccountId == null) {
          showAlert({
            title: '안내',
            content: '알림 재발송할 관리자 신청 ID가 회원 상세에 없습니다.',
          })
          return
        }
        try {
          await adminResendNotificationMutation.mutateAsync({ adminAccountId, notify })
          setPermissionNotificationResend(null)
          showNotificationResendRequestCompletedAlert()
        } catch (error) {
          handleError(error, { defaultMessage: getAdminResendNotificationError(error) })
        }
        return
      }

      showAlert({
        title: '안내',
        content: '권한 알림 재발송 API를 사용할 수 없습니다.',
      })
    },
    [
      adminResendNotificationMutation,
      getAdminResendNotificationError,
      getResendNotificationError,
      permissionNotificationResend,
      resendNotificationMutation,
      showAlert,
      user?.adminAccountId,
      user?.instructorRoleRequestId,
    ]
  )

  const shell = useMemo((): UserDetailFullpageShellValue | null => {
    if (!open || !visibleUser || !fullpageDerived) return null
    return {
      mode,
      permissionRole,
      displayUser: visibleUser,
      tabState: state.tabState,
      derived: fullpageDerived,
      applications: state.applications,
      applicationsLoading: state.applicationsLoading,
      volunteerHistories: state.volunteerHistories,
      volunteerHistoriesLoading: state.volunteerHistoriesLoading,
      personalInfoRevealed: state.personalInfoRevealed,
      instructorResumeApplicantRow: derived.instructorResumeApplicantRow,
      basicInfoEntrySource,
      onNavigateToLinkedUser,
      modals,
      withdrawConfirmOpen: state.withdrawConfirmOpen,
      withdrawConfirmLoading: state.withdrawConfirmLoading,
      institutionDeleteBlockedOpen: state.institutionDeleteBlockedOpen,
      onCloseInstitutionDeleteBlocked: actions.closeInstitutionDeleteBlocked,
      onProgressStatusChange: actions.handleProgressStatusChange,
      onOpenLectureAttendance: actions.openLectureAttendance,
      onOpenAssignmentSubmission: actions.openAssignmentSubmission,
      onOpenEnrollmentProgramDetail: actions.openEnrollmentProgramDetail,
      onOpenVolunteerProgramDetail: actions.openVolunteerProgramDetail,
      onBeforeNavigateToProgramDetail: actions.prepareLeaveMemberDetailForProgramNavigation,
      onBulkDeleteHistory: actions.handleBulkDeleteHistory,
      onStudentCertificateBulkIssue: actions.handleStudentCertificateBulkIssue,
      onVolunteerCertificateBulkIssue: actions.handleVolunteerCertificateBulkIssue,
      onInstructorCertificateBulkIssue: actions.handleInstructorCertificateBulkIssue,
      progressStatusReadOnly: isMembersRemoteEnabled(),
      onWithdrawModalCancel: actions.closeWithdrawConfirm,
      onWithdrawModalConfirm: actions.handleWithdrawConfirm,
      basicInfoEditing: state.basicInfoEditing,
      basicInfoEditScope: state.basicInfoEditScope,
      basicInfoDraft: state.basicInfoDraft,
      basicInfoEmailError: state.basicInfoEmailError,
      basicInfoSaveLoading: state.basicInfoSaveLoading,
      adminCommentAllowEmpty: state.adminCommentAllowEmpty,
      adminPermissionVariantPatching: state.adminPermissionVariantPatching,
      instructorPermissionRevokeOpen: state.instructorPermissionRevokeOpen,
      jaGradeEvaluationOpen: state.jaGradeEvaluationOpen,
      onOpenJaGradeEvaluation: actions.openJaGradeEvaluation,
      onCloseJaGradeEvaluation: actions.closeJaGradeEvaluation,
      onCompleteJaGradeEvaluation: actions.completeJaGradeEvaluation,
      scheduleChangeCount: visibleUser.scheduleChangeCancelCount,
      onStartBasicInfoEdit: actions.startBasicInfoEdit,
      onStartAdminCommentEdit: actions.startAdminCommentEdit,
      onCancelBasicInfoEdit: actions.cancelBasicInfoEdit,
      onSaveBasicInfoEdit: actions.saveBasicInfoEdit,
      onBasicInfoDraftChange: actions.updateBasicInfoDraft,
      instructorEditDraftFlushRef: actions.instructorEditDraftFlushRef,
      onPatchAdminPermissionVariantFromDetailView: derived.canPatchAdminPermissionInDetailView
        ? actions.patchAdminPermissionVariantFromDetailView
        : undefined,
      onTeacherEmploymentStatusChange: actions.patchTeacherEmploymentStatus,
      onAffiliatedTeachersChanged: actions.refreshSchoolAfterAffiliatedTeachersChanged,
      onOpenInstructorPermissionRevoke: actions.openInstructorPermissionRevoke,
      onCloseInstructorPermissionRevoke: actions.closeInstructorPermissionRevoke,
      onConfirmInstructorPermissionRevoke: actions.confirmInstructorPermissionRevoke,
      onPermissionResendNotification: handlePermissionResendNotification,
    }
  }, [
    open,
    visibleUser,
    fullpageDerived,
    mode,
    permissionRole,
    state.tabState,
    state.applications,
    state.applicationsLoading,
    state.volunteerHistories,
    state.volunteerHistoriesLoading,
    state.personalInfoRevealed,
    state.withdrawConfirmOpen,
    state.withdrawConfirmLoading,
    state.institutionDeleteBlockedOpen,
    state.basicInfoEditing,
    state.basicInfoEditScope,
    state.basicInfoDraft,
    state.basicInfoEmailError,
    state.basicInfoSaveLoading,
    state.adminCommentAllowEmpty,
    state.adminPermissionVariantPatching,
    state.instructorPermissionRevokeOpen,
    state.jaGradeEvaluationOpen,
    actions.startBasicInfoEdit,
    actions.startAdminCommentEdit,
    actions.cancelBasicInfoEdit,
    actions.saveBasicInfoEdit,
    actions.updateBasicInfoDraft,
    actions.patchAdminPermissionVariantFromDetailView,
    actions.patchTeacherEmploymentStatus,
    actions.refreshSchoolAfterAffiliatedTeachersChanged,
    actions.openInstructorPermissionRevoke,
    actions.closeInstructorPermissionRevoke,
    actions.confirmInstructorPermissionRevoke,
    actions.openJaGradeEvaluation,
    actions.closeJaGradeEvaluation,
    actions.completeJaGradeEvaluation,
    handlePermissionResendNotification,
    derived.instructorResumeApplicantRow,
    derived.canPatchAdminPermissionInDetailView,
    basicInfoEntrySource,
    onNavigateToLinkedUser,
    modals,
    actions.handleProgressStatusChange,
    actions.openLectureAttendance,
    actions.openAssignmentSubmission,
    actions.openEnrollmentProgramDetail,
    actions.openVolunteerProgramDetail,
    actions.prepareLeaveMemberDetailForProgramNavigation,
    actions.handleBulkDeleteHistory,
    actions.handleStudentCertificateBulkIssue,
    actions.handleVolunteerCertificateBulkIssue,
    actions.handleInstructorCertificateBulkIssue,
    actions.closeWithdrawConfirm,
    actions.closeInstitutionDeleteBlocked,
    actions.handleWithdrawConfirm,
    onMemberBasicInfoSaved,
  ])

  if (!open) {
    return null
  }

  const displayUser = shell?.displayUser ?? null
  const title = displayUser
    ? userDetailModalTitle(displayUser, { mode, permissionRole })
    : userDetailModalLoadingTitle(mode, permissionRole)
  const activeSidebarItem = derived.sidebarItems.find(item => item.key === state.tabState.lnb)
  const activeChildItem = activeSidebarItem?.children?.find(
    child => child.key === state.tabState.child
  )
  const headerBreadcrumbItems = (() => {
    if (!displayUser) return []
    const listParams = buildSearchParams(searchParams, {
      delete: [
        'id',
        'lnb',
        USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY,
        USER_BASIC_INFO_ENTRY_QUERY_KEY,
        USER_DETAIL_AFFILIATED_SCHOOL_QUERY_KEY,
        USER_DETAIL_INSTRUCTOR_PROFILE_QUERY_KEY,
      ],
    })
    // 시안: 회원 권한 관리 › 권한 승인 › {강사|관리자} 권한 신청 › {이름}
    if (mode === 'permission') {
      return [
        { label: '회원 권한 관리' },
        makeBreadcrumbItem('권한 승인', location.pathname, listParams),
        makeBreadcrumbItem(
          permissionRole === 'admin' ? '관리자 권한 신청' : '강사 권한 신청',
          location.pathname,
          listParams
        ),
        { label: displayUser.name?.trim() || title },
      ]
    }
    const items = [makeBreadcrumbItem('회원 목록', location.pathname, listParams)]
    // 시안: 회원 목록 › {목록 종류} › {이름}
    const detailLabel = displayUser.name?.trim() || title
    const kind = normalizeMemberListKind(searchParams.get('kind'))
    items.push(makeBreadcrumbItem(MEMBER_LIST_KIND_LABELS[kind], location.pathname, listParams))
    // 시안: 학교(교사) 회원 › {학교명} › {교사명} — 소속 학교가 있는 교사·겸직 강사 상세
    // URL `affiliatedSchool`은 학교 내부 식별번호라 라벨로 쓰지 않는다 (QA-0106)
    const schoolName = displayUser.affiliatedSchoolName?.trim() || ''
    const schoolUserId = displayUser.affiliatedSchoolUserId
    if (kind === 'institutions' && schoolName && schoolUserId !== displayUser.id) {
      items.push(
        schoolUserId
          ? makeBreadcrumbItem(
              schoolName,
              location.pathname,
              buildSearchParams(searchParams, {
                delete: [
                  USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY,
                  USER_BASIC_INFO_ENTRY_QUERY_KEY,
                  USER_DETAIL_AFFILIATED_SCHOOL_QUERY_KEY,
                  USER_DETAIL_INSTRUCTOR_PROFILE_QUERY_KEY,
                  'memberId',
                  'memberRole',
                ],
                set: { id: schoolUserId, lnb: 'detail-info' },
              })
            )
          : { label: schoolName }
      )
    }

    if (!activeSidebarItem) {
      items.push({ label: detailLabel })
      return items
    }

    const detailParams = buildSearchParams(searchParams, {
      delete: ['lnb', USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY, USER_BASIC_INFO_ENTRY_QUERY_KEY],
      set: {
        id: displayUser.id,
        lnb: 'detail-info',
      },
    })
    const childParams = activeChildItem
      ? buildSearchParams(searchParams, {
          delete: [USER_BASIC_INFO_ENTRY_QUERY_KEY],
          set: {
            id: displayUser.id,
            lnb: state.tabState.lnb,
            [USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY]: activeChildItem.key,
          },
        })
      : null

    const isDefaultDetailTab = state.tabState.lnb === 'detail-info' && !activeChildItem
    if (isDefaultDetailTab) {
      items.push({ label: detailLabel })
      return items
    }
    items.push(makeBreadcrumbItem(detailLabel, location.pathname, detailParams))

    if (!activeChildItem) {
      items.push({ label: activeSidebarItem.label })
      return items
    }

    items.push(
      childParams
        ? makeBreadcrumbItem(activeChildItem.label, location.pathname, childParams)
        : { label: activeChildItem.label }
    )
    return items
  })()

  /**
   * 상세 GET 첫 응답 전에도 **같은 모달 인스턴스**를 유지한다.
   * 로딩 셸을 별도 컴포넌트로 렌더하면 포털이 교체되며 오픈 애니메이션이 두 번 재생된다.
   */
  return (
    <UserDetailFullpageShellProvider value={shell}>
      {state.personalInfoRevealModal}
      {state.editUnmaskConfirmModal}
      <UserDetailLayout
        open={open}
        onClose={onClose}
        title={title}
        loading={shell == null}
        permissionRequest={permissionRole != null}
        headerTrailing={
          shell ? <DetailFullpageBreadcrumb items={headerBreadcrumbItems} /> : undefined
        }
        sidebar={
          shell && displayUser ? (
            <DetailModalSidebar
              navAriaLabel={userDetailSidebarNavAriaLabel(mode, displayUser)}
              items={derived.sidebarItems}
              activeKey={state.tabState.lnb}
              activeChildKey={derived.sidebarActiveChildKey}
              expandedGroupKeys={derived.sidebarExpandedGroupKeys}
              onSelectTop={actions.handleSidebarSelectTop}
              onSelectChild={actions.handleSidebarSelectChild}
            />
          ) : null
        }
        header={
          shell && displayUser ? (
            <UserDetailFullPageHeaderActions
              mode={mode}
              permissionRole={permissionRole}
              displayUser={displayUser}
              tabState={state.tabState}
              personalInfoRevealed={state.personalInfoRevealed}
              onRequestPersonalInfoReveal={actions.openPersonalInfoRevealConfirm}
              onPermissionApprove={onPermissionApprove}
              onPermissionReject={onPermissionReject}
              onPermissionResetToPending={onPermissionResetToPending}
              onWithdraw={onWithdraw}
              onOpenWithdrawConfirm={actions.openWithdrawConfirm}
            />
          ) : null
        }
      >
        {shell ? <UserDetailFullpageTabPanels /> : null}
      </UserDetailLayout>

      {shell ? <UserDetailFullpageModalsStack /> : null}
      <PermissionNotificationResendModal
        open={permissionNotificationResend != null}
        permissionRole={permissionNotificationResend?.permissionRole ?? 'instructor'}
        userDisplayName={permissionNotificationResend?.displayName ?? ''}
        approvalStatus={permissionNotificationResend?.approvalStatus ?? 'approved'}
        confirmLoading={
          resendNotificationMutation.isPending || adminResendNotificationMutation.isPending
        }
        onCancel={() => {
          if (
            resendNotificationMutation.isPending ||
            adminResendNotificationMutation.isPending
          ) {
            return
          }
          setPermissionNotificationResend(null)
        }}
        onConfirm={handlePermissionNotificationResendConfirm}
      />
    </UserDetailFullpageShellProvider>
  )
}
