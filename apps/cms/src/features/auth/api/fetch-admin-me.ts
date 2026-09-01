import { axiosClient } from '@/shared/api'
import { unwrapApiBody } from '@/features/data-management/api/unwrap-api-body'
import type { AdminMeResponse } from '@/shared/api/generated/members/schemas/adminMeResponse'
import { adminMePath } from '@/shared/config/api-paths'

export async function fetchAdminMe(): Promise<AdminMeResponse> {
  const { data: payload } = await axiosClient.get<unknown>(adminMePath())
  return unwrapApiBody<AdminMeResponse>(payload)
}
