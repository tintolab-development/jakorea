export { useSignUp } from './hooks/use-sign-up'
export type { UseSignUpReturn } from './hooks/use-sign-up'
export { useSignUpConsent } from './hooks/use-consent'
export type {
  AgreementKey,
  AgreementItem,
  AgreementState,
  ConfirmationRow,
  EmailCheckStatus,
  EmploymentStatus,
  GenderType,
  MemberType,
  SchoolStatus,
  SignUpStepComponent,
  SignUpStepNumber,
} from './model/sign-up.types'
export type { SignUpConsentFieldKey, SignUpConsentState } from './model/consent.types'
export {
  agreementItems,
  getAgreementItems,
  memberTypeOptions,
  MOCK_DUPLICATE_EMAIL,
  MOCK_VERIFIED_NAME,
  MOCK_VERIFIED_PHONE,
  SIGN_IN_PATH,
  SIGN_UP_COMPLETE_PATH,
  SIGN_UP_TOTAL_STEPS,
  schoolGradeOptions,
} from './lib/constants'
export {
  buildConfirmationRows,
  calculateInternationalAge,
  formatBirthDateInput,
  formatHomeAddress,
  formatTeacherAffiliation,
  getEmploymentStatusLabel,
  getGenderLabel,
  getMemberTypeLabel,
  getSchoolStatusLabel,
  isValidEmail,
  isValidPassword,
  parseBirthDate,
} from './lib/utils'
export { isBirthStepValid, validateBirthStep } from './lib/identity/identity.logic'
export type { BirthStepValidationResult } from './lib/identity/identity.logic'
export { AddressSearchModal } from './ui/address-search-modal'
export type { SelectedAddress } from './ui/address-search-modal'
export { SchoolSearchModal } from './ui/school-search-modal'
export type { SelectedSchool } from './ui/school-search-modal'
export {
  EMAIL_ID_MESSAGES,
  isValidEmailId,
  normalizeEmailId,
  validateEmailId,
} from '@/shared/lib/email-id'
export type { EmailIdErrorCode, EmailIdValidationResult } from '@/shared/lib/email-id'
