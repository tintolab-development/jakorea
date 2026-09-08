import { UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@/features/template/model/ujat-program-application-form-volunteer-draft'
import type { UjatProgramApplicationVolunteerType } from '@/features/template/ui/form-set/application-form/UJAT-volunteer/paragraph-body'

/** 실제 지원·프로그램 연동 미리보기 — 지원 형태에 따라 숨길 단락 id */
export function resolveUjatVolunteerRuntimeHiddenParagraphIds(
  applicationType: UjatProgramApplicationVolunteerType
): Set<string> {
  if (applicationType === 'new') {
    return new Set([UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.previousTerm])
  }
  return new Set([UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.freeTextItems])
}

/**
 * 템플릿 편집(`isTemplateAuthoringMode === true`)에서는 9개 단락 모두 노출.
 * 그 외(프로그램 연동·사용자 작성)는 지원 형태별 분기.
 */
export function resolveUjatVolunteerHiddenParagraphIds(
  applicationType: UjatProgramApplicationVolunteerType,
  options?: { isTemplateAuthoringMode?: boolean }
): Set<string> | undefined {
  if (options?.isTemplateAuthoringMode === true) return undefined
  return resolveUjatVolunteerRuntimeHiddenParagraphIds(applicationType)
}
