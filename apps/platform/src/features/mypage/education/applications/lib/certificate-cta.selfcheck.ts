import assert from 'node:assert/strict'
import {
  resolveCertificateCtaView,
  shouldFetchIndividualCertificateAvailability,
} from './certificate-cta.ts'

assert.equal(
  shouldFetchIndividualCertificateAvailability({
    isTeacher: false,
    applicationType: 'INDIVIDUAL',
    displayStatus: 'completed',
    programId: '186514',
  }),
  true,
)
assert.equal(
  shouldFetchIndividualCertificateAvailability({
    isTeacher: true,
    applicationType: 'INDIVIDUAL',
    displayStatus: 'completed',
    programId: '186514',
  }),
  false,
)
assert.equal(
  shouldFetchIndividualCertificateAvailability({
    isTeacher: false,
    applicationType: 'INDIVIDUAL',
    displayStatus: 'in_progress',
    programId: '186514',
  }),
  false,
)
assert.equal(
  shouldFetchIndividualCertificateAvailability({
    isTeacher: false,
    applicationType: 'ORGANIZATION',
    displayStatus: 'completed',
    programId: '186514',
  }),
  false,
)

assert.deepEqual(
  resolveCertificateCtaView({
    isTeacher: false,
    applicationType: 'INDIVIDUAL',
    displayStatus: 'completed',
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
    isTeacher: false,
    applicationType: 'INDIVIDUAL',
    displayStatus: 'completed',
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
    isTeacher: false,
    applicationType: 'INDIVIDUAL',
    displayStatus: 'completed',
    availability: {
      available: false,
      canDownload: false,
      reasonCode: 'PARTICIPANT_NOT_COMPLETED',
      reasonMessage: '수료 조건을 충족하지 않아 발급할 수 없습니다.',
    },
  }).kind,
  'unavailable',
)

assert.equal(
  resolveCertificateCtaView({
    isTeacher: false,
    applicationType: 'INDIVIDUAL',
    displayStatus: 'completed',
    availability: {
      available: true,
      canDownload: false,
    },
  }).kind,
  'issue',
)

assert.equal(
  resolveCertificateCtaView({
    isTeacher: true,
    applicationType: 'INDIVIDUAL',
    displayStatus: 'completed',
    availability: { available: true, canDownload: false },
  }).kind,
  'hidden',
)

console.log('certificate-cta.selfcheck: ok')
