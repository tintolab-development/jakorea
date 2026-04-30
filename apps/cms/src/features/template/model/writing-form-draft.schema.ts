/** 설문·동의·테이블 가로형 직접 등록 에디터 공통 — 에디터 문맥(직렬화 키와 무관) */
export type FormEditorKind = 'survey' | 'agreement' | 'horizontal_table'

/** 우측 '타이틀 번호' — 저장값; 화면 접두는 `form-title-numbering`에서 파생 */
export type FormTitleNumberingStyle = 'numeric' | 'alpha' | 'q_repeat' | 'q123' | 'none'

export type FormPeriodMode = 'immediate' | 'custom'

export interface WritingFormSettings {
  titleNumbering: FormTitleNumberingStyle
}

/** 번호 매김 대상(제목형·마무리 제외) */
export interface WritingFormParagraphBase {
  id: string
  /** 카드 제목 옆 필수 표시(*) */
  requiredMark: boolean
  /** 카드/아웃라인용 원문 타이틀(번호 접두 없음) */
  paragraphTitle: string
  /** 단락 설명 placeholder 대응 */
  paragraphDescription: string
  participatesInTitleNumbering: boolean
}

/** 제목·기간 설명 단락 — 직렬화: variant·필드명(surveyTitle 등) 유지 */
export interface TitleWithPeriodParagraph extends Omit<WritingFormParagraphBase, 'requiredMark'> {
  kind: 'description'
  variant: 'survey_title_with_period'
  requiredMark: true
  surveyTitle: string
  surveyDescription: string
  periodMode: FormPeriodMode
  startAt: string | null
  endAt: string | null
  showWritingPeriodOnForm: boolean
}

export interface UserProfileField {
  key: string
  label: string
  enabled: boolean
  required: boolean
}

/** 설문 기본 초안 전용 */
export interface UserProfileParagraph extends WritingFormParagraphBase {
  kind: 'single_item'
  variant: 'user_profile'
  answerRequired?: boolean
  fields: UserProfileField[]
}

export interface ScoreSelectParagraph extends WritingFormParagraphBase {
  kind: 'single_item'
  variant: 'score_select'
  answerRequired?: boolean
  scaleMin: number
  scaleMax: number
  /** 척도 끝 라벨 등 — 키는 문자열 숫자 */
  scaleLabels: Record<string, string>
  selectedPreviewValue: number | null
}

export interface SubjectiveItem {
  id: string
  placeholder: string
}

export interface SubjectiveParagraph extends WritingFormParagraphBase {
  kind: 'single_item'
  variant: 'subjective'
  answerRequired?: boolean
  items: SubjectiveItem[]
}

export interface ClosingParagraph extends WritingFormParagraphBase {
  kind: 'description'
  variant: 'closing'
  body: string
  /** 동의서 마무리: 일자·서명 placeholder 바 노출 */
  showAgreementFooter?: boolean
}

/** 동의 양식 하단 고정 시스템 행(날짜·서명) — CMS authoring / 응답 write에서 각각 표시 */
export type AgreementSystemPreset = 'agreement_date' | 'agreement_signature'

/** 시스템 날짜·서명 본문 표시 — authoring(작성/미리보기) vs write(응답 입력) */
export type AgreementSystemBodyDisplayMode = 'authoring' | 'write'

/** 설명글·기타형 — 시스템 등 본문 에디터 없음 */
export interface SystemParagraph extends WritingFormParagraphBase {
  kind: 'description'
  variant: 'system'
  /** 동의 양식 전용 고정 항목; 없으면 기타(빈 본문·설문 테스트용 등) */
  systemPreset?: AgreementSystemPreset
}

export function isAgreementLockedSystemParagraph(p: WritingFormParagraph): boolean {
  return (
    p.kind === 'description' &&
    p.variant === 'system' &&
    (p.systemPreset === 'agreement_date' || p.systemPreset === 'agreement_signature')
  )
}

/** 동의서 설명글·텍스트형 — 제목 / 설명 / 한 줄 본문 + 답변 필수 토글 */
export interface AgreementExplanationTextParagraph extends WritingFormParagraphBase {
  kind: 'single_item'
  variant: 'agreement_explanation_text'
  bodyPlaceholder: string
  bodyText: string
  /** 카드 하단 토글 — 본문(답변) 필수 여부 */
  answerRequired: boolean
}

/** 단일 항목 미리보기 전용(추후 스키마 정리 시 통합 가능) */
export type ShortEssayParagraph = WritingFormParagraphBase & {
  kind: 'single_item'
  variant: 'short_essay'
  answerRequired?: boolean
  showItemTitle?: boolean
  items?: Array<{ id: string; label?: string; placeholder?: string; bodyText: string }>
  bodyPlaceholder: string
  bodyText: string
}

export interface MultipleChoiceItem {
  id: string
  label: string
}

export type MultipleChoiceParagraph = WritingFormParagraphBase & {
  kind: 'single_item'
  variant: 'multiple_choice'
  answerRequired?: boolean
  /** true면 미리보기가 체크박스(복수 선택) */
  allowMultiple?: boolean
  items: MultipleChoiceItem[]
  /** 단일 선택 미리보기 */
  selectedPreviewSingleId?: string | null
  /** 복수 선택 미리보기 */
  selectedPreviewMultipleIds?: string[]
}

/** 에디터 전용: 객관식 항목 영역 포커스(우측「항목 수정」·바디 선택 테두리). 실제 항목 id와 겹치지 않게 둠 */
export const FORM_EDITOR_MULTIPLE_CHOICE_ITEMS_FOCUS_ID =
  '__form_editor_multiple_choice_items__' as const

/** 객관식형 기본 항목 4개 (스펙: 신규 시 한 세트) */
export function createDefaultMultipleChoiceItems(): MultipleChoiceItem[] {
  return [
    { id: 'multiple-choice-item-1', label: 'text 1' },
    { id: 'multiple-choice-item-2', label: 'text 2' },
    { id: 'multiple-choice-item-3', label: 'text 3' },
    { id: 'multiple-choice-item-4', label: 'text 4' },
  ]
}

export type DropdownParagraph = WritingFormParagraphBase & {
  kind: 'single_item'
  variant: 'dropdown'
  answerRequired?: boolean
}

/** 세로형(날짜/시간형) 스테이지·가로형 dateTime 열 등 — 스테이지별 입력 유형 */
export type DateTimeFieldMode = 'date' | 'time' | 'date_time'

/** 세로형 날짜/시간형 스테이지·커스텀 필드용 라벨 */
export const DATE_TIME_FIELD_MODE_OPTIONS: readonly { value: DateTimeFieldMode; label: string }[] =
  [
    { value: 'date', label: '날짜' },
    { value: 'time', label: '시간' },
    { value: 'date_time', label: '날짜+시간' },
  ] as const

/** 합성(날짜+시간) 시간 인풋 기본 플레이스홀더 — 본문·패널에서 공통 */
export const VERTICAL_DT_COMPOSITE_TIME_PLACEHOLDER = '시간을 선택해 주세요'

export type DateParagraph = WritingFormParagraphBase & {
  kind: 'single_item'
  variant: 'date'
  answerRequired?: boolean
  /** 기간(시작~종료) */
  periodEnabled?: boolean
}

export type TimeParagraph = WritingFormParagraphBase & {
  kind: 'single_item'
  variant: 'time'
  answerRequired?: boolean
}

export type StarRateParagraph = WritingFormParagraphBase & {
  kind: 'single_item'
  variant: 'star_rate'
  answerRequired?: boolean
  /** 미리보기: 1–5까지 노란 별 개수, 없음·null이면 전부 회색 */
  selectedPreviewStars?: number | null
}

export interface ScaleTypeItem {
  id: string
  label: string
}

export type ScaleTypeParagraph = WritingFormParagraphBase & {
  kind: 'single_item'
  variant: 'scale_type'
  answerRequired?: boolean
  items: ScaleTypeItem[]
  /** 미리보기에서 강조(민트)되는 항목 id */
  selectedPreviewItemId?: string | null
}

/** 점수 선택형 기본 5단계 (Likert 문구) */
export function createDefaultScaleTypeItems(): ScaleTypeItem[] {
  return [
    { id: 'scale-type-item-1', label: '전혀 그렇지 않다' },
    { id: 'scale-type-item-2', label: '그렇지 않다' },
    { id: 'scale-type-item-3', label: '보통이다' },
    { id: 'scale-type-item-4', label: '그렇다' },
    { id: 'scale-type-item-5', label: '매우 그렇다' },
  ]
}

export type UserInfoParagraph = WritingFormParagraphBase & {
  kind: 'single_item'
  variant: 'user_info'
  answerRequired?: boolean
  /** 버튼형 노출 필드 목록(순서 유지) */
  userFields?: Array<{ key: string; label: string }>
  /** 미리보기에서 선택된 필드 key */
  selectedUserFieldKeys?: string[]
}

export type FileAttachmentParagraph = WritingFormParagraphBase & {
  kind: 'single_item'
  variant: 'file_attachment'
  answerRequired?: boolean
}

/** 캔버스에서 선택된 테이블 행(헤더 행 vs 데이터 행) — 에디터에서 단락 id별로 보관해 위젯마다 분리 */
export type HorizontalTableRowSelection =
  | { area: 'header' }
  /** `col`: 본문 칸 단위 선택(미지정·레거시는 0으로 취급) */
  | { area: 'body'; row: number; col?: number }

/** 텍스트형: 모든 셀 `Input` / 필드형: 열마다 입력 유형 + 필드 셀 값 */
export type HorizontalTableFlavor = 'text' | 'field'

/** 열(칸) 단위 필드 정의 — 헤더는 별도 `columnHeaders` 텍스트 */
export type HorizontalTableColumnField =
  | { kind: 'text'; placeholder: string }
  | { kind: 'subjective'; placeholder: string }
  | { kind: 'dropdown'; placeholder: string; options: string[] }
  | { kind: 'dateTime'; dateTimeMode: 'date' | 'time' | 'dateTime'; placeholder: string }
  | { kind: 'single'; options: string[] }
  | { kind: 'multiple'; options: string[] }

export type HorizontalTableFieldColumnKind = HorizontalTableColumnField['kind']

/** 우측 패널·테이블 th에 보이는 필드 유형명(항목명) — 비텍스트 열 헤더와 동일 */
export function horizontalTableColumnFieldKindPublicLabel(
  kind: HorizontalTableFieldColumnKind
): string {
  switch (kind) {
    case 'text':
      return '텍스트형'
    case 'subjective':
      return '주관식형'
    case 'dropdown':
      return '드롭다운형'
    case 'dateTime':
      return '날짜형'
    case 'single':
      return '단일 선택형'
    case 'multiple':
      return '다중 선택형'
    default: {
      const _x: never = kind
      return _x
    }
  }
}

/** th에 넣은 필드 유형 안내 문구와 동일한 값이면, 유형을 텍스트형으로 바꿀 때 비움(사용자 입력 라벨은 유지) */
const HORIZONTAL_TABLE_KIND_HEADER_LABELS = new Set(
  (['text', 'subjective', 'dropdown', 'dateTime', 'single', 'multiple'] as const).map(k =>
    horizontalTableColumnFieldKindPublicLabel(k)
  )
)

function clearHeaderIfAutoFieldKindLabel(headers: string[], colIdx: number) {
  const t = (headers[colIdx] ?? '').trim()
  if (HORIZONTAL_TABLE_KIND_HEADER_LABELS.has(t)) {
    headers[colIdx] = ''
  }
}

export type HorizontalTableFieldCellValue =
  | { kind: 'text' | 'subjective' | 'dropdown' | 'dateTime' | 'single'; value: string }
  | { kind: 'multiple'; values: string[] }

export const HORIZONTAL_TABLE_MIN_COLUMN_COUNT = 1

/** 주관식 등 입력창 안내(플레이스홀더) 기본 문구 */
export const HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER = '텍스트를 입력해 주세요'

const DEFAULT_DROPDOWN_OPTIONS = ['A', 'B', 'C'] as const
const DEFAULT_CHOICE_OPTIONS = ['A', 'B', 'C'] as const

