import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  isSocialProvider,
  processAdminSsoLinkReturn,
  fromApiProviderCode,
  type SocialProvider,
} from '@jakorea/social-auth'
import {
  isPortalSocialAuthLinkRemoteEnabled,
  platformSocialAuthClient,
} from '@/features/auth/social-auth'
import { PFText } from '@/shared/ui'
import styles from './callback.module.css'

const COMPLETE_PATH = '/auth/sign-up/social-connect/complete'
const ERROR_PATH = '/auth/sign-up/social-connect/error'
const CONNECT_PATH = '/auth/sign-up/social-connect'

function resolveProvider(params: URLSearchParams): SocialProvider | null {
  const providerParam = params.get('provider')
  if (providerParam && isSocialProvider(providerParam)) {
    return providerParam
  }
  if (providerParam) {
    return fromApiProviderCode(providerParam)
  }
  return null
}

export function SignUpSocialConnectCallbackPage() {
  const navigate = useNavigate()
  const startedRef = useRef(false)

  useEffect(() => {
    if (startedRef.current) {
      return
    }
    startedRef.current = true

    const execute = async () => {
      if (!isPortalSocialAuthLinkRemoteEnabled()) {
        navigate(CONNECT_PATH, { replace: true })
        return
      }

      const params = new URLSearchParams(window.location.search)
      const provider = resolveProvider(params)

      if (params.get('error')) {
        const cancelled =
          params.get('error') === 'access_denied' || params.get('error') === 'user_cancelled'
        if (cancelled) {
          navigate(CONNECT_PATH, { replace: true })
          return
        }
        const normalized = (params.get('error') ?? '').toUpperCase()
        const alreadyLinked =
          normalized.includes('ALREADY_LINKED') || normalized.includes('ALREADY_CONNECTED')
        navigate(
          `${ERROR_PATH}?reason=${alreadyLinked ? 'already-linked' : 'connection-failed'}`,
          { replace: true }
        )
        return
      }

      const outcome = await processAdminSsoLinkReturn(
        platformSocialAuthClient,
        provider,
        params,
        {
          consent: {
            socialConsentVersion: '1.0',
            socialConsentAgreed: true,
          },
        }
      )

      if (outcome.kind === 'linked') {
        navigate(COMPLETE_PATH, { replace: true })
        return
      }
      if (outcome.kind === 'cancelled') {
        navigate(CONNECT_PATH, { replace: true })
        return
      }

      // Portal BE가 query 없이 return만 하는 경우 — 목록 조회로 연결 여부 확인
      if (provider) {
        try {
          const accounts = await platformSocialAuthClient.listAccounts()
          if (accounts.some(account => account.provider === provider)) {
            platformSocialAuthClient.state.addConnectedProvider(provider)
            navigate(COMPLETE_PATH, { replace: true })
            return
          }
        } catch {
          // fall through
        }
      }

      if (outcome.kind === 'failed') {
        const alreadyLinked =
          outcome.message.includes('이미 연결') ||
          outcome.message.toUpperCase().includes('ALREADY_LINKED')
        navigate(
          `${ERROR_PATH}?reason=${alreadyLinked ? 'already-linked' : 'connection-failed'}`,
          { replace: true }
        )
        return
      }

      navigate(`${ERROR_PATH}?reason=connection-failed`, { replace: true })
    }

    void execute().catch(() => {
      navigate(`${ERROR_PATH}?reason=connection-failed`, { replace: true })
    })
  }, [navigate])

  return (
    <section className={styles.loading}>
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-500">
        소셜 계정 연결 처리 중…
      </PFText>
    </section>
  )
}
