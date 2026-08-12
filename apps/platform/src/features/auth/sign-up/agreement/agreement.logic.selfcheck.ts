/**
 * Platform 가입 약관 — 필수 미동의 메시지·선택 미동의 허용 검증.
 * (node strip-types: extensionless 앱 import 체인을 피하고 domain 헬퍼를 직접 검증)
 */
import assert from 'node:assert/strict'
import {
  REQUIRED_CONSENT_DISAGREE_ALERT_TITLE,
  buildRequiredConsentDisagreeAlertMessage,
  collectDisagreedRequiredConsentLabels,
} from '@jakorea/domain/shared/required-consent-alert'

assert.equal(REQUIRED_CONSENT_DISAGREE_ALERT_TITLE, '필수 동의 항목 안내')

assert.equal(
  buildRequiredConsentDisagreeAlertMessage(['서비스 이용약관']),
  '서비스 이용약관에 동의하지 않을 경우, 가입이 불가합니다.',
)

assert.equal(
  buildRequiredConsentDisagreeAlertMessage([
    '서비스 이용약관',
    '개인정보 수집·이용 동의',
  ]),
  '서비스 이용약관, 개인정보 수집·이용 동의에 동의하지 않을 경우, 가입이 불가합니다.',
)

const requiredFields = [
  { key: 'service', label: '서비스 이용약관' },
  { key: 'privacy', label: '개인정보 수집·이용 동의' },
] as const

assert.deepEqual(
  collectDisagreedRequiredConsentLabels(
    { service: null, privacy: 'disagree' },
    [...requiredFields],
  ),
  ['서비스 이용약관', '개인정보 수집·이용 동의'],
)

assert.deepEqual(
  collectDisagreedRequiredConsentLabels(
    { service: 'agree', privacy: 'agree' },
    [...requiredFields],
  ),
  [],
)

console.log('agreement.logic.selfcheck: ok')
