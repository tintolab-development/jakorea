import type { SignUpStepComponent, SignUpStepNumber } from '@/features/auth/sign-up'
import { Step1MemberType } from './steps/step-1-member-type'
import { Step2Birth } from './steps/step-2-birth'
import { Step3 } from './steps/step-3'
import { Step4Email } from './steps/step-4-email'
import { Step5Password } from './steps/step-5-password'
import { Step6Profile } from './steps/step-6-profile'
import { Step7Confirmation } from './steps/step-7-confirmation'

export const STEP_COMPONENTS = {
  1: Step1MemberType,
  2: Step2Birth,
  3: Step3,
  4: Step4Email,
  5: Step5Password,
  6: Step6Profile,
  7: Step7Confirmation,
} as const satisfies Record<SignUpStepNumber, SignUpStepComponent>
