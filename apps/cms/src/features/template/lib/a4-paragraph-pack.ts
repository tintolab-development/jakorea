import {
  A4_DOCUMENT_CONTINUATION_PAGE_BODY_MAX_PX,
  A4_DOCUMENT_FIRST_PAGE_BODY_MAX_PX,
  A4_DOCUMENT_PARAGRAPH_GAP_PX,
} from '@/features/template/lib/a4-document-pagination-constants'
import {
  isAgreementDocumentConfirmTextParagraph,
  isAgreementDocumentDateParagraph,
  isAgreementDocumentSignatureParagraph,
  type FormDocumentPreviewParagraphGapResolver,
} from '@/features/template/lib/a4-document-preview'
import type { WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'

export function resolveA4ParagraphGap(
  paragraph: WritingFormParagraph,
  pageParagraphs: WritingFormParagraph[],
  paragraphGapPx?: number | FormDocumentPreviewParagraphGapResolver
): number {
  if (pageParagraphs.length === 0) return 0
  if (typeof paragraphGapPx === 'number') return paragraphGapPx
  return (
    paragraphGapPx?.(paragraph, pageParagraphs.length, pageParagraphs) ??
    A4_DOCUMENT_PARAGRAPH_GAP_PX
  )
}

/**
 * 들어오는 날짜/서명과 함께 다음 페이지로 옮겨야 할 현재 페이지 끝 closing 단락 수.
 * - 서명: trailing `date` (+ 직전 confirm)
 * - 날짜: trailing confirm
 */
export function countTrailingAgreementClosingStackToMoveWith(
  page: WritingFormParagraph[],
  incoming: WritingFormParagraph
): number {
  if (page.length === 0) return 0

  if (isAgreementDocumentSignatureParagraph(incoming)) {
    const last = page[page.length - 1]
    if (last == null || !isAgreementDocumentDateParagraph(last)) return 0
    if (page.length >= 2) {
      const beforeDate = page[page.length - 2]
      if (
        beforeDate != null &&
        isAgreementDocumentConfirmTextParagraph(beforeDate, last)
      ) {
        return 2
      }
    }
    return 1
  }

  if (isAgreementDocumentDateParagraph(incoming)) {
    const last = page[page.length - 1]
    if (last != null && isAgreementDocumentConfirmTextParagraph(last, incoming)) {
      return 1
    }
  }

  return 0
}

function usedHeightOnPage(
  pageParagraphs: WritingFormParagraph[],
  heights: Map<string, number>,
  paragraphGapPx?: number | FormDocumentPreviewParagraphGapResolver
): number {
  let used = 0
  const acc: WritingFormParagraph[] = []
  for (const paragraph of pageParagraphs) {
    const gap = resolveA4ParagraphGap(paragraph, acc, paragraphGapPx)
    used += gap + (heights.get(paragraph.id) ?? 0)
    acc.push(paragraph)
  }
  return used
}

/**
 * 단락 높이 맵으로 A4 페이지를 나눈다.
 * 동의 closing 스택(확인 → 날짜 → 서명)은 높이 overflow 시 한 덩어리로 다음 페이지로 넘긴다.
 */
export function packParagraphsByHeights(
  allParagraphs: WritingFormParagraph[],
  heights: Map<string, number>,
  enabled: boolean,
  paragraphGapPx?: number | FormDocumentPreviewParagraphGapResolver,
  pageBreakBeforeParagraphIds?: ReadonlySet<string>
): { pages: WritingFormParagraph[][]; overflow: Set<string> } {
  if (!enabled || allParagraphs.length === 0) {
    return { pages: [allParagraphs], overflow: new Set() }
  }

  const overflow = new Set<string>()
  const out: WritingFormParagraph[][] = []
  let page: WritingFormParagraph[] = []
  let used = 0
  let isFirstPage = true

  const maxFor = () =>
    isFirstPage ? A4_DOCUMENT_FIRST_PAGE_BODY_MAX_PX : A4_DOCUMENT_CONTINUATION_PAGE_BODY_MAX_PX

  const flushPage = () => {
    if (page.length > 0) {
      out.push(page)
      page = []
      used = 0
      isFirstPage = false
    }
  }

  const appendParagraph = (paragraph: WritingFormParagraph) => {
    const gap = resolveA4ParagraphGap(paragraph, page, paragraphGapPx)
    const h = heights.get(paragraph.id) ?? 0
    page.push(paragraph)
    used += gap + h
  }

  for (const p of allParagraphs) {
    const h = heights.get(p.id) ?? 0
    const maxH = maxFor()
    if (h > maxH) {
      overflow.add(p.id)
    }

    if (pageBreakBeforeParagraphIds?.has(p.id) && page.length > 0) {
      flushPage()
    }

    let gap = resolveA4ParagraphGap(p, page, paragraphGapPx)
    if (page.length > 0 && used + gap + h > maxH) {
      const peel = countTrailingAgreementClosingStackToMoveWith(page, p)
      if (peel > 0) {
        const moved = page.splice(page.length - peel, peel)
        if (page.length > 0) {
          used = usedHeightOnPage(page, heights, paragraphGapPx)
          flushPage()
        } else {
          // closing prefix만 있던 경우 빈 페이지를 만들지 않고 continuation 한도로 전환
          used = 0
          isFirstPage = false
        }
        for (const movedParagraph of moved) {
          appendParagraph(movedParagraph)
        }
        appendParagraph(p)
        continue
      }

      flushPage()
      gap = resolveA4ParagraphGap(p, page, paragraphGapPx)
    }

    page.push(p)
    used += gap + h
  }
  flushPage()
  if (out.length === 0) {
    out.push([])
  }
  return { pages: out, overflow }
}
