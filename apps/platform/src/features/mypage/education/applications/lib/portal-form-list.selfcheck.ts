import assert from 'node:assert/strict'
import { platformQueryKeys } from '../../../../../shared/api/query-keys.ts'
import {
  dedupePortalFormListItems,
  indexScheduleAssignmentFormsByScheduleId,
  isPortalAssignmentFormType,
  isPortalBoundFormVersionUsable,
  isPortalSatisfactionFormType,
  isPortalSurveyFormType,
  isVolunteerFacingSatisfactionForm,
  mapAvailableProgramFormToListItem,
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
assert.equal(entry?.startAt, '2026-10-01')
assert.equal(
  mapPortalFormListItemToSurveyEntry({
    bindingId: 100,
    status: 'NOT_SUBMITTED',
    submissionStartAt: '2026-10-31T15:30:00Z',
    submissionEndAt: '2026-10-31T15:30:00Z',
  })?.startAt,
  '2026-11-01',
)

assert.equal(isPortalSurveyFormType('SURVEY'), true)
assert.equal(isPortalSurveyFormType('SATISFACTION'), false)
assert.equal(isPortalSurveyFormType('LECTURE_EVALUATION'), false)
assert.equal(isPortalSatisfactionFormType('SATISFACTION'), true)
assert.equal(isPortalSatisfactionFormType('LECTURE_EVALUATION'), false)
assert.equal(
  isVolunteerFacingSatisfactionForm({ formType: 'SATISFACTION', title: '봉사자 만족도조사' }),
  true,
)
assert.equal(
  isVolunteerFacingSatisfactionForm({ formType: 'SATISFACTION', title: '만족도조사 (교사용)' }),
  false,
)
assert.equal(
  mapPortalFormListItemToSurveyEntry({
    bindingId: 188868,
    formType: 'SURVEY',
    targetScope: 'SCHEDULE',
    scheduleId: '187582',
    status: 'NOT_SUBMITTED',
  } as never)?.scheduleId,
  187582,
)
assert.equal(isPortalBoundFormVersionUsable('PUBLISHED'), true)
assert.equal(isPortalBoundFormVersionUsable('ARCHIVED'), true)
assert.equal(isPortalBoundFormVersionUsable(undefined), true)
assert.equal(isPortalBoundFormVersionUsable('DRAFT'), false)

const availableArchivedSnapshot = mapAvailableProgramFormToListItem({
  bindingId: 189289,
  programId: 186363,
  templateId: 10,
  templateVersionId: 70,
  templateName: '기관 신청',
  formType: 'APPLICATION',
  targetScope: 'PROGRAM',
  required: true,
  alreadySubmitted: false,
})
assert.equal(availableArchivedSnapshot.bindingId, 189289)
assert.equal(availableArchivedSnapshot.templateVersionId, 70)
assert.equal(availableArchivedSnapshot.canSubmit, true)

assert.notDeepEqual(
  platformQueryKeys.mypage.programApplications.formBinding({
    programId: '186363',
    bindingId: 189289,
    templateVersionId: 70,
  }),
  platformQueryKeys.mypage.programApplications.formBinding({
    programId: '186363',
    bindingId: 189289,
    templateVersionId: 71,
  })
)

assert.equal(
  mapPortalFormListItemToSurveyEntry({
    bindingId: 201,
    formType: 'SATISFACTION',
    templateName: '만족도조사 (학생용)',
    targetScope: 'SCHEDULE',
    targetScopeLabel: '공통 교육 예정 1',
    scheduleStartAt: '2026-11-12T03:00:00.000Z',
    status: 'NOT_SUBMITTED',
  })?.title,
  '1회차 · 2026.11.12(목) 만족도조사 (학생용)',
)

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
assert.equal(
  mapPortalFormListItemToSurveyEntry({
    bindingId: 188866,
    formType: 'SURVEY',
    targetScope: 'SCHEDULE',
    targetScopeId: 187582,
    status: 'NOT_SUBMITTED',
  })?.scheduleId,
  187582,
)
assert.equal(
  mapPortalFormListItemToSurveyEntry({
    bindingId: 188867,
    formType: 'SURVEY',
    targetScope: 'SCHEDULE',
    scheduleId: Number('187582'),
    status: 'NOT_SUBMITTED',
  })?.scheduleId,
  187582,
)

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

const submittedByResponse = mapPortalFormListItemToSurveyEntry({
  bindingId: 190289,
  status: 'NOT_SUBMITTED',
  responseStatus: 'APPROVED',
  formResponseId: 1852101,
  canSubmit: false,
  canResubmit: false,
})
assert.equal(submittedByResponse?.status, 'submitted')
assert.equal(submittedByResponse?.responseStatus, 'APPROVED')

assert.equal(
  mapPortalFormListItemToSurveyEntry({
    bindingId: 1,
    formType: 'SATISFACTION',
    title: '만족도조사',
    targetScope: 'SCHEDULE',
    targetScopeLabel: '1지망',
    preferenceRank: 1,
    sessionNo: 3,
    scheduleId: 187703,
    scheduleStartAt: '2026-11-13T06:07:00Z',
    status: 'NOT_SUBMITTED',
    targetRole: 'TEACHER',
  })?.title,
  '1지망',
)
assert.equal(
  mapPortalFormListItemToSurveyEntry({
    bindingId: 2,
    formType: 'SATISFACTION',
    title: '만족도조사',
    preferenceRank: 2,
    status: 'NOT_SUBMITTED',
  })?.title,
  '2지망',
)

console.log('portal-form-list.selfcheck: ok')
