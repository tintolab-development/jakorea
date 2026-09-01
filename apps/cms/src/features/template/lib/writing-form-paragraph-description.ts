import { getVisibleParagraphDescription } from '@/features/template/ui/shared/form-paragraph-section-description'

export {
  FORM_PARAGRAPH_SECTION_DESCRIPTION_CLASS,
  FormParagraphSectionDescription,
  getVisibleParagraphDescription,
  isPlaceholderParagraphDescription,
  type FormParagraphSectionDescriptionProps,
  type FormParagraphSectionDescriptionSurface,
} from '@/features/template/ui/shared/form-paragraph-section-description'

export {
  FormParagraphSectionHeader,
  type FormParagraphSectionHeaderProps,
} from '@/features/template/ui/shared/form-paragraph-section-header'

/**
 * DetailInfoForm 헤더 — title 옆(가로) `detail-info-form__description`용.
 * 타이틀 **하단** 설명은 `FormParagraphSectionHeader` + `FormParagraphSectionDescription` 사용.
 */
export function detailInfoFormSectionHeaderProps(
  title: string,
  sectionDescription?: string | null
): { title: string; hideHeader: false; description?: string } {
  const description = getVisibleParagraphDescription(sectionDescription ?? null)
  return description ? { title, hideHeader: false, description } : { title, hideHeader: false }
}

/** 프로그램 상세(UJAT 등) — 폼 양식 `paragraphDescription` 미노출, title만 */
export function detailInfoFormSectionTitleHeaderProps(
  title: string
): { title: string; hideHeader: false } {
  return { title, hideHeader: false }
}
