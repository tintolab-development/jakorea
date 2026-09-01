import type {
  AgreementState,
  EmploymentStatus,
  GenderType,
  GuardianAgreementState,
  MemberType,
  SchoolStatus,
} from '../sign-up.types'
import { MOCK_VERIFIED_NAME, MOCK_VERIFIED_PHONE } from '../../lib/constants'
import { toApiSignupPhone } from '../../lib/helpers/to-api-phone'
import { parseBirthDate } from '../../lib/utils'
import { buildTermsAgreementsFromCatalog } from './map-terms-agreements'
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
  schoolStatus: SchoolStatus
  schoolName: string
  schoolOrganizationId?: number | null
  /** NEIS 학교 코드 — schoolSelection.externalSchoolCode */
  schoolNeisCode?: string | null
  schoolAddress?: string
  grade: string
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
}

function buildSchoolSelection(input: SignUpMapInput) {
  const name = input.schoolName.trim()
  if (!name) return undefined

  return {
    provider: 'NEIS',
    externalSchoolCode: input.schoolNeisCode?.trim() || undefined,
    name,
    address: input.schoolAddress?.trim() || undefined,
    organizationCategory: 'SCHOOL',
  }
}

function buildMember(input: SignUpMapInput): MemberSignupRequest {
  const termsAgreements = buildTermsAgreementsFromCatalog({
    catalog: input.termsCatalog,
    agreements: input.agreements,
    guardianAgreements: input.guardianAgreements,
    isUnderAge: input.isUnderAgeSignup,
  })

  const member: MemberSignupRequest = {
    email: input.email.trim(),
    password: input.password,
    name: (input.name ?? MOCK_VERIFIED_NAME).trim(),
    phone: toApiSignupPhone(input.phone ?? MOCK_VERIFIED_PHONE),
    birthDate: toApiBirthDate(input.birthDate),
    gender: toApiGender(input.gender),
    under14: input.isUnderAgeSignup,
    identityVerified: input.isIdentityVerified,
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

  if (input.identityVerificationSessionId != null) {
    member.identityVerificationSessionId = input.identityVerificationSessionId
  }
  if (input.guardianVerificationSessionId != null) {
    member.guardianVerificationSessionId = input.guardianVerificationSessionId
  }

  if (input.selectedType === 'general' && input.schoolStatus === 'enrolled') {
    // NEIS 선택 학교명·학년. CMS PK가 있으면 organizationId, 없으면 schoolSelection.
    member.schoolName = input.schoolName.trim() || undefined
    member.grade = input.grade.trim() || undefined
    if (input.schoolOrganizationId != null) {
      member.schoolOrganizationId = input.schoolOrganizationId
    } else {
      member.schoolSelection = buildSchoolSelection(input)
    }
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

  if (input.schoolOrganizationId != null) {
    member.schoolOrganizationId = input.schoolOrganizationId
  } else {
    member.schoolSelection = buildSchoolSelection(input)
  }

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
