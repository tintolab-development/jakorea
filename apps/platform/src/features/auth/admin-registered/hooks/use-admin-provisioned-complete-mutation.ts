import { useMutation } from '@tanstack/react-query'
import { postAdminProvisionedComplete } from '../api/client'

/** Class G — 관리자 등록 온보딩 가입정보 최종 확인. */
export function useAdminProvisionedCompleteMutation() {
  return useMutation({
    mutationFn: () => postAdminProvisionedComplete(),
    retry: false,
  })
}
