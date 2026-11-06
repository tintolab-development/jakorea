import assert from 'node:assert/strict'
import {
  listRowCertificateAvailable,
  resolveAutoPersonalCertificateSlot,
  resolveCertificateCtaView,
  resolveExclusivePersonalCertificateSlot,
  resolveExclusivePersonalCertificateViews,
  resolvePortalCertificateAvailabilityCtaView,
  resolvePortalCertificateIssueParticipantId,
  shouldFetchIndividualCertificateAvailability,
  shouldShowDetailCertificateCta,
  shouldShowListCertificateEntry,
} from './certificate-cta.ts'

const personalCompleted = {
  isTeacher: false,
  applicationType: 'INDIVIDUAL',
  programType: 'GENERAL_INDIVIDUAL',
  programGroup: 'GENERAL',
  canIssueCertificate: true,
  programId: '186514',
} as const

assert.equal(shouldFetchIndividualCertificateAvailability(personalCompleted), true)
assert.equal(shouldShowDetailCertificateCta(personalCompleted), true)
assert.equal(
  shouldFetchIndividualCertificateAvailability({ ...personalCompleted, isTeacher: true }),
  true,
)
assert.equal(
  shouldShowDetailCertificateCta({ ...personalCompleted, canIssueCertificate: false }),
  true,
)
assert.equal(
  shouldShowDetailCertificateCta({ ...personalCompleted, canIssueCertificate: null }),
  true,
)
assert.equal(
  shouldShowDetailCertificateCta({
    ...personalCompleted,
    applicationType: 'ORGANIZATION',
  }),
  false,
)
assert.equal(
  shouldShowDetailCertificateCta({
    ...personalCompleted,
    programType: 'TRAINED_TEACHER',
  }),
  false,
)
assert.equal(
  shouldShowDetailCertificateCta({
    ...personalCompleted,
    programType: 'GEMINI_TRAINING',
  }),
  false,
)

assert.equal(
  listRowCertificateAvailable({ certificateAvailable: true, availableActions: [] }),
  true,
)
assert.equal(
  listRowCertificateAvailable({
    certificateAvailable: false,
    availableActions: ['ISSUE_CERTIFICATE'],
  }),
  true,
)
assert.equal(
  listRowCertificateAvailable({ certificateAvailable: false, availableActions: [] }),
  false,
)
assert.equal(
  shouldShowListCertificateEntry({
    ...personalCompleted,
    certificateAvailable: true,
    availableActions: ['ISSUE_CERTIFICATE'],
  }),
  true,
)
assert.equal(
  shouldShowListCertificateEntry({
    ...personalCompleted,
    isTeacher: true,
    certificateAvailable: true,
  }),
  true,
)

assert.deepEqual(
  resolveCertificateCtaView({
    ...personalCompleted,
    certificateStatus: 'AVAILABLE',
    availability: {
      available: true,
      canDownload: false,
      participantId: 1695043,
      existingIssueId: null,
    },
  }),
  { kind: 'issue' },
)

assert.deepEqual(
  resolveCertificateCtaView({
    ...personalCompleted,
    certificateStatus: 'COMPLETION_ISSUED',
    availability: {
      available: true,
      canDownload: true,
      existingIssueId: 14,
    },
  }),
  { kind: 'download', issueId: 14 },
)

assert.equal(
  resolveCertificateCtaView({
    ...personalCompleted,
    certificateStatus: 'COMPLETION_ISSUED',
    availability: {
      available: true,
      canDownload: true,
      existingIssueId: 14,
    },
  }).kind,
  'download',
)

assert.equal(
  resolveCertificateCtaView({
    ...personalCompleted,
    canIssueCertificate: false,
    availability: { available: true, canDownload: false },
  }).kind,
  'issue',
)

assert.equal(
  resolveCertificateCtaView({
    ...personalCompleted,
    certificateStatus: 'NOT_ELIGIBLE',
    availability: {
      available: true,
      canDownload: false,
      certificateType: 'PARTICIPATION',
      participantId: 1694970,
    },
  }).kind,
  'issue',
)

assert.equal(
  resolveCertificateCtaView({
    ...personalCompleted,
    certificateStatus: 'NOT_ELIGIBLE',
    availability: { available: false, canDownload: false },
  }).kind,
  'hidden',
)

assert.equal(
  resolveCertificateCtaView({
    ...personalCompleted,
    availability: undefined,
  }).kind,
  'hidden',
)

assert.equal(
  resolvePortalCertificateAvailabilityCtaView({
    available: false,
    canDownload: false,
    certificateType: 'PARTICIPATION',
  }).kind,
  'hidden',
)

assert.equal(
  resolvePortalCertificateIssueParticipantId({
    applicationParticipantId: 1694970,
    availabilityParticipantId: 1694971,
  }),
  1694971,
)
assert.equal(
  resolvePortalCertificateIssueParticipantId({
    applicationParticipantId: 1694970,
    availabilityParticipantId: 1694970,
  }),
  1694970,
)
assert.deepEqual(
  resolvePortalCertificateAvailabilityCtaView({
    available: true,
    canDownload: true,
    existingIssueId: 17,
    certificateType: 'PARTICIPATION',
  }),
  { kind: 'download', issueId: 17 },
)
assert.equal(
  resolvePortalCertificateAvailabilityCtaView({
    available: false,
    canDownload: false,
    existingIssueId: 17,
    certificateType: 'PARTICIPATION',
  }).kind,
  'hidden',
)

