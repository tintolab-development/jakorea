import type { SignUpStepComponent, SignUpStepNumber } from '@/features/auth/sign-up'
import { Step1MemberType } from './steps/step-1-member-type'
import { Step2 } from './steps/step-2'
import { Step3 } from './steps/step-3'
import { Step4 } from './steps/step-4'
import { Step5 } from './steps/step-5'
import { Step6 } from './steps/step-6'
import { Step7 } from './steps/step-7'
import { Step8 } from './steps/step-8'

export const STEP_COMPONENTS = {
  1: Step1MemberType,
  2: Step2,
  3: Step3,
  4: Step4,
  5: Step5,
  6: Step6,
  7: Step7,
  8: Step8,
} as const satisfies Record<SignUpStepNumber, SignUpStepComponent>
