import assert from 'node:assert/strict'
import {
  canEnterUjatEducationDocumentRevise,
  canEnterUjatEducationDocumentWrite,
  canViewUjatEducationDocumentFeedback,
  formatUjatEducationDocumentDeadline,
  parseUjatEducationDocumentsResponse,
  resolveUjatEducationDocumentGuide,
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
        answers: { planTitle: '봄 교육' },
        files: [
          {
            formSubmissionFileId: 501,
            questionKey: null,
            fileObjectId: 601,
            originalFileName: '계획서.pdf',
            contentType: 'application/pdf',
            fileSize: 1234,
            downloadable: true,
            retentionExpiresAt: '2027-04-10T00:00:00Z',
          },
        ],
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
assert.deepEqual(parsed.items[0]?.plan.answers, { planTitle: '봄 교육' })
assert.equal(parsed.items[0]?.plan.files[0]?.questionKey, null)
assert.equal(parsed.items[0]?.plan.files[0]?.downloadable, true)
assert.equal(formatUjatEducationDocumentDeadline(parsed.items[0]!.plan), '2026-04-02 24:00')
assert.equal(ujatEducationDocumentStatusLabel('REVISED'), '수정 제출 완료')
assert.equal(ujatEducationDocumentStatusLabel('APPROVED'), '승인 완료')
assert.equal(canEnterUjatEducationDocumentWrite(parsed.items[0]!.plan), true)
assert.equal(canEnterUjatEducationDocumentRevise(parsed.items[0]!.plan), false)
assert.equal(canEnterUjatEducationDocumentRevise(parsed.items[0]!.journal), true)
assert.equal(canViewUjatEducationDocumentFeedback(parsed.items[0]!.journal), true)
assert.equal(
  resolveUjatEducationDocumentGuide('PLAN', { ...parsed.items[0]!.plan, status: 'APPROVED' }, null)
    .statusLabel,
  '교육계획서 승인 완료',
)
assert.equal(
  resolveUjatEducationDocumentGuide('PLAN', parsed.items[0]!.plan, parsed.planSetup).message,
  '기한 내에 교육계획서를 제출해 주세요',
)
assert.equal(
  resolveUjatEducationDocumentGuide('JOURNAL', parsed.items[0]!.journal, parsed.journalSetup).message,
  '담당자의 피드백이 있어요',
)

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

// `publishedTemplateVersionId`라는 필드명과 무관하게 슬롯의 활성 binding 식별자가 작성 SSOT다.
// 이 ID가 이후 ARCHIVED 상태가 되어도 FE는 최신 버전으로 치환하거나 차단하지 않는다.
const pinnedArchivedVersion = parseUjatEducationDocumentsResponse({
  planSetup: {
    templateCode: 'issuance-2',
    publishedTemplateVersionId: 70,
    programFormBindingId: 189289,
  },
  items: [
    {
      scheduleId: 103,
      plan: {
        documentKind: 'PLAN',
        canSubmit: true,
        programFormBindingId: 189289,
        templateVersionId: 70,
      },
      journal: { documentKind: 'JOURNAL' },
    },
  ],
})
assert.equal(canEnterUjatEducationDocumentWrite(pinnedArchivedVersion.items[0]!.plan), true)
assert.equal(pinnedArchivedVersion.items[0]!.plan.templateVersionId, 70)
assert.equal(pinnedArchivedVersion.items[0]!.plan.programFormBindingId, 189289)

const empty = parseUjatEducationDocumentsResponse({ items: [] })
assert.deepEqual(empty.items, [])

const missingItems = parseUjatEducationDocumentsResponse({})
assert.deepEqual(missingItems.items, [])

const missingSubmissionDetails = parseUjatEducationDocumentsResponse({
  items: [
    {
      scheduleId: 102,
      plan: { documentKind: 'PLAN', answers: null, files: null },
      journal: { documentKind: 'JOURNAL', answers: [], files: {} },
    },
  ],
})
assert.deepEqual(missingSubmissionDetails.items[0]?.plan.answers, {})
assert.deepEqual(missingSubmissionDetails.items[0]?.plan.files, [])
assert.deepEqual(missingSubmissionDetails.items[0]?.journal.answers, {})
assert.deepEqual(missingSubmissionDetails.items[0]?.journal.files, [])

console.log('ujat education documents mapper selfcheck ok')
