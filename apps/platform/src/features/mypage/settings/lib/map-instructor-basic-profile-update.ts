import type { UpdatePortalProfileRequest } from '@/features/auth/sign-in/api/types'
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

/** 강사 회원정보 설정 — 기본 정보 저장 PATCH */
export function mapInstructorBasicSettingsToPortalProfileUpdate(
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