export function defaultFieldForColumnKind(
  kind: HorizontalTableFieldColumnKind
): HorizontalTableColumnField {
  switch (kind) {
    case 'text':
      return { kind: 'text', placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER }
    case 'subjective':
      return { kind: 'subjective', placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER }
    case 'dropdown':
      return { kind: 'dropdown', placeholder: '', options: [...DEFAULT_DROPDOWN_OPTIONS] }
    case 'dateTime':
      return { kind: 'dateTime', dateTimeMode: 'date', placeholder: '' }
    case 'single':
      return { kind: 'single', options: [...DEFAULT_CHOICE_OPTIONS] }
    case 'multiple':
      return { kind: 'multiple', options: [...DEFAULT_CHOICE_OPTIONS] }
    default: {
      const _x: never = kind
      return _x
    }
  }
}

/** 필드형 열·빈 열 슬롯 기본: 텍스트형 */
function defaultColumnFieldForNewColumn(): HorizontalTableColumnField {
  return defaultFieldForColumnKind('text')
}

export function createEmptyFieldCellValue(
  field: HorizontalTableColumnField
): HorizontalTableFieldCellValue {
  if (field.kind === 'multiple') {
    return { kind: 'multiple', values: [] }
  }
  return { kind: field.kind, value: '' }
}

export function rehomeFieldCellValue(
  value: HorizontalTableFieldCellValue,
  nextField: HorizontalTableColumnField
): HorizontalTableFieldCellValue {
  if (nextField.kind === 'multiple') {
    if (value.kind === 'multiple') {
      return { kind: 'multiple', values: value.values.filter(v => nextField.options.includes(v)) }
    }
    return { kind: 'multiple', values: [] }
  }
  if (value.kind === 'multiple') {
    return { kind: nextField.kind, value: '' }
  }
  if (nextField.kind === 'single' && value.kind === 'single') {
    if (nextField.options.includes(value.value)) return value
    return { kind: 'single', value: '' }
  }
  if (nextField.kind === 'dropdown' && value.kind === 'dropdown') {
    if (nextField.options.length === 0) return { kind: 'dropdown', value: '' }
    if (value.value && nextField.options.includes(value.value)) return value
    return { kind: 'dropdown', value: '' }
  }
  /** 텍스트형 ↔ 주관식형 — 둘 다 단일 문자열 값 */
  if (
    (nextField.kind === 'text' && (value.kind === 'text' || value.kind === 'subjective')) ||
    (nextField.kind === 'subjective' && value.kind === 'text')
  ) {
    const s = value.value
    return nextField.kind === 'text' ? { kind: 'text', value: s } : { kind: 'subjective', value: s }
  }
  if (value.kind === nextField.kind) {
    return value
  }
  return { kind: nextField.kind, value: '' }
}

/** 테이블 하단 설명 영역 — 동의 여부(미리보기·저장) */
export type TableBottomConsent = 'agree' | 'disagree'

export function normalizeTableBottomConsent(raw: unknown): TableBottomConsent {
  return raw === 'disagree' ? 'disagree' : 'agree'
}

/** 작성 양식 — 테이블 가로형(가변 행·열, 각 dataRows[i] 길이는 columnHeaders와 동일) */
export interface HorizontalTableParagraph extends WritingFormParagraphBase {
  kind: 'single_item'
  variant: 'horizontal_table'
  /** `text`: `dataRows`만 사용. `field`: `columnFields`·`fieldDataRows` 사용 */
  tableFlavor: HorizontalTableFlavor
  columnHeaders: string[]
  dataRows: string[][]
  /** `tableFlavor === 'field'`일 때만 — 열과 동일 길이(새 행·열 기본·열 전체 변경 시 템플릿) */
  columnFields: HorizontalTableColumnField[]
  /**
   * 필드형일 때 행·셀마다 다른 열 정의가 필요할 때만 사용.
   * 생략이면 모든 행에서 `columnFields[col]`을 그대로 사용한다.
   */
  cellColumnFields?: HorizontalTableColumnField[][]
  fieldDataRows: HorizontalTableFieldCellValue[][]
  bottomText: string
  showBottomText: boolean
  /** 하단에 동의(라디오) 영역 노출 */
  showBottomConsent: boolean
  /** `showBottomConsent`일 때 동의 라디오 값 */
  bottomConsent?: TableBottomConsent
  answerRequired: boolean
}

export type VerticalTableStageKind =
  | 'text'
  | 'subjective'
  | 'date_time'
  | 'single_choice'
  | 'multiple_choice'

/** 세로형 테이블 한 행: 1단(항목·입력 1쌍) 또는 2단(같은 행에 두 쌍, 폭 분배).
 * `stageKinds`: 단락 전체 flavor와 다르게 특정 스테이지(항목)만 다른 유형일 때 사용.
 * `placeholderHints`: 주관식·날짜/시간형 「입력창 안내」— 스테이지별 문자열 튜플(날짜/날짜+시합성의 날짜 인풋에 사용 등).
 * `dateTimeStageModes`: 날짜/시간형 — 스테이지별 「유형」(`length === stageCount`). 생략 시 `effectiveVerticalRowDateTimeModes`가 레거시·기본값으로 채움.
 * `dateTimeCompositeTimeHints`: 날짜/시간형 — 스테이지가 「날짜+시간」일 때 시간 픽커 안내 문자열 튜플(인덱스=스테이지).
 * `dateTimeStage0AuxTime`: 합성이 **첫 스테이지**에 놓일 때 시간(HH:mm) 값.
 * `dateTimeStage1Time`: 합성이 **둘째 스테이지**일 때 시간(HH:mm)·레거시.
 * 레거시 `dateTimeSingleStageMode`는 스테이지 1행에서 `dateTimeStageModes`로 승격.
 * `choiceMultipleSelections`: 다중선택형(`multiple_choice`) — 스테이지별 선택값 배열(`length === stageCount`). */
export type VerticalTableRow =
  | {
      stageCount: 1
      headers: [string]
      cells: [string]
      stageKinds?: [VerticalTableStageKind]
      placeholderHints?: [string]
      /** 레거시 — `normalizeVerticalTableRow`가 `dateTimeStageModes:[x]` 로 승격 */
      dateTimeSingleStageMode?: DateTimeFieldMode
      /** 우선 사용; 없으면 `dateTimeSingleStageMode` 또는 기본 */
      dateTimeStageModes?: [DateTimeFieldMode]
      /** 합성(날짜+시간) 시 시간 인풋 안내(보통 `[t0]` 또는 생략) */
      dateTimeCompositeTimeHints?: [string]
      dateTimeStage0AuxTime?: string
      dateTimeStage1Time?: string
      /** 다중선택형 — 스테이지 1개일 때 길이 1 */
      choiceMultipleSelections?: [string[]]
    }
  | {
      stageCount: 2
      headers: [string, string]
      cells: [string, string]
      stageKinds?: [VerticalTableStageKind, VerticalTableStageKind]
      placeholderHints?: [string, string]
      dateTimeStageModes?: [DateTimeFieldMode, DateTimeFieldMode]
      dateTimeCompositeTimeHints?: [string, string]
      dateTimeStage0AuxTime?: string
      /** 첫 번째 스테이지 유형이 합성이 아니고 둘째가 합성일 때 시간(HH:mm) — 과거 레거시 */
      dateTimeStage1Time?: string
      /** 다중선택형 — 스테이지 2개 */
      choiceMultipleSelections?: [string[], string[]]
    }

/** 빈 문자열 가드 없이 우선 사용 — 주관식 td 기본 플레이스홀더 */
export const DEFAULT_VERTICAL_SUBJECTIVE_CELL_PLACEHOLDER = '내용을 입력해 주세요'

/**
 * 세로형 단락 종류.
 * - `text`: 테이블_세로형(텍스트형)
 * - `subjective`: 테이블_세로형(주관식형) — 행별 주관식(자유 서술) 입력
 * - `date_time`: 테이블_세로형(날짜/시간형)
 * - `single_choice` / `multiple_choice`: 테이블_세로형(단일·다중 선택형) — `verticalChoiceOptions` 공통 선택지
 * - `file_attachment`: 테이블_세로형(파일첨부형) — 고정 1행, 행·열 추가 없음
 */
export type VerticalTableFlavor = VerticalTableStageKind | 'file_attachment'

/** 파일첨부형 세로 테이블 좌측 th 기본 라벨 */
export const DEFAULT_VERTICAL_FILE_ATTACHMENT_HEADER_LABEL = '파일첨부형'

/** 작성 양식 — 테이블 세로형 (`verticalTableFlavor`로 세부 유형 구분) */
export interface VerticalTableParagraph extends WritingFormParagraphBase {
  kind: 'single_item'
  variant: 'vertical_table'
  /** 생략·불명시는 `text`(기존 JSON 호환) */
  verticalTableFlavor: VerticalTableFlavor
  /**
   * `verticalTableFlavor === 'file_attachment'`일 때만 사용 — 좌측 th 표시 문구.
   * 생략·빈 문자열이면 `DEFAULT_VERTICAL_FILE_ATTACHMENT_HEADER_LABEL`.
   */
  verticalFileAttachmentHeaderLabel?: string
  /** 단일·다중 선택형 공통 선택지(생략 시 `['A','B','C']`) */
  verticalChoiceOptions?: string[]
  rows: VerticalTableRow[]
  bottomText: string
  showBottomText: boolean
  /** 하단에 동의(라디오) 영역 노출 */
  showBottomConsent: boolean
  /** `showBottomConsent`일 때 동의 라디오 값 */
  bottomConsent?: TableBottomConsent
  answerRequired: boolean
}

function repairColumnField(
  f: HorizontalTableColumnField | undefined,
  _idx: number
): HorizontalTableColumnField {
  if (f == null) return defaultColumnFieldForNewColumn()
  if (f.kind === 'text') {
    return {
      kind: 'text',
      placeholder: f.placeholder?.trim()
        ? f.placeholder
        : HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
    }
  }
  if (f.kind === 'dropdown' && (!f.options || f.options.length === 0)) {
    return { kind: 'dropdown', placeholder: f.placeholder, options: [...DEFAULT_DROPDOWN_OPTIONS] }
  }
  if (f.kind === 'single' || f.kind === 'multiple') {
    if (!f.options || f.options.length === 0) {
      return { kind: f.kind, options: [...DEFAULT_CHOICE_OPTIONS] }
    }
    return { kind: f.kind, options: [...f.options] }
  }
  return f
}

function ensureColumnFieldSlice(
  p: HorizontalTableParagraph,
  colCount: number
): HorizontalTableColumnField[] {
  const cur = p.columnFields ?? []
  const next = cur.slice(0, colCount).map((f, i) => repairColumnField(f, i))
  while (next.length < colCount) next.push(defaultColumnFieldForNewColumn())
  return next
}

function padFieldRow(
  src: HorizontalTableFieldCellValue[] | undefined,
  colCount: number,
  fieldCols: HorizontalTableColumnField[]
): HorizontalTableFieldCellValue[] {
  return Array.from({ length: colCount }, (_, c) => {
    const f = fieldCols[c] ?? defaultColumnFieldForNewColumn()
    const v = src?.[c]
    return v == null ? createEmptyFieldCellValue(f) : rehomeFieldCellValue(v, f)
  })
}

/** 필드 모드: `dataRows` 행 수에 맞춰 `fieldDataRows`를 채움(불일치 복구) */
function syncFieldDataRowsToTextRows(
  p: HorizontalTableParagraph,
  colCount: number,
  fieldCols: HorizontalTableColumnField[]
): HorizontalTableFieldCellValue[][] {
  const n = Math.max(1, p.dataRows.length)
  return Array.from({ length: n }, (_, ri) =>
    padFieldRow(p.fieldDataRows?.[ri], colCount, fieldCols)
  )
}

function getHorizontalTableRowFieldSlice(
  p: HorizontalTableParagraph,
  rowIdx: number,
  colCount: number
): HorizontalTableColumnField[] {
  const fieldCols = ensureColumnFieldSlice(p, colCount)
  const matrix = p.cellColumnFields
  if (matrix != null && rowIdx >= 0 && rowIdx < matrix.length) {
    const row = matrix[rowIdx]
    if (row == null) {
      return fieldCols
    }
    return Array.from({ length: colCount }, (_, c) => repairColumnField(row[c] ?? fieldCols[c], c))
  }
  return fieldCols
}

/** 필드형 가로표: (rowIdx, colIdx) 칸에 실제 적용되는 열 필드 정의 */
export function getEffectiveHorizontalCellField(
  p: HorizontalTableParagraph,
  rowIdx: number,
  colIdx: number
): HorizontalTableColumnField {
  const colCount = Math.max(1, p.columnHeaders.length)
  const slice = getHorizontalTableRowFieldSlice(p, rowIdx, colCount)
  return repairColumnField(slice[colIdx], colIdx)
}

