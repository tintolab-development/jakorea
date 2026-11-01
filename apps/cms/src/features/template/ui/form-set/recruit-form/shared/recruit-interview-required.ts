/** 등록 위저드 모집 폼 「면접 유무」 — overlay/RHF가 `'yes' | 'no'` 또는 boolean 일 수 있다. */

export function isRecruitInterviewRequiredOff(value: unknown): boolean {
  return value === 'no' || value === false
}

/** 기본(미설정)은 면접 있음. */
export function isRecruitInterviewRequiredOn(value: unknown): boolean {
  return !isRecruitInterviewRequiredOff(value)
}
