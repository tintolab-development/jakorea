import type { UpdatePortalProfileRequest } from '@/features/auth/sign-in'
import { buildSchoolSelection } from '@/features/auth/sign-up/lib/build-school-selection'
import type { SettingsTeacherEditFormValues } from './map-edit'

export function mapTeacherSettingsEditToPortalProfileUpdate(
  form: SettingsTeacherEditFormValues,
): UpdatePortalProfileRequest {
  const schoolName = form.schoolName.trim()
  const schoolOrganizationId = form.schoolOrganizationId
  // NEIS 검색 결과를 이번에 새로 고른 경우(학교 코드 있음)에만 `schoolSelection` 전송.
  // 학교를 바꾸지 않은 저장은 학교 정보를 보내지 않아 BE가 기존 학교를 유지한다.
  const schoolSelection =
    schoolOrganizationId == null && form.schoolNeisCode.trim()
      ? buildSchoolSelection({
          schoolName,
          schoolNeisCode: form.schoolNeisCode,
          schoolEducationOfficeCode: form.schoolEducationOfficeCode,
          schoolAddress: form.schoolAddress,
          source: form.schoolSource,
        })
      : undefined

  // 강사가 아닌 교사는 `affiliationName`을 보내기만 해도 BE가 400
  // (`PORTAL_TEACHER_PROFILE_FIELD_NOT_EDITABLE`)으로 막으므로 보내지 않는다.
  return {
    schoolName,
    ...(schoolOrganizationId == null ? {} : { schoolOrganizationId }),
    ...(schoolSelection ? { schoolSelection } : {}),
    teacherEmploymentStatus: form.employmentStatus,
  }
}
