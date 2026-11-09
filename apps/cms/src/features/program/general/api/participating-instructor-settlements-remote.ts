import { queryOptions } from '@tanstack/react-query'
import { fetchSettlementListPageRemote } from '@/features/settlement-management/api/settlement-api-client'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { isMemberInstructorSettlementsRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import type { SettlementListItemResponse } from '@/shared/api/generated/settlement/schemas'
import type { InstructorSessionSummary } from '@/shared/api/generated/settlement/schemas/instructorSessionSummary'

const PAGE_SIZE = 20

function parseNumericId(value: string | number | undefined | null): number | null {
  if (value == null || value === '') return null
  const n = typeof value === 'number' ? value : Number(String(value).trim())
  return Number.isFinite(n) && n > 0 ? n : null
}

export interface ParticipatingInstructorSettlementsResult {
  items: SettlementListItemResponse[]
  /**
   * programId + instructorMemberId 조회 시 서버가 내려주는 강사 배정 기준 회차 요약.
   * 응답에서 누락되면 null — 0/0으로 바꾸지 않는다.
   */
  instructorSessionSummary: InstructorSessionSummary | null
}

/** `GET /api/admin/settlements?programId&instructorMemberId` — 정산 현황 탭 정본 (확정 정산 + 확정 전 신청서 행) */
export async function fetchParticipatingInstructorSettlementsRemote(input: {
  programId: string | number
  instructorMemberId: string | number
}): Promise<ParticipatingInstructorSettlementsResult> {
  const programId = parseNumericId(input.programId)
  const instructorMemberId = parseNumericId(input.instructorMemberId)
  if (programId == null || instructorMemberId == null) {
    throw new Error('정산 현황 조회에는 programId와 instructorMemberId가 필요합니다.')
  }

  const items: SettlementListItemResponse[] = []
  let instructorSessionSummary: InstructorSessionSummary | null = null
  let page = 0
  for (;;) {
    const res = await fetchSettlementListPageRemote({
      programId,
      instructorMemberId,
      // 프로그램 참여 강사 정산 표 — 계좌 지급 완료 건 포함(기획 확정 2026-11-09)
      includePaid: true,
      page,
      size: PAGE_SIZE,
    })
    if (page === 0) instructorSessionSummary = res.instructorSessionSummary ?? null
    const batch = res.items ?? []
    items.push(...batch)
    const totalPages = res.totalPages ?? 0
    if (batch.length === 0 || page + 1 >= totalPages) break
    page += 1
  }

  return { items, instructorSessionSummary }
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
