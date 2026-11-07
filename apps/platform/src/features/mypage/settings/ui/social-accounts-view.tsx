import { useEffect, useState, type ReactNode } from 'react'
import type { SocialProvider } from '@jakorea/social-auth'
import { SocialAuthApiError } from '@jakorea/social-auth'
import { SocialConnectConsentModal } from '@/features/auth'
import {
  markSocialConnectionConsentAgreed,
  resolveHasSocialConnectionConsent,
} from '@/features/auth/lib/resolve-social-connection-consent'
import {
  isPortalSocialAuthLinkRemoteEnabled,
  platformSocialAuthClient,
  rememberSettingsSocialLinkReturn,
} from '@/features/auth/social-auth'
import { getAccessToken } from '@/shared/lib'
import {
  GoogleSocialLoginIcon,
  KakaoSocialLoginIcon,
  NaverSocialLoginIcon,
  PFButton,
  PFText,
} from '@/shared/ui'
import styles from './social-accounts-view.module.css'

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

const emptyConnectedMap = (): Record<SocialProvider, boolean> => ({
  google: false,
  naver: false,
  kakao: false,
})

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

function socialErrorMessage(reason: string | null): string | null {
  if (reason === 'already-linked') {
    return '이 소셜 계정은 다른 JA Korea 계정에 연결되어 있어요.'
  }
  if (reason === 'connection-failed') {
    return '소셜 계정을 연결하지 못했어요. 잠시 후 다시 시도해 주세요.'
  }
  return null
}

export type SettingsSocialAccountsViewProps = {
  linkErrorReason?: string | null
}

export function SettingsSocialAccountsView({
  linkErrorReason = null,
}: SettingsSocialAccountsViewProps) {
  const [connectedMap, setConnectedMap] =
    useState<Record<SocialProvider, boolean>>(emptyConnectedMap)
  const [busyProvider, setBusyProvider] = useState<SocialProvider | null>(null)
  const [consentProvider, setConsentProvider] = useState<SocialProvider | null>(null)
  const [listError, setListError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const remote = isPortalSocialAuthLinkRemoteEnabled() && Boolean(getAccessToken())
  const returnError = socialErrorMessage(linkErrorReason)
  const displayError = returnError ?? listError ?? actionError

  useEffect(() => {
    if (!remote) return

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
  }, [remote])

  const startLink = (provider: SocialProvider) => {
    if (!remote) {
      setConsentProvider(null)
      setActionError('소셜 계정 연결을 시작할 수 없어요.')
      return
    }

    setActionError(null)
    setBusyProvider(provider)
    rememberSettingsSocialLinkReturn()
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
        setConsentProvider(null)
        setActionError('소셜 계정을 연결하지 못했어요. 잠시 후 다시 시도해 주세요.')
      })
  }

  const unlink = async (provider: SocialProvider) => {
    if (!remote) return
    setActionError(null)
    setBusyProvider(provider)
    try {
      await platformSocialAuthClient.unlinkAccount(provider)
      setConnectedMap(prev => ({ ...prev, [provider]: false }))
    } catch {
      setActionError('소셜 계정 연결을 해제하지 못했어요. 잠시 후 다시 시도해 주세요.')
    } finally {
      setBusyProvider(null)
    }
  }

  const requestConnect = async (provider: SocialProvider) => {
    if (busyProvider) return
    const hasLinkedAccount = Object.values(connectedMap).some(Boolean)
    setBusyProvider(provider)
    const alreadyAgreed = await resolveHasSocialConnectionConsent(hasLinkedAccount)
    if (alreadyAgreed) {
      startLink(provider)
      return
    }
    setBusyProvider(null)
    setConsentProvider(provider)
  }

  const confirmConnect = () => {
    if (!consentProvider) return
    markSocialConnectionConsentAgreed()
    startLink(consentProvider)
  }

  const toggleConnection = (provider: SocialProvider) => {
    if (busyProvider) return
    if (connectedMap[provider]) {
      void unlink(provider)
      return
    }
    void requestConnect(provider)
  }

  return (
    <section className={styles.section}>
      <PFText as="p" typo="bd-md-rg" color="primary-800" className={styles.description}>
        소셜 계정을 연결하면 이메일과 비밀번호 없이 로그인할 수 있어요. 연결은 선택 사항이며,
        마이페이지에서 언제든 연결할 수 있어요.
      </PFText>

      {displayError ? (
        <PFText typo="bd-sm-rg" color="error" className={styles.error} role="alert">
          {displayError}
        </PFText>
      ) : null}

      <div className={styles.list}>
        {socialConnectItems.map(item => {
          const isConnected = connectedMap[item.provider]
          const isBusy = busyProvider === item.provider

          return (
            <div className={styles.row} key={item.provider}>
              <div className={styles.main}>
                <span className={styles.icon}>{item.icon}</span>
                <PFText typo="bd-lg-sb" color="black" className={styles.name}>
                  {item.name}
                </PFText>
                <StatusDot connected={isConnected} />
                <PFText
                  typo="label-md"
                  color={isConnected ? 'primary-500' : 'neutral-cool-500'}
                  className={styles.status}
                >
                  {isConnected ? '연결됨' : '연결되지 않음'}
                </PFText>
              </div>
              <PFButton
                size="small"
                variant="tertiary"
                disabled={Boolean(busyProvider) || !remote}
                onClick={() => toggleConnection(item.provider)}
              >
                {isBusy ? '처리 중…' : isConnected ? '해제하기' : '연결하기'}
              </PFButton>
            </div>
          )
        })}
      </div>

      <SocialConnectConsentModal
        open={consentProvider != null}
        confirmLoading={consentProvider != null && busyProvider === consentProvider}
        onCancel={() => {
          if (busyProvider) return
          setConsentProvider(null)
        }}
        onConfirm={confirmConnect}
      />
    </section>
  )
}
