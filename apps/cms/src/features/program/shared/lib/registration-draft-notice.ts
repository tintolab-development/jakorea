/**
 * 프로그램 등록 임시저장 이력 안내 — **브라우저 localStorage**.
 * (일반 / 1사1교 / 교육받은 교사 / UJAT 공통)
 *
 * 등록 완료 시 form-bindings용 program-draft API와는 분리한다.
 */

import {
  PROGRAM_REGISTRATION_ECONOMY_TEMPLATE_CODE,
  PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE,
} from '@/features/template/lib/program-registration-editor-state'
import {
  loadWritingFormTemplateSave,
  removeWritingFormTemplateSave,
  type WritingFormTemplateSaveRecord,
} from '@/features/program/shared/lib/program-draft-local-save'
import { listRegistrationOperationalFormDraftStorageKeys } from '@/features/program/general/lib/registration-operational-form-drafts'
import { deleteRegistrationProgramDraftRemote } from '@/features/program/general/lib/registration-program-draft-session'
import type { ProgramRegistrationFormVariant } from '@/features/template/model/program-registration-draft'

export {
  PROGRAM_REGISTRATION_ECONOMY_TEMPLATE_CODE,
  PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE,
} from '@/features/template/lib/program-registration-editor-state'

/** `/programs/*?registrationDraft=fresh` — 임시저장 무시하고 시드로 시작 */
export const REGISTRATION_DRAFT_MODE_QUERY_KEY = 'registrationDraft' as const
export const REGISTRATION_DRAFT_MODE_FRESH = 'fresh' as const
/** 안내 팝업에서 「이어서 작성」을 명시적으로 선택한 경우에만 복원 */
export const REGISTRATION_DRAFT_MODE_CONTINUE = 'continue' as const

/** 팝업 없이 진입한 경우를 포함해, 명시적 continue가 아니면 저장본을 복원하지 않는다. */
export function shouldSkipRegistrationDraftRestore(mode: string | null): boolean {
  return mode !== REGISTRATION_DRAFT_MODE_CONTINUE
}

/** 이어서 작성한 저장본은 제출 성공 후에만 삭제한다. */
export function shouldRemoveRegistrationDraftAfterCompletion(mode: string | null): boolean {
  return mode === REGISTRATION_DRAFT_MODE_CONTINUE
}

export const PROGRAM_REGISTRATION_UJAT_TEMPLATE_CODE = 'registration-ujat' as const
export const PROGRAM_REGISTRATION_TRAINED_TEACHERS_TEMPLATE_CODE =
  'registration-trained-teachers' as const

export type ProgramRegistrationDraftTemplateCode =
  | typeof PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE
  | typeof PROGRAM_REGISTRATION_ECONOMY_TEMPLATE_CODE
  | typeof PROGRAM_REGISTRATION_TRAINED_TEACHERS_TEMPLATE_CODE
  | typeof PROGRAM_REGISTRATION_UJAT_TEMPLATE_CODE

export type RegistrationProgramTypeKey = 'GENERAL' | 'COMPANY_SCHOOL' | 'TRAINED_TEACHER' | 'UJAT'

export type RegistrationDraftNoticeInfo = {
  templateCode: ProgramRegistrationDraftTemplateCode
  /** 모달 박스에 `[제목]` 형태로 노출 */
  title: string
  savedAt: string
}

const FALLBACK_TITLE = '제목 없음'

const LOCAL_TITLE_OVERLAY_KEYS = [
  'trainedTeachersRegistration.basicInfo.programTitleKo',
  'generalRegistration.basicInfo.localProgramTitleKo',
  'generalRegistration.basicInfo.programTitleKo',
] as const

export function registrationProgramTypeForTemplateCode(
  templateCode: ProgramRegistrationDraftTemplateCode
): RegistrationProgramTypeKey {
  if (templateCode === PROGRAM_REGISTRATION_UJAT_TEMPLATE_CODE) return 'UJAT'
  if (templateCode === PROGRAM_REGISTRATION_ECONOMY_TEMPLATE_CODE) return 'COMPANY_SCHOOL'
  if (templateCode === PROGRAM_REGISTRATION_TRAINED_TEACHERS_TEMPLATE_CODE) return 'TRAINED_TEACHER'
  return 'GENERAL'
}

function variantForTemplateCode(
  templateCode: ProgramRegistrationDraftTemplateCode
): ProgramRegistrationFormVariant | null {
  if (templateCode === PROGRAM_REGISTRATION_UJAT_TEMPLATE_CODE) return null
  if (templateCode === PROGRAM_REGISTRATION_ECONOMY_TEMPLATE_CODE) return 'economy'
  if (templateCode === PROGRAM_REGISTRATION_TRAINED_TEACHERS_TEMPLATE_CODE) {
    return 'trainedTeachers'
  }
  return 'general'
}

function titleFromLocalDraftRecord(record: WritingFormTemplateSaveRecord): string {
  const fromEditor = record.editorState?.programTitleKo
  if (typeof fromEditor === 'string' && fromEditor.trim() !== '') return fromEditor.trim()
  const overlay = record.overlay ?? {}
  for (const key of LOCAL_TITLE_OVERLAY_KEYS) {
    const value = overlay[key]
    if (typeof value === 'string' && value.trim() !== '') return value.trim()
  }
  return FALLBACK_TITLE
}

function noticeFromLocalSave(
  templateCode: ProgramRegistrationDraftTemplateCode,
  record: WritingFormTemplateSaveRecord
): RegistrationDraftNoticeInfo {
  return {
    templateCode,
    title: titleFromLocalDraftRecord(record),
    savedAt: record.savedAt,
  }
}

/** 등록 중 localStorage 임시저장이 있으면 안내 정보 반환 */
export async function fetchRegistrationDraftNotice(
  templateCode: ProgramRegistrationDraftTemplateCode
): Promise<RegistrationDraftNoticeInfo | null> {
  return peekRegistrationDraftNotice(templateCode)
}

export function peekRegistrationDraftNotice(
  templateCode: ProgramRegistrationDraftTemplateCode
): RegistrationDraftNoticeInfo | null {
  const record = loadWritingFormTemplateSave(templateCode)
  if (record == null) return null
  return noticeFromLocalSave(templateCode, record)
}

export type WritingFormDraftOverwriteInfo = {
  templateId: string
  title: string
  savedAt: string
}

/** 이어서 작성본 등록 완료 후 — local 임시저장 삭제 (+ 잔여 remote draft 정리) */
export async function clearRegistrationDraftForFreshStart(
  templateCode: ProgramRegistrationDraftTemplateCode
): Promise<void> {
  removeWritingFormTemplateSave(templateCode)
  const variant = variantForTemplateCode(templateCode)
  if (variant != null) {
    for (const key of listRegistrationOperationalFormDraftStorageKeys(variant)) {
      removeWritingFormTemplateSave(key)
    }
  }
  const programType = registrationProgramTypeForTemplateCode(templateCode)
  await deleteRegistrationProgramDraftRemote(programType)
}
