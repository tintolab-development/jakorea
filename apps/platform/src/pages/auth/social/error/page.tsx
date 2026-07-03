import {
  GoogleSocialLoginIcon,
  KakaoSocialLoginIcon,
  NaverSocialLoginIcon,
  PFButton,
  PFText,
} from '@/shared/ui'
import illustSquareUrl from '@/shared/assets/illustration/illust-square.svg'
import styles from './page.module.css'

const socialLoginItems = [
  { label: 'Google 로그인', icon: <GoogleSocialLoginIcon /> },
  { label: '네이버 로그인', icon: <NaverSocialLoginIcon /> },
  { label: '카카오 로그인', icon: <KakaoSocialLoginIcon /> },
]

export function SocialErrorPage() {
  const handleSignIn = () => {
    window.location.assign('/auth/sign-in')
  }

  const handleSignUp = () => {
    window.location.assign('/auth/sign-up')
  }

  const handleSocialRetry = () => {
    window.location.assign('/auth/social/error?reason=not-linked')
  }

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <div className={styles.intro}>
          <img className={styles.illustration} src={illustSquareUrl} alt="" aria-hidden="true" />
          <PFText as="div" typo="hd-md" color="black" className={styles.title}>
            연결된 소셜 계정이 없어요
          </PFText>
          <PFText as="p" typo="bd-lg-rg" color="primary-700">
            이 소셜 계정과 연결된 JA Korea 계정을 찾을 수 없어요.
          </PFText>
        </div>

        <div className={styles.guide}>
          <PFText as="p" typo="bd-sm-rg" color="black">
            먼저 이메일로 로그인한 뒤, 마이페이지에서 소셜 계정을 연결해 주세요.
            <br />
            회원가입이 처음이라면 이메일로 가입한 뒤 소셜 계정을 연결할 수 있어요.
          </PFText>
        </div>

        <div className={styles.actions}>
          <PFButton size="xlarge" className={styles['action-button']} onClick={handleSignIn}>
            이메일로 로그인
          </PFButton>
          <PFButton
            size="xlarge"
            variant="secondary"
            className={styles['action-button']}
            onClick={handleSignUp}
          >
            회원가입하기
          </PFButton>
        </div>

        <div className={styles['social-section']}>
          <div className={styles['social-divider']}>
            <span className={styles['social-divider-line']} />
            <PFText typo="caption-rg" color="neutral-cool-500">
              다른 소셜 계정으로 시도
            </PFText>
            <span className={styles['social-divider-line']} />
          </div>

          <div className={styles['social-icons']}>
            {socialLoginItems.map(({ label, icon }) => (
              <button
                className={styles['social-button']}
                type="button"
                aria-label={label}
                key={label}
                onClick={handleSocialRetry}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
