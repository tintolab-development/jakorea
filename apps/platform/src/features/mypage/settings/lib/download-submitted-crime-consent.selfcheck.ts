import assert from 'node:assert/strict'
import { resolveSubmittedCrimeConsentFile } from './resolve-submitted-crime-consent-file.ts'

assert.deepEqual(
  resolveSubmittedCrimeConsentFile({
    signedFileObjectId: 12,
    evidenceOriginalFileName: '내동의서.pdf',
    content: 'https://example.com/uploaded.pdf',
  }),
  { url: 'https://example.com/uploaded.pdf', fileName: '내동의서.pdf' },
)

assert.deepEqual(
  resolveSubmittedCrimeConsentFile({
    filledDocument: { evidenceFileObjectId: 9, evidenceOriginalFileName: 'scan.png' },
  }),
  { fileObjectId: 9, fileName: 'scan.png' },
)

assert.deepEqual(
  resolveSubmittedCrimeConsentFile({
    content: 'https://files.example.com/uploaded.pdf',
  }),
  { url: 'https://files.example.com/uploaded.pdf', fileName: '성범죄 경력 조회 동의서' },
)

assert.equal(resolveSubmittedCrimeConsentFile({ content: '양식 본문' }).url, undefined)
assert.equal(resolveSubmittedCrimeConsentFile({ content: '양식 본문' }).fileObjectId, undefined)

console.log('download-submitted-crime-consent.selfcheck: ok')