assert.deepEqual(
  resolveExclusivePersonalCertificateViews({
    completion: { kind: 'issue' },
    participation: { kind: 'download', issueId: 17 },
  }),
  { completion: { kind: 'issue' }, participation: { kind: 'hidden' } },
)
assert.deepEqual(
  resolveExclusivePersonalCertificateViews({
    completion: { kind: 'hidden' },
    participation: { kind: 'issue' },
  }),
  { completion: { kind: 'hidden' }, participation: { kind: 'issue' } },
)
assert.deepEqual(
  resolveExclusivePersonalCertificateViews({
    completion: { kind: 'issue' },
    participation: { kind: 'hidden' },
  }),
  { completion: { kind: 'issue' }, participation: { kind: 'hidden' } },
)

assert.deepEqual(
  resolveExclusivePersonalCertificateSlot({
    completion: {
      available: true,
      canDownload: true,
      existingIssueId: 18,
      certificateType: 'COMPLETION',
      participantId: 1694970,
    },
    participation: {
      available: false,
      canDownload: true,
      existingIssueId: 17,
      certificateType: 'PARTICIPATION',
      reasonCode: 'COMPLETION_CERTIFICATE_REQUIRED',
    },
  }),
  { type: 'COMPLETION', view: { kind: 'download', issueId: 18 } },
)

assert.deepEqual(
  resolveExclusivePersonalCertificateSlot({
    completion: {
      available: true,
      canDownload: false,
      existingIssueId: null,
      certificateType: 'COMPLETION',
    },
    participation: {
      available: false,
      canDownload: true,
      existingIssueId: 17,
      certificateType: 'PARTICIPATION',
    },
  }),
  { type: 'COMPLETION', view: { kind: 'issue' } },
)

assert.deepEqual(
  resolveExclusivePersonalCertificateSlot({
    completion: {
      available: false,
      canDownload: false,
      certificateType: 'COMPLETION',
      reasonCode: 'PARTICIPANT_NOT_COMPLETED',
    },
    participation: {
      available: true,
      canDownload: false,
      certificateType: 'PARTICIPATION',
      participantId: 1694970,
    },
  }),
  { type: 'PARTICIPATION', view: { kind: 'issue' } },
)

assert.deepEqual(
  resolveExclusivePersonalCertificateSlot({
    completion: {
      available: false,
      eligible: false,
      reasonCode: 'PARTICIPANT_NOT_COMPLETED',
      existingIssueId: 18,
      canDownload: false,
      certificateType: 'COMPLETION',
      participantId: 1694970,
    },
    participation: {
      available: true,
      eligible: true,
      reasonCode: 'AVAILABLE',
      existingIssueId: 17,
      canDownload: true,
      certificateType: 'PARTICIPATION',
      participantId: 1694970,
    },
  }),
  { type: 'PARTICIPATION', view: { kind: 'download', issueId: 17 } },
)

assert.deepEqual(
  resolveExclusivePersonalCertificateSlot({
    completion: {
      available: false,
      canDownload: true,
      existingIssueId: 18,
      certificateType: 'COMPLETION',
    },
    participation: {
      available: true,
      canDownload: true,
      existingIssueId: 17,
      certificateType: 'PARTICIPATION',
    },
  }),
  { type: 'PARTICIPATION', view: { kind: 'download', issueId: 17 } },
)

assert.equal(
  resolvePortalCertificateAvailabilityCtaView({
    available: false,
    canDownload: false,
    existingIssueId: 18,
    certificateType: 'COMPLETION',
  }).kind,
  'hidden',
)

assert.deepEqual(
  resolveAutoPersonalCertificateSlot({
    certificateType: 'COMPLETION',
    available: true,
    canDownload: true,
    existingIssueId: 18,
    participantId: 1694970,
    reasonCode: 'AVAILABLE',
  }),
  { type: 'COMPLETION', view: { kind: 'download', issueId: 18 } },
)

assert.equal(
  resolveAutoPersonalCertificateSlot({
    certificateType: 'COMPLETION',
    available: false,
    canDownload: true,
    existingIssueId: 18,
    reasonCode: 'PARTICIPANT_NOT_COMPLETED',
  }).type,
  null,
)

assert.deepEqual(
  resolveAutoPersonalCertificateSlot({
    certificateType: 'PARTICIPATION',
    available: true,
    canDownload: true,
    existingIssueId: 17,
    reasonCode: 'AVAILABLE',
  }),
  { type: 'PARTICIPATION', view: { kind: 'download', issueId: 17 } },
)

assert.equal(
  resolveAutoPersonalCertificateSlot({
    certificateType: 'PARTICIPATION',
    available: false,
    canDownload: false,
    existingIssueId: 17,
    reasonCode: 'COMPLETION_CERTIFICATE_REQUIRED',
  }).type,
  null,
)

assert.equal(
  resolveExclusivePersonalCertificateSlot({
    completion: {
      available: false,
      canDownload: false,
      existingIssueId: 18,
      certificateType: 'COMPLETION',
      reasonCode: 'PARTICIPANT_NOT_COMPLETED',
    },
    participation: {
      available: false,
      canDownload: false,
      existingIssueId: 17,
      certificateType: 'PARTICIPATION',
      reasonCode: 'COMPLETION_CERTIFICATE_REQUIRED',
    },
  }).type,
  null,
)

console.log('certificate-cta.selfcheck: ok')
