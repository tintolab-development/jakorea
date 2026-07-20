import { useSearchParams } from 'react-router-dom'
import type { User } from '@/types/user'
import { CmsButton } from '@/shared/ui/cms-button'
import {
  actionConfigToCmsVariant,
  getDefaultHeaderActions,
} from '@/features/user/detail/lib/get-default-header-actions'
import {
  resolveDefaultHeaderShellState,
  resolvePermissionHeaderEntry,
} from '@/features/user/detail/lib/user-detail-header-resolvers'
import type { TabState } from '../../lib/user-detail-fullpage-helpers'
import {
  usePersonalInfoToggle,
  type PersonalInfoToggleButtonConfig,
} from '@/features/user/detail/lib/use-personal-info-toggle'
import { PersonalInfoRevealButton } from '@/features/user/detail/ui/personal-info-reveal-button'
import { PermissionHeaderActions } from './permission-header-actions'
import { useUserDetailFullpageShell } from './user-detail-fullpage-shell-context'
import {
  parseUserBasicInfoEntryQuery,
  resolveUserBasicInfoBodyKey,
  USER_BASIC_INFO_ENTRY_QUERY_KEY,
} from '@/features/user/detail/ui/user-basic-info-section'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { isCmsAdminUser } from '@/features/user/shared/lib/admin-provisioned-member-policy'
import {
  isMemberBasicInfoPatchRemoteEnabled,
  isMembersRemoteEnabled,
} from '@/features/user/api/member-remote-capabilities'

export type UserDetailPermissionRole = 'instructor' | 'admin'

export interface UserDetailFullPageHeaderActionsProps {
  mode: 'default' | 'permission'
  permissionRole: UserDetailPermissionRole | undefined
  displayUser: Omit<User, 'password'>
  tabState: TabState
  personalInfoRevealed: boolean
  onRequestPersonalInfoReveal: () => void
  onPermissionApprove?: (ctx: { userId: string; permissionRole: UserDetailPermissionRole }) => void
  onPermissionReject?: (ctx: { userId: string; permissionRole: UserDetailPermissionRole }) => void
  onPermissionResetToPending?: (ctx: {
    userId: string
    permissionRole: UserDetailPermissionRole
    fromStatus: 'APPROVED' | 'REJECTED'
  }) => void
  onWithdraw?: (user: Omit<User, 'password'>) => void
  onOpenWithdrawConfirm: () => void
}

export type PermissionHeaderActionsProps = UserDetailFullPageHeaderActionsProps & {
  personalInfoButton: PersonalInfoToggleButtonConfig | null
}

export function UserDetailFullPageHeaderActions(props: UserDetailFullPageHeaderActionsProps) {
  const pageShell = useUserDetailFullpageShell()
  const [searchParams] = useSearchParams()
  const {
    mode,
    permissionRole,
    displayUser,
    tabState,
    personalInfoRevealed,
    onRequestPersonalInfoReveal,
    onWithdraw,
    onOpenWithdrawConfirm,
  } = props
  const currentUser = useAuthStore(state => state.user)

  const personalInfoButton = usePersonalInfoToggle({
    personalInfoRevealed,
    onRequestReveal: onRequestPersonalInfoReveal,
  })

  const permissionEntry = resolvePermissionHeaderEntry(mode, permissionRole)
  if (permissionEntry.enter) {
    return <PermissionHeaderActions {...props} personalInfoButton={personalInfoButton} />
  }

  const headerLayout = resolveDefaultHeaderShellState({ displayUser, tabState, onWithdraw })
  if (!headerLayout.visible) {
    return null
  }

  const actions = getDefaultHeaderActions({
    viewKind: headerLayout.viewKind,
    displayUser,
    onWithdraw: pageShell.basicInfoEditing ? undefined : onWithdraw,
    onOpenWithdrawConfirm,
    onOpenInstructorPermissionRevoke: pageShell.onOpenInstructorPermissionRevoke,
  })

  const entryFromQuery = parseUserBasicInfoEntryQuery(
    searchParams.get(USER_BASIC_INFO_ENTRY_QUERY_KEY)
  )
  const basicBodyKey = resolveUserBasicInfoBodyKey(
    pageShell.basicInfoEntrySource,
    entryFromQuery,
    displayUser.role
  )
  const canInlineEdit =
    basicBodyKey === 'all_users' ||
    basicBodyKey === 'institution' ||
    basicBodyKey === 'instructor' ||
    (basicBodyKey === 'admin' && isCmsAdminUser(currentUser))

  const remoteBasicInfoSaveBlocked =
    isMembersRemoteEnabled() && !isMemberBasicInfoPatchRemoteEnabled()

  const showInlineEditStart =
    !pageShell.basicInfoEditing && canInlineEdit && !remoteBasicInfoSaveBlocked

  const showInlineEditControls = pageShell.basicInfoEditing && canInlineEdit

  const inlineEditCluster = showInlineEditControls ? (
    <>
      <CmsButton
        key="basic-info-cancel"
        size="medium"
        variant="secondary"
        onClick={pageShell.onCancelBasicInfoEdit}
      >
        취소
      </CmsButton>
      <CmsButton
        key="basic-info-save"
        size="medium"
        variant="primary"
        loading={pageShell.basicInfoSaveLoading}
        onClick={() => {
          void pageShell.onSaveBasicInfoEdit()
        }}
      >
        저장
      </CmsButton>
    </>
  ) : showInlineEditStart ? (
    <CmsButton
      key="basic-info-edit"
      size="medium"
      variant="secondary"
      onClick={pageShell.onStartBasicInfoEdit}
    >
      정보 수정
    </CmsButton>
  ) : null

  const leadingSpaceNode = headerLayout.leadingSpace ? ' ' : null

  const personalInfoNode =
    !pageShell.basicInfoEditing && headerLayout.showPersonalInfoToggle && personalInfoButton ? (
      <PersonalInfoRevealButton
        labelMode="stickyReveal"
        revealed={personalInfoRevealed}
        cmsVariant={personalInfoButton.variant}
        cmsSize="medium"
        width={160}
        onClick={personalInfoButton.onClick}
      />
    ) : null

  const headerActionsForLayout = pageShell.basicInfoEditing
    ? actions.filter(a => a.key !== 'school-delete' && a.key !== 'withdraw')
    : actions

  const actionButtons = headerActionsForLayout.map(action => (
    <CmsButton
      size="medium"
      key={action.key}
      variant={actionConfigToCmsVariant(action.variant)}
      onClick={action.onClick}
    >
      {action.label}
    </CmsButton>
  ))

  return (
    <div className="info-section-buttons--wrapper">
      {leadingSpaceNode}
      {actionButtons}
      {inlineEditCluster}
      {personalInfoNode}
    </div>
  )
}
