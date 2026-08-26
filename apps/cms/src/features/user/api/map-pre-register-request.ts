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

function attachTermsAgreements<
  T extends { termsAgreements?: AdminPreRegisterIndividualRequest['termsAgreements'] },
>(body: T, request: CreateUserRequest): T {
  if (request.termsAgreements != null && request.termsAgreements.length > 0) {
    body.termsAgreements = request.termsAgreements
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

function trimOptional(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/** 재학 중 개인 pre-register — CMS PK 없을 때 NEIS/CareerNet 선택값 */
function buildIndividualSchoolSelection(
  request: CreateUserRequest
): PortalSchoolSelectionRequest | undefined {
  const name = trimOptional(request.affiliation)
  if (!name) return undefined

  const selection: PortalSchoolSelectionRequest = {
    name,
    organizationCategory: 'SCHOOL',
  }
  const provider = trimOptional(request.schoolProvider)
  if (provider) selection.provider = provider
  const externalSchoolCode =
    trimOptional(request.schoolExternalCode) ?? trimOptional(request.neisCode)
  if (externalSchoolCode) {
    selection.externalSchoolCode = externalSchoolCode
    if (!selection.provider) selection.provider = 'NEIS'
  }
  const schoolLevel = trimOptional(request.schoolLevel)
  if (schoolLevel) selection.schoolLevel = schoolLevel
  const regionSido = trimOptional(request.schoolRegionSido) ?? trimOptional(request.regionSido)
  if (regionSido) selection.regionSido = regionSido
  const regionSigungu =
    trimOptional(request.schoolRegionSigungu) ?? trimOptional(request.regionSigungu)
  if (regionSigungu) selection.regionSigungu = regionSigungu
  const zipcode = trimOptional(request.schoolZipcode) ?? trimOptional(request.zipCode)
  if (zipcode) selection.zipcode = zipcode
  const address = trimOptional(request.schoolAddress)
  if (address) selection.address = address
  return selection
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
  const enrollmentStatus = request.schoolEnrollmentStatus
  if (!enrollmentStatus) {
    throw new Error('개인 회원 등록에는 재학/미재학 상태(enrollmentStatus)가 필요합니다.')
  }

  const requiredPhone = phone?.trim()
  if (!requiredPhone) {
    throw new Error('개인 회원 등록에는 전화번호(phone)가 필요합니다.')
  }

  const requiredGender = gender?.trim()
  if (!requiredGender) {
    throw new Error('개인 회원 등록에는 성별(gender)이 필요합니다.')
  }

  const requiredBirthDate = birthDate?.trim()
  if (!requiredBirthDate) {
    throw new Error('개인 회원 등록에는 생년월일(birthDate)이 필요합니다.')
  }

  const requiredAddress = request.address?.trim()
  if (!requiredAddress) {
    throw new Error('개인 회원 등록에는 주소(address)가 필요합니다.')
  }

  const body: AdminPreRegisterIndividualRequest = {
    email,
    name,
    rawPassword: resolveAdminProvisionedTempPassword(email),
    phone: requiredPhone,
    gender: requiredGender,
    birthDate: requiredBirthDate,
    address: requiredAddress,
    enrollmentStatus,
  }
  if (request.detailAddress?.trim()) body.addressDetail = request.detailAddress.trim()
  if (request.zipCode?.trim()) body.zipCode = request.zipCode.trim()
  if (request.affiliation?.trim()) body.schoolName = request.affiliation.trim()
  const grade = request.grade?.trim()
  if (grade && request.schoolEnrollmentStatus === 'ENROLLED') {
    body.grade = grade
  }
  if (request.schoolEnrollmentStatus === 'ENROLLED') {
    const organizationId = request.schoolOrganizationId
    if (organizationId != null && Number.isFinite(organizationId)) {
      body.schoolOrganizationId = organizationId
    } else {
      const schoolSelection = buildIndividualSchoolSelection(request)
      if (schoolSelection) body.schoolSelection = schoolSelection
    }
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
