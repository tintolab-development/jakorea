import assert from 'node:assert/strict'
import { pickApplicationOption } from './pick-application-option.ts'
import {
  focusFromListItem,
  programListEntryKey,
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
assert.equal(pickApplicationOption(options, { applicationTypes: ['VOLUNTEER'] }), null)

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

const keys = [
  programListEntryKey({ id: '100', recruitmentId: 1001 }),
  programListEntryKey({ id: '100', recruitmentId: 1002 }),
  programListEntryKey({ id: '100' }),
]
assert.deepEqual(keys, ['100:1001', '100:1002', '100'])
assert.equal(new Set(keys).size, 3)

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
