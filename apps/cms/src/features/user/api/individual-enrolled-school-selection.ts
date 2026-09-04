import { resolveNeisEducationOfficeCode } from '@/features/user/api/neis-education-office-code'
import { INDIVIDUAL_ENROLLED_NEIS_SCHOOL_SELECTION_REQUIRED_ALERT_MESSAGE } from '@/shared/constants/messages'

export type IndividualEnrolledSchoolSelectionInput = {
  schoolProvider?: string | null
  schoolOrganizationId?: number | null
  schoolExternalCode?: string | null
  schoolEducationOfficeCode?: string | null
  schoolRegionSido?: string | null
}

function trimOptional(value: string | null | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/**
 * 개인 재학 소속 — CMS PK, NEIS selection, 또는 CAREER_NET(대학/전문대) selection.
 * 학교명-only·불완전 선택이면 API 호출 전 차단 메시지를 반환한다.
 */
export function resolveIndividualEnrolledSchoolSubmitBlock(
  input: IndividualEnrolledSchoolSelectionInput
): string | null {
  const organizationId = input.schoolOrganizationId
  if (organizationId != null && Number.isFinite(organizationId)) {
    return null
  }

  const provider = trimOptional(input.schoolProvider)
  const externalSchoolCode = trimOptional(input.schoolExternalCode)

  if (provider === 'CAREER_NET') {
    if (externalSchoolCode) return null
    return INDIVIDUAL_ENROLLED_NEIS_SCHOOL_SELECTION_REQUIRED_ALERT_MESSAGE
  }

  const educationOfficeCode = resolveNeisEducationOfficeCode({
    provider: provider ?? 'NEIS',
    educationOfficeCode: input.schoolEducationOfficeCode ?? undefined,
    regionSido: input.schoolRegionSido ?? undefined,
    externalSchoolCode,
  })

  if (externalSchoolCode && educationOfficeCode && (provider == null || provider === 'NEIS')) {
    return null
  }

  return INDIVIDUAL_ENROLLED_NEIS_SCHOOL_SELECTION_REQUIRED_ALERT_MESSAGE
}

/**
 * 회원 상세 수정 — 이미 등록된 재학 소속명을 그대로 두면 학교 재검색을 요구하지 않는다.
 * 소속명을 바꾸거나 비운 뒤에 검색 선택이 없으면 `resolveIndividualEnrolledSchoolSubmitBlock`으로 막는다.
 */
export function shouldSkipIndividualEnrolledSchoolReselectionGuard(params: {
  draftInstitution: string
  originalInstitution: string
  schoolOrganizationId?: number | null
  schoolProvider?: string | null
  schoolExternalCode?: string | null
}): boolean {
  const draftInstitution = params.draftInstitution.trim()
  const originalInstitution = params.originalInstitution.trim()
  if (!draftInstitution || draftInstitution !== originalInstitution) return false
  if (params.schoolOrganizationId != null && Number.isFinite(params.schoolOrganizationId)) {
    return false
  }
  if (trimOptional(params.schoolProvider) || trimOptional(params.schoolExternalCode)) {
    return false
  }
  return true
}
