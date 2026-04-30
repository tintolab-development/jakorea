import { Form } from 'antd'
import { FormEditorMultipleChoiceItems } from '@/features/template/ui/form-editor/form-editor-multiple-choice-items'
import { FormEditorScaleTypeItems } from '@/features/template/ui/form-editor/form-editor-scale-type-items'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import type {
  DateParagraph,
  FileAttachmentParagraph,
  FormEditorKind,
  FormTitleNumberingStyle,
  HorizontalTableParagraph,
  HorizontalTableRowSelection,
  VerticalTableParagraph,
  MultipleChoiceItem,
  MultipleChoiceParagraph,
  ScaleTypeItem,
  ScaleTypeParagraph,
  ShortEssayParagraph,
  WritingFormDraft,
  WritingFormParagraph,
} from '@/features/template/model/writing-form-draft.schema'
import {
  createHorizontalTableParagraph,
  createVerticalTableParagraph,
  createDefaultMultipleChoiceItems,
  createDefaultScaleTypeItems,
  effectiveVerticalStageKinds,
  normalizeVerticalChoiceOptions,
  normalizeVerticalTableParagraph,
  verticalTableParagraphOutlineLabel,
  verticalTableParagraphWithChoiceOptions,
  FORM_EDITOR_MULTIPLE_CHOICE_ITEMS_FOCUS_ID,
  isAgreementLockedSystemParagraph,
  writingOutlineLabel,
} from '@/features/template/model/writing-form-draft.schema'
import { FormEditorHorizontalTableBodyFields } from '@/features/template/ui/form-editor/form-editor-horizontal-table-body-fields'
import { FormEditorHorizontalTableHeaderFields } from '@/features/template/ui/form-editor/form-editor-horizontal-table-header-fields'
import { FormEditorOptionListEditor } from '@/features/template/ui/form-editor/form-editor-option-list-editor'
import { FormEditorVerticalTableRowFields } from '@/features/template/ui/form-editor/form-editor-vertical-table-row-fields'
import './form-editor.css'

const TITLE_NUMBERING_OPTIONS: { value: FormTitleNumberingStyle; label: string }[] = [
  { value: 'numeric', label: '1, 2, 3' },
  { value: 'alpha', label: 'A, B, C' },
  { value: 'q_repeat', label: 'Q, Q, Q' },
  { value: 'q123', label: 'Q1, Q2, Q3' },
  { value: 'none', label: '미선택' },
]

type ParagraphKindSelectValue = 'single_item' | 'description' | 'table'
type SingleItemDetailSelectValue =
  | 'subjective'
  | 'multiple_choice'
  | 'date_only'
  | 'time_only'
  | 'star_rate'
  | 'scale_type'
  | 'user_info'
  | 'file_attachment'
type TableDetailSelectValue = 'horizontal_table' | 'vertical_table'
type DescriptionDetailSelectValue = 'title' | 'text' | 'closing'
type DetailSelectValue =
  | SingleItemDetailSelectValue
  | TableDetailSelectValue
  | DescriptionDetailSelectValue

const PARAGRAPH_KIND_OPTIONS: { value: ParagraphKindSelectValue; label: string }[] = [
  { value: 'single_item', label: '단일항목' },
  { value: 'description', label: '설명글' },
  { value: 'table', label: '테이블' },
]
const SINGLE_ITEM_DETAIL_OPTIONS: { value: SingleItemDetailSelectValue; label: string }[] = [
  { value: 'subjective', label: '주관식형' },
  { value: 'multiple_choice', label: '객관식형' },
  { value: 'date_only', label: '날짜형' },
  { value: 'time_only', label: '시간형' },
  { value: 'star_rate', label: '별점형' },
  { value: 'scale_type', label: '점수 선택형' },
  { value: 'user_info', label: '사용자 정보형' },
  { value: 'file_attachment', label: '파일 첨부형' },
]
const DESCRIPTION_DETAIL_OPTIONS: { value: DescriptionDetailSelectValue; label: string }[] = [
  { value: 'title', label: '제목형' },
  { value: 'text', label: '텍스트형' },
  { value: 'closing', label: '마무리글형' },
]
const TABLE_DETAIL_OPTIONS: { value: TableDetailSelectValue; label: string }[] = [
  { value: 'horizontal_table', label: '가로형' },
  { value: 'vertical_table', label: '세로형' },
]

