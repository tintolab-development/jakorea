import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { EmailStep } from './email'
import { PasswordStep } from './password'

type Step5Props = {
  signUp: UseSignUpReturn
}

export function Step5({ signUp }: Step5Props) {
  return signUp.guardian.isUnderAgeSignup ? (
    <EmailStep signUp={signUp} />
  ) : (
    <PasswordStep signUp={signUp} />
  )
}
