import {
  IDENTITY_MODULE_IDLE_DESCRIPTION,
  IDENTITY_MODULE_IDLE_TITLE,
} from '@jakorea/domain/shared/identity-module-copy'
import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { PLATFORM_ALERT_COPY } from '@/shared/lib/platform-alert-copy'
import { PFAlertModal, PFButton, PFText } from '@/shared/ui'
import { SignUpLayout } from '../layout/shell'
import { SignUpStepLayout } from '../layout/sign-up-step-layout'
import styles from '../wizard.module.css'

type IdentityStepProps = {
  signUp: UseSignUpReturn
}

export function IdentityStep({ signUp }: IdentityStepProps) {
  const { step, identity } = signUp

  const handleVerify = () => {
    if (identity.tryAdminRegisteredRedirect()) {
      return
    }
    void identity.verify()
  }

  return (
    <SignUpLayout currentStep={step.current} totalSteps={step.total}>
      <SignUpStepLayout
        title="본인인증을 진행해 주세요."
        description="안전하게 가입하기 위해 휴대폰 본인인증이 필요해요. 인증 결과는 생년월일과 함께 확인하며, 회원가입 절차에만 사용돼요."
        actions={
          <PFButton
            size="xlarge"
            width="100%"
            disabled={identity.isVerifying}
            onClick={handleVerify}
          >
            {identity.isVerifying ? '본인인증 진행 중…' : '휴대폰 본인인증하기'}
          </PFButton>
        }
      >
        <div className={styles.stepContent}>
          <div className={styles.identityModule}>
            <PFText as="p" typo="bd-sm-rg" color="neutral-warm-500">
              {IDENTITY_MODULE_IDLE_TITLE}
              <br />
              {IDENTITY_MODULE_IDLE_DESCRIPTION}
            </PFText>
            {identity.errorMessage && !identity.isProfileMismatch ? (
              <PFText as="p" typo="bd-sm-md" color="error" className={styles.stepMessage}>
                {identity.errorMessage}
              </PFText>
            ) : null}
          </div>
        </div>
      </SignUpStepLayout>
      {/* 생년월일·성별 불일치 — 인증 실패 팝업 (Figma 2761-76846) */}
      <PFAlertModal
        open={identity.isProfileMismatch}
        title="본인인증을 완료하지 못했어요."
        description="정보를 확인한 뒤 다시 시도해 주세요."
        onConfirm={identity.dismissError}
      />
      {/* 이미 가입된 회원 — 시안 「중복 가입 시」(14502-51088): [확인] + [로그인하기] */}
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
