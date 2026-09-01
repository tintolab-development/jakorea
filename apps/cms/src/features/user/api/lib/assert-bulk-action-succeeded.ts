import type { BulkActionResponse } from '@/shared/api/generated/members/schemas/bulkActionResponse'

/** bulk approve/reject 응답에 failures가 있으면 첫 건 메시지로 throw */
export function assertBulkActionSucceeded(
  result: BulkActionResponse | undefined,
  fallbackMessage: string
): void {
  if ((result?.failureCount ?? 0) > 0) {
    const first = result?.failures?.[0]
    throw new Error(first?.message?.trim() || first?.code?.trim() || fallbackMessage)
  }
}
