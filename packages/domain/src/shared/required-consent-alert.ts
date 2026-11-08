/** 필수 동의 항목 미동의 시 알림 모달 제목 */
export const REQUIRED_CONSENT_DISAGREE_ALERT_TITLE = '필수 동의 항목 안내'

/**
 * 필수 동의 항목에 미동의한 경우 팝업 본문.
 * - 단건: `{항목}에 동의하지 않을 경우, 가입이 불가합니다.`
 * - 다건: `{항목1}, {항목2}에 동의하지 않을 경우, 가입이 불가합니다.`
 */
export function buildRequiredConsentDisagreeAlertMessage(labels: readonly string[]): string {
  const cleaned = labels.map(label => label.trim()).filter(label => label.length > 0)
  if (cleaned.length === 0) {
    return '필수 동의 항목에 동의하지 않을 경우, 가입이 불가합니다.'
  }
  return `${cleaned.join(', ')}에 동의하지 않을 경우, 가입이 불가합니다.`
}

export type ConsentAgreeValue = 'agree' | 'disagree'

export type RequiredConsentFieldSpec<TKey extends string = string> = {
  key: TKey
  label: string
}

/** 필수 동의 필드 중 `agree`가 아닌 항목의 라벨 목록 (명시적 `disagree`만, 미선택은 제외) */
export function collectDisagreedRequiredConsentLabels<TKey extends string>(
  values: Partial<Record<TKey, ConsentAgreeValue | boolean | null | undefined>>,
  requiredFields: readonly RequiredConsentFieldSpec<TKey>[]
): string[] {
  return requiredFields
    .filter(field => {
      const value = values[field.key]
      if (value === true || value === 'agree') return false
      if (value === false || value === 'disagree') return true
      return false
    })
    .map(field => field.label)
}

/** 약관·동의 라디오 미선택 여부 (`agree`/`disagree` 모두 아님) */
/** 서버 `consentStatus` — 초상권 등 부분동의 */
export function isPartialConsentStatus(value: string | null | undefined): boolean {
  return (value ?? '').trim().toUpperCase() === 'PARTIAL'
}

/** 기획 표기 — 띄어 씀 */
export const PARTIAL_CONSENT_DISPLAY_LABEL = '부분 동의'

/** 기간제 동의서 유효기간 경과 표시 (약관 개정 재동의에는 쓰지 않는다) */
export const EXPIRED_CONSENT_DISPLAY_LABEL = '동의 만료'

/**
 * 동의 상태 표시. `expired`이면 다른 상태와 관계없이 「동의 만료」를 쓴다.
 * 기간제 동의서 여부는 호출부가 판단해 `expired`를 넘긴다.
 * 그 외에는 `PARTIAL`이면 동의/미동의보다 부분 동의를 우선한다.
 * 단, 초상권(`PARTIAL`)을 동의했고 서버 `allItemsAgreed === true`(1·2·3번 모두 동의)이면 동의 라벨을 쓴다.
 * `allItemsAgreed`가 false/null이면 기존 표시를 유지한다(표시 전용 — 참여 게이트는 `programEligible`).
 */
export function resolveConsentStatusDisplayLabel(options: {
  agreed: boolean
  consentStatus?: string | null
  /** 초상권 전용 응답 필드. 비초상권·원본 없는 과거 기록은 null */
  allItemsAgreed?: boolean | null
  /** 기간제 동의서 유효기간 경과. 기간제가 아닌 항목은 넘기지 않는다 */
  expired?: boolean
  agreedLabel: string
  disagreedLabel?: string
}): string {
  if (options.expired === true) return EXPIRED_CONSENT_DISPLAY_LABEL
  if (isPartialConsentStatus(options.consentStatus)) {
    if (options.agreed && options.allItemsAgreed === true) return options.agreedLabel
    return PARTIAL_CONSENT_DISPLAY_LABEL
  }
  return options.agreed ? options.agreedLabel : (options.disagreedLabel ?? '미동의')
}

export function hasUnsetConsentSelections<TKey extends string>(
  values: Partial<Record<TKey, ConsentAgreeValue | boolean | null | undefined>>,
  keys: readonly TKey[]
): boolean {
  return keys.some(key => {
    const value = values[key]
    return value !== 'agree' && value !== 'disagree'
  })
}
