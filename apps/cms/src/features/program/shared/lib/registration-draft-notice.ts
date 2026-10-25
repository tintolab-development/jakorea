/**
 * 프로그램 등록 임시저장 이력 안내 — 브라우저 localStorage SSOT
 * (일반 / 1사1교 / 교육받은 교사 / UJAT 공통)
 */

import {
  PROGRAM_REGISTRATION_ECONOMY_TEMPLATE_CODE,
  PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE,
} from '@/features/template/lib/program-registration-editor-state'
import {
  clearRegistrationProgramDraftLocal,
  peekRegistrationProgramDraftPayload,
} from '@/features/program/general/lib/registration-wizard-draft-session'
import type { RegistrationProgramDraftPayloadV1 } from '@/features/program/general/lib/registration-wizard-draft-payload'

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

export function registrationProgramTypeForTemplateCode(
  templateCode: ProgramRegistrationDraftTemplateCode
): RegistrationProgramTypeKey {
  if (templateCode === PROGRAM_REGISTRATION_UJAT_TEMPLATE_CODE) return 'UJAT'
  if (templateCode === PROGRAM_REGISTRATION_ECONOMY_TEMPLATE_CODE) return 'COMPANY_SCHOOL'
  if (templateCode === PROGRAM_REGISTRATION_TRAINED_TEACHERS_TEMPLATE_CODE) return 'TRAINED_TEACHER'
  return 'GENERAL'
}

/**
 * 사용자 「임시 저장」여부.
 * - persistDraftSilent는 항상 activeStep을 넣음(공통정보 `program` 포함) → true
 */
function payloadHasUserDraft(payload: RegistrationProgramDraftPayloadV1): boolean {
  if (payload.programTitleKo?.trim()) return true
  // 공통정보에서만 저장해도 안내 팝업이 떠야 함 (`!== 'program'`이면 누락됨)
  if (payload.activeStep != null) return true
  return Object.keys(payload.formVersions).length > 0
}

function noticeFromPayload(
  templateCode: ProgramRegistrationDraftTemplateCode,
  payload: RegistrationProgramDraftPayloadV1
): RegistrationDraftNoticeInfo {
  return {
    templateCode,
    title: payload.programTitleKo?.trim() || FALLBACK_TITLE,
    savedAt: payload.savedAt,
  }
}

/**
 * 등록 중 localStorage 임시저장이 있으면 안내 정보 반환.
 */
export async function fetchRegistrationDraftNotice(
  templateCode: ProgramRegistrationDraftTemplateCode
): Promise<RegistrationDraftNoticeInfo | null> {
  const programType = registrationProgramTypeForTemplateCode(templateCode)
  const local = peekRegistrationProgramDraftPayload(programType)
  if (local == null || !payloadHasUserDraft(local)) return null
  return noticeFromPayload(templateCode, local)
}

/** @deprecated fetchRegistrationDraftNotice 사용 */
export function peekRegistrationDraftNotice(
  templateCode: ProgramRegistrationDraftTemplateCode
): RegistrationDraftNoticeInfo | null {
  const programType = registrationProgramTypeForTemplateCode(templateCode)
  const payload = peekRegistrationProgramDraftPayload(programType)
  if (payload == null || !payloadHasUserDraft(payload)) return null
  return noticeFromPayload(templateCode, payload)
}

export type WritingFormDraftOverwriteInfo = {
  templateId: string
  title: string
  savedAt: string
}

/** 저장본 삭제 — localStorage만 제거하며 서버 API를 호출하지 않는다. */
export async function clearRegistrationDraftForFreshStart(
  templateCode: ProgramRegistrationDraftTemplateCode
): Promise<void> {
  const programType = registrationProgramTypeForTemplateCode(templateCode)
  await clearRegistrationProgramDraftLocal(programType)
}
