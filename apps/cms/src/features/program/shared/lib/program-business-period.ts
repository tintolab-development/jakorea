/**
 * 사업 운영 기간 SSOT: API `businessStartDate` / `businessEndDate`.
 * 도메인 `Program.startDate`/`endDate`는 이 값을 담는다 (회차 startDate와 별개).
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
