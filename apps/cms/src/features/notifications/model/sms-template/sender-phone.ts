/**
 * 문자 발신번호 — BE Hub SMS 발신 SSOT (2026-09-11)
 * - upsert: `providerSenderPhoneNumber` = harvest Select만 (NHN 모드 필수)
 * - GET …/notification-sender-profiles?channelType=SMS
 * - 미입력 → 400 (BE: SMS template requires providerSenderPhoneNumber when NHN catalog is enabled)
 */

export function normalizeSmsSenderPhoneKey(phone: string): string {
  return phone.trim()
}

export function isHarvestedSmsSenderPhone(
  phone: string,
  harvestedSenderKeys: readonly string[]
): boolean {
  const key = normalizeSmsSenderPhoneKey(phone)
  if (!key) return false
  return harvestedSenderKeys.some(item => normalizeSmsSenderPhoneKey(item) === key)
}

export const SMS_SENDER_PHONE_REQUIRED_MESSAGE = '발신 번호를 선택하세요.'
export const SMS_SENDER_PHONE_NOT_REGISTERED_MESSAGE =
  'NHN에 등록된 발신 번호만 사용할 수 있습니다. 발신 프로필을 동기화한 뒤 다시 선택해 주세요.'
export const SMS_SENDER_PROFILES_EMPTY_MESSAGE =
  'NHN 발신 번호 프로필이 없습니다. 발신 프로필 동기화(sync) 후 다시 시도해 주세요.'
export const SMS_TEMPLATE_DELETE_REJECTED_BY_NHN_MESSAGE =
  'NHN에서 문자 템플릿 삭제가 거절되었습니다. 잠시 후 다시 시도하거나 NHN Console에서 확인해 주세요.'
export const SMS_CATEGORY_PARENT_NOT_LINKED_MESSAGE =
  '부모 카테고리가 NHN과 연결되어 있지 않습니다. 「동기화」를 먼저 실행하거나 루트부터 카테고리를 생성해 주세요.'

export type ValidateSmsSenderPhoneOptions = {
  /** GET sender-profiles(SMS) 의 senderKey 목록. 비어 있지 않으면 harvest 일치 필수 */
  harvestedSenderKeys?: readonly string[]
}

export function validateSmsSenderPhone(
  phone: string,
  options?: ValidateSmsSenderPhoneOptions
): string | null {
  const trimmed = normalizeSmsSenderPhoneKey(phone)
  if (!trimmed) return SMS_SENDER_PHONE_REQUIRED_MESSAGE

  const harvested = options?.harvestedSenderKeys
  if (harvested && harvested.length > 0) {
    if (!isHarvestedSmsSenderPhone(trimmed, harvested)) {
      return SMS_SENDER_PHONE_NOT_REGISTERED_MESSAGE
    }
  }
  return null
}
