export const JA_GRADE_EVALUATION_STORAGE_KEY = 'cms.ja-grade-evaluation.v1'

/** 행정 감점 — 항목별 2회당 -5점 (floor(건수/2) × -5). 정산신청 기한은 대상 아님 */
export const JA_GRADE_PENALTY_PER_PAIR = 5

/** GET policyReady=false · POST 409 INSTRUCTOR_JA_GRADE_POLICY_NOT_INITIALIZED */
export const JA_GRADE_POLICY_NOT_READY_MESSAGE =
  'JA 강사 등급 정책이 설정되지 않았습니다. 관리자에게 문의해 주세요.'

export const JA_GRADE_PARAGRAPH_IDS = {
  intro: 'ja-grade-intro',
  q1: 'ja-grade-q1',
  q2: 'ja-grade-q2',
  q3: 'ja-grade-q3',
  q4: 'ja-grade-q4',
  q5: 'ja-grade-q5',
  closing: 'ja-grade-closing',
} as const

export const JA_GRADE_SCALE_QUESTION_IDS = [
  JA_GRADE_PARAGRAPH_IDS.q1,
  JA_GRADE_PARAGRAPH_IDS.q2,
  JA_GRADE_PARAGRAPH_IDS.q3,
  JA_GRADE_PARAGRAPH_IDS.q4,
] as const
