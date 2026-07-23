import {
  GoogleSocialLoginIcon,
  KakaoSocialLoginIcon,
  NaverSocialLoginIcon,
  PFButton,
  PFText,
} from '@/shared/ui'
import illustSquareUrl from '@/shared/assets/illustration/illust-square.svg'
import styles from './page.module.css'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'

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
    <section>
        <div className={styles.intro}>
          <img className={styles.illustration} src={illustSquareUrl} alt="" aria-hidden="true" />
          <PFText as="div" typo="hd-md" color="black" className={authPageCopyClass('title')}>
            연결된 소셜 계정이 없어요
          </PFText>
          <PFText as="p" typo="bd-lg-rg" color="primary-700" className={authPageCopyClass('description')}>
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
          <PFButton size="xlarge" className={styles.actionButton} onClick={handleSignIn}>
            이메일로 로그인
          </PFButton>
          <PFButton
            size="xlarge"
            variant="secondary"
            className={styles.actionButton}
            onClick={handleSignUp}
          >
            회원가입하기
          </PFButton>
        </div>

        <div className={styles.socialSection}>
          <div className={styles.socialDivider}>
            <span className={styles.socialDividerLine} />
            <PFText typo="caption-rg" color="neutral-cool-500">
              다른 소셜 계정으로 시도
            </PFText>
            <span className={styles.socialDividerLine} />
          </div>

          <div className={styles.socialIcons}>
            {socialLoginItems.map(({ label, icon }) => (
              <button
                className={styles.socialButton}
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
    </section>
  )
}
