import { useMutation, useQueryClient } from '@tanstack/react-query'
import { updateSystemIssueStatus } from '@/features/logs/api/admin-logs-service'
import { logsQueryKeys } from '@/features/logs/api/logs-query-keys'

export function useUpdateSystemIssueStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ issueId, status }: { issueId: number; status: string }) =>
      updateSystemIssueStatus(issueId, status),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: logsQueryKeys.all })
      void queryClient.invalidateQueries({
        queryKey: logsQueryKeys.systemIssueDetail(variables.issueId),
      })
    },
  })
}
