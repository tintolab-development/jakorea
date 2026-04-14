import type { User } from '@/types/user'
import type { TabState } from '@/features/user/detail/lib/user-detail-fullpage-helpers'
import {
  getUserDetailHeaderEffectiveProgramsChild,
  shouldShowHeaderActions,
} from '@/features/user/detail/lib/should-show-header-actions'

export type PermissionQueueRole = 'instructor' | 'admin'

export function resolvePermissionHeaderEntry(
  mode: 'default' | 'permission',
  permissionRole: PermissionQueueRole | undefined
): { enter: false } | { enter: true; permissionRole: PermissionQueueRole } {
  if (mode !== 'permission' || !permissionRole) {
    return { enter: false }
  }
  return { enter: true, permissionRole }
}

export type DefaultHeaderViewKind = 'school_delete' | 'standard'

export type DefaultHeaderShellState =
  | { visible: false }
  | {
      visible: true
      viewKind: DefaultHeaderViewKind
      leadingSpace: boolean
      showPersonalInfoToggle: boolean
    }

export function resolveDefaultHeaderShellState(params: {
  displayUser: Omit<User, 'password'>
  tabState: TabState
  onWithdraw?: (user: Omit<User, 'password'>) => void
}): DefaultHeaderShellState {
  const { displayUser, tabState, onWithdraw } = params

  const effectiveProgramsChild = getUserDetailHeaderEffectiveProgramsChild(displayUser, tabState)

  if (
    !shouldShowHeaderActions({
      role: displayUser.role,
      tabState,
      effectiveProgramsChild,
    })
  ) {
    return { visible: false }
  }

  if (displayUser.role === 'SCHOOL' && !onWithdraw) {
    return { visible: false }
  }

  const schoolWithWithdraw = displayUser.role === 'SCHOOL' && Boolean(onWithdraw)
  const viewKind: DefaultHeaderViewKind = schoolWithWithdraw ? 'school_delete' : 'standard'

  return {
    visible: true,
    viewKind,
    leadingSpace: viewKind === 'school_delete',
    showPersonalInfoToggle: viewKind === 'standard',
  }
}
