import type { InstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@/features/template/model/program-application-form-individual-draft'
import { PROGRAM_APPLICATION_FORM_INSTITUTION_IDS } from '@/features/template/model/program-application-form-institution-draft'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'
import type { ParagraphBodyInteractionMode } from '@/features/template/ui/paragraph/renderers/paragraph-body-interaction-mode'
import {
  shouldShowInstitutionApplicationMaxSessionsPerDayField,
  shouldShowInstitutionApplicationPreferredScheduleParagraph,
  shouldShowInstitutionApplicationScheduleParagraph,
} from '@/features/program/general/lib/institution-application-program-bridge'
import { clampInstitutionScheduleBlockCount } from '@/features/template/lib/participant-recruitment-institution-limits'
import {
  resolveApplicationFixedScheduleParagraphDescription,
  resolveApplicationPreferredScheduleParagraphDescription,
} from '@jakorea/form-schema/program-application'

export function isProgramApplicationScheduleChoiceParagraphId(paragraphId: string): boolean {
  return (
    paragraphId === PROGRAM_APPLICATION_FORM_INSTITUTION_IDS.scheduleChoice ||
    paragraphId === PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice
  )
}

/** 등록 위저드·프로그램 상세 연동 미리보기 — 템플릿 기본 힌트 대신 공통정보 기반 일정 UI */
export function isProgramLinkedGeneralApplicationSchedulePreview(
  options?: Pick<
    RenderFormParagraphBodyOptions,
    'programLinkedInstitutionApplicationForm' | 'programLinkedIndividualApplicationForm'
  >
): boolean {
  return (
    options?.programLinkedInstitutionApplicationForm === true ||
    options?.programLinkedIndividualApplicationForm === true
  )
}

export function shouldUseProgramApplicationScheduleTemplateAuthoringMode(
  paragraphId: string,
  paragraphInteractionMode: ParagraphBodyInteractionMode,
  options?: RenderFormParagraphBodyOptions
): boolean {
  if (paragraphInteractionMode !== 'authoring') return false
  if (!isProgramApplicationScheduleChoiceParagraphId(paragraphId)) return true
  return !isProgramLinkedGeneralApplicationSchedulePreview(options)
}

/** 날짜 지정 — 고정 일정 체크박스 안내 문구 */
export function resolveInstitutionFixedScheduleDescription(
  bridge: InstitutionApplicationProgramBridge
): string {
  return resolveApplicationFixedScheduleParagraphDescription({
    educationStructure: bridge.educationStructure,
    sessionRound: bridge.sessionRound,
    educationScheduleMode: bridge.educationScheduleMode,
    educationScheduleLines: bridge.educationScheduleLines,
    educationRoundCount: bridge.educationRoundCount,
    sessionsPerRound: bridge.sessionsPerRound,
    curriculumChartSessionCount: bridge.curriculumChartSessionCount,
    unknownCount: 'omit',
  })
}

/**
 * 커리큘럼형 + 복수 회차 + 기간 지정 — 희망 교육 일정 카드 설명.
 * 모집 상한이 없으면 시안과 같이 `N`으로 둔다.
 */
export function resolveInstitutionPreferredScheduleDescription(
  bridge: InstitutionApplicationProgramBridge
): string {
  return resolveApplicationPreferredScheduleParagraphDescription({
    educationStructure: bridge.educationStructure,
    sessionRound: bridge.sessionRound,
    educationScheduleMode: bridge.educationScheduleMode,
    educationScheduleLines: bridge.educationScheduleLines,
    maxScheduleCount: bridge.maxScheduleCount,
    maxSessionsPerDay: bridge.maxSessionsPerDay,
    sessionsPerRound: bridge.sessionsPerRound,
    educationRoundCount: bridge.educationRoundCount,
    curriculumChartSessionCount: bridge.curriculumChartSessionCount,
  })
}

export function shouldUseInstitutionPreferredScheduleCardCopy(
  bridge: InstitutionApplicationProgramBridge
): boolean {
  return shouldShowInstitutionApplicationPreferredScheduleParagraph(bridge)
}

/** 날짜 지정 고정 일정 — 카드 설명 슬롯에 안내 문구, 본문은 체크박스만 */
export function shouldUseInstitutionFixedScheduleCardCopy(
  bridge: InstitutionApplicationProgramBridge
): boolean {
  if (!shouldShowInstitutionApplicationScheduleParagraph(bridge)) return false
  return !shouldShowInstitutionApplicationPreferredScheduleParagraph(bridge)
}

/** 커리큘럼 복수+기간 — 모집 미입력이면 시안처럼 추가 가능(상한 10), 기본 노출은 2지망 */
export function resolveInstitutionPreferredScheduleMaxBlocks(
  bridge: InstitutionApplicationProgramBridge
): number {
  const fallback = shouldShowInstitutionApplicationPreferredScheduleParagraph(bridge)
    ? 10
    : undefined
  return clampInstitutionScheduleBlockCount(bridge.maxScheduleCount ?? fallback)
}

export function resolveInstitutionPreferredScheduleInitialBlockCount(
  bridge: InstitutionApplicationProgramBridge
): number {
  if (!shouldShowInstitutionApplicationMaxSessionsPerDayField(bridge)) return 1
  return Math.min(2, resolveInstitutionPreferredScheduleMaxBlocks(bridge))
}
