import type { ReactNode } from 'react'
import './form-paragraph-section-description.css'

export const FORM_PARAGRAPH_SECTION_DESCRIPTION_CLASS = 'form-paragraph-section-description'

export type FormParagraphSectionDescriptionProps = {
  children: ReactNode
  /** 제목 하단·번호 접두 없는 embed 섹션 — `padding-left: 8px` */
  titleAligned?: boolean
  className?: string
}

export function FormParagraphSectionDescription({
  children,
  titleAligned = false,
  className,
}: FormParagraphSectionDescriptionProps) {
  const rootClass = [
    FORM_PARAGRAPH_SECTION_DESCRIPTION_CLASS,
    titleAligned ? 'form-paragraph-section-description--title-aligned' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <p className={rootClass}>{children}</p>
}
