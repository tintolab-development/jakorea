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
  fields: UserProfileField[]
}

export interface ScoreSelectParagraph extends WritingFormParagraphBase {
  kind: 'single_item'
  variant: 'score_select'
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
  items: SubjectiveItem[]
}

export interface ClosingParagraph extends WritingFormParagraphBase {
  kind: 'description'
  variant: 'closing'
  body: string
  /** 동의서 마무리: 일자·서명 placeholder 바 노출 */
  showAgreementFooter?: boolean
}

/** 동의서 일반 본문(카드 타이틀/설명 + 본문 영역) */
export interface AgreementRichTextParagraph extends WritingFormParagraphBase {
  kind: 'single_item'
  variant: 'agreement_rich_text'
  bodyPlaceholder: string
  bodyText: string
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

export interface AgreementPrivacyRow {
  id: string
  label: string
  placeholder: string
}

/** 개인정보 수집 고지 항목(불릿 + 라벨 + 입력) */
export interface AgreementPrivacyRowsParagraph extends WritingFormParagraphBase {
  kind: 'single_item'
  variant: 'agreement_privacy_rows'
  rows: AgreementPrivacyRow[]
}

/** 표 형 고지 + 동의/비동의 라디오(미리보기) */
export interface AgreementTableConsentParagraph extends WritingFormParagraphBase {
  kind: 'single_item'
  variant: 'agreement_table_consent'
  headerValues: [string, string, string]
  cellValues: [string, string, string]
  footerDescription: string
  selectedPreviewConsent: 'agree' | 'disagree'
}

/** 캔버스에서 선택된 테이블 행(헤더 행 vs 데이터 행) — 에디터에서 단락 id별로 보관해 위젯마다 분리 */
export type HorizontalTableRowSelection =
  | { area: 'header' }
  | { area: 'body'; row: number }

/** 텍스트형: 모든 셀 `Input` / 필드형: 열마다 입력 유형 + 필드 셀 값 */
export type HorizontalTableFlavor = 'text' | 'field'

/** 열(칸) 단위 필드 정의 — 헤더는 별도 `columnHeaders` 텍스트 */
export type HorizontalTableColumnField =
  | { kind: 'subjective'; placeholder: string }
  | { kind: 'dropdown'; placeholder: string; options: string[] }
  | { kind: 'dateTime'; dateTimeMode: 'date' | 'time' | 'dateTime'; placeholder: string }
  | { kind: 'single'; options: string[] }
  | { kind: 'multiple'; options: string[] }

export type HorizontalTableFieldColumnKind = HorizontalTableColumnField['kind']

export type HorizontalTableFieldCellValue =
  | { kind: 'subjective' | 'dropdown' | 'dateTime' | 'single'; value: string }
  | { kind: 'multiple'; values: string[] }

export const HORIZONTAL_TABLE_MIN_COLUMN_COUNT = 2

/** 주관식 등 입력창 안내(플레이스홀더) 기본 문구 */
export const HORIZONTAL_TABLE_INPUT_GUIDANCE_PLACEHOLDER = '내용을 입력해 주세요'

const DEFAULT_DROPDOWN_OPTIONS = ['A', 'B', 'C'] as const
const DEFAULT_CHOICE_OPTIONS = ['A', 'B', 'C'] as const

export function defaultFieldForColumnKind(kind: HorizontalTableFieldColumnKind): HorizontalTableColumnField {
  switch (kind) {
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

/** 필드형 열·빈 열 슬롯 기본: 주관식형 */
function defaultColumnFieldForNewColumn(): HorizontalTableColumnField {
  return defaultFieldForColumnKind('subjective')
}

export function createEmptyFieldCellValue(field: HorizontalTableColumnField): HorizontalTableFieldCellValue {
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
  if (value.kind === nextField.kind) {
    return value
  }
  return { kind: nextField.kind, value: '' }
}

/** 작성 양식 — 테이블 가로형(가변 행·열, 각 dataRows[i] 길이는 columnHeaders와 동일) */
export interface HorizontalTableParagraph extends WritingFormParagraphBase {
  kind: 'single_item'
  variant: 'horizontal_table'
  /** `text`: `dataRows`만 사용. `field`: `columnFields`·`fieldDataRows` 사용 */
  tableFlavor: HorizontalTableFlavor
  columnHeaders: string[]
  dataRows: string[][]
  /** `tableFlavor === 'field'`일 때만 — 열과 동일 길이 */
  columnFields: HorizontalTableColumnField[]
  fieldDataRows: HorizontalTableFieldCellValue[][]
  bottomText: string
  showBottomText: boolean
  answerRequired: boolean
}

/** 세로형 테이블 한 행: 1단(항목·입력 1쌍) 또는 2단(같은 행에 두 쌍, 폭 분배).
 * `placeholderHints`: 주관식·날짜/시간형(td) 플레이스홀더 「입력창 안내」— 스테이지별 1개·2개 튜플. 생략 시 본문에서 기본 문구 사용.
 * `dateTimeStage1Time`: 날짜/시간형·2단일 때 두 번째 스테이지 td의 시간 픽커 값(`cells[1]`은 해당 스테이지 날짜). */
export type VerticalTableRow =
  | { stageCount: 1; headers: [string]; cells: [string]; placeholderHints?: [string] }
  | {
      stageCount: 2
      headers: [string, string]
      cells: [string, string]
      placeholderHints?: [string, string]
      /** 날짜/시간형: 2단 우측 스테이지의 시간(HH:mm) */
      dateTimeStage1Time?: string
    }

/** 빈 문자열 가드 없이 우선 사용 — 주관식 td 기본 플레이스홀더 */
export const DEFAULT_VERTICAL_SUBJECTIVE_CELL_PLACEHOLDER = '내용을 입력해 주세요'

/**
 * 세로형 단락 종류.
 * - `text`: 테이블_세로형(텍스트형)
 * - `subjective`: 테이블_세로형(주관식형) — 행별 주관식(자유 서술) 입력
 * - `date_time`: 테이블_세로형(날짜/시간형)
 */
export type VerticalTableFlavor = 'text' | 'subjective' | 'date_time'

/** 작성 양식 — 테이블 세로형 (`verticalTableFlavor`로 텍스트형 / 주관식형 / 날짜·시간형 구분) */
export interface VerticalTableParagraph extends WritingFormParagraphBase {
  kind: 'single_item'
  variant: 'vertical_table'
  /** 생략·불명시는 `text`(기존 JSON 호환) */
  verticalTableFlavor: VerticalTableFlavor
  rows: VerticalTableRow[]
  bottomText: string
  showBottomText: boolean
  answerRequired: boolean
}

function repairColumnField(f: HorizontalTableColumnField | undefined, _idx: number): HorizontalTableColumnField {
  if (f == null) return defaultColumnFieldForNewColumn()
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
    return { ...p, dataRows: nextDataRows }
  }
  const fieldCols = ensureColumnFieldSlice(p, colCount)
  const out: HorizontalTableFieldCellValue[][] = []
  for (let ri = 0; ri < normalizedRows.length; ri++) {
    out.push(padFieldRow(p.fieldDataRows?.[ri], colCount, fieldCols))
  }
  out.push(fieldCols.map(f => createEmptyFieldCellValue(f)))
  return {
    ...p,
    dataRows: nextDataRows,
    columnFields: fieldCols,
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
  const newHeaderSuffix = p.tableFlavor === 'field' ? '주관식형' : ''
  const nextHeaders = [...p.columnHeaders, newHeaderSuffix]
  const nextWidth = nextHeaders.length
  const nextTextRows =
    normalizedRows.length > 0
      ? normalizedRows.map(r => [...r, ''])
      : [Array.from({ length: nextWidth }, () => '')]
  if (p.tableFlavor !== 'field') {
    return { ...p, columnHeaders: nextHeaders, dataRows: nextTextRows }
  }
  const newField = defaultFieldForColumnKind('subjective')
  const fieldCols = [...ensureColumnFieldSlice(p, colCount), newField]
  const nextFieldRows = nextTextRows.map((_, ri) => {
    const prevRow = p.fieldDataRows?.[ri]
    const padded = padFieldRow(prevRow, colCount, fieldCols.slice(0, colCount))
    return [...padded, createEmptyFieldCellValue(newField)]
  })
  return {
    ...p,
    columnHeaders: nextHeaders,
    dataRows: nextTextRows,
    columnFields: fieldCols,
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
    paragraphTitle: '테이블_가로형',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    tableFlavor: 'text',
    columnHeaders: ['', '', ''],
    dataRows: [['', '', '']],
    columnFields: [],
    fieldDataRows: [],
    bottomText: '',
    showBottomText: false,
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
    return { ...p, columnHeaders: nextHeaders, dataRows: nextRows }
  }
  const nextFields = (p.columnFields ?? []).filter((_, i) => i !== columnIndex)
  const nextFieldRows = (p.fieldDataRows ?? []).map(r => r.filter((_, i) => i !== columnIndex))
  return {
    ...p,
    columnHeaders: nextHeaders,
    dataRows: nextRows,
    columnFields: nextFields,
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
    return { ...p, dataRows: rows.filter((_, i) => i !== rowIndex) }
  }
  return {
    ...p,
    dataRows: rows.filter((_, i) => i !== rowIndex),
    fieldDataRows: (p.fieldDataRows ?? []).filter((_, i) => i !== rowIndex),
  }
}

/**
 * 로드·저장 JSON에 필드 누락이 있을 수 있어 보정.
 * (구버전: `tableFlavor` 없음 = 텍스트형)
 */
export function normalizeHorizontalTableParagraph(p: HorizontalTableParagraph): HorizontalTableParagraph {
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
    return {
      ...p,
      tableFlavor: 'text',
      columnHeaders: headers,
      dataRows,
      columnFields: p.columnFields ?? [],
      fieldDataRows: p.fieldDataRows ?? [],
      bottomText: p.bottomText ?? '',
      showBottomText: Boolean(p.showBottomText),
    }
  }
  const fieldCols = ensureColumnFieldSlice({ ...p, columnHeaders: headers, dataRows, tableFlavor: 'field' } as HorizontalTableParagraph, colCount)
  const fieldDataRows = syncFieldDataRowsToTextRows(
    { ...p, columnFields: fieldCols, columnHeaders: headers, dataRows, tableFlavor: 'field' } as HorizontalTableParagraph,
    colCount,
    fieldCols
  )
  return {
    ...p,
    tableFlavor: 'field',
    columnHeaders: headers,
    dataRows,
    columnFields: fieldCols,
    fieldDataRows,
    bottomText: p.bottomText ?? '',
    showBottomText: Boolean(p.showBottomText),
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
    const fieldCols = ensureColumnFieldSlice(n, colCount)
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
  } as HorizontalTableParagraph)
}

/** 열 `colIdx`의 필드 정의 변경 — 모든 `fieldDataRows`에 해당 열 값 재맞춤 */
export function horizontalTableUpdateColumnField(
  p: HorizontalTableParagraph,
  colIdx: number,
  nextField: HorizontalTableColumnField
): HorizontalTableParagraph {
  const n = normalizeHorizontalTableParagraph(p)
  if (n.tableFlavor !== 'field') return n
  const colCount = Math.max(1, n.columnHeaders.length)
  if (colIdx < 0 || colIdx >= colCount) return n
  const fieldCols = ensureColumnFieldSlice(n, colCount)
  fieldCols[colIdx] = nextField
  const nextRows = n.fieldDataRows.map(row => {
    const padded = padFieldRow(row, colCount, fieldCols)
    return padded.map((cell, c) => rehomeFieldCellValue(cell, fieldCols[c]!))
  })
  return { ...n, columnFields: fieldCols, fieldDataRows: nextRows }
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
  const f = fieldCols[colIdx] ?? defaultColumnFieldForNewColumn()
  const rowCount = Math.max(1, n.dataRows.length, n.fieldDataRows.length)
  const base: HorizontalTableFieldCellValue[][] = Array.from({ length: rowCount }, (_, ri) =>
    padFieldRow(n.fieldDataRows?.[ri], colCount, fieldCols)
  )
  if (rowIdx < 0 || rowIdx >= base.length) return n
  const row = [...base[rowIdx]!]
  row[colIdx] = rehomeFieldCellValue(value, f)
  base[rowIdx] = row
  return { ...n, columnFields: fieldCols, fieldDataRows: base }
}

function defaultVerticalTableRowSingle(): VerticalTableRow {
  return { stageCount: 1, headers: [''], cells: [''] }
}

function normalizeVerticalTableRow(raw: unknown): VerticalTableRow {
  if (raw != null && typeof raw === 'object' && 'stageCount' in raw) {
    const sc = (raw as { stageCount?: number }).stageCount
    if (sc === 2) {
      const h = (raw as { headers?: string[] }).headers ?? []
      const c = (raw as { cells?: string[] }).cells ?? []
      const ph = (raw as { placeholderHints?: string[] }).placeholderHints
      const dtTime = (raw as { dateTimeStage1Time?: string }).dateTimeStage1Time
      const row: VerticalTableRow = {
        stageCount: 2,
        headers: [h[0] ?? '', h[1] ?? ''],
        cells: [c[0] ?? '', c[1] ?? ''],
      }
      if (ph != null && ph.length >= 1) {
        row.placeholderHints = [ph[0] ?? '', ph[1] ?? '']
      }
      if (typeof dtTime === 'string') {
        row.dateTimeStage1Time = dtTime
      }
      return row
    }
  }
  const h =
    raw != null && typeof raw === 'object' && 'headers' in raw
      ? (raw as { headers?: string[] }).headers
      : undefined
  const c =
    raw != null && typeof raw === 'object' && 'cells' in raw ? (raw as { cells?: string[] }).cells : undefined
  const ph1 =
    raw != null && typeof raw === 'object' && 'placeholderHints' in raw
      ? (raw as { placeholderHints?: string[] }).placeholderHints
      : undefined
  const row1: VerticalTableRow = {
    stageCount: 1,
    headers: [h?.[0] ?? ''],
    cells: [c?.[0] ?? ''],
  }
  if (ph1 != null && ph1.length >= 1) {
    row1.placeholderHints = [ph1[0] ?? '']
  }
  return row1
}

export function normalizeVerticalTableParagraph(p: VerticalTableParagraph): VerticalTableParagraph {
  const rowsIn = p.rows ?? []
  let rows = rowsIn.map(normalizeVerticalTableRow)
  if (rows.length === 0) {
    rows = [defaultVerticalTableRowSingle()]
  }
  const verticalTableFlavor: VerticalTableFlavor =
    p.verticalTableFlavor === 'subjective'
      ? 'subjective'
      : p.verticalTableFlavor === 'date_time'
        ? 'date_time'
        : 'text'
  return {
    ...p,
    variant: 'vertical_table',
    verticalTableFlavor,
    rows,
    bottomText: p.bottomText ?? '',
    showBottomText: Boolean(p.showBottomText),
    answerRequired: p.answerRequired !== false,
  }
}

/** 기본 제목 없을 때 우측 패널·아웃라인 등에 사용 */
export function verticalTableParagraphOutlineLabel(flavor: VerticalTableFlavor): string {
  if (flavor === 'subjective') return '테이블_세로형(주관식형)'
  if (flavor === 'date_time') return '테이블_세로형(날짜/시간형)'
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
    paragraphTitle: verticalTableParagraphOutlineLabel(flavor),
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    rows: [defaultVerticalTableRowSingle()],
    bottomText: '',
    showBottomText: false,
    answerRequired: true,
  })
}

