import type { SignUpStepComponent, SignUpStepNumber } from '@/features/auth/sign-up'
import { AgreementStep } from './steps/agreement'
import { BirthStep } from './steps/birth'
import { ConfirmationStep } from './steps/confirmation'
import { EmailStep } from './steps/email'
import { GuardianAgreementStep } from './steps/guardian-agreement'
import { GuardianConsentStep } from './steps/guardian-consent'
import { GuardianIdentityStep } from './steps/guardian-identity'
import { GuardianProfileStep } from './steps/guardian-profile-step'
import { IdentityStep } from './steps/identity'
import { MemberTypeStep } from './steps/member-type'
import { PasswordStep } from './steps/password'
import { MinorProfileStep } from './steps/minor-profile-step'
import { ProfileStep } from './steps/profile'
import { TeacherProfileStep } from './steps/teacher-profile'

const Step2: SignUpStepComponent = ({ signUp }) =>
  signUp.birth.requiresGuardianConsent ? (
    <GuardianConsentStep signUp={signUp} />
  ) : (
    <BirthStep signUp={signUp} />
  )

const Step3: SignUpStepComponent = ({ signUp }) => {
  if (signUp.guardian.isUnderAgeSignup) {
    if (!signUp.guardian.isAgreementCompleted) {
      return <GuardianAgreementStep signUp={signUp} />
    }

    if (!signUp.guardian.isProfileCompleted) {
      return <GuardianProfileStep signUp={signUp} />
    }

    return <GuardianIdentityStep signUp={signUp} />
  }

  return signUp.identity.isVerified ? (
    <AgreementStep signUp={signUp} />
  ) : (
    <IdentityStep signUp={signUp} />
  )
}

const Step4: SignUpStepComponent = ({ signUp }) => <EmailStep signUp={signUp} />

const Step5: SignUpStepComponent = ({ signUp }) => <PasswordStep signUp={signUp} />

const Step6: SignUpStepComponent = ({ signUp }) => {
  if (signUp.guardian.isUnderAgeSignup) {
    return <MinorProfileStep signUp={signUp} />
  }

  if (signUp.memberType.selected === 'teacher') {
    return <TeacherProfileStep signUp={signUp} />
  }

  return <ProfileStep signUp={signUp} />
}

const Step7: SignUpStepComponent = ({ signUp }) => <ConfirmationStep signUp={signUp} />

export const STEP_COMPONENTS = {
  1: MemberTypeStep,
  2: Step2,
  3: Step3,
  4: Step4,
  5: Step5,
  6: Step6,
  7: Step7,
} as const satisfies Record<SignUpStepNumber, SignUpStepComponent>
