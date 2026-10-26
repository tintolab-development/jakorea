import type { UpdatePortalProfileRequest } from '@/features/auth/sign-in/api/types'
import { buildSchoolSelection } from '@/features/auth/sign-up/lib/build-school-selection'
import type { SelectedSchool } from '@/features/auth/sign-up'
import type { InstructorSharedProfileFormValues } from '@jakorea/domain/instructor/profile-form-values'
import {
  mapInstructorFormValuesToPortalEditableProfile,
  mapInstructorFormValuesToPortalSettlement,
} from '@/features/mypage/instructor-apply/api/map-create-request'

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
   */
  dualTeacher?: {
    selectedSchool?: SelectedSchool | null
  }
}

function mapDualTeacherSchoolSelection(
  selectedSchool: SelectedSchool | null | undefined,
): UpdatePortalProfileRequest {
  if (!selectedSchool) return {}
  if (selectedSchool.organizationId != null) {
    return { schoolOrganizationId: selectedSchool.organizationId }
  }
  const schoolSelection = buildSchoolSelection({
    schoolName: selectedSchool.name,
    schoolNeisCode: selectedSchool.neisCode,
    schoolEducationOfficeCode: selectedSchool.educationOfficeCode,
    schoolAddress: selectedSchool.address,
    source: selectedSchool.source ?? (selectedSchool.neisCode ? 'neis' : undefined),
  })
  return schoolSelection ? { schoolSelection } : {}
}

/** 강사 회원정보 설정 — 기본 정보(+ 전체 수정) 저장 PATCH */
export function mapInstructorBasicSettingsToPortalProfileUpdate(
  values: InstructorSharedProfileFormValues,
  addressMeta?: InstructorBasicSettingsAddressMeta,
  options?: InstructorBasicSettingsUpdateOptions,
): UpdatePortalProfileRequest {
  if (!options?.dualTeacher) return mapInstructorBasicSettingsCore(values, addressMeta)
  return {
    ...mapInstructorBasicSettingsCore({ ...values, memberType: 'school_teacher' }, addressMeta),
    ...mapDualTeacherSchoolSelection(options.dualTeacher.selectedSchool),
  }
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
