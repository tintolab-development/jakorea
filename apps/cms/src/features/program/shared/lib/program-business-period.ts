/**
 * 사업 운영 기간 SSOT: API `businessStartDate` / `businessEndDate`.
 * 도메인 `Program.startDate`/`endDate`는 이 값을 담는다 (회차 startDate와 별개).
 * 기간은 화면에서 고른 임의 날짜. 같은 해·1/1~12/31·연도 걸침 제한 없음.
 */

export function resolveBusinessPeriodDates(dto: {
  businessStartDate?: string | null
  businessEndDate?: string | null
  startDate?: string | null
  endDate?: string | null
}): { startDate: string | undefined; endDate: string | undefined } {
  return {
    startDate: dto.businessStartDate ?? dto.startDate ?? undefined,
    endDate: dto.businessEndDate ?? dto.endDate ?? undefined,
  }
}
