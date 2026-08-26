import { formatKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'
import { toApiBirthDate } from '@jakorea/identity-verification'

import type { AdminSelfSignupRequest } from '@/features/auth/model/admin-register-api.types'
import type { AdminRegisterGender, AdminRegisterWizardData } from '@/types/admin-register'

function toApiGender(gender: AdminRegisterGender): AdminSelfSignupRequest['gender'] {
  return gender === 'male' ? 'MALE' : 'FEMALE'
}

function resolveSignupName(formData: AdminRegisterWizardData): string {
  if (formData.verifiedName?.trim()) {
    return formData.verifiedName.trim()
  }
  if (formData.emailLocalPart?.trim()) {
    return formData.emailLocalPart.trim()
  }
  return '관리자'
}

function resolveIdentitySessionUuid(formData: AdminRegisterWizardData): string {
  if (formData.identityVerificationSessionUuid?.trim()) {
    return formData.identityVerificationSessionUuid.trim()
  }
  if (formData.identityVerificationSessionId != null) {
    return String(formData.identityVerificationSessionId)
  }
  throw new Error('본인인증 세션 정보가 없습니다.')
}

export function buildAdminSelfSignupRequest(
  formData: AdminRegisterWizardData,
  termsVersion: string
): AdminSelfSignupRequest {
  if (
    !formData.email ||
    !formData.password ||
    !formData.birthDate ||
    !formData.gender ||
    formData.termsOfService !== true ||
    formData.privacyPolicy !== true ||
    formData.mfaSetupAgreed !== true
  ) {
    throw new Error('가입 정보가 올바르지 않습니다.')
  }

  const resolvedTermsVersion = termsVersion.trim()
  if (!resolvedTermsVersion) {
    throw new Error('약관 버전이 없습니다. 잠시 후 다시 시도해 주세요.')
  }

  return {
    email: formData.email,
    password: formData.password,
    name: resolveSignupName(formData),
    phone: formData.verifiedPhone
      ? formatKoreanPhoneNumber(formData.verifiedPhone) || formData.verifiedPhone
      : undefined,
    gender: toApiGender(formData.gender),
    birthDate: toApiBirthDate(formData.birthDate),
    identityVerificationSessionUuid: resolveIdentitySessionUuid(formData),
    termsVersion: resolvedTermsVersion,
    termsAgreed: formData.termsOfService,
    privacyAgreed: formData.privacyPolicy,
    mfaSetupAgreed: formData.mfaSetupAgreed,
  }
}
