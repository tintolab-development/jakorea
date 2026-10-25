import {
  buildUjatTypedHalfPlanFromOverlay,
  findUjatTypedHalf,
  mergeUjatTypedHalfPlan,
  normalizeUjatTypedDetailDates,
  normalizeUjatTypedHalfPlanForWrite,
  ujatTypedHalfPlansEqual,
  UJAT_TYPED_SEMESTER_BY_HALF,
} from '@/features/program/ujat/lib/ujat-typed-detail'
import { fetchUjatTypedDetail, putUjatTypedDetailHalf } from './ujat-typed-detail-client'

/**
 * typed 가 저장된 UJAT 프로그램 — 저장할 overlay 의 반기 값을 반기 PUT(expectedRevision)으로 먼저 반영한다.
 * 바뀐 반기만 보낸다. 409(다른 관리자 변경)는 그대로 던져 저장을 멈춘다.
 * typed 가 없는 기존 프로그램에는 호출하지 않는다(backfill 금지).
 */
export async function syncStoredUjatTypedHalves(
  programId: number | string,
  overlay: Record<string, unknown>
): Promise<{ sentHalves: string[]; revision: number | null }> {
  // GET 이 레거시 배열 날짜를 주더라도 기준값을 문자열로 맞춘 뒤 병합한다(배열 그대로 다시 쓰지 않음).
  const current = normalizeUjatTypedDetailDates(await fetchUjatTypedDetail(programId))
  let revision = typeof current?.revision === 'number' ? current.revision : 0
  let detail = current
  const sentHalves: string[] = []
  for (const half of ['h1', 'h2'] as const) {
    const existing = findUjatTypedHalf(detail, half)
    const built = buildUjatTypedHalfPlanFromOverlay(overlay, half)
    if (!existing && !built) continue
    const next = normalizeUjatTypedHalfPlanForWrite(mergeUjatTypedHalfPlan(existing, built, half))
    if (ujatTypedHalfPlansEqual(existing, next)) continue
    const semesterType = UJAT_TYPED_SEMESTER_BY_HALF[half]
    detail = await putUjatTypedDetailHalf(programId, semesterType, {
      expectedRevision: revision,
      halfPlan: next,
    })
    revision = typeof detail?.revision === 'number' ? detail.revision : revision + 1
    sentHalves.push(semesterType)
  }
  return { sentHalves, revision }
}
