import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { PLATFORM_ALERT_COPY } from '@/shared/lib/platform-alert-copy'
import { PFAlertModal, PFButton, PFInfoReview, PFText } from '@/shared/ui'
import { SignUpLayout } from '../layout/shell'
import { SignUpStepLayout } from '../layout/sign-up-step-layout'
import styles from '../wizard.module.css'

type ConfirmationStepProps = {
  signUp: UseSignUpReturn
}

export function ConfirmationStep({ signUp }: ConfirmationStepProps) {
  const { step, confirmation, identity } = signUp

  return (
    <SignUpLayout currentStep={step.current} totalSteps={step.total}>
      <SignUpStepLayout
        title="입력한 정보를 확인해 주세요."
        description={
          <>
            정보를 확인해 주세요.
            <br />
            내용이 맞다면 아래 버튼을 눌러 가입을 완료해 주세요.
          </>
        }
        actionsVariant="terms"
        actions={
          <>
            <PFButton
              size="xlarge"
              width="100%"
              disabled={confirmation.isSubmitting}
              onClick={confirmation.complete}
            >
              {confirmation.isSubmitting ? '가입 처리 중…' : '가입 완료하기'}
            </PFButton>
            <PFButton
              size="xlarge"
              variant="tertiary"
              width="100%"
              disabled={confirmation.isSubmitting}
              onClick={step.goPrevious}
            >
              이전
            </PFButton>
          </>
        }
      >
        <PFInfoReview rows={confirmation.rows} className={styles.confirmReview} />
        {confirmation.message ? (
          <PFText as="p" typo="bd-sm-md" color="error" className={styles.confirmSubmitMessage}>
            {confirmation.message}
          </PFText>
        ) : null}
      </SignUpStepLayout>
      {/* 최종 가입 409(PHONE_ALREADY_REGISTERED·IDENTITY_ALREADY_LINKED) 방어 — 본인인증 단계와 같은 「중복 가입 시」 팝업 */}
      <PFAlertModal
        open={identity.duplicateMemberNotice.open}
        title={PLATFORM_ALERT_COPY.duplicateMember.title}
        description={PLATFORM_ALERT_COPY.duplicateMember.description}
        cancelLabel="확인"
        onCancel={identity.duplicateMemberNotice.close}
        confirmLabel="로그인하기"
        confirmVariant="primary"
        onConfirm={identity.duplicateMemberNotice.goSignIn}
      />
    </SignUpLayout>
  )
}
