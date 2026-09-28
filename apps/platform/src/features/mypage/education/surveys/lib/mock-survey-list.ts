export type EducationSurveyListStatus = 'in_progress' | 'submitted'

export type EducationSurveyListEntry = {
  id: string
  /** 목록·본문 헤더 제목 */
  title: string
  status: EducationSurveyListStatus
  description?: string
  /** YYYY-MM-DD — 작성 기간 시작 */
  startAt?: string
  /** YYYY-MM-DD — 작성 기간 종료 */
  endAt?: string
  /** ISO — immediate 시작일 폴백 */
  createdAt?: string
}

export type EducationSurveySeedKind = 'survey' | 'satisfaction'

/** 설문조사 — 1건 (목록 UI 없이 본문만) */
const SURVEY_MOCK_LIST: EducationSurveyListEntry[] = [
  {
    id: 'survey-mock-1',
    title: '2026년 개선방향을 위한 설문조사',
    status: 'in_progress',
    description: 'JA Korea의 성장을 위해 회원님의 소중한 의견을 보내주세요.',
    startAt: '2026-06-05',
    endAt: '2026-06-12',
    createdAt: '2026-06-05',
  },
]

/** 만족도조사 — 다건 (좌측 목록 + 우측 본문) */
const SATISFACTION_MOCK_LIST: EducationSurveyListEntry[] = [
  {
    id: 'satisfaction-mock-1',
    title: '2026년 개선방향을 위한 만족도조사',
    status: 'in_progress',
    description: 'JA Korea의 성장을 위해 회원님의 소중한 의견을 보내주세요.',
    startAt: '2026-06-05',
    endAt: '2026-06-12',
    createdAt: '2026-06-05',
  },
  {
    id: 'satisfaction-mock-2',
    title: '만족도조사 2',
    status: 'submitted',
    startAt: '2026-05-01',
    endAt: '2026-05-15',
    createdAt: '2026-05-01',
  },
  {
    id: 'satisfaction-mock-3',
    title: '만족도조사 3',
    status: 'submitted',
    startAt: '2026-04-01',
    endAt: '2026-04-10',
    createdAt: '2026-04-01',
  },
]

/** 교육현황 mock — 설문 1건 / 만족도 다건 */
export function getMockEducationSurveyList(
  kind: EducationSurveySeedKind,
): EducationSurveyListEntry[] {
  return kind === 'satisfaction' ? SATISFACTION_MOCK_LIST : SURVEY_MOCK_LIST
}

export function educationSurveyListStatusLabel(status: EducationSurveyListStatus): string {
  return status === 'in_progress' ? '진행중' : '제출완료'
}
