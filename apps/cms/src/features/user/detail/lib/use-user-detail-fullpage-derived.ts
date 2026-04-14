import { useMemo } from 'react'
import type { Application } from '@/types/domain'
import type { User } from '@/types/user'
import {
  programsHistoryHasChildMenu,
  type TabState,
  type UserDetailProgramsChildKey,
} from '@/features/user/detail/lib/user-detail-fullpage-helpers'
import {
  roleStrategyMap,
  type UserDetailRoleStrategy,
  type UserDetailStrategySectionConfig,
} from '@/features/user/detail/strategies'

export interface UseUserDetailFullpageDerivedParams {
  displayUser: Omit<User, 'password'> | null
  tabState: TabState
  applications: Application[]
  enrollmentApplications: Application[]
}

export interface UserDetailFullpageDerived {
  strategy: UserDetailRoleStrategy
  sections: UserDetailStrategySectionConfig
  enrollmentTableRows: Application[]
  resolvedProgramsChild: UserDetailProgramsChildKey
}

/** 역할 전략·URL 탭에 따른 파생 데이터만 계산 (UI 없음) */
export function useUserDetailFullpageDerived({
  displayUser,
  tabState,
  applications,
  enrollmentApplications,
}: UseUserDetailFullpageDerivedParams): UserDetailFullpageDerived | null {
  return useMemo(() => {
    if (!displayUser) return null

    const strategyCtx = { displayUser, applications, enrollmentApplications }
    const strategy = roleStrategyMap[displayUser.role]
    const sections = strategy.getSections(strategyCtx)
    const enrollmentTableRows = strategy.getEnrollmentRows(strategyCtx)
    const resolvedProgramsChild =
      tabState.lnb === 'history' && programsHistoryHasChildMenu(displayUser)
        ? (tabState.child ?? 'enrollment')
        : 'enrollment'

    return {
      strategy,
      sections,
      enrollmentTableRows,
      resolvedProgramsChild,
    }
  }, [displayUser, tabState.lnb, tabState.child, applications, enrollmentApplications])
}