/** 행 추가: 데이터 영역 **최하단**에 가로 한 줄(새 행)을 붙인다. */
export function horizontalTableAddRow(p: HorizontalTableParagraph): HorizontalTableParagraph {
  const colCount = Math.max(1, p.columnHeaders.length)
  const normalizedRows = p.dataRows.map(r => {
    const row = [...r]
    while (row.length < colCount) row.push('')
    return row.slice(0, colCount)
  })
  const newTextRow = Array.from({ length: colCount }, () => '')
  const nextDataRows = [...normalizedRows, newTextRow]
  if (p.tableFlavor !== 'field') {
    if (p.cellColumnFields != null && p.cellColumnFields.length > 0) {
      const fieldCols =
        (p.columnFields?.length ?? 0) > 0
          ? ensureColumnFieldSlice(p, colCount)
          : Array.from({ length: colCount }, () => defaultFieldForColumnKind('text'))
      const newFieldRow = fieldCols.map(f => cloneColumnField(f))
      return {
        ...p,
        dataRows: nextDataRows,
        cellColumnFields: [
          ...p.cellColumnFields.map(r => r.map(c => cloneColumnField(c))),
          newFieldRow,
        ],
      }
    }
    return { ...p, dataRows: nextDataRows }
  }
  const fieldCols = ensureColumnFieldSlice(p, colCount)
  const out: HorizontalTableFieldCellValue[][] = []
  for (let ri = 0; ri < normalizedRows.length; ri++) {
    const rowFields = getHorizontalTableRowFieldSlice(p, ri, colCount)
    out.push(padFieldRow(p.fieldDataRows?.[ri], colCount, rowFields))
  }
  out.push(fieldCols.map(f => createEmptyFieldCellValue(f)))
  const nextMatrix =
    p.cellColumnFields != null
      ? [
          ...p.cellColumnFields.map(row => row.map(c => cloneColumnField(c))),
          fieldCols.map(f => cloneColumnField(f)),
        ]
      : undefined
  return {
    ...p,
    dataRows: nextDataRows,
    columnFields: fieldCols,
    cellColumnFields: nextMatrix,
    fieldDataRows: out,
  }
}

/** 열 추가: 헤더·각 행의 **가장 우측**에 세로 한 줄(새 열)을 붙인다. */
export function horizontalTableAddColumn(p: HorizontalTableParagraph): HorizontalTableParagraph {
  const colCount = Math.max(1, p.columnHeaders.length)
  const normalizedRows = p.dataRows.map(r => {
    const row = [...r]
    while (row.length < colCount) row.push('')
    return row.slice(0, colCount)
  })
  const newHeaderSuffix = ''
  const nextHeaders = [...p.columnHeaders, newHeaderSuffix]
  const nextWidth = nextHeaders.length
  const nextTextRows =
    normalizedRows.length > 0
      ? normalizedRows.map(r => [...r, ''])
      : [Array.from({ length: nextWidth }, () => '')]
  if (p.tableFlavor !== 'field') {
    const baseColCount = colCount
    const newTextField = defaultFieldForColumnKind('text')
    const prevCols =
      (p.columnFields?.length ?? 0) > 0
        ? ensureColumnFieldSlice(p, baseColCount)
        : Array.from({ length: baseColCount }, () => defaultFieldForColumnKind('text'))
    const nextColumnFields = [
      ...prevCols.map((f, i) => repairColumnField(f, i)),
      repairColumnField(newTextField, baseColCount),
    ]
    if (p.cellColumnFields != null && p.cellColumnFields.length > 0) {
      const nextMatrix = p.cellColumnFields.map(row => [
        ...row.map(c => cloneColumnField(c)),
        cloneColumnField(newTextField),
      ])
      return {
        ...p,
        columnHeaders: nextHeaders,
        dataRows: nextTextRows,
        columnFields: nextColumnFields,
        cellColumnFields: nextMatrix,
      }
    }
    return {
      ...p,
      columnHeaders: nextHeaders,
      dataRows: nextTextRows,
      columnFields: nextColumnFields,
    }
  }
  const newField = defaultFieldForColumnKind('text')
  const fieldCols = [...ensureColumnFieldSlice(p, colCount), newField]
  const oldSlices =
    p.cellColumnFields != null ? p.cellColumnFields.map(r => r.map(cloneColumnField)) : null
  const nextFieldRows = nextTextRows.map((_, ri) => {
    const prevRow = p.fieldDataRows?.[ri]
    const sliceForOld = oldSlices ? oldSlices[ri]! : ensureColumnFieldSlice(p, colCount)
    const padded = padFieldRow(prevRow, colCount, sliceForOld)
    return [...padded, createEmptyFieldCellValue(newField)]
  })
  const nextMatrix =
    p.cellColumnFields != null
      ? p.cellColumnFields.map(row => [...row.map(cloneColumnField), cloneColumnField(newField)])
      : undefined
  return {
    ...p,
    columnHeaders: nextHeaders,
    dataRows: nextTextRows,
    columnFields: fieldCols,
    cellColumnFields: nextMatrix,
    fieldDataRows: nextFieldRows,
  }
}

/** 새 테이블 가로형 단락(중간 영역 추가·복제 시 사용) */
function cloneColumnField(f: HorizontalTableColumnField): HorizontalTableColumnField {
  if (f.kind === 'single' || f.kind === 'multiple' || f.kind === 'dropdown') {
    return { ...f, options: [...f.options] }
  }
  return { ...f }
}

function cloneFieldCellValue(v: HorizontalTableFieldCellValue): HorizontalTableFieldCellValue {
  if (v.kind === 'multiple') {
    return { kind: 'multiple', values: [...v.values] }
  }
  return { ...v }
}

/** 필드 셀 값을 텍스트형 `dataRows`에 옮길 때(모드 전환) */
export function fieldCellValueToPlainText(v: HorizontalTableFieldCellValue): string {
  if (v.kind === 'multiple') {
    return v.values.join(', ')
  }
  return v.value
}

export function createHorizontalTableParagraph(id: string): HorizontalTableParagraph {
  return {
    id,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    tableFlavor: 'text',
    columnHeaders: ['', '', ''],
    dataRows: [['', '', '']],
    columnFields: [],
    fieldDataRows: [],
    bottomText: '',
    showBottomText: true,
    showBottomConsent: true,
    bottomConsent: 'agree',
    answerRequired: true,
  }
}

export function cloneHorizontalTableParagraph(
  source: HorizontalTableParagraph,
  newId: string
): HorizontalTableParagraph {
  return {
    ...source,
    id: newId,
    columnHeaders: [...source.columnHeaders],
    dataRows: source.dataRows.map(r => [...r]),
    columnFields: (source.columnFields ?? []).map(cloneColumnField),
    cellColumnFields: source.cellColumnFields?.map(r => r.map(cloneColumnField)),
    fieldDataRows: (source.fieldDataRows ?? []).map(r => r.map(cloneFieldCellValue)),
  }
}

/** 열 삭제: 헤더·각 행에서 해당 인덱스 제거. 열이 최소 개수 이하면 `null`. */
export function horizontalTableRemoveColumn(
  p: HorizontalTableParagraph,
  columnIndex: number
): HorizontalTableParagraph | null {
  const colCount = Math.max(1, p.columnHeaders.length)
  if (colCount <= HORIZONTAL_TABLE_MIN_COLUMN_COUNT) return null
  if (columnIndex < 0 || columnIndex >= colCount) return null

  const nextHeaders = p.columnHeaders.filter((_, i) => i !== columnIndex)
  const nextRows =
    p.dataRows.length === 0
      ? []
      : p.dataRows.map(r => {
          const row = [...r]
          while (row.length < colCount) row.push('')
          return row.filter((_, i) => i !== columnIndex)
        })
  if (p.tableFlavor !== 'field') {
    const nextColFields = (p.columnFields ?? []).filter((_, i) => i !== columnIndex)
    const nextMatrix = p.cellColumnFields?.map(r => r.filter((_, i) => i !== columnIndex))
    return {
      ...p,
      columnHeaders: nextHeaders,
      dataRows: nextRows,
      columnFields: nextColFields,
      cellColumnFields: nextMatrix,
    }
  }
  const nextFields = (p.columnFields ?? []).filter((_, i) => i !== columnIndex)
  const nextFieldRows = (p.fieldDataRows ?? []).map(r => r.filter((_, i) => i !== columnIndex))
  const nextMatrix = p.cellColumnFields?.map(r => r.filter((_, i) => i !== columnIndex))
  return {
    ...p,
    columnHeaders: nextHeaders,
    dataRows: nextRows,
    columnFields: nextFields,
    cellColumnFields: nextMatrix,
    fieldDataRows: nextFieldRows,
  }
}

/** 데이터 행 삭제. 본문 행이 1줄뿐이면 `null`. */
export function horizontalTableRemoveRow(
  p: HorizontalTableParagraph,
  rowIndex: number
): HorizontalTableParagraph | null {
  const colCount = Math.max(1, p.columnHeaders.length)
  let rows = p.dataRows.map(r => {
    const row = [...r]
    while (row.length < colCount) row.push('')
    return row.slice(0, colCount)
  })
  if (rows.length === 0) {
    rows = [Array.from({ length: colCount }, () => '')]
  }
  if (rows.length <= 1) return null
  if (rowIndex < 0 || rowIndex >= rows.length) return null
  if (p.tableFlavor !== 'field') {
    const nextMatrix = p.cellColumnFields?.filter((_, i) => i !== rowIndex)
    return { ...p, dataRows: rows.filter((_, i) => i !== rowIndex), cellColumnFields: nextMatrix }
  }
  return {
    ...p,
    dataRows: rows.filter((_, i) => i !== rowIndex),
    fieldDataRows: (p.fieldDataRows ?? []).filter((_, i) => i !== rowIndex),
    cellColumnFields: p.cellColumnFields?.filter((_, i) => i !== rowIndex),
  }
}

/**
 * 로드·저장 JSON에 필드 누락이 있을 수 있어 보정.
 * (구버전: `tableFlavor` 없음 = 텍스트형)
 */
