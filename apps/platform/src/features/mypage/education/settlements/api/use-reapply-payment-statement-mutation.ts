import { useMutation, useQueryClient } from '@tanstack/react-query'
import { platformQueryKeys } from '@/shared/api/query-keys'
import { reapplyCorrectedPaymentStatement } from './instructor-settlement-client.ts'

/** 정정 승인된 지급조서(DRAFT) 재신청. 성공하면 목록을 다시 불러와 상태가 "지급조서 재신청"으로 바뀐다. */
export function useReapplyPaymentStatementMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settlementId: number) => reapplyCorrectedPaymentStatement(settlementId),
    retry: false,
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.settlementApplications(),
      })
      void queryClient.invalidateQueries({
        queryKey: platformQueryKeys.mypage.programApplications.all(),
      })
    },
  })
}
