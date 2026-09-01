import { useMemo } from 'react'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import { isAgreementLockedSystemParagraph, writingOutlineLabel } from '@/features/template/model/writing-form-draft.schema'
import { paragraphKindLabel } from '@/features/template/model/writing-form/paragraph-labels'
import { paragraphVariantLabel } from '@/features/template/ui/form-editor/right-panel/config/paragraph-editor.registry'
import {
  paragraphDetailSelectValue,
  paragraphKindSelectValue,
} from '@/features/template/model/writing-form/paragraph-selectors'

export function useActiveParagraphState({
  draft,
  activeParagraphId,
  structureLockedParagraphIds,
}: {
  draft: WritingFormDraft
  activeParagraphId: string | null
  structureLockedParagraphIds?: ReadonlySet<string>
}) {
  return useMemo(() => {
    const active = draft.paragraphs.find(p => p.id === activeParagraphId) ?? null
    const structureLockedActive =
      activeParagraphId != null && (structureLockedParagraphIds?.has(activeParagraphId) ?? false)

    const outline =
      active && active.kind === 'description' && active.variant === 'closing'
        ? `${paragraphKindLabel(active)}_${paragraphVariantLabel(active)}`
        : active
          ? writingOutlineLabel(active)
          : ''

    const activeKindValue = active ? paragraphKindSelectValue(active) : null
    const activeDetailValue = active ? paragraphDetailSelectValue(active) : null
    const activeKindLocked = active ? isAgreementLockedSystemParagraph(active) : false

    return {
      active,
      structureLockedActive,
      outline,
      activeKindValue,
      activeDetailValue,
      activeKindLocked,
    }
  }, [activeParagraphId, draft, structureLockedParagraphIds])
}
