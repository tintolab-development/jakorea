import type { OperationalFormFlushOverride } from '@/features/program/general/lib/prepare-registration-create-form-bindings'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'

/**
 * 등록 위저드에서 탭을 떠난 신청 양식 draft.
 * 모집 양식은 overlay 스토어가 탭과 무관하게 남지만, 신청 단락 수정은 편집기 draft에만 있다.
 * 등록 완료 시 활성 탭이 아니어도 이 맵의 draft를 formBindings PUT에 넣는다.
 */
type RegistrationWizardSessionDraft = {
  templateCode: string
  draft: WritingFormDraft
  editorState?: Record<string, unknown>
}

const sessionDrafts = new Map<string, RegistrationWizardSessionDraft>()

const applicationDraftListeners = new Set<
  (templateCode: string, draft: WritingFormDraft) => void
>()

export function rememberRegistrationWizardSessionDraft(
  entry: RegistrationWizardSessionDraft
): void {
  if (!entry.templateCode.startsWith('application-')) return
  if (entry.draft.paragraphs.length === 0) return
  sessionDrafts.set(entry.templateCode, {
    templateCode: entry.templateCode,
    draft: entry.draft,
    editorState: entry.editorState,
  })
}

/** 개발용 자동입력이 신청 draft를 넣었을 때, 열려 있는 신청 편집기에 알린다. */
export function publishRegistrationWizardApplicationDraft(
  entry: RegistrationWizardSessionDraft
): void {
  rememberRegistrationWizardSessionDraft(entry)
  const stored = sessionDrafts.get(entry.templateCode)
  if (stored == null) return
  for (const listener of applicationDraftListeners) {
    listener(stored.templateCode, stored.draft)
  }
}

export function subscribeRegistrationWizardApplicationDraft(
  listener: (templateCode: string, draft: WritingFormDraft) => void
): () => void {
  applicationDraftListeners.add(listener)
  return () => {
    applicationDraftListeners.delete(listener)
  }
}

export function clearRegistrationWizardSessionDrafts(): void {
  sessionDrafts.clear()
}

export function peekRegistrationWizardSessionDrafts(): ReadonlyArray<{
  templateCode: string
  draft: WritingFormDraft
}> {
  return [...sessionDrafts.values()].map(entry => ({
    templateCode: entry.templateCode,
    draft: entry.draft,
  }))
}

export function flushApplicationOperationalOverrides(args: {
  current?: RegistrationWizardSessionDraft
  overlayForTemplateCode?: (
    templateCode: string
  ) => Record<string, unknown> | null | undefined
}): OperationalFormFlushOverride[] {
  if (args.current != null) {
    rememberRegistrationWizardSessionDraft(args.current)
  }

  return [...sessionDrafts.values()].map(entry => {
    const overlay = args.overlayForTemplateCode?.(entry.templateCode)
    const hasOverlay = overlay != null && Object.keys(overlay).length > 0
    return {
      templateCode: entry.templateCode,
      draft: entry.draft,
      ...(hasOverlay ? { overlay } : {}),
      ...(entry.editorState != null ? { editorState: entry.editorState } : {}),
    }
  })
}
