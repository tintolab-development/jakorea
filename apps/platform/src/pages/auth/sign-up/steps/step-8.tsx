import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { Step7Confirmation } from './step-7-confirmation'

type Step8Props = {
  signUp: UseSignUpReturn
}

export function Step8({ signUp }: Step8Props) {
  return <Step7Confirmation signUp={signUp} />
}