function paragraphKindLabel(p: WritingFormParagraph): string {
  if (p.kind === 'description') return '설명글'
  if (p.kind === 'single_item' && p.variant === 'agreement_explanation_text') return '설명글'
  if (p.kind === 'single_item' && p.variant === 'horizontal_table') {
    const t = p as HorizontalTableParagraph
    return t.tableFlavor === 'field' ? '테이블_가로형 (필드 형)' : '테이블_가로형'
  }
  if (p.kind === 'single_item' && p.variant === 'vertical_table') {
    const vt = normalizeVerticalTableParagraph(p as VerticalTableParagraph)
    return verticalTableParagraphOutlineLabel(vt.verticalTableFlavor)
  }
  return '단일항목'
}

function paragraphVariantLabel(p: WritingFormParagraph): string {
  if (p.kind === 'description' && p.variant === 'system') {
    if (p.systemPreset === 'agreement_date') return '날짜 유형'
    if (p.systemPreset === 'agreement_signature') return '서명란 유형'
  }
  if (p.kind === 'single_item' && p.variant === 'horizontal_table') {
    const t = p as HorizontalTableParagraph
    return t.tableFlavor === 'field' ? '테이블_가로형 (필드 형)' : '테이블_가로형'
  }
  if (p.kind === 'single_item' && p.variant === 'vertical_table') {
    const vt = normalizeVerticalTableParagraph(p as VerticalTableParagraph)
    return verticalTableParagraphOutlineLabel(vt.verticalTableFlavor)
  }
  switch (p.variant) {
    case 'survey_title_with_period':
      return '제목형'
    case 'user_profile':
      return '사용자 정보형'
    case 'score_select':
      return '점수 선택형'
    case 'subjective':
      return '주관식형'
    case 'agreement_explanation_text':
      return '텍스트형'
    case 'closing':
      return '마무리글형'
    case 'system':
      return '기타'
    case 'short_essay':
      return '주관식형'
    case 'multiple_choice':
      return '객관식형'
    case 'dropdown':
      return '드롭다운형'
    case 'date':
      return '날짜형'
    case 'time':
      return '시간형'
    case 'star_rate':
      return '별점형'
    case 'scale_type':
      return '점수 선택형'
    case 'user_info':
      return '사용자 정보형'
    case 'file_attachment':
      return '파일 첨부형'
  }
}

function paragraphKindSelectValue(p: WritingFormParagraph): ParagraphKindSelectValue {
  if (p.kind === 'single_item' && (p.variant === 'horizontal_table' || p.variant === 'vertical_table')) {
    return 'table'
  }
  if (p.kind === 'description' || (p.kind === 'single_item' && p.variant === 'agreement_explanation_text')) {
    return 'description'
  }
  return 'single_item'
}

function paragraphDetailSelectValue(p: WritingFormParagraph): DetailSelectValue {
  if (p.kind === 'single_item' && p.variant === 'horizontal_table') return 'horizontal_table'
  if (p.kind === 'single_item' && p.variant === 'vertical_table') return 'vertical_table'
  if (p.kind === 'description' && p.variant === 'survey_title_with_period') return 'title'
  if (p.kind === 'description' && p.variant === 'closing') return 'closing'
  if (p.kind === 'single_item' && p.variant === 'agreement_explanation_text') return 'text'
  if (p.kind === 'single_item' && p.variant === 'short_essay') return 'subjective'
  if (p.kind === 'single_item' && p.variant === 'multiple_choice') return 'multiple_choice'
  if (p.kind === 'single_item' && p.variant === 'date') return 'date_only'
  if (p.kind === 'single_item' && p.variant === 'time') return 'time_only'
  if (p.kind === 'single_item' && p.variant === 'star_rate') return 'star_rate'
  if (p.kind === 'single_item' && p.variant === 'scale_type') return 'scale_type'
  if (p.kind === 'single_item' && p.variant === 'user_info') return 'user_info'
  if (p.kind === 'single_item' && p.variant === 'file_attachment') return 'file_attachment'
  if (p.kind === 'description') return 'text'
  return 'subjective'
}

