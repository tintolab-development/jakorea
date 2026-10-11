import type {
  HorizontalTableParagraph,
  VerticalTableParagraph,
  WritingFormParagraph,
} from './draft-schema.js'
import { writingOutlineLabel } from './draft-schema.js'
import {
  PARAGRAPH_KIND_OPTIONS,
  detailSelectOptionsForValue,
  horizontalTableKindRowLabel,
  paragraphDetailSelectValue,
  paragraphKindSelectValue,
  verticalTableKindRowLabel,
  type DetailSelectValue,
  type ParagraphKindSelectValue,
} from './paragraph-selectors.js'

function detailSelectLabel(kind: ParagraphKindSelectValue, detail: DetailSelectValue): string {
  return detailSelectOptionsForValue(kind, detail).find(o => o.value === detail)?.label ?? detail
}

/** 우측 패널 `form-editor-right-panel__section-title` — 유형 셀렉트(테이블·가로형/세로형)와 동일 라벨 */
export function formEditorRightPanelSectionTitle(p: WritingFormParagraph): string {
  const kind = paragraphKindSelectValue(p)
  if (kind === 'table') {
    const detail = paragraphDetailSelectValue(p)
    const kindLabel = PARAGRAPH_KIND_OPTIONS.find(o => o.value === 'table')!.label
    return `${kindLabel} ${detailSelectLabel(kind, detail)}`
  }
  return writingOutlineLabel(p)
}

export function paragraphKindLabel(p: WritingFormParagraph): string {
  if (p.kind === 'description') return '설명글'
  if (p.kind === 'single_item' && p.variant === 'agreement_explanation_text') return '설명글'
  if (p.kind === 'single_item' && p.variant === 'horizontal_table') {
    return horizontalTableKindRowLabel(p as HorizontalTableParagraph)
  }
  if (p.kind === 'single_item' && p.variant === 'vertical_table') {
    return verticalTableKindRowLabel(p as VerticalTableParagraph)
  }
  return '단일항목'
}
