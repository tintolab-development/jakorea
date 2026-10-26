import type { TextbookContent, TextbookUnit } from '../model/types'

function hasMeaningfulRichText(value: string | undefined): boolean {
  const normalized = value?.trim() ?? ''
  if (!normalized) return false

  const text = normalized
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .trim()

  return Boolean(text) || /<img\b/i.test(normalized)
}

export function visibleTextbookUnits(units: readonly TextbookUnit[]): TextbookUnit[] {
  return units.filter(unit => unit.title.trim() || unit.description.trim())
}

export function hasTextbookUnitIntroduction(
  content: Pick<TextbookContent, 'unitIntroHtml' | 'units'>
): boolean {
  return (
    hasMeaningfulRichText(content.unitIntroHtml) ||
    visibleTextbookUnits(content.units).length > 0
  )
}
