import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { ConfirmationStep } from './confirmation'
import { ProfileStep } from './profile'

type Step7Props = {
  signUp: UseSignUpReturn
}

export function Step7({ signUp }: Step7Props) {
  return signUp.guardian.isUnderAgeSignup ? (
    <ProfileStep signUp={signUp} />
  ) : (
    <ConfirmationStep signUp={signUp} />
  )
}
