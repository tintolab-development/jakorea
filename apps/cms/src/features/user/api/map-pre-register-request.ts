import type { CreateUserRequest } from '@/entities/user/api/user-service'
import type {
  AdminPreRegisterIndividualRequest,
  AdminPreRegisterInstructorRequest,
  AdminPreRegisterSchoolRequest,
  SchoolOrganizationUpsertRequest,
} from '@/shared/api/generated/members/schemas'
import type { PortalSchoolSelectionRequest } from '@/shared/api/generated/members/schemas/portalSchoolSelectionRequest'
import type { AdminPreRegisterMemberRequest } from '@/shared/api/generated/members/schemas/adminPreRegisterMemberRequest'
import { toApiBirthDate, toApiGender } from '@/features/user/api/map-member-gender-birth'
import { resolveAdminProvisionedTempPassword } from '@/features/user/lib/admin-provisioned-temp-password'
import {
  buildLegacyFlatFieldsFromCmsProfile,
  toApiInstructorCmsProfile,
  toApiInstructorCmsSettlement,
} from '@/features/user/api/map-instructor-cms-profile'
import { toInstructorFeeGradeApiValue } from '@/features/user/api/map-instructor-activity-display'
import { omitOptionalDisagreedPreRegisterTerms } from '@/features/user/api/build-pre-register-terms-agreements'

function attachTermsAgreements<
  T extends { termsAgreements?: AdminPreRegisterIndividualRequest['termsAgreements'] },
>(body: T, request: CreateUserRequest): T {
  if (request.termsAgreements != null && request.termsAgreements.length > 0) {
    const termsAgreements = omitOptionalDisagreedPreRegisterTerms(request.termsAgreements)
    if (termsAgreements != null && termsAgreements.length > 0) {
      body.termsAgreements = termsAgreements
    }
  }
  return body
}

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
  const body: AdminPreRegisterIndividualRequest & { grade?: string } = {
    email,
    name,
    rawPassword: resolveAdminProvisionedTempPassword(email),
  }
  if (phone) body.phone = phone
  if (gender) body.gender = gender
  if (birthDate) body.birthDate = birthDate
  if (request.address?.trim()) body.address = request.address.trim()
  if (request.detailAddress?.trim()) body.addressDetail = request.detailAddress.trim()
  if (request.affiliation?.trim()) body.schoolName = request.affiliation.trim()
  if (request.schoolEnrollmentStatus) {
    body.enrollmentStatus = request.schoolEnrollmentStatus
  }
  // OpenAPI v9에 grade 미선언 — BE 저장·상세 반환용으로 wire에 포함 (스펙 추가 예정)
  const grade = request.grade?.trim()
  if (grade && request.schoolEnrollmentStatus === 'ENROLLED') {
    body.grade = grade
  }
  if (request.id1365?.trim()) body.external1365Id = request.id1365.trim()
  return attachTermsAgreements(body, request)
}

/** @deprecated 학교 등록은 `mapCreateUserRequestToCreateSchool` + `createSchool` 사용 */
export function mapCreateUserRequestToPreRegisterSchool(
  request: CreateUserRequest
): AdminPreRegisterSchoolRequest {
  const { email, name, phone, gender, birthDate } = baseIdentity(request)
  const organizationName = request.schoolInfo?.schoolName?.trim() || request.name.trim()
  const address = request.schoolInfo?.address?.trim() || request.address?.trim() || ''
  const body: AdminPreRegisterSchoolRequest = {
    name: organizationName || name,
    organizationName,
    address,
  }
  if (email) body.email = email
  if (phone) body.phone = phone
  if (gender) body.gender = gender
  if (birthDate) body.birthDate = birthDate
  if (request.detailAddress?.trim()) body.addressDetail = request.detailAddress.trim()
  if (request.schoolInfo?.position?.trim()) body.position = request.schoolInfo.position.trim()
  if (request.neisCode?.trim()) body.neisCode = request.neisCode.trim()
  if (request.regionSido?.trim()) body.regionSido = request.regionSido.trim()
  if (request.regionSigungu?.trim()) body.regionSigungu = request.regionSigungu.trim()
  if (request.zipCode?.trim()) body.zipCode = request.zipCode.trim()
  return attachTermsAgreements(body, request)
}

