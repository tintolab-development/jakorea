import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { EmailStep } from './email'
import { GuardianConfirmStep } from './guardian-confirm'

type Step4Props = {
  signUp: UseSignUpReturn
}

export function Step4({ signUp }: Step4Props) {
  return signUp.guardian.isUnderAgeSignup ? (
    <GuardianConfirmStep signUp={signUp} />
  ) : (
    <EmailStep signUp={signUp} />
  )
}
