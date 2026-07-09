import type { Program } from '@/types/domain'

export const GENERAL_PROGRAM_SERVICE_DETAIL_JSON_VERSION = 1 as const

export interface GeneralProgramServiceDetailJsonV1 {
  schemaVersion: typeof GENERAL_PROGRAM_SERVICE_DETAIL_JSON_VERSION
  generalCommonInfo?: Program['generalCommonInfo']
  generalParticipantTypes?: Program['generalParticipantTypes']
  generalSurveyMenuKeys?: Program['generalSurveyMenuKeys']
  targetLevels?: Program['targetLevels']
  instructorApplicationStartDate?: Program['instructorApplicationStartDate']
  instructorApplicationEndDate?: Program['instructorApplicationEndDate']
  volunteerApplicationStartDate?: Program['volunteerApplicationStartDate']
  volunteerApplicationEndDate?: Program['volunteerApplicationEndDate']
  resultAnnouncementDate?: Program['resultAnnouncementDate']
  resultAnnouncementMethod?: Program['resultAnnouncementMethod']
}

export function serializeGeneralProgramServiceDetailJson(program: Program): string | undefined {
  const payload: GeneralProgramServiceDetailJsonV1 = {
    schemaVersion: GENERAL_PROGRAM_SERVICE_DETAIL_JSON_VERSION,
    generalCommonInfo: program.generalCommonInfo,
    generalParticipantTypes: program.generalParticipantTypes,
    generalSurveyMenuKeys: program.generalSurveyMenuKeys,
    targetLevels: program.targetLevels,
    instructorApplicationStartDate: program.instructorApplicationStartDate,
    instructorApplicationEndDate: program.instructorApplicationEndDate,
    volunteerApplicationStartDate: program.volunteerApplicationStartDate,
    volunteerApplicationEndDate: program.volunteerApplicationEndDate,
    resultAnnouncementDate: program.resultAnnouncementDate,
    resultAnnouncementMethod: program.resultAnnouncementMethod,
  }

  const hasContent = Object.entries(payload).some(([key, value]) => {
    if (key === 'schemaVersion') return false
    if (value == null) return false
    if (Array.isArray(value)) return value.length > 0
    if (typeof value === 'object') return Object.keys(value).length > 0
    return true
  })

  if (!hasContent) return undefined
  return JSON.stringify(payload)
}

export function parseGeneralProgramServiceDetailJson(
  raw?: string | null
): Partial<Program> {
  if (!raw?.trim()) return {}

  try {
    const parsed = JSON.parse(raw) as GeneralProgramServiceDetailJsonV1
    if (parsed?.schemaVersion !== GENERAL_PROGRAM_SERVICE_DETAIL_JSON_VERSION) {
      return {}
    }

    return {
      generalCommonInfo: parsed.generalCommonInfo,
      generalParticipantTypes: parsed.generalParticipantTypes,
      generalSurveyMenuKeys: parsed.generalSurveyMenuKeys,
      targetLevels: parsed.targetLevels,
      instructorApplicationStartDate: parsed.instructorApplicationStartDate,
      instructorApplicationEndDate: parsed.instructorApplicationEndDate,
      volunteerApplicationStartDate: parsed.volunteerApplicationStartDate,
      volunteerApplicationEndDate: parsed.volunteerApplicationEndDate,
      resultAnnouncementDate: parsed.resultAnnouncementDate,
      resultAnnouncementMethod: parsed.resultAnnouncementMethod,
    }
  } catch {
    return {}
  }
}
