import type { ProgramRoundRequest } from '@/shared/api/generated/dashboard/schemas/programRoundRequest'
import type { Program, ProgramRound } from '@/types/domain'

/**
 * GET `rounds[].id` = `program_schedule` PK (`"187700"`).
 * 화면용 `${programId}-round-1` 은 PATCH에 넣지 않는다. 새 회차는 id 생략.
 */
export function persistedProgramScheduleId(
  id: string | number | null | undefined
): string | undefined {
  if (id == null) return undefined
  const raw = String(id).trim()
  if (!/^\d+$/.test(raw)) return undefined
  return raw
}

export function mapProgramRoundToWriteRequest(
  round: Pick<
    ProgramRound,
    'id' | 'roundNumber' | 'capacity' | 'classCount' | 'status' | 'curriculum' | 'deliveryType'
  >,
  dates: { startDate?: string; endDate?: string }
): ProgramRoundRequest {
  const id = persistedProgramScheduleId(round.id)
  return {
    ...(id ? { id } : {}),
    roundNumber: round.roundNumber,
    startDate: dates.startDate,
    endDate: dates.endDate,
    capacity: round.capacity,
    classCount: round.classCount,
    status: round.status,
    curriculum: round.curriculum,
    deliveryType: round.deliveryType,
  }
}

export function mapProgramRoundsToWriteRequest(
  program: Pick<Program, 'rounds'>,
  toDate: (value: ProgramRound['startDate'] | undefined) => string | undefined
): ProgramRoundRequest[] {
  return (program.rounds ?? []).map(round =>
    mapProgramRoundToWriteRequest(round, {
      startDate: toDate(round.startDate),
      endDate: toDate(round.endDate),
    })
  )
}
