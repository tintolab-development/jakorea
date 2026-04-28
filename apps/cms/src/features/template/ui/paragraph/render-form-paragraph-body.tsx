import {
  FORM_EDITOR_MULTIPLE_CHOICE_ITEMS_FOCUS_ID,
  normalizeHorizontalTableParagraph,
  type FormEditorKind,
  type HorizontalTableRowSelection,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { ExplanationText } from '@/features/template/ui/paragraph/explanation/text'
import { ExplanationTitle } from '@/features/template/ui/paragraph/explanation/title'
import { AgreementPrivacyRowsBody } from '@/features/template/ui/paragraph/single-item/agreement-privacy-rows-paragraph-body'
import { AgreementRichTextBody } from '@/features/template/ui/paragraph/single-item/agreement-rich-text-paragraph-body'
import { AgreementTableConsentBody } from '@/features/template/ui/paragraph/single-item/agreement-table-consent-paragraph-body'
import { DateTime } from '@/features/template/ui/paragraph/single-item/date-time'
import { Dropdown } from '@/features/template/ui/paragraph/single-item/dropdown'
import { FileAttachment } from '@/features/template/ui/paragraph/single-item/file-attachment'
import { MultipleChoice } from '@/features/template/ui/paragraph/single-item/multiple-choice'
import { ScaleType } from '@/features/template/ui/paragraph/single-item/scale-type'
import { HorizontalTableParagraphBody } from '@/features/template/ui/paragraph/single-item/horizontal-table-paragraph-body'
import { ScoreSelectParagraphBody } from '@/features/template/ui/paragraph/single-item/score-select-paragraph-body'
import { ShortEssay } from '@/features/template/ui/paragraph/single-item/short-essay'
import { StarRate } from '@/features/template/ui/paragraph/single-item/star-rate'
import { SubjectiveParagraphBody } from '@/features/template/ui/paragraph/single-item/subjective-paragraph-body'
import { UserInfo } from '@/features/template/ui/paragraph/single-item/user-info'
import { UserProfileParagraphBody } from '@/features/template/ui/paragraph/single-item/user-profile-paragraph-body'

export type FormUpdateParagraph = (
  id: string,
  updater: (p: WritingFormParagraph) => WritingFormParagraph
) => void

export type RenderFormParagraphBodyOptions = {
  horizontalTableRowSelection?: HorizontalTableRowSelection | null
  onHorizontalTableRowSelectionChange?: (next: HorizontalTableRowSelection | null) => void
  singleItemListActiveItemId?: string | null
  onSelectSingleItemListItem?: (itemId: string | null) => void
}

export function renderFormParagraphBody(
  p: WritingFormParagraph,
  updateParagraph: FormUpdateParagraph,
  isParagraphSelected: boolean,
  editorKind: FormEditorKind = 'survey',
  options?: RenderFormParagraphBodyOptions
) {
  switch (p.variant) {
    case 'survey_title_with_period':
      return (
        <ExplanationTitle
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isParagraphSelected}
          periodLabel={editorKind === 'survey' ? '설문 기간' : undefined}
        />
      )
    case 'user_profile':
      return (
        <UserProfileParagraphBody
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isParagraphSelected}
        />
      )
    case 'score_select':
      return (
        <ScoreSelectParagraphBody
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isParagraphSelected}
        />
      )
    case 'subjective':
      return <SubjectiveParagraphBody paragraph={p} isEditMode={isParagraphSelected} />
    case 'agreement_rich_text':
      return (
        <AgreementRichTextBody
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isParagraphSelected}
        />
      )
    case 'agreement_explanation_text':
      return (
        <ExplanationText
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isParagraphSelected}
        />
      )
    case 'agreement_privacy_rows':
      return (
        <AgreementPrivacyRowsBody
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isParagraphSelected}
        />
      )
    case 'agreement_table_consent':
      return (
        <AgreementTableConsentBody
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isParagraphSelected}
        />
      )
    case 'horizontal_table': {
      const hp = normalizeHorizontalTableParagraph(
        p as Extract<WritingFormParagraph, { variant: 'horizontal_table' }>
      )
      /* 필드형: 단락 카드 비선택이어도 셀 인풋·피커 유지(텍스트형만 비선택 시 플레이스홀더 뷰) */
      const isEditMode = isParagraphSelected || hp.tableFlavor === 'field'
      return (
        <HorizontalTableParagraphBody
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isEditMode}
          tableRowSelection={options?.horizontalTableRowSelection}
          onTableRowSelectionChange={options?.onHorizontalTableRowSelectionChange}
        />
      )
    }
    case 'system':
      /* 본문 없음 — `<Component />`를 넘기면 `children != null`로 슬롯만 생기므로 null 반환 */
      return null
    case 'closing':
      return null
    case 'short_essay':
      return (
        <ShortEssay
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isParagraphSelected}
          activeItemId={options?.singleItemListActiveItemId}
          onSelectItem={options?.onSelectSingleItemListItem}
        />
      )
    case 'multiple_choice': {
      const usesMcItemsFocus = options?.onSelectSingleItemListItem != null
      const itemsEditActive = usesMcItemsFocus
        ? isParagraphSelected &&
          options?.singleItemListActiveItemId === FORM_EDITOR_MULTIPLE_CHOICE_ITEMS_FOCUS_ID
        : isParagraphSelected
      return (
        <MultipleChoice
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isParagraphSelected}
          itemsEditActive={itemsEditActive}
          onActivateItemsEditor={
            usesMcItemsFocus
              ? () => options!.onSelectSingleItemListItem!(FORM_EDITOR_MULTIPLE_CHOICE_ITEMS_FOCUS_ID)
              : undefined
          }
        />
      )
    }
    case 'dropdown':
      return (
        <Dropdown
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isParagraphSelected}
        />
      )
    case 'date_time':
      return (
        <DateTime paragraph={p} onChange={next => updateParagraph(p.id, () => next)} />
      )
    case 'star_rate':
      return (
        <StarRate
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isParagraphSelected}
        />
      )
    case 'scale_type':
      return (
        <ScaleType
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isParagraphSelected}
        />
      )
    case 'user_info':
      return (
        <UserInfo
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isParagraphSelected}
        />
      )
    case 'file_attachment':
      return (
        <FileAttachment
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isParagraphSelected}
        />
      )
  }
}
