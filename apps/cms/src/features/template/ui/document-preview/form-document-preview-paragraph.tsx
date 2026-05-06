import dayjs from 'dayjs'
import type { CSSProperties, ReactNode } from 'react'
import type {
  ClosingParagraph,
  FormEditorKind,
  FormTitleNumberingStyle,
  MultipleChoiceParagraph,
  SessionPlanShortEssayParagraph,
  ShortEssayParagraph,
  SubjectiveParagraph,
  TitleWithPeriodParagraph,
  LectureReportProgramProgressParagraph,
  UjatJournalEducationInfoParagraph,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import {
  isAgreementLockedSystemParagraph,
  normalizeHorizontalTableParagraph,
  type HorizontalTableParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import type { FormDocumentPreviewRenderMode } from '@/features/template/lib/a4-document-preview'
import { getDocumentPreviewParagraphViewModel } from '@/features/template/lib/a4-document-preview'
import { getFormParagraphDisplayTitle } from '@/features/template/lib/form-title-numbering'
import { ParagraphCard } from '@/features/template/ui/paragraph/shared/paragraph-card'
import { ExplanationSystem } from '@/features/template/ui/paragraph/explanation/system'
import { HorizontalTableParagraphBody } from '@/features/template/ui/paragraph/table/horizontal-table-paragraph-body'
import { VerticalTableParagraphBody } from '@/features/template/ui/paragraph/table/vertical-table-paragraph-body'
import { UserProfileParagraphBody } from '@/features/template/ui/paragraph/single-item/user-profile-paragraph-body'
import { ScoreSelectParagraphBody } from '@/features/template/ui/paragraph/single-item/score-select-paragraph-body'
import { subjectiveParagraphToShortEssayView } from '@/features/template/ui/paragraph/single-item/short-essay'
import { Dropdown } from '@/features/template/ui/paragraph/single-item/dropdown'
import { DateField } from '@/features/template/ui/paragraph/single-item/date'
import { TimeField } from '@/features/template/ui/paragraph/single-item/time'
import { StarRate } from '@/features/template/ui/paragraph/single-item/star-rate'
import { ScaleType } from '@/features/template/ui/paragraph/single-item/scale-type'
import { UserInfo } from '@/features/template/ui/paragraph/single-item/user-info'
import { FileAttachment } from '@/features/template/ui/paragraph/single-item/file-attachment'
import { LectureReportProgramProgress } from '@/features/template/ui/paragraph/single-item/lecture-report-program-progress'
import { UjatJournalEducationInfo } from '@/features/template/ui/paragraph/single-item/ujat-journal-education-info'
import '@/features/template/ui/paragraph/shared/paragraph-card.css'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/render-form-paragraph-body'
import './form-document-preview-body.css'

function noopOnParagraphChange<T>(_next: T): void {}

function safeTrim(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function readOnlyTitleBlock(displayTitle: string, description?: string): { title: ReactNode; description?: ReactNode } {
  const trimmedDescription = safeTrim(description)
  return {
    title: <span className="form-document-preview-paragraph__title-text">{displayTitle}</span>,
    description:
      trimmedDescription.length > 0 ? (
        <span className="form-document-preview-paragraph__description-text">{trimmedDescription}</span>
      ) : undefined,
  }
}

function DocumentMultipleChoiceReadonly({ paragraph }: { paragraph: MultipleChoiceParagraph }) {
  const items = paragraph.items?.length ? paragraph.items : []
  const allowMultiple = paragraph.allowMultiple ?? false
  const singleId = paragraph.selectedPreviewSingleId ?? null
  const multi = new Set(paragraph.selectedPreviewMultipleIds ?? [])
  return (
    <div className="form-document-preview-multiple-choice">
      {items.map(item => {
        const checked = allowMultiple ? multi.has(item.id) : singleId === item.id
        const mark = allowMultiple ? (checked ? '☑' : '☐') : checked ? '●' : '○'
        return (
          <div key={item.id} className="form-document-preview-multiple-choice__row">
            <span className="form-document-preview-multiple-choice__mark" aria-hidden>
              {mark}
            </span>
            <span>{item.label}</span>
          </div>
        )
      })}
    </div>
  )
}

function DocumentShortEssayReadonly({
  paragraph,
}: {
  paragraph: ShortEssayParagraph | SessionPlanShortEssayParagraph
}) {
  const ph = safeTrim(paragraph.bodyPlaceholder) || (paragraph.variant === 'session_plan_short_essay'
    ? '자유롭게 작성해 주세요'
    : '답변을 입력해 주세요')
  const items =
    paragraph.items && paragraph.items.length > 0
      ? paragraph.items
      : [
          {
            id:
              paragraph.variant === 'session_plan_short_essay'
                ? 'session-plan-item-1'
                : 'short-essay-item-1',
            label: 'Title 01',
            placeholder: ph,
            bodyText: paragraph.bodyText,
          },
        ]
  const showItemTitle = items.length >= 2 ? true : (paragraph.showItemTitle ?? false)
  return (
    <div className="form-editor-body">
      {items.map((item, index) => (
        <div key={item.id} className="form-document-preview-paragraph__body-text" style={{ marginBottom: 12 }}>
          {showItemTitle ? (
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              {item.label ?? `Title ${String(index + 1).padStart(2, '0')}`}
            </div>
          ) : null}
          <div>{safeTrim(item.bodyText) || item.placeholder || ph}</div>
        </div>
      ))}
    </div>
  )
}

function SurveyTitleDocumentReadonly({
  paragraph,
  showWritingPeriod = true,
}: {
  paragraph: TitleWithPeriodParagraph
  showWritingPeriod?: boolean
}) {
  /** 카드 타이틀에 `surveyTitle`이 오르므로 본문에는 설명·기간만 */
  const bits: string[] = []
  const desc = safeTrim(paragraph.surveyDescription)
  if (desc.length > 0) bits.push(desc)
  if (showWritingPeriod && paragraph.showWritingPeriodOnForm) {
    const a = paragraph.startAt ? dayjs(paragraph.startAt).format('YYYY-MM-DD') : '—'
    const b = paragraph.endAt ? dayjs(paragraph.endAt).format('YYYY-MM-DD') : '—'
    bits.push(`작성 기간: ${a} ~ ${b}`)
  }
  if (bits.length === 0) return null
  return <div className="form-document-preview-paragraph__body-text">{bits.join('\n\n')}</div>
}

function renderBody(
  p: WritingFormParagraph,
  _allParagraphs: WritingFormParagraph[],
  _editorKind: FormEditorKind,
  paragraphBodyOptions?: RenderFormParagraphBodyOptions,
  renderMode: FormDocumentPreviewRenderMode = 'card',
  showWritingPeriod = true
): ReactNode {
  switch (p.variant) {
    case 'survey_title_with_period':
      return (
        <SurveyTitleDocumentReadonly
          paragraph={p as TitleWithPeriodParagraph}
          showWritingPeriod={showWritingPeriod}
        />
      )
    case 'agreement_explanation_text': {
      const ph = safeTrim(p.bodyPlaceholder) || '텍스트를 작성해 주세요'
      const text = safeTrim(p.bodyText) || ph
      return <div className="form-document-preview-paragraph__body-text">{text}</div>
    }
    case 'horizontal_table':
      return (
        <HorizontalTableParagraphBody
          paragraph={normalizeHorizontalTableParagraph(p as HorizontalTableParagraph)}
          onChange={noopOnParagraphChange}
          isEditMode={false}
          tableCanvasInteractive={false}
          paymentStatementBasicInfoValues={paragraphBodyOptions?.paymentStatementBasicInfoValues}
          lectureFeeCalculationValues={paragraphBodyOptions?.lectureFeeCalculationValues}
          paymentStatementCalculationLines={paragraphBodyOptions?.paymentStatementCalculationLines}
          paymentStatementDisplayMode={
            paragraphBodyOptions?.paymentStatementDisplayMode ??
            (renderMode === 'contentOnly' ? 'document' : undefined)
          }
          programApplicationFormInstitution={paragraphBodyOptions?.programApplicationFormInstitution}
        />
      )
    case 'ujat_journal_education_info':
      return (
        <UjatJournalEducationInfo
          paragraph={p as UjatJournalEducationInfoParagraph}
          onChange={noopOnParagraphChange}
          isEditMode={false}
          autofill={paragraphBodyOptions?.ujatJournalEducationInfoAutofill}
        />
      )
    case 'lecture_report_program_progress':
      return (
        <LectureReportProgramProgress
          paragraph={p as LectureReportProgramProgressParagraph}
          onChange={noopOnParagraphChange}
          isEditMode={false}
        />
      )
    case 'vertical_table':
      return <VerticalTableParagraphBody paragraph={p} onChange={noopOnParagraphChange} isEditMode={false} />
    case 'multiple_choice':
      return <DocumentMultipleChoiceReadonly paragraph={p as MultipleChoiceParagraph} />
    case 'short_essay':
      return <DocumentShortEssayReadonly paragraph={p as ShortEssayParagraph} />
    case 'session_plan_short_essay':
      return <DocumentShortEssayReadonly paragraph={p as SessionPlanShortEssayParagraph} />
    case 'subjective':
      return (
        <DocumentShortEssayReadonly
          paragraph={subjectiveParagraphToShortEssayView(p as SubjectiveParagraph)}
        />
      )
    case 'system':
      if (isAgreementLockedSystemParagraph(p)) {
        return (
          <ExplanationSystem
            paragraph={p}
            onChange={noopOnParagraphChange}
            isEditMode={false}
            displayMode="authoring"
          />
        )
      }
      return null
    case 'user_profile':
      return <UserProfileParagraphBody paragraph={p} onChange={noopOnParagraphChange} isEditMode={false} />
    case 'score_select':
      return <ScoreSelectParagraphBody paragraph={p} onChange={noopOnParagraphChange} isEditMode={false} />
    case 'dropdown':
      return <Dropdown paragraph={p} onChange={noopOnParagraphChange} isEditMode={false} />
    case 'date':
      return (
        <DateField
          paragraph={p}
          isCardSelected={false}
          isBodyInteractive={false}
          paragraphInteractionMode="user"
        />
      )
    case 'time':
      return (
        <TimeField
          paragraph={p}
          isCardSelected={false}
          isBodyInteractive={false}
          paragraphInteractionMode="user"
        />
      )
    case 'star_rate':
      return (
        <StarRate
          paragraph={p}
          onChange={noopOnParagraphChange}
          isCardSelected={false}
          isBodyInteractive={false}
          paragraphInteractionMode="user"
        />
      )
    case 'scale_type':
      return (
        <ScaleType
          paragraph={p}
          onChange={noopOnParagraphChange}
          isCardSelected={false}
          isBodyInteractive={false}
          paragraphInteractionMode="user"
        />
      )
    case 'user_info':
      return <UserInfo paragraph={p} onChange={noopOnParagraphChange} isEditMode={false} />
    case 'file_attachment':
      return <FileAttachment paragraph={p} onChange={noopOnParagraphChange} isEditMode={false} />
    case 'closing': {
      const c = p as ClosingParagraph
      return <div className="form-document-preview-paragraph__body-text">{safeTrim(c.body) || ' '}</div>
    }
    default:
      return null
  }
}

export interface FormDocumentPreviewParagraphProps {
  paragraph: WritingFormParagraph
  allParagraphs: WritingFormParagraph[]
  titleNumbering: FormTitleNumberingStyle
  editorKind: FormEditorKind
  overflow?: boolean
  paragraphBodyOptions?: RenderFormParagraphBodyOptions
  renderMode?: FormDocumentPreviewRenderMode
  style?: CSSProperties
}

export function FormDocumentPreviewParagraph({
  paragraph,
  allParagraphs,
  titleNumbering,
  editorKind,
  overflow = false,
  paragraphBodyOptions,
  renderMode = 'card',
  style,
}: FormDocumentPreviewParagraphProps) {
  const displayTitle = getFormParagraphDisplayTitle(allParagraphs, paragraph, titleNumbering)
  const viewModel = getDocumentPreviewParagraphViewModel(paragraph, displayTitle, renderMode)
  const { title, description } = readOnlyTitleBlock(
    displayTitle,
    viewModel.description
  )

  if (renderMode === 'card' && paragraph.kind === 'description' && paragraph.variant === 'closing') {
    const c = paragraph as ClosingParagraph
    const head = readOnlyTitleBlock(displayTitle, undefined)
    return (
      <div
        className={[
          'form-document-preview-paragraph',
          'paragraph-card',
          overflow ? 'form-document-preview-paragraph--overflow' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        data-paragraph-id={paragraph.id}
        style={style}
      >
        <div className="paragraph-card__header">
          <div className="paragraph-card__title-block">{head.title}</div>
        </div>
        <div className="paragraph-card__slot">
          <div className="form-document-preview-paragraph__body-text">{safeTrim(c.body) || ' '}</div>
        </div>
      </div>
    )
  }

  const body = renderBody(
    paragraph,
    allParagraphs,
    editorKind,
    paragraphBodyOptions,
    renderMode,
    viewModel.showWritingPeriod
  )

  if (renderMode === 'contentOnly') {
    return (
      <div
        className={[
          'form-document-preview-paragraph',
          'form-document-preview-paragraph--content-only',
          viewModel.isClosing ? 'form-document-preview-paragraph--content-only-closing' : '',
          viewModel.isClosingSignature ? 'form-document-preview-paragraph--content-only-closing-signature' : '',
          overflow ? 'form-document-preview-paragraph--overflow' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        data-paragraph-id={paragraph.id}
        style={style}
      >
        {viewModel.showHeader ? (
          <div className="form-document-preview-paragraph__content-header">
            <div className="form-document-preview-paragraph__title-text">{viewModel.title}</div>
            {description != null ? (
              <div className="form-document-preview-paragraph__description-text">{description}</div>
            ) : null}
          </div>
        ) : null}
        <div className="form-document-preview-paragraph__content-slot">{body}</div>
      </div>
    )
  }

  return (
    <div
      className={[
        'form-document-preview-paragraph',
        overflow ? 'form-document-preview-paragraph--overflow' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-paragraph-id={paragraph.id}
      style={style}
    >
      <ParagraphCard title={title} description={description}>
        {body}
      </ParagraphCard>
    </div>
  )
}
