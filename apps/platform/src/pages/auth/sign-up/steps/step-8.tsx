import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { ConfirmationStep } from './confirmation'

type Step8Props = {
  signUp: UseSignUpReturn
}

export function Step8({ signUp }: Step8Props) {
  return <ConfirmationStep signUp={signUp} />
}
