import type { PortalProfileResponse } from '@/features/auth/sign-in/api/types'
import { mapInstructorCmsProfileToFormPartial } from '@/features/mypage/instructor-apply/api/map-detail-to-form-values'
import {
  INITIAL_INSTRUCTOR_SHARED_PROFILE_VALUES,
  type InstructorSharedProfileFormValues,
} from '@jakorea/domain/instructor/profile-form-values'
import { formatKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'
import {
  toInstructorFormBirthDate,
  toInstructorFormGender,
} from '@/features/mypage/instructor-apply/map-locked-basic-info'

/** GET /portal/me/profile → 강사 설정 편집용 폼 전체값 */
export function buildInstructorSettingsFormValues(
  profile: PortalProfileResponse,
): InstructorSharedProfileFormValues {
  const cms = profile.instructorProfile?.profile
  const partial = mapInstructorCmsProfileToFormPartial(cms)

  return {
    ...INITIAL_INSTRUCTOR_SHARED_PROFILE_VALUES,
    ...partial,
    name: profile.name?.trim() ?? '',
    gender: toInstructorFormGender(profile.gender) || INITIAL_INSTRUCTOR_SHARED_PROFILE_VALUES.gender,
    birthDate: toInstructorFormBirthDate(profile.birthDate),
    contact: profile.phone?.trim() ? formatKoreanPhoneNumber(profile.phone.trim()) : '',
    email: profile.email?.trim() ?? '',
  }
}
