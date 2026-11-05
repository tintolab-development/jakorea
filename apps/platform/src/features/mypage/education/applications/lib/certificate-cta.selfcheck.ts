import assert from 'node:assert/strict'
import {
  listRowCertificateAvailable,
  resolveCertificateCtaView,
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
  false,
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
  false,
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
    availability: { available: true, canDownload: false, certificateType: 'PARTICIPATION' },
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

console.log('certificate-cta.selfcheck: ok')
