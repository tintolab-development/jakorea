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

/** 캔버스에서 선택된 테이블 행(헤더 행 vs 데이터 행) — 우측 커스텀 필드와 동기화 */
export type HorizontalTableRowSelection =
  | { area: 'header' }
  | { area: 'body'; row: number }

/** 작성 양식 — 테이블 가로형(가변 행·열, 각 dataRows[i] 길이는 columnHeaders와 동일) */
export interface HorizontalTableParagraph extends WritingFormParagraphBase {
  kind: 'single_item'
  variant: 'horizontal_table'
  columnHeaders: string[]
  dataRows: string[][]
  bottomText: string
  showBottomText: boolean
  answerRequired: boolean
}

/** 행 추가: 데이터 영역 **최하단**에 가로 한 줄(새 행)을 붙인다. */
export function horizontalTableAddRow(p: HorizontalTableParagraph): HorizontalTableParagraph {
  const colCount = Math.max(1, p.columnHeaders.length)
  const normalizedRows = p.dataRows.map(r => {
    const row = [...r]
    while (row.length < colCount) row.push('')
    return row.slice(0, colCount)
  })
  const newRow = Array.from({ length: colCount }, () => '')
  return { ...p, dataRows: [...normalizedRows, newRow] }
}

/** 열 추가: 헤더·각 행의 **가장 우측**에 세로 한 줄(새 열)을 붙인다. */
export function horizontalTableAddColumn(p: HorizontalTableParagraph): HorizontalTableParagraph {
  const colCount = Math.max(1, p.columnHeaders.length)
  const normalizedRows = p.dataRows.map(r => {
    const row = [...r]
    while (row.length < colCount) row.push('')
    return row.slice(0, colCount)
  })
  const nextHeaders = [...p.columnHeaders, '']
  const nextWidth = nextHeaders.length
  const nextRows =
    normalizedRows.length > 0
      ? normalizedRows.map(r => [...r, ''])
      : [Array.from({ length: nextWidth }, () => '')]
  return { ...p, columnHeaders: nextHeaders, dataRows: nextRows }
}

/** 새 테이블 가로형 단락(중간 영역 추가·복제 시 사용) */
export function createHorizontalTableParagraph(id: string): HorizontalTableParagraph {
  return {
    id,
    kind: 'single_item',
    variant: 'horizontal_table',
    requiredMark: true,
    paragraphTitle: '테이블_가로형',
    paragraphDescription: '',
    participatesInTitleNumbering: true,
    columnHeaders: ['', '', ''],
    dataRows: [['', '', '']],
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
  }
}

/** 열 삭제: 헤더·각 행에서 해당 인덱스 제거. 열이 1개뿐이면 `null`. */
export function horizontalTableRemoveColumn(
  p: HorizontalTableParagraph,
  columnIndex: number
): HorizontalTableParagraph | null {
  const colCount = Math.max(1, p.columnHeaders.length)
  if (colCount <= 1) return null
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
  return { ...p, columnHeaders: nextHeaders, dataRows: nextRows }
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
  return { ...p, dataRows: rows.filter((_, i) => i !== rowIndex) }
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
  | ClosingParagraph

export interface WritingFormDraft {
  schemaVersion: 1
  formSettings: WritingFormSettings
  /** 설문·동의: 0 제목형, 1–3 중간(DnD), 4 마무리. 테이블 가로형: 0 제목형, 1 표, 2 마무리 */
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

/** 직접 등록 — 테이블 가로형 기본 단락 id */
export const DEFAULT_HORIZONTAL_TABLE_PARAGRAPH_IDS = {
  title: 'horizontal-table-paragraph-title',
  table: 'horizontal-table-paragraph-table',
  closing: 'horizontal-table-paragraph-closing',
} as const

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
        id: DEFAULT_HORIZONTAL_TABLE_PARAGRAPH_IDS.title,
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
        id: DEFAULT_HORIZONTAL_TABLE_PARAGRAPH_IDS.table,
        kind: 'single_item',
        variant: 'horizontal_table',
        requiredMark: true,
        paragraphTitle: '테이블_가로형',
        paragraphDescription: '',
        participatesInTitleNumbering: true,
        columnHeaders: ['', '', ''],
        dataRows: [['', '', '']],
        bottomText: '',
        showBottomText: false,
        answerRequired: true,
      },
      {
        id: DEFAULT_HORIZONTAL_TABLE_PARAGRAPH_IDS.closing,
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
  const t = p.paragraphTitle.trim()
  return t || '타이틀을 입력해 주세요'
}
