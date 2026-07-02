import { useState, type ReactNode } from 'react'
import {
  GoogleSocialLoginIcon,
  KakaoSocialLoginIcon,
  NaverSocialLoginIcon,
  PFButton,
  PFText,
} from '@/shared/ui'
import styles from './sign-up-social-connect-page.module.css'

type SocialProvider = 'google' | 'naver' | 'kakao'

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
      className={styles['status-dot']}
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

export function SignUpSocialConnectPage() {
  const [connectedMap, setConnectedMap] = useState<Record<SocialProvider, boolean>>({
    google: false,
    naver: false,
    kakao: false,
  })

  const SOCIAL_CONNECT_COMPLETE_PATH = '/auth/sign-up/social-connect/complete'
  const SOCIAL_CONNECT_ERROR_PATH = '/auth/sign-up/social-connect/error'

  const toggleConnection = (provider: SocialProvider) => {
    const isConnected = connectedMap[provider]

    if (!isConnected) {
      if (provider === 'google') {
        window.location.assign(SOCIAL_CONNECT_COMPLETE_PATH)
        return
      }

      if (provider === 'naver') {
        window.location.assign(`${SOCIAL_CONNECT_ERROR_PATH}?reason=connection-failed`)
        return
      }

      if (provider === 'kakao') {
        window.location.assign(`${SOCIAL_CONNECT_ERROR_PATH}?reason=already-linked`)
        return
      }
    }

    setConnectedMap(prev => ({ ...prev, [provider]: !prev[provider] }))
  }

  const handleComplete = () => {
    window.location.assign('/')
  }

  const handleSkip = () => {
    window.location.assign('/auth/sign-up/complete')
  }

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <PFText as="div" typo="hd-sm" color="black" className={styles.title}>
          소셜 계정을 연결하면
          <br />
          더 쉽게 로그인 할 수 있어요
        </PFText>

        <PFText as="p" typo="bd-md-rg" color="neutral-cool-500" className={styles.description}>
          다음부터 이메일과 비밀번호 없이 로그인할 수 있어요.
          <br />
          연결은 선택 사항이며, 나중에 마이페이지에서도 할 수 있어요.
        </PFText>

        <div className={styles['social-connect-section']}>
          <div className={styles['social-connect-divider']}>
            <span className={styles['social-connect-divider-line']} />
            <PFText typo="label-md" color="neutral-cool-500">
              연결할 소셜 계정을 선택해 주세요
            </PFText>
            <span className={styles['social-connect-divider-line']} />
          </div>

          <div className={styles['social-connect-list']}>
            {socialConnectItems.map(item => {
              const isConnected = connectedMap[item.provider]

              return (
                <div className={styles['social-connect-row']} key={item.provider}>
                  <div className={styles['social-connect-main']}>
                    <span className={styles['social-connect-icon']}>{item.icon}</span>
                    <PFText
                      typo="bd-lg-sb"
                      color="black"
                      className={styles['social-connect-name']}
                    >
                      {item.name}
                    </PFText>
                    <StatusDot connected={isConnected} />
                    <PFText
                      typo="label-md"
                      color={isConnected ? 'primary-500' : 'neutral-cool-500'}
                      className={styles['social-connect-status']}
                    >
                      {isConnected ? '연결됨' : '연결되지 않음'}
                    </PFText>
                  </div>
                  <PFButton
                    size="small"
                    variant="tertiary"
                    onClick={() => toggleConnection(item.provider)}
                  >
                    {isConnected ? '해제하기' : '연결하기'}
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
      </div>
    </section>
  )
}
