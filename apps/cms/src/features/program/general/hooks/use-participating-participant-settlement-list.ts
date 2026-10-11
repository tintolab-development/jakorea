import { useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import {
  isParticipatingParticipantSettlementsRemoteEnabled,
  participatingParticipantSettlementsQueryOptions,
} from '@/features/program/general/api/participating-participant-settlements-remote'
import {
  mapParticipantSettlementsToRows,
  type ParticipatingParticipantSettlementRow,
} from '@/features/program/general/lib/map-participant-settlement-list-rows'
import { useNotifyProgramApiUnavailableOnce } from '@/features/program/shared/lib/program-api-unavailable'

export function useParticipatingParticipantSettlementList(input: {
  programId: string
  participantId: string
  enabled?: boolean
}): {
  remoteEnabled: boolean
  isLoading: boolean
  rows: ParticipatingParticipantSettlementRow[]
  invalidate: () => Promise<void>
} {
  const remoteEnabled = isParticipatingParticipantSettlementsRemoteEnabled()
  const participantId = input.participantId.trim()
  const queryEnabled = Boolean(
    input.enabled !== false && remoteEnabled && input.programId && participantId
  )

  useNotifyProgramApiUnavailableOnce(
    Boolean(input.enabled !== false && (!remoteEnabled || !participantId)),
    'general-participating-participant-settlement',
    '참여자 · 정산 현황'
  )

  const settlementsQuery = useQuery({
    ...participatingParticipantSettlementsQueryOptions({
      programId: input.programId,
      participantId,
    }),
    enabled: queryEnabled,
    retry: false,
  })

  const queryClient = useQueryClient()

  const rows = useMemo(() => {
    if (!queryEnabled) return []
    return mapParticipantSettlementsToRows(settlementsQuery.data ?? [])
  }, [queryEnabled, settlementsQuery.data])

  const invalidate = async () => {
    await queryClient.invalidateQueries({
      queryKey: generalProgramProgressQueryKeys.participantSettlements(
        input.programId,
        participantId
      ),
    })
  }

  return {
    remoteEnabled,
    isLoading: queryEnabled && settlementsQuery.isLoading,
    rows,
    invalidate,
  }
}