/** CMS 학교 organization 등록 — `POST /api/admin/organizations/schools` */
export function mapCreateUserRequestToCreateSchool(
  request: CreateUserRequest
): SchoolOrganizationUpsertRequest {
  const organizationName = request.schoolInfo?.schoolName?.trim() || request.name.trim()
  const address = request.schoolInfo?.address?.trim() || request.address?.trim() || ''
  const body: SchoolOrganizationUpsertRequest = {
    name: organizationName || request.name.trim(),
    address,
  }
  const addressDetail =
    request.schoolInfo?.addressDetail?.trim() || request.detailAddress?.trim() || undefined
  if (addressDetail) body.addressDetail = addressDetail
  if (request.neisCode?.trim()) body.externalOrganizationCode = request.neisCode.trim()
  if (request.regionSido?.trim()) body.regionSido = request.regionSido.trim()
  if (request.regionSigungu?.trim()) body.regionSigungu = request.regionSigungu.trim()
  if (request.zipCode?.trim()) body.zipcode = request.zipCode.trim()
  return body
}

export function mapCreateUserRequestToPreRegisterInstructor(
  request: CreateUserRequest
): AdminPreRegisterInstructorRequest & { schoolSelection?: PortalSchoolSelectionRequest } {
  const { email, name, phone, gender, birthDate } = baseIdentity(request)
  if (!email) {
    throw new Error('강사 회원 등록에는 이메일이 필요합니다.')
  }
  const body: AdminPreRegisterInstructorRequest & {
    schoolSelection?: PortalSchoolSelectionRequest
  } = {
    email,
    name,
    rawPassword: resolveAdminProvisionedTempPassword(email),
  }
  if (phone) body.phone = phone
  if (gender) body.gender = gender
  if (birthDate) body.birthDate = birthDate
  if (request.instructorType?.trim()) body.instructorType = request.instructorType.trim()
  if (request.id1365?.trim()) body.external1365Id = request.id1365.trim()
  attachTermsAgreements(body, request)
  if (request.certifications != null && request.certifications.length > 0) {
    body.certifications = request.certifications
  }

  if (request.instructorCmsProfile) {
    body.profile = toApiInstructorCmsProfile(request.instructorCmsProfile)
    const schoolSelection = request.instructorCmsProfile.affiliation.schoolSelection
    if (schoolSelection) body.schoolSelection = schoolSelection
    const legacy = buildLegacyFlatFieldsFromCmsProfile(request.instructorCmsProfile)
    if (legacy.educationLevel) body.educationLevel = legacy.educationLevel
    if (legacy.careerText) body.careerText = legacy.careerText
    if (legacy.selfIntroduction) body.selfIntroduction = legacy.selfIntroduction
    if (legacy.oneLineIntro) body.oneLineIntro = legacy.oneLineIntro
    if (request.instructorCmsProfile.homeAddress.line?.trim()) {
      body.homeAddress = request.instructorCmsProfile.homeAddress.line.trim()
    }
    if (request.instructorCmsProfile.homeAddress.detail?.trim()) {
      body.homeAddressDetail = request.instructorCmsProfile.homeAddress.detail.trim()
    }
    const feeGrade = toInstructorFeeGradeApiValue(request.instructorCmsProfile.defaultFeeGrade)
    if (feeGrade) body.feeGrade = feeGrade
    const jaGrade = request.instructorCmsProfile.defaultJaGrade?.trim()
    if (jaGrade) body.jaGrade = jaGrade
  } else {
    if (request.address?.trim()) body.homeAddress = request.address.trim()
    if (request.detailAddress?.trim()) body.homeAddressDetail = request.detailAddress.trim()
    if (request.oneLineIntro?.trim()) body.oneLineIntro = request.oneLineIntro.trim()
    if (request.careerText?.trim()) body.careerText = request.careerText.trim()
    if (request.selfIntroduction?.trim()) body.selfIntroduction = request.selfIntroduction.trim()
    if (request.educationLevel?.trim()) body.educationLevel = request.educationLevel.trim()
  }

  const settlement = request.instructorCmsSettlement
  if (settlement) {
    body.settlement = toApiInstructorCmsSettlement(settlement)
    if (settlement.bankName) body.bankName = settlement.bankName
    if (settlement.accountNumber) body.accountNumber = settlement.accountNumber
    if (settlement.accountHolder) body.accountHolder = settlement.accountHolder
    body.businessIncome = settlement.businessIncome
    if (settlement.bankAccounts?.length) {
      body.bankAccounts = settlement.bankAccounts.map(row => ({
        bankName: row.bankName,
        ...(row.accountNumber ? { accountNumber: row.accountNumber } : {}),
        ...(row.accountHolder ? { accountHolder: row.accountHolder } : {}),
      }))
    }
  } else if (request.instructorInfo) {
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
