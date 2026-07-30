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
  UserInfoParagraph,
  WritingFormParagraph,
  FileAttachmentParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import {
  isAgreementLockedSystemParagraph,
  normalizeHorizontalTableParagraph,
  type HorizontalTableParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import type { FormDocumentPreviewRenderMode } from '@/features/template/lib/a4-document-preview'
import { getDocumentPreviewParagraphViewModel } from '@/features/template/lib/a4-document-preview'
import { isAgreementAdminProxyConfirmHostId } from '@/features/template/lib/agreement-admin-proxy-confirm-paragraphs'
import { resolveParagraphTitleRequiredMark } from '@/features/template/lib/paragraph-required-mark'
import { getFormParagraphDisplayTitle } from '@/features/template/lib/form-title-numbering'
import { ParagraphCard } from '@/features/template/ui/paragraph/shared/paragraph-card'
import { ExplanationSystem } from '@/features/template/ui/paragraph/explanation/system'
import { AgreementAdminProxyConfirmBlock } from '@/features/template/ui/paragraph/explanation/agreement-admin-proxy-confirm-block'
import { StaticDescriptionLines } from '@/features/template/ui/paragraph/explanation/static-description-lines'
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
import {
  getUserInfoPreviewSelectedEntries,
  UserInfo,
  UserInfoPreviewTable,
} from '@/features/template/ui/paragraph/single-item/user-info'
import { FileAttachment } from '@/features/template/ui/paragraph/single-item/file-attachment'
import { DocumentEducationPhotosReadonly } from '@/features/template/ui/document-preview/document-education-photos-readonly'
import { DocumentSessionPlanShortEssayReadonly } from '@/features/template/ui/document-preview/document-session-plan-short-essay-readonly'
import { LectureReportProgramProgress } from '@/features/template/ui/paragraph/single-item/lecture-report-program-progress'
import { UjatJournalEducationInfo } from '@/features/template/ui/paragraph/single-item/ujat-journal-education-info'
import { IdTypeWithInput } from '@/features/template/ui/paragraph/single-item/id-type-with-input'
import { FormParagraphSectionDescription } from '@/features/template/ui/shared/form-paragraph-section-description'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import '@/features/template/ui/paragraph/shared/paragraph-card.css'
import '@/features/template/ui/form-editor/form-editor.css'
import type { RenderFormParagraphBodyOptions } from '@/features/template/ui/paragraph/renderers/render-form-paragraph-body'
import './form-document-preview-body.css'

function noopOnParagraphChange<T>(_next: T): void {}

function safeTrim(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

const HIDDEN_PREVIEW_DESCRIPTION_TEXTS = new Set(['설명 입력', '설명을 입력해 주세요'])

function normalizePreviewDescription(value: unknown): string {
  const trimmed = safeTrim(value)
  if (trimmed.length === 0) return ''
  return HIDDEN_PREVIEW_DESCRIPTION_TEXTS.has(trimmed) ? '' : trimmed
}

function readOnlyTitleBlock(
  displayTitle: string,
  description?: string
): { title: ReactNode; description?: ReactNode } {
  const trimmedDescription = normalizePreviewDescription(description)
  return {
    title: <span className="form-document-preview-paragraph__title-text">{displayTitle}</span>,
    description:
      trimmedDescription.length > 0 ? (
        <FormParagraphSectionDescription
          surface="templateAuthoring"
          className="form-document-preview-paragraph__description-text"
        >
          {trimmedDescription}
        </FormParagraphSectionDescription>
      ) : undefined,
  }
}

function ContentOnlyParagraphHeader({
  displayTitle,
  description,
  requiredMark,
}: {
  displayTitle: string
  description?: string
  requiredMark?: boolean
}) {
  const { title, description: descriptionNode } = readOnlyTitleBlock(displayTitle, description)
  return (
    <div className="form-document-preview-paragraph__content-header">
      <div className="form-document-preview-paragraph__title-row">
        {title}
        {requiredMark ? (
          <span className="form-document-preview-paragraph__required" aria-hidden>
            *
          </span>
        ) : null}
      </div>
      {descriptionNode}
    </div>
  )
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

function DocumentShortEssayTableReadonly({ paragraph }: { paragraph: ShortEssayParagraph }) {
  const items = paragraph.items && paragraph.items.length > 0 ? paragraph.items : []
  return (
    <div className="form-editor-body">
      <table className="form-document-short-essay-table">
        <thead>
          <tr>
            {items.map(item => (
              <th key={item.id}>{item.label ?? ''}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {items.map(item => (
              <td key={item.id}>{safeTrim(item.bodyText) || ''}</td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  )
}

function DocumentTextInputBlockReadonly({
  item,
  fallbackLabel,
  fallbackText,
}: {
  item: { id: string; label?: string; placeholder?: string; bodyText: string }
  fallbackLabel: string
  fallbackText: string
}) {
  return (
    <table className="form-document-text-input-table">
      <tbody>
        <tr>
          <th scope="row">{safeTrim(item.label) || fallbackLabel}</th>
        </tr>
        <tr>
          <td>{safeTrim(item.bodyText) || item.placeholder || fallbackText}</td>
        </tr>
      </tbody>
    </table>
  )
}

function DocumentShortEssayReadonly({
  paragraph,
  renderMode = 'card',
}: {
  paragraph: ShortEssayParagraph | SessionPlanShortEssayParagraph
  renderMode?: FormDocumentPreviewRenderMode
}) {
  const ph =
    safeTrim(paragraph.bodyPlaceholder) ||
    (paragraph.variant === 'session_plan_short_essay'
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
  if (renderMode === 'contentOnly' && paragraph.variant === 'session_plan_short_essay') {
    return (
      <DocumentSessionPlanShortEssayReadonly
        paragraph={paragraph as SessionPlanShortEssayParagraph}
      />
    )
  }
  if (renderMode === 'contentOnly') {
    return (
      <div className="form-editor-body form-document-text-input-blocks">
        {items.map((item, index) => (
          <DocumentTextInputBlockReadonly
            key={item.id}
            item={item}
            fallbackLabel={`Title ${String(index + 1).padStart(2, '0')}`}
            fallbackText={ph}
          />
        ))}
      </div>
    )
  }
  return (
    <div className="form-editor-body">
      {items.map((item, index) => (
        <div
          key={item.id}
          className="form-document-preview-paragraph__body-text"
          style={{ marginBottom: 12 }}
        >
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
  const desc = normalizePreviewDescription(paragraph.surveyDescription)
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
  if (p.kind === 'single_item' && p.variant === 'file_attachment') {
    if (renderMode === 'contentOnly') {
      return <DocumentEducationPhotosReadonly paragraph={p as FileAttachmentParagraph} />
    }
    return <FileAttachment paragraph={p} onChange={noopOnParagraphChange} isEditMode={false} />
  }

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
      const body = safeTrim(p.bodyText)
      return (
        <div className="form-editor-body explanation-text">
          <div
            className={
              body
                ? 'form-document-preview-paragraph__body-text form-document-preview-paragraph__body-text--explanation-filled'
                : 'form-document-preview-paragraph__body-text form-document-preview-paragraph__body-text--explanation-placeholder'
            }
          >
            {body || ph}
          </div>
          {p.showBottomConsent === true || p.id === 'agreement-portrait-intro' ? (
            <CmsRadioGroup
              className="form-editor-table-bottom-consent"
              size="large"
              value={p.bottomConsent ?? 'agree'}
              style={{ pointerEvents: 'none' }}
            >
              <CmsRadio value="agree">동의</CmsRadio>
              <CmsRadio value="disagree">동의하지 않음</CmsRadio>
            </CmsRadioGroup>
          ) : null}
        </div>
      )
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
          programApplicationFormInstitution={
            paragraphBodyOptions?.programApplicationFormInstitution
          }
          programApplicationFormEconomyInstitution={
            paragraphBodyOptions?.programApplicationFormEconomyInstitution
          }
          programApplicationFormTrainedTeachersInstitution={
            paragraphBodyOptions?.programApplicationFormTrainedTeachersInstitution
          }
          programApplicationFormGeminiInstitution={
            paragraphBodyOptions?.programApplicationFormGeminiInstitution
          }
          programApplicationFormGeminiInstructor={
            paragraphBodyOptions?.programApplicationFormGeminiInstructor
          }
          ujatProgramApplicationFormVolunteer={
            paragraphBodyOptions?.ujatProgramApplicationFormVolunteer
          }
          applicantRecruitFormInstitution={paragraphBodyOptions?.applicantRecruitFormInstitution}
          showInstitutionApplicationLimits={paragraphBodyOptions?.showInstitutionApplicationLimits}
          applicantRecruitInstitutionLayoutVariant={
            paragraphBodyOptions?.applicantRecruitInstitutionLayoutVariant
          }
          applicantRecruitInstitutionDefaults={
            paragraphBodyOptions?.applicantRecruitInstitutionDefaults
          }
          economyRecruitFormInstitution={paragraphBodyOptions?.economyRecruitFormInstitution}
          trainedTeachersRecruitFormInstitution={
            paragraphBodyOptions?.trainedTeachersRecruitFormInstitution
          }
          applicantRecruitFormIndividual={paragraphBodyOptions?.applicantRecruitFormIndividual}
          geminiRecruitForm={paragraphBodyOptions?.geminiRecruitForm}
          programApplicationFormInstructor={paragraphBodyOptions?.programApplicationFormInstructor}
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
      return (
        <VerticalTableParagraphBody
          paragraph={p}
          onChange={noopOnParagraphChange}
          isEditMode={false}
        />
      )
    case 'multiple_choice':
      return <DocumentMultipleChoiceReadonly paragraph={p as MultipleChoiceParagraph} />
    case 'short_essay': {
      const shortEssayP = p as ShortEssayParagraph
      if (renderMode === 'contentOnly' && (shortEssayP.items?.length ?? 0) >= 2) {
        return <DocumentShortEssayTableReadonly paragraph={shortEssayP} />
      }
      return <DocumentShortEssayReadonly paragraph={shortEssayP} renderMode={renderMode} />
    }
    case 'session_plan_short_essay':
      return (
        <DocumentShortEssayReadonly
          paragraph={p as SessionPlanShortEssayParagraph}
          renderMode={renderMode}
        />
      )
    case 'subjective':
      return (
        <DocumentShortEssayReadonly
          paragraph={subjectiveParagraphToShortEssayView(p as SubjectiveParagraph)}
          renderMode={renderMode}
        />
      )
    case 'system':
      if (isAgreementLockedSystemParagraph(p)) {
        return (
          <ExplanationSystem
            paragraph={p}
            onChange={noopOnParagraphChange}
            isEditMode={false}
            displayMode={renderMode === 'contentOnly' ? 'document' : 'authoring'}
          />
        )
      }
      return null
    case 'user_profile':
      return (
        <UserProfileParagraphBody
          paragraph={p}
          onChange={noopOnParagraphChange}
          isEditMode={false}
        />
      )
    case 'score_select':
      return (
        <ScoreSelectParagraphBody
          paragraph={p}
          onChange={noopOnParagraphChange}
          isEditMode={false}
        />
      )
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
    case 'user_info': {
      const ui = p as UserInfoParagraph
      if (renderMode === 'contentOnly') {
        return (
          <div className="form-editor-body">
            <UserInfoPreviewTable
              selectedEntries={getUserInfoPreviewSelectedEntries(ui)}
              skin="a4Document"
              previewValues={paragraphBodyOptions?.userInfoPreviewValues}
            />
          </div>
        )
      }
      return (
        <UserInfo
          paragraph={ui}
          onChange={noopOnParagraphChange}
          isEditMode={false}
          layout="previewTable"
          previewValues={paragraphBodyOptions?.userInfoPreviewValues}
        />
      )
    }
    case 'static_description_lines':
      if (p.kind !== 'description' || p.variant !== 'static_description_lines') return null
      return <StaticDescriptionLines paragraph={p} />
    case 'id_type_with_input':
      if (p.kind !== 'single_item' || p.variant !== 'id_type_with_input') return null
      return <IdTypeWithInput paragraph={p} onChange={noopOnParagraphChange} isEditMode={false} />
    case 'closing': {
      const c = p as ClosingParagraph
      if (
        paragraphBodyOptions?.agreementAdminProxyConfirm === true &&
        isAgreementAdminProxyConfirmHostId(c.id)
      ) {
        return (
          <AgreementAdminProxyConfirmBlock
            consentText={c.body}
            memberName={paragraphBodyOptions.agreementSystemParticipantName ?? ''}
            now={paragraphBodyOptions.agreementSystemNow}
          />
        )
      }
      return (
        <div className="form-document-preview-paragraph__body-text">{safeTrim(c.body) || ' '}</div>
      )
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
  /** 작성 화면에서 선택한 단락과 동기화된 강조 */
  isAuthoringSyncFocused?: boolean
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
  isAuthoringSyncFocused = false,
}: FormDocumentPreviewParagraphProps) {
  const displayTitle = getFormParagraphDisplayTitle(allParagraphs, paragraph, titleNumbering)
  const viewModel = getDocumentPreviewParagraphViewModel(paragraph, displayTitle, renderMode)
  const { title, description } = readOnlyTitleBlock(displayTitle, viewModel.description)

  if (
    renderMode === 'card' &&
    paragraph.kind === 'description' &&
    paragraph.variant === 'closing'
  ) {
    const c = paragraph as ClosingParagraph
    if (
      paragraphBodyOptions?.agreementAdminProxyConfirm === true &&
      isAgreementAdminProxyConfirmHostId(c.id)
    ) {
      return (
        <div
          className={[
            'form-document-preview-paragraph',
            'paragraph-card',
            'agreement-admin-proxy-confirm-card',
            overflow ? 'form-document-preview-paragraph--overflow' : '',
            isAuthoringSyncFocused ? 'form-document-preview-paragraph--authoring-sync-focus' : '',
          ]
            .filter(Boolean)
            .join(' ')}
          data-paragraph-id={paragraph.id}
          style={style}
        >
          <div className="paragraph-card__slot">
            <AgreementAdminProxyConfirmBlock
              consentText={c.body}
              memberName={paragraphBodyOptions.agreementSystemParticipantName ?? ''}
              now={paragraphBodyOptions.agreementSystemNow}
            />
          </div>
        </div>
      )
    }
    const head = readOnlyTitleBlock(displayTitle, undefined)
    return (
      <div
        className={[
          'form-document-preview-paragraph',
          'paragraph-card',
          overflow ? 'form-document-preview-paragraph--overflow' : '',
          isAuthoringSyncFocused ? 'form-document-preview-paragraph--authoring-sync-focus' : '',
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
          <div className="form-document-preview-paragraph__body-text">
            {safeTrim(c.body) || ' '}
          </div>
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
    const isFileAttachment =
      paragraph.kind === 'single_item' && paragraph.variant === 'file_attachment'

    return (
      <div
        className={[
          'form-document-preview-paragraph',
          'form-document-preview-paragraph--content-only',
          isFileAttachment ? 'form-document-preview-paragraph--file-attachment' : '',
          viewModel.isClosing ? 'form-document-preview-paragraph--content-only-closing' : '',
          viewModel.isClosingSignature
            ? 'form-document-preview-paragraph--content-only-closing-signature'
            : '',
          overflow ? 'form-document-preview-paragraph--overflow' : '',
          isAuthoringSyncFocused ? 'form-document-preview-paragraph--authoring-sync-focus' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        data-paragraph-id={paragraph.id}
        style={style}
      >
        {viewModel.showHeader ? (
          <ContentOnlyParagraphHeader
            displayTitle={displayTitle}
            description={viewModel.description}
            requiredMark={resolveParagraphTitleRequiredMark(paragraph)}
          />
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
        isAuthoringSyncFocused ? 'form-document-preview-paragraph--authoring-sync-focus' : '',
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
