import { useEffect, useState } from 'react'
import type { SocialProvider } from '@jakorea/social-auth'
import {
  isPortalSocialAuthLinkRemoteEnabled,
  platformSocialAuthClient,
} from '@/features/auth/social-auth'
import { getAccessToken } from '@/shared/lib'

export function useSettingsLinkedSocialProviders(isRemoteSession: boolean): string[] | undefined {
  const [providers, setProviders] = useState<string[] | undefined>(undefined)
  const remote = isRemoteSession && isPortalSocialAuthLinkRemoteEnabled() && Boolean(getAccessToken())

  useEffect(() => {
    if (!remote) {
      setProviders(undefined)
      return
    }

    let cancelled = false
    void platformSocialAuthClient
      .listAccounts()
      .then(accounts => {
        if (cancelled) return
        const connected = accounts.map(account => account.provider as SocialProvider)
        setProviders(connected)
      })
      .catch(() => {
        if (!cancelled) setProviders([])
      })

    return () => {
      cancelled = true
    }
  }, [remote])

  return providers
}
