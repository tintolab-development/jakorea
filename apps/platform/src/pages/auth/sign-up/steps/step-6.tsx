import type { UseSignUpReturn } from '@/features/auth/sign-up'
import { PasswordStep } from './password'
import { ProfileStep } from './profile'
import { TeacherProfileStep } from './teacher-profile'

type Step6Props = {
  signUp: UseSignUpReturn
}

export function Step6({ signUp }: Step6Props) {
  if (signUp.guardian.isUnderAgeSignup) {
    return <PasswordStep signUp={signUp} />
  }

  if (signUp.memberType.selected === 'teacher') {
    return <TeacherProfileStep signUp={signUp} />
  }

  return <ProfileStep signUp={signUp} />
}
