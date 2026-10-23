import assert from 'node:assert/strict'
import { AxiosError } from 'axios'
import { platformQueryKeys } from '../../../../shared/api/query-keys.ts'
import {
  canWithdrawConsent,
  CONSENT_DOCUMENT_NOT_FOUND_MESSAGE,
  CONSENT_DRAFT_DOCUMENT_NOT_WITHDRAWABLE_MESSAGE,
  CONSENT_TYPE_INVALID_MESSAGE,
  CONSENT_TYPE_WITHDRAWAL_NOT_ALLOWED_MESSAGE,
  CONSENT_WITHDRAW_CONFLICT_MESSAGE,
  CONSENT_WITHDRAW_FAILED_MESSAGE,
  FIVE_POLICY_CONSENT_TYPES,
  isConsentWithdrawSuccess,
  isFivePolicyConsentType,
  parseConsentWithdrawError,
  resolveConsentWithdrawTarget,
  TYPE_WITHDRAWABLE_CONSENT_TYPES,
} from './consent-withdraw.ts'

assert.deepEqual(FIVE_POLICY_CONSENT_TYPES, [
  'PORTRAIT_RIGHTS',
  'PAYMENT_STATEMENT_CONSENT',
  'FACILITATOR_PLEDGE',
  'ADMINISTRATIVE_INFO_CONSENT',
  'CRIMINAL_HISTORY_CHECK_CONSENT',
])
assert.ok(TYPE_WITHDRAWABLE_CONSENT_TYPES.includes('CHILD_PRIVACY_COLLECTION'))
assert.equal(isFivePolicyConsentType('PAYMENT_STATEMENT_PRE_CONSENT'), false)
assert.equal(isFivePolicyConsentType('CHILD_PRIVACY_COLLECTION'), false)

for (const consentType of FIVE_POLICY_CONSENT_TYPES) {
  assert.equal(
    canWithdrawConsent({ withdrawable: true, status: 'AGREED' }),
    true,
    consentType,
  )
  assert.deepEqual(resolveConsentWithdrawTarget({ consentType }), {
    kind: 'type',
    consentType,
  })
  assert.deepEqual(resolveConsentWithdrawTarget({ consentType, documentId: 88 }), {
    kind: 'document',
    documentId: 88,
  })
}

assert.equal(
  canWithdrawConsent({
    withdrawable: true,
    status: 'AGREED',
    pending: true,
  }),
  false,
)
assert.equal(canWithdrawConsent({ withdrawable: true, status: 'WITHDRAWN' }), false)
assert.equal(canWithdrawConsent({ withdrawable: false, status: 'AGREED' }), false)
assert.equal(canWithdrawConsent({ withdrawable: true }), true)

assert.deepEqual(
  resolveConsentWithdrawTarget({
    consentType: 'PAYMENT_STATEMENT_PRE_CONSENT',
  }),
  { kind: 'type', consentType: 'PAYMENT_STATEMENT_CONSENT' },
)
assert.deepEqual(
  resolveConsentWithdrawTarget({ consentType: 'CHILD_PRIVACY_COLLECTION' }),
  { kind: 'type', consentType: 'CHILD_PRIVACY_COLLECTION' },
)
assert.equal(resolveConsentWithdrawTarget({ consentType: 'SERVICE_TERMS' }), null)
assert.deepEqual(
  resolveConsentWithdrawTarget({ consentType: 'FACILITATOR_PLEDGE', documentId: null }),
  resolveConsentWithdrawTarget({ consentType: 'FACILITATOR_PLEDGE' }),
)

assert.equal(isConsentWithdrawSuccess({ documentId: null, status: 'WITHDRAWN' }), true)
assert.equal(
  isConsentWithdrawSuccess({
    documentId: 12,
    consentType: 'FACILITATOR_PLEDGE',
    status: 'WITHDRAWN',
    changedAt: '2026-10-23T00:00:00Z',
  }),
  true,
)
assert.equal(isConsentWithdrawSuccess({}), true)
assert.equal(isConsentWithdrawSuccess(null), false)

function axiosError(status: number, code: string, message?: string) {
  return new AxiosError(
    'Request failed',
    String(status),
    undefined,
    undefined,
    {
      status,
      statusText: 'Error',
      headers: {},
      config: {} as never,
      data: { error: { code, message } },
    },
  )
}

assert.equal(
  parseConsentWithdrawError(axiosError(400, 'PORTAL_CONSENT_TYPE_INVALID')).message,
  CONSENT_TYPE_INVALID_MESSAGE,
)
assert.equal(
  parseConsentWithdrawError(axiosError(403, 'PORTAL_CONSENT_TYPE_WITHDRAWAL_NOT_ALLOWED'))
    .message,
  CONSENT_TYPE_WITHDRAWAL_NOT_ALLOWED_MESSAGE,
)

const fiveTypeNotAllowed = parseConsentWithdrawError(
  axiosError(409, 'PORTAL_CONSENT_WITHDRAWAL_NOT_ALLOWED'),
  'PORTRAIT_RIGHTS',
)
assert.equal(fiveTypeNotAllowed.backendRegression, true)
assert.equal(fiveTypeNotAllowed.message, CONSENT_WITHDRAW_FAILED_MESSAGE)

const draftError = parseConsentWithdrawError(
  axiosError(409, 'PORTAL_CONSENT_ONLY_SIGNED_DOCUMENT_WITHDRAWABLE', '우회하세요'),
)
assert.equal(draftError.message, CONSENT_DRAFT_DOCUMENT_NOT_WITHDRAWABLE_MESSAGE)
assert.equal(draftError.backendRegression, false)

assert.equal(
  parseConsentWithdrawError(axiosError(404, 'PORTAL_CONSENT_DOCUMENT_NOT_FOUND')).message,
  CONSENT_DOCUMENT_NOT_FOUND_MESSAGE,
)

const conflict = parseConsentWithdrawError(
  axiosError(409, 'PORTAL_CONSENT_WITHDRAWAL_CONFLICT'),
)
assert.equal(conflict.refetch, true)
assert.equal(conflict.message, CONSENT_WITHDRAW_CONFLICT_MESSAGE)

const portraitRegression = parseConsentWithdrawError(
  axiosError(
    409,
    'PORTAL_PORTRAIT_WITHDRAWAL_ACTIVE_PROGRAM_EXISTS',
    '진행 중인 프로그램 참여가 있어 초상권 동의만 단독으로 철회할 수 없습니다. 먼저 해당 프로그램의 활동 포기를 진행해 주세요.',
  ),
  'PORTRAIT_RIGHTS',
)
assert.equal(portraitRegression.backendRegression, true)
assert.equal(portraitRegression.message, CONSENT_WITHDRAW_FAILED_MESSAGE)
assert.equal(
  portraitRegression.message.includes('활동 포기'),
  false,
)

assert.deepEqual(platformQueryKeys.mypage.consents(), ['platform', 'mypage', 'consents'])
assert.deepEqual(platformQueryKeys.mypage.consent('FACILITATOR_PLEDGE'), [
  'platform',
  'mypage',
  'consents',
  'FACILITATOR_PLEDGE',
])

const nestedLegacy = parseConsentWithdrawError({
  isAxiosError: true,
  response: {
    status: 409,
    data: {
      error: {
        code: 'UNKNOWN',
        message:
          '진행 중인 프로그램 참여가 있어 초상권 동의만 단독으로 철회할 수 없습니다. 먼저 해당 프로그램의 활동 포기를 진행해 주세요.',
      },
    },
  },
})
assert.equal(nestedLegacy.message.includes('활동 포기'), false)

console.log('consent-withdraw.selfcheck: ok')