export function normalizeHorizontalTableParagraph(
  p: HorizontalTableParagraph
): HorizontalTableParagraph {
  const tableFlavor: HorizontalTableFlavor = p.tableFlavor === 'field' ? 'field' : 'text'
  const colCount = Math.max(1, p.columnHeaders?.length ?? 0)
  const headers = (() => {
    const h = [...(p.columnHeaders ?? [])]
    while (h.length < colCount) h.push('')
    return h.slice(0, colCount)
  })()
  let dataRows = (p.dataRows ?? []).map(r => {
    const row = [...r]
    while (row.length < colCount) row.push('')
    return row.slice(0, colCount)
  })
  if (dataRows.length === 0) {
    dataRows = [Array.from({ length: colCount }, () => '')]
  }
  if (tableFlavor === 'text') {
    const rowCount = dataRows.length
    const hasDataInCells = dataRows.some(r => r.some(c => String(c ?? '').trim().length > 0))
    let nextDataRows = dataRows
    let nextColumnFields = p.columnFields ?? []
    let nextCellMatrix = p.cellColumnFields

    if (hasDataInCells) {
      if (rowCount <= 1) {
        const row0 = dataRows[0] ?? Array.from({ length: colCount }, () => '')
        nextColumnFields = Array.from({ length: colCount }, (_, ci) =>
          repairColumnField(
            {
              kind: 'text' as const,
              placeholder:
                String(row0[ci] ?? '').trim().length > 0
                  ? String(row0[ci] ?? '')
                  : HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
            },
            ci
          )
        )
        nextDataRows = [Array.from({ length: colCount }, () => '')]
        nextCellMatrix = undefined
      } else {
        nextCellMatrix = dataRows.map(row =>
          Array.from({ length: colCount }, (_, ci) =>
            repairColumnField(
              {
                kind: 'text' as const,
                placeholder:
                  String(row[ci] ?? '').trim().length > 0
                    ? String(row[ci] ?? '')
                    : HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
              },
              ci
            )
          )
        )
        nextColumnFields = nextCellMatrix[0]!.map((f, i) => repairColumnField(f, i))
        nextDataRows = dataRows.map(() => Array.from({ length: colCount }, () => ''))
      }
    } else if (
      !hasDataInCells &&
      ((nextColumnFields?.length ?? 0) > 0 || (nextCellMatrix != null && nextCellMatrix.length > 0))
    ) {
      nextDataRows = dataRows.map(() => Array.from({ length: colCount }, () => ''))
    }

    return {
      ...p,
      tableFlavor: 'text',
      columnHeaders: headers,
      dataRows: nextDataRows,
      columnFields: nextColumnFields,
      fieldDataRows: p.fieldDataRows ?? [],
      cellColumnFields: nextCellMatrix,
      bottomText: p.bottomText ?? '',
      showBottomText: Boolean(p.showBottomText),
      showBottomConsent: Boolean(p.showBottomConsent),
      bottomConsent: normalizeTableBottomConsent(p.bottomConsent),
    }
  }
  /** `columnFields`가 비어 있으면 슬롯마다 주관식으로 채우지 않고 텍스트형 기본(필드형 최초·복구 시 한 셀만 바꿔도 전행 주관식 되는 문제 방지) */
  const rawColumnFields = p.columnFields ?? []
  const fieldCols =
    rawColumnFields.length > 0
      ? ensureColumnFieldSlice(
          {
            ...p,
            columnHeaders: headers,
            dataRows,
            tableFlavor: 'field',
          } as HorizontalTableParagraph,
          colCount
        )
      : Array.from({ length: colCount }, () => defaultFieldForColumnKind('text'))
  const rowCount = dataRows.length
  const baseField: HorizontalTableParagraph = {
    ...p,
    columnHeaders: headers,
    dataRows,
    tableFlavor: 'field',
    columnFields: fieldCols,
  } as HorizontalTableParagraph

  if (
    p.cellColumnFields == null ||
    (Array.isArray(p.cellColumnFields) && p.cellColumnFields.length === 0)
  ) {
    const fieldDataRowsOnlyCol = syncFieldDataRowsToTextRows(baseField, colCount, fieldCols)
    return {
      ...p,
      tableFlavor: 'field',
      columnHeaders: headers,
      dataRows,
      columnFields: fieldCols,
      fieldDataRows: fieldDataRowsOnlyCol,
      cellColumnFields: undefined,
      bottomText: p.bottomText ?? '',
      showBottomText: Boolean(p.showBottomText),
      showBottomConsent: Boolean(p.showBottomConsent),
      bottomConsent: normalizeTableBottomConsent(p.bottomConsent),
    }
  }

  const normMatrix = Array.from({ length: rowCount }, (_, ri) =>
    Array.from({ length: colCount }, (_, ci) => {
      const ex = p.cellColumnFields?.[ri]?.[ci]
      return repairColumnField(ex ?? fieldCols[ci], ci)
    })
  )
  const fieldDataRowsMatrix = Array.from({ length: rowCount }, (_, ri) =>
    padFieldRow(p.fieldDataRows?.[ri], colCount, normMatrix[ri]!).map((cell, ci) =>
      rehomeFieldCellValue(cell, normMatrix[ri]![ci]!)
    )
  )
  const columnFieldsSynced =
    rowCount === 1 ? normMatrix[0]!.map((f, i) => repairColumnField(f, i)) : fieldCols
  return {
    ...p,
    tableFlavor: 'field',
    columnHeaders: headers,
    dataRows,
    columnFields: columnFieldsSynced,
    fieldDataRows: fieldDataRowsMatrix,
    cellColumnFields: normMatrix,
    bottomText: p.bottomText ?? '',
    showBottomText: Boolean(p.showBottomText),
    showBottomConsent: Boolean(p.showBottomConsent),
    bottomConsent: normalizeTableBottomConsent(p.bottomConsent),
  }
}

/** 우측 패널·초기화용 — 텍스트 ↔ 필드 전환 */
export function horizontalTableSetFlavor(
  p: HorizontalTableParagraph,
  nextFlavor: HorizontalTableFlavor
): HorizontalTableParagraph {
  const n = normalizeHorizontalTableParagraph(p)
  const colCount = Math.max(1, n.columnHeaders.length)
  if (n.tableFlavor === nextFlavor) {
    return n
  }
  if (nextFlavor === 'field') {
    const existingCols = n.columnFields ?? []
    const fieldCols =
      existingCols.length > 0
        ? ensureColumnFieldSlice(n, colCount)
        : Array.from({ length: colCount }, () => defaultFieldForColumnKind('text'))
    const fieldDataRows = syncFieldDataRowsToTextRows(
      { ...n, tableFlavor: 'field', columnFields: fieldCols } as HorizontalTableParagraph,
      colCount,
      fieldCols
    )
    return normalizeHorizontalTableParagraph({
      ...n,
      tableFlavor: 'field',
      columnFields: fieldCols,
      fieldDataRows,
    } as HorizontalTableParagraph)
  }
  const dataRows = n.dataRows.map((textRow, ri) =>
    textRow.map((t, ci) => {
      const cell = n.fieldDataRows?.[ri]?.[ci]
      if (cell) {
        return fieldCellValueToPlainText(cell)
      }
      return t
    })
  )
  return normalizeHorizontalTableParagraph({
    ...n,
    tableFlavor: 'text',
    dataRows,
    columnFields: [],
    fieldDataRows: [],
    cellColumnFields: undefined,
  } as HorizontalTableParagraph)
}

/**
 * 가로형 `tableFlavor: 'text'`일 때 우측 패널·열 유형 변경을 위해 필드형으로 승격.
 * 각 열은 `kind: 'text'`로 두고 `dataRows` 문자열을 `fieldDataRows` 텍스트 셀 값으로 옮김.
 */
export function horizontalTablePromoteTextRowsToField(
  p: HorizontalTableParagraph
): HorizontalTableParagraph {
  const n = normalizeHorizontalTableParagraph(p)
  if (n.tableFlavor === 'field') return n
  const colCount = Math.max(1, n.columnHeaders.length)
  const headers = [...n.columnHeaders]
  while (headers.length < colCount) headers.push('')
  let dataRows = n.dataRows.map(r => {
    const row = [...r]
    while (row.length < colCount) row.push('')
    return row.slice(0, colCount)
  })
  if (dataRows.length === 0) {
    dataRows = [Array.from({ length: colCount }, () => '')]
  }
  const rowCount = dataRows.length
  const matrix: HorizontalTableColumnField[][] = dataRows.map(textRow =>
    Array.from({ length: colCount }, (_, ci) => {
      const t = String(textRow[ci] ?? '').trim()
      return repairColumnField(
        {
          kind: 'text' as const,
          placeholder:
            t.length > 0 ? String(textRow[ci] ?? '') : HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
        },
        ci
      )
    })
  )
  const fieldCols = matrix[0]!.map((f, i) => repairColumnField(f, i))
  const fieldDataRows = dataRows.map(textRow =>
    textRow.map(() => ({ kind: 'text' as const, value: '' }))
  )
  return normalizeHorizontalTableParagraph({
    ...n,
    tableFlavor: 'field',
    columnHeaders: headers.slice(0, colCount),
    dataRows,
    columnFields: rowCount === 1 ? fieldCols : ensureColumnFieldSlice(n, colCount),
    fieldDataRows,
    cellColumnFields: rowCount === 1 ? undefined : matrix,
  } as HorizontalTableParagraph)
}

/** 열 `colIdx`의 필드 정의 변경 — 해당 열 전체(모든 행)에 동일 정의 적용 후 값 재맞춤 */
export function horizontalTableUpdateColumnField(
  p: HorizontalTableParagraph,
  colIdx: number,
  nextField: HorizontalTableColumnField
): HorizontalTableParagraph {
  let n = normalizeHorizontalTableParagraph(p)
  if (n.tableFlavor !== 'field') {
    n = horizontalTablePromoteTextRowsToField(n)
  }
  const colCount = Math.max(1, n.columnHeaders.length)
  if (colIdx < 0 || colIdx >= colCount) return n
  const fieldCols = ensureColumnFieldSlice(n, colCount)
  fieldCols[colIdx] = repairColumnField(nextField, colIdx)
  const rowCount = Math.max(1, n.dataRows.length)
  const colTemplate = fieldCols[colIdx]!
  let matrix = n.cellColumnFields
  if (matrix != null) {
    matrix = Array.from({ length: rowCount }, (_, ri) => {
      const prevRow = matrix![ri] ?? []
      return Array.from({ length: colCount }, (_, ci) => {
        if (ci === colIdx) return cloneColumnField(colTemplate)
        return repairColumnField(prevRow[ci] ?? fieldCols[ci], ci)
      })
    })
  }
  const nextRows = Array.from({ length: rowCount }, (_, ri) => {
    const rowFields = matrix != null ? matrix[ri]! : fieldCols
    const padded = padFieldRow(n.fieldDataRows?.[ri], colCount, rowFields)
    return padded.map((cell, c) => rehomeFieldCellValue(cell, rowFields[c]!))
  })
  const columnHeadersPatch = [...n.columnHeaders]
  while (columnHeadersPatch.length < colCount) columnHeadersPatch.push('')
  const colTemplateKind = repairColumnField(fieldCols[colIdx], colIdx).kind
  if (colTemplateKind === 'text') {
    clearHeaderIfAutoFieldKindLabel(columnHeadersPatch, colIdx)
  }
  const columnFieldsOut =
    rowCount === 1 && matrix != null ? matrix[0]!.map((f, i) => repairColumnField(f, i)) : fieldCols
  return {
    ...n,
    columnHeaders: columnHeadersPatch.slice(0, colCount),
    columnFields: columnFieldsOut,
    cellColumnFields: matrix ?? undefined,
    fieldDataRows: nextRows,
  }
}

/** 바디에서 선택한 `(rowIdx, colIdx)` 칸만 필드 정의 변경 — 다른 행의 같은 열은 유지 */
export function horizontalTableUpdateBodyCellColumnField(
  p: HorizontalTableParagraph,
  rowIdx: number,
  colIdx: number,
  nextField: HorizontalTableColumnField
): HorizontalTableParagraph {
  let n = normalizeHorizontalTableParagraph(p)
  if (n.tableFlavor !== 'field') {
    n = horizontalTablePromoteTextRowsToField(n)
  }
  const colCount = Math.max(1, n.columnHeaders.length)
  const rowCount = Math.max(1, n.dataRows.length)
  if (colIdx < 0 || colIdx >= colCount || rowIdx < 0 || rowIdx >= rowCount) return n

  const fieldCols = ensureColumnFieldSlice(n, colCount)
  const repaired = repairColumnField(nextField, colIdx)

  let matrix: HorizontalTableColumnField[][]
  if (n.cellColumnFields == null) {
    matrix = Array.from({ length: rowCount }, () => fieldCols.map(f => cloneColumnField(f)))
  } else {
    matrix = Array.from({ length: rowCount }, (_, ri) =>
      Array.from({ length: colCount }, (_, ci) => {
        const ex = n.cellColumnFields![ri]?.[ci]
        return repairColumnField(ex ?? fieldCols[ci], ci)
      })
    )
  }
  const updatedRow = matrix[rowIdx]!.map((f, ci) =>
    ci === colIdx ? repaired : cloneColumnField(f)
  )
  matrix = matrix.map((row, ri) => (ri === rowIdx ? updatedRow : row))

  const fieldDataRows = Array.from({ length: rowCount }, (_, ri) =>
    padFieldRow(n.fieldDataRows?.[ri], colCount, matrix[ri]!).map((cell, ci) =>
      rehomeFieldCellValue(cell, matrix[ri]![ci]!)
    )
  )

  const columnHeadersPatch = [...n.columnHeaders]
  while (columnHeadersPatch.length < colCount) columnHeadersPatch.push('')
  if (repaired.kind === 'text') {
    clearHeaderIfAutoFieldKindLabel(columnHeadersPatch, colIdx)
  }

  const columnFieldsOut =
    rowCount === 1 ? matrix[0]!.map((f, i) => repairColumnField(f, i)) : fieldCols

  return {
    ...n,
    columnHeaders: columnHeadersPatch.slice(0, colCount),
    columnFields: columnFieldsOut,
    cellColumnFields: matrix,
    fieldDataRows,
  }
}

/** 필드 모드: 특정 셀 값(미리보기) 갱신 */
export function horizontalTableSetFieldCellValue(
  p: HorizontalTableParagraph,
  rowIdx: number,
  colIdx: number,
  value: HorizontalTableFieldCellValue
): HorizontalTableParagraph {
  const n = normalizeHorizontalTableParagraph(p)
  if (n.tableFlavor !== 'field') return n
  const colCount = Math.max(1, n.columnHeaders.length)
  const fieldCols = ensureColumnFieldSlice(n, colCount)
  const rowCount = Math.max(1, n.dataRows.length, n.fieldDataRows.length)
  const base: HorizontalTableFieldCellValue[][] = Array.from({ length: rowCount }, (_, ri) =>
    padFieldRow(n.fieldDataRows?.[ri], colCount, getHorizontalTableRowFieldSlice(n, ri, colCount))
  )
  if (rowIdx < 0 || rowIdx >= base.length) return n
  const rowFields = getHorizontalTableRowFieldSlice(n, rowIdx, colCount)
  const f = rowFields[colIdx] ?? defaultColumnFieldForNewColumn()
  const row = [...base[rowIdx]!]
  row[colIdx] = rehomeFieldCellValue(value, f)
  base[rowIdx] = row
  return { ...n, columnFields: fieldCols, fieldDataRows: base }
}

