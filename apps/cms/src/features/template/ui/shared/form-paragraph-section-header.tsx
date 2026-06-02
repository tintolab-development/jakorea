import type { ReactNode } from 'react'
import {
  FormParagraphSectionDescription,
  getVisibleParagraphDescription,
  type FormParagraphSectionDescriptionSurface,
} from '@/features/template/ui/shared/form-paragraph-section-description'
import '@/shared/components/detail-info-form/detail-info-form.css'
import './form-paragraph-section-header.css'

export type FormParagraphSectionHeaderProps = {
  title: ReactNode
  /** 타이틀 하단 설명 — `FormParagraphSectionDescription`으로만 노출(placeholder 제외) */
  description?: string | null
  titleTrailing?: ReactNode
  /** @default 'responseEntry' */
  surface?: FormParagraphSectionDescriptionSurface
  /** @default true */
  titleAligned?: boolean
  required?: boolean
  /** 제목 요소 `id` — `aria-labelledby` 연결용 */
  headingId?: string
}

/**
 * 폼 섹션 헤더 — `DetailInfoForm` 헤더(`detail-info-form__*`)와 동일 타이포·클래스.
 * 타이틀 하단 설명은 `FormParagraphSectionDescription`만 사용(2px 간격).
 */
export function FormParagraphSectionHeader({
  title,
  description,
  titleTrailing,
  surface = 'responseEntry',
  titleAligned = true,
  required = false,
  headingId,
}: FormParagraphSectionHeaderProps) {
  const visibleDescription = getVisibleParagraphDescription(description ?? null)

  return (
    <header className="detail-info-form__header form-paragraph-section-header">
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
            titleAligned={titleAligned}
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
