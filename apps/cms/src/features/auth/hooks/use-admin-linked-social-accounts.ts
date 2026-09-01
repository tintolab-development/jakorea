import { useCallback, useEffect, useState } from 'react'
import type { SocialProvider } from '@jakorea/social-auth'
import { isLinkedSocialAccount } from '@jakorea/social-auth'

import { isSocialAdminSocialApiRemoteEnabled } from '@/features/auth/api/social-auth-remote-capabilities'
import { cmsSocialAuthClient } from '@/features/auth/social-auth/cms-client'
import { SOCIAL_PROVIDER_LABEL } from '@/entities/user/api/auth-service'

export function useAdminLinkedSocialAccounts(enabled = true) {
  const [linkedProviders, setLinkedProviders] = useState<SocialProvider[]>([])
  const [linkedLabels, setLinkedLabels] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const refresh = useCallback(async () => {
    if (!enabled || !isSocialAdminSocialApiRemoteEnabled() || !cmsSocialAuthClient.hasAccessToken()) {
      setLinkedProviders([])
      setLinkedLabels([])
      return
    }

    setLoading(true)
    try {
      const accounts = await cmsSocialAuthClient.listAllSocialAccounts()
      const providers = accounts.filter(isLinkedSocialAccount).map(account => account.provider)
      setLinkedProviders(providers)
      setLinkedLabels(providers.map(provider => SOCIAL_PROVIDER_LABEL[provider]))
    } catch (error: unknown) {
      console.debug('useAdminLinkedSocialAccounts listAccounts failed', error)
      setLinkedProviders([])
      setLinkedLabels([])
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { linkedProviders, linkedLabels, loading, refresh }
}
