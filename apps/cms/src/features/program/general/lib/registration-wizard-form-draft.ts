import type { WritingFormTemplateSaveRecord } from '@/features/template/lib/writing-form-template-local-save'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import {
  loadWritingFormTemplateDraft,
  persistWritingFormTemplateDraft,
  removeWritingFormTemplateSave,
  removeWritingFormTemplateSavesByPrefix,
} from '@/features/template/lib/writing-form-template-local-save'

const REGISTRATION_WIZARD_LOCAL_PREFIX = 'registration-wizard:' as const

function localStorageKey(programType: string, templateCode: string): string {
  return `${REGISTRATION_WIZARD_LOCAL_PREFIX}${programType}:${templateCode}`
}

export async function loadRegistrationWizardFormDraft(args: {
  programType: string
  templateCode: string
}): Promise<WritingFormTemplateSaveRecord | null> {
  return loadWritingFormTemplateDraft(localStorageKey(args.programType, args.templateCode), {
    localOnly: true,
  })
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
