import assert from 'node:assert/strict'
import { shouldFetchPortalApplicationOptions } from './application-option-query.ts'
import { applicationOptionKey, pickApplicationOption } from './pick-application-option.ts'
import {
  focusFromListItem,
  programListEntryKey,
  rowApplicationTypes,
} from '../lib/portal-recruitment.ts'

const options = [
  {
    recruitmentId: 1001,
    applicationType: 'ORGANIZATION',
    formBindingId: 11,
    canApply: false,
  },
  {
    recruitmentId: 1002,
    applicationType: 'INSTRUCTOR',
    formBindingId: 12,
    canApply: true,
  },
  {
    recruitmentId: 1003,
    applicationType: 'VOLUNTEER',
    formBindingId: 13,
    canApply: true,
  },
  {
    recruitmentId: 1004,
    applicationType: 'VOLUNTEER',
    formBindingId: 14,
    canApply: true,
  },
]

assert.equal(pickApplicationOption(options, { recruitmentId: 1001 })?.recruitmentId, 1001)
assert.equal(pickApplicationOption(options, { recruitmentId: 1001 })?.canApply, false)
assert.equal(pickApplicationOption(options, { recruitmentId: 9999 }), null)
assert.equal(pickApplicationOption(options, { applicationTypes: ['INSTRUCTOR'] })?.recruitmentId, 1002)
assert.equal(
  pickApplicationOption(options, {
    applicationTypes: ['INSTRUCTOR'],
    programType: 'UJAT',
  }),
  null,
)
assert.equal(
  pickApplicationOption(options, { recruitmentId: 1003, programType: 'UJAT' })?.applicationType,
  'VOLUNTEER',
)
assert.equal(pickApplicationOption(options, { applicationTypes: ['VOLUNTEER'] }), null)
assert.equal(applicationOptionKey(options[1]!), '1002:INSTRUCTOR')
assert.equal(applicationOptionKey({ recruitmentId: 1002 }), null)
assert.equal(shouldFetchPortalApplicationOptions(186383, true, true), true)
assert.equal(shouldFetchPortalApplicationOptions(186383, true, false), false)
assert.equal(shouldFetchPortalApplicationOptions(186383, false, true), false)
assert.equal(shouldFetchPortalApplicationOptions(null, true, true), false)

assert.deepEqual(
  rowApplicationTypes({
    recruitmentId: 1006,
    recruitmentType: 'PARTICIPANT',
    applicationType: 'INSTRUCTOR',
  }),
  ['INSTRUCTOR'],
)

/** 취소 이력이 있어도 서버가 canApply=true를 반환하면 재신청 가능한 모집으로 유지한다. */
const cancelledApplication = [
  {
    recruitmentId: 1005,
    applicationType: 'INSTRUCTOR',
    formBindingId: 15,
    canApply: true,
    blockedReason: undefined,
    existingApplication: {
      applicationId: 7005,
      applicationType: 'INSTRUCTOR',
      status: 'CANCELLED',
    },
  },
]
const cancelledPick = pickApplicationOption(cancelledApplication, {
  recruitmentId: 1005,
  applicationTypes: ['INSTRUCTOR'],
})
assert.equal(cancelledPick?.canApply, true)
assert.equal(cancelledPick?.blockedReason, undefined)

const sharedRecruitment = [
  {
    recruitmentId: 186050,
    applicationType: 'INDIVIDUAL',
    formBindingId: 21,
    canApply: true,
  },
  {
    recruitmentId: 186050,
    applicationType: 'ORGANIZATION',
    formBindingId: 22,
    canApply: true,
  },
]
assert.equal(
  pickApplicationOption(sharedRecruitment, {
    recruitmentId: 186050,
    applicationTypes: ['ORGANIZATION'],
  })?.formBindingId,
  22,
)
assert.equal(pickApplicationOption(sharedRecruitment, { recruitmentId: 186050 }), null)

/** formBindingId=null 이어도 진입 모집+유형 행을 고른다 (blockedReason 전달). INSTRUCTOR≠ORGANIZATION 재사용 금지. */
const instructorWithoutBinding = [
  {
    recruitmentId: 186096,
    applicationType: 'ORGANIZATION',
    formBindingId: 99,
    canApply: true,
  },
  {
    recruitmentId: 186097,
    applicationType: 'INSTRUCTOR',
    formBindingId: null,
    canApply: false,
    blockedReason: 'APPLICATION_FORM_NOT_CONFIGURED' as const,
  },
]
const instructorPick = pickApplicationOption(instructorWithoutBinding, {
  recruitmentId: 186097,
  applicationTypes: ['INSTRUCTOR'],
})
assert.equal(instructorPick?.recruitmentId, 186097)
assert.equal(instructorPick?.formBindingId ?? null, null)
assert.equal(instructorPick?.blockedReason, 'APPLICATION_FORM_NOT_CONFIGURED')
assert.notEqual(instructorPick?.formBindingId, 99)

const keys = [
  programListEntryKey({ id: '100', recruitmentId: 1001 }),
  programListEntryKey({ id: '100', recruitmentId: 1002 }),
  programListEntryKey({ id: '100' }),
  programListEntryKey({ id: '186010', recruitmentId: 186050, applicationType: 'INDIVIDUAL' }),
  programListEntryKey({ id: '186010', recruitmentId: 186050, applicationType: 'ORGANIZATION' }),
]
assert.deepEqual(keys, [
  '100:1001',
  '100:1002',
  '100',
  '186010:186050:INDIVIDUAL',
  '186010:186050:ORGANIZATION',
])
assert.equal(new Set(keys).size, keys.length)

const focus = focusFromListItem(
  {
    recruitmentId: 1002,
    applicationType: 'INSTRUCTOR',
    applicationTypes: ['INSTRUCTOR'],
  },
  'instructor',
)
assert.deepEqual(focus, {
  portalTab: 'INSTRUCTOR',
  applicationTypes: ['INSTRUCTOR'],
  recruitmentIds: [1002],
})

console.log('program application-option / list-entry identity.selfcheck: ok')
