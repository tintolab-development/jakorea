import type { ParagraphBodyInteractionMode } from '@/features/template/ui/paragraph/renderers/paragraph-body-interaction-mode'

/** 강사·봉사 신청 일정 단락 — 템플릿 플레이스홀더 vs 프로그램 연동 슬롯 UI */
export function resolveProgramApplicationFormScheduleIsTemplateAuthoringMode(params: {
  paragraphInteractionMode: ParagraphBodyInteractionMode
  programLinkedPreview?: boolean
  registrationWizardApplicationSchedulePlaceholder?: boolean
}): boolean {
  if (params.registrationWizardApplicationSchedulePlaceholder === true) return true
  return (
    params.paragraphInteractionMode === 'authoring' && params.programLinkedPreview !== true
  )
}
