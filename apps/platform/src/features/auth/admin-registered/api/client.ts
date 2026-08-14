import { axiosClient } from '@/shared/api/axios-instance'
import { portalAuthPaths } from '@/features/auth/sign-in'
import { parseAdminProvisionedOnboardingResponse } from './parse'
import type {
  AdminProvisionedIdentityConfirmRequest,
  AdminProvisionedOnboardingResponse,
  AdminProvisionedProfileRequest,
} from './types'

/** PATCH /api/portal/auth/admin-provisioned/profile — 본인 생년월일·성별 확인 */
export async function patchAdminProvisionedProfile(
  body: AdminProvisionedProfileRequest,
): Promise<AdminProvisionedOnboardingResponse> {
  const { data } = await axiosClient.patch<unknown>(
    portalAuthPaths.adminProvisionedProfile(),
    body,
  )
  return parseAdminProvisionedOnboardingResponse(data)
}

/** POST /api/portal/auth/admin-provisioned/identity/confirm */
export async function postAdminProvisionedIdentityConfirm(
  body: AdminProvisionedIdentityConfirmRequest,
): Promise<AdminProvisionedOnboardingResponse> {
  const { data } = await axiosClient.post<unknown>(
    portalAuthPaths.adminProvisionedIdentityConfirm(),
    body,
  )
  return parseAdminProvisionedOnboardingResponse(data)
}