function preserveParagraphCommonFields<T extends WritingFormParagraph>(
  next: T,
  prev: WritingFormParagraph
): T {
  const title = prev.paragraphTitle.trim()
  const prevAnswerRequired =
    prev.kind === 'single_item' ? (prev.answerRequired ?? prev.requiredMark) : prev.requiredMark
  return {
    ...next,
    requiredMark: prev.requiredMark,
    paragraphTitle: title === '' ? next.paragraphTitle : prev.paragraphTitle,
    paragraphDescription: prev.paragraphDescription,
    participatesInTitleNumbering: prev.participatesInTitleNumbering,
    ...(next.kind === 'single_item' ? { answerRequired: prevAnswerRequired } : {}),
  }
}

function createShortEssayDefault(id: string): ShortEssayParagraph {
  return {
    id,
    kind: 'single_item',
    variant: 'short_essay',
    requiredMark: true,
    paragraphTitle: '주관식형',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    answerRequired: true,
    showItemTitle: false,
    items: [{ id: 'short-essay-item-1', label: 'Title 01', placeholder: '답변을 입력해 주세요', bodyText: '' }],
    bodyPlaceholder: '답변을 입력해 주세요',
    bodyText: '',
  }
}

function createMultipleChoiceDefault(id: string): MultipleChoiceParagraph {
  return {
    id,
    kind: 'single_item',
    variant: 'multiple_choice',
    requiredMark: true,
    paragraphTitle: '객관식형',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    answerRequired: true,
    allowMultiple: false,
    items: createDefaultMultipleChoiceItems().map((it: MultipleChoiceItem) => ({ ...it })),
    selectedPreviewSingleId: null,
    selectedPreviewMultipleIds: [],
  }
}

function createDateDefault(id: string): DateParagraph {
  return {
    id,
    kind: 'single_item',
    variant: 'date',
    requiredMark: true,
    paragraphTitle: '날짜형',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    answerRequired: true,
    periodEnabled: false,
  }
}

function createTimeDefault(id: string): WritingFormParagraph {
  return {
    id,
    kind: 'single_item',
    variant: 'time',
    requiredMark: true,
    paragraphTitle: '시간형',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    answerRequired: true,
  }
}

function createStarRateDefault(id: string): WritingFormParagraph {
  return {
    id,
    kind: 'single_item',
    variant: 'star_rate',
    requiredMark: true,
    paragraphTitle: '별점형',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    answerRequired: true,
    selectedPreviewStars: null,
  }
}

function createScaleTypeDefault(id: string): ScaleTypeParagraph {
  return {
    id,
    kind: 'single_item',
    variant: 'scale_type',
    requiredMark: true,
    paragraphTitle: '점수 선택형',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    answerRequired: true,
    items: createDefaultScaleTypeItems().map((it: ScaleTypeItem) => ({ ...it })),
    selectedPreviewItemId: null,
  }
}

function createUserInfoDefault(id: string): WritingFormParagraph {
  return {
    id,
    kind: 'single_item',
    variant: 'user_info',
    requiredMark: true,
    paragraphTitle: '사용자 정보형',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    answerRequired: true,
    userFields: [
      { key: 'name', label: '이름' },
      { key: 'gender', label: '성별' },
      { key: 'birthDate', label: '생년월일' },
      { key: 'phone', label: '연락처' },
      { key: 'email', label: '이메일' },
      { key: 'addressRegion', label: '자택 주소지(지역)' },
      { key: 'addressDetail', label: '자택 주소지(상세)' },
      { key: 'affiliation', label: '소속' },
      { key: 'applicantType', label: '신청자 유형' },
      { key: 'programName', label: '프로그램명' },
      { key: 'period', label: '교육 진행 일정(진행 기간)' },
      { key: 'institutionName', label: '기관명' },
      { key: 'institutionRegion', label: '기관 소재지(시군구)' },
      { key: 'educationTarget', label: '교육 대상(담당 대상)' },
      { key: 'educationGrade', label: '교육 학년(담당 학년)' },
      { key: 'teamName', label: '팀 명' },
      { key: 'teamPartnerName', label: '팀원/파트너 명' },
    ],
    selectedUserFieldKeys: [],
  }
}

