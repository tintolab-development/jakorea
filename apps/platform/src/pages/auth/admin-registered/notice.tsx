import {
  getAdminRegisteredSignUpChangePasswordPath,
  isAdminRegisteredSignUpEntry,
} from '@/features/auth/admin-registered'
import illustExclamationUrl from '@/shared/assets/illustration/illust-exclamation.svg'
import { PFButton, PFText } from '@/shared/ui'
import styles from './notice.module.css'

function AdminRegisteredFirstLoginNotice() {
  const handleChangePassword = () => {
    window.location.assign('/auth/admin-registered/birth')
  }

  return (
    <>
      <PFText as="p" typo="bd-lg-rg" color="primary-800" className={styles.description}>
        현재 비밀번호는 가입된 이메일 주소와 동일합니다.
        <br />
        안전한 이용을 위해 본인인증 후 비밀번호를 변경해 주세요.
      </PFText>

      <div className={styles.actions}>
        <PFButton size="xlarge" width="100%" onClick={handleChangePassword}>
          본인인증 후 비밀번호 변경하기
        </PFButton>
      </div>
    </>
  )
}

function AdminRegisteredSignUpNotice() {
  const handleChangePassword = () => {
    window.location.assign(getAdminRegisteredSignUpChangePasswordPath())
  }

  const handleFindEmail = () => {
    window.location.assign('/auth/find-email')
  }

  return (
    <>
      <PFText as="p" typo="bd-lg-rg" color="primary-800" className={styles.description}>
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

  return (
    <section className={styles.page}>
      <div className={styles.container}>
        <div className={styles.intro}>
          <img
            className={styles.illustration}
            src={illustExclamationUrl}
            alt=""
            aria-hidden="true"
          />
          <PFText as="h1" typo="hd-md" color="black" className={styles.title}>
            관리자가 등록한 계정이에요.
          </PFText>
          {isSignUpEntry ? <AdminRegisteredSignUpNotice /> : <AdminRegisteredFirstLoginNotice />}
        </div>
      </div>
    </section>
  )
}
