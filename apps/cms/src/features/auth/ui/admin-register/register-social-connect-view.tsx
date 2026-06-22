import { Button } from 'antd'
import { useState } from 'react'

import type { SocialProvider } from '@jakorea/social-auth'

import { isSocialAdminSocialApiRemoteEnabled } from '@/features/auth/api/social-auth-remote-capabilities'
import {
  getConnectedProviders,
  setRegisterSocialLinkIntent,
} from '@/features/auth/lib/register-social-connect-state'
import { cmsSocialAuthClient } from '@/features/auth/social-auth/cms-client'
import { CmsButton } from '@/shared/ui/cms-button'

import { RegisterStepHeader } from './register-step-header'
import { SocialConnectProviderIcon } from './social-connect-provider-icon'

const SOCIAL_CONNECT_PROVIDERS: SocialProvider[] = ['google', 'naver', 'kakao']

const SOCIAL_CONNECT_DISPLAY_NAME: Record<SocialProvider, string> = {
  google: 'Google',
  naver: '네이버',
  kakao: '카카오',
}

interface RegisterSocialConnectViewProps {
  redirectPath?: string
  onComplete: () => void
  onSkip: () => void
  onConnectSuccess: (provider: SocialProvider) => void
}

export function RegisterSocialConnectView({
  redirectPath,
  onComplete,
  onSkip,
  onConnectSuccess,
}: RegisterSocialConnectViewProps) {
  const [connectedProviders, setConnectedProviders] = useState<Set<SocialProvider>>(
    () => getConnectedProviders()
  )
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null)

  const handleConnect = (provider: SocialProvider) => {
    setLoadingProvider(provider)
    setRegisterSocialLinkIntent(redirectPath)
    void cmsSocialAuthClient
      .startLogin({ provider, intent: 'link', returnUrl: redirectPath })
      .then(url => {
        window.location.assign(url)
      })
      .catch((error: unknown) => {
        console.debug('registerSocialConnectView connect failed', error)
        cmsSocialAuthClient.state.addConnectedProvider(provider)
        setConnectedProviders(prev => new Set(prev).add(provider))
        setLoadingProvider(null)
        onConnectSuccess(provider)
      })
  }

  const handleDisconnect = (provider: SocialProvider) => {
    void (async () => {
      if (isSocialAdminSocialApiRemoteEnabled() && cmsSocialAuthClient.hasAccessToken()) {
        try {
          await cmsSocialAuthClient.unlinkAccount(provider)
        } catch (error: unknown) {
          console.debug('registerSocialConnectView unlink failed', error)
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

  return (
    <div className="register-social-connect">
      <RegisterStepHeader
        title={
          <>
            소셜 계정을 연결하면
            <br />
            더 쉽게 로그인 할 수 있어요
          </>
        }
        description={
          <>
            다음부터 이메일과 비밀번호 없이 로그인할 수 있어요.
            <br />
            연결은 선택 사항이며, 나중에 [내 정보 수정]에서도 할 수 있어요.
          </>
        }
      />

      <div className="register-social-connect__content">
        <div className="register-social-connect__divider" role="separator">
          <span>연결할 소셜 계정을 선택해 주세요</span>
        </div>

        <ul className="register-social-connect__list" aria-label="소셜 계정 연결 목록">
          {SOCIAL_CONNECT_PROVIDERS.map(provider => {
            const isConnected = connectedProviders.has(provider)
            const isLoading = loadingProvider === provider

            return (
              <li key={provider} className="register-social-connect__item">
                <SocialConnectProviderIcon provider={provider} />
                <p className="register-social-connect__label">
                  <span className="register-social-connect__provider-name">
                    {SOCIAL_CONNECT_DISPLAY_NAME[provider]}
                  </span>
                  <span className="register-social-connect__label-separator" aria-hidden>
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
                        ? 'register-social-connect__status register-social-connect__status--connected'
                        : 'register-social-connect__status'
                    }
                  >
                    {isConnected ? '연결됨' : '연결되지 않음'}
                  </span>
                </p>
                <CmsButton
                  variant="default"
                  size="small"
                  className="register-social-connect__action-btn cms-button--no-label-ellipsis"
                  loading={isLoading}
                  disabled={loadingProvider !== null && !isLoading}
                  onClick={() => (isConnected ? handleDisconnect(provider) : handleConnect(provider))}
                >
                  {isConnected ? '해제하기' : '연결하기'}
                </CmsButton>
              </li>
            )
          })}
        </ul>

        <div className="register-social-connect__actions">
          <Button type="primary" block className="auth-submit-btn" onClick={onComplete}>
            완료
          </Button>
        </div>

        <div className="register-social-connect__skip-wrap">
          <button type="button" className="register-social-connect__skip" onClick={onSkip}>
            나중에 할게요
          </button>
        </div>
      </div>
    </div>
  )
}
