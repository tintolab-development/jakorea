import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  canRevealProgramGeneralPii,
  canRevealProgramSensitivePii,
  fetchProgramMyAssignment,
  isUnknownAssignmentRole,
  programMyAssignmentQueryKey,
  type ProgramMyAssignment,
} from '@/features/program/shared/lib/program-my-assignment'

export function useMyProgramPrivacyRole(programId: string | number | null | undefined): {
  assignment: ProgramMyAssignment | null
  pending: boolean
  canRevealGeneral: boolean
  canRevealSensitive: boolean
  refetch: () => Promise<ProgramMyAssignment | null>
} {
  const queryClient = useQueryClient()
  const adminAccountId = useAuthStore(state => state.user?.adminAccountId ?? null)
  const id = programId == null ? '' : String(programId).trim()
  const enabled = id.length > 0
  const queryKey = programMyAssignmentQueryKey(id || '_', adminAccountId)
  const query = useQuery({
    queryKey,
    enabled,
    retry: false,
    staleTime: 0,
    queryFn: async () => {
      if (adminAccountId == null) return null
      return fetchProgramMyAssignment(id)
    },
  })

  const assignment = enabled && query.isSuccess ? (query.data ?? null) : null
  const unknown = isUnknownAssignmentRole(assignment)
  const failed = enabled && (query.isError || unknown || adminAccountId == null)

  return {
    assignment: failed ? null : assignment,
    pending: enabled && (query.isPending || query.isError || unknown || adminAccountId == null),
    canRevealGeneral: !failed && canRevealProgramGeneralPii(assignment),
    canRevealSensitive: !failed && canRevealProgramSensitivePii(assignment),
    refetch: async () => {
      if (!enabled) return null
      const result = await queryClient.fetchQuery({
        queryKey,
        staleTime: 0,
        queryFn: async () => {
          if (adminAccountId == null) return null
          return fetchProgramMyAssignment(id)
        },
      })
      return result ?? null
    },
  }
}
