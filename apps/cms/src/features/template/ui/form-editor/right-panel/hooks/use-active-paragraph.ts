import { useMemo } from 'react'
import type {
  WritingFormDraft,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
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
  activeParagraph: activeParagraphProp,
  structureLockedParagraphIds,
}: {
  draft: WritingFormDraft
  activeParagraphId: string | null
  /** 지정 시 draft.paragraphs 전체 스캔 대신 활성 단락만 구독 */
  activeParagraph?: WritingFormParagraph | null
  structureLockedParagraphIds?: ReadonlySet<string>
}) {
  const draftActiveParagraph =
    activeParagraphProp === undefined
      ? draft.paragraphs.find(paragraph => paragraph.id === activeParagraphId) ?? null
      : null

  return useMemo(() => {
    const active =
      activeParagraphProp !== undefined ? activeParagraphProp : draftActiveParagraph
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
  }, [activeParagraphId, activeParagraphProp, structureLockedParagraphIds, draftActiveParagraph])
}
