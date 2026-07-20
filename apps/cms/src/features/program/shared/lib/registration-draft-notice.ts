/**
 * 프로그램 등록 임시저장 이력 안내 — draft 존재 판별·제목 추출
 * (일반 / 1사1교 / 교육받은 교사 / UJAT 공통)
 */

import {
  loadWritingFormTemplateSave,
  removeWritingFormTemplateSave,
  type WritingFormTemplateSaveRecord,
} from '@/features/template/lib/writing-form-template-local-save'
import {
  PROGRAM_REGISTRATION_ECONOMY_TEMPLATE_CODE,
  PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE,
} from '@/features/template/lib/program-registration-editor-state'
import {
  loadUjatRegistrationTemplateSave,
  removeUjatRegistrationTemplateSave,
} from '@/features/program/ujat/lib/ujat-registration-template-local-save'

export {
  PROGRAM_REGISTRATION_ECONOMY_TEMPLATE_CODE,
  PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE,
} from '@/features/template/lib/program-registration-editor-state'

/** `/programs/*?registrationDraft=fresh` — 임시저장 무시하고 시드로 시작 */
export const REGISTRATION_DRAFT_MODE_QUERY_KEY = 'registrationDraft' as const
export const REGISTRATION_DRAFT_MODE_FRESH = 'fresh' as const

export const PROGRAM_REGISTRATION_UJAT_TEMPLATE_CODE = 'registration-ujat' as const
export const PROGRAM_REGISTRATION_TRAINED_TEACHERS_TEMPLATE_CODE =
  'registration-trained-teachers' as const

export type ProgramRegistrationDraftTemplateCode =
  | typeof PROGRAM_REGISTRATION_GENERAL_TEMPLATE_CODE
  | typeof PROGRAM_REGISTRATION_ECONOMY_TEMPLATE_CODE
  | typeof PROGRAM_REGISTRATION_TRAINED_TEACHERS_TEMPLATE_CODE
  | typeof PROGRAM_REGISTRATION_UJAT_TEMPLATE_CODE

export type RegistrationDraftNoticeInfo = {
  templateCode: ProgramRegistrationDraftTemplateCode
  /** 모달 박스에 `[제목]` 형태로 노출 */
  title: string
  savedAt: string
}

const FALLBACK_TITLE = '제목 없음'

function hasUserDraftPayload(record: WritingFormTemplateSaveRecord): boolean {
  if (record.editorState != null) return true
  if (record.overlay != null && Object.keys(record.overlay).length > 0) return true
  return false
}

function titleFromOverlay(overlay: Record<string, unknown> | undefined): string | null {
  if (overlay == null) return null
  const raw = overlay['ujat.basicInfo.programManagementName']
  if (typeof raw === 'string' && raw.trim()) return raw.trim()
  return null
}

function titleFromEditorState(editorState: Record<string, unknown> | undefined): string | null {
  if (editorState == null) return null
  for (const key of ['programTitleKo', 'title', 'programTitle'] as const) {
    const raw = editorState[key]
    if (typeof raw === 'string' && raw.trim()) return raw.trim()
  }
  return null
}

function resolveDraftTitle(record: WritingFormTemplateSaveRecord): string {
  return (
    titleFromOverlay(record.overlay) ?? titleFromEditorState(record.editorState) ?? FALLBACK_TITLE
  )
}

export type WritingFormDraftOverwriteInfo = {
  templateId: string
  title: string
  savedAt: string
}

/**
 * 「임시저장」 시 덮어쓰기 확인용 — templateId에 사용자 작성 draft가 있으면 정보 반환.
 * 제목이 없으면 `titleFallbackTemplateIds`에서 제목을 보완한다.
 */
export function peekWritingFormDraftOverwrite(
  templateId: string,
  options?: { titleFallbackTemplateIds?: readonly string[] }
): WritingFormDraftOverwriteInfo | null {
  const saved = loadWritingFormTemplateSave(templateId)
  if (saved == null || !hasUserDraftPayload(saved)) return null

  let title = resolveDraftTitle(saved)
  if (title === FALLBACK_TITLE && options?.titleFallbackTemplateIds) {
    for (const fallbackId of options.titleFallbackTemplateIds) {
      if (fallbackId === templateId) continue
      const fallback = loadWritingFormTemplateSave(fallbackId)
      if (fallback == null || !hasUserDraftPayload(fallback)) continue
      const fallbackTitle = resolveDraftTitle(fallback)
      if (fallbackTitle !== FALLBACK_TITLE) {
        title = fallbackTitle
        break
      }
    }
  }

  return { templateId, title, savedAt: saved.savedAt }
}

/**
 * 등록 중 「임시저장」으로 남은 writing-form draft가 있으면 안내 정보 반환.
 * 시드만 localStorage에 캐시된 경우(editorState·overlay 없음)는 null.
 */
export function peekRegistrationDraftNotice(
  templateCode: ProgramRegistrationDraftTemplateCode
): RegistrationDraftNoticeInfo | null {
  const saved = loadWritingFormTemplateSave(templateCode)
  if (saved != null && hasUserDraftPayload(saved)) {
    return {
      templateCode,
      title: resolveDraftTitle(saved),
      savedAt: saved.savedAt,
    }
  }

  if (templateCode === PROGRAM_REGISTRATION_UJAT_TEMPLATE_CODE) {
    const legacy = loadUjatRegistrationTemplateSave()
    if (legacy != null) {
      return {
        templateCode,
        title: titleFromOverlay(legacy.overlay) ?? FALLBACK_TITLE,
        savedAt: new Date().toISOString(),
      }
    }
  }

  return null
}

/** 신규 등록 선택 시 — 로컬 임시저장본 제거 (원격은 다음 임시저장 시 덮어씀) */
export function clearRegistrationDraftForFreshStart(
  templateCode: ProgramRegistrationDraftTemplateCode
): void {
  removeWritingFormTemplateSave(templateCode)
  if (templateCode === PROGRAM_REGISTRATION_UJAT_TEMPLATE_CODE) {
    removeUjatRegistrationTemplateSave()
  }
}
