import type { User } from '@/types/user'
import {
  programsHistoryHasChildMenu,
  type TabState,
  type UserDetailProgramsChildKey,
} from '@/features/user/detail/lib/user-detail-fullpage-helpers'

export function getUserDetailHeaderEffectiveProgramsChild(
  displayUser: Omit<User, 'password'>,
  tabState: TabState
): UserDetailProgramsChildKey | undefined {
  if (!programsHistoryHasChildMenu(displayUser)) return undefined
  if (tabState.lnb !== 'history') return undefined
  return tabState.child ?? 'enrollment'
}

export function shouldShowHeaderActions(ctx: {
  role: User['role']
  tabState: TabState
  effectiveProgramsChild?: string
}): boolean {
  const { role, tabState, effectiveProgramsChild } = ctx

  if (tabState.lnb === 'payment-status') {
    return false
  }

  if (tabState.lnb === 'history' && effectiveProgramsChild === 'volunteer') {
    return false
  }

  if (role === 'INDIVIDUAL' && tabState.lnb === 'history' && effectiveProgramsChild === 'enrollment') {
    return false
  }

  if (role === 'INSTRUCTOR' && tabState.lnb === 'history' && effectiveProgramsChild === 'lecture') {
    return false
  }

  if (role === 'ADMIN' && tabState.lnb === 'history') {
    return false
  }

  return true
}
