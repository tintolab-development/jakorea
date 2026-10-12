import type { WritingFormDraft, WritingFormParagraph } from '@jakorea/form-schema/writing-form'

export function filterPreviewParagraphs(
  paragraphs: WritingFormParagraph[],
  hiddenIds: ReadonlySet<string>,
): WritingFormParagraph[] {
  return paragraphs.filter(paragraph => !hiddenIds.has(paragraph.id))
}

/** CMS `pageBreakBeforeParagraphIds` — 해당 단락 직전에서 새 페이지 */
export function splitParagraphsIntoPages(
  paragraphs: WritingFormParagraph[],
  pageBreakBeforeParagraphIds: ReadonlySet<string>,
): WritingFormParagraph[][] {
  if (paragraphs.length === 0) return [[]]

  const pages: WritingFormParagraph[][] = []
  let current: WritingFormParagraph[] = []

  for (const paragraph of paragraphs) {
    if (pageBreakBeforeParagraphIds.has(paragraph.id) && current.length > 0) {
      pages.push(current)
      current = []
    }
    current.push(paragraph)
  }

  if (current.length > 0) {
    pages.push(current)
  }

  return pages.length > 0 ? pages : [[]]
}

export function sliceDraftForParagraphs(
  draft: WritingFormDraft,
  paragraphs: WritingFormParagraph[],
): WritingFormDraft {
  return { ...draft, paragraphs }
}
