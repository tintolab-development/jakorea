import type { Program } from '@/types/domain'

export const GENERAL_PROGRAM_SERVICE_DETAIL_JSON_VERSION = 1 as const

export interface GeneralProgramServiceDetailJsonV1 {
  schemaVersion: typeof GENERAL_PROGRAM_SERVICE_DETAIL_JSON_VERSION
  generalCommonInfo?: Program['generalCommonInfo']
  generalParticipantTypes?: Program['generalParticipantTypes']
  generalSurveyMenuKeys?: Program['generalSurveyMenuKeys']
  targetLevels?: Program['targetLevels']
  /** 교육 진행 구조 (커리큘럼형 / 일정형) — 탑레벨 API 필드 없음 → JSON 영속 */
  generalProgramEducationStructure?: Program['generalProgramEducationStructure']
  /** 수업 회차 유형 */
  generalProgramSessionRound?: Program['generalProgramSessionRound']
  /** 참여자 대상 (기관 / 개인) */
  generalProgramAudience?: Program['generalProgramAudience']
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
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    generalProgramAudience: program.generalProgramAudience,
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
      generalProgramEducationStructure: parsed.generalProgramEducationStructure,
      generalProgramSessionRound: parsed.generalProgramSessionRound,
      generalProgramAudience: parsed.generalProgramAudience,
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
