import type { BulkActionResponse } from '@/shared/api/generated/members/schemas/bulkActionResponse'

/** 서버 오류 코드 형식 (`SCHOOL_HAS_ACTIVE_MEMBERS` 등) — 사용자 문구가 아니다 */
const RAW_ERROR_CODE_PATTERN = /^[A-Z0-9_]+$/

/**
 * bulk approve/reject 응답에 failures가 있으면 첫 건 메시지로 throw.
 * 서버가 실패 사유로 코드 원문만 준 경우(예: 학교 일괄 삭제 부분 실패) 코드를 노출하지 않고 fallback 문구를 쓴다.
 */
export function assertBulkActionSucceeded(
  result: BulkActionResponse | undefined,
  fallbackMessage: string
): void {
  if ((result?.failureCount ?? 0) > 0) {
    const first = result?.failures?.[0]
    const message = first?.message?.trim()
    throw new Error(
      message && !RAW_ERROR_CODE_PATTERN.test(message) ? message : fallbackMessage
    )
  }
}
