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

/** 필수 동의 필드 중 `agree`가 아닌 항목의 라벨 목록 (미선택·명시적 `disagree` 포함) */
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
export function hasUnsetConsentSelections<TKey extends string>(
  values: Partial<Record<TKey, ConsentAgreeValue | boolean | null | undefined>>,
  keys: readonly TKey[]
): boolean {
  return keys.some(key => {
    const value = values[key]
    return value !== 'agree' && value !== 'disagree'
  })
}
