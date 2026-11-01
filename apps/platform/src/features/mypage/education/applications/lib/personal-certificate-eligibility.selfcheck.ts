import assert from 'node:assert/strict'
import {
  hasIssueCertificateListAction,
  isPersonalCertificateActionable,
  shouldShowPersonalCertificateAction,
} from './personal-certificate-eligibility.ts'
import { labelForPortalCertificateStatus } from './certificate-status-label.ts'
import { readPortalCertificateIssueId } from '../api/personal-certificate-types.ts'

assert.equal(
  shouldShowPersonalCertificateAction({
    applicationType: 'INDIVIDUAL',
    programType: 'GENERAL_EDUCATION',
    detailCase: 'general',
  }),
  true,
)
assert.equal(
  shouldShowPersonalCertificateAction({
    applicationType: 'ORGANIZATION',
    programType: 'GENERAL_ORGANIZATION',
    detailCase: 'general',
  }),
  false,
)
assert.equal(
  shouldShowPersonalCertificateAction({
    applicationType: 'INDIVIDUAL',
    programType: 'TRAINED_TEACHER',
    detailCase: 'general',
  }),
  false,
)
assert.equal(
  shouldShowPersonalCertificateAction({
    applicationType: 'INDIVIDUAL',
    programType: 'GEMINI',
    detailCase: 'gemini',
  }),
  false,
)
assert.equal(
  shouldShowPersonalCertificateAction({
    applicationType: 'INDIVIDUAL',
    detailCase: 'ujat-participant',
  }),
  false,
)

assert.equal(hasIssueCertificateListAction(['VIEW_DETAIL', 'ISSUE_CERTIFICATE']), true)
assert.equal(hasIssueCertificateListAction(['VIEW_DETAIL', 'CANCEL']), false)
assert.equal(hasIssueCertificateListAction(undefined), false)

assert.equal(isPersonalCertificateActionable({ available: true, canDownload: false }), true)
assert.equal(isPersonalCertificateActionable({ available: false, canDownload: true }), true)
assert.equal(isPersonalCertificateActionable({ available: false, canDownload: false }), false)
assert.equal(isPersonalCertificateActionable(null), false)

assert.equal(labelForPortalCertificateStatus('AVAILABLE'), '발급 가능')
assert.equal(labelForPortalCertificateStatus('COMPLETION_ISSUED'), '수료증 발급 완료')
assert.equal(labelForPortalCertificateStatus('FOO_ISSUED'), '발급 완료')
assert.equal(labelForPortalCertificateStatus('NOT_ELIGIBLE'), '발급 불가')

assert.equal(readPortalCertificateIssueId({ certificateIssueId: 14 }), 14)
assert.equal(readPortalCertificateIssueId({ issueId: 9 }), 9)
assert.equal(readPortalCertificateIssueId({ certificateIssueId: 14, issueId: 1 }), 14)
assert.equal(readPortalCertificateIssueId({}), null)

console.log('personal-certificate-eligibility.selfcheck: ok')
