import { createElement } from 'react'
import { useSignUp } from '@/features/auth/sign-up'
import type { SignUpStepNumber } from '@/features/auth/sign-up'
import { PFAlertModal } from '@/shared/ui'
import { STEP_COMPONENTS } from './step-registry.tsx'

export function SignUpPage() {
  const signUp = useSignUp()
  const { copy, close } = signUp.requestErrorAlert

  return (
    <>
      {createElement(STEP_COMPONENTS[signUp.step.current as SignUpStepNumber], { signUp })}
      {/* 단계 공통 요청 실패 — 시안 「처리 실패 / 처리 제한 / 네트워크 오류」 */}
      <PFAlertModal
        open={copy != null}
        title={copy?.title ?? ''}
        description={copy?.description}
        onConfirm={close}
      />
    </>
  )
}
