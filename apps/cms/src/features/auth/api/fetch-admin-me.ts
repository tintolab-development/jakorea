import { axiosClient } from '@/shared/api'
import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import type { AdminMeResponse } from '@/shared/api/generated/members/schemas/adminMeResponse'
import { adminMePath } from '@/shared/config/api-paths'
import { isAdminFirstLoginOnboardingIncomplete } from '@/shared/utils/post-auth-redirect'
import type { InternalAxiosRequestConfig } from 'axios'

export async function fetchAdminMe(): Promise<AdminMeResponse> {
  const { data: payload } = await axiosClient.get<unknown>(adminMePath(), {
    skipGlobalErrorAlert: isAdminFirstLoginOnboardingIncomplete(),
  } as InternalAxiosRequestConfig & { skipGlobalErrorAlert?: boolean })
  return unwrapApiBody<AdminMeResponse>(payload)
}
