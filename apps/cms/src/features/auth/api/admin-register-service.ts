import { axiosClient } from '@/shared/api'
import {
  checkAdminAuthEmail,
  isEmailAvailableForSignup,
} from '@/features/auth/api/admin-auth-email-check'
import { adminAuthPaths } from '@/shared/config/api-paths'
import { isAdminRegisterRemoteEnabled } from '@/features/auth/api/admin-register-remote-capabilities'
import { buildAdminSelfSignupRequest } from '@/features/auth/lib/map-admin-register-signup-request'
import {
  AdminRegisterApiError,
  parseAdminRegisterApiError,
  type AdminSelfSignupResponse,
} from '@/features/auth/model/admin-register-api.types'
import { checkEmailAvailability, register } from '@/entities/user/api/register-service'
import type { AdminRegisterWizardData } from '@/types/admin-register'

export interface AdminRegisterCompleteResult {
  adminId?: number
  email?: string
  status?: string
  nextStep?: string
}

function unwrapApiData<T>(payload: unknown): T {
  if (!payload || typeof payload !== 'object') {
    throw parseAdminRegisterApiError(payload)
  }
  const o = payload as Record<string, unknown>
  if (o.success === false) {
    throw parseAdminRegisterApiError(payload)
  }
  if (o.data && typeof o.data === 'object') {
    return o.data as T
  }
  return o as T
}

async function completeAdminSignupRemote(
  formData: AdminRegisterWizardData
): Promise<AdminRegisterCompleteResult> {
  const body = buildAdminSelfSignupRequest(formData)

  try {
    const { data: payload } = await axiosClient.post<unknown>(
      adminAuthPaths.signupComplete(),
      body
    )
    const result = unwrapApiData<AdminSelfSignupResponse>(payload)
    return {
      adminId: result.adminId,
      email: result.email ?? body.email,
      status: result.status,
      nextStep: result.nextStep,
    }
  } catch (error) {
    if (error instanceof AdminRegisterApiError) {
      throw error
    }
    const axiosErr = error as { response?: { data?: unknown } }
    if (axiosErr.response?.data) {
      throw parseAdminRegisterApiError(axiosErr.response.data)
    }
    throw error instanceof Error ? error : new AdminRegisterApiError('NETWORK', '회원가입 요청에 실패했습니다.')
  }
}

async function completeAdminSignupMock(
  formData: AdminRegisterWizardData
): Promise<AdminRegisterCompleteResult> {
  const identityOk =
    formData.identityVerificationSessionId != null ||
    formData.identityVerificationSessionUuid != null ||
    (formData.verifiedName && formData.verifiedPhone)

  if (
    !formData.email ||
    !formData.password ||
    !identityOk ||
    !formData.birthDate ||
    !formData.gender ||
    !formData.termsOfService ||
    !formData.privacyPolicy ||
    formData.mfaSetupAgreed !== true
  ) {
    throw new Error('가입 정보가 올바르지 않습니다. 이전 단계를 다시 확인해 주세요.')
  }

  const response = await register({
    formData: {
      role: 'ADMIN',
      adminLevel: 'ADMIN',
      email: formData.email,
      password: formData.password,
      passwordConfirm: formData.password,
      name: formData.verifiedName ?? '본인인증 회원',
      phone: formData.verifiedPhone ?? '010-0000-0000',
    },
    consent: {
      termsOfService: formData.termsOfService,
      privacyPolicy: formData.privacyPolicy,
      marketingConsent: formData.marketingConsent ?? false,
    },
  })

  return {
    email: formData.email,
    status: 'MOCK_CREATED',
    nextStep: 'LOGIN',
    adminId: Number(response.userId.replace(/\D/g, '')) || undefined,
  }
}

export async function completeAdminSignup(
  formData: AdminRegisterWizardData
): Promise<AdminRegisterCompleteResult> {
  if (isAdminRegisterRemoteEnabled()) {
    return completeAdminSignupRemote(formData)
  }
  return completeAdminSignupMock(formData)
}

async function checkAdminRegisterEmailAvailabilityRemote(email: string): Promise<boolean> {
  const result = await checkAdminAuthEmail(email, 'SIGNUP')
  return isEmailAvailableForSignup(result)
}

/**
 * 이메일 중복 확인
 * - 실 API: POST /api/admin/auth/email/check
 * - mock: mockUsers 기준 중복 검사
 */
export async function checkAdminRegisterEmailAvailability(email: string): Promise<boolean> {
  if (isAdminRegisterRemoteEnabled()) {
    return checkAdminRegisterEmailAvailabilityRemote(email)
  }
  return checkEmailAvailability(email)
}
