import {
  FORM_EDITOR_MULTIPLE_CHOICE_ITEMS_FOCUS_ID,
  normalizeHorizontalTableParagraph,
  normalizeVerticalTableParagraph,
  type AgreementSystemBodyDisplayMode,
  type FormEditorKind,
  type HorizontalTableRowSelection,
  type WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import { ExplanationSystem } from '@/features/template/ui/paragraph/explanation/system'
import { ExplanationText } from '@/features/template/ui/paragraph/explanation/text'
import { ExplanationTitle } from '@/features/template/ui/paragraph/explanation/title'
import { DateTime } from '@/features/template/ui/paragraph/single-item/date-time'
import { Dropdown } from '@/features/template/ui/paragraph/single-item/dropdown'
import { FileAttachment } from '@/features/template/ui/paragraph/single-item/file-attachment'
import { MultipleChoice } from '@/features/template/ui/paragraph/single-item/multiple-choice'
import { ScaleType } from '@/features/template/ui/paragraph/single-item/scale-type'
import { HorizontalTableParagraphBody } from '@/features/template/ui/paragraph/table/horizontal-table-paragraph-body'
import { VerticalTableParagraphBody } from '@/features/template/ui/paragraph/table/vertical-table-paragraph-body'
import { ScoreSelectParagraphBody } from '@/features/template/ui/paragraph/single-item/score-select-paragraph-body'
import { ShortEssay } from '@/features/template/ui/paragraph/single-item/short-essay'
import { StarRate } from '@/features/template/ui/paragraph/single-item/star-rate'
import { SubjectiveParagraphBody } from '@/features/template/ui/paragraph/single-item/subjective-paragraph-body'
import { UserInfo } from '@/features/template/ui/paragraph/single-item/user-info'
import { UserProfileParagraphBody } from '@/features/template/ui/paragraph/single-item/user-profile-paragraph-body'
import type { ParagraphBodyInteractionMode } from '@/features/template/ui/paragraph/paragraph-body-interaction-mode'

export type FormUpdateParagraph = (
  id: string,
  updater: (p: WritingFormParagraph) => WritingFormParagraph
) => void

export type { ParagraphBodyInteractionMode }

export type RenderFormParagraphBodyOptions = {
  horizontalTableRowSelection?: HorizontalTableRowSelection | null
  onHorizontalTableRowSelectionChange?: (next: HorizontalTableRowSelection | null) => void
  /** 세로형 테이블 본문 행 선택(캔버스) — 폼 에디터에서 단일 전역 */
  verticalTableRowSelection?: number | null
  onVerticalTableRowSelectionChange?: (row: number | null) => void
  singleItemListActiveItemId?: string | null
  onSelectSingleItemListItem?: (itemId: string | null) => void
  /** 동의 시스템 단락(날짜·서명) — 기본 authoring; 응답 앱에서 write 전달 */
  agreementSystemDisplayMode?: AgreementSystemBodyDisplayMode
  agreementSystemParticipantName?: string
  agreementSystemNow?: Date
  /**
   * 기본 authoring.
   * - user: 카드 선택은 유지(우측 패널 등)하되, 본문 입력은 카드 비선택에서도 가능(`isBodyInteractive`).
   * - user: 카드 전환 시 미리보기 초기화 등 편집 전용 부수 효과는 끔(단락 컴포넌트에서 `paragraphInteractionMode`로 분기).
   */
  paragraphInteractionMode?: ParagraphBodyInteractionMode
}

export function renderFormParagraphBody(
  p: WritingFormParagraph,
  updateParagraph: FormUpdateParagraph,
  isParagraphSelected: boolean,
  editorKind: FormEditorKind = 'survey',
  options?: RenderFormParagraphBodyOptions
) {
  const paragraphInteractionMode = options?.paragraphInteractionMode ?? 'authoring'
  const isCardSelected = isParagraphSelected
  const isBodyInteractive = paragraphInteractionMode === 'user' || isParagraphSelected
  switch (p.variant) {
    case 'survey_title_with_period':
      if (!isCardSelected && paragraphInteractionMode !== 'user') return null
      if (!(p.showWritingPeriodOnForm ?? false)) return null
      return (
        <ExplanationTitle
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isBodyInteractive}
          periodLabel={editorKind === 'survey' ? '설문 기간' : undefined}
        />
      )
    case 'user_profile':
      return (
        <UserProfileParagraphBody
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isBodyInteractive}
        />
      )
    case 'score_select':
      return (
        <ScoreSelectParagraphBody
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isBodyInteractive}
        />
      )
    case 'subjective':
      return <SubjectiveParagraphBody paragraph={p} isEditMode={isBodyInteractive} />
    case 'agreement_explanation_text':
      return (
        <ExplanationText
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isBodyInteractive}
        />
      )
    case 'horizontal_table': {
      const hp = normalizeHorizontalTableParagraph(
        p as Extract<WritingFormParagraph, { variant: 'horizontal_table' }>
      )
      /* 필드형: 단락 카드 비선택이어도 셀 인풋·피커 유지(텍스트형만 비선택 시 플레이스홀더 뷰) */
      const isEditMode =
        paragraphInteractionMode === 'user' || isParagraphSelected || hp.tableFlavor === 'field'
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
    case 'vertical_table': {
      const vp = normalizeVerticalTableParagraph(
        p as Extract<WritingFormParagraph, { variant: 'vertical_table' }>
      )
      return (
        <VerticalTableParagraphBody
          paragraph={vp}
          onChange={next => updateParagraph(p.id, () => normalizeVerticalTableParagraph(next))}
          isEditMode={isBodyInteractive}
          tableRowSelection={options?.verticalTableRowSelection}
          onTableRowSelectionChange={options?.onVerticalTableRowSelectionChange}
        />
      )
    }
    case 'system': {
      if (
        p.kind === 'description' &&
        p.variant === 'system' &&
        (p.systemPreset === 'agreement_date' || p.systemPreset === 'agreement_signature')
      ) {
        return (
          <ExplanationSystem
            paragraph={p}
            onChange={next => updateParagraph(p.id, () => next)}
            isEditMode={isBodyInteractive}
            displayMode={options?.agreementSystemDisplayMode ?? 'authoring'}
            participantName={options?.agreementSystemParticipantName}
            now={options?.agreementSystemNow}
          />
        )
      }
      return null
    }
    case 'closing':
      return null
    case 'short_essay':
      return (
        <ShortEssay
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isCardSelected={isCardSelected}
          isBodyInteractive={isBodyInteractive}
          paragraphInteractionMode={paragraphInteractionMode}
          activeItemId={options?.singleItemListActiveItemId}
          onSelectItem={options?.onSelectSingleItemListItem}
        />
      )
    case 'multiple_choice': {
      const usesMcItemsFocus = options?.onSelectSingleItemListItem != null
      const itemsEditActive = usesMcItemsFocus
        ? isCardSelected &&
          options?.singleItemListActiveItemId === FORM_EDITOR_MULTIPLE_CHOICE_ITEMS_FOCUS_ID
        : isCardSelected
      return (
        <MultipleChoice
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isCardSelected={isCardSelected}
          isBodyInteractive={isBodyInteractive}
          paragraphInteractionMode={paragraphInteractionMode}
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
          isEditMode={isBodyInteractive}
        />
      )
    case 'date_time':
      return (
        <DateTime
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isCardSelected={isCardSelected}
          isBodyInteractive={isBodyInteractive}
          paragraphInteractionMode={paragraphInteractionMode}
        />
      )
    case 'star_rate':
      return (
        <StarRate
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isCardSelected={isCardSelected}
          isBodyInteractive={isBodyInteractive}
          paragraphInteractionMode={paragraphInteractionMode}
        />
      )
    case 'scale_type':
      return (
        <ScaleType
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isCardSelected={isCardSelected}
          isBodyInteractive={isBodyInteractive}
          paragraphInteractionMode={paragraphInteractionMode}
        />
      )
    case 'user_info':
      return (
        <UserInfo
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isBodyInteractive}
        />
      )
    case 'file_attachment':
      return (
        <FileAttachment
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isBodyInteractive}
        />
      )
  }
}
