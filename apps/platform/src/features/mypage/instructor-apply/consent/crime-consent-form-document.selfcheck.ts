import assert from 'node:assert/strict'
import { portalPublicFileDownloadUrl } from '../../../../shared/lib/portal-public-file-url.ts'
import { CRIME_CONSENT_MESSAGES } from './crime-consent-original.ts'

assert.equal(portalPublicFileDownloadUrl(42), '/api/portal/public/files/42/download')
assert.equal(
  CRIME_CONSENT_MESSAGES.formFileUnavailable,
  '게시된 동의서 양식 파일을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.',
)
assert.notEqual(portalPublicFileDownloadUrl(42).includes('/consents/documents/'), true)

console.log('crime-consent-form-document.selfcheck: ok')
