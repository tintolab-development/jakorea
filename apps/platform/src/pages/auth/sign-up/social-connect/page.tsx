import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { SocialProvider } from '@jakorea/social-auth'
import { SocialAuthApiError } from '@jakorea/social-auth'
import {
  isPortalSocialAuthLinkRemoteEnabled,
  platformSocialAuthClient,
} from '@/features/auth/social-auth'
import {
  GoogleSocialLoginIcon,
  KakaoSocialLoginIcon,
  NaverSocialLoginIcon,
  PFButton,
  PFText,
} from '@/shared/ui'
import styles from './page.module.css'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'

type SocialConnectItem = {
  provider: SocialProvider
  name: string
  icon: ReactNode
}

const socialConnectItems: SocialConnectItem[] = [
  {
    provider: 'google',
    name: 'Google',
    icon: <GoogleSocialLoginIcon width={40} height={40} />,
  },
  {
    provider: 'naver',
    name: '네이버',
    icon: <NaverSocialLoginIcon width={40} height={40} />,
  },
  {
    provider: 'kakao',
    name: '카카오',
    icon: <KakaoSocialLoginIcon width={40} height={40} />,
  },
]

function StatusDot({ connected }: { connected: boolean }) {
  return (
    <svg
      className={styles.statusDot}
      width="2"
      height="2"
      viewBox="0 0 2 2"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="1"
        cy="1"
        r="1"
        fill={connected ? 'var(--color-primary-500)' : 'var(--color-neutral-cool-500)'}
      />
    </svg>
  )
}

const emptyConnectedMap = (): Record<SocialProvider, boolean> => ({
  google: false,
  naver: false,
  kakao: false,
})

export function SignUpSocialConnectPage() {
  const navigate = useNavigate()
  const [connectedMap, setConnectedMap] = useState<Record<SocialProvider, boolean>>(emptyConnectedMap)
  const [busyProvider, setBusyProvider] = useState<SocialProvider | null>(null)
  const [listError, setListError] = useState<string | null>(null)

  const SOCIAL_CONNECT_ERROR_PATH = '/auth/sign-up/social-connect/error'

  useEffect(() => {
    if (!isPortalSocialAuthLinkRemoteEnabled()) {
      return
    }

    let cancelled = false
    void platformSocialAuthClient
      .listAccounts()
      .then(accounts => {
        if (cancelled) return
        const next = emptyConnectedMap()
        for (const account of accounts) {
          next[account.provider] = true
        }
        setConnectedMap(next)
        setListError(null)
      })
      .catch(() => {
        if (cancelled) return
        setListError('연결된 소셜 계정을 불러오지 못했어요.')
      })

    return () => {
      cancelled = true
    }
  }, [])

  const startLink = (provider: SocialProvider) => {
    if (!isPortalSocialAuthLinkRemoteEnabled()) {
      navigate(`${SOCIAL_CONNECT_ERROR_PATH}?reason=connection-failed`)
      return
    }

    setBusyProvider(provider)
    void platformSocialAuthClient
      .startLogin({ provider, intent: 'link' })
      .then(url => {
        if (!url?.trim()) {
          throw new SocialAuthApiError('INVALID_RESPONSE', '소셜 연결 URL을 받지 못했습니다.')
        }
        window.location.assign(url)
      })
      .catch(() => {
        setBusyProvider(null)
        navigate(`${SOCIAL_CONNECT_ERROR_PATH}?reason=connection-failed`)
      })
  }

  const unlink = async (provider: SocialProvider) => {
    if (!isPortalSocialAuthLinkRemoteEnabled()) {
      return
    }
    setBusyProvider(provider)
    try {
      await platformSocialAuthClient.unlinkAccount(provider)
      setConnectedMap(prev => ({ ...prev, [provider]: false }))
    } catch {
      navigate(`${SOCIAL_CONNECT_ERROR_PATH}?reason=connection-failed`)
    } finally {
      setBusyProvider(null)
    }
  }

  const toggleConnection = (provider: SocialProvider) => {
    if (busyProvider) return
    if (connectedMap[provider]) {
      void unlink(provider)
      return
    }
    startLink(provider)
  }

  const handleComplete = () => {
    navigate('/')
  }

  const handleSkip = () => {
    navigate('/auth/sign-up/complete')
  }

  return (
    <section>
      <PFText as="div" typo="hd-sm" color="black" className={authPageCopyClass('title')}>
        소셜 계정을 연결하면
        <br />
        더 쉽게 로그인 할 수 있어요
      </PFText>

      <PFText as="p" typo="bd-md-rg" color="neutral-cool-500" className={authPageCopyClass('description')}>
        다음부터 이메일과 비밀번호 없이 로그인할 수 있어요.
        <br />
        연결은 선택 사항이며, 나중에 마이페이지에서도 할 수 있어요.
      </PFText>

      {listError ? (
        <PFText as="p" typo="bd-sm-md" color="error">
          {listError}
        </PFText>
      ) : null}

      <div className={styles.socialConnectSection}>
        <div className={styles.socialConnectDivider}>
          <span className={styles.socialConnectDividerLine} />
          <PFText typo="label-md" color="neutral-cool-500">
            연결할 소셜 계정을 선택해 주세요
          </PFText>
          <span className={styles.socialConnectDividerLine} />
        </div>

        <div className={styles.socialConnectList}>
          {socialConnectItems.map(item => {
            const isConnected = connectedMap[item.provider]
            const isBusy = busyProvider === item.provider

            return (
              <div className={styles.socialConnectRow} key={item.provider}>
                <div className={styles.socialConnectMain}>
                  <span className={styles.socialConnectIcon}>{item.icon}</span>
                  <PFText typo="bd-lg-sb" color="black" className={styles.socialConnectName}>
                    {item.name}
                  </PFText>
                  <StatusDot connected={isConnected} />
                  <PFText
                    typo="label-md"
                    color={isConnected ? 'primary-500' : 'neutral-cool-500'}
                    className={styles.socialConnectStatus}
                  >
                    {isConnected ? '연결됨' : '연결되지 않음'}
                  </PFText>
                </div>
                <PFButton
                  size="small"
                  variant="tertiary"
                  disabled={Boolean(busyProvider)}
                  onClick={() => toggleConnection(item.provider)}
                >
                  {isBusy ? '처리 중…' : isConnected ? '해제하기' : '연결하기'}
                </PFButton>
              </div>
            )
          })}
        </div>
      </div>

      <div className={styles.actions}>
        <PFButton size="xlarge" width="100%" onClick={handleComplete}>
          완료
        </PFButton>
        <PFButton variant="text" size="medium" onClick={handleSkip}>
          나중에 할게요
        </PFButton>
      </div>
    </section>
  )
}
