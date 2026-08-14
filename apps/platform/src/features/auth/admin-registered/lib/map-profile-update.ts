import type { PortalProfileResponse, UpdatePortalProfileRequest } from '@/features/auth/sign-in'
import type { EmploymentStatus, GenderType, MemberType, SchoolStatus } from '@/features/auth/sign-up'

type AdminRegisteredProfileUpdateInput = {
  schoolStatus: SchoolStatus
  schoolName: string
  grade: string
  address: string
  addressDetail: string
  postalCode?: string
  regionSido?: string
  regionSigungu?: string
  volunteerId: string
  schoolOrganizationId?: number | null
  email?: string
  name?: string
  phone?: string
  birthDate?: string
  gender?: GenderType
  memberType?: MemberType
  employmentStatus?: EmploymentStatus
  /** GET /api/portal/me/profile 스냅샷 */
  portalProfile?: PortalProfileResponse
}

function text(value: string | undefined): string {
  return value?.trim() ?? ''
}

function toApiBirthDate(birthDate: string | undefined): string {
  const digits = birthDate?.replace(/\D/g, '') ?? ''
  if (digits.length < 8) return ''
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`
}

function toApiGender(gender: GenderType | undefined): string {
  if (gender === 'female') return 'F'
  if (gender === 'male') return 'M'
  return ''
}

/**
 * 수정 화면 값 + GET 프로필을 PATCH 본문으로 합친다.
 * `external1365Id` 빈 문자열은 omit하지 않는다.
 */
export function mapAdminRegisteredEditToPortalProfileUpdate(
  input: AdminRegisteredProfileUpdateInput,
): UpdatePortalProfileRequest {
  const enrolled = input.schoolStatus === 'enrolled'
  const snapshot = input.portalProfile
  const schoolName = enrolled ? text(input.schoolName) : ''
  const grade = enrolled ? text(input.grade) : ''
  /**
   * 재학 중: 선택 학교 PK (없으면 omit — 스냅샷 FK로 조용히 덮지 않음은 검색 선택값 우선).
   * 해당 없음: 반드시 `null` — omit 하면 서버가 기존 schoolOrganizationId를 유지해 CMS 소속이 남는다.
   */
  const schoolOrganizationId: number | null | undefined = enrolled
    ? input.schoolOrganizationId === null
      ? undefined
      : (input.schoolOrganizationId ?? snapshot?.schoolOrganizationId)
    : null
  const teacherEmploymentStatus =
    snapshot?.teacherEmploymentStatus?.trim() ||
    (input.employmentStatus === 'employed'
      ? 'EMPLOYED'
      : input.employmentStatus === 'on-leave'
        ? 'ON_LEAVE'
        : '')

  return {
    ...(snapshot?.memberId != null ? { memberId: snapshot.memberId } : {}),
    email: text(input.email) || text(snapshot?.email),
    name: text(input.name) || text(snapshot?.name),
    phone: text(input.phone) || text(snapshot?.phone),
    birthDate: toApiBirthDate(input.birthDate) || text(snapshot?.birthDate),
    gender: toApiGender(input.gender) || text(snapshot?.gender),
    memberType:
      snapshot?.memberType?.trim() ||
      (input.memberType === 'teacher' ? 'TEACHER' : input.memberType === 'general' ? 'GENERAL' : ''),
    ...(snapshot?.teacher != null
      ? { teacher: snapshot.teacher }
      : input.memberType != null
        ? { teacher: input.memberType === 'teacher' }
        : {}),
    ...(snapshot?.instructor != null ? { instructor: snapshot.instructor } : {}),
    postalCode: text(input.postalCode) || text(snapshot?.postalCode),
    address: text(input.address),
    addressDetail: text(input.addressDetail),
    regionSido: text(input.regionSido) || text(snapshot?.regionSido),
    regionSigungu: text(input.regionSigungu) || text(snapshot?.regionSigungu),
    ...(schoolOrganizationId === undefined ? {} : { schoolOrganizationId }),
    schoolName,
    grade,
    affiliationName: schoolName,
    schoolEnrollmentStatus: enrolled ? 'ENROLLED' : 'NOT_ENROLLED',
    teacherEmploymentStatus,
    external1365Id: text(input.volunteerId),
    ...(snapshot?.accountStatus != null ? { accountStatus: snapshot.accountStatus } : {}),
    ...(snapshot?.joinedAt != null ? { joinedAt: snapshot.joinedAt } : {}),
  }
}
