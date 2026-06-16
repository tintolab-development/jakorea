import { Button } from 'antd'
import { useState } from 'react'

import type { SocialProvider } from '@/entities/user/api/auth-service'
import { buildOAuthAuthorizeUrl } from '@/features/auth/lib/oauth-client'
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
  onComplete: () => void
  onSkip: () => void
}

export function RegisterSocialConnectView({ onComplete, onSkip }: RegisterSocialConnectViewProps) {
  const [connectedProviders, setConnectedProviders] = useState<Set<SocialProvider>>(new Set())
  const [loadingProvider, setLoadingProvider] = useState<SocialProvider | null>(null)

  const handleConnect = (provider: SocialProvider) => {
    setLoadingProvider(provider)
    try {
      window.location.assign(buildOAuthAuthorizeUrl(provider))
    } catch (error: unknown) {
      console.debug('registerSocialConnectView connect failed', error)
      setConnectedProviders(prev => new Set(prev).add(provider))
      setLoadingProvider(null)
    }
  }

  const handleDisconnect = (provider: SocialProvider) => {
    setConnectedProviders(prev => {
      const next = new Set(prev)
      next.delete(provider)
      return next
    })
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
                    {' '}
                    ·{' '}
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
                  size="medium"
                  className="register-social-connect__action-btn"
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
