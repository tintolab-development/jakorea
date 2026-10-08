import type { ConsentFormData } from './consent'

/** 본인인증 → 약관 → 이메일 → 비밀번호 → 입력 정보 확인 */
export const ADMIN_REGISTER_TOTAL_STEPS = 5

export type IdentityVerificationStatus = 'idle' | 'pending' | 'verified' | 'failed'

export interface AdminRegisterWizardData {
  identityVerificationSessionId?: number
  identityVerificationSessionUuid?: string
  identityVerificationStatus?: IdentityVerificationStatus
  identityVerifiedAt?: string
  verifiedName?: string
  verifiedPhone?: string
  verifiedBirthDate?: string
  /** 본인인증 프로필 성별 (`M`/`F` 또는 표시 라벨) */
  verifiedGender?: string
  termsOfService?: boolean
  privacyPolicy?: boolean
  marketingConsent?: boolean
  mfaSetupAgreed?: boolean
  emailLocalPart?: string
  email?: string
  password?: string
}

export type AdminRegisterStep3Data = ConsentFormData & {
  mfaSetupAgreed: boolean
}

export interface AdminRegisterStep4Data {
  emailLocalPart: string
  email: string
}

export interface AdminRegisterStep5Data {
  password: string
}
