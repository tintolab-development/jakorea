import { createElement } from 'react'
import { useSignUp } from '@/features/auth/sign-up'
import type { SignUpStepNumber } from '@/features/auth/sign-up'
import { STEP_COMPONENTS } from './step-registry'

export function SignUpPage() {
  const signUp = useSignUp()

  return createElement(STEP_COMPONENTS[signUp.step.current as SignUpStepNumber], { signUp })
}
