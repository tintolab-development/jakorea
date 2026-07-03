export { useSignUp } from './hooks/use-sign-up'
export type { UseSignUpReturn } from './hooks/use-sign-up'
export type {
  AgreementKey,
  AgreementItem,
  AgreementState,
  ConfirmationRow,
  EmailCheckStatus,
  GenderType,
  MemberType,
  SchoolStatus,
  SignUpStepComponent,
  SignUpStepNumber,
} from './model/sign-up.types'
export {
  agreementItems,
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
  formatHomeAddress,
  getGenderLabel,
  getMemberTypeLabel,
  getSchoolStatusLabel,
  isValidEmail,
  isValidPassword,
  parseBirthDate,
} from './lib/utils'
