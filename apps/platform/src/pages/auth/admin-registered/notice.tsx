import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  clearAdminRegisteredPasswordChangeRequired,
  getAdminRegisteredSignUpChangePasswordPath,
  getAdminRegisteredWizardState,
  isAdminRegisteredSignUpEntry,
  requiresAdminRegisteredOnboarding,
  resolveAdminProvisionedNoticeCta,
  syncAdminRegisteredOnboardingSession,
} from '@/features/auth/admin-registered'
import { usePortalMeQuery } from '@/features/auth/sign-in'
import illustExclamationUrl from '@/shared/assets/illustration/illust-exclamation.svg'
import { getAccessToken } from '@/shared/lib/auth-token'
import { isRemoteApiConfigured } from '@/shared/lib'
import { PFButton, PFText } from '@/shared/ui'
import styles from './notice.module.css'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'
import sharedStyles from './shared.module.css'

const SIGN_IN_FROM_NOTICE = '/auth/sign-in?redirect=/auth/admin-registered/notice'

function AdminRegisteredFirstLoginNotice() {
  const navigate = useNavigate()
  const remote = isRemoteApiConfigured()
  const hasToken = Boolean(getAccessToken())
  const meQuery = usePortalMeQuery({
    enabled: remote && hasToken,
  })
  const me = meQuery.data
  const isLoadingMe = remote && hasToken && meQuery.isPending && !me
  const wizardStep = getAdminRegisteredWizardState()?.adminProvisionedOnboardingStep
  const cta = resolveAdminProvisionedNoticeCta(
    me ?? {
      registeredByAdmin: true,
      adminProvisionedOnboardingRequired: true,
      adminProvisionedOnboardingStep: wizardStep,
    },
  )

  useEffect(() => {
    if (!remote) return
    if (isLoadingMe) return

    if (me) {
      if (!requiresAdminRegisteredOnboarding(me)) {
        clearAdminRegisteredPasswordChangeRequired()
        navigate('/', { replace: true })
        return
      }

      if (me.email?.trim()) {
        syncAdminRegisteredOnboardingSession(me.email, me, 'first-login')
      }

      const next = resolveAdminProvisionedNoticeCta(me)
      if (next) {
        navigate(next.path, { replace: true })
      }
      return
    }

    if (!hasToken) return
    if (meQuery.isError && !getAdminRegisteredWizardState()?.email) {
      navigate(SIGN_IN_FROM_NOTICE, { replace: true })
    }
  }, [hasToken, isLoadingMe, me, meQuery.isError, navigate, remote])

  const handleContinue = () => {
    if (isLoadingMe) return

    if (me && !requiresAdminRegisteredOnboarding(me)) {
      clearAdminRegisteredPasswordChangeRequired()
      navigate('/')
      return
    }

    if (me?.email?.trim()) {
      syncAdminRegisteredOnboardingSession(me.email, me, 'first-login')
    }

    const next =
      resolveAdminProvisionedNoticeCta(
        me ?? {
          registeredByAdmin: true,
          adminProvisionedOnboardingRequired: true,
          adminProvisionedOnboardingStep:
            getAdminRegisteredWizardState()?.adminProvisionedOnboardingStep,
        },
      ) ?? cta

    if (next) {
      if (!getAdminRegisteredWizardState()?.email) {
        navigate(SIGN_IN_FROM_NOTICE)
        return
      }
      navigate(next.path)
      return
    }

    navigate(
      hasToken && getAdminRegisteredWizardState()?.email
        ? '/auth/admin-registered/birth'
        : SIGN_IN_FROM_NOTICE,
    )
  }

  if (isLoadingMe) {
    return (
      <PFText as="p" typo="bd-md-rg" color="neutral-cool-500" className={sharedStyles.statusMessage}>
        가입 절차를 확인하는 중…
      </PFText>
    )
  }

  const description = cta?.description
    ?? '안전한 이용을 위해 본인인증 후 비밀번호를 변경해 주세요.'
  const buttonLabel = cta?.buttonLabel ?? '본인인증 후 비밀번호 변경하기'

  return (
    <section>
      <div className={styles.intro}>
        <img className={styles.illustration} src={illustExclamationUrl} alt="" aria-hidden="true" />
        <PFText as="h1" typo="hd-md" color="black" className={authPageCopyClass('title')}>
          관리자에 의해 가입된 회원입니다.
        </PFText>
        <PFText as="p" typo="bd-lg-rg" color="primary-800" className={authPageCopyClass('description')}>
          현재 비밀번호는 가입된 이메일 주소와 동일합니다.
          <br />
          {description}
        </PFText>
      </div>

      <div className={styles.actions}>
        <PFButton size="xlarge" width="100%" onClick={handleContinue}>
          {buttonLabel}
        </PFButton>
      </div>
    </section>
  )
}

function AdminRegisteredSignUpNotice() {
  const navigate = useNavigate()

  const handleChangePassword = () => {
    navigate(getAdminRegisteredSignUpChangePasswordPath())
  }

  const handleFindEmail = () => {
    navigate('/auth/find-email')
  }

  return (
    <>
      <PFText as="p" typo="bd-lg-rg" color="primary-800">
        안전한 이용을 위해 본인인증 후 비밀번호를 변경해 주세요.
      </PFText>

      <div className={styles.infoBox}>
        <PFText typo="bd-lg-sb" color="primary-800">
          현재 비밀번호는 가입된 이메일 주소와 동일합니다.
          <br />
          이메일이 기억나지 않는 경우, 이메일 찾기를 진행해 주세요.
        </PFText>
      </div>

      <div className={styles.actionsGroup}>
        <PFButton size="xlarge" width="100%" onClick={handleChangePassword}>
          비밀번호 변경하기
        </PFButton>
        <PFButton size="xlarge" variant="tertiary" width="100%" onClick={handleFindEmail}>
          이메일 찾기
        </PFButton>
      </div>
    </>
  )
}

export function AdminRegisteredNoticePage() {
  const isSignUpEntry = isAdminRegisteredSignUpEntry()

  if (!isSignUpEntry) {
    return <AdminRegisteredFirstLoginNotice />
  }

  return (
    <section>
      <div className={styles.intro}>
        <img className={styles.illustration} src={illustExclamationUrl} alt="" aria-hidden="true" />
        <PFText as="h1" typo="hd-md" color="black" className={authPageCopyClass('title')}>
          관리자가 등록한 계정이에요.
        </PFText>
        <AdminRegisteredSignUpNotice />
      </div>
    </section>
  )
}
