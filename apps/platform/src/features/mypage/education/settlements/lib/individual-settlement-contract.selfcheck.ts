import assert from 'node:assert/strict'
import {
  INDIVIDUAL_SETTLEMENT_DISABLED_CODE,
  INDIVIDUAL_SETTLEMENT_DISABLED_MESSAGE,
  individualIneligibleMessage,
  individualSettlementApiErrorMessage,
  isEvidencePolicyUnconfigured,
  isGeneralIndividualProgramType,
  isIndividualScheduleSettlementAudience,
  normalizeIndividualIneligibleReason,
  readIndividualSettlementErrorCode,
  shouldUseIndividualSettlementSchedulesApi,
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

console.log('individual-settlement-contract.selfcheck: ok')
