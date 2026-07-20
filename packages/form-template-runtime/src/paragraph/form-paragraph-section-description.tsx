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

/** 템플릿 단락 카드·프로그램 상세 등 — 시드 placeholder는 사용자-facing 설명으로 노출하지 않음 */
const PLACEHOLDER_PARAGRAPH_DESCRIPTIONS = new Set(['설명 입력', '설명을 입력해 주세요'])

export function isPlaceholderParagraphDescription(value: string | undefined | null): boolean {
  const trimmed = value?.trim() ?? ''
  return trimmed.length === 0 || PLACEHOLDER_PARAGRAPH_DESCRIPTIONS.has(trimmed)
}

/** 노출할 설명 문자열 — placeholder·공백이면 `null` */
export function getVisibleParagraphDescription(
  value: string | undefined | null
): string | null {
  if (isPlaceholderParagraphDescription(value)) return null
  return value!.trim()
}
