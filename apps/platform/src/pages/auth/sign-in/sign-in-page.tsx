import {
  GoogleSocialLoginIcon,
  KakaoSocialLoginIcon,
  NaverSocialLoginIcon,
  PFButton,
  PFText,
} from '@/shared/ui'
import illustPeopleUrl from '@/shared/assets/illustration/illust-people.svg'
import styles from './sign-in-page.module.css'

const accountLinkItems: Array<{ label: string; href?: string }> = [
  { label: '이메일 찾기' },
  { label: '비밀번호 찾기' },
  { label: '회원가입 하기', href: '/auth/sign-up' },
]

const socialLoginItems = [
  { label: 'Google 로그인', icon: <GoogleSocialLoginIcon /> },
  { label: '네이버 로그인', icon: <NaverSocialLoginIcon /> },
  { label: '카카오 로그인', icon: <KakaoSocialLoginIcon /> },
]

export function SignInPage() {
  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <div className={styles.intro}>
          <img className={styles.illustration} src={illustPeopleUrl} alt="" aria-hidden="true" />
          <PFText as="div" typo="hd-lg" color="gradient-primary-01" className={styles.title}>
            다시 만나서 반가워요
          </PFText>
          <PFText as="p" typo="bd-lg-rg" color="primary-700">
            이메일과 비밀번호로 로그인 해주세요.
          </PFText>
        </div>

        <div className={styles['input-slot']} aria-hidden="true" />

        <div className={styles['account-links']}>
          {accountLinkItems.map((item, index) => (
            <div className={styles['account-link-item']} key={item.label}>
              <PFButton
                variant="text"
                size="medium"
                onClick={
                  item.href
                    ? () => {
                        window.location.assign(item.href!)
                      }
                    : undefined
                }
              >
                {item.label}
              </PFButton>
              {index < accountLinkItems.length - 1 ? (
                <span className={styles['account-link-separator']} aria-hidden="true" />
              ) : null}
            </div>
          ))}
        </div>

        <div className={styles['social-section']}>
          <div className={styles['social-divider']}>
            <span className={styles['social-divider-line']} />
            <PFText typo="caption-rg" color="neutral-cool-500">
              또는 소셜 로그인
            </PFText>
            <span className={styles['social-divider-line']} />
          </div>

          <div className={styles['social-icons']}>
            {socialLoginItems.map(({ label, icon }) => (
              <button className={styles['social-button']} type="button" aria-label={label} key={label}>
                {icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
