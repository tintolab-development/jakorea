import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { Step4Email } from './step-4-email'
import { Step4GuardianConfirm } from './step-4-guardian-confirm'

type Step4Props = {
  signUp: UseSignUpReturn
}

export function Step4({ signUp }: Step4Props) {
  return signUp.guardian.isUnderAgeSignup ? (
    <Step4GuardianConfirm signUp={signUp} />
  ) : (
    <Step4Email signUp={signUp} />
  )
}
