import { useEffect, useState } from 'react'
import { usePortalProfileQuery } from '@/features/auth/sign-in'
import { getAccessToken } from '@/shared/lib/auth-token'
import { isRemoteApiConfigured } from '@/shared/lib/api-remote-env'
import { mapPortalProfileToAdminRegisteredWizardPartial } from '../lib/map-portal-profile-to-wizard'
import {
  getAdminRegisteredWizardState,
  updateAdminRegisteredWizardState,
  type AdminRegisteredWizardState,
} from '../model/wizard-state'

/**
 * 관리자 등록 온보딩 — 로그인 세션의 포털 프로필을 wizard에 반영.
 * 확인·수정 화면에서 가입 정보 표시에 사용한다.
 *
 * `initial`은 매 렌더 JSON.parse로 새 참조가 될 수 있으므로
 * effect 의존성은 `email` 등 안정적인 값만 사용한다.
 */
export function useAdminRegisteredProfileHydration(initial: AdminRegisteredWizardState | null) {
  const [wizardState, setWizardState] = useState<AdminRegisteredWizardState | null>(initial)
  const email = initial?.email?.trim() ?? ''
  const remote = isRemoteApiConfigured()
  const hasToken = Boolean(getAccessToken())
  const needsHydration = Boolean(email) && !wizardState?.profileHydrated
  const shouldFetch = remote && hasToken && needsHydration

  const profileQuery = usePortalProfileQuery({ enabled: shouldFetch })

  useEffect(() => {
    if (!email) return
    setWizardState(getAdminRegisteredWizardState())
  }, [email])

  useEffect(() => {
    if (!profileQuery.data) return

    const current = getAdminRegisteredWizardState()
    if (!current) return

    if (current.profileHydrated) {
      setWizardState(prev => (prev?.profileHydrated ? prev : current))
      return
    }

    const next = updateAdminRegisteredWizardState(
      mapPortalProfileToAdminRegisteredWizardPartial(profileQuery.data, current),
    )
    if (next) {
      setWizardState(next)
    }
  }, [profileQuery.data])

  const isHydrating = shouldFetch && (profileQuery.isLoading || profileQuery.isFetching)

  return {
    wizardState: wizardState ?? initial,
    isHydrating,
    isError: shouldFetch && profileQuery.isError,
    refetch: profileQuery.refetch,
  }
}
