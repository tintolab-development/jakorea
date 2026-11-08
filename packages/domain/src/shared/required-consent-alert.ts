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

export const PARTIAL_CONSENT_DISPLAY_LABEL = '부분동의'

export const PORTRAIT_RIGHTS_CONSENT_TYPE = 'PORTRAIT_RIGHTS'

export function isPortraitRightsConsentType(value: string | null | undefined): boolean {
  return (value ?? '').trim().toUpperCase() === PORTRAIT_RIGHTS_CONSENT_TYPE
}

/**
 * 동의 상태 표시 라벨.
 *
 * 초상권(`PORTRAIT_RIGHTS`)은 동의 시 `consentStatus`가 항상 `PARTIAL`이라 그 값으로 전체/부분을 구분할 수 없다.
 * 서버 응답 전용 `allItemsAgreed`(1·2·3번 모두 agree 여부, 제출 시점 스냅샷)로만 판정한다.
 * - 미동의·철회(`agreed=false` 또는 `DISAGREED`) → 기존 미동의 라벨
 * - `allItemsAgreed === false` → 부분동의
 * - `true` 또는 `null`/생략(판정 불가 과거 기록·구버전 BE) → 동의 라벨
 * 참여 가능 여부는 `programEligible`만 쓴다. 이 함수는 라벨만 정한다.
 *
 * 그 외 유형은 기존대로 `PARTIAL`이면 부분동의를 우선한다.
 */
export function resolveConsentStatusDisplayLabel(options: {
  agreed: boolean
  consentStatus?: string | null
  agreedLabel: string
  disagreedLabel?: string
  /** 서버 `consentType` — 초상권 분기 판단 */
  consentType?: string | null
  /** 서버 `allItemsAgreed` — 초상권에서만 의미. undefined와 null은 같게 다룬다 */
  allItemsAgreed?: boolean | null
}): string {
  const disagreedLabel = options.disagreedLabel ?? '미동의'
  if (isPortraitRightsConsentType(options.consentType)) {
    const disagreedStatus = (options.consentStatus ?? '').trim().toUpperCase() === 'DISAGREED'
    if (!options.agreed || disagreedStatus) return disagreedLabel
    if (options.allItemsAgreed === false) return PARTIAL_CONSENT_DISPLAY_LABEL
    return options.agreedLabel
  }
  if (isPartialConsentStatus(options.consentStatus)) return PARTIAL_CONSENT_DISPLAY_LABEL
  return options.agreed ? options.agreedLabel : disagreedLabel
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
