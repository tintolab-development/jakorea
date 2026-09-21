import type { WritingFormTemplateSaveRecord } from '@/features/template/lib/writing-form-template-local-save'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { assertRegistrationWizardRemoteReady } from '@/features/program/general/lib/registration-create-form-bindings-capabilities'
import {
  loadDraftOwnedFormVersionRecord,
  persistDraftOwnedFormVersion,
  type DraftOwnedFormVersion,
} from '@/features/program/general/lib/registration-draft-form-versions'
import {
  peekRegistrationProgramDraftId,
  ensureRegistrationProgramDraftId,
} from '@/features/program/general/lib/registration-program-draft-session'

async function resolveProgramDraftId(programType: string): Promise<number> {
  return peekRegistrationProgramDraftId(programType) ?? ensureRegistrationProgramDraftId(programType)
}

export async function loadRegistrationWizardFormDraft(args: {
  programType: string
  templateCode: string
}): Promise<WritingFormTemplateSaveRecord | null> {
  assertRegistrationWizardRemoteReady()
  const programDraftId = await resolveProgramDraftId(args.programType)
  return loadDraftOwnedFormVersionRecord({ programDraftId, templateCode: args.templateCode })
}

export async function persistRegistrationWizardFormDraft(args: {
  programType: string
  templateCode: string
  draft: WritingFormDraft
  overlay?: Record<string, unknown>
  editorState?: Record<string, unknown>
  settingsJson?: Record<string, unknown>
}): Promise<DraftOwnedFormVersion> {
  assertRegistrationWizardRemoteReady()
  const programDraftId = await resolveProgramDraftId(args.programType)
  return persistDraftOwnedFormVersion({
    programDraftId,
    templateCode: args.templateCode,
    draft: args.draft,
    overlay: args.overlay,
    editorState: args.editorState,
    settingsJson: args.settingsJson,
  })
}
