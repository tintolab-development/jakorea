/**
 * 기관 신청 초상권 동의서 Admin API
 * - GET /api/admin/organization-applications/{applicationId}/portrait-consent
 *   제출이 없거나 업로드 취소된 경우 빈 본문 200 → null
 */

import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import customInstance from '@/shared/api/orval-mutator'
import type { PortraitConsentResponse } from '@/shared/api/generated/dashboard/schemas/portraitConsentResponse'

function portraitConsentUrl(applicationId: string | number): string {
  return `/api/admin/organization-applications/${encodeURIComponent(String(applicationId))}/portrait-consent`
}

export async function fetchOrganizationPortraitConsentRemote(
  applicationId: string | number
): Promise<PortraitConsentResponse | null> {
  const payload = await customInstance<unknown>({
    url: portraitConsentUrl(applicationId),
    method: 'GET',
  })
  const body = unwrapApiBody<PortraitConsentResponse | null | undefined>(payload)
  if (body == null || typeof body !== 'object') return null
  if (Object.keys(body).length === 0) return null
  return body
}