/** 세로형 단일·다중 선택 공통 선택지 (비어 있으면 정규화 시 기본값) */
export function normalizeVerticalChoiceOptions(raw: unknown): string[] {
  if (!Array.isArray(raw) || raw.length === 0) return [...DEFAULT_CHOICE_OPTIONS]
  const opts = raw.map(x => String(x ?? '').trim()).filter(s => s.length > 0)
  return opts.length > 0 ? opts : [...DEFAULT_CHOICE_OPTIONS]
}

function parseStringArrayUnknown(u: unknown): string[] {
  if (!Array.isArray(u)) return []
  return u.map(x => String(x ?? '').trim()).filter(s => s.length > 0)
}

function filterSelectionsByOptions(selected: string[], optionSet: string[]): string[] {
  const set = new Set(optionSet)
  return selected.filter(s => set.has(s))
}

function rehomeVerticalSingleCell(value: string, options: string[]): string {
  const v = value.trim()
  return v !== '' && options.includes(v) ? v : ''
}

export function coerceVerticalTableFlavor(raw: unknown): VerticalTableFlavor {
  if (raw === 'subjective') return 'subjective'
  if (raw === 'date_time') return 'date_time'
  if (raw === 'single_choice') return 'single_choice'
  if (raw === 'multiple_choice') return 'multiple_choice'
  if (raw === 'file_attachment') return 'file_attachment'
  return 'text'
}

export function coerceVerticalTableStageKind(raw: unknown): VerticalTableStageKind {
  if (raw === 'subjective') return 'subjective'
  if (raw === 'date_time') return 'date_time'
  if (raw === 'single_choice') return 'single_choice'
  if (raw === 'multiple_choice') return 'multiple_choice'
  return 'text'
}

function defaultVerticalStageKindForFlavor(flavor: VerticalTableFlavor): VerticalTableStageKind {
  return flavor === 'file_attachment' ? 'text' : flavor
}

/** 새 행·빈 단락 초기화용 — 단락 flavor에 맞는 기본 행 */
export function defaultVerticalTableRowForFlavor(flavor: VerticalTableFlavor): VerticalTableRow {
  if (flavor === 'multiple_choice') {
    return {
      stageCount: 1,
      headers: [''],
      cells: [''],
      stageKinds: [defaultVerticalStageKindForFlavor(flavor)],
      choiceMultipleSelections: [[]],
    }
  }
  return {
    stageCount: 1,
    headers: [''],
    cells: [''],
    stageKinds: [defaultVerticalStageKindForFlavor(flavor)],
  }
}

/** 세로형 `text` 단락 기본 본문: 1행(1단) + 2행(2단) */
function defaultVerticalTextTableInitialRows(): VerticalTableRow[] {
  return [
    { stageCount: 1, headers: [''], cells: [''], stageKinds: ['text'] },
    { stageCount: 2, headers: ['', ''], cells: ['', ''], stageKinds: ['text', 'text'] },
  ]
}

function normalizeRowsForVerticalFlavor(
  rows: VerticalTableRow[],
  flavor: VerticalTableFlavor,
  options: string[]
): VerticalTableRow[] {
  return rows.map(r => normalizeVerticalTableRowChoices(r, flavor, options))
}

function normalizeVerticalTableRowChoices(
  row: VerticalTableRow,
  flavor: VerticalTableFlavor,
  options: string[]
): VerticalTableRow {
  const base = normalizeVerticalTableRow(row)
  const stageKinds = effectiveVerticalStageKinds(base, flavor)
  const r = { ...base, stageKinds } as VerticalTableRow
  if (flavor === 'single_choice') {
    if (r.stageCount === 1) {
      return {
        ...r,
        cells: [rehomeVerticalSingleCell(r.cells[0] ?? '', options)],
      }
    }
    return {
      ...r,
      cells: [
        rehomeVerticalSingleCell(r.cells[0] ?? '', options),
        rehomeVerticalSingleCell(r.cells[1] ?? '', options),
      ],
    }
  }
  if (flavor === 'multiple_choice') {
    if (r.stageCount === 1) {
      const prev = parseStringArrayUnknown(r.choiceMultipleSelections?.[0])
      return {
        ...r,
        choiceMultipleSelections: [filterSelectionsByOptions(prev, options)],
      }
    }
    const p0 = parseStringArrayUnknown(r.choiceMultipleSelections?.[0])
    const p1 = parseStringArrayUnknown(r.choiceMultipleSelections?.[1])
    return {
      ...r,
      choiceMultipleSelections: [
        filterSelectionsByOptions(p0, options),
        filterSelectionsByOptions(p1, options),
      ],
    }
  }
  const rest = r as VerticalTableRow & { choiceMultipleSelections?: unknown }
  if (rest.choiceMultipleSelections !== undefined) {
    const { choiceMultipleSelections: _drop, ...noChoice } = rest
    return noChoice as VerticalTableRow
  }
  return r
}

/** 선택지 목록 변경 시 단락 전체 행 값 재맞춤 */
export function verticalTableParagraphWithChoiceOptions(
  p: VerticalTableParagraph,
  nextOptions: string[]
): VerticalTableParagraph {
  const n = normalizeVerticalTableParagraph(p)
  return normalizeVerticalTableParagraph({
    ...n,
    verticalChoiceOptions: normalizeVerticalChoiceOptions(nextOptions),
  })
}

function isDateTimeFieldMode(x: unknown): x is DateTimeFieldMode {
  return x === 'date' || x === 'time' || x === 'date_time'
}

export function normalizeVerticalTableRow(raw: unknown): VerticalTableRow {
  if (raw != null && typeof raw === 'object' && 'stageCount' in raw) {
    const sc = (raw as { stageCount?: number }).stageCount
    if (sc === 2) {
      const r = raw as {
        headers?: string[]
        cells?: string[]
        stageKinds?: unknown[]
        placeholderHints?: string[]
        choiceMultipleSelections?: unknown
        dateTimeStage1Time?: unknown
        dateTimeStageModes?: unknown
        dateTimeCompositeTimeHints?: unknown
        dateTimeStage0AuxTime?: unknown
      }
      const h = r.headers ?? []
      const c = r.cells ?? []
      const row: VerticalTableRow = {
        stageCount: 2,
        headers: [h[0] ?? '', h[1] ?? ''],
        cells: [c[0] ?? '', c[1] ?? ''],
      }
      const sk = r.stageKinds
      if (Array.isArray(sk) && sk.length >= 1) {
        row.stageKinds = [coerceVerticalTableStageKind(sk[0]), coerceVerticalTableStageKind(sk[1])]
      }
      const cms2 = r.choiceMultipleSelections
      if (Array.isArray(cms2) && cms2.length >= 2) {
        row.choiceMultipleSelections = [
          parseStringArrayUnknown(cms2[0]),
          parseStringArrayUnknown(cms2[1]),
        ]
      }
      const ph = r.placeholderHints
      if (ph != null && ph.length >= 1) {
        row.placeholderHints = [ph[0] ?? '', ph[1] ?? '']
      }
      if (typeof r.dateTimeStage1Time === 'string') {
        row.dateTimeStage1Time = r.dateTimeStage1Time
      }
      const sm = r.dateTimeStageModes
      if (
        Array.isArray(sm) &&
        sm.length >= 2 &&
        isDateTimeFieldMode(sm[0]) &&
        isDateTimeFieldMode(sm[1])
      ) {
        row.dateTimeStageModes = [sm[0], sm[1]]
      }
      const cth = r.dateTimeCompositeTimeHints
      if (Array.isArray(cth) && cth.length >= 1) {
        row.dateTimeCompositeTimeHints = [String(cth[0] ?? ''), String(cth[1] ?? '')]
      }
      if (typeof r.dateTimeStage0AuxTime === 'string') {
        row.dateTimeStage0AuxTime = r.dateTimeStage0AuxTime
      }
      return row
    }
  }
  const h =
    raw != null && typeof raw === 'object' && 'headers' in raw
      ? (raw as { headers?: string[] }).headers
      : undefined
  const c =
    raw != null && typeof raw === 'object' && 'cells' in raw
      ? (raw as { cells?: string[] }).cells
      : undefined
  const ph1 =
    raw != null && typeof raw === 'object' && 'placeholderHints' in raw
      ? (raw as { placeholderHints?: string[] }).placeholderHints
      : undefined
  const sk1 =
    raw != null && typeof raw === 'object' && 'stageKinds' in raw
      ? (raw as { stageKinds?: unknown[] }).stageKinds
      : undefined
  const row1: VerticalTableRow = {
    stageCount: 1,
    headers: [h?.[0] ?? ''],
    cells: [c?.[0] ?? ''],
  }
  if (Array.isArray(sk1) && sk1.length >= 1) {
    row1.stageKinds = [coerceVerticalTableStageKind(sk1[0])]
  }
  if (ph1 != null && ph1.length >= 1) {
    row1.placeholderHints = [ph1[0] ?? '']
  }
  if (raw != null && typeof raw === 'object') {
    const cms1 = (raw as { choiceMultipleSelections?: unknown }).choiceMultipleSelections
    if (Array.isArray(cms1) && cms1.length >= 1) {
      row1.choiceMultipleSelections = [parseStringArrayUnknown(cms1[0])]
    }
  }
  if (raw != null && typeof raw === 'object') {
    const rawObj = raw as {
      dateTimeSingleStageMode?: unknown
      dateTimeStageModes?: unknown
      dateTimeCompositeTimeHints?: unknown
      dateTimeStage0AuxTime?: unknown
      dateTimeStage1Time?: unknown
    }
    const dm = rawObj.dateTimeSingleStageMode
    if (dm === 'date' || dm === 'time' || dm === 'date_time') {
      row1.dateTimeSingleStageMode = dm
    }
    const sms = rawObj.dateTimeStageModes
    if (Array.isArray(sms) && sms.length >= 1 && isDateTimeFieldMode((sms as unknown[])[0])) {
      row1.dateTimeStageModes = [(sms as [DateTimeFieldMode])[0]]
    }
    const cth = rawObj.dateTimeCompositeTimeHints
    if (Array.isArray(cth) && cth.length >= 1 && typeof (cth as string[])[0] === 'string') {
      row1.dateTimeCompositeTimeHints = [(cth as string[])[0] ?? '']
    }
    if (typeof rawObj.dateTimeStage0AuxTime === 'string') {
      row1.dateTimeStage0AuxTime = rawObj.dateTimeStage0AuxTime
    }
    if (typeof rawObj.dateTimeStage1Time === 'string') {
      row1.dateTimeStage1Time = rawObj.dateTimeStage1Time
    }
  }
  return row1
}

/** 날짜/시간형 세로 테이블 행 — 스테이지별 우측 패널 「유형」 (레거시·생략 시 기본) */
export function effectiveVerticalRowDateTimeModes(
  row: VerticalTableRow
): [DateTimeFieldMode] | [DateTimeFieldMode, DateTimeFieldMode] {
  if (row.stageCount === 1) {
    const dm = row.dateTimeStageModes
    if (dm && dm.length >= 1 && isDateTimeFieldMode(dm[0])) {
      return [dm[0]]
    }
    const legacy = row.dateTimeSingleStageMode
    if (isDateTimeFieldMode(legacy)) {
      return [legacy]
    }
    return ['date']
  }
  const dm = row.dateTimeStageModes
  if (dm && dm.length >= 2 && isDateTimeFieldMode(dm[0]) && isDateTimeFieldMode(dm[1])) {
    return [dm[0], dm[1]]
  }
  return ['date', 'date_time']
}

export function effectiveVerticalStageKinds(
  row: VerticalTableRow,
  paragraphFlavor: VerticalTableFlavor
): [VerticalTableStageKind] | [VerticalTableStageKind, VerticalTableStageKind] {
  const fallback = defaultVerticalStageKindForFlavor(paragraphFlavor)
  if (row.stageCount === 1) {
    return [coerceVerticalTableStageKind(row.stageKinds?.[0] ?? fallback)]
  }
  return [
    coerceVerticalTableStageKind(row.stageKinds?.[0] ?? fallback),
    coerceVerticalTableStageKind(row.stageKinds?.[1] ?? fallback),
  ]
}

