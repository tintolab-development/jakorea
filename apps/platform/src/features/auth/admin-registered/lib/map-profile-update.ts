import type {
  PortalProfileResponse,
  PortalSchoolSelectionRequest,
  UpdatePortalProfileRequest,
} from '@/features/auth/sign-in'
import type { EmploymentStatus, SchoolStatus } from '@/features/auth/sign-up'

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
  schoolAddress?: string
  schoolNeisCode?: string | null
  employmentStatus?: EmploymentStatus
  /** GET /api/portal/me/profile 스냅샷 — teacherEmploymentStatus 등 */
  portalProfile?: PortalProfileResponse
}

function text(value: string | undefined): string {
  return value?.trim() ?? ''
}

function buildSchoolSelection(input: {
  schoolName: string
  schoolAddress?: string
  schoolNeisCode?: string | null
  schoolOrganizationId?: number | null
}): PortalSchoolSelectionRequest | undefined {
  const name = input.schoolName.trim()
  if (!name) return undefined

  return {
    ...(input.schoolOrganizationId != null
      ? { schoolOrganizationId: input.schoolOrganizationId }
      : {}),
    provider: 'NEIS',
    externalSchoolCode: input.schoolNeisCode?.trim() || undefined,
    name,
    address: input.schoolAddress?.trim() || undefined,
    organizationCategory: 'SCHOOL',
  }
}

/**
 * 수정 화면 값을 OpenAPI `UpdatePortalProfileRequest`로 매핑한다.
 * `external1365Id` 빈 문자열은 omit하지 않는다.
 */
export function mapAdminRegisteredEditToPortalProfileUpdate(
  input: AdminRegisteredProfileUpdateInput,
): UpdatePortalProfileRequest {
  const enrolled = input.schoolStatus === 'enrolled'
  const snapshot = input.portalProfile
  const schoolName = enrolled ? text(input.schoolName) : ''
  const grade = enrolled ? text(input.grade) : ''
  const resolvedOrganizationId =
    input.schoolOrganizationId ?? snapshot?.schoolOrganizationId ?? null

  /**
   * 재학 중 + CMS PK: schoolOrganizationId 전송.
   * 재학 중 + PK 없음: schoolSelection 전송 (NEIS resolve/create).
   * 해당 없음: schoolOrganizationId null — omit 시 서버가 기존 FK 유지.
   */
  const schoolOrganizationId: number | null | undefined = enrolled
    ? resolvedOrganizationId != null
      ? resolvedOrganizationId
      : undefined
    : null

  const schoolSelection =
    enrolled && resolvedOrganizationId == null
      ? buildSchoolSelection({
          schoolName: input.schoolName,
          schoolAddress: input.schoolAddress,
          schoolNeisCode: input.schoolNeisCode,
        })
      : undefined

  const teacherEmploymentStatus =
    snapshot?.teacherEmploymentStatus?.trim() ||
    (input.employmentStatus === 'employed'
      ? 'EMPLOYED'
      : input.employmentStatus === 'on-leave'
        ? 'ON_LEAVE'
        : '')

  return {
    postalCode: text(input.postalCode) || text(snapshot?.postalCode),
    address: text(input.address),
    addressDetail: text(input.addressDetail),
    regionSido: text(input.regionSido) || text(snapshot?.regionSido),
    regionSigungu: text(input.regionSigungu) || text(snapshot?.regionSigungu),
    ...(schoolOrganizationId === undefined ? {} : { schoolOrganizationId }),
    ...(schoolSelection ? { schoolSelection } : {}),
    schoolName,
    grade,
    affiliationName: schoolName,
    schoolEnrollmentStatus: enrolled ? 'ENROLLED' : 'NOT_ENROLLED',
    teacherEmploymentStatus,
    external1365Id: text(input.volunteerId),
  }
}
