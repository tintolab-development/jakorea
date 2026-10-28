import type { UpdatePortalProfileRequest } from '@/features/auth/sign-in/api/types'
import { resolveSignupSchoolAttachment } from '../../../auth/sign-up/lib/signup-school-attachment.ts'
import type { SelectedSchool } from '@/features/auth/sign-up'
import type { InstructorSharedProfileFormValues } from '@jakorea/domain/instructor/profile-form-values'
import {
  mapInstructorFormValuesToPortalEditableProfile,
  mapInstructorFormValuesToPortalSettlement,
} from '../../instructor-apply/api/map-create-request.ts'

export type InstructorBasicSettingsAddressMeta = {
  postalCode?: string
  regionSido?: string
  regionSigungu?: string
}

export type InstructorBasicSettingsUpdateOptions = {
  /**
   * 교사 겸 강사 — 항상 교사 가입 + 강사 신청이므로 교사 회원과 동일하게 저장
   * (`schoolName`·`affiliationName`=학교명·`teacherEmploymentStatus`).
   * `selectedSchool`은 이번 수정에서 학교 검색으로 새로 고른 경우에만 넘김.
   * CMS 등록 학교면 `organizationId`, 아니면 NEIS 선택 정보(`schoolSelection`)를 보내
   * BE가 가입과 같은 방식으로 기존 학교를 찾거나 새로 등록한다.
   */
  dualTeacher?: {
    selectedSchool?: SelectedSchool | null
  }
}

/** BE `TeacherEmploymentStatusPolicy.normalizeForSignup` 허용값 — 그 외는 400 */
const DUAL_TEACHER_SAVABLE_EMPLOYMENT_STATUSES: ReadonlySet<string> = new Set([
  'ACTIVE',
  'EMPLOYED',
  'ON_LEAVE',
])

/**
 * 교사 겸 강사 학교 저장 — 두 갈래
 * - `organizationId` 있음: `schoolOrganizationId` + 강사 JSON `affiliation.organizationId` 동일 값.
 * - `organizationId` 없음(NEIS 선택만): `schoolSelection`만 전송 (BE가 기존 학교 조회 → 없으면 등록).
 * 재직 현황은 BE 허용값일 때만 보내고, 아니면 `teacherEmploymentStatus`·`affiliation.employmentStatus` 모두 생략.
 */
function applyDualTeacherOverrides(
  base: UpdatePortalProfileRequest,
  selectedSchool: SelectedSchool | null | undefined,
): UpdatePortalProfileRequest {
  const { teacherEmploymentStatus, ...rest } = base
  const employmentStatus = teacherEmploymentStatus?.trim() ?? ''
  const isEmploymentSavable = DUAL_TEACHER_SAVABLE_EMPLOYMENT_STATUSES.has(
    employmentStatus.toUpperCase(),
  )
  const organizationId = selectedSchool?.organizationId ?? null
  // 가입과 동일한 헬퍼 — id가 없으면 NEIS/커리어넷 선택 정보(외부 코드·학교명·주소·교육청 코드)만 전송
  const { schoolSelection } = selectedSchool
    ? resolveSignupSchoolAttachment({
        schoolName: selectedSchool.name,
        schoolOrganizationId: organizationId,
        schoolNeisCode: selectedSchool.neisCode,
        schoolEducationOfficeCode: selectedSchool.educationOfficeCode,
        schoolAddress: selectedSchool.address,
        source: selectedSchool.source ?? (selectedSchool.neisCode ? 'neis' : undefined),
      })
    : {}

  const instructorProfile = base.instructorProfile
  const profile = instructorProfile?.profile
  let nextInstructorProfile = instructorProfile
  if (instructorProfile && profile) {
    const { employmentStatus: affiliationEmploymentStatus, ...affiliationRest } =
      profile.affiliation
    nextInstructorProfile = {
      ...instructorProfile,
      profile: {
        ...profile,
        affiliation: {
          ...affiliationRest,
          ...(organizationId != null ? { organizationId } : {}),
          ...(isEmploymentSavable && affiliationEmploymentStatus
            ? { employmentStatus: affiliationEmploymentStatus }
            : {}),
        },
      },
    }
  }

  return {
    ...rest,
    ...(organizationId != null ? { schoolOrganizationId: organizationId } : {}),
    ...(schoolSelection ? { schoolSelection } : {}),
    ...(isEmploymentSavable ? { teacherEmploymentStatus: employmentStatus } : {}),
    ...(nextInstructorProfile ? { instructorProfile: nextInstructorProfile } : {}),
  }
}

/** 강사 회원정보 설정 — 기본 정보(+ 전체 수정) 저장 PATCH */
export function mapInstructorBasicSettingsToPortalProfileUpdate(
  values: InstructorSharedProfileFormValues,
  addressMeta?: InstructorBasicSettingsAddressMeta,
  options?: InstructorBasicSettingsUpdateOptions,
): UpdatePortalProfileRequest {
  if (!options?.dualTeacher) return mapInstructorBasicSettingsCore(values, addressMeta)
  return applyDualTeacherOverrides(
    mapInstructorBasicSettingsCore({ ...values, memberType: 'school_teacher' }, addressMeta),
    options.dualTeacher.selectedSchool,
  )
}

function mapInstructorBasicSettingsCore(
  values: InstructorSharedProfileFormValues,
  addressMeta?: InstructorBasicSettingsAddressMeta,
): UpdatePortalProfileRequest {
  const homeLine = values.homeAddress.trim()
  const homeDetail = values.homeAddressDetail.trim()

  const portalTopLevel: UpdatePortalProfileRequest = {
    address: homeLine || null,
    addressDetail: homeDetail || null,
    postalCode: addressMeta?.postalCode?.trim() || null,
    regionSido: addressMeta?.regionSido?.trim() || null,
    regionSigungu: addressMeta?.regionSigungu?.trim() || null,
    instructorProfile: {
      profile: mapInstructorFormValuesToPortalEditableProfile(values),
      settlement: mapInstructorFormValuesToPortalSettlement(values),
    },
  }

  if (values.memberType === 'school_teacher') {
    const schoolName = values.schoolName.trim()
    return {
      ...portalTopLevel,
      schoolName: schoolName || null,
      affiliationName: schoolName || null,
      teacherEmploymentStatus: values.employmentStatus || null,
    }
  }

  if (values.affiliationNone) {
    return {
      ...portalTopLevel,
      affiliationName: null,
    }
  }

  const affiliationName = values.affiliationName.trim()
  return {
    ...portalTopLevel,
    affiliationName: affiliationName || null,
  }
}
