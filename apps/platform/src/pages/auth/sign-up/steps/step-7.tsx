import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { Step6Profile } from './step-6-profile'
import { Step7Confirmation } from './step-7-confirmation'

type Step7Props = {
  signUp: UseSignUpReturn
}

export function Step7({ signUp }: Step7Props) {
  return signUp.guardian.isUnderAgeSignup ? (
    <Step6Profile signUp={signUp} />
  ) : (
    <Step7Confirmation signUp={signUp} />
  )
}
