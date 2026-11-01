import assert from 'node:assert/strict'
import {
  assertCertificatePdfBlob,
  CertificateLegacyRenderStubError,
} from './assert-certificate-pdf-blob.ts'

const stubText = `JA Korea Generated Document
jobId=154 jobType=CERTIFICATE_RENDER
sourceDomain=CERTIFICATE sourceId=15
renderedAt=2026-11-01T18:35:37.767422Z`

await assert.rejects(
  () => assertCertificatePdfBlob(new Blob([stubText], { type: 'text/plain' })),
  (error: unknown) => error instanceof CertificateLegacyRenderStubError,
)

const pdfBlob = new Blob(['%PDF-1.4 minimal'], { type: 'application/pdf' })
const normalized = await assertCertificatePdfBlob(pdfBlob)
assert.equal(await normalized.slice(0, 5).text(), '%PDF-')

console.log('assert-certificate-pdf-blob.selfcheck ok')
