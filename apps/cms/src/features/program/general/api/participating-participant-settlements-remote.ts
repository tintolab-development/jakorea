import { queryOptions } from '@tanstack/react-query'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { shouldUseGeneralProgramProgressRemoteApi } from '@/features/program/general/api/program-progress-remote-capabilities'
import { isMemberInstructorSettlementsRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import { customInstance } from '@/shared/api/orval-mutator'

/** BE `ParticipantSettlementListItemResponse` — dashboard Orval 대기 중 수동 타입 */
export type ParticipantSettlementListItemResponse = {
  receiptId?: number
  submittedAt?: string
  itemSummary?: string
  itemType?: string
  expenseType?: string
  amount?: number
  receiptStatus?: string
  settlementId?: number | null
  paymentStatus?: string | null
  availableActions?: string[]
}

export type ParticipantSettlementListPageResponse = {
  items?: ParticipantSettlementListItemResponse[]
  content?: ParticipantSettlementListItemResponse[]
  totalElements?: number
  totalPages?: number
  page?: number
  size?: number
}

function parseNumericId(value: string | number | undefined | null): number | null {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number(String(value).trim())
  return Number.isFinite(n) && n > 0 ? n : null
}

export async function fetchParticipatingParticipantSettlementsRemote(input: {
  programId: string | number
  participantId: string | number
  page?: number
  size?: number
}): Promise<ParticipantSettlementListItemResponse[]> {
  const programId = parseNumericId(input.programId)
  const participantId = parseNumericId(input.participantId)
  if (programId == null || participantId == null) return []

  const response = await customInstance<ParticipantSettlementListPageResponse>({
    url: `/api/admin/programs/${programId}/participants/${participantId}/settlements`,
    method: 'GET',
    params: { page: input.page ?? 0, size: input.size ?? 20 },
  })

  const items = response?.content ?? response?.items ?? []
  return items.map(item => ({
    ...item,
    availableActions: item.availableActions ?? [],
  })).filter(item => {
    const type = (item.itemType ?? item.expenseType ?? '').trim().toLowerCase()
    return type !== 'accommodation' && !type.includes('lodging')
  })
}

export function participatingParticipantSettlementsQueryOptions(input: {
  programId: string
  participantId: string
}) {
  return queryOptions({
    queryKey: generalProgramProgressQueryKeys.participantSettlements(
      input.programId,
      input.participantId
    ),
    staleTime: 30_000,
    queryFn: () =>
      fetchParticipatingParticipantSettlementsRemote({
        programId: input.programId,
        participantId: input.participantId,
      }),
  })
}

export function isParticipatingParticipantSettlementsRemoteEnabled(): boolean {
  return (
    shouldUseGeneralProgramProgressRemoteApi() && isMemberInstructorSettlementsRemoteEnabled()
  )
}
