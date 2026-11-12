/** 등록 위저드 모집 폼 「면접 유무」 — overlay/RHF가 `'yes' | 'no'` 또는 boolean 일 수 있다. */

export function isRecruitInterviewRequiredOff(value: unknown): boolean {
  return value === 'no' || value === false
}

/** 「면접 있음」을 고른 경우만. 미설정(`''`·null)은 미선택이다(QA-0121). */
export function isRecruitInterviewRequiredOn(value: unknown): boolean {
  return value === 'yes' || value === true
}

/** 면접 유무 라디오 표시값 — 미설정이면 `''`(미선택) */
export function recruitInterviewRequiredRadioValue(value: unknown): 'yes' | 'no' | '' {
  if (isRecruitInterviewRequiredOn(value)) return 'yes'
  if (isRecruitInterviewRequiredOff(value)) return 'no'
  return ''
}
