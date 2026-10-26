import assert from 'node:assert/strict'
import {
  dedupePortalFormListItems,
  indexScheduleAssignmentFormsByScheduleId,
  isPortalAssignmentFormType,
  isPortalSurveyFormType,
  mapPortalFormListItemToSurveyEntry,
  resolveCanonicalPortalFormBindingId,
  resolvePortalAssignmentScheduleId,
  resolvePortalFormBindingId,
} from './portal-form-list.ts'

assert.equal(resolvePortalFormBindingId({ bindingId: 10 }), 10)
assert.equal(resolvePortalFormBindingId({ programFormBindingId: 20 }), 20)
assert.equal(resolvePortalFormBindingId({}), null)

const entry = mapPortalFormListItemToSurveyEntry({
  programFormBindingId: 99,
  title: '테스트 설문',
  latestFormResponseId: 501,
  status: 'SUBMITTED',
  submissionStartAt: '2026-10-01T00:00:00+09:00',
})
assert.equal(entry?.id, '99')
assert.equal(entry?.formResponseId, 501)
assert.equal(entry?.status, 'submitted')

assert.equal(isPortalSurveyFormType('SURVEY'), true)
assert.equal(isPortalSurveyFormType('SATISFACTION'), false)

const scheduleBinding = mapPortalFormListItemToSurveyEntry({
  bindingId: 188865,
  title: '행사 설문',
  formType: 'SURVEY',
  targetScope: 'SCHEDULE',
  scheduleId: 187156,
  status: 'NOT_SUBMITTED',
  required: true,
})
assert.equal(scheduleBinding?.id, '188865')
assert.equal(scheduleBinding?.targetScope, 'SCHEDULE')
assert.equal(scheduleBinding?.scheduleId, 187156)
assert.equal(scheduleBinding?.required, true)

assert.equal(mapPortalFormListItemToSurveyEntry({ title: 'id 없음' }), null)

const items = dedupePortalFormListItems([
  { bindingId: 1, title: 'A' },
  { programFormBindingId: 1, title: 'B' },
  { bindingId: 2, title: 'C' },
])
assert.equal(items.length, 2)

assert.equal(isPortalAssignmentFormType('ASSIGNMENT'), true)
assert.equal(isPortalAssignmentFormType('homework'), true)
assert.equal(isPortalAssignmentFormType('SURVEY'), false)
assert.equal(isPortalAssignmentFormType('LECTURE_REPORT'), false)

assert.equal(resolveCanonicalPortalFormBindingId({ programFormBindingId: 20, id: 9 }), null)
assert.equal(resolveCanonicalPortalFormBindingId({ bindingId: 188865 }), 188865)

assert.equal(
  resolvePortalAssignmentScheduleId({
    targetScope: 'PROGRAM',
    scheduleId: 10,
    targetScopeId: 10,
  }),
  null,
)
assert.equal(
  resolvePortalAssignmentScheduleId({
    targetScope: 'schedule',
    scheduleId: 187156,
  }),
  187156,
)
assert.equal(
  resolvePortalAssignmentScheduleId({
    targetScope: 'SCHEDULE',
    scheduleId: null,
    targetScopeId: 187156,
  }),
  187156,
)

const indexed = indexScheduleAssignmentFormsByScheduleId([
  {
    bindingId: 1,
    formType: 'ASSIGNMENT',
    targetScope: 'PROGRAM',
    scheduleId: null,
    title: 'program fallback',
  },
  {
    programFormBindingId: 99,
    formType: 'ASSIGNMENT',
    targetScope: 'SCHEDULE',
    scheduleId: 10,
    title: 'alias only',
  },
  {
    bindingId: 11,
    formType: 'SURVEY',
    targetScope: 'SCHEDULE',
    scheduleId: 10,
    title: 'survey',
  },
  {
    bindingId: 12,
    formType: 'LECTURE_REPORT',
    targetScope: 'SCHEDULE',
    scheduleId: 10,
    title: 'lecture report',
  },
  {
    bindingId: 21,
    formType: 'ASSIGNMENT',
    targetScope: 'SCHEDULE',
    scheduleId: 10,
    canSubmit: true,
    title: 'first',
  },
  {
    bindingId: 22,
    formType: 'HOMEWORK',
    targetScope: 'SCHEDULE',
    scheduleId: 10,
    title: 'second same schedule',
  },
  {
    bindingId: 31,
    formType: 'HOMEWORK',
    targetScope: 'SCHEDULE',
    targetScopeId: 11,
    title: 'scope id only',
  },
])
assert.equal(indexed.size, 2)
assert.equal(indexed.get(10)?.bindingId, 21)
assert.equal(indexed.get(11)?.bindingId, 31)
assert.equal(indexed.has(186339), false)

const mappedAssignment = mapPortalFormListItemToSurveyEntry({
  bindingId: 21,
  formType: 'ASSIGNMENT',
  targetScope: 'SCHEDULE',
  scheduleId: 10,
  canSubmit: true,
  canResubmit: false,
  revisionNo: 0,
  status: 'NOT_SUBMITTED',
})
assert.equal(mappedAssignment?.bindingId, 21)
assert.equal(mappedAssignment?.canSubmit, true)
assert.equal(mappedAssignment?.canResubmit, false)

console.log('portal-form-list.selfcheck: ok')
