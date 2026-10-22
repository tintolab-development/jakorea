import type {
  AgreementState,
  EmploymentStatus,
  GenderType,
  GuardianAgreementState,
  MemberType,
  SchoolStatus,
} from '../sign-up.types'
import { toApiSignupPhone } from '../../lib/helpers/to-api-phone'
import { parseBirthDate } from '../../lib/utils'
import { buildTermsAgreementsFromCatalog } from './map-terms-agreements'
import { resolveSignupSchoolAttachment } from '../../lib/signup-school-attachment'
import type { WritingFormDraft } from '@jakorea/form-schema/writing-form'
import { attachPortraitFilledDocumentToTermsAgreements } from '../../lib/map-portrait-consent-filled-document'
import type {
  HomepageGeneralSignupRequest,
  HomepageTeacherSignupRequest,
  MemberSignupRequest,
  SignupTermsCatalogResponse,
} from '../types/signup-api.types'

export function toApiMemberType(type: MemberType): 'GENERAL' | 'TEACHER' {
  return type === 'teacher' ? 'TEACHER' : 'GENERAL'
}

/** UI `YYYY.MM.DD` → API `YYYY-MM-DD` */
export function toApiBirthDate(birthDate: string): string | undefined {
  const date = parseBirthDate(birthDate)
  if (!date) return undefined

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function toApiGender(gender: GenderType | null): string | undefined {
  if (gender === 'female') return 'F'
  if (gender === 'male') return 'M'
  return undefined
}

export function toApiEmploymentStatus(status: EmploymentStatus | null): string | undefined {
  if (status === 'employed') return 'EMPLOYED'
  if (status === 'on-leave') return 'ON_LEAVE'
  return undefined
}

export type SignUpMapInput = {
  selectedType: MemberType
  email: string
  password: string
  birthDate: string
  gender: GenderType | null
  isUnderAgeSignup: boolean
  isIdentityVerified: boolean
  identityVerificationSessionId?: number | null
  guardianVerificationSessionId?: number | null
  signupIntentId?: string | null
  schoolStatus: SchoolStatus
  schoolName: string
  schoolOrganizationId?: number | null
  /** NEIS 학교 코드 — schoolSelection.externalSchoolCode */
  schoolNeisCode?: string | null
  /** NEIS 교육청 코드 — schoolSelection.educationOfficeCode */
  schoolEducationOfficeCode?: string | null
  schoolAddress?: string
  schoolSource?: 'neis' | 'careerNet'
  grade: string
  /** 미재학(해당 없음) 선택 시 선택 입력 */
  affiliationName?: string
  employmentStatus: EmploymentStatus | null
  address: string
  addressDetail: string
  postalCode?: string
  regionSido?: string
  regionSigungu?: string
  volunteerId: string
  name?: string
  phone?: string
  agreements: AgreementState
  guardianAgreements?: GuardianAgreementState
  termsCatalog?: SignupTermsCatalogResponse | null
  portraitConsentDraft?: WritingFormDraft | null
}

function buildMember(input: SignUpMapInput): MemberSignupRequest {
  const termsAgreements = attachPortraitFilledDocumentToTermsAgreements(
    buildTermsAgreementsFromCatalog({
      catalog: input.termsCatalog,
      agreements: input.agreements,
      guardianAgreements: input.guardianAgreements,
      isUnderAge: input.isUnderAgeSignup,
    }),
    input.portraitConsentDraft
  )

  const memberPhone = input.isUnderAgeSignup ? undefined : toApiSignupPhone(input.phone)

  const member: MemberSignupRequest = {
    email: input.email.trim(),
    password: input.password,
    name: input.name?.trim() ?? '',
    ...(memberPhone ? { phone: memberPhone } : {}),
    birthDate: toApiBirthDate(input.birthDate),
    gender: toApiGender(input.gender),
    under14: input.isUnderAgeSignup,
    identityVerified: input.isUnderAgeSignup ? false : input.isIdentityVerified,
    schoolEnrollmentStatus:
      input.selectedType === 'teacher'
        ? undefined
        : input.schoolStatus === 'enrolled'
          ? 'ENROLLED'
          : 'NOT_ENROLLED',
    address: input.address.trim() || undefined,
    addressDetail: input.addressDetail.trim() || undefined,
    postalCode: input.postalCode?.trim() || undefined,
    regionSido: input.regionSido?.trim() || undefined,
    regionSigungu: input.regionSigungu?.trim() || undefined,
    external1365Id: input.volunteerId.trim() || undefined,
    termsAgreements: termsAgreements.length > 0 ? termsAgreements : undefined,
  }

  if (
    !input.isUnderAgeSignup &&
    input.identityVerificationSessionId != null
  ) {
    member.identityVerificationSessionId = input.identityVerificationSessionId
  }
  if (input.guardianVerificationSessionId != null) {
    member.guardianVerificationSessionId = input.guardianVerificationSessionId
  }
  if (input.isUnderAgeSignup && input.signupIntentId?.trim()) {
    member.signupIntentId = input.signupIntentId.trim()
  }

  if (input.selectedType === 'general' && input.schoolStatus === 'enrolled') {
    // NEIS 선택 학교명·학년. CMS PK가 있으면 organizationId, 없으면 schoolSelection.
    member.schoolName = input.schoolName.trim() || undefined
    member.grade = input.grade.trim() || undefined
    Object.assign(
      member,
      resolveSignupSchoolAttachment({
        schoolName: input.schoolName,
        schoolOrganizationId: input.schoolOrganizationId,
        schoolNeisCode: input.schoolNeisCode,
        schoolEducationOfficeCode: input.schoolEducationOfficeCode,
        schoolAddress: input.schoolAddress,
        source: input.schoolSource,
      }),
    )
  }

  if (input.selectedType === 'general' && input.schoolStatus === 'none') {
    member.affiliationName = input.affiliationName?.trim() || undefined
  }

  return member
}

export function mapSignUpToGeneralRequest(input: SignUpMapInput): HomepageGeneralSignupRequest {
  return { member: buildMember(input) }
}

export function mapSignUpToTeacherRequest(
  input: SignUpMapInput,
): HomepageTeacherSignupRequest | null {
  const schoolName = input.schoolName.trim()
  if (!schoolName) {
    return null
  }

  const member = buildMember(input)
  member.schoolName = schoolName

  Object.assign(
    member,
    resolveSignupSchoolAttachment({
      schoolName: input.schoolName,
      schoolOrganizationId: input.schoolOrganizationId,
      schoolNeisCode: input.schoolNeisCode,
      schoolEducationOfficeCode: input.schoolEducationOfficeCode,
      schoolAddress: input.schoolAddress,
      source: input.schoolSource,
    }),
  )

  return {
    teacher: {
      member,
      ...(input.schoolOrganizationId != null
        ? { organizationId: input.schoolOrganizationId }
        : {}),
      employmentStatus: toApiEmploymentStatus(input.employmentStatus),
    },
  }
}
