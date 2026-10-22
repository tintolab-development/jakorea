import type { PortalSchoolSelectionRequest } from '../model/types/signup-api.types'

export type SignupSchoolAttachmentInput = {
  schoolName: string
  schoolOrganizationId?: number | null
  schoolNeisCode?: string | null
  schoolEducationOfficeCode?: string | null
  schoolAddress?: string
  source?: 'neis' | 'careerNet'
}

export function resolveSignupSchoolAttachment(
  input: SignupSchoolAttachmentInput,
): {
  schoolOrganizationId?: number
  schoolSelection?: PortalSchoolSelectionRequest
} {
  if (input.schoolOrganizationId != null) {
    return { schoolOrganizationId: input.schoolOrganizationId }
  }

  const name = input.schoolName.trim()
  const externalSchoolCode = input.schoolNeisCode?.trim()
  if (!name || !externalSchoolCode) {
    return {}
  }

  const provider = input.source === 'careerNet' ? 'CAREER_NET' : 'NEIS'
  const schoolSelection: PortalSchoolSelectionRequest = {
    provider,
    externalSchoolCode,
    name,
    address: input.schoolAddress?.trim() || undefined,
    organizationCategory: 'SCHOOL',
  }

  if (provider !== 'CAREER_NET') {
    const educationOfficeCode = input.schoolEducationOfficeCode?.trim()
    if (educationOfficeCode) {
      schoolSelection.educationOfficeCode = educationOfficeCode
    }
  }

  return { schoolSelection }
}
