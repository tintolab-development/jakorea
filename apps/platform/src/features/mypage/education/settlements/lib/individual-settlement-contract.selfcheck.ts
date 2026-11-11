import assert from 'node:assert/strict'
import {
  INDIVIDUAL_SETTLEMENT_DISABLED_CODE,
  INDIVIDUAL_SETTLEMENT_DISABLED_MESSAGE,
  RECEIPT_PRE_CONSENT_REQUIRED_CODE,
  RECEIPT_PRE_CONSENT_REQUIRED_MESSAGE,
  TRANSPORTATION_ADDRESS_MISSING_MESSAGE,
  TRANSPORTATION_UNDER_MIN_DISTANCE_MESSAGE,
  formatIndividualOneWayDistanceKm,
  individualIneligibleMessage,
  individualTransportIneligibleNotice,
  individualSettlementApiErrorMessage,
  isEvidencePolicyUnconfigured,
  isGeneralIndividualProgramType,
  isIndividualScheduleSettlementAudience,
  isReceiptPreConsentRequiredError,
  normalizeIndividualIneligibleReason,
  readIndividualSettlementErrorCode,
  resolveScheduleSettlementAudience,
  shouldUseIndividualSettlementSchedulesApi,
  shouldUseVolunteerSettlementSchedulesApi,
} from './individual-settlement-contract.ts'

assert.equal(isIndividualScheduleSettlementAudience('INDIVIDUAL'), true)
assert.equal(isIndividualScheduleSettlementAudience('individual'), true)
assert.equal(isIndividualScheduleSettlementAudience('VOLUNTEER'), false)
assert.equal(isIndividualScheduleSettlementAudience('INSTRUCTOR'), false)
assert.equal(isIndividualScheduleSettlementAudience('ORGANIZATION'), false)

assert.equal(isGeneralIndividualProgramType('GENERAL_INDIVIDUAL'), true)
assert.equal(isGeneralIndividualProgramType('GENERAL_ORGANIZATION'), false)
assert.equal(shouldUseIndividualSettlementSchedulesApi('INDIVIDUAL', 'GENERAL_INDIVIDUAL'), true)
assert.equal(shouldUseIndividualSettlementSchedulesApi('INSTRUCTOR', 'GENERAL_ORGANIZATION'), false)
assert.equal(shouldUseIndividualSettlementSchedulesApi('INSTRUCTOR', 'GENERAL_INDIVIDUAL'), false)
assert.equal(shouldUseIndividualSettlementSchedulesApi('INDIVIDUAL', 'GENERAL_ORGANIZATION'), false)

// 봉사자 일정별 영수증 정산 — 일반(개인·기관)·UJAT만. 1사1교·Gemini·유형 미확인은 호출하지 않는다.
assert.equal(shouldUseVolunteerSettlementSchedulesApi('VOLUNTEER', 'GENERAL_INDIVIDUAL'), true)
assert.equal(shouldUseVolunteerSettlementSchedulesApi('VOLUNTEER', 'GENERAL_ORGANIZATION'), true)
assert.equal(shouldUseVolunteerSettlementSchedulesApi('volunteer', 'ujat'), true)
assert.equal(shouldUseVolunteerSettlementSchedulesApi('VOLUNTEER', 'COMPANY_SCHOOL'), false)
assert.equal(shouldUseVolunteerSettlementSchedulesApi('VOLUNTEER', 'GEMINI'), false)
assert.equal(shouldUseVolunteerSettlementSchedulesApi('VOLUNTEER', null), false)
assert.equal(shouldUseVolunteerSettlementSchedulesApi('INDIVIDUAL', 'GENERAL_INDIVIDUAL'), false)
assert.equal(shouldUseVolunteerSettlementSchedulesApi('INSTRUCTOR', 'UJAT'), false)
// 봉사자 게이트가 개인 경로를 바꾸지 않는다
assert.equal(shouldUseIndividualSettlementSchedulesApi('VOLUNTEER', 'GENERAL_INDIVIDUAL'), false)

assert.equal(resolveScheduleSettlementAudience('INDIVIDUAL', 'GENERAL_INDIVIDUAL'), 'individual')
assert.equal(resolveScheduleSettlementAudience('INDIVIDUAL', null), 'individual')
assert.equal(resolveScheduleSettlementAudience('VOLUNTEER', 'UJAT'), 'volunteer')
assert.equal(resolveScheduleSettlementAudience('VOLUNTEER', 'GENERAL_ORGANIZATION'), 'volunteer')
assert.equal(resolveScheduleSettlementAudience('VOLUNTEER', 'COMPANY_SCHOOL'), null)
assert.equal(resolveScheduleSettlementAudience('INSTRUCTOR', 'GENERAL_INDIVIDUAL'), null)
assert.equal(resolveScheduleSettlementAudience('ORGANIZATION', 'GENERAL_ORGANIZATION'), null)

