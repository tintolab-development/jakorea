import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { Step4Email } from './step-4-email'
import { Step5Password } from './step-5-password'

type Step5Props = {
  signUp: UseSignUpReturn
}

export function Step5({ signUp }: Step5Props) {
  return signUp.guardian.isUnderAgeSignup ? (
    <Step4Email signUp={signUp} />
  ) : (
    <Step5Password signUp={signUp} />
  )
}
