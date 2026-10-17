import type {
  PortalProfileResponse,
  PortalSchoolSelectionRequest,
  UpdatePortalProfileRequest,
} from '@/features/auth/sign-in'
import type { EmploymentStatus, SchoolStatus } from '@/features/auth/sign-up'
import { buildSchoolSelection } from '@/features/auth/sign-up/lib/build-school-selection'

type AdminRegisteredProfileUpdateInput = {
  schoolStatus: SchoolStatus
  schoolName: string
  /** 미재학(해당 없음) 선택 시 선택 입력 */
  affiliationName?: string
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
  schoolEducationOfficeCode?: string | null
  schoolSource?: 'neis' | 'careerNet'
  employmentStatus?: EmploymentStatus
  /** GET /api/portal/me/profile·설정 화면 스냅샷 — teacherEmploymentStatus 등 */
  portalProfile?: Partial<Omit<PortalProfileResponse, 'schoolOrganizationId'>> & {
    schoolOrganizationId?: number | null
  }
}

function text(value: string | undefined): string {
  return value?.trim() ?? ''
}

function buildSchoolSelectionForProfile(input: {
  schoolName: string
  schoolAddress?: string
  schoolNeisCode?: string | null
  schoolEducationOfficeCode?: string | null
  schoolSource?: 'neis' | 'careerNet'
  regionSido?: string
}): PortalSchoolSelectionRequest | undefined {
  return buildSchoolSelection({
    schoolName: input.schoolName,
    schoolNeisCode: input.schoolNeisCode,
    schoolEducationOfficeCode: input.schoolEducationOfficeCode,
    schoolAddress: input.schoolAddress,
    regionSido: input.regionSido,
    source: input.schoolSource,
  })
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
  const teacherEmploymentStatus =
    snapshot?.teacherEmploymentStatus?.trim() ||
    (input.employmentStatus === 'employed'
      ? 'EMPLOYED'
      : input.employmentStatus === 'on-leave'
        ? 'ON_LEAVE'
        : '')

  const base = {
    postalCode: text(input.postalCode) || text(snapshot?.postalCode),
    address: text(input.address),
    addressDetail: text(input.addressDetail),
    regionSido: text(input.regionSido) || text(snapshot?.regionSido),
    regionSigungu: text(input.regionSigungu) || text(snapshot?.regionSigungu),
    teacherEmploymentStatus,
    external1365Id: text(input.volunteerId),
  }

  /**
   * 해당 없음: 잔여 학교/NEIS 메타가 있어도 schoolSelection·ENROLLED로 나가면 안 됨.
   * schoolOrganizationId null 로 기존 FK 해제.
   */
  if (!enrolled) {
    return {
      ...base,
      schoolOrganizationId: null,
      schoolName: '',
      grade: '',
      affiliationName: text(input.affiliationName),
      schoolEnrollmentStatus: 'NOT_ENROLLED',
    }
  }

  const schoolName = text(input.schoolName)
  const grade = text(input.grade)
  /** `null`은 명시적 해제(NEIS-only). `undefined`(미전달)만 스냅샷 FK 유지. */
  const resolvedOrganizationId =
    input.schoolOrganizationId !== undefined
      ? input.schoolOrganizationId
      : (snapshot?.schoolOrganizationId ?? null)

  /**
   * 재학 중 + CMS PK: schoolOrganizationId 전송.
   * 재학 중 + PK 없음: schoolSelection 전송 (NEIS resolve/create).
   */
  const schoolOrganizationId: number | undefined =
    resolvedOrganizationId != null ? resolvedOrganizationId : undefined

  const schoolSelection =
    resolvedOrganizationId == null
      ? buildSchoolSelectionForProfile({
          schoolName: input.schoolName,
          schoolAddress: input.schoolAddress,
          schoolNeisCode: input.schoolNeisCode,
          schoolEducationOfficeCode: input.schoolEducationOfficeCode,
          schoolSource: input.schoolSource,
          regionSido: input.regionSido,
        })
      : undefined

  return {
    ...base,
    ...(schoolOrganizationId === undefined ? {} : { schoolOrganizationId }),
    ...(schoolSelection ? { schoolSelection } : {}),
    schoolName,
    grade,
    affiliationName: schoolName,
    schoolEnrollmentStatus: 'ENROLLED',
  }
}
