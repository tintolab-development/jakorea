import {
  RegisterTermsAgreement,
  TermsViewModal,
  useSignUpConsent,
  useTermsViewModal,
} from '@/features/auth'
import { PFText } from '@/shared/ui'
import styles from './sign-up-page.module.css'

export function SignUpPage() {
  const { consent, setField, toggleAll, allChecked, isRequiredValid } = useSignUpConsent()
  const { openType, isOpen, open, close } = useTermsViewModal()

  return (
    <section className={styles.page}>
      <div className={styles.header}>
        <PFText as="h1" typo="hd-lg" color="black">
          회원가입
        </PFText>
        <PFText as="p" typo="bd-md-rg" color="neutral-cool-600">
          서비스 이용을 위해 약관에 동의해 주세요.
        </PFText>
      </div>

      <RegisterTermsAgreement
        value={consent}
        allChecked={allChecked}
        onToggleAll={toggleAll}
        onFieldChange={setField}
        onViewTerm={open}
      />

      <PFText
        as="p"
        typo="caption-rg"
        color={isRequiredValid ? 'success' : 'neutral-cool-500'}
        className={styles.validationHint}
        aria-live="polite"
      >
        {isRequiredValid
          ? '필수 약관에 모두 동의했습니다.'
          : '필수 약관에 모두 동의해야 다음 단계로 진행할 수 있습니다.'}
      </PFText>

      {openType ? (
        <TermsViewModal open={isOpen} type={openType} onClose={close} />
      ) : null}
    </section>
  )
}
