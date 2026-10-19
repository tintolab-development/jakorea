import assert from 'node:assert/strict'
import {
  dedupePortalFormListItems,
  isPortalSurveyFormType,
  mapPortalFormListItemToSurveyEntry,
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
  targetScopeId: 187156,
  status: 'NOT_SUBMITTED',
  required: true,
})
assert.equal(scheduleBinding?.id, '188865')
assert.equal(scheduleBinding?.targetScope, 'SCHEDULE')
assert.equal(scheduleBinding?.targetScopeId, 187156)
assert.equal(scheduleBinding?.required, true)

assert.equal(mapPortalFormListItemToSurveyEntry({ title: 'id 없음' }), null)

const items = dedupePortalFormListItems([
  { bindingId: 1, title: 'A' },
  { programFormBindingId: 1, title: 'B' },
  { bindingId: 2, title: 'C' },
])
assert.equal(items.length, 2)
