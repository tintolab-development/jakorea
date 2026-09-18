/**
 * UJAT 등록 위저드 모집/신청 양식 localStorage 초안.
 * 일반·1사1교 등과 키를 섞지 않는다.
 */

import { UJAT_PROGRAM_REGISTRATION_STEPS } from '@/features/program/ujat/model/ujat-program-registration-flow'
import { removeWritingFormTemplateSave } from '@/features/template/lib/writing-form-template-local-save'

export function listUjatRegistrationOperationalFormTemplateIds(): readonly string[] {
  const ids = new Set<string>()
  for (const step of UJAT_PROGRAM_REGISTRATION_STEPS) {
    if (step.phase === 'program') continue
    ids.add(step.templateId)
  }
  return [...ids]
}

/** UJAT fresh 진입·등록 완료 시 — UJAT 모집/신청 임시저장본만 제거 */
export function clearUjatRegistrationOperationalFormDrafts(): void {
  for (const templateId of listUjatRegistrationOperationalFormTemplateIds()) {
    removeWritingFormTemplateSave(templateId)
  }
}
