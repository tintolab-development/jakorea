import { useCallback, useEffect, useState } from 'react'

import type { SocialProvider } from '@jakorea/social-auth'

import { isSocialAdminSocialApiRemoteEnabled } from '@/features/auth/api/social-auth-remote-capabilities'
import {
  getConnectedProviders,
  setRegisterSocialLinkIntent,
} from '@/features/auth/lib/register-social-connect-state'
import { cmsSocialAuthClient } from '@/features/auth/social-auth/cms-client'
import { CmsButton } from '@/shared/ui/cms-button'
import { handleError } from '@/shared/utils/error-handler'

import { SocialConnectProviderIcon } from './admin-register/social-connect-provider-icon'
import './social-connect-provider-list.css'

const SOCIAL_CONNECT_PROVIDERS: SocialProvider[] = ['google', 'naver', 'kakao']

const SOCIAL_CONNECT_DISPLAY_NAME: Record<SocialProvider, string> = {
  google: 'Google',
  naver: '네이버',
  kakao: '카카오',
}

interface SocialConnectProviderListProps {
  redirectPath?: string
  onConnectSuccess?: (provider: SocialProvider) => void
  className?: string
}

function mergeConnectedProviders(
  sessionProviders: Set<SocialProvider>,
  remoteProviders: SocialProvider[]
): Set<SocialProvider> {
  const next = new Set(sessionProviders)
  for (const provider of remoteProviders) {
    next.add(provider)
  }
  return next
}

export function SocialConnectProviderList({
  redirectPath,
  onConnectSuccess: _onConnectSuccess,
  className,
}: SocialConnectProviderListProps) {
  const [connectedProviders, setConnectedProviders] = useState<Set<SocialProvider>>(
    () => getConnectedProviders()
  )
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null)
  const [loadingAccounts, setLoadingAccounts] = useState(false)

  const syncConnectedProviders = useCallback(async () => {
    const sessionProviders = getConnectedProviders()

    if (!isSocialAdminSocialApiRemoteEnabled() || !cmsSocialAuthClient.hasAccessToken()) {
      setConnectedProviders(sessionProviders)
      return
    }

    setLoadingAccounts(true)
    try {
      const accounts = await cmsSocialAuthClient.listAccounts()
      const remoteProviders = accounts.map(account => account.provider)
      const merged = mergeConnectedProviders(sessionProviders, remoteProviders)
      setConnectedProviders(merged)
      for (const provider of remoteProviders) {
        cmsSocialAuthClient.state.addConnectedProvider(provider)
      }
    } catch (error: unknown) {
      console.debug('socialConnectProviderList listAccounts failed', error)
      setConnectedProviders(sessionProviders)
    } finally {
      setLoadingAccounts(false)
    }
  }, [])

  useEffect(() => {
    void syncConnectedProviders()
  }, [syncConnectedProviders])

  const handleConnect = (provider: SocialProvider) => {
    setLoadingProvider(provider)
    setRegisterSocialLinkIntent(redirectPath)
    void cmsSocialAuthClient
      .startLogin({ provider, intent: 'link', returnUrl: redirectPath })
      .then(url => {
        window.location.assign(url)
      })
      .catch((error: unknown) => {
        handleError(error, { context: 'socialConnectProviderList.connect' })
        setLoadingProvider(null)
      })
  }

  const handleDisconnect = (provider: SocialProvider) => {
    void (async () => {
      if (isSocialAdminSocialApiRemoteEnabled() && cmsSocialAuthClient.hasAccessToken()) {
        try {
          await cmsSocialAuthClient.unlinkAccount(provider)
        } catch (error: unknown) {
          handleError(error, { context: 'socialConnectProviderList.unlink' })
          return
        }
      }

      cmsSocialAuthClient.state.removeConnectedProvider(provider)
      cmsSocialAuthClient.state.removePendingSocialLink(provider)
      setConnectedProviders(prev => {
        const next = new Set(prev)
        next.delete(provider)
        return next
      })
    })()
  }

  const rootClassName = ['social-connect-provider-list', className].filter(Boolean).join(' ')

  return (
    <div className={rootClassName}>
      <div className="social-connect-provider-list__divider" role="separator">
        <span>연결할 소셜 계정을 선택해 주세요</span>
      </div>

      <ul
        className="social-connect-provider-list__list"
        aria-label="소셜 계정 연결 목록"
        aria-busy={loadingAccounts}
      >
        {SOCIAL_CONNECT_PROVIDERS.map(provider => {
          const isConnected = connectedProviders.has(provider)
          const isLoading = loadingProvider === provider

          return (
            <li key={provider} className="social-connect-provider-list__item">
              <SocialConnectProviderIcon provider={provider} />
              <p className="social-connect-provider-list__label">
                <span className="social-connect-provider-list__provider-name">
                  {SOCIAL_CONNECT_DISPLAY_NAME[provider]}
                </span>
                <span className="social-connect-provider-list__label-separator" aria-hidden>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="2"
                    height="2"
                    viewBox="0 0 2 2"
                    fill="none"
                  >
                    <circle cx="1" cy="1" r="1" fill="#85969D" />
                  </svg>
                </span>
                <span
                  className={
                    isConnected
                      ? 'social-connect-provider-list__status social-connect-provider-list__status--connected'
                      : 'social-connect-provider-list__status'
                  }
                >
                  {isConnected ? '연결됨' : '연결되지 않음'}
                </span>
              </p>
              <CmsButton
                variant="default"
                size="small"
                className="social-connect-provider-list__action-btn cms-button--no-label-ellipsis"
                loading={isLoading}
                disabled={(loadingProvider !== null && !isLoading) || loadingAccounts}
                onClick={() => (isConnected ? handleDisconnect(provider) : handleConnect(provider))}
              >
                {isConnected ? '해제하기' : '연결하기'}
              </CmsButton>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