assert.equal(
  individualIneligibleMessage('EVIDENCE_POLICY_UNCONFIGURED'),
  '증빙 정책을 확인할 수 없어 신청할 수 없습니다',
)
assert.equal(
  individualIneligibleMessage('EVIDENCE_REQUIRED'),
  '증빙이 필요한 항목의 영수증을 제출해 주세요.',
)
assert.equal(
  individualIneligibleMessage('EVIDENCE_FILE_REQUIRED'),
  '증빙 파일 업로드가 완료되지 않았습니다. 다시 시도해 주세요.',
)
assert.notEqual(
  individualIneligibleMessage('EVIDENCE_POLICY_UNCONFIGURED'),
  individualIneligibleMessage('EVIDENCE_REQUIRED'),
)
assert.equal(
  individualIneligibleMessage('NO_PAYABLE_ITEMS'),
  '이 프로그램에 신청할 수 있는 지급 항목이 없습니다.',
)
assert.notEqual(
  individualIneligibleMessage('NO_PAYABLE_ITEMS'),
  individualIneligibleMessage('EVIDENCE_POLICY_UNCONFIGURED'),
)
assert.equal(normalizeIndividualIneligibleReason('attendance_not_qualified'), 'ATTENDANCE_NOT_QUALIFIED')
assert.equal(isEvidencePolicyUnconfigured('EVIDENCE_POLICY_UNCONFIGURED'), true)
assert.equal(
  isEvidencePolicyUnconfigured(null, [{ evidenceRequired: null }, { evidenceRequired: true }]),
  true,
)
assert.equal(isEvidencePolicyUnconfigured(null, [{ evidenceRequired: true }]), false)

assert.equal(readIndividualSettlementErrorCode(new Error('fail')), null)
assert.equal(
  readIndividualSettlementErrorCode({
    isAxiosError: true,
    response: { data: { error: { code: INDIVIDUAL_SETTLEMENT_DISABLED_CODE } } },
  }),
  INDIVIDUAL_SETTLEMENT_DISABLED_CODE,
)

const axiosLike = Object.assign(new Error('fail'), {
  isAxiosError: true,
  response: {
    status: 409,
    data: { error: { code: 'EVIDENCE_POLICY_UNCONFIGURED' } },
  },
})
assert.equal(
  individualSettlementApiErrorMessage(axiosLike),
  individualIneligibleMessage('EVIDENCE_POLICY_UNCONFIGURED'),
)
const axiosReason = Object.assign(new Error('conflict'), {
  isAxiosError: true,
  response: {
    status: 409,
    data: { error: { reason: 'SUBMISSION_DEADLINE_PASSED' } },
  },
})
assert.equal(
  individualSettlementApiErrorMessage(axiosReason),
  individualIneligibleMessage('SUBMISSION_DEADLINE_PASSED'),
)
assert.equal(INDIVIDUAL_SETTLEMENT_DISABLED_MESSAGE.includes('일정별 정산'), true)

const receiptConsentAxios = Object.assign(new Error('conflict'), {
  isAxiosError: true,
  response: {
    status: 409,
    data: { error: { code: RECEIPT_PRE_CONSENT_REQUIRED_CODE } },
  },
})
assert.equal(isReceiptPreConsentRequiredError(receiptConsentAxios), true)
assert.equal(individualSettlementApiErrorMessage(receiptConsentAxios), RECEIPT_PRE_CONSENT_REQUIRED_MESSAGE)

// 학생 교통비 편도 30km — 서버 transportPreview 안내만, null km는 0km로 표시하지 않음
assert.equal(formatIndividualOneWayDistanceKm(29.9), '29.9km')
assert.equal(formatIndividualOneWayDistanceKm(30), '30km')
assert.equal(formatIndividualOneWayDistanceKm(null), null)
assert.equal(formatIndividualOneWayDistanceKm(undefined), null)
assert.equal(
  individualTransportIneligibleNotice({ oneWayDistanceKm: 35, eligible: true, ineligibleReason: null }),
  null,
)
assert.equal(individualTransportIneligibleNotice(null), null)
assert.equal(
  individualTransportIneligibleNotice({
    oneWayDistanceKm: 29.9,
    eligible: false,
    ineligibleReason: 'UNDER_MIN_DISTANCE',
  }),
  `${TRANSPORTATION_UNDER_MIN_DISTANCE_MESSAGE} (편도 29.9km)`,
)
assert.equal(
  individualTransportIneligibleNotice({
    oneWayDistanceKm: null,
    eligible: false,
    ineligibleReason: 'ADDRESS_MISSING',
  }),
  TRANSPORTATION_ADDRESS_MISSING_MESSAGE,
)

const distanceAxios = Object.assign(new Error('bad request'), {
  isAxiosError: true,
  response: {
    status: 400,
    data: {
      success: false,
      message: '편도 30km 이상 이동 시에만 교통비를 신청할 수 있습니다.',
      error: {
        code: 'TRANSPORTATION_DISTANCE_NOT_ELIGIBLE',
        message: '편도 30km 이상 이동 시에만 교통비를 신청할 수 있습니다.',
        field: 'items',
      },
    },
  },
})
assert.equal(readIndividualSettlementErrorCode(distanceAxios), 'TRANSPORTATION_DISTANCE_NOT_ELIGIBLE')
assert.equal(
  individualSettlementApiErrorMessage(distanceAxios),
  '편도 30km 이상 이동 시에만 교통비를 신청할 수 있습니다.',
)

// 봉사자 — 일정 미종료 문구만 봉사 기준, 나머지 사유는 공통 문구
assert.equal(
  individualIneligibleMessage('SCHEDULE_NOT_ENDED'),
  '교육이 종료된 이후에 영수증을 제출할 수 있습니다.',
)
assert.equal(
  individualIneligibleMessage('SCHEDULE_NOT_ENDED', 'volunteer'),
  '봉사가 종료된 이후에 영수증을 제출할 수 있습니다.',
)
assert.equal(
  individualIneligibleMessage('SUBMISSION_DEADLINE_PASSED', 'volunteer'),
  individualIneligibleMessage('SUBMISSION_DEADLINE_PASSED'),
)

console.log('individual-settlement-contract.selfcheck: ok')
