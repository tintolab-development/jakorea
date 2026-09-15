import type { UpdatePortalProfileRequest } from '@/features/auth/sign-in'
import { buildSchoolSelection } from '@/features/auth/sign-up/lib/build-school-selection'
import type { SettingsTeacherEditFormValues } from './map-edit'

export function mapTeacherSettingsEditToPortalProfileUpdate(
  form: SettingsTeacherEditFormValues,
): UpdatePortalProfileRequest {
  const schoolName = form.schoolName.trim()
  const schoolOrganizationId = form.schoolOrganizationId
  const schoolSelection =
    schoolOrganizationId == null
      ? buildSchoolSelection({
          schoolName,
          schoolNeisCode: form.schoolNeisCode,
          schoolEducationOfficeCode: form.schoolEducationOfficeCode,
          schoolAddress: form.schoolAddress,
          source: form.schoolSource,
        })
      : undefined

  return {
    schoolName,
    affiliationName: schoolName,
    ...(schoolOrganizationId == null ? {} : { schoolOrganizationId }),
    ...(schoolSelection ? { schoolSelection } : {}),
    teacherEmploymentStatus: form.employmentStatus,
  }
}
