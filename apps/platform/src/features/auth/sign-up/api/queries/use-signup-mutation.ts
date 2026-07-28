import { useMutation } from '@tanstack/react-query'
import { postGeneralSignup, postTeacherSignup } from '../client'
import type {
  HomepageGeneralSignupRequest,
  HomepageTeacherSignupRequest,
} from '../../model/types/signup-api.types'

export function useSignupMutation() {
  return useMutation({
    mutationFn: (
      input:
        | { kind: 'general'; body: HomepageGeneralSignupRequest }
        | { kind: 'teacher'; body: HomepageTeacherSignupRequest },
    ) => {
      if (input.kind === 'teacher') {
        return postTeacherSignup(input.body)
      }
      return postGeneralSignup(input.body)
    },
  })
}
