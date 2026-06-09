import type { ReactNode } from 'react'
import { Form } from 'antd'
import type {
  AgreementExplanationTextParagraph,
  SessionPlanShortEssayParagraph,
  ShortEssayParagraph,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import {
  isAgreementExplanationTextParagraph,
  isHorizontalTableParagraph,
  isMultipleChoiceParagraph,
  isScaleTypeParagraph,
  isShortEssayOrSessionPlanParagraph,
  isVerticalTableParagraph,
} from '@/features/template/model/writing-form/paragraph-guards'
import { AgreementExplanationTextEditor } from '@/features/template/ui/form-editor/right-panel/editors/agreement-explanation-text-editor'
import { HorizontalTableEditor } from '@/features/template/ui/form-editor/right-panel/editors/horizontal-table-editor'
import { MultipleChoiceEditor } from '@/features/template/ui/form-editor/right-panel/editors/multiple-choice-editor'
import { ScaleTypeEditor } from '@/features/template/ui/form-editor/right-panel/editors/scale-type-editor'
import { ShortEssayEditor } from '@/features/template/ui/form-editor/right-panel/editors/short-essay-editor'
import { VerticalTableEditor } from '@/features/template/ui/form-editor/right-panel/editors/vertical-table-editor'
import type { FormEditorRightPanelProps } from '@/features/template/ui/form-editor/right-panel/form-editor-right-panel.types'

const PARAGRAPH_EDITOR_COMPONENTS = {
  agreement_explanation_text: AgreementExplanationTextEditor,
  subjective: ShortEssayEditor,
  multiple_choice: MultipleChoiceEditor,
  scale_type: ScaleTypeEditor,
  horizontal_table: HorizontalTableEditor,
  vertical_table: VerticalTableEditor,
} as const

type ParagraphCustomEditorKey = keyof typeof PARAGRAPH_EDITOR_COMPONENTS

type ShortEssayItemShape = {
  id: string
  label?: string
  placeholder?: string
  bodyText: string
}

function resolveParagraphCustomEditorKey(
  active: WritingFormParagraph,
  selectedShortEssayItem: ShortEssayItemShape | null
): ParagraphCustomEditorKey | null {
  if (isAgreementExplanationTextParagraph(active)) return 'agreement_explanation_text'
  if (isShortEssayOrSessionPlanParagraph(active) && selectedShortEssayItem) return 'subjective'
  if (isMultipleChoiceParagraph(active)) return 'multiple_choice'
  if (isScaleTypeParagraph(active)) return 'scale_type'
  if (isHorizontalTableParagraph(active)) return 'horizontal_table'
  if (isVerticalTableParagraph(active)) return 'vertical_table'
  return null
}

export function ParagraphCustomFieldsSection({
  active,
  updateParagraph,
  singleItemListActiveItemId,
  horizontalTableRowSelection,
  onHorizontalTableBodyRowDeleted,
  verticalTableBodyRowSelection,
  onVerticalTableBodyRowDeleted,
  shortEssayShowItemTitle,
  activeShortEssay,
  selectedShortEssayItem,
}: {
  active: WritingFormParagraph
  updateParagraph: FormEditorRightPanelProps['updateParagraph']
  singleItemListActiveItemId?: string | null
  horizontalTableRowSelection: FormEditorRightPanelProps['horizontalTableRowSelection']
  onHorizontalTableBodyRowDeleted?: FormEditorRightPanelProps['onHorizontalTableBodyRowDeleted']
  verticalTableBodyRowSelection: FormEditorRightPanelProps['verticalTableBodyRowSelection']
  onVerticalTableBodyRowDeleted?: FormEditorRightPanelProps['onVerticalTableBodyRowDeleted']
  shortEssayShowItemTitle: boolean
  activeShortEssay: ShortEssayParagraph | SessionPlanShortEssayParagraph | null
  selectedShortEssayItem: ShortEssayItemShape | null
}) {
  const editorKey = resolveParagraphCustomEditorKey(active, selectedShortEssayItem)

  if (editorKey == null) return null

  if (
    editorKey === 'agreement_explanation_text' &&
    isAgreementExplanationTextParagraph(active)
  ) {
    const AgreementText = PARAGRAPH_EDITOR_COMPONENTS.agreement_explanation_text
    return (
      <AgreementText
        paragraph={active as AgreementExplanationTextParagraph}
        updateParagraph={updateParagraph}
      />
    )
  }

  if (editorKey === 'subjective' && activeShortEssay && selectedShortEssayItem) {
    const Subjective = PARAGRAPH_EDITOR_COMPONENTS.subjective
    return (
      <Subjective
        activeShortEssay={activeShortEssay}
        selectedShortEssayItem={selectedShortEssayItem}
        shortEssayShowItemTitle={shortEssayShowItemTitle}
        updateParagraph={updateParagraph}
      />
    )
  }

  if (editorKey === 'multiple_choice' && isMultipleChoiceParagraph(active)) {
    const Mc = PARAGRAPH_EDITOR_COMPONENTS.multiple_choice
    return (
      <Mc
        paragraph={active}
        updateParagraph={updateParagraph}
        singleItemListActiveItemId={singleItemListActiveItemId}
      />
    )
  }

  if (editorKey === 'scale_type' && isScaleTypeParagraph(active)) {
    const Sc = PARAGRAPH_EDITOR_COMPONENTS.scale_type
    return <Sc paragraph={active} updateParagraph={updateParagraph} />
  }

  if (editorKey === 'horizontal_table' && isHorizontalTableParagraph(active)) {
    const Ht = PARAGRAPH_EDITOR_COMPONENTS.horizontal_table
    return (
      <Ht
        paragraph={active}
        rowSelection={horizontalTableRowSelection}
        updateParagraph={updateParagraph}
        onBodyRowDeleted={onHorizontalTableBodyRowDeleted}
      />
    )
  }

  if (editorKey === 'vertical_table' && isVerticalTableParagraph(active)) {
    const Vt = PARAGRAPH_EDITOR_COMPONENTS.vertical_table
    return (
      <Vt
        paragraph={active}
        rowSelection={verticalTableBodyRowSelection}
        updateParagraph={updateParagraph}
        onBodyRowDeleted={onVerticalTableBodyRowDeleted}
      />
    )
  }

  return null
}

export function ParagraphCustomFieldsFormShell({
  active,
  children,
  className,
}: {
  active: WritingFormParagraph
  children: ReactNode
  className?: string
}) {
  if (active.kind === 'description' && active.variant === 'closing') return null

  return (
    <Form
      layout="vertical"
      className={['form-editor-right-panel__form-items', className].filter(Boolean).join(' ')}
      requiredMark={false}
    >
      {children}
    </Form>
  )
}
