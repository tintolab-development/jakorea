import type { ReactNode } from 'react'
import {
  FormParagraphSectionDescription,
  getVisibleParagraphDescription,
  type FormParagraphSectionDescriptionSurface,
} from '@/features/template/ui/shared/form-paragraph-section-description'
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
  /** @default 'h2' */
  headingLevel?: 'h2' | 'h3'
  required?: boolean
  titleClassName?: string
  headerClassName?: string
  mainClassName?: string
  /** 제목 요소 `id` — `aria-labelledby` 연결용 */
  headingId?: string
}

/**
 * 폼 섹션 헤더 — 타이틀 + (선택) 우측 액션 + (선택) 하단 설명.
 * 하단 description은 `detail-info-form__description`이 아닌 `FormParagraphSectionDescription`만 사용한다.
 */
export function FormParagraphSectionHeader({
  title,
  description,
  titleTrailing,
  surface = 'responseEntry',
  titleAligned = true,
  headingLevel = 'h2',
  required = false,
  titleClassName,
  headerClassName,
  mainClassName,
  headingId,
}: FormParagraphSectionHeaderProps) {
  const visibleDescription = getVisibleParagraphDescription(description ?? null)
  const Heading = headingLevel

  const titleClass = ['form-paragraph-section-header__title', titleClassName]
    .filter(Boolean)
    .join(' ')

  return (
    <header
      className={['form-paragraph-section-header', headerClassName].filter(Boolean).join(' ')}
    >
      <div
        className={['form-paragraph-section-header__main', mainClassName].filter(Boolean).join(' ')}
      >
        <div className="form-paragraph-section-header__lead">
          <Heading id={headingId} className={titleClass}>
            {title}
            {required ? (
              <span
                className="detail-info-form__field-required form-paragraph-section-header__required"
                aria-hidden
              >
                *
              </span>
            ) : null}
          </Heading>
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
          <div className="form-paragraph-section-header__trailing">{titleTrailing}</div>
        ) : null}
      </div>
    </header>
  )
}
