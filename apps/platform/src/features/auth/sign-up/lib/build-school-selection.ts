import type { PortalSchoolSelectionRequest } from '../model/types/signup-api.types'
import { resolveNeisEducationOfficeCode } from './resolve-neis-education-office-code'

export type BuildSchoolSelectionInput = {
  schoolName: string
  schoolNeisCode?: string | null
  schoolEducationOfficeCode?: string | null
  schoolAddress?: string
  regionSido?: string
  source?: 'neis' | 'careerNet'
}

export function buildSchoolSelection(
  input: BuildSchoolSelectionInput,
): PortalSchoolSelectionRequest | undefined {
  const name = input.schoolName.trim()
  if (!name) return undefined

  const provider = input.source === 'careerNet' ? 'CAREER_NET' : 'NEIS'
  const externalSchoolCode = input.schoolNeisCode?.trim() || undefined

  const selection: PortalSchoolSelectionRequest = {
    provider,
    externalSchoolCode,
    name,
    address: input.schoolAddress?.trim() || undefined,
    organizationCategory: 'SCHOOL',
  }

  const educationOfficeCode = resolveNeisEducationOfficeCode({
    provider,
    educationOfficeCode: input.schoolEducationOfficeCode,
    regionSido: input.regionSido,
    externalSchoolCode,
  })
  if (educationOfficeCode) {
    selection.educationOfficeCode = educationOfficeCode
  }

  return selection
}
