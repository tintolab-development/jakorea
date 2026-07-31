import { useMutation } from '@tanstack/react-query'
import { postPortalLogin } from './client'
import type { MemberLoginRequest } from './types'

export function usePortalLoginMutation() {
  return useMutation({
    mutationFn: (body: MemberLoginRequest) => postPortalLogin(body),
  })
}
