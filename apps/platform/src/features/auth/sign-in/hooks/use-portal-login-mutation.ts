import { useMutation } from '@tanstack/react-query'
import { postPortalLogin } from '../api/client'
import type { MemberLoginRequest } from '../api/types'

export function usePortalLoginMutation() {
  return useMutation({
    mutationFn: (body: MemberLoginRequest) => postPortalLogin(body),
  })
}
