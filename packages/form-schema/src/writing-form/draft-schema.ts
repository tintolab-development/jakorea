import { normalizeTitleWithPeriodParagraph } from './title-with-period-normalize.js'

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
  /** 작성 시작 — `바로 시작` / `직접 설정` (미지정 시 `periodMode`·`startAt`에서 추론) */
  startPeriodMode?: FormPeriodMode
  /** 작성 종료 — `마감 없음` / `직접 설정` */
  endPeriodMode?: FormPeriodMode
  startAt: string | null
  endAt: string | null
  /** 종료 `직접 설정` + 상대 규칙 등 — `endAt` 없을 때 표시(예: 활동일 전주 목요일) */
  endPeriodPresetLabel?: string | null
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
export type AgreementSystemBodyDisplayMode = 'authoring' | 'write' | 'document'

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

/** 동의서 설명글·텍스트형 — 제목 / 설명 / 본문 + 답변 필수 토글 (+ 선택적 하단 동의 라디오) */
export interface AgreementExplanationTextParagraph extends WritingFormParagraphBase {
  kind: 'single_item'
  variant: 'agreement_explanation_text'
  bodyPlaceholder: string
  bodyText: string
  /** 카드 하단 토글 — 본문(답변) 필수 여부 */
  answerRequired: boolean
  /** 하단에 동의(라디오) 영역 노출 — 초상권 수집·이용 동의서 intro 등 */
  showBottomConsent?: boolean
  /** `showBottomConsent`일 때 동의 라디오 값 */
  bottomConsent?: TableBottomConsent
}

export interface IdTypeWithInputOption {
  id: string
  label: string
}

/** 신원 식별번호 유형 선택 + 입력 — 동의 양식 전용 */
export interface IdTypeWithInputParagraph extends WritingFormParagraphBase {
  kind: 'single_item'
  variant: 'id_type_with_input'
  options: IdTypeWithInputOption[]
  selectedOptionId: string | null
  /** 입력창 placeholder(유형 전환 시 UI에서 갱신 가능) */
  inputPlaceholder: string
  inputValue: string
  answerRequired: boolean
}

/** 다중 줄 정적 설명(본문 편집 없음) — 동의 양식 전용 */
export interface StaticDescriptionLinesParagraph extends WritingFormParagraphBase {
  kind: 'description'
  variant: 'static_description_lines'
  lines: string[]
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
  /** 항목 입력 줄 수 — 1: 한 줄 입력(44px), 그 외/미지정: 기본 멀티라인(5줄). 동의 양식 짧은 라벨(성명·생년월일·전화번호 등)에 사용 */
  itemInputRows?: 1 | 5
  /** 입력 글자 수 상한 — 지정 시 textarea `maxLength`·글자 수 카운터 적용 */
  maxLength?: number
}

