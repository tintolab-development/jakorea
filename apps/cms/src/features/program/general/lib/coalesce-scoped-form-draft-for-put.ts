import type { WritingFormDraft, WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'
import { normalizeWritingFormDraft } from '@/features/template/model/writing-form-draft.schema'

function paragraphMap(paragraphs: readonly WritingFormParagraph[]): Map<string, WritingFormParagraph> {
  return new Map(paragraphs.map(p => [p.id, p]))
}

/**
 * program-scoped copy PUT — baseline(서버 copy GET) 위에 user draft를 merge.
 * protected seed paragraph id·variant·kind는 baseline 유지, 카피성 필드만 user 반영.
 */
export function coalesceScopedFormDraftForPut(
  baseline: WritingFormDraft,
  userDraft: WritingFormDraft
): WritingFormDraft {
  const baseById = paragraphMap(baseline.paragraphs)
  const userById = paragraphMap(userDraft.paragraphs)

  const mergedParagraphs: WritingFormParagraph[] = baseline.paragraphs.map(baseParagraph => {
    const userParagraph = userById.get(baseParagraph.id)
    if (userParagraph == null) return baseParagraph
    if (baseParagraph.kind !== userParagraph.kind || baseParagraph.variant !== userParagraph.variant) {
      return baseParagraph
    }
    return {
      ...baseParagraph,
      ...userParagraph,
      id: baseParagraph.id,
      kind: baseParagraph.kind,
      variant: baseParagraph.variant,
    } as WritingFormParagraph
  })

  for (const userParagraph of userDraft.paragraphs) {
    if (baseById.has(userParagraph.id)) continue
    mergedParagraphs.push(userParagraph)
  }

  return normalizeWritingFormDraft({
    ...baseline,
    formSettings: {
      ...baseline.formSettings,
      ...userDraft.formSettings,
    },
    paragraphs: mergedParagraphs,
  })
}
