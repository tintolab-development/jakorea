import type { FormDocumentPreviewParagraphGapResolver } from '@/features/template/lib/a4-document-preview'
import {
  createContentOnlyA4PreviewOptions,
  type A4PreviewSessionOptions,
} from '@/features/template/lib/a4-preview-template-options'
import {
  UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS,
  UJAT_EDUCATION_JOURNAL_SEED_PARAGRAPH_IDS,
  UJAT_EDUCATION_PLAN_ISSUANCE_PARAGRAPH_IDS,
  UJAT_EDUCATION_PLAN_SEED_PARAGRAPH_IDS,
} from '@/features/template/model/writing-form-draft.schema'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'
import type { UserInfoPreviewValues } from '@/features/template/ui/paragraph/single-item/user-info'

export type UjatEducationA4PreviewVariant = 'plan' | 'journal'

export const UJAT_EDUCATION_A4_PREVIEW_BODY_CLASS_NAME =
  'form-document-preview-body--ujat-education'

export const UJAT_EDUCATION_PLAN_A4_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  UJAT_EDUCATION_PLAN_ISSUANCE_PARAGRAPH_IDS.title,
])

export const UJAT_EDUCATION_JOURNAL_A4_HIDDEN_PARAGRAPH_IDS = new Set<string>([
  UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS.title,
])

export function getUjatEducationA4HiddenParagraphIds(
  variant: UjatEducationA4PreviewVariant
): ReadonlySet<string> {
  return variant === 'plan'
    ? UJAT_EDUCATION_PLAN_A4_HIDDEN_PARAGRAPH_IDS
    : UJAT_EDUCATION_JOURNAL_A4_HIDDEN_PARAGRAPH_IDS
}

export const getUjatEducationPlanA4ParagraphGap: FormDocumentPreviewParagraphGapResolver =
  paragraph =>
    UJAT_EDUCATION_PLAN_SEED_PARAGRAPH_IDS.has(paragraph.id) ? 32 : 16

export const getUjatEducationJournalA4ParagraphGap: FormDocumentPreviewParagraphGapResolver =
  paragraph =>
    UJAT_EDUCATION_JOURNAL_SEED_PARAGRAPH_IDS.has(paragraph.id) ? 32 : 16

export function getUjatEducationA4ParagraphGap(
  variant: UjatEducationA4PreviewVariant
): FormDocumentPreviewParagraphGapResolver {
  return variant === 'plan'
    ? getUjatEducationPlanA4ParagraphGap
    : getUjatEducationJournalA4ParagraphGap
}

export type UjatEducationIssuanceA4PreviewInput = {
  variant: UjatEducationA4PreviewVariant
  userInfoPreviewValues?: UserInfoPreviewValues
  journalInstitutionName?: string
}

/** 발급 탭·문서 뷰어·에디터 미리보기 — 동일 A4 contentOnly 변환 옵션 */
export function createUjatEducationIssuanceA4Preview(input: UjatEducationIssuanceA4PreviewInput): {
  a4PreviewOptions: A4PreviewSessionOptions
  paragraphBodyOptions: RenderFormParagraphBodyOptions
  a4HiddenParagraphIds: ReadonlySet<string>
  a4ParagraphGapPx: FormDocumentPreviewParagraphGapResolver
} {
  const a4HiddenParagraphIds = getUjatEducationA4HiddenParagraphIds(input.variant)
  const a4ParagraphGapPx = getUjatEducationA4ParagraphGap(input.variant)
  const a4PreviewOptions = createContentOnlyA4PreviewOptions({
    a4HiddenParagraphIds,
    a4ParagraphGapPx,
  })

  const paragraphBodyOptions: RenderFormParagraphBodyOptions = {
    documentPreviewClassName: UJAT_EDUCATION_A4_PREVIEW_BODY_CLASS_NAME,
    ...(input.userInfoPreviewValues != null
      ? { userInfoPreviewValues: input.userInfoPreviewValues }
      : {}),
    ...(input.variant === 'journal' && input.journalInstitutionName != null
      ? {
          ujatJournalEducationInfoAutofill: {
            institutionName: input.journalInstitutionName,
          },
        }
      : {}),
  }

  return {
    a4PreviewOptions,
    paragraphBodyOptions,
    a4HiddenParagraphIds,
    a4ParagraphGapPx,
  }
}