/** 합성(날짜+시간) 스테이지의 시간 인풋 플레이스홀더 */
export function effectiveVerticalCompositeTimeHint(row: VerticalTableRow, stageIdx: 0 | 1): string {
  const h = row.dateTimeCompositeTimeHints?.[stageIdx] ?? ''
  return h.trim() !== '' ? h : VERTICAL_DT_COMPOSITE_TIME_PLACEHOLDER
}

export function normalizeVerticalTableParagraph(p: VerticalTableParagraph): VerticalTableParagraph {
  const verticalTableFlavor = coerceVerticalTableFlavor(p.verticalTableFlavor)
  const verticalChoiceOptions = normalizeVerticalChoiceOptions(p.verticalChoiceOptions)
  const rowsIn = p.rows ?? []
  let rows = rowsIn.map(normalizeVerticalTableRow)
  if (rows.length === 0) {
    rows =
      verticalTableFlavor === 'text'
        ? defaultVerticalTextTableInitialRows().map(normalizeVerticalTableRow)
        : [normalizeVerticalTableRow(defaultVerticalTableRowForFlavor(verticalTableFlavor))]
  }
  if (verticalTableFlavor === 'file_attachment') {
    rows = rows.slice(0, 1)
    const r0 = rows[0] ?? defaultVerticalTableRowForFlavor('file_attachment')
    if (r0.stageCount === 2) {
      rows = [verticalTableRowWithStageCount(r0, 1, 'file_attachment')]
    } else {
      rows = [r0]
    }
  }
  rows = normalizeRowsForVerticalFlavor(rows, verticalTableFlavor, verticalChoiceOptions)
  const verticalFileAttachmentHeaderLabel =
    verticalTableFlavor === 'file_attachment'
      ? (p.verticalFileAttachmentHeaderLabel ?? '').trim() !== ''
        ? (p.verticalFileAttachmentHeaderLabel ?? '').trim()
        : DEFAULT_VERTICAL_FILE_ATTACHMENT_HEADER_LABEL
      : undefined
  return {
    ...p,
    variant: 'vertical_table',
    verticalTableFlavor,
    verticalChoiceOptions,
    rows,
    verticalFileAttachmentHeaderLabel,
    bottomText: p.bottomText ?? '',
    showBottomText: Boolean(p.showBottomText),
    showBottomConsent: Boolean(p.showBottomConsent),
    bottomConsent: normalizeTableBottomConsent(p.bottomConsent),
    answerRequired: p.answerRequired !== false,
  }
}

/** 기본 제목 없을 때 우측 패널·아웃라인 등에 사용 */
export function verticalTableParagraphOutlineLabel(flavor: VerticalTableFlavor): string {
  if (flavor === 'subjective') return '테이블_세로형(주관식형)'
  if (flavor === 'date_time') return '테이블_세로형(날짜/시간형)'
  if (flavor === 'single_choice') return '테이블_세로형(단일선택형)'
  if (flavor === 'multiple_choice') return '테이블_세로형(다중선택형)'
  if (flavor === 'file_attachment') return '테이블_세로형(파일첨부형)'
  return '테이블_세로형(텍스트형)'
}

export function createVerticalTableParagraph(
  id: string,
  flavor: VerticalTableFlavor = 'text'
): VerticalTableParagraph {
  return normalizeVerticalTableParagraph({
    id,
    kind: 'single_item',
    variant: 'vertical_table',
    verticalTableFlavor: flavor,
    requiredMark: true,
    /** 비우면 카드·네비는 `타이틀을 입력해 주세요` 플레이스홀더 톤(유형명 자동 노출 없음) */
    paragraphTitle: '',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    rows:
      flavor === 'text'
        ? defaultVerticalTextTableInitialRows()
        : [defaultVerticalTableRowForFlavor(flavor)],
    verticalChoiceOptions:
      flavor === 'single_choice' || flavor === 'multiple_choice'
        ? [...DEFAULT_CHOICE_OPTIONS]
        : undefined,
    ...(flavor === 'file_attachment'
      ? { verticalFileAttachmentHeaderLabel: DEFAULT_VERTICAL_FILE_ATTACHMENT_HEADER_LABEL }
      : {}),
    bottomText: '',
    showBottomText: false,
    showBottomConsent: true,
    bottomConsent: 'agree',
    answerRequired: true,
  })
}

export function cloneVerticalTableParagraph(
  source: VerticalTableParagraph,
  newId: string
): VerticalTableParagraph {
  const n = normalizeVerticalTableParagraph(source)
  return {
    ...n,
    id: newId,
    verticalChoiceOptions:
      n.verticalChoiceOptions != null ? [...n.verticalChoiceOptions] : undefined,
    rows: n.rows.map(r => {
      if (r.stageCount === 2) {
        const out: VerticalTableRow = {
          stageCount: 2,
          headers: [...r.headers] as [string, string],
          cells: [...r.cells] as [string, string],
        }
        if (r.stageKinds) {
          out.stageKinds = [...r.stageKinds] as [VerticalTableStageKind, VerticalTableStageKind]
        }
        if (r.placeholderHints) {
          out.placeholderHints = [...r.placeholderHints] as [string, string]
        }
        if (r.choiceMultipleSelections) {
          out.choiceMultipleSelections = [
            [...r.choiceMultipleSelections[0]],
            [...r.choiceMultipleSelections[1]],
          ]
        }
        if (r.dateTimeStage1Time !== undefined) {
          out.dateTimeStage1Time = r.dateTimeStage1Time
        }
        if (r.dateTimeStageModes) {
          out.dateTimeStageModes = [...r.dateTimeStageModes] as [
            DateTimeFieldMode,
            DateTimeFieldMode,
          ]
        }
        if (r.dateTimeCompositeTimeHints) {
          out.dateTimeCompositeTimeHints = [...r.dateTimeCompositeTimeHints] as [string, string]
        }
        if (r.dateTimeStage0AuxTime !== undefined) {
          out.dateTimeStage0AuxTime = r.dateTimeStage0AuxTime
        }
        return out
      }
      const out1: VerticalTableRow = {
        stageCount: 1,
        headers: [...r.headers] as [string],
        cells: [...r.cells] as [string],
      }
      if (r.stageKinds) {
        out1.stageKinds = [...r.stageKinds] as [VerticalTableStageKind]
      }
      if (r.placeholderHints) {
        out1.placeholderHints = [...r.placeholderHints] as [string]
      }
      if (r.choiceMultipleSelections) {
        out1.choiceMultipleSelections = [[...r.choiceMultipleSelections[0]]]
      }
      if (r.dateTimeSingleStageMode !== undefined) {
        out1.dateTimeSingleStageMode = r.dateTimeSingleStageMode
      }
      if (r.dateTimeStage1Time !== undefined) {
        out1.dateTimeStage1Time = r.dateTimeStage1Time
      }
      if (r.dateTimeStageModes !== undefined) {
        out1.dateTimeStageModes = [...r.dateTimeStageModes] as [DateTimeFieldMode]
      }
      if (r.dateTimeCompositeTimeHints !== undefined) {
        out1.dateTimeCompositeTimeHints = [...r.dateTimeCompositeTimeHints] as [string]
      }
      if (r.dateTimeStage0AuxTime !== undefined) {
        out1.dateTimeStage0AuxTime = r.dateTimeStage0AuxTime
      }
      return out1
    }),
  }
}

export function verticalTableAddRow(p: VerticalTableParagraph): VerticalTableParagraph {
  const n = normalizeVerticalTableParagraph(p)
  if (n.verticalTableFlavor === 'file_attachment') {
    return n
  }
  return {
    ...n,
    rows: [...n.rows, defaultVerticalTableRowForFlavor(n.verticalTableFlavor)],
  }
}

/** 데이터 행은 최소 1개 유지. 삭제 불가 시 `null`. */
export function verticalTableRemoveRow(
  p: VerticalTableParagraph,
  rowIndex: number
): VerticalTableParagraph | null {
  const n = normalizeVerticalTableParagraph(p)
  if (n.rows.length <= 1) return null
  if (rowIndex < 0 || rowIndex >= n.rows.length) return n
  return { ...n, rows: n.rows.filter((_, i) => i !== rowIndex) }
}

/**
 * 선택 행의 1단/2단 전환.
 * - 2단→1단: 좌측(첫 번째 th|td)만 유지, 우측 스테이지 데이터는 제거·비노출.
 * - 1단→2단: 첫 쌍 유지, 두 번째 쌍은 빈 값으로 추가.
 * 캔버스·우측 패널 넘버링은 각각 `verticalTableHeaderPlaceholder` / `verticalTablePanelStageTitle`로 `stageCount` 반영.
 */
export function verticalTableRowWithStageCount(
  row: VerticalTableRow,
  stageCount: 1 | 2,
  flavor: VerticalTableFlavor
): VerticalTableRow {
  if (flavor !== 'date_time') {
    const base = normalizeVerticalTableRow(row)
    const b = base as VerticalTableRow
    const h0 = b.headers[0] ?? ''
    const c0 = b.cells[0] ?? ''
    const ph0 = b.placeholderHints?.[0]
    const ph1 = b.placeholderHints?.[1]
    const stageKinds = effectiveVerticalStageKinds(b, flavor)

    if (stageCount === 1) {
      if (flavor === 'multiple_choice') {
        const kept = parseStringArrayUnknown(b.choiceMultipleSelections?.[0])
        const out: VerticalTableRow = {
          stageCount: 1,
          headers: [h0],
          cells: [c0],
          stageKinds: [stageKinds[0]],
          choiceMultipleSelections: [kept],
        }
        if (ph0 !== undefined || ph1 !== undefined || b.placeholderHints != null) {
          out.placeholderHints = [ph0 ?? '']
        }
        return normalizeVerticalTableRow(out)
      }
      const out: VerticalTableRow = {
        stageCount: 1,
        headers: [h0],
        cells: [c0],
        stageKinds: [stageKinds[0]],
      }
      if (ph0 !== undefined || ph1 !== undefined || b.placeholderHints != null) {
        out.placeholderHints = [ph0 ?? '']
      }
      return normalizeVerticalTableRow(out)
    }

    if (flavor === 'multiple_choice') {
      const first = parseStringArrayUnknown(b.choiceMultipleSelections?.[0])
      const second =
        b.stageCount === 2 ? parseStringArrayUnknown(b.choiceMultipleSelections?.[1]) : []
      const out: VerticalTableRow = {
        stageCount: 2,
        headers: [h0, b.headers[1] ?? ''],
        cells: [c0, b.cells[1] ?? ''],
        stageKinds: [stageKinds[0], stageKinds[1] ?? defaultVerticalStageKindForFlavor(flavor)],
        choiceMultipleSelections: [first, second],
      }
      if (ph0 !== undefined || ph1 !== undefined || b.placeholderHints != null) {
        out.placeholderHints = [ph0 ?? '', ph1 ?? '']
      }
      return normalizeVerticalTableRow(out)
    }

    const out: VerticalTableRow = {
      stageCount: 2,
      headers: [h0, b.headers[1] ?? ''],
      cells: [c0, b.cells[1] ?? ''],
      stageKinds: [stageKinds[0], stageKinds[1] ?? defaultVerticalStageKindForFlavor(flavor)],
    }
    if (ph0 !== undefined || ph1 !== undefined || b.placeholderHints != null) {
      out.placeholderHints = [ph0 ?? '', ph1 ?? '']
    }
    return normalizeVerticalTableRow(out)
  }

  const base = normalizeVerticalTableRow(row)
  const b = base as VerticalTableRow
  const h0 = b.headers[0] ?? ''
  const c0 = b.cells[0] ?? ''
  const ph0 = b.placeholderHints?.[0]
  const ph1 = b.placeholderHints?.[1]
  const stageKinds = effectiveVerticalStageKinds(b, flavor)

  if (stageCount === 1) {
    const modes = effectiveVerticalRowDateTimeModes(b)
    const m0 = modes[0] ?? 'date'
    const r: VerticalTableRow = {
      stageCount: 1,
      headers: [h0],
      cells: [c0],
      stageKinds: [stageKinds[0]],
      dateTimeStageModes: [m0],
      dateTimeSingleStageMode: m0,
    }
    if (ph0 !== undefined || ph1 !== undefined || b.placeholderHints != null) {
      r.placeholderHints = [ph0 ?? '']
    }
    if (b.stageCount === 1) {
      if (b.dateTimeCompositeTimeHints) {
        r.dateTimeCompositeTimeHints = [b.dateTimeCompositeTimeHints[0] ?? '']
      }
      if (b.dateTimeStage0AuxTime !== undefined) r.dateTimeStage0AuxTime = b.dateTimeStage0AuxTime
      if (b.dateTimeStage1Time !== undefined) r.dateTimeStage1Time = b.dateTimeStage1Time
    } else {
      if (m0 === 'date_time') {
        r.dateTimeCompositeTimeHints = [b.dateTimeCompositeTimeHints?.[0] ?? '']
        r.dateTimeStage0AuxTime = b.dateTimeStage0AuxTime ?? ''
      }
    }
    return r
  }

  if (b.stageCount === 2) {
    const r: VerticalTableRow = {
      stageCount: 2,
      headers: [h0, b.headers[1] ?? ''],
      cells: [c0, b.cells[1] ?? ''],
      stageKinds: [stageKinds[0], stageKinds[1] ?? defaultVerticalStageKindForFlavor(flavor)],
    }
    if (ph0 !== undefined || ph1 !== undefined || b.placeholderHints != null) {
      r.placeholderHints = [ph0 ?? '', ph1 ?? '']
    }
    if (b.dateTimeStage1Time !== undefined) r.dateTimeStage1Time = b.dateTimeStage1Time
    if (b.dateTimeStageModes) {
      r.dateTimeStageModes = [...b.dateTimeStageModes] as [DateTimeFieldMode, DateTimeFieldMode]
    }
    if (b.dateTimeCompositeTimeHints) {
      r.dateTimeCompositeTimeHints = [...b.dateTimeCompositeTimeHints] as [string, string]
    }
    if (b.dateTimeStage0AuxTime !== undefined) r.dateTimeStage0AuxTime = b.dateTimeStage0AuxTime
    return r
  }

  const m0 = effectiveVerticalRowDateTimeModes(b)[0]
  const r: VerticalTableRow = {
    stageCount: 2,
    headers: [h0, ''],
    cells: [c0, ''],
    stageKinds: [stageKinds[0], defaultVerticalStageKindForFlavor(flavor)],
    dateTimeStage1Time: '',
    dateTimeStageModes: [m0, 'date_time'],
    placeholderHints: [ph0 ?? '', ''],
    dateTimeCompositeTimeHints: [
      m0 === 'date_time' ? (b.dateTimeCompositeTimeHints?.[0] ?? '') : '',
      '',
    ],
  }
  if (m0 === 'date_time') {
    r.dateTimeStage0AuxTime = b.dateTimeStage0AuxTime ?? ''
  }
  return r
}

