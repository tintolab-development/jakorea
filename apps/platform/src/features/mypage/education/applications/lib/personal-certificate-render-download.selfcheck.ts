import assert from 'node:assert/strict'
import {
  isPortalCertificateDownloadJobCompleted,
  parsePortalCertificateDownloadJob,
} from './personal-certificate-render-download.ts'

const completed = parsePortalCertificateDownloadJob({
  jobType: 'CERTIFICATE_RENDER',
  generatedFileJobId: 200,
  status: 'COMPLETED',
  downloadUrl: '/api/portal/files/downloads/raw/x?signature=y',
  fileObjectId: 2056480,
})
assert.ok(completed)
assert.equal(isPortalCertificateDownloadJobCompleted(completed!), true)

const pending = parsePortalCertificateDownloadJob({ status: 'RENDERING', generatedFileJobId: 154 })
assert.ok(pending)
assert.equal(isPortalCertificateDownloadJobCompleted(pending!), false)

console.log('personal-certificate-render-download.selfcheck ok')
