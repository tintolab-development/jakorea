import type { ReactNode } from 'react'
import './form-paragraph-section-description.css'

export const FORM_PARAGRAPH_SECTION_DESCRIPTION_CLASS = 'form-paragraph-section-description'

/** 하단 단락 설명 타이포 — `templateAuthoring*` 14px, `responseEntry*` 16px */
export type FormParagraphSectionDescriptionSurface = 'templateAuthoring' | 'responseEntry'

export type FormParagraphSectionDescriptionProps = {
  children: ReactNode
  /** @default 'templateAuthoring' */
  surface?: FormParagraphSectionDescriptionSurface
  /** 제목 하단·번호 접두 없는 embed 섹션 — `padding-left: 8px` */
  titleAligned?: boolean
  className?: string
}

export function FormParagraphSectionDescription({
  children,
  surface = 'templateAuthoring',
  titleAligned = false,
  className,
}: FormParagraphSectionDescriptionProps) {
  const rootClass = [
    FORM_PARAGRAPH_SECTION_DESCRIPTION_CLASS,
    surface === 'responseEntry' ? 'form-paragraph-section-description--response-entry' : '',
    titleAligned ? 'form-paragraph-section-description--title-aligned' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return <p className={rootClass}>{children}</p>
}
