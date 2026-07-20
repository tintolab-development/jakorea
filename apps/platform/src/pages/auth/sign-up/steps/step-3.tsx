import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { AgreementStep } from './agreement'
import { GuardianAgreementStep } from './guardian-agreement'
import { GuardianIdentityStep } from './guardian-identity'
import { IdentityStep } from './identity'

type Step3Props = {
  signUp: UseSignUpReturn
}

export function Step3({ signUp }: Step3Props) {
  if (signUp.guardian.isUnderAgeSignup) {
    if (!signUp.guardian.isAgreementCompleted) {
      return <GuardianAgreementStep signUp={signUp} />
    }

    return <GuardianIdentityStep signUp={signUp} />
  }

  return signUp.identity.isVerified ? (
    <AgreementStep signUp={signUp} />
  ) : (
    <IdentityStep signUp={signUp} />
  )
}
