import type { SettlementBulkStatusChangeResponse } from '@/shared/api/generated/settlement/schemas'

function asArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : []
}

/**
 * 지급조서 일괄 확인 응답. 결과 배열이 없거나 null이면 [].
 * requestedCount·successCount는 지급조서 + 강사 신청서 + 영수증 합계다.
 */
export function readSettlementBulkConfirmResult(
  data: SettlementBulkStatusChangeResponse | null | undefined,
): SettlementBulkStatusChangeResponse {
  const source = data ?? {}
  return {
    ...source,
    results: asArray(source.results),
    individualSettlementApplicationResults: asArray(source.individualSettlementApplicationResults),
    instructorSettlementApplicationResults: asArray(source.instructorSettlementApplicationResults),
  }
}
