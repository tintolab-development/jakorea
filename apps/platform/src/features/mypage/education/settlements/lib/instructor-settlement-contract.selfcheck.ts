import assert from 'node:assert/strict'
import {
  INSTRUCTOR_PAYMENT_STATEMENT_CONSENT_REQUIRED_CODE,
  INSTRUCTOR_SETTLEMENT_BLOCKED_FALLBACK_MESSAGE,
  PAYMENT_STATEMENT_CONSENT_REQUIRED_MESSAGE,
  instructorSettlementApiErrorMessage,
  isInstructorPaymentStatementSubmit,
  isPaymentStatementConsentRequiredError,
  isSettlementTransportationAddressUnresolvedError,
  readInstructorPreviewSubmitBlock,
  readInstructorSettlementErrorCode,
  SETTLEMENT_CALCULATION_ITEMS_REQUIRED_CODE,
  SETTLEMENT_PAYMENT_ITEM_NOT_ENABLED_CODE,
  SETTLEMENT_TRANSPORTATION_ADDRESS_UNRESOLVED_MESSAGE,
} from './instructor-settlement-contract.ts'

assert.equal(
  isInstructorPaymentStatementSubmit({
    applicationType: 'INSTRUCTOR',
    documentKind: 'payment_statement',
  }),
  true,
)
assert.equal(
  isInstructorPaymentStatementSubmit({
    applicationType: 'INDIVIDUAL',
    documentKind: 'payment_statement',
  }),
  false,
)
assert.equal(
  isInstructorPaymentStatementSubmit({
    applicationType: 'INSTRUCTOR',
    documentKind: 'receipt',
  }),
  false,
)

const axiosLike = Object.assign(new Error('conflict'), {
  isAxiosError: true,
  response: {
    status: 409,
    data: { error: { code: 'LECTURE_REPORT_REQUIRED' } },
  },
})
assert.equal(readInstructorSettlementErrorCode(axiosLike), 'LECTURE_REPORT_REQUIRED')
assert.equal(
  instructorSettlementApiErrorMessage(axiosLike),
  '강의보고서/강의평가 제출 이후 정산 신청이 가능합니다.',
)

const consentAxios = Object.assign(new Error('conflict'), {
  isAxiosError: true,
  response: {
    status: 409,
    data: { error: { code: INSTRUCTOR_PAYMENT_STATEMENT_CONSENT_REQUIRED_CODE } },
  },
})
assert.equal(isPaymentStatementConsentRequiredError(consentAxios), true)
assert.equal(
  instructorSettlementApiErrorMessage(consentAxios),
  PAYMENT_STATEMENT_CONSENT_REQUIRED_MESSAGE,
)

const actualTimeAxios = Object.assign(new Error('bad request'), {
  isAxiosError: true,
  response: {
    status: 400,
    data: { error: { code: 'SETTLEMENT_ACTUAL_TRAINING_TIME_REQUIRED' } },
  },
})
assert.equal(
  instructorSettlementApiErrorMessage(actualTimeAxios),
  '강의 실적 시간이 없어 지급조서를 제출할 수 없어요. 담당자에게 문의해 주세요.',
)

const assignedScheduleAxios = Object.assign(new Error('bad request'), {
  isAxiosError: true,
  response: {
    status: 400,
    data: { error: { code: 'SETTLEMENT_ASSIGNED_SCHEDULE_TIME_REQUIRED' } },
  },
})
assert.equal(
  instructorSettlementApiErrorMessage(assignedScheduleAxios),
  '배정된 강의 시간이 없어 지급조서를 제출할 수 없어요. 담당자에게 문의해 주세요.',
)

// 409 SETTLEMENT_TRANSPORTATION_ADDRESS_UNRESOLVED — 서버 message 그대로 + addressSide별 보조 안내
const SERVER_ADDRESS_MESSAGE =
  '교통비 계산에 필요한 주소를 찾을 수 없습니다. 자택 주소 또는 교육 장소 주소를 확인하거나 관리자에게 문의해 주세요.'
const addressUnresolved = (details: unknown, message: string | null = SERVER_ADDRESS_MESSAGE) =>
  Object.assign(new Error('conflict'), {
    isAxiosError: true,
    response: {
      status: 409,
      data: {
        success: false,
        message,
        error: {
          code: 'SETTLEMENT_TRANSPORTATION_ADDRESS_UNRESOLVED',
          message,
          field: null,
          details,
        },
      },
    },
  })