function createFileAttachmentDefault(id: string): FileAttachmentParagraph {
  return {
    id,
    kind: 'single_item',
    variant: 'file_attachment',
    requiredMark: true,
    paragraphTitle: '파일 첨부형',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    answerRequired: true,
  }
}

function createDescriptionTitleDefault(id: string): WritingFormParagraph {
  return {
    id,
    kind: 'description',
    variant: 'survey_title_with_period',
    requiredMark: true,
    paragraphTitle: '',
    paragraphDescription: '',
    participatesInTitleNumbering: false,
    surveyTitle: '',
    surveyDescription: '',
    periodMode: 'immediate',
    startAt: null,
    endAt: null,
    showWritingPeriodOnForm: false,
  }
}

function createDescriptionTextDefault(id: string): WritingFormParagraph {
  return {
    id,
    kind: 'single_item',
    variant: 'agreement_explanation_text',
    requiredMark: true,
    paragraphTitle: '텍스트형',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    bodyPlaceholder: '텍스트를 작성해 주세요',
    bodyText: '',
    answerRequired: true,
  }
}

function createDescriptionClosingDefault(id: string): WritingFormParagraph {
  return {
    id,
    kind: 'description',
    variant: 'closing',
    requiredMark: false,
    paragraphTitle: '마무리글형',
    paragraphDescription: '',
    participatesInTitleNumbering: false,
    body: '',
  }
}

function convertParagraphByDetail(prev: WritingFormParagraph, detail: DetailSelectValue): WritingFormParagraph {
  const id = prev.id
  const keepTitle = (nextTitle: string) =>
    prev.paragraphTitle.trim() === '' ? nextTitle : prev.paragraphTitle
  switch (detail) {
    case 'horizontal_table':
      return preserveParagraphCommonFields(createHorizontalTableParagraph(id), prev)
    case 'vertical_table':
      return preserveParagraphCommonFields(createVerticalTableParagraph(id, 'text'), prev)
    case 'subjective':
      return preserveParagraphCommonFields(createShortEssayDefault(id), prev)
    case 'multiple_choice':
      return preserveParagraphCommonFields(createMultipleChoiceDefault(id), prev)
    case 'date_only':
      return preserveParagraphCommonFields(createDateDefault(id), prev)
    case 'time_only':
      return preserveParagraphCommonFields(createTimeDefault(id), prev)
    case 'star_rate':
      return preserveParagraphCommonFields(createStarRateDefault(id), prev)
    case 'scale_type':
      return preserveParagraphCommonFields(createScaleTypeDefault(id), prev)
    case 'user_info':
      return preserveParagraphCommonFields(createUserInfoDefault(id), prev)
    case 'file_attachment':
      return preserveParagraphCommonFields(createFileAttachmentDefault(id), prev)
    case 'title':
      return {
        ...createDescriptionTitleDefault(id),
        paragraphTitle: keepTitle(''),
        paragraphDescription: prev.paragraphDescription,
      }
    case 'text':
      return preserveParagraphCommonFields(createDescriptionTextDefault(id), prev)
    case 'closing':
      return {
        ...createDescriptionClosingDefault(id),
        paragraphTitle: keepTitle('마무리글형'),
        paragraphDescription: prev.paragraphDescription,
      }
    default:
      return prev
  }
}

