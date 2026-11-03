import type { ReactNode } from 'react'
import { useRegistrationWizardValidationHighlight } from '@/features/program/shared/ui/registration/registration-wizard-validation-highlight'
import {
  FormParagraphSectionDescription,
  getVisibleParagraphDescription,
  type FormParagraphSectionDescriptionSurface,
} from '@/features/template/ui/shared/form-paragraph-section-description'
import '@/shared/components/detail-info-form/detail-info-form.css'
import './form-paragraph-section-header.css'

export type FormParagraphSectionHeaderProps = {
  title: ReactNode
  /** 타이틀 옆/하단 설명 — `FormParagraphSectionDescription`으로만 노출(placeholder 제외) */
  description?: string | null
  /**
   * `inline` — Figma Title sub txt(제목 오른쪽, 14px Medium 50%).
   * `below` — 기존 타이틀 하단 2px.
   * @default 'below'
   */
  descriptionPlacement?: 'below' | 'inline'
  titleTrailing?: ReactNode
  /** @default 'responseEntry' */
  surface?: FormParagraphSectionDescriptionSurface
  /** @default true */
  titleAligned?: boolean
  required?: boolean
  /** 제목 요소 `id` — `aria-labelledby` 연결용 */
  headingId?: string
  /**
   * 등록 위저드와 같은 단락 id.
   * 필수 누락 보고 시 제목을 빨간색으로 유지한다.
   */
  highlightParagraphId?: string
}

/**
 * 폼 섹션 헤더 — `DetailInfoForm` 헤더(`detail-info-form__*`)와 동일 타이포·클래스.
 * 타이틀 하단 설명은 `FormParagraphSectionDescription`만 사용(2px 간격).
 */
export function FormParagraphSectionHeader({
  title,
  description,
  descriptionPlacement = 'below',
  titleTrailing,
  surface = 'responseEntry',
  titleAligned = true,
  required = false,
  headingId,
  highlightParagraphId,
}: FormParagraphSectionHeaderProps) {
  const visibleDescription = getVisibleParagraphDescription(description ?? null)
  const { isParagraphIncomplete } = useRegistrationWizardValidationHighlight()
  const requiredIncomplete =
    highlightParagraphId != null &&
    highlightParagraphId !== '' &&
    isParagraphIncomplete(highlightParagraphId)

  return (
    <header
      className={[
        'detail-info-form__header form-paragraph-section-header',
        descriptionPlacement === 'inline'
          ? 'form-paragraph-section-header--description-inline'
          : '',
        requiredIncomplete ? 'form-paragraph-section-header--required-incomplete' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-paragraph-id={highlightParagraphId || undefined}
    >
      <div className="detail-info-form__header-lead form-paragraph-section-header__lead">
        <h2 id={headingId} className="detail-info-form__title">
          {title}
          {required ? (
            <span
              className="detail-info-form__field-required form-paragraph-section-header__required"
              aria-hidden
            >
              *
            </span>
          ) : null}
        </h2>
        {visibleDescription ? (
          <FormParagraphSectionDescription
            surface={surface}
            titleAligned={descriptionPlacement === 'inline' ? false : titleAligned}
            className="form-paragraph-section-header__description"
          >
            {visibleDescription}
          </FormParagraphSectionDescription>
        ) : null}
      </div>
      {titleTrailing ? (
        <div className="detail-info-form__header-trailing">{titleTrailing}</div>
      ) : null}
    </header>
  )
}