/** 테이블 본문 th — 편집 placeholder (`1. 항목명 입력` / `2-1. 항목명 입력`) */
export function verticalTableHeaderPlaceholder(
  rowIdx: number,
  stageIdx: number,
  stageCount: 1 | 2
): string {
  if (stageCount === 1) return `${rowIdx + 1}. 항목명 입력`
  return `${rowIdx + 1}-${stageIdx + 1}. 항목명 입력`
}

/** 우측 커스텀 필드 — 항목 블록 제목 (`1. 항목` / `2-1. 항목`) */
export function verticalTablePanelStageTitle(
  rowIdx: number,
  stageIdx: number,
  stageCount: 1 | 2
): string {
  if (stageCount === 1) return `${rowIdx + 1}. 항목`
  return `${rowIdx + 1}-${stageIdx + 1}. 항목`
}

export type WritingFormParagraph =
  | TitleWithPeriodParagraph
  | UserProfileParagraph
  | ScoreSelectParagraph
  | SubjectiveParagraph
  | AgreementExplanationTextParagraph
  | ShortEssayParagraph
  | MultipleChoiceParagraph
  | DropdownParagraph
  | DateParagraph
  | TimeParagraph
  | StarRateParagraph
  | ScaleTypeParagraph
  | UserInfoParagraph
  | FileAttachmentParagraph
  | HorizontalTableParagraph
  | VerticalTableParagraph
  | SystemParagraph
  | ClosingParagraph

export interface WritingFormDraft {
  schemaVersion: 1
  formSettings: WritingFormSettings
  /** 설문: 0 제목형, 1–3 중간(DnD), 4 마무리. 동의: 0 제목형, 1–2 중간(DnD), 3 마무리 등. 가로형: 가로형 단락만 */
  paragraphs: WritingFormParagraph[]
}

/** 레거시 직렬화 `variant: date_time` + `fieldMode` — 런타임 마이그레이션용 */
type LegacySingleItemDateTimeParagraph = WritingFormParagraphBase & {
  kind: 'single_item'
  variant: 'date_time'
  fieldMode?: DateTimeFieldMode
  periodEnabled?: boolean
}

/** 저장 JSON에 남아 있을 수 있는 단일항목 `date_time` → `date` | `time` */
export function migrateLegacySingleItemDateTimeParagraph(
  p: WritingFormParagraph
): WritingFormParagraph {
  if (p.kind !== 'single_item') return p
  if ((p as { variant: string }).variant !== 'date_time') return p
  const l = p as unknown as LegacySingleItemDateTimeParagraph
  const mode = l.fieldMode ?? 'date'
  const { fieldMode: _fm, variant: _v, ...rest } = l
  if (mode === 'time') {
    return { ...rest, variant: 'time' } as TimeParagraph
  }
  return {
    ...rest,
    variant: 'date',
    periodEnabled: l.periodEnabled ?? false,
  } as DateParagraph
}

export function normalizeWritingFormDraft(draft: WritingFormDraft): WritingFormDraft {
  return {
    ...draft,
    paragraphs: draft.paragraphs.map(migrateLegacySingleItemDateTimeParagraph),
  }
}

const DEFAULT_USER_FIELDS: UserProfileField[] = [
  { key: 'name', label: '이름', enabled: true, required: true },
  { key: 'gender', label: '성별', enabled: true, required: false },
  { key: 'birthDate', label: '생년월일', enabled: true, required: false },
  { key: 'phone', label: '연락처', enabled: true, required: true },
  { key: 'email', label: '이메일', enabled: true, required: false },
]

/** 신규 설문 기본 양식 단락 id (초기 state·테스트에서 안정적으로 참조) */
export const DEFAULT_SURVEY_PARAGRAPH_IDS = {
  title: 'survey-paragraph-title',
  user: 'survey-paragraph-user',
  score: 'survey-paragraph-score',
  subjective: 'survey-paragraph-subjective',
  closing: 'survey-paragraph-closing',
} as const

/** 직접 등록 — 테이블 가로형 기본 단락 id(가로형 테이블만; 마무리/설문형 단락 없음) */
export const DEFAULT_HORIZONTAL_TABLE_PARAGRAPH_IDS = {
  table: 'horizontal-table-paragraph-table',
} as const

/** 초안이 가로형 테이블 단락만으로 구성됐는지(마무리·설명 단락과 분리) */
export function paragraphsAreOnlyHorizontalTables(paragraphs: WritingFormParagraph[]): boolean {
  return (
    paragraphs.length > 0 &&
    paragraphs.every(p => p.kind === 'single_item' && p.variant === 'horizontal_table')
  )
}

/** 직접 등록 테이블 레이아웃(가로형·세로형) 단락만 — 혼합 초안에서 DnD·네비 풀 너비 처리 */
export function isTableLayoutParagraph(p: WritingFormParagraph): boolean {
  return (
    p.kind === 'single_item' && (p.variant === 'horizontal_table' || p.variant === 'vertical_table')
  )
}

export function paragraphsAreOnlyTableLayoutParagraphs(
  paragraphs: WritingFormParagraph[]
): boolean {
  return paragraphs.length > 0 && paragraphs.every(isTableLayoutParagraph)
}

/** 직접 등록 — 신규 동의 양식 기본 단락 id (제목형·텍스트형·주관식형·테이블 세로·가로·시스템 2종·마무리글형) */
export const DEFAULT_DIRECT_AGREEMENT_PARAGRAPH_IDS = {
  title: 'agreement-direct-paragraph-title',
  explanationText: 'agreement-direct-paragraph-explanation-text',
  shortEssay: 'agreement-direct-paragraph-short-essay',
  verticalTableText: 'agreement-direct-paragraph-vertical-table-text',
  horizontalTable: 'agreement-direct-paragraph-horizontal-table',
  systemDate: 'agreement-direct-paragraph-system-date',
  systemSignature: 'agreement-direct-paragraph-system-signature',
  closing: 'agreement-direct-paragraph-closing',
} as const

export function createDefaultDirectAgreementDraft(): WritingFormDraft {
  return {
    schemaVersion: 1,
    formSettings: { titleNumbering: 'numeric' },
    paragraphs: [
      {
        id: DEFAULT_DIRECT_AGREEMENT_PARAGRAPH_IDS.title,
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
      },
      {
        id: DEFAULT_DIRECT_AGREEMENT_PARAGRAPH_IDS.explanationText,
        kind: 'single_item',
        variant: 'agreement_explanation_text',
        requiredMark: true,
        paragraphTitle: '',
        paragraphDescription: '',
        participatesInTitleNumbering: true,
        bodyPlaceholder: '한 줄 안내를 입력해 주세요',
        bodyText: '',
        answerRequired: true,
      },
      {
        id: DEFAULT_DIRECT_AGREEMENT_PARAGRAPH_IDS.shortEssay,
        kind: 'single_item',
        variant: 'short_essay',
        requiredMark: true,
        paragraphTitle: '',
        paragraphDescription: '',
        participatesInTitleNumbering: true,
        answerRequired: true,
        showItemTitle: true,
        items: [
          {
            id: 'agreement-short-essay-item-1',
            label: '수집하는 개인정보 항목',
            placeholder: 'ex) 이름, 연락처',
            bodyText: '',
          },
          {
            id: 'agreement-short-essay-item-2',
            label: '수집 및 이용 목적',
            placeholder: 'ex) 이벤트 진행 및 당첨자 안내',
            bodyText: '',
          },
          {
            id: 'agreement-short-essay-item-3',
            label: '보유 및 이용 기간',
            placeholder: 'ex) 회원 탈퇴 후 1개월 또는 개인정보수집 동의일로부터 5년',
            bodyText: '',
          },
        ],
        bodyPlaceholder: '각 항목에 내용을 입력해 주세요',
        bodyText: '',
      },
      createVerticalTableParagraph(
        DEFAULT_DIRECT_AGREEMENT_PARAGRAPH_IDS.verticalTableText,
        'text'
      ),
      createHorizontalTableParagraph(DEFAULT_DIRECT_AGREEMENT_PARAGRAPH_IDS.horizontalTable),
      {
        id: DEFAULT_DIRECT_AGREEMENT_PARAGRAPH_IDS.systemDate,
        kind: 'description',
        variant: 'system',
        systemPreset: 'agreement_date',
        requiredMark: false,
        paragraphTitle: '날짜 유형',
        paragraphDescription: '',
        participatesInTitleNumbering: false,
      },
      {
        id: DEFAULT_DIRECT_AGREEMENT_PARAGRAPH_IDS.systemSignature,
        kind: 'description',
        variant: 'system',
        systemPreset: 'agreement_signature',
        requiredMark: false,
        paragraphTitle: '서명란 유형',
        paragraphDescription: '',
        participatesInTitleNumbering: false,
      },
      {
        id: DEFAULT_DIRECT_AGREEMENT_PARAGRAPH_IDS.closing,
        kind: 'description',
        variant: 'closing',
        requiredMark: false,
        paragraphTitle: '',
        paragraphDescription: '',
        participatesInTitleNumbering: false,
        body: '내용을 자세히 검토하신 후 동의 여부를 결정하여 주시기 바랍니다.',
      },
    ],
  }
}

/**
 * 동의 양식: 마지막이 마무리이고 그 앞이 서명·날짜 시스템 단락이면 하단 3개는 드래그 제외.
 * 그 외: 첫 단락 + middle + 마지막 1개만 고정.
 */
