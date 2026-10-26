import customInstance from '@/shared/api/orval-mutator'
import {
  normalizeUjatTypedDetailForWrite,
  normalizeUjatTypedHalfPlanForWrite,
  type UjatTypedDetail,
  type UjatTypedHalfPlan,
  type UjatTypedSemester,
} from '@/features/program/ujat/lib/ujat-typed-detail'

function unwrapApiBody<T>(payload: unknown): T {
  if (payload != null && typeof payload === 'object') {
    const body = payload as Record<string, unknown>
    if (body.success === true && 'data' in body) return unwrapApiBody<T>(body.data)
  }
  return payload as T
}

function typedDetailPath(programId: number | string): string {
  return `/api/admin/programs/${encodeURIComponent(String(programId))}/ujat/typed-detail`
}

/** GET …/ujat/typed-detail — typed 가 없으면 서버가 overlay 를 읽기 전용으로 변환해 돌려준다(DB 변경 없음). */
export async function fetchUjatTypedDetail(programId: number | string): Promise<UjatTypedDetail> {
  return unwrapApiBody(await customInstance({ url: typedDetailPath(programId), method: 'GET' }))
}

/** PUT …/ujat/typed-detail/halves/{semesterType} — 지정 반기만 교체. expectedRevision 이 다르면 409. */
export async function putUjatTypedDetailHalf(
  programId: number | string,
  semesterType: UjatTypedSemester,
  body: { expectedRevision: number; halfPlan: UjatTypedHalfPlan }
): Promise<UjatTypedDetail> {
  return unwrapApiBody(
    await customInstance({
      url: `${typedDetailPath(programId)}/halves/${semesterType}`,
      method: 'PUT',
      // 날짜는 항상 "YYYY-MM-DD" 문자열로 보낸다(Jackson 배열·Date·dayjs 금지).
      data: { ...body, halfPlan: normalizeUjatTypedHalfPlanForWrite(body.halfPlan) },
    })
  )
}

/** PATCH …/ujat/typed-detail — JSON Merge Patch(생략 유지, null 삭제). */
export async function patchUjatTypedDetail(
  programId: number | string,
  patch: Record<string, unknown>
): Promise<UjatTypedDetail> {
  return unwrapApiBody(
    await customInstance({
      url: typedDetailPath(programId),
      method: 'PATCH',
      data: normalizeUjatTypedDetailForWrite(patch),
    })
  )
}
