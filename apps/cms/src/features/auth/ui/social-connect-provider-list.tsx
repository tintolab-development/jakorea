import { useCallback, useEffect, useState } from 'react'

import type { SocialProvider } from '@jakorea/social-auth'
import { isLinkedSocialAccount } from '@jakorea/social-auth'

import { isSocialAdminSocialApiRemoteEnabled } from '@/features/auth/api/social-auth-remote-capabilities'
import {
  getConnectedProviders,
  setRegisterSocialLinkIntent,
  shouldSkipUnauthenticatedSocialConnectStart,
} from '@/features/auth/lib/register-social-connect-state'
import { getSignupSocialLinkToken } from '@/features/auth/lib/signup-social-link-handoff'
import { showSocialConnectUnlinkCompletedAlert } from '@/features/auth/lib/show-social-connect-unlink-completed-alert'
import { getSocialConnectUnlinkConfirmContent } from '@/features/auth/lib/social-connect-unlink-copy'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { cmsSocialAuthClient } from '@/features/auth/social-auth/cms-client'
import { CmsButton } from '@/shared/ui/cms-button'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import { ConfirmModal } from '@/shared/ui/confirm-modal'
import { handleError } from '@/shared/utils/error-handler'

import { SOCIAL_ACCOUNT_LINK_ENABLED } from '@/features/auth/lib/social-account-link-enabled'
import { SocialConnectConsentModal } from '@/features/auth/ui/social-connect-consent-modal'

import { SocialConnectProviderIcon } from './admin-register/social-connect-provider-icon'
import './social-connect-provider-list.css'

const SOCIAL_CONNECT_PROVIDERS: SocialProvider[] = ['google', 'naver', 'kakao']

const SOCIAL_CONNECT_DISPLAY_NAME: Record<SocialProvider, string> = {
  google: 'Google',
  naver: '네이버',
  kakao: '카카오',
}

function hasCmsAccessToken(): boolean {
  if (cmsSocialAuthClient.hasAccessToken()) return true
  return Boolean(useAuthStore.getState().token)
}

function socialConnectFailureMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim()) return error.message
  return '소셜 계정 연결을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요.'
}

function syncSessionConnectedProviders(providers: Set<SocialProvider>) {
  for (const provider of SOCIAL_CONNECT_PROVIDERS) {
    if (providers.has(provider)) {
      cmsSocialAuthClient.state.addConnectedProvider(provider)
    } else {
      cmsSocialAuthClient.state.removeConnectedProvider(provider)
      cmsSocialAuthClient.state.removePendingSocialLink(provider)
    }
  }
}

interface SocialConnectProviderListProps {
  redirectPath?: string
  onConnectSuccess?: (provider: SocialProvider) => void
  className?: string
}

export function SocialConnectProviderList(props: SocialConnectProviderListProps) {
  if (!SOCIAL_ACCOUNT_LINK_ENABLED) {
    return null
  }
  return <SocialConnectProviderListInner {...props} />
}

