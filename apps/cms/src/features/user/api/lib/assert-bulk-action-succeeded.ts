import type { BulkActionResponse } from '@/shared/api/generated/members/schemas/bulkActionResponse'

/** 서버 오류 코드 형식 (`SCHOOL_HAS_ACTIVE_MEMBERS` 등) — 사용자 문구가 아니다 */
const RAW_ERROR_CODE_PATTERN = /^[A-Z0-9_]+$/

/**
 * bulk approve/reject/delete 응답에 failures가 있으면 첫 건의 서버 message를 그대로 throw.
 * 학교 일괄 삭제 부분 실패는 서버가 failures[].message에 사용자용 한국어 문구를 내려 준다(code는 안정 코드 그대로).
 * 같은 검사를 쓰는 다른 일괄 처리(권한 승인·반려, 프로그램 이력 삭제)가 코드 원문만 줄 때를 대비해
 * 코드 형식 문구는 노출하지 않고 fallback 문구를 쓴다.
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
