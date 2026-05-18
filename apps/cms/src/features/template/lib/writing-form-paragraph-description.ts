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

/** DetailInfoForm 헤더 — title은 항상 노출, description은 placeholder 제외 시만 */
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
