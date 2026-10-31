import assert from 'node:assert/strict'
import { resolveEducationSurveyFillNotice } from './fill-notice.ts'
import { portalFormSubmissionPeriodBlockMessage } from './portal-form-submission-period.ts'

assert.deepEqual(
  resolveEducationSurveyFillNotice({
    kind: 'satisfaction',
    status: 'submitted',
    periodBlockReason: 'closed',
    canShowFormBody: false,
  }),
  { type: 'submitted' },
)

assert.deepEqual(
  resolveEducationSurveyFillNotice({
    kind: 'satisfaction',
    status: 'submitted',
    periodBlockReason: null,
    canShowFormBody: true,
  }),
  { type: 'submitted' },
)

assert.deepEqual(
  resolveEducationSurveyFillNotice({
    kind: 'satisfaction',
    status: 'submitted',
    periodBlockReason: 'closed',
    canShowFormBody: true,
    canWrite: true,
  }),
  { type: 'submitted' },
)

assert.deepEqual(
  resolveEducationSurveyFillNotice({
    kind: 'satisfaction',
    status: 'submitted',
    periodBlockReason: null,
    canShowFormBody: true,
    canWrite: false,
  }),
  { type: 'submitted' },
)

assert.deepEqual(
  resolveEducationSurveyFillNotice({
    kind: 'satisfaction',
    status: 'submitted',
    periodBlockReason: null,
    canShowFormBody: true,
    canWrite: true,
    rewriteRequested: true,
  }),
  { type: 'none' },
)

assert.deepEqual(
  resolveEducationSurveyFillNotice({
    kind: 'satisfaction',
    status: 'in_progress',
    periodBlockReason: 'closed',
    canShowFormBody: false,
  }),
  { type: 'period', reason: 'closed' },
)

assert.deepEqual(
  resolveEducationSurveyFillNotice({
    kind: 'satisfaction',
    status: 'in_progress',
    periodBlockReason: 'closed',
    canShowFormBody: true,
  }),
  { type: 'none' },
)

assert.deepEqual(
  resolveEducationSurveyFillNotice({
    kind: 'survey',
    status: 'in_progress',
    periodBlockReason: 'not_started',
    canShowFormBody: true,
  }),
  { type: 'period', reason: 'not_started' },
)

assert.deepEqual(
  resolveEducationSurveyFillNotice({
    kind: 'survey',
    status: 'before_start',
    periodBlockReason: 'not_started',
    canShowFormBody: false,
  }),
  { type: 'period', reason: 'not_started' },
)

assert.equal(
  portalFormSubmissionPeriodBlockMessage('closed', 'satisfaction'),
  '만족도조사 작성 기간이 종료되었습니다.',
)
assert.equal(
  portalFormSubmissionPeriodBlockMessage('closed', 'survey'),
  '설문 작성 기간이 종료되었습니다.',
)

console.log('fill-notice.selfcheck: ok')