export interface FormEditorRightPanelProps {
  draft: WritingFormDraft
  activeParagraphId: string | null
  onTitleNumberingChange: (style: FormTitleNumberingStyle) => void
  updateParagraph: (id: string, updater: (p: WritingFormParagraph) => WritingFormParagraph) => void
  editorKind?: FormEditorKind
  showTitleNumbering?: boolean
  singleItemListActiveItemId?: string | null
  horizontalTableRowSelection?: HorizontalTableRowSelection | null
  onHorizontalTableBodyRowDeleted?: (nextRowIndex: number) => void
  /** 테이블 세로형: 본문 행 선택 시 해당 행 인덱스 */
  verticalTableBodyRowSelection?: { paragraphId: string; row: number } | null
  /** 테이블 세로형: 행 삭제 후 포커스할 행 인덱스(이전 행) */
  onVerticalTableBodyRowDeleted?: (nextRowIndex: number) => void
  /** 템플릿 고정 단락 — 우측 커스텀 필드 편집 비활성 */
  structureLockedParagraphIds?: ReadonlySet<string>
}

export function FormEditorTitleNumberingField({
  value,
  onChange,
}: {
  value: FormTitleNumberingStyle
  onChange: (style: FormTitleNumberingStyle) => void
}) {
  return (
    <div className="form-editor-right-panel__field">
      <span className="form-editor-right-panel__label">타이틀 번호</span>
      <CmsSelect
        width="100%"
        className="form-editor-right-panel__select"
        value={value}
        options={TITLE_NUMBERING_OPTIONS}
        withAllOption={false}
        onChange={v => onChange(v as FormTitleNumberingStyle)}
      />
    </div>
  )
}

function FormEditorHorizontalTableCustomFields({
  paragraph,
  rowSelection,
  updateParagraph,
  onBodyRowDeleted,
}: {
  paragraph: HorizontalTableParagraph
  rowSelection: HorizontalTableRowSelection | null
  updateParagraph: FormEditorRightPanelProps['updateParagraph']
  onBodyRowDeleted?: (nextRowIndex: number) => void
}) {
  if (rowSelection?.area === 'header') {
    return (
      <FormEditorHorizontalTableHeaderFields
        paragraph={paragraph}
        paragraphId={paragraph.id}
        updateParagraph={updateParagraph}
      />
    )
  }

  if (rowSelection?.area !== 'body') return null

  const rowIndex = rowSelection.row
  const rowCount = Math.max(1, paragraph.dataRows.length)
  if (rowIndex < 0 || rowIndex >= rowCount) return null

  return (
    <FormEditorHorizontalTableBodyFields
      paragraph={paragraph}
      paragraphId={paragraph.id}
      rowIndex={rowIndex}
      updateParagraph={updateParagraph}
      onBodyRowDeleted={onBodyRowDeleted}
    />
  )
}

function FormEditorVerticalTableCustomFields({
  paragraph,
  rowSelection,
  updateParagraph,
  onBodyRowDeleted,
}: {
  paragraph: VerticalTableParagraph
  rowSelection: { paragraphId: string; row: number } | null
  updateParagraph: FormEditorRightPanelProps['updateParagraph']
  onBodyRowDeleted?: (nextRowIndex: number) => void
}) {
  const p = normalizeVerticalTableParagraph(paragraph)
  const selectedRow =
    rowSelection?.paragraphId === paragraph.id &&
    rowSelection.row >= 0 &&
    rowSelection.row < Math.max(1, p.rows.length)
      ? p.rows[rowSelection.row]
      : null
  const selectedRowHasChoiceStage =
    selectedRow != null
      ? effectiveVerticalStageKinds(selectedRow, p.verticalTableFlavor).some(
          k => k === 'single_choice' || k === 'multiple_choice'
        )
      : false
  const choiceFlavor =
    p.verticalTableFlavor === 'single_choice' ||
    p.verticalTableFlavor === 'multiple_choice' ||
    selectedRowHasChoiceStage

  /** 파일첨부형: 우측 커스텀 필드 없음(th는 스키마 기본값·데이터만) */
  const rowFields =
    p.verticalTableFlavor !== 'file_attachment' &&
    rowSelection != null &&
    rowSelection.paragraphId === paragraph.id &&
    rowSelection.row >= 0 &&
    rowSelection.row < Math.max(1, p.rows.length) ? (
      <FormEditorVerticalTableRowFields
        paragraph={paragraph}
        paragraphId={paragraph.id}
        rowIndex={rowSelection.row}
        updateParagraph={updateParagraph}
        onBodyRowDeleted={onBodyRowDeleted}
      />
    ) : null

  const choiceOptionsEditor = choiceFlavor ? (
    <div className="form-editor-right-panel__field">
      <FormEditorOptionListEditor
        values={normalizeVerticalChoiceOptions(p.verticalChoiceOptions)}
        onChange={options =>
          updateParagraph(paragraph.id, cur => {
            if (cur.kind !== 'single_item' || cur.variant !== 'vertical_table') return cur
            return verticalTableParagraphWithChoiceOptions(cur as VerticalTableParagraph, options)
          })
        }
        addLabel="+ 항목 추가"
        addButtonIcon={false}
      />
    </div>
  ) : null

  if (!choiceFlavor && rowFields == null) return null

  return (
    <>
      {choiceOptionsEditor}
      {rowFields}
    </>
  )
}

