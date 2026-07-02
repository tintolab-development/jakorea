import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { Step2Birth } from './step-2-birth'
import { Step2GuardianConsent } from './step-2-guardian-consent'

type Step2Props = {
  signUp: UseSignUpReturn
}

export function Step2({ signUp }: Step2Props) {
  return signUp.birth.requiresGuardianConsent ? (
    <Step2GuardianConsent signUp={signUp} />
  ) : (
    <Step2Birth signUp={signUp} />
  )
}
