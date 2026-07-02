import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { Step3Agreement } from './step-3-agreement'
import { Step3GuardianAgreement } from './step-3-guardian-agreement'
import { Step3GuardianIdentity } from './step-3-guardian-identity'
import { Step3Identity } from './step-3-identity'

type Step3Props = {
  signUp: UseSignUpReturn
}

export function Step3({ signUp }: Step3Props) {
  if (signUp.guardian.isUnderAgeSignup) {
    if (!signUp.guardian.isAgreementCompleted) {
      return <Step3GuardianAgreement signUp={signUp} />
    }

    return <Step3GuardianIdentity signUp={signUp} />
  }

  return signUp.identity.isVerified ? (
    <Step3Agreement signUp={signUp} />
  ) : (
    <Step3Identity signUp={signUp} />
  )
}
