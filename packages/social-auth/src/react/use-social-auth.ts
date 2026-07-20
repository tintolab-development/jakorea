import { useCallback, useState } from 'react'

import type { SocialAuthClient } from '../client'
import type { OAuthIntent, SocialProvider } from '../types'

export type SocialAuthHookStatus = 'idle' | 'redirecting' | 'error'

export interface UseSocialAuthOptions {
  client: SocialAuthClient
}

export function useSocialAuth({ client }: UseSocialAuthOptions) {
  const [status, setStatus] = useState<SocialAuthHookStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const startRedirect = useCallback(
    async (input: { provider: SocialProvider; intent: OAuthIntent; returnUrl?: string }) => {
      setStatus('redirecting')
      setErrorMessage(null)
      try {
        const url = await client.startLogin(input)
        window.location.assign(url)
      } catch (err) {
        setStatus('error')
        setErrorMessage(err instanceof Error ? err.message : '소셜 인증을 시작할 수 없습니다.')
      }
    },
    [client]
  )

  const resetError = useCallback(() => {
    setErrorMessage(null)
    setStatus('idle')
  }, [])

  return {
    startRedirect,
    status,
    errorMessage,
    resetError,
    isRedirecting: status === 'redirecting',
  }
}
