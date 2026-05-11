/** UJAT 프로그램 등록 폼 — 학년 별 수업 시간 단락 id */
export const UJAT_REGISTRATION_GRADE_WISE_CLASS_TIME_ID = 'ujat-reg-grade-wise-class-time' as const

/** UJAT 프로그램 등록 폼 — 단락 id (시드 단락·네비와 동일) */
export const UJAT_REGISTRATION_SECTION_IDS = [
  'ujat-reg-basic',
  'ujat-reg-business-kpi',
  'ujat-reg-payment',
  'ujat-reg-first-half-education-schedule',
  'ujat-reg-second-half-education-schedule',
  'ujat-reg-education-schedule-settings',
  'ujat-reg-education-class-capacity-by-region',
  UJAT_REGISTRATION_GRADE_WISE_CLASS_TIME_ID,
] as const

export type UjatRegistrationSectionId = (typeof UJAT_REGISTRATION_SECTION_IDS)[number]

export const UJAT_REGISTRATION_SECTION_LABELS: Record<UjatRegistrationSectionId, string> = {
  'ujat-reg-basic': '기본 정보',
  'ujat-reg-business-kpi': '사업 KPI 목표',
  'ujat-reg-payment': '입금 정보',
  'ujat-reg-first-half-education-schedule': '상반기 교육 일정',
  'ujat-reg-second-half-education-schedule': '하반기 교육 일정',
  'ujat-reg-education-schedule-settings': '교육 진행 일정 설정',
  'ujat-reg-education-class-capacity-by-region': '지역 별 교육 진행 가능 학급 수',
  [UJAT_REGISTRATION_GRADE_WISE_CLASS_TIME_ID]: '학년 별 수업 시간',
}
