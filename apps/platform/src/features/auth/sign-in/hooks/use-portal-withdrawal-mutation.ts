import { useMutation } from '@tanstack/react-query'
import { postPortalWithdrawal } from '../api/client'
import type { PortalWithdrawalRequest } from '../api/types'

export function usePortalWithdrawalMutation() {
  return useMutation({
    mutationFn: (body: PortalWithdrawalRequest) => postPortalWithdrawal(body),
  })
}
