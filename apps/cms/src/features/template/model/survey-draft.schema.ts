/** 우측 '타이틀 번호' — 저장값; 화면 접두는 `survey-title-numbering`에서 파생 */
export type SurveyTitleNumberingStyle = 'numeric' | 'alpha' | 'q_repeat' | 'q123' | 'none'

export type SurveyPeriodMode = 'immediate' | 'custom'

export interface SurveyFormSettings {
  titleNumbering: SurveyTitleNumberingStyle
}

/** 번호 매김 대상(설문 제목·마무리 제외) */
export interface SurveyParagraphBase {
  id: string
  /** 카드 제목 옆 필수 표시(*) */
  requiredMark: boolean
  /** 카드/아웃라인용 원문 타이틀(번호 접두 없음) */
  paragraphTitle: string
  /** 단락 설명 placeholder 대응 */
  paragraphDescription: string
  participatesInTitleNumbering: boolean
}

/** 설명글 제목형 — 추가 시 항상 필수(카드·검증 기준) */
export interface SurveyDescriptionTitleWithPeriodParagraph extends Omit<
  SurveyParagraphBase,
  'requiredMark'
> {
  kind: 'description'
  variant: 'survey_title_with_period'
  requiredMark: true
  surveyTitle: string
  surveyDescription: string
  periodMode: SurveyPeriodMode
  startAt: string | null
  endAt: string | null
  showWritingPeriodOnForm: boolean
}

export interface SurveyUserProfileField {
  key: string
  label: string
  enabled: boolean
  required: boolean
}

export interface SurveyUserProfileParagraph extends SurveyParagraphBase {
  kind: 'single_item'
  variant: 'user_profile'
  fields: SurveyUserProfileField[]
}

export interface SurveyScoreSelectParagraph extends SurveyParagraphBase {
  kind: 'single_item'
  variant: 'score_select'
  scaleMin: number
  scaleMax: number
  /** 척도 끝 라벨 등 — 키는 문자열 숫자 */
  scaleLabels: Record<string, string>
  selectedPreviewValue: number | null
}

export interface SurveySubjectiveItem {
  id: string
  placeholder: string
}

export interface SurveySubjectiveParagraph extends SurveyParagraphBase {
  kind: 'single_item'
  variant: 'subjective'
  items: SurveySubjectiveItem[]
}

export interface SurveyClosingParagraph extends SurveyParagraphBase {
  kind: 'description'
  variant: 'closing'
  body: string
}

export type SurveyParagraph =
  | SurveyDescriptionTitleWithPeriodParagraph
  | SurveyUserProfileParagraph
  | SurveyScoreSelectParagraph
  | SurveySubjectiveParagraph
  | SurveyClosingParagraph

export interface SurveyDraft {
  schemaVersion: 1
  formSettings: SurveyFormSettings
  /** 인덱스 0: 제목형(고정), 1–3: 중간(순서 변경 가능), 4: 마무리(고정) */
  paragraphs: SurveyParagraph[]
}

const DEFAULT_USER_FIELDS: SurveyUserProfileField[] = [
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

export function createDefaultSurveyDraft(): SurveyDraft {
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
export function reorderSurveyMiddleParagraphs(
  paragraphs: SurveyParagraph[],
  activeId: string,
  overId: string
): SurveyParagraph[] {
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

export function surveyOutlineLabel(p: SurveyParagraph): string {
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
