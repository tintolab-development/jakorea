import type { UseSignUpReturn } from '@/features/auth/sign-up'
import illustExclamationUrl from '@/shared/assets/illustration/illust-exclamation.svg'
import { PFButton, PFText } from '@/shared/ui'
import styles from './step-2-guardian-consent.module.css'

type Step2GuardianConsentProps = {
  signUp: UseSignUpReturn
}

export function Step2GuardianConsent({ signUp }: Step2GuardianConsentProps) {
  const { birth } = signUp

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
          <PFText as="div" typo="hd-md" color="black" className={styles.title}>
            보호자님의 확인이 필요해요
          </PFText>
          <PFText as="p" typo="bd-lg-rg" color="neutral-cool-500" className={styles.description}>
            만 14세 미만 회원은 안전한 서비스 이용을 위해
            <br />
            보호자 동의가 필요해요.
            <br />
            <br />
            보호자님의 본인인증과 동의가 완료되면 가입을 이어갈 수 있어요.
          </PFText>
        </div>

        <div className={styles.actions}>
          <PFButton size="xlarge" width="100%" onClick={birth.startGuardianConsent}>
            보호자 동의 받기
          </PFButton>
        </div>
      </div>
    </section>
  )
}