assert.equal(isSettlementTransportationAddressUnresolvedError(addressUnresolved(null)), true)
assert.equal(
  instructorSettlementApiErrorMessage(addressUnresolved({ addressSide: 'ORIGIN' })),
  `${SERVER_ADDRESS_MESSAGE} 마이페이지 > 강사 정보에서 자택 주소를 확인해 주세요.`,
)
assert.equal(
  instructorSettlementApiErrorMessage(addressUnresolved({ addressSide: 'DESTINATION' })),
  `${SERVER_ADDRESS_MESSAGE} 교육 장소 주소 확인이 필요합니다. 관리자에게 문의해 주세요.`,
)
// ROUTE·UNKNOWN·모르는 값·값 없음 → 관리자 문의. 서버 문구에 이미 있으면 중복해 붙이지 않는다.
for (const details of [{ addressSide: 'ROUTE' }, { addressSide: 'UNKNOWN' }, { addressSide: 'NEW_SIDE' }, null, {}]) {
  assert.equal(instructorSettlementApiErrorMessage(addressUnresolved(details)), SERVER_ADDRESS_MESSAGE)
  assert.equal(
    instructorSettlementApiErrorMessage(addressUnresolved(details, '주소를 찾을 수 없습니다.')),
    '주소를 찾을 수 없습니다. 관리자에게 문의해 주세요.',
  )
}
// 서버 message가 비어도 기본 문구 — 외부 연동 장애 문구와 섞지 않는다
const noMessage = instructorSettlementApiErrorMessage(addressUnresolved(null, null))
assert.ok(noMessage.startsWith(SETTLEMENT_TRANSPORTATION_ADDRESS_UNRESOLVED_MESSAGE))
assert.ok(!noMessage.includes('외부 연동'))

// 503 PROVIDER_UNAVAILABLE — 이 계약에서는 다루지 않고 호출부 fallback(서버 재시도 안내)을 그대로 쓴다
const providerUnavailable = Object.assign(new Error('unavailable'), {
  isAxiosError: true,
  response: {
    status: 503,
    data: { error: { code: 'PROVIDER_UNAVAILABLE', message: '외부 연동 서비스를 사용할 수 없습니다. 잠시 후 다시 시도해 주세요.' } },
  },
})
assert.equal(isSettlementTransportationAddressUnresolvedError(providerUnavailable), false)
assert.equal(instructorSettlementApiErrorMessage(providerUnavailable, 'FALLBACK'), 'FALLBACK')

// 미리보기 200 canSubmit=false — 지급 항목 0건(BE 1b13439db): 서버 blockerMessage 그대로
const itemsRequiredMessage = '정산 지급 항목이 없어 신청할 수 없습니다.'
assert.deepEqual(
  readInstructorPreviewSubmitBlock({
    canSubmit: false,
    blockerCode: SETTLEMENT_CALCULATION_ITEMS_REQUIRED_CODE,
    blockerMessage: itemsRequiredMessage,
    items: [],
    payableItems: [],
  }),
  { code: SETTLEMENT_CALCULATION_ITEMS_REQUIRED_CODE, message: itemsRequiredMessage },
)
// 모르는 blockerCode도 서버 blockerMessage로 폴백
assert.deepEqual(
  readInstructorPreviewSubmitBlock({
    canSubmit: false,
    blockerCode: 'some_new_blocker',
    blockerMessage: ' 서버 안내 ',
  }),
  { code: 'SOME_NEW_BLOCKER', message: '서버 안내' },
)
// blockerMessage가 없으면 같은 code의 기존 문구 → 그것도 없으면 기존 fallback
assert.equal(
  readInstructorPreviewSubmitBlock({ canSubmit: false, blockerCode: 'LECTURE_NOT_ENDED' })?.message,
  '강의가 종료된 이후에 지급조서를 제출할 수 있습니다.',
)
assert.equal(
  readInstructorPreviewSubmitBlock({ canSubmit: false, blockerCode: 'UNKNOWN_X' })?.message,
  INSTRUCTOR_SETTLEMENT_BLOCKED_FALLBACK_MESSAGE,
)
// canSubmit이 true이거나 없으면 차단하지 않는다(기존 정상 흐름)
assert.equal(readInstructorPreviewSubmitBlock({ canSubmit: true, items: [{}] }), null)
assert.equal(readInstructorPreviewSubmitBlock({ payableItems: [] }), null)
assert.equal(readInstructorPreviewSubmitBlock(null), null)

// 400 SETTLEMENT_PAYMENT_ITEM_NOT_ENABLED — 서버 message 그대로
const notEnabledMessage =
  '이 프로그램에서 신청할 수 없는 지급 항목입니다. 담당자에게 프로그램 지급 항목 설정을 확인해 주세요.'
const notEnabled = Object.assign(new Error('bad request'), {
  isAxiosError: true,
  response: {
    status: 400,
    data: {
      error: {
        code: SETTLEMENT_PAYMENT_ITEM_NOT_ENABLED_CODE,
        message: notEnabledMessage,
        field: 'requestedItems',
      },
    },
  },
})
assert.equal(instructorSettlementApiErrorMessage(notEnabled, 'FALLBACK'), notEnabledMessage)
// 서버 message가 비면 호출부 fallback
const notEnabledNoMessage = Object.assign(new Error('bad request'), {
  isAxiosError: true,
  response: { status: 400, data: { error: { code: SETTLEMENT_PAYMENT_ITEM_NOT_ENABLED_CODE } } },
})
assert.equal(instructorSettlementApiErrorMessage(notEnabledNoMessage, 'FALLBACK'), 'FALLBACK')

console.log('instructor-settlement-contract.selfcheck: ok')
