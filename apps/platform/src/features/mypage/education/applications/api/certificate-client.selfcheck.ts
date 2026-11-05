import assert from 'node:assert/strict'
import {
  mapPortalCertificateAvailability,
  mapPortalCertificateIssueResult,
  portalCertificateAvailabilityPath,
  portalCertificateDownloadPath,
  portalCertificateIssuePath,
} from './certificate-map.ts'

assert.equal(
  portalCertificateAvailabilityPath(186514),
  '/api/portal/me/programs/186514/certificates/availability?certificateType=COMPLETION',
)
assert.equal(portalCertificateIssuePath(), '/api/portal/me/certificates/issues')
assert.equal(
  portalCertificateDownloadPath(14),
  '/api/portal/me/certificates/14/download',
)

const availability = mapPortalCertificateAvailability({
  success: true,
  data: {
    available: true,
    reasonCode: 'AVAILABLE',
    participantId: 1695043,
    existingIssueId: null,
    canDownload: false,
    countedParticipationCount: 3,
    certificatePeriodStartDate: '2026-03-01',
    certificatePeriodEndDate: '2026-04-10',
    certificatePeriodLabel: '2026.03.01 ~ 2026.04.10',
  },
})
assert.equal(availability.available, true)
assert.equal(availability.canDownload, false)
assert.equal(availability.participantId, 1695043)
assert.equal(availability.existingIssueId, null)
assert.equal(availability.countedParticipationCount, 3)
assert.equal(availability.certificatePeriodLabel, '2026.03.01 ~ 2026.04.10')

const issued = mapPortalCertificateIssueResult({
  issueId: 14,
  issueStatus: 'ISSUED',
  issuedAt: '2026-11-01T07:11:50Z',
})
assert.equal(issued.certificateIssueId, 14)
assert.equal(issued.issueStatus, 'ISSUED')

const issuedAlias = mapPortalCertificateIssueResult({
  certificateIssueId: 22,
  issueStatus: 'ISSUED',
})
assert.equal(issuedAlias.certificateIssueId, 22)

console.log('certificate-client.selfcheck: ok')
