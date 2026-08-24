import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  getAdminRegisteredSignUpChangePasswordPath,
  isAdminRegisteredSignUpEntry,
  requiresAdminRegisteredOnboarding,
  resolveAdminProvisionedOnboardingEntryPath,
  syncAdminRegisteredOnboardingSession,
} from '@/features/auth/admin-registered'
import { usePortalMeQuery } from '@/features/auth/sign-in'
import illustExclamationUrl from '@/shared/assets/illustration/illust-exclamation.svg'
import { getAccessToken } from '@/shared/lib/auth-token'
import { isRemoteApiConfigured } from '@/shared/lib'
import { PFButton, PFText } from '@/shared/ui'
import styles from './notice.module.css'
import { authPageCopyClass } from '@/widgets/layout/auth-page-shell'

function AdminRegisteredFirstLoginNotice() {
  const navigate = useNavigate()
  const remote = isRemoteApiConfigured()
  const meQuery = usePortalMeQuery({
    enabled: remote && Boolean(getAccessToken()),
  })

  useEffect(() => {
    if (!remote) return
    if (meQuery.isPending && !meQuery.data) return
    const me = meQuery.data
    if (!me || !requiresAdminRegisteredOnboarding(me)) return

    if (me.email?.trim()) {
      syncAdminRegisteredOnboardingSession(me.email, me, 'first-login')
    }

    const target = resolveAdminProvisionedOnboardingEntryPath(me)
    if (target && target !== '/auth/admin-registered/notice') {
      navigate(target, { replace: true })
    }
  }, [meQuery.data, meQuery.isPending, navigate, remote])

  const handleChangePassword = () => {
    if (remote && meQuery.data) {
      const target = resolveAdminProvisionedOnboardingEntryPath(meQuery.data)
      if (target) {
        navigate(target)
        return
      }
    }
    navigate('/auth/admin-registered/birth')
  }

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
          안전한 이용을 위해 본인인증 후 비밀번호를 변경해 주세요.
        </PFText>
      </div>

      <div className={styles.actions}>
        <PFButton size="xlarge" width="100%" onClick={handleChangePassword}>
          본인인증 후 비밀번호 변경하기
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
