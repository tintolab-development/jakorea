import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { Step5Password } from './step-5-password'
import { Step6Profile } from './step-6-profile'

type Step6Props = {
  signUp: UseSignUpReturn
}

export function Step6({ signUp }: Step6Props) {
  return signUp.guardian.isUnderAgeSignup ? (
    <Step5Password signUp={signUp} />
  ) : (
    <Step6Profile signUp={signUp} />
  )
}
