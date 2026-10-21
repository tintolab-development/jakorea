/** UJAT 등록 DEV 자동입력 — 정상 등록 프리셋 6종. Negative 케이스는 테스트에서만 만든다. */
export type UjatDevAutofillCaseId = 'REG-01' | 'REG-02' | 'REG-03' | 'REG-04' | 'REG-05' | 'REG-06'

export const UJAT_DEV_AUTOFILL_CASE_IDS: readonly UjatDevAutofillCaseId[] = [
  'REG-01',
  'REG-02',
  'REG-03',
  'REG-04',
  'REG-05',
  'REG-06',
]

export const UJAT_DEV_AUTOFILL_CASE_LABELS: Record<UjatDevAutofillCaseId, string> = {
  'REG-01': 'REG-01 · 기본형',
  'REG-02': 'REG-02 · 반기 독립형',
  'REG-03': 'REG-03 · 공고 설정형',
  'REG-04': 'REG-04 · 교육 일정 예외형',
  'REG-05': 'REG-05 · 사전교육 분기형',
  'REG-06': 'REG-06 · 전체 입력형',
}

export const UJAT_DEV_AUTOFILL_CASE_DESCRIPTIONS: Record<UjatDevAutofillCaseId, string> = {
  'REG-01': '가장 단순한 정상 등록, 양 반기 모두 유효',
  'REG-02': 'H1/H2 모집·운영·면접 기간 서로 다름',
  'REG-03': '하반기 공고 D-7 노출, 기관/H1/H2 게시',
  'REG-04': '복수 금요일, 반기별 불가일·공휴일 제외 조합',
  'REG-05': 'H1 JA 진행 / H2 강사 섭외, 교육 형태 차이',
  'REG-06': '활성 지역·정원·복수 일정·동적 신청 배열 최대 범위',
}

export const UJAT_DEV_AUTOFILL_DEFAULT_CASE_ID: UjatDevAutofillCaseId = 'REG-01'

export function isUjatDevAutofillCaseId(value: unknown): value is UjatDevAutofillCaseId {
  return (
    typeof value === 'string' &&
    (UJAT_DEV_AUTOFILL_CASE_IDS as readonly string[]).includes(value)
  )
}

/** 사업 연도 첫 모집 시작일(1/4) — 이 날짜가 지났으면 다음 연도를 기본으로 쓴다. */
export const UJAT_DEV_AUTOFILL_FIRST_RECRUIT_MONTH_DAY = '01-04'

export function resolveUjatDevAutofillDefaultBusinessYear(referenceNow: Date = new Date()): number {
  const year = referenceNow.getFullYear()
  const firstRecruit = new Date(`${year}-${UJAT_DEV_AUTOFILL_FIRST_RECRUIT_MONTH_DAY}T00:00:00`)
  return referenceNow.getTime() < firstRecruit.getTime() ? year : year + 1
}
