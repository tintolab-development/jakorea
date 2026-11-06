import assert from 'node:assert/strict'
import {
  hasIssueCertificateListAction,
  isPersonalCertificateActionable,
  portalCertificateCtaButtonLabel,
  portalCertificateDocumentLabel,
  portalCertificateIssueType,
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
    programType: 'GENERAL_EDUCATION',
    programGroup: 'TRAINED_TEACHER',
    detailCase: 'general',
  }),
  false,
)
assert.equal(
  shouldShowPersonalCertificateAction({
    applicationType: 'INDIVIDUAL',
    programType: 'GENERAL_EDUCATION',
    detailCase: 'general',
    isTeacher: true,
  }),
  true,
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
assert.equal(labelForPortalCertificateStatus('PARTICIPATION_ISSUED'), '참가인증서 발급 완료')
assert.equal(labelForPortalCertificateStatus('FOO_ISSUED'), '발급 완료')
assert.equal(portalCertificateDocumentLabel('PARTICIPATION'), '참가인증서')
assert.equal(portalCertificateDocumentLabel('COMPLETION'), '수료증')
assert.equal(
  portalCertificateCtaButtonLabel({ certificateType: 'COMPLETION', action: 'download' }),
  '수료증 다운로드',
)
assert.equal(
  portalCertificateCtaButtonLabel({ certificateType: 'COMPLETION', action: 'issue' }),
  '수료증 발급하기',
)
assert.equal(
  portalCertificateCtaButtonLabel({ certificateType: 'PARTICIPATION', action: 'issue' }),
  '참가인증서 발급하기',
)
assert.equal(
  portalCertificateCtaButtonLabel({ certificateType: 'PARTICIPATION', action: 'download' }),
  '참가인증서 다운로드',
)
assert.equal(portalCertificateIssueType('PARTICIPATION'), 'PARTICIPATION')
assert.equal(portalCertificateIssueType('AUTO'), 'AUTO')
assert.equal(labelForPortalCertificateStatus('NOT_ELIGIBLE'), '발급 불가')

assert.equal(readPortalCertificateIssueId({ certificateIssueId: 14 }), 14)
assert.equal(readPortalCertificateIssueId({}), null)

console.log('personal-certificate-eligibility.selfcheck: ok')
