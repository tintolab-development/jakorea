import { clearAllRecruitDetailDraftMedia } from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-draft-media-session'
import type { OperationalFormFlushOverride } from '@/features/program/general/lib/prepare-registration-create-form-bindings'
import { isRecruitmentOrApplicationWritingTemplateCode } from '@/features/template/lib/form-template-delete-policy'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { stripUjatApplicationVolunteerProgramOnlyFields } from '@/features/template/ui/form-set/application-form/UJAT-volunteer/ujat-application-volunteer-overlay-keys'

/**
 * 등록 위저드에서 탭을 떠난 모집·신청 양식 draft.
 * overlay(기간·상세 등)는 공유 스토어에 두지만, 단락 타이틀·설명은 편집기 draft에만 있다.
 * 등록 완료 시 활성 탭이 아니어도 이 맵의 draft를 formBindings PUT에 넣는다.
 */
type RegistrationWizardSessionDraft = {
  templateCode: string
  draft: WritingFormDraft
  editorState?: Record<string, unknown>
  overlay?: Record<string, unknown>
}

const sessionDrafts = new Map<string, RegistrationWizardSessionDraft>()

const applicationDraftListeners = new Set<
  (
    templateCode: string,
    draft: WritingFormDraft,
    editorState?: Record<string, unknown>,
    overlay?: Record<string, unknown>
  ) => void
>()

export function rememberRegistrationWizardSessionDraft(
  entry: RegistrationWizardSessionDraft
): void {
  if (!isRecruitmentOrApplicationWritingTemplateCode(entry.templateCode)) return
  if (entry.draft.paragraphs.length === 0) return
  sessionDrafts.set(entry.templateCode, {
    templateCode: entry.templateCode,
    draft: entry.draft,
    editorState: entry.editorState,
    overlay: entry.overlay,
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
    listener(stored.templateCode, stored.draft, stored.editorState, stored.overlay)
  }
}

export function subscribeRegistrationWizardApplicationDraft(
  listener: (
    templateCode: string,
    draft: WritingFormDraft,
    editorState?: Record<string, unknown>,
    overlay?: Record<string, unknown>
  ) => void
): () => void {
  applicationDraftListeners.add(listener)
  return () => {
    applicationDraftListeners.delete(listener)
  }
}

export function clearRegistrationWizardSessionDrafts(): void {
  sessionDrafts.clear()
  clearAllRecruitDetailDraftMedia()
}

export function peekRegistrationWizardSessionDrafts(): ReadonlyArray<{
  templateCode: string
  draft: WritingFormDraft
  editorState?: Record<string, unknown>
  overlay?: Record<string, unknown>
}> {
  return [...sessionDrafts.values()].map(entry => ({
    templateCode: entry.templateCode,
    draft: entry.draft,
    ...(entry.editorState != null ? { editorState: entry.editorState } : {}),
    ...(entry.overlay != null
      ? {
          overlay:
            entry.templateCode === 'application-ujat-volunteer'
              ? stripUjatApplicationVolunteerProgramOnlyFields(entry.overlay)
              : entry.overlay,
        }
      : {}),
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
    const rawOverlay = args.overlayForTemplateCode?.(entry.templateCode) ?? entry.overlay
    const overlay =
      rawOverlay != null && entry.templateCode === 'application-ujat-volunteer'
        ? stripUjatApplicationVolunteerProgramOnlyFields(rawOverlay)
        : rawOverlay
    const hasOverlay = overlay != null && Object.keys(overlay).length > 0
    return {
      templateCode: entry.templateCode,
      draft: entry.draft,
      ...(hasOverlay ? { overlay } : {}),
      ...(entry.editorState != null ? { editorState: entry.editorState } : {}),
    }
  })
}
