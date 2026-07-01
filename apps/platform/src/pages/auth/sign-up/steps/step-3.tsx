import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { Step3Agreement } from './step-3-agreement'
import { Step3Identity } from './step-3-identity'

type Step3Props = {
  signUp: UseSignUpReturn
}

export function Step3({ signUp }: Step3Props) {
  return signUp.identity.isVerified ? (
    <Step3Agreement signUp={signUp} />
  ) : (
    <Step3Identity signUp={signUp} />
  )
}
