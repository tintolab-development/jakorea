import type { ConsentFormData } from './consent'

export type AdminRegisterGender = 'male' | 'female'

export const ADMIN_REGISTER_TOTAL_STEPS = 6

export type IdentityVerificationStatus = 'idle' | 'pending' | 'verified' | 'failed'

export interface AdminRegisterWizardData {
  birthDate?: string
  gender?: AdminRegisterGender
  identityVerificationSessionId?: number
  identityVerificationSessionUuid?: string
  identityVerificationStatus?: IdentityVerificationStatus
  identityVerifiedAt?: string
  verifiedName?: string
  verifiedPhone?: string
  termsOfService?: boolean
  privacyPolicy?: boolean
  marketingConsent?: boolean
  mfaSetupAgreed?: boolean
  emailLocalPart?: string
  email?: string
  password?: string
}

export interface AdminRegisterStep1Data {
  birthDate: string
  gender: AdminRegisterGender
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
