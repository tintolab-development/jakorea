/**
 * CMS 계정 원본 — GET/PUT /api/admin/me*
 * Homepage 8081 콘텐츠 API와 분리한다.
 */

import { axiosInstance } from '@/shared/instance/axios-instance'
import { cmsAdminMePaths, cmsPublicTermsDocumentPaths } from '@/shared/config/api-paths'

export type CmsAdminTermsAgreement = {
  agreementId?: number
  consentType?: string
  termsType?: string
  version?: string
  required?: boolean
  agreed?: boolean
  agreedAt?: string
}

export type CmsAdminMeResponse = {
  adminAccountId?: number
  uuid?: string
  email?: string
  name?: string
  phone?: string
  gender?: string
  birthDate?: string
  status?: string
  roleCode?: string
  roleName?: string
  mfaRequired?: boolean
  permissionCodes?: string[]
  activeManagedProgramCount?: number
  totalManagedProgramCount?: number
  termsAgreements?: CmsAdminTermsAgreement[]
  lastLoginAt?: string
  createdAt?: string
  updatedAt?: string
}

export type CmsAdminMarketingConsentResponse = {
  adminAccountId?: number
  consentType?: string
  version?: string
  agreed?: boolean
  agreedAt?: string
  withdrawnAt?: string
}

function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && 'success' in payload) {
    const body = payload as { success?: boolean; data?: T }
    if (body.success === true && 'data' in body) {
      return body.data as T
    }
  }
  return payload as T
}

export async function fetchCmsAdminMe(): Promise<CmsAdminMeResponse> {
  const { data } = await axiosInstance.get<unknown>(cmsAdminMePaths.me())
  return unwrapData<CmsAdminMeResponse>(data)
}

export async function updateCmsAdminMarketingConsent(request: {
  agreed: boolean
  version: string
}): Promise<CmsAdminMarketingConsentResponse> {
  const { data } = await axiosInstance.put<unknown>(cmsAdminMePaths.marketingConsent(), request)
  return unwrapData<CmsAdminMarketingConsentResponse>(data)
}

export async function withdrawCmsAdminSelf(body: {
  confirmationText: string
  currentPassword: string
}): Promise<void> {
  await axiosInstance.post(cmsAdminMePaths.withdrawals(), body)
}

export async function updateCmsAdminIdentityContact(request: {
  identityVerificationSessionId: number
  profileToken: string
}): Promise<{ phone?: string }> {
  const { data } = await axiosInstance.patch<unknown>(cmsAdminMePaths.identityContact(), request)
  return unwrapData<{ phone?: string }>(data)
}

export async function fetchCmsCurrentTermsDocumentVersion(
  termsType: string,
): Promise<string | null> {
  try {
    const { data } = await axiosInstance.get<unknown>(
      cmsPublicTermsDocumentPaths.current(termsType),
    )
    const doc = unwrapData<{ version?: string }>(data)
    const version = doc.version?.trim()
    return version || null
  } catch {
    return null
  }
}