export function getWritingFormHeadMiddlePinnedTail(paragraphs: WritingFormParagraph[]): {
  head: WritingFormParagraph
  middle: WritingFormParagraph[]
  pinnedTail: WritingFormParagraph[]
} | null {
  if (paragraphs.length < 3) return null
  const head = paragraphs[0]!
  const n = paragraphs.length
  const last = paragraphs[n - 1]!
  const p2 = paragraphs[n - 2]
  const p3 = paragraphs[n - 3]
  const triplePinnedAgreement =
    n >= 5 &&
    last.kind === 'description' &&
    last.variant === 'closing' &&
    p2 != null &&
    p2.kind === 'description' &&
    p2.variant === 'system' &&
    p2.systemPreset === 'agreement_signature' &&
    p3 != null &&
    p3.kind === 'description' &&
    p3.variant === 'system' &&
    p3.systemPreset === 'agreement_date'

  if (triplePinnedAgreement) {
    return {
      head,
      middle: paragraphs.slice(1, -3),
      pinnedTail: paragraphs.slice(-3),
    }
  }

  /** 마지막 두 단락이 연속 마무리글형이면 함께 고정(지급조서 발급용 일자·서명 분리 등) */
  const doubleClosingTail =
    n >= 4 &&
    last.kind === 'description' &&
    last.variant === 'closing' &&
    p2 != null &&
    p2.kind === 'description' &&
    p2.variant === 'closing'

  if (doubleClosingTail) {
    return {
      head,
      middle: paragraphs.slice(1, -2),
      pinnedTail: paragraphs.slice(-2),
    }
  }

  return {
    head,
    middle: paragraphs.slice(1, -1),
    pinnedTail: [last],
  }
}

/** 첫·마지막(또는 동의 하단 3고정) 단락 고정, 사이 middle만 재정렬 */
export function reorderHeadMiddleTail(
  paragraphs: WritingFormParagraph[],
  activeId: string,
  overId: string
): WritingFormParagraph[] {
  const split = getWritingFormHeadMiddlePinnedTail(paragraphs)
  if (split == null) return paragraphs
  const { head, middle, pinnedTail } = split
  const ids = middle.map(p => p.id)
  const oldIndex = ids.indexOf(activeId)
  const newIndex = ids.indexOf(overId)
  if (oldIndex < 0 || newIndex < 0) return paragraphs
  const nextMiddle = [...middle]
  const [removed] = nextMiddle.splice(oldIndex, 1)
  nextMiddle.splice(newIndex, 0, removed)
  return [head, ...nextMiddle, ...pinnedTail]
}

export function createDefaultHorizontalTableDraft(): WritingFormDraft {
  return {
    schemaVersion: 1,
    formSettings: { titleNumbering: 'numeric' },
    paragraphs: [
      {
        id: DEFAULT_HORIZONTAL_TABLE_PARAGRAPH_IDS.table,
        kind: 'single_item',
        variant: 'horizontal_table',
        requiredMark: true,
        paragraphTitle: '',
        paragraphDescription: '',
        participatesInTitleNumbering: true,
        tableFlavor: 'text',
        columnHeaders: ['', '', ''],
        dataRows: [['', '', '']],
        columnFields: [],
        fieldDataRows: [],
        bottomText: '',
        showBottomText: true,
        showBottomConsent: true,
        bottomConsent: 'agree',
        answerRequired: true,
      },
    ],
  }
}

export function createDefaultSurveyDraft(): WritingFormDraft {
  return {
    schemaVersion: 1,
    formSettings: { titleNumbering: 'q123' },
    paragraphs: [
      {
        id: DEFAULT_SURVEY_PARAGRAPH_IDS.title,
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
      },
      {
        id: DEFAULT_SURVEY_PARAGRAPH_IDS.user,
        kind: 'single_item',
        variant: 'user_profile',
        answerRequired: true,
        requiredMark: true,
        paragraphTitle: '설문자 정보',
        paragraphDescription: '',
        participatesInTitleNumbering: true,
        fields: DEFAULT_USER_FIELDS.map(f => ({ ...f })),
      },
      {
        id: DEFAULT_SURVEY_PARAGRAPH_IDS.score,
        kind: 'single_item',
        variant: 'score_select',
        answerRequired: true,
        requiredMark: true,
        paragraphTitle: '타이틀을 입력해 주세요',
        paragraphDescription: '',
        participatesInTitleNumbering: true,
        scaleMin: 1,
        scaleMax: 5,
        scaleLabels: {
          '1': '전혀 그렇지 않다',
          '5': '매우 그렇다',
        },
        selectedPreviewValue: null,
      },
      {
        id: DEFAULT_SURVEY_PARAGRAPH_IDS.subjective,
        kind: 'single_item',
        variant: 'subjective',
        answerRequired: true,
        requiredMark: true,
        paragraphTitle: '타이틀을 입력해 주세요',
        paragraphDescription: '구체적인 의견을 작성해 주세요.',
        participatesInTitleNumbering: true,
        items: [{ id: 'survey-subjective-item-1', placeholder: '답변을 입력해 주세요' }],
      },
      {
        id: DEFAULT_SURVEY_PARAGRAPH_IDS.closing,
        kind: 'description',
        variant: 'closing',
        requiredMark: false,
        paragraphTitle: '',
        paragraphDescription: '',
        participatesInTitleNumbering: false,
        body: '설문에 참여해 주셔서 감사합니다.',
      },
    ],
  }
}

/** 첫·마지막 고정, 가운데 단락만 재정렬(설문 5단락·동의 4단락 등 공통) */
export function reorderWritingFormMiddleParagraphs(
  paragraphs: WritingFormParagraph[],
  activeId: string,
  overId: string
): WritingFormParagraph[] {
  if (paragraphs.length < 3) return paragraphs
  return reorderHeadMiddleTail(paragraphs, activeId, overId)
}

/** 양식 테스트 > 설명글 유형 — 제목형·텍스트형·기타·마무리글형 */
export const DEFAULT_FORM_TEST_EXPLANATION_PARAGRAPH_IDS = {
  title: 'form-test-explanation-title',
  text: 'form-test-explanation-text',
  system: 'form-test-explanation-system',
  closing: 'form-test-explanation-closing',
} as const

export function createExplanationTypesPreviewDraft(): WritingFormDraft {
  return {
    schemaVersion: 1,
    formSettings: { titleNumbering: 'numeric' },
    paragraphs: [
      {
        id: DEFAULT_FORM_TEST_EXPLANATION_PARAGRAPH_IDS.title,
        kind: 'description',
        variant: 'survey_title_with_period',
        requiredMark: true,
        paragraphTitle: '제목형',
        paragraphDescription: '',
        participatesInTitleNumbering: false,
        surveyTitle: '',
        surveyDescription: '',
        periodMode: 'immediate',
        startAt: null,
        endAt: null,
        showWritingPeriodOnForm: false,
      },
      {
        id: DEFAULT_FORM_TEST_EXPLANATION_PARAGRAPH_IDS.text,
        kind: 'single_item',
        variant: 'agreement_explanation_text',
        requiredMark: true,
        paragraphTitle: '텍스트형',
        paragraphDescription: '',
        participatesInTitleNumbering: true,
        bodyPlaceholder: '텍스트를 작성해 주세요',
        bodyText: '',
        answerRequired: true,
      },
      {
        id: DEFAULT_FORM_TEST_EXPLANATION_PARAGRAPH_IDS.system,
        kind: 'description',
        variant: 'system',
        requiredMark: false,
        paragraphTitle: '기타',
        paragraphDescription: '',
        participatesInTitleNumbering: false,
      },
      {
        id: DEFAULT_FORM_TEST_EXPLANATION_PARAGRAPH_IDS.closing,
        kind: 'description',
        variant: 'closing',
        requiredMark: false,
        paragraphTitle: '마무리글형',
        paragraphDescription: '',
        participatesInTitleNumbering: false,
        body: '설문에 참여해 주셔서 감사합니다.',
      },
    ],
  }
}

/** 양식 테스트 > 단일 항목 모음(`useFormTestSingleItemEditor` → `useWritingFormEditorWithUserPreview`) — 제목·9종 스텁·마무리 */
export function createSingleItemPreviewDraft(): WritingFormDraft {
  const base = createDefaultSurveyDraft()
  const title = base.paragraphs[0]!
  const closing = base.paragraphs[4]!
  const middle: WritingFormParagraph[] = [
    {
      id: 'short-essay',
      kind: 'single_item',
      variant: 'short_essay',
      answerRequired: true,
      showItemTitle: false,
      items: [
        {
          id: 'short-essay-item-1',
          label: 'Title 01',
          placeholder: '답변을 입력해 주세요',
          bodyText: '',
        },
      ],
      bodyPlaceholder: '답변을 입력해 주세요',
      bodyText: '',
      requiredMark: true,
      paragraphTitle: '주관식형',
      paragraphDescription: '',
      participatesInTitleNumbering: true,
    },
    {
      id: 'multiple-choice',
      kind: 'single_item',
      variant: 'multiple_choice',
      answerRequired: true,
      allowMultiple: false,
      items: createDefaultMultipleChoiceItems(),
      selectedPreviewSingleId: null,
      selectedPreviewMultipleIds: [],
      requiredMark: true,
      paragraphTitle: '객관식형',
      paragraphDescription: '',
      participatesInTitleNumbering: true,
    },
    {
      id: 'dropdown',
      kind: 'single_item',
      variant: 'dropdown',
      answerRequired: true,
      requiredMark: true,
      paragraphTitle: '드롭다운형',
      paragraphDescription: '',
      participatesInTitleNumbering: true,
    },
    {
      id: 'date',
      kind: 'single_item',
      variant: 'date',
      answerRequired: true,
      periodEnabled: false,
      requiredMark: true,
      paragraphTitle: '날짜형',
      paragraphDescription: '',
      participatesInTitleNumbering: true,
    },
    {
      id: 'time',
      kind: 'single_item',
      variant: 'time',
      answerRequired: true,
      requiredMark: true,
      paragraphTitle: '시간형',
      paragraphDescription: '',
      participatesInTitleNumbering: true,
    },
    {
      id: 'star-rate',
      kind: 'single_item',
      variant: 'star_rate',
      answerRequired: true,
      selectedPreviewStars: null,
      requiredMark: true,
      paragraphTitle: '별점형',
      paragraphDescription: '',
      participatesInTitleNumbering: true,
    },
    {
      id: 'scale-type',
      kind: 'single_item',
      variant: 'scale_type',
      answerRequired: true,
      items: createDefaultScaleTypeItems(),
      selectedPreviewItemId: 'scale-type-item-5',
      requiredMark: true,
      paragraphTitle: '점수 선택형',
      paragraphDescription: '',
      participatesInTitleNumbering: true,
    },
    {
      id: 'user-info',
      kind: 'single_item',
      variant: 'user_info',
      answerRequired: true,
      requiredMark: true,
      paragraphTitle: '사용자 정보형',
      paragraphDescription: '',
      participatesInTitleNumbering: true,
    },
    {
      id: 'file-attachment',
      kind: 'single_item',
      variant: 'file_attachment',
      answerRequired: true,
      requiredMark: true,
      paragraphTitle: '파일 첨부형',
      paragraphDescription: '',
      participatesInTitleNumbering: true,
    },
  ]
  return {
    schemaVersion: 1,
    formSettings: base.formSettings,
    paragraphs: [title, ...middle, closing],
  }
}

export function writingOutlineLabel(p: WritingFormParagraph): string {
  if (p.kind === 'description' && p.variant === 'survey_title_with_period') {
    const t = p.surveyTitle.trim()
    return t || '타이틀을 입력해 주세요'
  }
  if (p.kind === 'description' && p.variant === 'system') {
    if (p.systemPreset === 'agreement_date') return '날짜 유형'
    if (p.systemPreset === 'agreement_signature') return '서명란 유형'
    const t = p.paragraphTitle.trim()
    return t || '기타'
  }
  if (p.kind === 'description' && p.variant === 'closing') {
    const t = p.body.trim().slice(0, 24)
    return t || '마무리글 없음'
  }
  if (p.kind === 'single_item' && p.variant === 'agreement_explanation_text') {
    const t = p.paragraphTitle.trim()
    return t || '설명 안내'
  }
  if (p.kind === 'single_item' && p.variant === 'short_essay') {
    const t = p.paragraphTitle.trim()
    return t || '동의 내용'
  }
  if (p.kind === 'single_item' && p.variant === 'horizontal_table') {
    const t = p.paragraphTitle.trim()
    if (t) return t
    return '타이틀을 입력해 주세요'
  }
  if (p.kind === 'single_item' && p.variant === 'vertical_table') {
    const t = p.paragraphTitle.trim()
    if (t) return t
    return '타이틀을 입력해 주세요'
  }
  const t = p.paragraphTitle.trim()
  return t || '타이틀을 입력해 주세요'
}
