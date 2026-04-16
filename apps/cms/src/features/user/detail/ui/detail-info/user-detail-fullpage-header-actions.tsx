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
import { PermissionHeaderActions } from './permission-header-actions'
import { useUserDetailFullpageShell } from './user-detail-fullpage-shell-context'
import { shouldShowCmsMemberInfoEditButton } from '@/features/user/shared/lib/admin-provisioned-member-policy'
import {
  parseUserBasicInfoEntryQuery,
  resolveUserBasicInfoBodyKey,
  USER_BASIC_INFO_ENTRY_QUERY_KEY,
} from '@/features/user/detail/ui/user-basic-info-section'

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
    onWithdraw: pageShell.basicInfoEditing ? undefined : onWithdraw,
    onOpenWithdrawConfirm,
  })

  const entryFromQuery = parseUserBasicInfoEntryQuery(
    searchParams.get(USER_BASIC_INFO_ENTRY_QUERY_KEY)
  )
  const basicBodyKey = resolveUserBasicInfoBodyKey(
    pageShell.basicInfoEntrySource,
    entryFromQuery,
    displayUser.role
  )
  const showMemberInlineEdit =
    shouldShowCmsMemberInfoEditButton(displayUser) && basicBodyKey === 'all_users'

  const memberEditCluster = showMemberInlineEdit ? (
    pageShell.basicInfoEditing ? (
      <>
        <CmsButton
          key="member-info-cancel"
          size="medium"
          variant="secondary"
          onClick={pageShell.onCancelBasicInfoEdit}
        >
          취소
        </CmsButton>
        <CmsButton
          key="member-info-save"
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
    ) : (
      <CmsButton
        key="member-info-edit"
        size="medium"
        variant="secondary"
        onClick={pageShell.onStartBasicInfoEdit}
      >
        정보 수정
      </CmsButton>
    )
  ) : null

  const leadingSpaceNode = headerLayout.leadingSpace ? ' ' : null

  const personalInfoNode =
    !pageShell.basicInfoEditing && headerLayout.showPersonalInfoToggle && personalInfoButton ? (
      <CmsButton
        size="medium"
        width={160}
        variant={personalInfoButton.variant}
        onClick={personalInfoButton.onClick}
      >
        {personalInfoButton.label}
      </CmsButton>
    ) : null

  const actionButtons = actions.map(action => (
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
      {memberEditCluster}
      {personalInfoNode}
    </div>
  )
}
