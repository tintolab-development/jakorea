import type { WritingFormDraft, WritingFormParagraph } from '@jakorea/form-schema/writing-form'

/** 문항 ID가 같고 kind/variant가 같은 값만 최신 schema로 복원한다. */
export function restoreCompatibleConsentDraftValues(
  previous: WritingFormDraft,
  next: WritingFormDraft,
): WritingFormDraft {
  const previousById = new Map(previous.paragraphs.map(paragraph => [paragraph.id, paragraph]))
  return {
    ...next,
    paragraphs: next.paragraphs.map(paragraph => {
      const previousParagraph = previousById.get(paragraph.id)
      if (
        previousParagraph == null ||
        previousParagraph.kind !== paragraph.kind ||
        previousParagraph.variant !== paragraph.variant
      ) {
        return paragraph
      }
      return {
        ...paragraph,
        ...previousParagraph,
        id: paragraph.id,
        kind: paragraph.kind,
        variant: paragraph.variant,
        paragraphTitle: paragraph.paragraphTitle,
        paragraphDescription: paragraph.paragraphDescription,
      } as WritingFormParagraph
    }),
  }
}
