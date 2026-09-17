import { axiosClient } from '@/shared/api'
import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import type { AdminMeResponse } from '@/shared/api/generated/members/schemas/adminMeResponse'
import type { AdminMarketingConsentResponse } from '@/shared/api/generated/members/schemas/adminMarketingConsentResponse'
import type { AdminMarketingConsentUpdateRequest } from '@/shared/api/generated/members/schemas/adminMarketingConsentUpdateRequest'
import { adminMePath } from '@/shared/config/api-paths'
import { isAdminFirstLoginOnboardingIncomplete } from '@/shared/utils/post-auth-redirect'
import type { InternalAxiosRequestConfig } from 'axios'

export async function fetchAdminMe(): Promise<AdminMeResponse> {
  const { data: payload } = await axiosClient.get<unknown>(adminMePath(), {
    skipGlobalErrorAlert: isAdminFirstLoginOnboardingIncomplete(),
  } as InternalAxiosRequestConfig & { skipGlobalErrorAlert?: boolean })
  return unwrapApiBody<AdminMeResponse>(payload)
}

export async function updateAdminMarketingConsent(
  request: AdminMarketingConsentUpdateRequest
): Promise<AdminMarketingConsentResponse> {
  const { data: payload } = await axiosClient.put<unknown>(
    '/api/admin/me/marketing-consent',
    request
  )
  return unwrapApiBody<AdminMarketingConsentResponse>(payload)
}
