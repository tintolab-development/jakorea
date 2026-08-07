/**
 * 회원 상세 풀페이지 모달
 * 전체 회원 목록 행 클릭 시 프로그램 상세와 동일한 LNB+메인 레이아웃으로 노출
 */

import { useCallback, useMemo, type MutableRefObject } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { DetailModalSidebar } from '@/shared/ui/detail-modal-sidebar'
import { DetailFullpageBreadcrumb } from '@/shared/ui/detail-fullpage-breadcrumb'
import {
  buildSearchParams,
  makeBreadcrumbItem,
} from '@/shared/lib/detail-fullpage-query-stack'
import {
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
import { useUserDetailModals } from '@/features/user/detail/lib/use-user-detail-modals'
import { UserDetailLayout } from '@/features/user/detail/ui/detail-info/user-detail-layout'
import { USER_BASIC_INFO_ENTRY_QUERY_KEY } from '@/features/user/detail/ui/user-basic-info/entry-resolver'
import {
  USER_DETAIL_AFFILIATED_SCHOOL_QUERY_KEY,
  USER_DETAIL_INSTRUCTOR_PROFILE_QUERY_KEY,
} from '@/features/user/detail/lib/teacher-detail-url-context'
import type { UserBasicInfoEntrySource } from '@/features/user/detail/ui/user-basic-info-section'
import './user-detail-modal.css'

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
  onWithdraw?: (user: Omit<User, 'password'>) => void
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

  const fullpageDerived = useUserDetailFullpageDerived({
    displayUser: user,
    tabState: state.tabState,
    applications: state.applications,
    enrollmentApplications: state.enrollmentApplications,
  })

  const shell = useMemo((): UserDetailFullpageShellValue | null => {
    if (!open || !user || !fullpageDerived) return null
    return {
      mode,
      permissionRole,
      displayUser: user,
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
      institutionDeleteBlockedOpen: state.institutionDeleteBlockedOpen,
      onCloseInstitutionDeleteBlocked: actions.closeInstitutionDeleteBlocked,
      onProgressStatusChange: actions.handleProgressStatusChange,
      onOpenLectureAttendance: actions.openLectureAttendance,
      onOpenAssignmentSubmission: actions.openAssignmentSubmission,
      onOpenEnrollmentProgramDetail: actions.openEnrollmentProgramDetail,
      onWithdrawModalCancel: actions.closeWithdrawConfirm,
      onWithdrawModalConfirm: actions.handleWithdrawConfirm,
      basicInfoEditing: state.basicInfoEditing,
      basicInfoEditScope: state.basicInfoEditScope,
      basicInfoDraft: state.basicInfoDraft,
      basicInfoSaveLoading: state.basicInfoSaveLoading,
      adminPermissionVariantPatching: state.adminPermissionVariantPatching,
      instructorPermissionRevokeOpen: state.instructorPermissionRevokeOpen,
      jaGradeEvaluationOpen: state.jaGradeEvaluationOpen,
      onOpenJaGradeEvaluation: actions.openJaGradeEvaluation,
      onCloseJaGradeEvaluation: actions.closeJaGradeEvaluation,
      onCompleteJaGradeEvaluation: actions.completeJaGradeEvaluation,
      scheduleChangeCount: undefined,
      onStartBasicInfoEdit: actions.startBasicInfoEdit,
      onStartAdminCommentEdit: actions.startAdminCommentEdit,
      onCancelBasicInfoEdit: actions.cancelBasicInfoEdit,
      onSaveBasicInfoEdit: actions.saveBasicInfoEdit,
      onBasicInfoDraftChange: actions.updateBasicInfoDraft,
      onPatchAdminPermissionVariantFromDetailView: derived.canPatchAdminPermissionInDetailView
        ? actions.patchAdminPermissionVariantFromDetailView
        : undefined,
      onOpenInstructorPermissionRevoke: actions.openInstructorPermissionRevoke,
      onCloseInstructorPermissionRevoke: actions.closeInstructorPermissionRevoke,
      onConfirmInstructorPermissionRevoke: actions.confirmInstructorPermissionRevoke,
      onPermissionResendNotification,
    }
  }, [
    open,
    user,
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
    state.institutionDeleteBlockedOpen,
    state.basicInfoEditing,
    state.basicInfoEditScope,
    state.basicInfoDraft,
    state.basicInfoSaveLoading,
    state.adminPermissionVariantPatching,
    state.instructorPermissionRevokeOpen,
    state.jaGradeEvaluationOpen,
    actions.startBasicInfoEdit,
    actions.startAdminCommentEdit,
    actions.cancelBasicInfoEdit,
    actions.saveBasicInfoEdit,
    actions.updateBasicInfoDraft,
    actions.patchAdminPermissionVariantFromDetailView,
    actions.openInstructorPermissionRevoke,
    actions.closeInstructorPermissionRevoke,
    actions.confirmInstructorPermissionRevoke,
    actions.openJaGradeEvaluation,
    actions.closeJaGradeEvaluation,
    actions.completeJaGradeEvaluation,
    onPermissionResendNotification,
    derived.instructorResumeApplicantRow,
    derived.canPatchAdminPermissionInDetailView,
    basicInfoEntrySource,
    onNavigateToLinkedUser,
    modals,
    actions.handleProgressStatusChange,
    actions.openLectureAttendance,
    actions.openAssignmentSubmission,
    actions.openEnrollmentProgramDetail,
    actions.closeWithdrawConfirm,
    actions.closeInstitutionDeleteBlocked,
    actions.handleWithdrawConfirm,
    onMemberBasicInfoSaved,
  ])

  if (!shell) {
    return null
  }

  const { displayUser } = shell
  const title = userDetailModalTitle(displayUser)
  const activeSidebarItem = derived.sidebarItems.find(item => item.key === state.tabState.lnb)
  const activeChildItem = activeSidebarItem?.children?.find(
    child => child.key === state.tabState.child
  )
  const headerBreadcrumbItems = (() => {
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
    const items = [makeBreadcrumbItem('회원 목록', location.pathname, listParams)]

    if (!activeSidebarItem) {
      items.push({ label: title })
      return items
    }

    const detailParams = buildSearchParams(searchParams, {
      delete: [
        'lnb',
        USER_DETAIL_PROGRAMS_CHILD_QUERY_KEY,
        USER_BASIC_INFO_ENTRY_QUERY_KEY,
      ],
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

    items.push(makeBreadcrumbItem(title, location.pathname, detailParams))

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

  return (
    <UserDetailFullpageShellProvider value={shell}>
      {state.personalInfoRevealModal}
      {state.editUnmaskConfirmModal}
      <UserDetailLayout
        open={open}
        onClose={onClose}
        title={title}
        headerTrailing={<DetailFullpageBreadcrumb items={headerBreadcrumbItems} />}
        sidebar={
          <DetailModalSidebar
            navAriaLabel={userDetailSidebarNavAriaLabel(mode, displayUser)}
            items={derived.sidebarItems}
            activeKey={state.tabState.lnb}
            activeChildKey={derived.sidebarActiveChildKey}
            expandedGroupKeys={derived.sidebarExpandedGroupKeys}
            onSelectTop={actions.handleSidebarSelectTop}
            onSelectChild={actions.handleSidebarSelectChild}
          />
        }
        header={
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
        }
      >
        <UserDetailFullpageTabPanels />
      </UserDetailLayout>

      <UserDetailFullpageModalsStack />
    </UserDetailFullpageShellProvider>
  )
}
