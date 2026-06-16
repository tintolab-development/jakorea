import type { ConsentFormData } from './consent'

export type AdminRegisterGender = 'male' | 'female'

export const ADMIN_REGISTER_TOTAL_STEPS = 6

export interface AdminRegisterWizardData {
  birthDate?: string
  gender?: AdminRegisterGender
  identityVerifiedAt?: string
  verifiedName?: string
  verifiedPhone?: string
  termsOfService?: boolean
  privacyPolicy?: boolean
  marketingConsent?: boolean
  emailLocalPart?: string
  email?: string
  password?: string
}

export interface AdminRegisterStep1Data {
  birthDate: string
  gender: AdminRegisterGender
}

export type AdminRegisterStep3Data = ConsentFormData

export interface AdminRegisterStep4Data {
  emailLocalPart: string
  email: string
}

export interface AdminRegisterStep5Data {
  password: string
}
