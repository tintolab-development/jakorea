import type { FormDocumentPreviewParagraphGapResolver } from '@/features/template/lib/a4-document-preview'
import {
  LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS,
  LECTURE_REPORT_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/writing-form-draft.schema'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'

export const LECTURE_REPORT_A4_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS.title,
])

/** A4 미리보기 — 교육 사진은 항상 마지막 페이지 단독 배치 */
export const LECTURE_REPORT_A4_PAGE_BREAK_BEFORE_PARAGRAPH_IDS = new Set<string>([
  LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS.educationPhotos,
])

export const getLectureReportA4ParagraphGap: FormDocumentPreviewParagraphGapResolver = paragraph =>
  LECTURE_REPORT_SEED_PARAGRAPH_IDS.has(paragraph.id) ? 32 : 16

export const LECTURE_REPORT_A4_PREVIEW_BODY_CLASS_NAME =
  'form-document-preview-body--lecture-report'

/** 발급 양식 > 강의보고서 — UJAT 교육계획서와 동일 contentOnly A4 미리보기 옵션 */
export function createLectureReportIssuanceA4Preview(): {
  a4HiddenParagraphIds: ReadonlySet<string>
  a4PageBreakBeforeParagraphIds: ReadonlySet<string>
  a4ParagraphGapPx: FormDocumentPreviewParagraphGapResolver
  a4RenderMode: 'contentOnly'
  paragraphBodyOptions: RenderFormParagraphBodyOptions
} {
  const a4HiddenParagraphIds = LECTURE_REPORT_A4_HIDDEN_PARAGRAPH_IDS
  const a4ParagraphGapPx = getLectureReportA4ParagraphGap

  return {
    a4HiddenParagraphIds,
    a4PageBreakBeforeParagraphIds: LECTURE_REPORT_A4_PAGE_BREAK_BEFORE_PARAGRAPH_IDS,
    a4ParagraphGapPx,
    a4RenderMode: 'contentOnly',
    paragraphBodyOptions: {
      documentPreviewClassName: LECTURE_REPORT_A4_PREVIEW_BODY_CLASS_NAME,
    },
  }
}