export function FormEditorRightPanel({
  draft,
  activeParagraphId,
  onTitleNumberingChange,
  updateParagraph,
  editorKind: _editorKind = 'survey',
  showTitleNumbering = true,
  singleItemListActiveItemId,
  horizontalTableRowSelection = null,
  onHorizontalTableBodyRowDeleted,
  verticalTableBodyRowSelection = null,
  onVerticalTableBodyRowDeleted,
  structureLockedParagraphIds,
}: FormEditorRightPanelProps) {
  const active = draft.paragraphs.find(p => p.id === activeParagraphId) ?? null
  const structureLockedActive =
    activeParagraphId != null && (structureLockedParagraphIds?.has(activeParagraphId) ?? false)

  if (active != null && structureLockedActive) {
    return (
      <div className="form-editor-right-panel">
        {showTitleNumbering ? (
          <FormEditorTitleNumberingField
            value={draft.formSettings.titleNumbering}
            onChange={onTitleNumberingChange}
          />
        ) : null}
      </div>
    )
  }

  const outline =
    active && active.kind === 'description' && active.variant === 'closing'
      ? `${paragraphKindLabel(active)}_${paragraphVariantLabel(active)}`
      : active
        ? writingOutlineLabel(active)
        : ''

  const activeShortEssay =
    active && active.kind === 'single_item' && active.variant === 'short_essay'
      ? (active as ShortEssayParagraph)
      : null
  const activeMultipleChoice =
    active && active.kind === 'single_item' && active.variant === 'multiple_choice'
      ? (active as MultipleChoiceParagraph)
      : null
  const activeScaleType =
    active && active.kind === 'single_item' && active.variant === 'scale_type'
      ? (active as ScaleTypeParagraph)
      : null
  const activeKindValue = active ? paragraphKindSelectValue(active) : null
  const activeDetailValue = active ? paragraphDetailSelectValue(active) : null
  const activeKindLocked = active ? isAgreementLockedSystemParagraph(active) : false

  const shortEssayItems =
    activeShortEssay?.items && activeShortEssay.items.length > 0
      ? activeShortEssay.items
      : activeShortEssay
        ? [
            {
              id: 'short-essay-item-1',
              label: 'Title 01',
              placeholder: activeShortEssay.bodyPlaceholder,
              bodyText: activeShortEssay.bodyText,
            },
          ]
        : []

  const selectedShortEssayItem =
    singleItemListActiveItemId == null
      ? null
      : (shortEssayItems.find(item => item.id === singleItemListActiveItemId) ?? null)

  const shortEssayShowItemTitle =
    activeShortEssay == null
      ? false
      : shortEssayItems.length >= 2
        ? true
        : (activeShortEssay.showItemTitle ?? false)

  const handleKindChange = (next: ParagraphKindSelectValue) => {
    if (!active || activeKindLocked) return
    if (next === activeKindValue) return
    updateParagraph(active.id, cur => {
      if (next === 'table') {
        if (
          cur.kind === 'single_item' &&
          (cur.variant === 'horizontal_table' || cur.variant === 'vertical_table')
        ) {
          return cur
        }
        return preserveParagraphCommonFields(createHorizontalTableParagraph(cur.id), cur)
      }
      if (next === 'description') {
        return convertParagraphByDetail(cur, 'text')
      }
      return convertParagraphByDetail(cur, 'subjective')
    })
  }

  const handleDetailChange = (next: DetailSelectValue) => {
    if (!active || activeKindLocked) return
    updateParagraph(active.id, cur => convertParagraphByDetail(cur, next))
  }

  return (
    <div className="form-editor-right-panel">
      {showTitleNumbering ? (
        <FormEditorTitleNumberingField
          value={draft.formSettings.titleNumbering}
          onChange={onTitleNumberingChange}
        />
      ) : null}

      {active ? (
        <>
          <Form layout="vertical" className="form-editor-right-panel__form" requiredMark={false}>
            <span className="form-editor-right-panel__section-title">{outline}</span>
            <Form.Item>
              <div className="form-editor-right-panel__kind-row">
                <>
                  <CmsSelect
                    width="100%"
                    value={activeKindValue ?? paragraphKindLabel(active)}
                    options={PARAGRAPH_KIND_OPTIONS}
                    onChange={v => handleKindChange(v as ParagraphKindSelectValue)}
                    disabled={activeKindLocked}
                  />
                  <CmsSelect
                    width="100%"
                    value={activeDetailValue ?? paragraphVariantLabel(active)}
                    options={
                      activeKindValue === 'table'
                        ? TABLE_DETAIL_OPTIONS
                        : activeKindValue === 'description'
                          ? DESCRIPTION_DETAIL_OPTIONS
                          : SINGLE_ITEM_DETAIL_OPTIONS
                    }
                    onChange={v => handleDetailChange(v as DetailSelectValue)}
                    disabled={activeKindLocked}
                  />
                </>
              </div>
            </Form.Item>
          </Form>

          {!(active.kind === 'description' && active.variant === 'closing') ? (
            <Form
              layout="vertical"
              className="form-editor-right-panel__form-items"
              requiredMark={false}
            >
            {active.kind === 'description' && active.variant === 'survey_title_with_period' ? (
              <>
                {(active.showWritingPeriodOnForm ?? false) ? (
                  <>
                    <Form.Item label={'설문 시작일'}>
                      <CmsRadioGroup
                        value={active.periodMode}
                        onChange={e =>
                          updateParagraph(active.id, () => ({
                            ...active,
                            periodMode: e.target.value,
                          }))
                        }
                      >
                        <CmsRadio value="immediate">바로 시작</CmsRadio>
                        <CmsRadio value="custom">직접 설정</CmsRadio>
                      </CmsRadioGroup>
                    </Form.Item>
                    <Form.Item label={'설문 종료일'}>
                      <CmsRadioGroup
                        value={active.periodMode}
                        onChange={e =>
                          updateParagraph(active.id, () => ({
                            ...active,
                            periodMode: e.target.value,
                          }))
                        }
                      >
                        <CmsRadio value="immediate">마감 없음</CmsRadio>
                        <CmsRadio value="custom">직접 설정</CmsRadio>
                      </CmsRadioGroup>
                    </Form.Item>
                  </>
                ) : null}
              </>
            ) : null}

            {active.kind === 'description' &&
            active.variant === 'system' &&
            isAgreementLockedSystemParagraph(active) ? (
              <Form.Item>
                <span className="form-editor-right-panel__system-hint">
                  시스템 설정 항목입니다. 내용 추가·삭제·편집은 할 수 없습니다.
                </span>
              </Form.Item>
            ) : null}

            {activeShortEssay && selectedShortEssayItem ? (
              <>
                <Form.Item label="항목 유형">
                  <CmsSelect
                    width="100%"
                    value={paragraphVariantLabel(activeShortEssay)}
                    options={[
                      {
                        value: paragraphVariantLabel(activeShortEssay),
                        label: paragraphVariantLabel(activeShortEssay),
                      },
                    ]}
                    disabled
                  />
                </Form.Item>
                {shortEssayShowItemTitle ? (
                  <Form.Item label="항목명">
                    <CmsInput
                      width="100%"
                      value={selectedShortEssayItem.label ?? ''}
                      onChange={e =>
                        updateParagraph(activeShortEssay.id, cur => {
                          if (cur.kind !== 'single_item' || cur.variant !== 'short_essay') return cur
                          const items =
                            cur.items?.length && cur.items.length > 0
                              ? cur.items
                              : [
                                  {
                                    id: 'short-essay-item-1',
                                    label: 'Title 01',
                                    placeholder: cur.bodyPlaceholder,
                                    bodyText: cur.bodyText,
                                  },
                                ]
                          return {
                            ...cur,
                            items: items.map(item =>
                              item.id === selectedShortEssayItem.id
                                ? { ...item, label: e.target.value }
                                : item
                            ),
                          }
                        })
                      }
                      placeholder="항목명을 입력해 주세요"
                    />
                  </Form.Item>
                ) : null}
                <Form.Item label="입력창 안내 텍스트">
                  <CmsInput
                    width="100%"
                    value={selectedShortEssayItem.placeholder ?? activeShortEssay.bodyPlaceholder}
                    onChange={e =>
                      updateParagraph(activeShortEssay.id, cur => {
                        if (cur.kind !== 'single_item' || cur.variant !== 'short_essay') return cur
                        const items =
                          cur.items?.length && cur.items.length > 0
                            ? cur.items
                            : [
                                {
                                  id: 'short-essay-item-1',
                                  label: 'Title 01',
                                  placeholder: cur.bodyPlaceholder,
                                  bodyText: cur.bodyText,
                                },
                              ]
                        return {
                          ...cur,
                          bodyPlaceholder: e.target.value,
                          items: items.map(item =>
                            item.id === selectedShortEssayItem.id
                              ? { ...item, placeholder: e.target.value }
                              : item
                          ),
                        }
                      })
                    }
                    placeholder="답변을 입력해 주세요"
                  />
                </Form.Item>
              </>
            ) : null}

            {activeMultipleChoice ? (
              <>
                <Form.Item label="항목 유형">
                  <CmsSelect
                    width="100%"
                    value={paragraphVariantLabel(activeMultipleChoice)}
                    options={[
                      {
                        value: paragraphVariantLabel(activeMultipleChoice),
                        label: paragraphVariantLabel(activeMultipleChoice),
                      },
                    ]}
                    disabled
                  />
                </Form.Item>
                {singleItemListActiveItemId === FORM_EDITOR_MULTIPLE_CHOICE_ITEMS_FOCUS_ID ||
                singleItemListActiveItemId === undefined ? (
                  <FormEditorMultipleChoiceItems
                    paragraph={activeMultipleChoice}
                    updateParagraph={updateParagraph}
                  />
                ) : null}
              </>
            ) : null}

            {activeScaleType ? (
              <FormEditorScaleTypeItems paragraph={activeScaleType} updateParagraph={updateParagraph} />
            ) : null}

            {active.kind === 'single_item' && active.variant === 'horizontal_table' ? (
              <FormEditorHorizontalTableCustomFields
                paragraph={active as HorizontalTableParagraph}
                rowSelection={horizontalTableRowSelection}
                updateParagraph={updateParagraph}
                onBodyRowDeleted={onHorizontalTableBodyRowDeleted}
              />
            ) : null}

            {active.kind === 'single_item' && active.variant === 'vertical_table' ? (
              <FormEditorVerticalTableCustomFields
                paragraph={active as VerticalTableParagraph}
                rowSelection={verticalTableBodyRowSelection}
                updateParagraph={updateParagraph}
                onBodyRowDeleted={onVerticalTableBodyRowDeleted}
              />
            ) : null}

            </Form>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
