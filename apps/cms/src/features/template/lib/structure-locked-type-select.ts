import type { ParagraphKindSelectValue } from '@/features/template/model/writing-form/paragraph-selectors'
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@/features/template/model/program-application-form-instructor-draft'

/**
 * 시드 잠금 단락 — 우측 「단락 유형」표시용 kind 오버라이드.
 * (스키마는 placeholder 가로표여도 UI상 단일항목으로 노출하는 경우 등)
 */
export const STRUCTURE_LOCKED_DISPLAY_KIND_BY_PARAGRAPH_ID: ReadonlyMap<
  string,
  ParagraphKindSelectValue
> = new Map([
  [PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.personalInfoCollection, 'table'],
  [PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.thirdPartyConsent, 'table'],
  [PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.crimeRecord, 'table'],
  [PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule, 'single_item'],
])

export function resolveStructureLockedDisplayKind(
  paragraphId: string,
  fallback: ParagraphKindSelectValue
): ParagraphKindSelectValue {
  return STRUCTURE_LOCKED_DISPLAY_KIND_BY_PARAGRAPH_ID.get(paragraphId) ?? fallback
}
