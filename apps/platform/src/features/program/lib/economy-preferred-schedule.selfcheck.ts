/**
 * 1사1교 기관 신청 — preferredScheduleBlocks + requestedSchedules 계약
 * 실행: node --experimental-strip-types --experimental-transform-types src/features/program/lib/economy-preferred-schedule.selfcheck.ts
 */
import assert from 'node:assert/strict'
import type { PortalSaveApplicationRequest } from '../api/application-types.ts'
import {
  buildEconomyOrganizationSchedulePayload,
  ECONOMY_PREFERRED_SCHEDULE_BLOCK_COUNT,
  ECONOMY_PREFERRED_SCHEDULE_DUPLICATE_DATE_MESSAGE,
  findIncompleteEconomyPreferredScheduleMessage,
  shouldAttachEconomyRequestedSchedules,
  toEconomyPreferredScheduleAnswerValue,
  toEconomyRequestedSchedules,
  type EconomyPreferredScheduleBlock,
} from './economy-preferred-schedule.ts'

const first: EconomyPreferredScheduleBlock = {
  date: '2026-11-10',
  session: '2',
  firstClassPeriod: '3',
  firstStart: '09:00',
  firstEnd: '09:45',
  secondStart: '09:50',
  secondEnd: '10:35',
}

const second: EconomyPreferredScheduleBlock = {
  date: '2026-11-17',
  session: '1',
  firstClassPeriod: '5',
  firstStart: '13:00',
  firstEnd: '13:45',
  secondStart: '',
  secondEnd: '',
}

const payload = buildEconomyOrganizationSchedulePayload([first, second])
assert.ok(payload)
assert.equal(payload.preferredScheduleBlocks.length, ECONOMY_PREFERRED_SCHEDULE_BLOCK_COUNT)
assert.equal(payload.requestedSchedules.length, ECONOMY_PREFERRED_SCHEDULE_BLOCK_COUNT)

const [preferred1, preferred2] = payload.preferredScheduleBlocks
const [requested1, requested2] = payload.requestedSchedules
assert.equal(preferred1?.date, requested1?.requestedDate)
assert.equal(preferred2?.date, requested2?.requestedDate)
assert.equal(preferred1?.sessionCount, 2)
assert.equal(requested1?.sessionCount, 2)
assert.equal(requested1?.sessionTimes.length, requested1?.sessionCount)
assert.equal(requested2?.sessionTimes.length, requested2?.sessionCount)
assert.equal(requested1?.startPeriod, 3)
assert.deepEqual(
  requested1?.sessionTimes.map(item => item.period),
  [3, 4],
)
assert.equal(requested1?.sessionTimes[0]?.startTime, '09:00')
assert.equal(requested1?.sessionTimes[0]?.endTime, '09:45')
assert.equal(requested1?.sessionTimes[1]?.startTime, '09:50')
assert.equal(requested1?.sessionTimes[1]?.endTime, '10:35')
assert.equal(requested2?.startPeriod, 5)
assert.deepEqual(
  requested2?.sessionTimes.map(item => item.period),
  [5],
)
assert.equal(requested1?.combinedClassYn, false)
assert.equal(requested2?.combinedClassYn, false)

const answers = toEconomyPreferredScheduleAnswerValue([first, second])
assert.ok(answers)
assert.equal(answers.length, 2)

const submitBody: PortalSaveApplicationRequest = {
  recruitmentId: 187008,
  applicationType: 'ORGANIZATION',
  formBindingId: 190058,
  answers: { preferredScheduleBlocks: answers },
  preferredScheduleBlocks: payload.preferredScheduleBlocks,
  requestedSchedules: payload.requestedSchedules,
}
assert.equal(submitBody.requestedSchedules?.length, 2)
assert.equal(submitBody.preferredScheduleBlocks?.length, 2)
assert.notEqual(submitBody.requestedSchedules, [])
const draftBody: PortalSaveApplicationRequest = { ...submitBody, answers: { ...submitBody.answers } }
assert.deepEqual(draftBody.requestedSchedules, submitBody.requestedSchedules)
assert.deepEqual(draftBody.preferredScheduleBlocks, submitBody.preferredScheduleBlocks)

assert.equal(
  shouldAttachEconomyRequestedSchedules({
    applyCase: 'institution-economy',
    applicationType: 'ORGANIZATION',
  }),
  true,
)
assert.equal(
  shouldAttachEconomyRequestedSchedules({
    applyCase: 'institution-general',
    applicationType: 'ORGANIZATION',
  }),
  false,
)
assert.equal(
  shouldAttachEconomyRequestedSchedules({
    applyCase: 'institution-economy',
    applicationType: 'INDIVIDUAL',
  }),
  false,
)
assert.equal(
  shouldAttachEconomyRequestedSchedules({
    applyCase: 'institution-gemini',
    applicationType: 'ORGANIZATION',
  }),
  false,
)
assert.equal(
  shouldAttachEconomyRequestedSchedules({
    applyCase: 'institution-ujat',
    applicationType: 'ORGANIZATION',
  }),
  false,
)
assert.equal(
  shouldAttachEconomyRequestedSchedules({
    applyCase: 'trained-teachers',
    applicationType: 'ORGANIZATION',
  }),
  false,
)

assert.equal(toEconomyRequestedSchedules([first]), null)
assert.equal(
  findIncompleteEconomyPreferredScheduleMessage(
    [
      first,
      {
        ...second,
        date: first.date,
      },
    ],
    true,
  ),
  ECONOMY_PREFERRED_SCHEDULE_DUPLICATE_DATE_MESSAGE,
)
assert.ok(
  findIncompleteEconomyPreferredScheduleMessage(
    [
      first,
      {
        date: '',
        session: '',
        firstClassPeriod: '',
        firstStart: '',
        firstEnd: '',
        secondStart: '',
        secondEnd: '',
      },
    ],
    true,
  ),
)

console.log('economy-preferred-schedule.selfcheck: ok')
