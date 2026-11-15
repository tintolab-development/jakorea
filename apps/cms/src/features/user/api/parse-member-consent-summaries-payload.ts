import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import type { AdminMemberConsentSummary } from '@/shared/api/generated/members/schemas/adminMemberConsentSummary'

/** customInstance는 axios `data`만 반환한다. 배열 본문에 `.data`를 다시 읽으면 빈 목록이 된다. */
export function parseMemberConsentSummariesPayload(
  body: unknown
): AdminMemberConsentSummary[] {
  if (Array.isArray(body)) return body
  const unwrapped = unwrapApiBody(body)
  return Array.isArray(unwrapped) ? unwrapped : []
}
