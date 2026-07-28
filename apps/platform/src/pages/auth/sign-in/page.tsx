import type { FormEvent } from 'react'
import { useState } from 'react'
import {
  isMockAdminRegisteredFirstLogin,
  setAdminRegisteredPasswordChangeRequired,
} from '@/features/auth/admin-registered'
import { useMediaQuery } from '@/shared/hooks'
import { platformMediaQueries, setDevAuthLoggedIn, validateEmailId } from '@/shared/lib'
import {
  GoogleSocialLoginIcon,
  KakaoSocialLoginIcon,
  NaverSocialLoginIcon,
  PFButton,
  PFText,
  PFTextInput,
} from '@/shared/ui'
import illustPeopleUrl from '@/shared/assets/illustration/illust-people.svg'
import { authPageCopy, authPageCopyClass } from '@/widgets/layout/auth-page-shell'
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
  const [emailError, setEmailError] = useState<string | null>(null)
  const isBelowPc = useMediaQuery(platformMediaQueries.belowPc)

  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (emailError) {
      setEmailError(null)
    }
  }

  const handleDevSignIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const validation = validateEmailId(email)

    if (!validation.ok) {
      setEmailError(validation.message)
      return
    }

    if (isMockAdminRegisteredFirstLogin(validation.normalized, password)) {
      setAdminRegisteredPasswordChangeRequired(validation.normalized)
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
    <section>
        <div className={styles.intro}>
          <img className={styles.illustration} src={illustPeopleUrl} alt="" aria-hidden="true" />
          <PFText
            as="div"
            typo="hd-lg"
            color="gradient-primary-01"
            className={authPageCopyClass('title', authPageCopy.titleAfterMedia)}
          >
            다시 만나서 반가워요
          </PFText>
          <PFText
            as="p"
            typo="bd-lg-rg"
            color="primary-700"
            className={authPageCopyClass('description', authPageCopy.descriptionTight)}
          >
            이메일과 비밀번호로 로그인 해주세요.
          </PFText>
        </div>

        <form className={styles.form} noValidate onSubmit={handleDevSignIn}>
          <div className={styles.inputGroup}>
            <PFTextInput
              size="xlarge"
              label="이메일"
              type="email"
              placeholder="이메일 주소를 입력해 주세요"
              autoComplete="email"
              required
              value={email}
              onValueChange={handleEmailChange}
              error={Boolean(emailError)}
              message={emailError ?? undefined}
              messageStatus="error"
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
          <PFButton type="submit" size="xlarge" className={styles.submitButton}>
            로그인하기
          </PFButton>
        </form>

        <div className={styles.accountLinks}>
          {accountLinkItems.map((item, index) => (
            <div className={styles.accountLinkItem} key={item.label}>
              <PFButton
                variant="text"
                size={isBelowPc ? 'small' : 'medium'}
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
                <span className={styles.accountLinkSeparator} aria-hidden="true" />
              ) : null}
            </div>
          ))}
        </div>

        <div className={styles.socialSection}>
          <div className={styles.socialDivider}>
            <span className={styles.socialDividerLine} />
            <PFText typo="caption-rg" color="neutral-cool-500">
              또는 소셜 로그인
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
                onClick={handleSocialLogin}
              >
                {icon}
              </button>
            ))}
          </div>
        </div>
    </section>
  )
}