function SocialConnectProviderListInner({
  redirectPath,
  onConnectSuccess: _onConnectSuccess,
  className,
}: SocialConnectProviderListProps) {
  const remoteEnabled = isSocialAdminSocialApiRemoteEnabled()
  const [connectedProviders, setConnectedProviders] = useState<Set<SocialProvider>>(() =>
    remoteEnabled ? new Set() : getConnectedProviders()
  )
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null)
  const [loadingAccounts, setLoadingAccounts] = useState(false)
  const [unlinkTarget, setUnlinkTarget] = useState<SocialProvider | null>(null)
  const [unlinkLoading, setUnlinkLoading] = useState(false)
  const [connectConsentTarget, setConnectConsentTarget] = useState<SocialProvider | null>(null)

  const syncConnectedProviders = useCallback(async () => {
    if (!remoteEnabled || !cmsSocialAuthClient.hasAccessToken()) {
      setConnectedProviders(getConnectedProviders())
      return
    }

    setLoadingAccounts(true)
    try {
      const accounts = await cmsSocialAuthClient.listAllSocialAccounts()
      const remoteLinked = new Set(
        accounts.filter(isLinkedSocialAccount).map(account => account.provider)
      )
      setConnectedProviders(remoteLinked)
      syncSessionConnectedProviders(remoteLinked)
    } catch (error: unknown) {
      console.debug('socialConnectProviderList listAllSocialAccounts failed', error)
      setConnectedProviders(new Set())
      syncSessionConnectedProviders(new Set())
    } finally {
      setLoadingAccounts(false)
    }
  }, [remoteEnabled])

  useEffect(() => {
    void syncConnectedProviders()
  }, [syncConnectedProviders])

  const handleConnectRequest = (provider: SocialProvider) => {
    setConnectConsentTarget(provider)
  }

  const handleConnectConfirm = () => {
    if (!connectConsentTarget) return
    performConnect(connectConsentTarget)
  }

  const performConnect = (provider: SocialProvider) => {
    setLoadingProvider(provider)
    setRegisterSocialLinkIntent(redirectPath)

    const signupSocialLinkToken = getSignupSocialLinkToken()
    const hasAccessToken = hasCmsAccessToken()
    const startInput =
      remoteEnabled && !hasAccessToken && signupSocialLinkToken
        ? { provider, intent: 'link' as const, returnUrl: redirectPath, signupSocialLinkToken }
        : { provider, intent: 'link' as const, returnUrl: redirectPath }

    if (
      shouldSkipUnauthenticatedSocialConnectStart({
        remoteEnabled,
        hasAccessToken,
        hasSignupSocialLinkToken: Boolean(signupSocialLinkToken),
      })
    ) {
      cmsAlertModal.show({
        title: '소셜 계정 연결',
        content:
          '가입 직후 소셜 연결 세션이 없거나 만료되었습니다. 로그인 후 [내 정보 수정]에서 연결해 주세요.',
      })
      setLoadingProvider(null)
      setConnectConsentTarget(null)
      return
    }

    void cmsSocialAuthClient
      .startLogin(startInput)
      .then(url => {
        window.location.assign(url)
      })
      .catch((error: unknown) => {
        handleError(error, { context: 'socialConnectProviderList.connect' })
        cmsAlertModal.show({
          title: '소셜 계정 연결',
          content: socialConnectFailureMessage(error),
        })
        setLoadingProvider(null)
        setConnectConsentTarget(null)
      })
  }

  const performDisconnect = async (provider: SocialProvider): Promise<boolean> => {
    if (isSocialAdminSocialApiRemoteEnabled() && cmsSocialAuthClient.hasAccessToken()) {
      try {
        await cmsSocialAuthClient.unlinkAccount(provider)
      } catch (error: unknown) {
        handleError(error, { context: 'socialConnectProviderList.unlink' })
        return false
      }
    }

    cmsSocialAuthClient.state.removeConnectedProvider(provider)
    cmsSocialAuthClient.state.removePendingSocialLink(provider)
    setConnectedProviders(prev => {
      const next = new Set(prev)
      next.delete(provider)
      return next
    })
    await syncConnectedProviders()
    return true
  }

  const handleDisconnectRequest = (provider: SocialProvider) => {
    setUnlinkTarget(provider)
  }

  const handleDisconnectConfirm = () => {
    if (!unlinkTarget) {
      return
    }

    const provider = unlinkTarget
    setUnlinkLoading(true)
    void performDisconnect(provider)
      .then(success => {
        if (success) {
          setUnlinkTarget(null)
          showSocialConnectUnlinkCompletedAlert()
        }
      })
      .finally(() => {
        setUnlinkLoading(false)
      })
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
                size="small" className="social-connect-provider-list__action-btn"
                loading={isLoading}
                disabled={loadingProvider !== null && !isLoading}
                onClick={() =>
                  isConnected ? handleDisconnectRequest(provider) : handleConnectRequest(provider)
                } >
                {isConnected ? '해제하기' : '연결하기'}
              </CmsButton>
            </li>
          )
        })}
      </ul>

      <SocialConnectConsentModal
        open={connectConsentTarget !== null}
        confirmLoading={connectConsentTarget !== null && loadingProvider === connectConsentTarget}
        onCancel={() => {
          if (loadingProvider !== connectConsentTarget) {
            setConnectConsentTarget(null)
          }
        }}
        onConfirm={handleConnectConfirm}
      />

      <ConfirmModal
        open={unlinkTarget !== null}
        title="소셜 계정 연결 해제"
        content={
          unlinkTarget ? getSocialConnectUnlinkConfirmContent(unlinkTarget) : ''
        }
        confirmText="해제하기"
        cancelText="취소"
        danger
        confirmLoading={unlinkLoading}
        onConfirm={handleDisconnectConfirm}
        onCancel={() => {
          if (!unlinkLoading) {
            setUnlinkTarget(null)
          }
        }}
      />
    </div>
  )
}
