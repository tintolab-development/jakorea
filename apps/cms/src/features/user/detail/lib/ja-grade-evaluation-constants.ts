export const JA_GRADE_EVALUATION_STORAGE_KEY = 'cms.ja-grade-evaluation.v1'

/** 일정 취소/변경·강의보고서 미준수 건당 감점 (BE 잠정 계약) */
export const JA_GRADE_PENALTY_PER_EVENT = 5

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
