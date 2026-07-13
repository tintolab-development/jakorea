import type { FormEvent } from 'react'
import { useState } from 'react'
import {
  isMockAdminRegisteredFirstLogin,
  setAdminRegisteredPasswordChangeRequired,
} from '@/features/auth/admin-registered'
import {
  GoogleSocialLoginIcon,
  KakaoSocialLoginIcon,
  NaverSocialLoginIcon,
  PFButton,
  PFText,
  PFTextInput,
} from '@/shared/ui'
import { setDevAuthLoggedIn } from '@/shared/lib'
import illustPeopleUrl from '@/shared/assets/illustration/illust-people.svg'
import styles from './page.module.css'

const accountLinkItems: Array<{ label: string; href?: string }> = [
  { label: '이메일 찾기', href: '/auth/find-email' },
  { label: '비밀번호 찾기', href: '/auth/find-password' },
  { label: '회원가입 하기', href: '/auth/sign-up' },
]

const socialLoginItems = [
  { label: 'Google 로그인', icon: <GoogleSocialLoginIcon /> },
  { label: '네이버 로그인', icon: <NaverSocialLoginIcon /> },
  { label: '카카오 로그인', icon: <KakaoSocialLoginIcon /> },
]

export function SignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleDevSignIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isMockAdminRegisteredFirstLogin(email, password)) {
      setAdminRegisteredPasswordChangeRequired(email)
      window.location.assign('/auth/admin-registered/notice')
      return
    }

    const searchParams = new URLSearchParams(window.location.search)
    const redirectPath = searchParams.get('redirect') ?? '/'

    setDevAuthLoggedIn(true)
    window.location.assign(redirectPath)
  }

  const handleSocialLogin = () => {
    window.location.assign('/auth/social/error?reason=not-linked')
  }

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

        <form className={styles.form} noValidate onSubmit={handleDevSignIn}>
          <div className={styles['input-group']}>
            <PFTextInput
              size="xlarge"
              label="이메일"
              type="email"
              placeholder="이메일 주소를 입력해 주세요"
              autoComplete="email"
              required
              value={email}
              onValueChange={setEmail}
            />
            <PFTextInput
              size="xlarge"
              label="비밀번호"
              type="password"
              placeholder="비밀번호를 입력해 주세요"
              autoComplete="current-password"
              required
              value={password}
              onValueChange={setPassword}
            />
          </div>
          <PFButton type="submit" size="xlarge" className={styles['submit-button']}>
            로그인하기
          </PFButton>
        </form>

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
              <button
                className={styles['social-button']}
                type="button"
                aria-label={label}
                key={label}
                onClick={handleSocialLogin}
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
