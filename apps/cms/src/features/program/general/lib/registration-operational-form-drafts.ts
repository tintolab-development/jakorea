/**
 * 등록 위저드 모집/신청 양식 localStorage 초안 — 프로그램 유형(variant)별로 격리.
 * 「이어서 작성」이 아니면 해당 유형의 모집/신청 초안만 시드로 리셋한다.
 */

import { GENERAL_PROGRAM_REGISTRATION_STEPS } from '@/features/program/general/model/registration-flow'
import { removeWritingFormTemplateSave } from '@/features/template/lib/writing-form-template-local-save'
import type { ProgramRegistrationFormVariant } from '@/features/template/model/program-registration-draft'

/** 1사1교 전용 카탈로그 id (일반 모집/신청 id와 분리) */
const ECONOMY_OWNED_OPERATIONAL_TEMPLATE_IDS = [
  'recruitment-economy',
  'application-economy',
] as const

/** 교육받은 교사 전용 카탈로그 id */
const TRAINED_TEACHERS_OWNED_OPERATIONAL_TEMPLATE_IDS = [
  'application-trained-teachers',
] as const

/**
 * 1사1교 위저드가 기관 외 탭에서 쓰는 공유 카탈로그 id.
 * 일반과 키가 겹치지 않도록 `reg-draft:economy:` 접두로 저장한다.
 */
const ECONOMY_SHARED_OPERATIONAL_TEMPLATE_IDS = [
  'recruitment-participant-individual',
  'recruitment-instructor',
  'application-participant-individual',
  'application-instructor',
] as const

const REG_DRAFT_PREFIX = 'reg-draft:' as const

export function resolveRegistrationOperationalDraftStorageKey(
  variant: ProgramRegistrationFormVariant,
  templateId: string
): string {
  if (templateId.startsWith('registration-')) return templateId
  if (variant === 'general') return templateId
  if (variant === 'economy') {
    if ((ECONOMY_OWNED_OPERATIONAL_TEMPLATE_IDS as readonly string[]).includes(templateId)) {
      return templateId
    }
    return `${REG_DRAFT_PREFIX}economy:${templateId}`
  }
  if (variant === 'trainedTeachers') {
    if (
      (TRAINED_TEACHERS_OWNED_OPERATIONAL_TEMPLATE_IDS as readonly string[]).includes(templateId)
    ) {
      return templateId
    }
    return `${REG_DRAFT_PREFIX}trainedTeachers:${templateId}`
  }
  return templateId
}

export function listRegistrationOperationalFormDraftStorageKeys(
  variant: ProgramRegistrationFormVariant
): readonly string[] {
  if (variant === 'general') {
    return GENERAL_PROGRAM_REGISTRATION_STEPS.filter(s => s.phase !== 'program').map(
      s => s.templateId
    )
  }
  if (variant === 'economy') {
    return [
      ...ECONOMY_OWNED_OPERATIONAL_TEMPLATE_IDS,
      ...ECONOMY_SHARED_OPERATIONAL_TEMPLATE_IDS.map(id =>
        resolveRegistrationOperationalDraftStorageKey('economy', id)
      ),
    ]
  }
  if (variant === 'trainedTeachers') {
    return [...TRAINED_TEACHERS_OWNED_OPERATIONAL_TEMPLATE_IDS]
  }
  return []
}

/** 해당 유형 fresh 진입·등록 완료 시 — 그 유형의 모집/신청 임시저장본만 제거 */
export function clearRegistrationOperationalFormDrafts(
  variant: ProgramRegistrationFormVariant
): void {
  for (const storageKey of listRegistrationOperationalFormDraftStorageKeys(variant)) {
    removeWritingFormTemplateSave(storageKey)
  }
}

/** @deprecated `clearRegistrationOperationalFormDrafts('general')` 사용 */
export function clearGeneralProgramRegistrationOperationalFormDrafts(): void {
  clearRegistrationOperationalFormDrafts('general')
}

/** @deprecated `listRegistrationOperationalFormDraftStorageKeys('general')` 사용 */
export function listGeneralProgramRegistrationOperationalFormTemplateIds(): readonly string[] {
  return listRegistrationOperationalFormDraftStorageKeys('general')
}
