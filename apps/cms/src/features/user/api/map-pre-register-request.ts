import type { CreateUserRequest } from '@/entities/user/api/user-service'
import type {
  AdminPreRegisterIndividualRequest,
  AdminPreRegisterInstructorRequest,
  AdminPreRegisterMemberRequest,
  AdminPreRegisterSchoolRequest,
} from '@/shared/api/generated/members/schemas'
import { toApiBirthDate, toApiGender } from '@/features/user/api/map-member-gender-birth'

function baseIdentity(request: CreateUserRequest) {
  const email = request.email?.trim() || undefined
  const name = request.name.trim()
  const phone = request.phone?.trim() || undefined
  const gender = toApiGender(request.gender)
  const birthDate = toApiBirthDate(request.birthDate)
  return { email, name, phone, gender, birthDate }
}

/** @deprecated 단일 pre-register — 역할별 mapper 사용 권장 */
export function mapCreateUserRequestToPreRegister(
  request: CreateUserRequest
): AdminPreRegisterMemberRequest {
  const body: AdminPreRegisterMemberRequest = {
    name: request.name.trim(),
  }
  if (request.email?.trim()) body.email = request.email.trim()
  if (request.phone?.trim()) body.phone = request.phone.trim()

  const gender = toApiGender(request.gender)
  if (gender) body.gender = gender

  const birthDate = toApiBirthDate(request.birthDate)
  if (birthDate) body.birthDate = birthDate

  if (request.id1365?.trim()) body.external1365Id = request.id1365.trim()
  if (request.affiliation?.trim()) body.organizationText = request.affiliation.trim()

  if (request.role === 'SCHOOL' && request.schoolInfo?.schoolName?.trim()) {
    body.organizationText = request.schoolInfo.schoolName.trim()
    body.name = request.schoolInfo.schoolName.trim()
  }

  if (request.role === 'INSTRUCTOR' && request.instructorInfo) {
    body.oneLineIntro = request.instructorInfo.accountHolder?.trim() || undefined
  }

  return body
}

export function mapCreateUserRequestToPreRegisterIndividual(
  request: CreateUserRequest
): AdminPreRegisterIndividualRequest {
  const { email, name, phone, gender, birthDate } = baseIdentity(request)
  if (!email) {
    throw new Error('개인 회원 등록에는 이메일이 필요합니다.')
  }
  // CMS 기본 임시 비밀번호 = 로그인 이메일 (OpenAPI rawPassword required)
  const body: AdminPreRegisterIndividualRequest = { email, name, rawPassword: email }
  if (phone) body.phone = phone
  if (gender) body.gender = gender
  if (birthDate) body.birthDate = birthDate
  if (request.address?.trim()) body.address = request.address.trim()
  if (request.detailAddress?.trim()) body.addressDetail = request.detailAddress.trim()
  if (request.affiliation?.trim()) body.schoolName = request.affiliation.trim()
  if (request.schoolEnrollmentStatus) {
    body.enrollmentStatus = request.schoolEnrollmentStatus
  }
  if (request.id1365?.trim()) body.external1365Id = request.id1365.trim()
  return body
}

export function mapCreateUserRequestToPreRegisterSchool(
  request: CreateUserRequest
): AdminPreRegisterSchoolRequest {
  const { email, name, phone, gender, birthDate } = baseIdentity(request)
  const organizationName =
    request.schoolInfo?.schoolName?.trim() || request.name.trim()
  const address = request.schoolInfo?.address?.trim() || request.address?.trim() || ''
  // email: 학교 등록 폼에 없음 — 미입력 시 더미(@institution.jakorea.local)를 넣지 않음.
  // OpenAPI required는 BE optional 전환 전까지 타입 단언으로 우회 (handover 2026-07-28).
  const body = {
    name: organizationName || name,
    organizationName,
    address,
    ...(email ? { email } : {}),
  } as AdminPreRegisterSchoolRequest
  if (phone) body.phone = phone
  if (gender) body.gender = gender
  if (birthDate) body.birthDate = birthDate
  if (request.detailAddress?.trim()) body.addressDetail = request.detailAddress.trim()
  if (request.schoolInfo?.position?.trim()) body.position = request.schoolInfo.position.trim()
  if (request.neisCode?.trim()) body.neisCode = request.neisCode.trim()
  if (request.regionSido?.trim()) body.regionSido = request.regionSido.trim()
  if (request.regionSigungu?.trim()) body.regionSigungu = request.regionSigungu.trim()
  if (request.zipCode?.trim()) body.zipCode = request.zipCode.trim()
  return body
}

export function mapCreateUserRequestToPreRegisterInstructor(
  request: CreateUserRequest
): AdminPreRegisterInstructorRequest {
  const { email, name, phone, gender, birthDate } = baseIdentity(request)
  if (!email) {
    throw new Error('강사 회원 등록에는 이메일이 필요합니다.')
  }
  // CMS 기본 임시 비밀번호 = 로그인 이메일 (OpenAPI rawPassword required)
  const body: AdminPreRegisterInstructorRequest = { email, name, rawPassword: email }
  if (phone) body.phone = phone
  if (gender) body.gender = gender
  if (birthDate) body.birthDate = birthDate
  if (request.instructorType?.trim()) body.instructorType = request.instructorType.trim()
  if (request.address?.trim()) body.homeAddress = request.address.trim()
  if (request.detailAddress?.trim()) body.homeAddressDetail = request.detailAddress.trim()
  if (request.oneLineIntro?.trim()) body.oneLineIntro = request.oneLineIntro.trim()
  if (request.careerText?.trim()) body.careerText = request.careerText.trim()
  if (request.selfIntroduction?.trim()) body.selfIntroduction = request.selfIntroduction.trim()
  if (request.educationLevel?.trim()) body.educationLevel = request.educationLevel.trim()
  if (request.id1365?.trim()) body.external1365Id = request.id1365.trim()
  if (request.termsAgreements != null && request.termsAgreements.length > 0) {
    body.termsAgreements = request.termsAgreements
  }
  if (request.certifications != null && request.certifications.length > 0) {
    body.certifications = request.certifications
  }
  if (request.instructorInfo) {
    const bankName = request.instructorInfo.bankName?.trim()
    const accountNumber = request.instructorInfo.accountNumber?.trim()
    const accountHolder = request.instructorInfo.accountHolder?.trim()
    if (bankName) body.bankName = bankName
    if (accountNumber) body.accountNumber = accountNumber
    if (accountHolder) body.accountHolder = accountHolder
    body.businessIncome = request.instructorInfo.isBusinessIncome
    if (bankName) {
      body.bankAccounts = [
        {
          bankName,
          ...(accountNumber ? { accountNumber } : {}),
          ...(accountHolder ? { accountHolder } : {}),
        },
      ]
    }
  }
  return body
}
