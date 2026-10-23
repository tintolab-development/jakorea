import assert from 'node:assert/strict'
import {
  canEnterUjatEducationDocumentRevise,
  canEnterUjatEducationDocumentWrite,
  canViewUjatEducationDocumentFeedback,
  formatUjatEducationDocumentDeadline,
  parseUjatEducationDocumentsResponse,
  ujatEducationDocumentStatusLabel,
} from './documents.ts'

const parsed = parseUjatEducationDocumentsResponse({
  applicationId: 10,
  applicationType: 'VOLUNTEER',
  programId: 20,
  recruitmentId: 30,
  recruitTerm: 'FIRST_HALF',
  planSetup: {
    templateCode: 'issuance-2',
    publishedTemplateVersionId: null,
    programFormBindingId: null,
    unavailableReason: 'FORM_TEMPLATE_VERSION_NOT_PUBLISHED',
  },
  journalSetup: {
    templateCode: 'issuance-ujat-edu-journal',
    unavailableReason: 'FORM_BINDING_NOT_FOUND',
  },
  items: [
    {
      scheduleId: 100,
      educationDate: '2026-04-10',
      plan: {
        documentKind: 'PLAN',
        status: 'NOT_SUBMITTED',
        deadlineAt: '2026-04-02T15:00:00Z',
        deadlineDate: '2026-04-02',
        canSubmit: true,
        canRevise: false,
        hasFeedback: false,
        formResponseId: null,
        programFormBindingId: 8,
        templateVersionId: 9,
        contextType: 'PROGRAM_SCHEDULE',
        contextId: 100,
      },
      journal: {
        documentKind: 'JOURNAL',
        status: 'SUBMITTED',
        canSubmit: false,
        canRevise: true,
        hasFeedback: true,
        formResponseId: 77,
        programFormBindingId: 11,
        templateVersionId: 12,
      },
    },
    { scheduleId: null, plan: {}, journal: {} },
  ],
})

assert.equal(parsed.items.length, 1)
assert.equal(parsed.items[0]?.scheduleId, 100)
assert.equal(parsed.planSetup?.unavailableReason, 'FORM_TEMPLATE_VERSION_NOT_PUBLISHED')
assert.equal(parsed.journalSetup?.unavailableReason, 'FORM_BINDING_NOT_FOUND')
assert.equal(parsed.items[0]?.plan.contextId, 100)
assert.equal(formatUjatEducationDocumentDeadline(parsed.items[0]!.plan), '2026-04-02 24:00')
assert.equal(ujatEducationDocumentStatusLabel('REVISED'), '수정 제출 완료')
assert.equal(canEnterUjatEducationDocumentWrite(parsed.items[0]!.plan), true)
assert.equal(canEnterUjatEducationDocumentRevise(parsed.items[0]!.plan), false)
assert.equal(canEnterUjatEducationDocumentRevise(parsed.items[0]!.journal), true)
assert.equal(canViewUjatEducationDocumentFeedback(parsed.items[0]!.journal), true)

const unpublished = parseUjatEducationDocumentsResponse({
  items: [
    {
      scheduleId: 101,
      plan: {
        documentKind: 'PLAN',
        canSubmit: true,
        programFormBindingId: null,
        templateVersionId: null,
      },
      journal: { documentKind: 'JOURNAL' },
    },
  ],
})
assert.equal(canEnterUjatEducationDocumentWrite(unpublished.items[0]!.plan), false)

const empty = parseUjatEducationDocumentsResponse({ items: [] })
assert.deepEqual(empty.items, [])

const missingItems = parseUjatEducationDocumentsResponse({})
assert.deepEqual(missingItems.items, [])

console.log('ujat education documents mapper selfcheck ok')
