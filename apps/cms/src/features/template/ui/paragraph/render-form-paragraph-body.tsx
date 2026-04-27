import type { FormEditorKind, WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'
import { ClosingParagraphBody } from '@/features/template/ui/paragraph/explanation/closing-paragraph-body'
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

export function renderFormParagraphBody(
  p: WritingFormParagraph,
  updateParagraph: FormUpdateParagraph,
  isParagraphSelected: boolean,
  editorKind: FormEditorKind = 'survey',
  singleItemListActiveItemId?: string | null,
  onSelectSingleItemListItem?: (itemId: string | null) => void
) {
  switch (p.variant) {
    case 'survey_title_with_period':
      return (
        <ExplanationTitle
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isParagraphSelected}
          titlePh={editorKind === 'agreement' ? '동의서 제목 입력' : undefined}
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
    case 'closing':
      return (
        <ClosingParagraphBody
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isParagraphSelected}
        />
      )
    case 'short_essay':
      return (
        <ShortEssay
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isParagraphSelected}
          activeItemId={singleItemListActiveItemId}
          onSelectItem={onSelectSingleItemListItem}
        />
      )
    case 'multiple_choice':
      return (
        <MultipleChoice
          paragraph={p}
          onChange={next => updateParagraph(p.id, () => next)}
          isEditMode={isParagraphSelected}
          activeItemId={singleItemListActiveItemId}
          onSelectItem={onSelectSingleItemListItem}
        />
      )
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
