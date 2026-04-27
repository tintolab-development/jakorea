/** 설문·동의 직접 등록 에디터 공통 — 에디터 문맥(직렬화 키와 무관) */
export type FormEditorKind = 'survey' | 'agreement'

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

/** 동의서 일반 본문(카드 타이틀/설명 + 본문 영역) */
export interface AgreementRichTextParagraph extends WritingFormParagraphBase {
  kind: 'single_item'
  variant: 'agreement_rich_text'
  answerRequired?: boolean
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
  answerRequired?: boolean
  rows: AgreementPrivacyRow[]
}

/** 표 형 고지 + 동의/비동의 라디오(미리보기) */
export interface AgreementTableConsentParagraph extends WritingFormParagraphBase {
  kind: 'single_item'
  variant: 'agreement_table_consent'
  answerRequired?: boolean
  headerValues: [string, string, string]
  cellValues: [string, string, string]
  footerDescription: string
  selectedPreviewConsent: 'agree' | 'disagree'
}

/** 단일 항목 미리보기 전용(추후 스키마 정리 시 통합 가능) */
export type ShortEssayParagraph = WritingFormParagraphBase & {
  kind: 'single_item'
  variant: 'short_essay'
  answerRequired?: boolean
  showItemTitle?: boolean
}

export type MultipleChoiceParagraph = WritingFormParagraphBase & {
  kind: 'single_item'
  variant: 'multiple_choice'
  answerRequired?: boolean
}

export type DropdownParagraph = WritingFormParagraphBase & {
  kind: 'single_item'
  variant: 'dropdown'
  answerRequired?: boolean
}

export type DateTimeParagraph = WritingFormParagraphBase & {
  kind: 'single_item'
  variant: 'date_time'
  answerRequired?: boolean
}

export type StarRateParagraph = WritingFormParagraphBase & {
  kind: 'single_item'
  variant: 'star_rate'
  answerRequired?: boolean
}

export type ScaleTypeParagraph = WritingFormParagraphBase & {
  kind: 'single_item'
  variant: 'scale_type'
  answerRequired?: boolean
}

export type UserInfoParagraph = WritingFormParagraphBase & {
  kind: 'single_item'
  variant: 'user_info'
  answerRequired?: boolean
}

export type FileAttachmentParagraph = WritingFormParagraphBase & {
  kind: 'single_item'
  variant: 'file_attachment'
  answerRequired?: boolean
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
  | ShortEssayParagraph
  | MultipleChoiceParagraph
  | DropdownParagraph
  | DateTimeParagraph
  | StarRateParagraph
  | ScaleTypeParagraph
  | UserInfoParagraph
  | FileAttachmentParagraph
  | ClosingParagraph

export interface WritingFormDraft {
  schemaVersion: 1
  formSettings: WritingFormSettings
  /** 인덱스 0: 제목형(고정), 1–3: 중간(순서 변경 가능), 4: 마무리(고정) */
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

/** 첫·마지막 단락 고정, 사이 middle만 재정렬 */
export function reorderHeadMiddleTail(
  paragraphs: WritingFormParagraph[],
  activeId: string,
  overId: string
): WritingFormParagraph[] {
  if (paragraphs.length < 3) return paragraphs
  const head = paragraphs[0]!
  const tail = paragraphs[paragraphs.length - 1]!
  const middle = paragraphs.slice(1, -1)
  const ids = middle.map(p => p.id)
  const oldIndex = ids.indexOf(activeId)
  const newIndex = ids.indexOf(overId)
  if (oldIndex < 0 || newIndex < 0) return paragraphs
  const nextMiddle = [...middle]
  const [removed] = nextMiddle.splice(oldIndex, 1)
  nextMiddle.splice(newIndex, 0, removed)
  return [head, ...nextMiddle, tail]
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

/** 기본 설문 5단락(인덱스 1–3 middle)만 재정렬 */
export function reorderWritingFormMiddleParagraphs(
  paragraphs: WritingFormParagraph[],
  activeId: string,
  overId: string
): WritingFormParagraph[] {
  if (paragraphs.length !== 5) return paragraphs
  return reorderHeadMiddleTail(paragraphs, activeId, overId)
}

/** `FormTestSingleItemFullpageModal` — 제목·8종 단일항목 스텁·마무리 */
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
      id: 'date-time',
      kind: 'single_item',
      variant: 'date_time',
      answerRequired: true,
      requiredMark: true,
      paragraphTitle: '날짜/시간형',
      paragraphDescription: '',
      participatesInTitleNumbering: true,
    },
    {
      id: 'star-rate',
      kind: 'single_item',
      variant: 'star_rate',
      answerRequired: true,
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
  if (p.kind === 'description' && p.variant === 'closing') {
    const t = p.body.trim().slice(0, 24)
    return t || '마무리글 없음'
  }
  const t = p.paragraphTitle.trim()
  return t || '타이틀을 입력해 주세요'
}
