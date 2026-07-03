import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { BirthStep } from './birth'
import { GuardianConsentStep } from './guardian-consent'

type Step2Props = {
  signUp: UseSignUpReturn
}

export function Step2({ signUp }: Step2Props) {
  return signUp.birth.requiresGuardianConsent ? (
    <GuardianConsentStep signUp={signUp} />
  ) : (
    <BirthStep signUp={signUp} />
  )
}
