import { queryOptions } from '@tanstack/react-query'
import { fetchAllSettlementsRemote } from '@/features/settlement-management/api/settlement-api-client'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { isMemberInstructorSettlementsRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import type { SettlementListItemResponse } from '@/shared/api/generated/settlement/schemas'

function parseNumericId(value: string | number | undefined | null): number | null {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number(String(value).trim())
  return Number.isFinite(n) && n > 0 ? n : null
}

export async function fetchParticipatingInstructorSettlementsRemote(input: {
  programId: string | number
  instructorMemberId: string | number
}): Promise<SettlementListItemResponse[]> {
  const programId = parseNumericId(input.programId)
  const instructorMemberId = parseNumericId(input.instructorMemberId)
  if (programId == null || instructorMemberId == null) return []

  return (await fetchAllSettlementsRemote({ programId, instructorMemberId })) ?? []
}

export function participatingInstructorSettlementsQueryOptions(input: {
  programId: string
  instructorMemberId: string
}) {
  return queryOptions({
    queryKey: generalProgramProgressQueryKeys.instructorSettlements(
      input.programId,
      input.instructorMemberId
    ),
    staleTime: 30_000,
    queryFn: () =>
      fetchParticipatingInstructorSettlementsRemote({
        programId: input.programId,
        instructorMemberId: input.instructorMemberId,
      }),
  })
}

export function isParticipatingInstructorSettlementsRemoteEnabled(): boolean {
  return isMemberInstructorSettlementsRemoteEnabled()
}
