import type { Dispatch, SetStateAction } from 'react'
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

export type UserDetailPermissionRole = 'instructor' | 'admin'

export interface UserDetailFullPageHeaderActionsProps {
  mode: 'default' | 'permission'
  permissionRole: UserDetailPermissionRole | undefined
  displayUser: Omit<User, 'password'>
  tabState: TabState
  personalInfoRevealed: boolean
  setPersonalInfoRevealed: Dispatch<SetStateAction<boolean>>
  onPermissionApprove?: (ctx: { userId: string; permissionRole: UserDetailPermissionRole }) => void
  onPermissionReject?: (ctx: { userId: string; permissionRole: UserDetailPermissionRole }) => void
  onWithdraw?: (user: Omit<User, 'password'>) => void
  onEdit?: (user: Omit<User, 'password'>) => void
  onOpenWithdrawConfirm: () => void
}

export type PermissionHeaderActionsProps = UserDetailFullPageHeaderActionsProps & {
  personalInfoButton: PersonalInfoToggleButtonConfig
}

export function UserDetailFullPageHeaderActions(props: UserDetailFullPageHeaderActionsProps) {
  const {
    mode,
    permissionRole,
    displayUser,
    tabState,
    personalInfoRevealed,
    setPersonalInfoRevealed,
    onWithdraw,
    onEdit,
    onOpenWithdrawConfirm,
  } = props

  const personalInfoButton = usePersonalInfoToggle({
    personalInfoRevealed,
    setPersonalInfoRevealed,
  })

  const permissionEntry = resolvePermissionHeaderEntry(mode, permissionRole)
  if (permissionEntry.enter) {
    return <PermissionHeaderActions {...props} personalInfoButton={personalInfoButton} />
  }

  const shell = resolveDefaultHeaderShellState({ displayUser, tabState, onWithdraw })
  if (!shell.visible) {
    return null
  }

  const actions = getDefaultHeaderActions({
    viewKind: shell.viewKind,
    displayUser,
    onWithdraw,
    onEdit,
    onOpenWithdrawConfirm,
  })

  const leadingSpaceNode = shell.leadingSpace ? ' ' : null

  const personalInfoNode = shell.showPersonalInfoToggle ? (
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
    <>
      <div className="info-section-title">기본정보</div>
      <div className="info-section-buttons--wrapper">
        {leadingSpaceNode}
        {actionButtons}
        {personalInfoNode}
      </div>
    </>
  )
}