export function cloneVerticalTableParagraph(source: VerticalTableParagraph, newId: string): VerticalTableParagraph {
  const n = normalizeVerticalTableParagraph(source)
  return {
    ...n,
    id: newId,
    rows: n.rows.map(r => {
      if (r.stageCount === 2) {
        const out: VerticalTableRow = {
          stageCount: 2,
          headers: [...r.headers] as [string, string],
          cells: [...r.cells] as [string, string],
        }
        if (r.placeholderHints) {
          out.placeholderHints = [...r.placeholderHints] as [string, string]
        }
        if (r.dateTimeStage1Time !== undefined) {
          out.dateTimeStage1Time = r.dateTimeStage1Time
        }
        return out
      }
      const out1: VerticalTableRow = {
        stageCount: 1,
        headers: [...r.headers] as [string],
        cells: [...r.cells] as [string],
      }
      if (r.placeholderHints) {
        out1.placeholderHints = [...r.placeholderHints] as [string]
      }
      return out1
    }),
  }
}

export function verticalTableAddRow(p: VerticalTableParagraph): VerticalTableParagraph {
  const n = normalizeVerticalTableParagraph(p)
  return {
    ...n,
    rows: [...n.rows, defaultVerticalTableRowSingle()],
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
export function verticalTableRowWithStageCount(row: VerticalTableRow, stageCount: 1 | 2): VerticalTableRow {
  const base = normalizeVerticalTableRow(row)
  const h0 = base.headers[0] ?? ''
  const c0 = base.cells[0] ?? ''
  const ph0 = base.placeholderHints?.[0]
  const ph1 = base.placeholderHints?.[1]
  if (stageCount === 1) {
    const r: VerticalTableRow = { stageCount: 1, headers: [h0], cells: [c0] }
    if (ph0 !== undefined || ph1 !== undefined || base.placeholderHints != null) {
      r.placeholderHints = [ph0 ?? '']
    }
    return r
  }
  if (base.stageCount === 2) {
    const r: VerticalTableRow = {
      stageCount: 2,
      headers: [h0, base.headers[1] ?? ''],
      cells: [c0, base.cells[1] ?? ''],
    }
    if (ph0 !== undefined || ph1 !== undefined || base.placeholderHints != null) {
      r.placeholderHints = [ph0 ?? '', ph1 ?? '']
    }
    if (base.dateTimeStage1Time !== undefined) {
      r.dateTimeStage1Time = base.dateTimeStage1Time
    }
    return r
  }
  const r: VerticalTableRow = {
    stageCount: 2,
    headers: [h0, ''],
    cells: [c0, ''],
    dateTimeStage1Time: '',
  }
  if (ph0 !== undefined || ph1 !== undefined || base.placeholderHints != null) {
    r.placeholderHints = [ph0 ?? '', '']
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
  | AgreementRichTextParagraph
  | AgreementExplanationTextParagraph
  | AgreementPrivacyRowsParagraph
  | AgreementTableConsentParagraph
  | HorizontalTableParagraph
  | VerticalTableParagraph
  | ClosingParagraph

export interface WritingFormDraft {
  schemaVersion: 1
  formSettings: WritingFormSettings
  /** 설문·동의: 0 제목형, 1–3 중간(DnD), 4 마무리. 테이블 가로형: 가로형 단락만(1개 이상, DnD) */
  paragraphs: WritingFormParagraph[]
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

export function paragraphsAreOnlyTableLayoutParagraphs(paragraphs: WritingFormParagraph[]): boolean {
  return paragraphs.length > 0 && paragraphs.every(isTableLayoutParagraph)
}

/** 직접 등록 — 신규 동의 양식 기본 단락 id */
export const DEFAULT_DIRECT_AGREEMENT_PARAGRAPH_IDS = {
  title: 'agreement-direct-paragraph-title',
  explanationText: 'agreement-direct-paragraph-explanation-text',
  privacy: 'agreement-direct-paragraph-privacy',
  table: 'agreement-direct-paragraph-table',
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
        showWritingPeriodOnForm: true,
      },
      {
        id: DEFAULT_DIRECT_AGREEMENT_PARAGRAPH_IDS.explanationText,
        kind: 'single_item',
        variant: 'agreement_explanation_text',
        requiredMark: true,
        paragraphTitle: '',
        paragraphDescription: '',
        participatesInTitleNumbering: true,
        bodyPlaceholder: '텍스트를 작성해 주세요',
        bodyText: '',
        answerRequired: true,
      },
      {
        id: DEFAULT_DIRECT_AGREEMENT_PARAGRAPH_IDS.privacy,
        kind: 'single_item',
        variant: 'agreement_privacy_rows',
        requiredMark: true,
        paragraphTitle: '',
        paragraphDescription: '',
        participatesInTitleNumbering: true,
        rows: [
          {
            id: 'agreement-privacy-row-1',
            label: '수집하는 개인정보 항목',
            placeholder: 'ex) 이름, 연락처',
          },
          {
            id: 'agreement-privacy-row-2',
            label: '수집 및 이용 목적',
            placeholder: 'ex) 이벤트 진행 및 당첨자 안내',
          },
          {
            id: 'agreement-privacy-row-3',
            label: '보유 및 이용 기간',
            placeholder: 'ex) 회원 탈퇴 후 1개월 또는 개인정보수집 동의일로부터 5년',
          },
        ],
      },
      {
        id: DEFAULT_DIRECT_AGREEMENT_PARAGRAPH_IDS.table,
        kind: 'single_item',
        variant: 'agreement_table_consent',
        requiredMark: true,
        paragraphTitle: '',
        paragraphDescription: '',
        participatesInTitleNumbering: true,
        headerValues: ['', '', ''],
        cellValues: ['', '', ''],
        footerDescription: '',
        selectedPreviewConsent: 'agree',
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
        showAgreementFooter: true,
      },
    ],
  }
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
        paragraphTitle: '테이블_가로형',
        paragraphDescription: '',
        participatesInTitleNumbering: true,
        tableFlavor: 'text',
        columnHeaders: ['', '', ''],
        dataRows: [['', '', '']],
        columnFields: [],
        fieldDataRows: [],
        bottomText: '',
        showBottomText: false,
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
        showWritingPeriodOnForm: true,
      },
      {
        id: DEFAULT_SURVEY_PARAGRAPH_IDS.user,
        kind: 'single_item',
        variant: 'user_profile',
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

/** 중간 3단락(인덱스 1–3)만 재정렬 */
export function reorderWritingFormMiddleParagraphs(
  paragraphs: WritingFormParagraph[],
  activeId: string,
  overId: string
): WritingFormParagraph[] {
  if (paragraphs.length !== 5) return paragraphs
  const head = paragraphs[0]
  const tail = paragraphs[4]
  const middle = paragraphs.slice(1, 4)
  const ids = middle.map(p => p.id)
  const oldIndex = ids.indexOf(activeId)
  const newIndex = ids.indexOf(overId)
  if (oldIndex < 0 || newIndex < 0) return paragraphs
  const nextMiddle = [...middle]
  const [removed] = nextMiddle.splice(oldIndex, 1)
  nextMiddle.splice(newIndex, 0, removed)
  return [head, ...nextMiddle, tail]
}

export function writingOutlineLabel(p: WritingFormParagraph): string {
  if (p.kind === 'description' && p.variant === 'survey_title_with_period') {
    const t = p.surveyTitle.trim()
    return t || '타이틀을 입력해 주세요'
  }
  if (p.kind === 'description' && p.variant === 'closing') {
    const t = p.body.trim().slice(0, 24)
    return t || '마무리글 없음'
  }
  if (p.kind === 'single_item' && p.variant === 'horizontal_table') {
    const t = p.paragraphTitle.trim()
    return t || '테이블_가로형'
  }
  if (p.kind === 'single_item' && p.variant === 'vertical_table') {
    const t = p.paragraphTitle.trim()
    if (t) return t
    const vt = normalizeVerticalTableParagraph(p as VerticalTableParagraph)
    return verticalTableParagraphOutlineLabel(vt.verticalTableFlavor)
  }
  const t = p.paragraphTitle.trim()
  return t || '타이틀을 입력해 주세요'
}