/** N차시 교육 계획 등 — `short_essay`와 동일 필드 모양, 전용 variant·UI */
export type SessionPlanShortEssayParagraph = WritingFormParagraphBase & {
  kind: 'single_item'
  variant: 'session_plan_short_essay'
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

/** UJAT 교육일지 4번 단락 — 학교명(시스템)·학년·반·수업일(전용 레이아웃) */
export type UjatJournalEducationInfoParagraph = WritingFormParagraphBase & {
  kind: 'single_item'
  variant: 'ujat_journal_education_info'
  answerRequired?: boolean
  /** API·연동 전 목/미리보기용 기본 학교명 */
  schoolDisplayFallback?: string
  grade: string
  classSection: string
  prepDate: string
  sessionDate: string
}

/** 강의보고서 — 프로그램 진행 정보(2단×4행) 전용 레이아웃 */
export type LectureReportProgramProgressParagraph = WritingFormParagraphBase & {
  kind: 'single_item'
  variant: 'lecture_report_program_progress'
  answerRequired?: boolean
  programName: string
  finalInstructorCount: string
  institutionName: string
  institutionLocation: string
  educationDate: string
  sessionTime: string
  sessionIndex: string
  educationTarget: string
  classLabel: string
  studentCount: string
}

/** 담당 학년 드롭다운 (1~6학년) */
export const UJAT_JOURNAL_EDUCATION_INFO_GRADE_OPTIONS: Array<{ value: string; label: string }> =
  Array.from({ length: 6 }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1}학년`,
  }))

/** 담당 반 드롭다운 */
export const UJAT_JOURNAL_EDUCATION_INFO_CLASS_OPTIONS: Array<{ value: string; label: string }> =
  Array.from({ length: 20 }, (_, i) => ({
    value: String(i + 1),
    label: `${i + 1}반`,
  }))

/** 목·CMS 미리보기 — 기관 연동 전 담당 학교명 샘플 */
export const UJAT_JOURNAL_EDUCATION_INFO_SAMPLE_INSTITUTION_NAME = 'JA초등학교'

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

/** 미설정(undefined/null)은 그대로 유지 — 동의서 작성(fill) 등에서 'agree'로 덮어쓰지 않음 */
export function normalizeTableBottomConsent(raw: unknown): TableBottomConsent | undefined {
  if (raw === 'disagree') return 'disagree'
  if (raw === 'agree') return 'agree'
  return undefined
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
  /** 하단에 식별번호 입력 영역 노출 — 행정정보 공동이용 사전 동의서 전용 */
  idTypeWithInput?: IdTypeWithInputParagraph | null
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

/** 필드 모드: `dataRows`·`fieldDataRows` 중 더 긴 쪽 행 수에 맞춤(불일치 복구) */
function syncFieldDataRowsToTextRows(
  p: HorizontalTableParagraph,
  colCount: number,
  fieldCols: HorizontalTableColumnField[]
): HorizontalTableFieldCellValue[][] {
  const n = Math.max(1, p.dataRows.length, p.fieldDataRows?.length ?? 0)
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
  if (tableFlavor === 'field') {
    const fieldRowCount = Math.max(1, p.fieldDataRows?.length ?? 0)
    while (dataRows.length < fieldRowCount) {
      dataRows.push(Array.from({ length: colCount }, () => ''))
    }
  }
  if (tableFlavor === 'text') {
    /* 텍스트형 셀 값은 dataRows — placeholder로 옮기며 비우지 않음(입력 유지) */
    return {
      ...p,
      tableFlavor: 'text',
      columnHeaders: headers,
      dataRows,
      columnFields: p.columnFields ?? [],
      fieldDataRows: p.fieldDataRows ?? [],
      cellColumnFields: p.cellColumnFields,
      bottomText: p.bottomText ?? '',
      showBottomText: Boolean(p.showBottomText),
      showBottomConsent: Boolean(p.showBottomConsent),
      bottomConsent: normalizeTableBottomConsent(p.bottomConsent),
      idTypeWithInput: p.idTypeWithInput ?? null,
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
      idTypeWithInput: p.idTypeWithInput ?? null,
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
    idTypeWithInput: p.idTypeWithInput ?? null,
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
  const matrix: HorizontalTableColumnField[][] = dataRows.map(() =>
    Array.from({ length: colCount }, (_, ci) =>
      repairColumnField(
        {
          kind: 'text' as const,
          placeholder: HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER,
        },
        ci
      )
    )
  )
  const fieldCols = matrix[0]!.map((f, i) => repairColumnField(f, i))
  const fieldDataRows = dataRows.map(textRow =>
    textRow.map(cellText => ({ kind: 'text' as const, value: String(cellText ?? '') }))
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
  if (flavor === 'date_time') {
    return {
      stageCount: 1,
      headers: [''],
      cells: [''],
      stageKinds: ['date_time'],
      dateTimeSingleStageMode: 'date',
      placeholderHints: ['일정 선택'],
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
  | IdTypeWithInputParagraph
  | StaticDescriptionLinesParagraph
  | ShortEssayParagraph
  | SessionPlanShortEssayParagraph
  | MultipleChoiceParagraph
  | DropdownParagraph
  | DateParagraph
  | TimeParagraph
  | StarRateParagraph
  | ScaleTypeParagraph
  | UserInfoParagraph
  | FileAttachmentParagraph
  | UjatJournalEducationInfoParagraph
  | LectureReportProgramProgressParagraph
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

export function normalizeUjatJournalEducationInfoParagraph(
  p: WritingFormParagraph
): WritingFormParagraph {
  if (p.kind !== 'single_item' || p.variant !== 'ujat_journal_education_info') return p
  const x = p as UjatJournalEducationInfoParagraph
  return {
    ...x,
    schoolDisplayFallback: x.schoolDisplayFallback?.trim() ?? '',
    grade: x.grade ?? '',
    classSection: x.classSection ?? '',
    prepDate: x.prepDate ?? '',
    sessionDate: x.sessionDate ?? '',
    answerRequired: x.answerRequired !== false,
  }
}

export function normalizeLectureReportProgramProgressParagraph(
  p: WritingFormParagraph
): WritingFormParagraph {
  if (p.kind !== 'single_item' || p.variant !== 'lecture_report_program_progress') return p
  const x = p as LectureReportProgramProgressParagraph
  return {
    ...x,
    programName: x.programName ?? '',
    finalInstructorCount: x.finalInstructorCount ?? '',
    institutionName: x.institutionName ?? '',
    institutionLocation: x.institutionLocation ?? '',
    educationDate: x.educationDate ?? '',
    sessionTime: x.sessionTime ?? '',
    sessionIndex: x.sessionIndex ?? '',
    educationTarget: x.educationTarget ?? '',
    classLabel: x.classLabel ?? '',
    studentCount: x.studentCount ?? '',
    answerRequired: x.answerRequired !== false,
  }
}

export function normalizeWritingFormDraft(draft: WritingFormDraft): WritingFormDraft {
  return {
    ...draft,
    paragraphs: draft.paragraphs.map(p => normalizeWritingFormParagraph(p)),
  }
}

/** 초상권 수집·이용 동의서 intro — 구 시드/저장본에 하단 동의 라디오 필드 보정 */
function migrateAgreementPortraitIntroBottomConsent(
  p: WritingFormParagraph
): WritingFormParagraph {
  if (
    p.id !== 'agreement-portrait-intro' ||
    p.kind !== 'single_item' ||
    p.variant !== 'agreement_explanation_text'
  ) {
    return p
  }
  if (p.showBottomConsent === true) {
    return {
      ...p,
      bottomConsent: normalizeTableBottomConsent(p.bottomConsent),
    }
  }
  return {
    ...p,
    showBottomConsent: true,
    bottomConsent: normalizeTableBottomConsent(p.bottomConsent),
  }
}

/** 초상권 1번 표 — 구 시드의 성명·소속 안내 문구를 빈 셀(placeholder UI)로 보정 */
function migrateAgreementPortraitPersonalConsentNameCells(
  p: WritingFormParagraph
): WritingFormParagraph {
  if (
    p.id !== AGREEMENT_PORTRAIT_PARAGRAPH_IDS.personalConsentTable ||
    p.kind !== 'single_item' ||
    p.variant !== 'vertical_table'
  ) {
    return p
  }
  const rows = p.rows ?? []
  if (rows.length === 0) return p
  const r0 = rows[0]
  if (r0 == null || r0.stageCount !== 2) return p
  const c0 = (r0.cells[0] ?? '').trim()
  const c1 = (r0.cells[1] ?? '').trim()
  const clearName = c0 === '한글 성명'
  const clearAff = c1 === '소속 / 소속 없음' || c1 === '소속'
  if (!clearName && !clearAff) return p
  const nextCells: [string, string] = [
    clearName ? '' : (r0.cells[0] ?? ''),
    clearAff ? '' : (r0.cells[1] ?? ''),
  ]
  return {
    ...p,
    rows: [{ ...r0, cells: nextCells }, ...rows.slice(1)],
  }
}

const LEGACY_PORTRAIT_DELEGATED_TASK_CELL =
  'JA Korea 사업 수행 및 관리: 대내외 보고서 작성, 활동영상 및 자료 제작\nJA Korea 프로그램 홍보를 위한 온라인 매체 게시 및 인쇄물 발간\n- 온라인 매체: 홈페이지 및 SNS 이미지/영상 포맷 게시물\n- 인쇄물: 리플렛, 활동북, 브로슈어, 기념보고서, 사례집, 아카이브자료 등'

const PORTRAIT_DELEGATED_TASK_CELL =
  'JA Korea 사업 수행 및 관리: 대내외 보고서 작성, 홍보영상 및 자료 제작\nJA Korea 프로그램 홍보를 위한 온라인 매체 게시 및 인쇄물 발간\n- 온라인 매체: 홈페이지 및 SNS 이미지와 영상 포함 게시물\n- 인쇄물: 리플렛, 팜플렛, 브로슈어, 기업보고서, 사례집, 애뉴얼리포트 등'

/** 초상권 2번 표 — 위탁 업무 문구를 최신 카피로 보정 */
function migrateAgreementPortraitDelegatedTaskCopy(
  p: WritingFormParagraph
): WritingFormParagraph {
  if (
    p.id !== AGREEMENT_PORTRAIT_PARAGRAPH_IDS.delegatedConsentTable ||
    p.kind !== 'single_item' ||
    p.variant !== 'vertical_table'
  ) {
    return p
  }
  const rows = p.rows ?? []
  const taskRowIdx = rows.findIndex(r => (r.headers[0] ?? '').trim() === '위탁 업무')
  if (taskRowIdx < 0) return p
  const taskRow = rows[taskRowIdx]!
  if ((taskRow.cells[0] ?? '') !== LEGACY_PORTRAIT_DELEGATED_TASK_CELL) return p
  if (taskRow.stageCount !== 1) return p
  const nextRows = [...rows]
  nextRows[taskRowIdx] = { ...taskRow, cells: [PORTRAIT_DELEGATED_TASK_CELL] }
  return { ...p, rows: nextRows }
}

/** 초상권 시드 단락 — 필수항목(*)·답변 필수 강제 */
function migrateAgreementPortraitSeedRequiredMarks(
  p: WritingFormParagraph
): WritingFormParagraph {
  if (!AGREEMENT_PORTRAIT_SEED_PARAGRAPH_IDS.has(p.id)) {
    return p
  }
  if (p.kind === 'single_item') {
    if (p.requiredMark === true && p.answerRequired === true) return p
    return { ...p, requiredMark: true, answerRequired: true }
  }
  if (p.requiredMark === true) return p
  return { ...p, requiredMark: true }
}

/** 지급조서 사전 동의서 시드 단락 — 필수항목(*)·답변 필수 강제 */
function migratePaymentStatementPreConsentSeedRequiredMarks(
  p: WritingFormParagraph
): WritingFormParagraph {
  if (!p.id.startsWith('payment-statement-pre-consent-seed-')) {
    return p
  }
  if (p.kind === 'single_item') {
    if (p.requiredMark === true && p.answerRequired === true) return p
    return { ...p, requiredMark: true, answerRequired: true }
  }
  if (p.requiredMark === true) return p
  return { ...p, requiredMark: true }
}

/**
 * 행정정보 공동이용 사전동의서 — 「대상자 본인」만 필수.
 * 제목형(survey_title_with_period)은 타입상 requiredMark 고정.
 */
function migrateAgreementNoticeSeedRequiredMarks(
  p: WritingFormParagraph
): WritingFormParagraph {
  if (!p.id.startsWith('agreement-notice-')) {
    return p
  }
  if (p.kind === 'description' && p.variant === 'survey_title_with_period') {
    return p
  }

  const isSubject = p.id === 'agreement-notice-subject'
  if (isSubject) {
    if (p.kind === 'single_item') {
      if (p.requiredMark === true && p.answerRequired === true) return p
      return { ...p, requiredMark: true, answerRequired: true }
    }
    if (p.requiredMark === true) return p
    return { ...p, requiredMark: true }
  }

  if (p.kind === 'single_item') {
    let next: WritingFormParagraph = p
    if (p.requiredMark !== false || p.answerRequired !== false) {
      next = { ...p, requiredMark: false, answerRequired: false }
    }
    if (
      next.kind === 'single_item' &&
      next.variant === 'horizontal_table' &&
      next.idTypeWithInput != null &&
      (next.idTypeWithInput.requiredMark !== false ||
        next.idTypeWithInput.answerRequired !== false)
    ) {
      next = {
        ...next,
        idTypeWithInput: {
          ...next.idTypeWithInput,
          requiredMark: false,
          answerRequired: false,
        },
      }
    }
    return next
  }

  if (p.requiredMark === false) return p
  return { ...p, requiredMark: false }
}

/** 행정정보 공동이용 — 식별번호 유형 고정값(주민등록번호) */
export const AGREEMENT_NOTICE_ID_TYPE_RESIDENT_OPTION_ID = 'agreement-notice-id-resident'

/**
 * 행정정보 공동이용 표 — 1행 시드(연번·행정정보명) 보정 + 최소 행 수 확보.
 * (구 JSON·localStorage/API 저장본이 빈 1행만 가진 경우 복구)
 */
function migrateAgreementNoticeTableSeedRows(
  p: WritingFormParagraph
): WritingFormParagraph {
  if (
    p.id !== 'agreement-notice-table' ||
    p.kind !== 'single_item' ||
    p.variant !== 'horizontal_table'
  ) {
    return p
  }
  const colCount = Math.max(4, p.columnHeaders?.length ?? 4)
  let dataRows = (p.dataRows ?? []).map(row => {
    const next = [...row]
    while (next.length < colCount) next.push('')
    return next.slice(0, colCount)
  })
  if (dataRows.length === 0) {
    dataRows = createAgreementNoticeTableDataRows().map(r => [...r])
  } else {
    const r0 = dataRows[0] ?? Array.from({ length: colCount }, () => '')
    /** 시드 고정 문구 — 좌측 1행은 항상 최신 시드로 맞춤(빈 저장본 덮어쓰기·플래시 방지) */
    dataRows[0] = [
      AGREEMENT_NOTICE_TABLE_FIRST_ROW[0],
      AGREEMENT_NOTICE_TABLE_FIRST_ROW[1],
      r0[2] ?? '',
      r0[3] ?? '',
      ...r0.slice(4),
    ]
    while (dataRows.length < AGREEMENT_NOTICE_TABLE_BODY_ROW_COUNT) {
      dataRows.push(Array.from({ length: colCount }, () => ''))
    }
  }
  return {
    ...p,
    dataRows,
    idTypeWithInput:
      p.idTypeWithInput == null
        ? p.idTypeWithInput
        : {
            ...p.idTypeWithInput,
            selectedOptionId: AGREEMENT_NOTICE_ID_TYPE_RESIDENT_OPTION_ID,
            inputPlaceholder: '주민등록번호를 입력해 주세요',
          },
  }
}

function normalizeWritingFormParagraph(p: WritingFormParagraph): WritingFormParagraph {
  let next = migrateLegacySingleItemDateTimeParagraph(p)
  next = normalizeUjatJournalEducationInfoParagraph(next)
  next = normalizeLectureReportProgramProgressParagraph(next)
  next = migrateAgreementPortraitIntroBottomConsent(next)
  next = migrateAgreementPortraitPersonalConsentNameCells(next)
  next = migrateAgreementPortraitDelegatedTaskCopy(next)
  next = migrateAgreementPortraitSeedRequiredMarks(next)
  next = migratePaymentStatementPreConsentSeedRequiredMarks(next)
  next = migrateAgreementNoticeSeedRequiredMarks(next)
  next = migrateAgreementNoticeTableSeedRows(next)
  if (next.kind === 'description' && next.variant === 'survey_title_with_period') {
    return normalizeTitleWithPeriodParagraph(next)
  }
  return next
}

/** 신규 설문 기본 양식 단락 id (초기 state·테스트에서 안정적으로 참조) */
export const DEFAULT_SURVEY_PARAGRAPH_IDS = {
  title: 'survey-paragraph-title',
  user: 'survey-paragraph-user',
  score: 'survey-paragraph-score',
  score2: 'survey-paragraph-score-2',
  subjective: 'survey-paragraph-subjective',
  subjective2: 'survey-paragraph-subjective-2',
  closing: 'survey-paragraph-closing',
} as const

/**
 * 설문 양식 기본 구조: 제목형·설문자 정보·마무리글은 `getWritingFormHeadMiddlePinnedTail`에서 고정 역할.
 * DnD 대상이 아니므로 햄버거 핸들 미노출 — `PAYMENT_STATEMENT_ISSUANCE_HIDDEN_DRAG_HANDLE_IDS` 등과 동일 UX.
 */
export const SURVEY_FORM_HIDDEN_DRAG_HANDLE_IDS = new Set<string>([
  DEFAULT_SURVEY_PARAGRAPH_IDS.title,
  DEFAULT_SURVEY_PARAGRAPH_IDS.user,
  DEFAULT_SURVEY_PARAGRAPH_IDS.closing,
])

/** 발급 양식 > UJAT 교육계획서 시드 단락 id — 구조 잠금·초기 선택에 사용 */
export const UJAT_EDUCATION_PLAN_ISSUANCE_PARAGRAPH_IDS = {
  title: 'ujat-edu-plan-title',
  explanationText: 'ujat-edu-plan-explanation-text',
  volunteerInfo: 'ujat-edu-plan-volunteer-info',
  session1: 'ujat-edu-plan-session-1',
  session2: 'ujat-edu-plan-session-2',
  session3: 'ujat-edu-plan-session-3',
  session4: 'ujat-edu-plan-session-4',
} as const

/** UJAT 교육계획서 템플릿 고정 단락 — 삭제·복제·순서 변경 불가 */
export const UJAT_EDUCATION_PLAN_SEED_PARAGRAPH_IDS = new Set<string>([
  UJAT_EDUCATION_PLAN_ISSUANCE_PARAGRAPH_IDS.title,
  UJAT_EDUCATION_PLAN_ISSUANCE_PARAGRAPH_IDS.explanationText,
  UJAT_EDUCATION_PLAN_ISSUANCE_PARAGRAPH_IDS.volunteerInfo,
  UJAT_EDUCATION_PLAN_ISSUANCE_PARAGRAPH_IDS.session1,
  UJAT_EDUCATION_PLAN_ISSUANCE_PARAGRAPH_IDS.session2,
  UJAT_EDUCATION_PLAN_ISSUANCE_PARAGRAPH_IDS.session3,
  UJAT_EDUCATION_PLAN_ISSUANCE_PARAGRAPH_IDS.session4,
])

/** 제목형(1번) — 드래그 핸들 미노출. 지급조서 `PAYMENT_STATEMENT_ISSUANCE_HIDDEN_DRAG_HANDLE_IDS`와 동일 UX */
export const UJAT_EDUCATION_PLAN_HIDDEN_DRAG_HANDLE_IDS = new Set<string>([
  UJAT_EDUCATION_PLAN_ISSUANCE_PARAGRAPH_IDS.title,
])

/** 발급 양식 > UJAT 교육일지 시드 단락 id — 교육계획서와 동일 레이아웃, id만 분리 */
export const UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS = {
  title: 'ujat-edu-journal-title',
  explanationText: 'ujat-edu-journal-explanation-text',
  volunteerInfo: 'ujat-edu-journal-volunteer-info',
  /** 4번 단락 — 2단(2열)×2행 교육 정보 세로 테이블 */
  educationInfo: 'ujat-edu-journal-education-info',
  session1: 'ujat-edu-journal-session-1',
  session2: 'ujat-edu-journal-session-2',
  session3: 'ujat-edu-journal-session-3',
  session4: 'ujat-edu-journal-session-4',
  contentFeedback: 'ujat-edu-journal-content-feedback',
  educationPhotos: 'ujat-edu-journal-education-photos',
} as const

/** UJAT 교육일지 템플릿 고정 단락 — 삭제·복제·순서 변경 불가 */
export const UJAT_EDUCATION_JOURNAL_SEED_PARAGRAPH_IDS = new Set<string>([
  UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS.title,
  UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS.explanationText,
  UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS.volunteerInfo,
  UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS.educationInfo,
  UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS.session1,
  UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS.session2,
  UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS.session3,
  UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS.session4,
  UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS.contentFeedback,
  UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS.educationPhotos,
])

export const UJAT_EDUCATION_JOURNAL_HIDDEN_DRAG_HANDLE_IDS = new Set<string>([
  UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS.title,
])

/** 발급 양식 > 강의보고서 시드 단락 id */
export const LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS = {
  title: 'lecture-report-title',
  programProgress: 'lecture-report-program-progress',
  educationContent: 'lecture-report-education-content',
  educationOperation: 'lecture-report-education-operation',
  overallEvaluation: 'lecture-report-overall-evaluation',
  educationPhotos: 'lecture-report-education-photos',
} as const

/** 강의보고서 템플릿 고정 단락 — 삭제·복제·순서 변경 불가 */
export const LECTURE_REPORT_SEED_PARAGRAPH_IDS = new Set<string>([
  LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS.title,
  LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS.programProgress,
  LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS.educationContent,
  LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS.educationOperation,
  LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS.overallEvaluation,
  LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS.educationPhotos,
])

export const LECTURE_REPORT_HIDDEN_DRAG_HANDLE_IDS = new Set<string>([
  LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS.title,
])
/** 행정정보 공동이용 — 이용사무(이용목적) 작성 진입 기본값 */
export const AGREEMENT_NOTICE_DEFAULT_PURPOSE = '범죄경력 유무 조회'

/** 동의 양식 > 행정정보 공동이용 사전동의서 — 시드 단락 id */
export const AGREEMENT_NOTICE_PARAGRAPH_IDS = {
  title: 'agreement-notice-title',
  institution: 'agreement-notice-institution',
  purpose: 'agreement-notice-purpose',
  table: 'agreement-notice-table',
  idType: 'agreement-notice-id-type',
  consentStatic: 'agreement-notice-consent-static',
  subject: 'agreement-notice-subject',
  confirmationClosing: 'agreement-notice-confirmation-closing',
  systemDate: 'agreement-notice-system-date',
  systemSignature: 'agreement-notice-system-signature',
} as const

export const AGREEMENT_NOTICE_SUBJECT_ITEM_IDS = {
  name: 'agreement-notice-subj-name',
  birth: 'agreement-notice-subj-birth',
  phone: 'agreement-notice-subj-phone',
} as const

/** 템플릿 고정 단락 — 삭제·복제·순서 변경 불가 */
export const AGREEMENT_NOTICE_SEED_PARAGRAPH_IDS = new Set<string>([
  AGREEMENT_NOTICE_PARAGRAPH_IDS.title,
  AGREEMENT_NOTICE_PARAGRAPH_IDS.institution,
  AGREEMENT_NOTICE_PARAGRAPH_IDS.purpose,
  AGREEMENT_NOTICE_PARAGRAPH_IDS.table,
  AGREEMENT_NOTICE_PARAGRAPH_IDS.idType,
  AGREEMENT_NOTICE_PARAGRAPH_IDS.consentStatic,
  AGREEMENT_NOTICE_PARAGRAPH_IDS.subject,
  AGREEMENT_NOTICE_PARAGRAPH_IDS.confirmationClosing,
  AGREEMENT_NOTICE_PARAGRAPH_IDS.systemDate,
  AGREEMENT_NOTICE_PARAGRAPH_IDS.systemSignature,
])

export const AGREEMENT_NOTICE_HIDDEN_DRAG_HANDLE_IDS = new Set<string>([
  AGREEMENT_NOTICE_PARAGRAPH_IDS.title,
  AGREEMENT_NOTICE_PARAGRAPH_IDS.confirmationClosing,
  AGREEMENT_NOTICE_PARAGRAPH_IDS.systemDate,
  AGREEMENT_NOTICE_PARAGRAPH_IDS.systemSignature,
])

export function createDefaultIdTypeWithInputOptions(): IdTypeWithInputOption[] {
  return [
    { id: AGREEMENT_NOTICE_ID_TYPE_RESIDENT_OPTION_ID, label: '주민등록번호' },
    { id: 'agreement-notice-id-passport', label: '여권번호' },
    { id: 'agreement-notice-id-driver', label: '운전면허번호' },
    { id: 'agreement-notice-id-alien', label: '외국인등록번호' },
  ]
}

const AGREEMENT_NOTICE_TABLE_BOTTOM_TEXT =
  '※ 이용기관은 본인이 동의한 위 공동이용 행정정보를 확인하기 위해 「개인정보 보호법」 시행령 제19조에 따라 주민등록번호, 여권번호, 운전면허의 면허번호 또는 외국인등록번호가 포함된 행정정보를 처리할 수 있습니다.\n이용기관이 요청하는 경우 기재하여 주십시오(필요시 기재사항)'

const AGREEMENT_NOTICE_CONSENT_LINES = [
  '○ 본인은 위 사무의 처리를 위하여 「전자정부법」 제36조에 따른 행정정보 공동이용을 통해 이용기관의 업무처리담당자가 전자적으로 본인의 구비서류(공동이용 행정정보)를 확인하는 것에 동의합니다.',
  '* 만일, 본인이 위 행정정보 이용에 대해 동의를 하지 아니할 경우에도 불이익은 없습니다. 다만, 동의하지 아니한 경우에는 본인이 해당 구비서류를 제출하여야 합니다.',
] as const

const AGREEMENT_NOTICE_CONFIRMATION_CLOSING: ClosingParagraph = {
  id: AGREEMENT_NOTICE_PARAGRAPH_IDS.confirmationClosing,
  kind: 'description',
  variant: 'closing',
  requiredMark: false,
  paragraphTitle: '',
  paragraphDescription: '',
  participatesInTitleNumbering: false,
  /** 작성·미리보기에서 문구 없음. A4는 본문·날짜/서명 사이 구분선으로만 사용 */
  body: '',
}

const AGREEMENT_NOTICE_TABLE_FIRST_ROW: [string, string, string, string] = [
  '1',
  '성범죄경력 및 아동학대 관련 범죄전력 조회',
  '',
  '',
]

const AGREEMENT_NOTICE_TABLE_BODY_ROW_COUNT = 5

function createAgreementNoticeTableDataRows(): string[][] {
  return [
    [...AGREEMENT_NOTICE_TABLE_FIRST_ROW],
    ...Array.from({ length: AGREEMENT_NOTICE_TABLE_BODY_ROW_COUNT - 1 }, () => ['', '', '', '']),
  ]
}

/** 동의 양식 목록 > 행정정보 공동이용 사전동의서 — 편집 시드 초안 */
export function createAgreementNoticeDraft(): WritingFormDraft {
  const idTypeOpts = createDefaultIdTypeWithInputOptions()
  const tableSeed: HorizontalTableParagraph = normalizeHorizontalTableParagraph({
    id: AGREEMENT_NOTICE_PARAGRAPH_IDS.table,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: false,
    paragraphTitle: '공동이용 행정정보(구비서류)',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    tableFlavor: 'text',
    columnHeaders: ['연번', '행정정보명', '연번', '행정정보명'],
    dataRows: createAgreementNoticeTableDataRows(),
    columnFields: [],
    fieldDataRows: [],
    bottomText: AGREEMENT_NOTICE_TABLE_BOTTOM_TEXT,
    showBottomText: true,
    showBottomConsent: false,
    bottomConsent: 'agree',
    idTypeWithInput: {
      id: AGREEMENT_NOTICE_PARAGRAPH_IDS.idType,
      kind: 'single_item',
      variant: 'id_type_with_input',
      requiredMark: false,
      paragraphTitle: '',
      paragraphDescription: '',
      participatesInTitleNumbering: true,
      options: idTypeOpts,
      selectedOptionId: idTypeOpts[0]?.id ?? null,
      inputPlaceholder: '주민등록번호를 입력해 주세요',
      inputValue: '',
      answerRequired: false,
    },
    answerRequired: false,
  })

  return {
    schemaVersion: 1,
    formSettings: { titleNumbering: 'numeric' },
    paragraphs: [
      {
        id: AGREEMENT_NOTICE_PARAGRAPH_IDS.title,
        kind: 'description',
        variant: 'survey_title_with_period',
        requiredMark: true,
        paragraphTitle: '',
        paragraphDescription: '',
        participatesInTitleNumbering: false,
        surveyTitle: '행정정보 공동이용 사전동의서',
        surveyDescription: '',
        periodMode: 'immediate',
        startAt: null,
        endAt: null,
        showWritingPeriodOnForm: false,
      },
      {
        id: AGREEMENT_NOTICE_PARAGRAPH_IDS.institution,
        kind: 'single_item',
        variant: 'agreement_explanation_text',
        requiredMark: false,
        paragraphTitle: '이용기관 명칭',
        paragraphDescription: '',
        participatesInTitleNumbering: true,
        bodyPlaceholder: '이용기관 명칭을 입력해 주세요',
        bodyText: '',
        answerRequired: false,
      },
      {
        id: AGREEMENT_NOTICE_PARAGRAPH_IDS.purpose,
        kind: 'single_item',
        variant: 'agreement_explanation_text',
        requiredMark: false,
        paragraphTitle: '이용사무(이용목적)',
        paragraphDescription: '',
        participatesInTitleNumbering: true,
        bodyPlaceholder: '이용 목적을 입력해 주세요',
        bodyText: AGREEMENT_NOTICE_DEFAULT_PURPOSE,
        answerRequired: false,
      },
      tableSeed,
      {
        id: AGREEMENT_NOTICE_PARAGRAPH_IDS.consentStatic,
        kind: 'description',
        variant: 'static_description_lines',
        requiredMark: false,
        paragraphTitle: '정보주체(본인) 동의사항',
        paragraphDescription: '',
        participatesInTitleNumbering: true,
        lines: [...AGREEMENT_NOTICE_CONSENT_LINES],
      },
      {
        id: AGREEMENT_NOTICE_PARAGRAPH_IDS.subject,
        kind: 'single_item',
        variant: 'short_essay',
        requiredMark: true,
        paragraphTitle: '대상자 본인',
        paragraphDescription: '',
        participatesInTitleNumbering: false,
        answerRequired: true,
        showItemTitle: true,
        itemInputRows: 1,
        items: [
          {
            id: AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.name,
            label: '성명',
            placeholder: '성명을 입력해 주세요',
            bodyText: '',
          },
          {
            id: AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.birth,
            label: '생년월일',
            placeholder: '1991.01.01',
            bodyText: '',
          },
          {
            id: AGREEMENT_NOTICE_SUBJECT_ITEM_IDS.phone,
            label: '전화번호',
            placeholder: '010-1234-5678',
            bodyText: '',
          },
        ],
        bodyPlaceholder: '답변을 입력해 주세요',
        bodyText: '',
      },
      AGREEMENT_NOTICE_CONFIRMATION_CLOSING,
      {
        id: AGREEMENT_NOTICE_PARAGRAPH_IDS.systemDate,
        kind: 'description',
        variant: 'system',
        systemPreset: 'agreement_date',
        requiredMark: false,
        paragraphTitle: '날짜 유형',
        paragraphDescription: '',
        participatesInTitleNumbering: false,
      },
      {
        id: AGREEMENT_NOTICE_PARAGRAPH_IDS.systemSignature,
        kind: 'description',
        variant: 'system',
        systemPreset: 'agreement_signature',
        requiredMark: false,
        paragraphTitle: '서명란 유형',
        paragraphDescription: '',
        participatesInTitleNumbering: false,
      },
    ],
  }
}

/** 구 저장본에 confirmationClosing이 없으면 systemDate 앞에 삽입. 제목형 작성 기간은 항상 off. 확인 문구는 비운다. */
export function ensureAgreementNoticeConfirmationClosing(
  draft: WritingFormDraft
): WritingFormDraft {
  let paragraphs = draft.paragraphs.map(p => {
    if (
      p.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.title &&
      p.kind === 'description' &&
      p.variant === 'survey_title_with_period' &&
      p.showWritingPeriodOnForm
    ) {
      return { ...p, showWritingPeriodOnForm: false }
    }
    if (
      p.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.confirmationClosing &&
      p.kind === 'description' &&
      p.variant === 'closing' &&
      p.body !== ''
    ) {
      return { ...p, body: '' }
    }
    return p
  })

  if (!paragraphs.some(p => p.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.confirmationClosing)) {
    const dateIdx = paragraphs.findIndex(p => p.id === AGREEMENT_NOTICE_PARAGRAPH_IDS.systemDate)
    paragraphs = [...paragraphs]
    if (dateIdx >= 0) {
      paragraphs.splice(dateIdx, 0, AGREEMENT_NOTICE_CONFIRMATION_CLOSING)
    } else {
      paragraphs.push(AGREEMENT_NOTICE_CONFIRMATION_CLOSING)
    }
  }

  return { ...draft, paragraphs }
}

/**
 * 저장본(API/localStorage) 로드 후 공동이용 행정정보 표 1행 시드·행 수를 최신 시드에 맞춤.
 * 초기 createDraft 시드가 잠깐 보이다가 빈 저장본으로 덮이는 플래시를 막는다.
 * (지급조서 `overlayPaymentStatementPreConsentSeedHorizontalTables`와 동일 역할)
 */
export function overlayAgreementNoticeSeedHorizontalTable(
  draft: WritingFormDraft
): WritingFormDraft {
  return normalizeWritingFormDraft({
    ...draft,
    paragraphs: draft.paragraphs.map(p => migrateAgreementNoticeTableSeedRows(p)),
  })
}

/** 동의 양식 > 초상권 수집·이용 동의서 — 시드 단락 id */
export const AGREEMENT_PORTRAIT_PARAGRAPH_IDS = {
  title: 'agreement-portrait-title',
  intro: 'agreement-portrait-intro',
  personalConsentTable: 'agreement-portrait-personal-consent-table',
  delegatedConsentTable: 'agreement-portrait-delegated-consent-table',
  portraitUsageTable: 'agreement-portrait-usage-table',
  confirmationClosing: 'agreement-portrait-confirmation-closing',
  systemDate: 'agreement-portrait-system-date',
  systemSignature: 'agreement-portrait-system-signature',
} as const

/** 템플릿 고정 단락 — 삭제·복제·순서 변경 불가 */
export const AGREEMENT_PORTRAIT_SEED_PARAGRAPH_IDS = new Set<string>([
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS.title,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS.intro,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS.personalConsentTable,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS.delegatedConsentTable,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS.portraitUsageTable,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS.confirmationClosing,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS.systemDate,
  AGREEMENT_PORTRAIT_PARAGRAPH_IDS.systemSignature,
])

export const AGREEMENT_PORTRAIT_HIDDEN_DRAG_HANDLE_IDS = new Set<string>(
  AGREEMENT_PORTRAIT_SEED_PARAGRAPH_IDS
)

const AGREEMENT_PORTRAIT_INTRO_TEXT =
  '아래 사항에 동의할 경우, 명시된 사용 용도에 한하여 글과 함께 저작물을 제작하는 형태로 초상권을 사용할 권리를 촬영자에게 부여합니다.\n또한, 저작물에 대한 소유권을 주장하지 않으며 저작물에 대한 소유권 및 저작권이 JA Korea에 있음을 확인합니다.'

const AGREEMENT_PORTRAIT_PERSONAL_CONSENT_QUESTION =
  '위 동의서를 거부할 수 있으며, 동의하지 않을 경우 수집 참여가 제한될 수 있습니다. 위 개인정보 및 초상권 수집·이용에 동의하십니까?'

const AGREEMENT_PORTRAIT_DELEGATED_CONSENT_QUESTION =
  '위 개인정보 및 초상권 수집·이용에 동의하십니까?'

const AGREEMENT_PORTRAIT_USAGE_CONSENT_QUESTION =
  '위와 같은 초상권 활용에 동의하십니까?'

/** 동의 양식 목록 > 초상권 수집·이용 동의서 — 편집 시드 초안 */
export function createAgreementPortraitDraft(): WritingFormDraft {
  return {
    schemaVersion: 1,
    formSettings: { titleNumbering: 'numeric' },
    paragraphs: [
      {
        id: AGREEMENT_PORTRAIT_PARAGRAPH_IDS.title,
        kind: 'description',
        variant: 'survey_title_with_period',
        requiredMark: true,
        paragraphTitle: '',
        paragraphDescription: '',
        participatesInTitleNumbering: false,
        surveyTitle: '초상권 수집·이용 동의서',
        surveyDescription: '',
        periodMode: 'immediate',
        startAt: null,
        endAt: null,
        showWritingPeriodOnForm: false,
      },
      {
        id: AGREEMENT_PORTRAIT_PARAGRAPH_IDS.intro,
        kind: 'single_item',
        variant: 'agreement_explanation_text',
        requiredMark: true,
        paragraphTitle: '',
        paragraphDescription: '',
        participatesInTitleNumbering: false,
        bodyPlaceholder: '한 줄 안내를 입력해 주세요',
        bodyText: AGREEMENT_PORTRAIT_INTRO_TEXT,
        answerRequired: true,
        showBottomConsent: true,
        bottomConsent: 'agree',
      },
      normalizeVerticalTableParagraph({
        id: AGREEMENT_PORTRAIT_PARAGRAPH_IDS.personalConsentTable,
        kind: 'single_item',
        variant: 'vertical_table',
        requiredMark: true,
        paragraphTitle: '개인정보 및 초상권 수집·이용 동의',
        paragraphDescription: '',
        participatesInTitleNumbering: true,
        verticalTableFlavor: 'text',
        rows: [
          {
            stageCount: 2,
            headers: ['성명', '소속'],
            /** 성명·소속은 작성(write) UI placeholder — 셀 값은 비움 */
            cells: ['', ''],
          },
          {
            stageCount: 1,
            headers: ['수집 항목'],
            cells: ['이름, 소속, 사진, 영상'],
          },
          {
            stageCount: 1,
            headers: ['수집 목적'],
            cells: [
              '홍보 콘텐츠 제작·게시, 저작물의 정보 이용\n- 온라인(디지털 매체) 콘텐츠 제작: 홈페이지, SNS 게시물\n- 간행물(인쇄/출판/제작물) 제작: 리플렛, 활동북, 브로슈어, 기념보고서, 아뉴얼리포트 등',
            ],
          },
          {
            stageCount: 1,
            headers: ['보유 기간'],
            cells: ['10년'],
          },
        ],
        bottomText: AGREEMENT_PORTRAIT_PERSONAL_CONSENT_QUESTION,
        showBottomText: true,
        showBottomConsent: true,
        bottomConsent: 'agree',
        answerRequired: true,
      }),
      normalizeVerticalTableParagraph({
        id: AGREEMENT_PORTRAIT_PARAGRAPH_IDS.delegatedConsentTable,
        kind: 'single_item',
        variant: 'vertical_table',
        requiredMark: true,
        paragraphTitle: '개인정보처리위탁 제공 동의',
        paragraphDescription: '',
        participatesInTitleNumbering: true,
        verticalTableFlavor: 'text',
        rows: [
          {
            stageCount: 1,
            headers: ['위탁 업체'],
            cells: ['홍보 관련 위탁 업체'],
          },
          {
            stageCount: 1,
            headers: ['위탁 업무'],
            cells: [PORTRAIT_DELEGATED_TASK_CELL],
          },
          {
            stageCount: 1,
            headers: ['위탁 기간'],
            cells: ['개인정보 수집 시 동의기간 또는 위탁계약 종료 시까지'],
          },
        ],
        bottomText: AGREEMENT_PORTRAIT_DELEGATED_CONSENT_QUESTION,
        showBottomText: true,
        showBottomConsent: true,
        bottomConsent: 'agree',
        answerRequired: true,
      }),
      normalizeVerticalTableParagraph({
        id: AGREEMENT_PORTRAIT_PARAGRAPH_IDS.portraitUsageTable,
        kind: 'single_item',
        variant: 'vertical_table',
        requiredMark: true,
        paragraphTitle: '초상권 제공·이용 동의',
        paragraphDescription: '',
        participatesInTitleNumbering: true,
        verticalTableFlavor: 'text',
        rows: [
          {
            stageCount: 1,
            headers: ['초상권 이용 목적'],
            cells: ['1) JA Korea 온라인 게시\n2) JA Korea 보고자료 작성\n3) JA Korea 대내외 홍보자료 활용'],
          },
          {
            stageCount: 1,
            headers: ['초상권 수집 범위 및 이용기간'],
            cells: [
              '1) 초상권 수집 범위: 본 프로그램 참여 중 촬영되는 사진 및 동영상 일체\n2) 사진 및 동영상 자료의 보유 및 이용기간\n- 보유 및 이용기간: 사진 및 동영상 촬영일로부터 5년까지 보유 및 이용\n(단, 홍보자료로 제작된 사진 및 동영상의 경우 활용이 지속될 수 있음)',
            ],
          },
          {
            stageCount: 1,
            headers: ['초상권 사용 범위'],
            cells: [
              '1) 간행물(인쇄/출판/제작물): 리플렛, 활동북, 브로슈어, 기념보고서, 사례집, 아뉴얼리포트 등\n2) 온라인(디지털 매체): 홈페이지, SNS 게시물 등',
            ],
          },
          {
            stageCount: 1,
            headers: ['초상권 이용·활용 동의 거부'],
            cells: [
              '위 사항은 JA Korea 프로그램 관련 초상권 이용 및 활용 동의에 관한 사항이며, 귀하는 이를 거부할 수 있습니다. 개인정보, 초상권 수집 이용에 대한 동의를 거부할 권리가 있으며, 동의 거부 시 관련 홍보물 제작에서 제외됩니다.',
            ],
          },
        ],
        bottomText: AGREEMENT_PORTRAIT_USAGE_CONSENT_QUESTION,
        showBottomText: true,
        showBottomConsent: true,
        bottomConsent: 'agree',
        answerRequired: true,
      }),
      {
        id: AGREEMENT_PORTRAIT_PARAGRAPH_IDS.confirmationClosing,
        kind: 'description',
        variant: 'closing',
        requiredMark: true,
        paragraphTitle: '',
        paragraphDescription: '',
        participatesInTitleNumbering: false,
        body: '위와 같은 개인정보 및 초상권 활용에 대한 내용을 모두 확인했습니다.',
      },
      {
        id: AGREEMENT_PORTRAIT_PARAGRAPH_IDS.systemDate,
        kind: 'description',
        variant: 'system',
        systemPreset: 'agreement_date',
        requiredMark: true,
        paragraphTitle: '날짜 유형',
        paragraphDescription: '',
        participatesInTitleNumbering: false,
      },
      {
        id: AGREEMENT_PORTRAIT_PARAGRAPH_IDS.systemSignature,
        kind: 'description',
        variant: 'system',
        systemPreset: 'agreement_signature',
        requiredMark: true,
        paragraphTitle: '서명란 유형',
        paragraphDescription: '',
        participatesInTitleNumbering: false,
      },
    ],
  }
}

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

/** 폼 관리 > 교육진행자 동의 서약서(안) — 시드 단락 id */
export const EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS = {
  title: 'agreement-expense-pledge-title',
  intro: 'agreement-expense-pledge-intro',
  clause1: 'agreement-expense-pledge-clause-1',
  clause2: 'agreement-expense-pledge-clause-2',
  clause3: 'agreement-expense-pledge-clause-3',
  clause4: 'agreement-expense-pledge-clause-4',
  violationClosing: 'agreement-expense-pledge-violation-closing',
  systemDate: 'agreement-expense-pledge-system-date',
  systemSignature: 'agreement-expense-pledge-system-signature',
} as const

/** 템플릿 고정 단락 — 삭제·복제·순서 변경 불가 */
export const EDUCATOR_FACILITATOR_PLEDGE_SEED_PARAGRAPH_IDS = new Set<string>([
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.title,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.intro,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.clause1,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.clause2,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.clause3,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.clause4,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.violationClosing,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.systemDate,
  EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.systemSignature,
])

export const EDUCATOR_FACILITATOR_PLEDGE_HIDDEN_DRAG_HANDLE_IDS = new Set<string>(
  EDUCATOR_FACILITATOR_PLEDGE_SEED_PARAGRAPH_IDS
)

const PLEDGE_MC_OPTIONS_BASE = 'pledge-mc' as const

function createPledgeClauseMultipleChoice(
  id: string,
  clauseKey: string,
  paragraphTitle: string,
  paragraphDescription: string
): MultipleChoiceParagraph {
  return {
    id,
    kind: 'single_item',
    variant: 'multiple_choice',
    requiredMark: true,
    paragraphTitle,
    paragraphDescription,
    participatesInTitleNumbering: true,
    answerRequired: true,
    allowMultiple: false,
    items: [
      { id: `${PLEDGE_MC_OPTIONS_BASE}-${clauseKey}-agree`, label: '동의' },
      { id: `${PLEDGE_MC_OPTIONS_BASE}-${clauseKey}-disagree`, label: '동의하지 않음' },
    ],
    selectedPreviewSingleId: null,
    selectedPreviewMultipleIds: [],
  }
}

/** 폼 관리 > 교육진행자 동의 서약서(안) — 목록 상세·단락 에디터 시드 초안 */
export function createEducatorFacilitatorPledgeDraft(): WritingFormDraft {
  return {
    schemaVersion: 1,
    formSettings: { titleNumbering: 'numeric' },
    paragraphs: [
      {
        id: EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.title,
        kind: 'description',
        variant: 'survey_title_with_period',
        requiredMark: true,
        paragraphTitle: '',
        paragraphDescription: '',
        participatesInTitleNumbering: false,
        surveyTitle: 'JA Korea 교육진행자 서약서',
        surveyDescription: '',
        periodMode: 'immediate',
        startAt: null,
        endAt: null,
        showWritingPeriodOnForm: false,
      },
      {
        id: EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.intro,
        kind: 'single_item',
        variant: 'agreement_explanation_text',
        requiredMark: false,
        paragraphTitle: '',
        paragraphDescription: '',
        participatesInTitleNumbering: false,
        bodyPlaceholder: '한 줄 안내를 입력해 주세요',
        bodyText:
          '본인은 JA Korea의 교육사업에 참여함에 있어, 다음 사항을 준수할 것을 서약합니다.',
        answerRequired: false,
      },
      createPledgeClauseMultipleChoice(
        EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.clause1,
        '1',
        '아동·청소년 보호와 성범죄 예방',
        '교육 대상이 아동·청소년인 경우, 관련 법령과 윤리 기준을 준수하며, 모든 수강생이 안전하고 존중받는 환경에서 학습할 수 있도록 최선을 다하겠습니다.'
      ),
      createPledgeClauseMultipleChoice(
        EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.clause2,
        '2',
        '종교적 정치적 중립성 유지',
        '교육 내용 및 발언에 있어 종교적·정치적으로 편향이나 특정 종교·이념·정당을 지지·비판하는 내용을 포함하지 않겠습니다.'
      ),
      createPledgeClauseMultipleChoice(
        EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.clause3,
        '3',
        '개인정보 보호',
        '교육과정 중 알게 된 관련인의 개인정보를 외부에 유출하거나 무단으로 사용하지 않겠습니다.'
      ),
      createPledgeClauseMultipleChoice(
        EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.clause4,
        '4',
        '품위 유지 및 성실한 교육 수행',
        '교육 강사로서 사회적 물의를 일으키지 않으며, 성실하고 책임감 있게 교육 활동에 임하겠습니다.'
      ),
      {
        id: EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.violationClosing,
        kind: 'description',
        variant: 'closing',
        requiredMark: false,
        paragraphTitle: '',
        paragraphDescription: '',
        participatesInTitleNumbering: false,
        body:
          '본 서약을 위반할 경우, 재단의 교육사업과 관련한 강사 자격이 제한되거나 향후 활동에 불이익이 있을 수 있음을 인지하고 이에 동의합니다.',
      },
      {
        id: EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.systemDate,
        kind: 'description',
        variant: 'system',
        systemPreset: 'agreement_date',
        requiredMark: false,
        paragraphTitle: '날짜 유형',
        paragraphDescription: '',
        participatesInTitleNumbering: false,
      },
      {
        id: EDUCATOR_FACILITATOR_PLEDGE_PARAGRAPH_IDS.systemSignature,
        kind: 'description',
        variant: 'system',
        systemPreset: 'agreement_signature',
        requiredMark: false,
        paragraphTitle: '서명란 유형',
        paragraphDescription: '',
        participatesInTitleNumbering: false,
      },
    ],
  }
}

/**
 * 동의 양식: 마지막이 마무리이고 그 앞이 서명·날짜 시스템 단락이면 하단 3개는 드래그 제외.
 * 동의 양식(agreement-notice 등): 마지막 두 단락이 [agreement_date, agreement_signature]면 그 둘만 핀드 테일.
 * 그 외: 첫 단락 + middle + 마지막 1개만 고정.
 */
export function getWritingFormHeadMiddlePinnedTail(paragraphs: WritingFormParagraph[]): {
  head: WritingFormParagraph
  middle: WritingFormParagraph[]
  pinnedTail: WritingFormParagraph[]
} | null {
  /** head + middle(+선택 핀 tail) 구조. 단락 2개 폼(예: Gemini 찾아가는 연수 강사 신청)도 head·middle로 분해되어야 함 */
  if (paragraphs.length < 2) return null
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

  /** 마지막 두 단락이 [agreement_date, agreement_signature]이면 둘 다 핀드 테일(마무리 단락 없는 동의서) */
  const doublePinnedAgreementSystem =
    n >= 4 &&
    last.kind === 'description' &&
    last.variant === 'system' &&
    last.systemPreset === 'agreement_signature' &&
    p2 != null &&
    p2.kind === 'description' &&
    p2.variant === 'system' &&
    p2.systemPreset === 'agreement_date'

  if (doublePinnedAgreementSystem) {
    return {
      head,
      middle: paragraphs.slice(1, -2),
      pinnedTail: paragraphs.slice(-2),
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

  /** 마지막이 마무리글형이 아니면 하단 고정 tail 없음 — head만 고정(예: UJAT 교육계획서) */
  const lastIsClosingParagraph =
    last.kind === 'description' && last.variant === 'closing'

  if (!lastIsClosingParagraph) {
    return {
      head,
      middle: paragraphs.slice(1),
      pinnedTail: [],
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
  const scaleItems = createDefaultScaleTypeItems()
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
        variant: 'user_info',
        answerRequired: true,
        requiredMark: true,
        paragraphTitle: '설문자 정보',
        paragraphDescription: '선택한 항목을 자동으로 불러옵니다.',
        participatesInTitleNumbering: true,
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
        selectedUserFieldKeys: ['name', 'addressRegion'],
      },
      {
        id: DEFAULT_SURVEY_PARAGRAPH_IDS.score,
        kind: 'single_item',
        variant: 'scale_type',
        answerRequired: true,
        requiredMark: true,
        paragraphTitle: '오리엔테이션에서 제공된 정보가 이해하기 쉬웠나요?',
        paragraphDescription: '설명 입력',
        participatesInTitleNumbering: true,
        items: scaleItems,
        selectedPreviewItemId: 'scale-type-item-5',
      },
      {
        id: DEFAULT_SURVEY_PARAGRAPH_IDS.score2,
        kind: 'single_item',
        variant: 'scale_type',
        answerRequired: true,
        requiredMark: true,
        paragraphTitle: '프로그램 전반적인 프로세스에 대해 명확히 이해했나요?',
        paragraphDescription: '설명 입력',
        participatesInTitleNumbering: true,
        items: scaleItems,
        selectedPreviewItemId: 'scale-type-item-5',
      },
      {
        id: DEFAULT_SURVEY_PARAGRAPH_IDS.subjective,
        kind: 'single_item',
        variant: 'short_essay',
        answerRequired: true,
        requiredMark: true,
        paragraphTitle:
          '오늘 강의에서 배운 점, 기억나는 점, 좋았던 점 등을 작성해 주세요.',
        paragraphDescription: '설명 입력',
        participatesInTitleNumbering: true,
        showItemTitle: false,
        items: [
          {
            id: 'survey-short-essay-item-1',
            label: 'Title 01',
            placeholder: '답변을 입력해 주세요',
            bodyText: '',
          },
        ],
        bodyPlaceholder: '답변을 입력해 주세요',
        bodyText: '',
      },
      {
        id: DEFAULT_SURVEY_PARAGRAPH_IDS.subjective2,
        kind: 'single_item',
        variant: 'short_essay',
        answerRequired: true,
        requiredMark: true,
        paragraphTitle: '기타 의견이 있다면 작성해 주세요.',
        paragraphDescription:
          '교육 워크숍 진행, 강의 내용 등에 대한 기타 의견을 작성해 주세요.',
        participatesInTitleNumbering: true,
        showItemTitle: false,
        items: [
          {
            id: 'survey-short-essay-item-2',
            label: 'Title 01',
            placeholder: '답변을 입력해 주세요',
            bodyText: '',
          },
        ],
        bodyPlaceholder: '답변을 입력해 주세요',
        bodyText: '',
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

const UJAT_EDU_PLAN_EXPLANATION_BODY =
  '1. 봉사자는 학년별로 세부적인 교육 계획을 각각 작성해야 합니다. 계획은 구체적이고 성실하게 작성해 주시기 바랍니다. 1학년부터 6학년까지 모든 학년에 대한 계획을 작성해 주세요.\n' +
  '2. 교육 계획서는 활동 예정일 1주 전 목요일 24:00까지 제출해야 합니다.\n' +
  '3. 제출하지 않거나 성의 없는 내용을 작성할 경우, 봉사 시간 인증에 불이익이 있을 수 있습니다.'

const UJAT_EDU_PLAN_DEFAULT_SELECTED_USER_FIELD_KEYS = [
  'name',
  'addressRegion',
  'educationTarget',
  'educationGrade',
] as const

const UJAT_EDU_PLAN_USER_FIELDS: Array<{ key: string; label: string }> = [
  { key: 'name', label: '이름' },
  { key: 'gender', label: '성별' },
  { key: 'birthDate', label: '생년월일' },
  { key: 'phone', label: '연락처' },
  { key: 'email', label: '이메일' },
  { key: 'addressRegion', label: '자택 주소지' },
  { key: 'addressDetail', label: '자택 주소(상세)' },
  { key: 'affiliation', label: '소속' },
  { key: 'applicantType', label: '신청자 유형' },
  { key: 'programName', label: '프로그램' },
  { key: 'period', label: '활동 일정' },
  { key: 'institutionName', label: '기관명' },
  { key: 'institutionRegion', label: '기관 소재지' },
  { key: 'educationTarget', label: '교육 대상' },
  { key: 'educationGrade', label: '교육 학년' },
  { key: 'teamName', label: '팀 명' },
  { key: 'teamPartnerName', label: '팀원 명' },
]

function createUjatEducationIssuanceSessionParagraph(
  id: string,
  paragraphTitle: string
): SessionPlanShortEssayParagraph {
  const ph = '자유롭게 작성해 주세요'
  return {
    id,
    kind: 'single_item',
    variant: 'session_plan_short_essay',
    answerRequired: true,
    requiredMark: true,
    paragraphTitle,
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    showItemTitle: true,
    items: [
      { id: `${id}-intro`, label: '도입', placeholder: ph, bodyText: '' },
      { id: `${id}-body`, label: '전개', placeholder: ph, bodyText: '' },
      { id: `${id}-outro`, label: '마무리', placeholder: ph, bodyText: '' },
    ],
    bodyPlaceholder: ph,
    bodyText: '',
  }
}

type UjatEducationIssuanceParagraphIds = {
  title: string
  explanationText: string
  volunteerInfo: string
  session1: string
  session2: string
  session3: string
  session4: string
}

/** UJAT 교육일지 4번 단락 — 전용 UI(학교 비활성·학년/반·일자) */
function createUjatJournalEducationInfoParagraph(id: string): UjatJournalEducationInfoParagraph {
  return normalizeUjatJournalEducationInfoParagraph({
    id,
    kind: 'single_item',
    variant: 'ujat_journal_education_info',
    requiredMark: true,
    paragraphTitle: '교육 정보',
    paragraphDescription: '설명 입력',
    participatesInTitleNumbering: true,
    answerRequired: true,
    schoolDisplayFallback: UJAT_JOURNAL_EDUCATION_INFO_SAMPLE_INSTITUTION_NAME,
    grade: '',
    classSection: '',
    prepDate: '',
    sessionDate: '',
  }) as UjatJournalEducationInfoParagraph
}

/** UJAT 교육계획서·교육일지 공통 시드(단락 id·문서 제목·차시 타이틀만 다름) */
function createUjatEducationIssuanceDraft(
  ids: UjatEducationIssuanceParagraphIds,
  surveyTitle: string,
  getSessionParagraphTitle: (sessionIndex: number) => string,
  options?: { paragraphsAfterVolunteer?: WritingFormParagraph[] }
): WritingFormDraft {
  const selectedKeys = [...UJAT_EDU_PLAN_DEFAULT_SELECTED_USER_FIELD_KEYS]
  const afterVolunteer = options?.paragraphsAfterVolunteer ?? []
  return {
    schemaVersion: 1,
    formSettings: { titleNumbering: 'numeric' },
    paragraphs: [
      {
        id: ids.title,
        kind: 'description',
        variant: 'survey_title_with_period',
        requiredMark: true,
        paragraphTitle: '',
        paragraphDescription: '',
        participatesInTitleNumbering: false,
        surveyTitle,
        surveyDescription: '',
        periodMode: 'custom',
        startPeriodMode: 'immediate',
        endPeriodMode: 'custom',
        startAt: null,
        endAt: null,
        endPeriodPresetLabel: '활동일 전주 목요일 (24:00)',
        showWritingPeriodOnForm: false,
      },
      {
        id: ids.explanationText,
        kind: 'single_item',
        variant: 'agreement_explanation_text',
        requiredMark: true,
        paragraphTitle: '',
        paragraphDescription: '',
        participatesInTitleNumbering: true,
        bodyPlaceholder: '텍스트를 작성해 주세요',
        bodyText: UJAT_EDU_PLAN_EXPLANATION_BODY,
        answerRequired: true,
      },
      {
        id: ids.volunteerInfo,
        kind: 'single_item',
        variant: 'user_info',
        answerRequired: true,
        requiredMark: true,
        paragraphTitle: '봉사자 정보',
        paragraphDescription: '노출할 항목을 선택합니다. (실제 응답 시 자동 매핑)',
        participatesInTitleNumbering: true,
        userFields: UJAT_EDU_PLAN_USER_FIELDS,
        selectedUserFieldKeys: selectedKeys,
      },
      ...afterVolunteer,
      createUjatEducationIssuanceSessionParagraph(ids.session1, getSessionParagraphTitle(1)),
      createUjatEducationIssuanceSessionParagraph(ids.session2, getSessionParagraphTitle(2)),
      createUjatEducationIssuanceSessionParagraph(ids.session3, getSessionParagraphTitle(3)),
      createUjatEducationIssuanceSessionParagraph(ids.session4, getSessionParagraphTitle(4)),
    ],
  }
}

/** 발급 양식 > UJAT 교육계획서 — 기존 단락 variant만으로 구성된 시드 초안 */
export function createUjatEducationPlanIssuanceDraft(): WritingFormDraft {
  return createUjatEducationIssuanceDraft(
    UJAT_EDUCATION_PLAN_ISSUANCE_PARAGRAPH_IDS,
    'JA KOREA 대학생경제교육봉사단(UJAT) 교육계획서',
    n => `${n}차시 교육 계획`
  )
}

function createUjatEducationJournalContentFeedbackParagraph(
  id: string
): ShortEssayParagraph {
  const ph = '자유롭게 작성해 주세요'
  return {
    id,
    kind: 'single_item',
    variant: 'short_essay',
    answerRequired: true,
    requiredMark: true,
    paragraphTitle: '교육 내용 피드백',
    paragraphDescription: '잘된 점과 어려웠던 점, 기타 사항을 작성해 주세요',
    participatesInTitleNumbering: true,
    showItemTitle: false,
    items: [
      {
        id: `${id}-item-1`,
        label: '',
        placeholder: ph,
        bodyText: '',
      },
    ],
    bodyPlaceholder: ph,
    bodyText: '',
  }
}

function createLectureReportEducationPhotosParagraph(id: string): FileAttachmentParagraph {
  return {
    id,
    kind: 'single_item',
    variant: 'file_attachment',
    answerRequired: true,
    requiredMark: true,
    paragraphTitle: '교육 사진',
    paragraphDescription: '교육 장면 사진을 2장 이상 첨부해 주세요',
    participatesInTitleNumbering: true,
  }
}

function createUjatEducationJournalEducationPhotosParagraph(
  id: string
): FileAttachmentParagraph {
  return {
    id,
    kind: 'single_item',
    variant: 'file_attachment',
    answerRequired: true,
    requiredMark: true,
    paragraphTitle: '교육 사진',
    paragraphDescription: '교육 당일 사진을 2장 이상 첨부해 주세요',
    participatesInTitleNumbering: true,
  }
}

/** 발급 양식 > UJAT 교육일지 — 교육계획서와 동일 단락 구성 + 4번 교육 정보(2단×2행) 테이블 + 피드백·사진 첨부 */
export function createUjatEducationJournalIssuanceDraft(): WritingFormDraft {
  const base = createUjatEducationIssuanceDraft(
    UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS,
    'JA KOREA 대학생경제교육봉사단(UJAT) 교육일지',
    n => `${n}차시 교육 일지`,
    {
      paragraphsAfterVolunteer: [
        createUjatJournalEducationInfoParagraph(UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS.educationInfo),
      ],
    }
  )
  return {
    ...base,
    paragraphs: [
      ...base.paragraphs,
      createUjatEducationJournalContentFeedbackParagraph(
        UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS.contentFeedback
      ),
      createUjatEducationJournalEducationPhotosParagraph(
        UJAT_EDUCATION_JOURNAL_ISSUANCE_PARAGRAPH_IDS.educationPhotos
      ),
    ],
  }
}

export function createLectureReportProgramProgressParagraph(
  id: string
): LectureReportProgramProgressParagraph {
  return normalizeLectureReportProgramProgressParagraph({
    id,
    kind: 'single_item',
    variant: 'lecture_report_program_progress',
    requiredMark: true,
    paragraphTitle: '프로그램 진행 정보',
    paragraphDescription: '설명 입력',
    participatesInTitleNumbering: true,
    answerRequired: true,
    programName: '',
    finalInstructorCount: '',
    institutionName: '',
    institutionLocation: '',
    educationDate: '',
    sessionTime: '',
    sessionIndex: '',
    educationTarget: '',
    classLabel: '',
    studentCount: '',
  }) as LectureReportProgramProgressParagraph
}

/** 발급 양식 > 강의보고서 — 제목·프로그램 진행(2단×4행)·교육 내용/운영(Q형)·사진 */
export function createLectureReportIssuanceDraft(): WritingFormDraft {
  const ph = '자유롭게 작성해 주세요'
  const ids = LECTURE_REPORT_ISSUANCE_PARAGRAPH_IDS

  function lectureReportSessionParagraph(
    id: string,
    paragraphTitle: string,
    paragraphDescription: string,
    itemLabels: string[]
  ): SessionPlanShortEssayParagraph {
    return {
      id,
      kind: 'single_item',
      variant: 'session_plan_short_essay',
      answerRequired: true,
      requiredMark: true,
      paragraphTitle,
      paragraphDescription,
      participatesInTitleNumbering: true,
      showItemTitle: true,
      items: itemLabels.map((label, i) => ({
        id: `${id}-item-${i + 1}`,
        label,
        placeholder: ph,
        bodyText: '',
      })),
      bodyPlaceholder: ph,
      bodyText: '',
    }
  }

  return {
    schemaVersion: 1,
    formSettings: { titleNumbering: 'numeric' },
    paragraphs: [
      {
        id: ids.title,
        kind: 'description',
        variant: 'survey_title_with_period',
        requiredMark: true,
        paragraphTitle: '',
        paragraphDescription: '',
        participatesInTitleNumbering: false,
        surveyTitle: 'JA KOREA 「강의명」 강의보고서',
        surveyDescription: '',
        periodMode: 'immediate',
        startAt: null,
        endAt: null,
        showWritingPeriodOnForm: true,
      },
      createLectureReportProgramProgressParagraph(ids.programProgress),
      lectureReportSessionParagraph(ids.educationContent, '교육 내용', '설명 입력', [
        'Q1. 주요 학습 내용 및 핵심 개념은 무엇이었나요?',
        'Q2. 강의 진행 내용 (ex: 교재/활동 내용, 교구재 활용 방식 등)',
      ]),
      lectureReportSessionParagraph(ids.educationOperation, '교육 운영', '설명 입력', [
        'Q1. 전반적인 학생들의 교육 참여도는 어떠했나요?',
        'Q2. 교육 콘텐츠 난이도 적합성은 어떠했나요?',
        'Q3. 강의 진행 중 이슈 및 특이사항이 있었나요?',
      ]),
      {
        id: ids.overallEvaluation,
        kind: 'single_item',
        variant: 'session_plan_short_essay',
        answerRequired: true,
        requiredMark: true,
        paragraphTitle: '강의 종합 평가 및 개선점',
        paragraphDescription: 'ex) 강의 총평, 잘 된 점, 아쉬운 점, 개선 방향 등',
        participatesInTitleNumbering: true,
        showItemTitle: false,
        items: [
          {
            id: `${ids.overallEvaluation}-item-1`,
            label: '',
            placeholder: ph,
            bodyText: '',
          },
        ],
        bodyPlaceholder: ph,
        bodyText: '',
      },
      createLectureReportEducationPhotosParagraph(ids.educationPhotos),
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
  const closing = base.paragraphs[base.paragraphs.length - 1]!
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
  if (p.kind === 'description' && p.variant === 'static_description_lines') {
    const t = p.paragraphTitle.trim()
    return t || '동의 안내'
  }
  if (p.kind === 'single_item' && p.variant === 'id_type_with_input') {
    const t = p.paragraphTitle.trim()
    return t || '신원 확인'
  }
  if (p.kind === 'single_item' && p.variant === 'agreement_explanation_text') {
    const t = p.paragraphTitle.trim()
    return t || '설명 안내'
  }
  if (
    p.kind === 'single_item' &&
    (p.variant === 'short_essay' || p.variant === 'session_plan_short_essay')
  ) {
    const t = p.paragraphTitle.trim()
    return t || '동의 내용'
  }
  if (p.kind === 'single_item' && p.variant === 'ujat_journal_education_info') {
    const t = p.paragraphTitle.trim()
    if (t) return t
    return '교육 정보'
  }
  if (p.kind === 'single_item' && p.variant === 'lecture_report_program_progress') {
    const t = p.paragraphTitle.trim()
    if (t) return t
    return '프로그램 진행 정보'
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
