/**
 * Run: node --experimental-strip-types --experimental-transform-types src/features/mypage/education/surveys/lib/map-portal-form-list-item.selfcheck.ts
 */
import assert from 'node:assert/strict'
import {
  mapPortalFormListItem,
  slicePortalFormDate,
} from './map-portal-form-list-item.ts'
import {
  isPortalFormSubmissionPeriodOpen,
  mergePortalFormSubmissionPeriodFields,
  resolvePortalFormSubmissionPeriodBlockForEntry,
  resolvePortalFormSubmissionPeriodBlockReason,
} from './portal-form-submission-period.ts'

assert.equal(slicePortalFormDate(null), undefined)
assert.equal(slicePortalFormDate(''), undefined)
assert.equal(slicePortalFormDate('2026-10-20T00:00:00Z'), '2026-10-20')
assert.equal(slicePortalFormDate('2026-10-31T15:30:00Z'), '2026-11-01')
assert.equal(slicePortalFormDate('2026-10-31'), '2026-10-31')

assert.equal(mapPortalFormListItem({}), null)
assert.equal(mapPortalFormListItem({ title: 'x' }), null)

const inProgress = mapPortalFormListItem({
  bindingId: 187370,
  title: '설문 A',
  status: 'NOT_SUBMITTED',
  submissionStartAt: '2026-10-20T09:00:00+09:00',
  submissionEndAt: '2026-10-20T18:00:00+09:00',
  templateVersionId: 623,
})
assert.ok(inProgress)
assert.equal(inProgress!.id, '187370')
assert.equal(inProgress!.status, 'in_progress')
assert.equal(inProgress!.startAt, '2026-10-20')
assert.equal(inProgress!.endAt, '2026-10-20')

const submitted = mapPortalFormListItem({
  formBindingId: 99,
  status: 'SUBMITTED',
})
assert.equal(submitted?.status, 'submitted')

assert.equal(mapPortalFormListItem({ id: 1, status: 'COMPLETED' })?.status, 'submitted')
assert.equal(mapPortalFormListItem({ id: 2, status: 'DONE' })?.status, 'submitted')

const schedule = mapPortalFormListItem({
  bindingId: 188865,
  title: '행사 설문',
  targetScope: 'SCHEDULE',
  targetScopeId: 187156,
  status: 'NOT_SUBMITTED',
})
assert.equal(schedule?.id, '188865')
assert.equal(schedule?.targetScope, 'SCHEDULE')
assert.equal(schedule?.targetScopeId, 187156)

const noDates = mapPortalFormListItem({ bindingId: 3, status: 'NOT_SUBMITTED' })
assert.ok(noDates)
assert.equal(noDates!.startAt, undefined)
assert.equal(noDates!.endAt, undefined)

const beforeStart = new Date('2026-10-19T12:00:00')
assert.equal(
  isPortalFormSubmissionPeriodOpen({ startAt: '2026-10-20', endAt: '2026-10-20' }, beforeStart),
  false,
)
const onStart = new Date('2026-10-20T10:00:00')
assert.equal(
  isPortalFormSubmissionPeriodOpen({ startAt: '2026-10-20', endAt: '2026-10-20' }, onStart),
  true,
)
const afterEnd = new Date('2026-10-21T00:00:01')
assert.equal(
  isPortalFormSubmissionPeriodOpen({ startAt: '2026-10-20', endAt: '2026-10-20' }, afterEnd),
  false,
)
assert.equal(isPortalFormSubmissionPeriodOpen({}, new Date()), true)

assert.equal(
  resolvePortalFormSubmissionPeriodBlockReason({ startAt: '2026-10-20', endAt: '2026-10-20' }, beforeStart),
  'not_started',
)
assert.equal(
  resolvePortalFormSubmissionPeriodBlockReason({ startAt: '2026-10-20', endAt: '2026-10-20' }, onStart),
  null,
)
assert.equal(
  resolvePortalFormSubmissionPeriodBlockReason({ startAt: '2026-10-20', endAt: '2026-10-20' }, afterEnd),
  'closed',
)
assert.equal(
  resolvePortalFormSubmissionPeriodBlockReason(
    { submissionEndAt: '2026-10-20T18:00:00+09:00' },
    new Date('2026-10-20T19:00:00+09:00'),
  ),
  'closed',
)
assert.equal(
  resolvePortalFormSubmissionPeriodBlockReason({ canSubmit: false }, new Date()),
  null,
)

assert.equal(
  mapPortalFormListItem({
    bindingId: 190289,
    status: 'NOT_SUBMITTED',
    responseStatus: 'APPROVED',
    formResponseId: 11,
    canSubmit: false,
    canResubmit: false,
  })?.status,
  'submitted',
)

const titleParagraph = {
  kind: 'description',
  variant: 'survey_title_with_period',
  id: 't',
  surveyTitle: '설문',
  endPeriodMode: 'custom',
  endAt: '2026-10-20T23:59:59+09:00',
} as import('@jakorea/form-schema/writing-form').TitleWithPeriodParagraph

assert.equal(
  mergePortalFormSubmissionPeriodFields(
    { canSubmit: true },
    {
      kind: 'description',
      variant: 'survey_title_with_period',
      id: 'boundary',
      surveyTitle: '설문',
      startPeriodMode: 'custom',
      startAt: '2026-10-31T15:30:00Z',
    } as import('@jakorea/form-schema/writing-form').TitleWithPeriodParagraph,
  ).startAt,
  '2026-11-01',
)

const titleOnlyEnd = mergePortalFormSubmissionPeriodFields({ canSubmit: true }, titleParagraph)
assert.equal(
  resolvePortalFormSubmissionPeriodBlockReason(titleOnlyEnd, new Date('2026-10-27T00:00:00+09:00')),
  'closed',
)
assert.equal(
  resolvePortalFormSubmissionPeriodBlockForEntry(
    { id: '1', title: 'x', status: 'in_progress', canSubmit: true },
    titleParagraph,
    new Date('2026-10-27T00:00:00+09:00'),
  ),
  'closed',
)

console.log('map-portal-form-list-item.selfcheck: ok')
