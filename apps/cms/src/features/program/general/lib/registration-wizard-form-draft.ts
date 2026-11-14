import type { WritingFormTemplateSaveRecord } from '@/features/template/lib/writing-form-template-local-save'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { normalizeWritingFormDraftFromApi } from '@/features/template/lib/form-template-seed-registry'
import {
  captureWritingFormTemplateSavesByPrefix,
  loadWritingFormTemplateDraft,
  persistWritingFormTemplateDraft,
  removeWritingFormTemplateSave,
  removeWritingFormTemplateSavesByPrefix,
  restoreWritingFormTemplateSavesByPrefix,
} from '@/features/template/lib/writing-form-template-local-save'

const REGISTRATION_WIZARD_LOCAL_PREFIX = 'registration-wizard:' as const

function localStorageKey(programType: string, templateCode: string): string {
  return `${REGISTRATION_WIZARD_LOCAL_PREFIX}${programType}:${templateCode}`
}

/**
 * 신청서 임시저장본 보정 — 오래된 localStorage 초안(구 보유기간 문구 등)에 템플릿별 migrate를 적용한다.
 * 등록 후 양식 적용·다시 적용·편집기 미리보기가 같은 보정본을 읽는다. 모집·등록 양식은 그대로 둔다.
 */
function migrateApplicationWizardSave(
  templateCode: string,
  saved: WritingFormTemplateSaveRecord | null
): WritingFormTemplateSaveRecord | null {
  if (saved?.draft == null || saved.draft.paragraphs.length === 0) return saved
  if (!templateCode.startsWith('application-')) return saved
  const migrated = normalizeWritingFormDraftFromApi(templateCode, saved.draft)
  return migrated === saved.draft ? saved : { ...saved, draft: migrated }
}

export async function loadRegistrationWizardFormDraft(args: {
  programType: string
  templateCode: string
}): Promise<WritingFormTemplateSaveRecord | null> {
  const saved = await loadWritingFormTemplateDraft(localStorageKey(args.programType, args.templateCode), {
    localOnly: true,
  })
  return migrateApplicationWizardSave(args.templateCode, saved)
}

export async function persistRegistrationWizardFormDraft(args: {
  programType: string
  templateCode: string
  draft: WritingFormDraft
  overlay?: Record<string, unknown>
  editorState?: Record<string, unknown>
  settingsJson?: Record<string, unknown>
}): Promise<void> {
  await persistWritingFormTemplateDraft({
    templateId: localStorageKey(args.programType, args.templateCode),
    draft: args.draft,
    overlay: args.overlay,
    editorState: args.editorState,
    settingsJson: args.settingsJson,
    localOnly: true,
  })
}

export function clearRegistrationWizardFormDraft(args: {
  programType: string
  templateCode: string
}): void {
  removeWritingFormTemplateSave(localStorageKey(args.programType, args.templateCode))
}

export function clearRegistrationWizardFormDrafts(programType: string): void {
  removeWritingFormTemplateSavesByPrefix(
    `${REGISTRATION_WIZARD_LOCAL_PREFIX}${programType}:`
  )
}

export function registrationWizardFormDraftPrefix(programType: string): string {
  return `${REGISTRATION_WIZARD_LOCAL_PREFIX}${programType}:`
}

export function captureRegistrationWizardFormDraftSnapshot(
  programType: string
): Record<string, WritingFormTemplateSaveRecord> {
  return captureWritingFormTemplateSavesByPrefix(registrationWizardFormDraftPrefix(programType))
}

export function restoreRegistrationWizardFormDraftSnapshot(
  programType: string,
  snapshot: Record<string, WritingFormTemplateSaveRecord>
): void {
  restoreWritingFormTemplateSavesByPrefix(
    registrationWizardFormDraftPrefix(programType),
    snapshot
  )
}
