import assert from 'node:assert/strict'
import { buildCertificateDownloadFileName } from './certificate-download-file-name.ts'

const seoulAfternoon = new Date('2026-11-03T12:00:00+09:00')
assert.equal(
  buildCertificateDownloadFileName({
    memberName: '강하은',
    downloadedAt: seoulAfternoon,
  }),
  '수료증_강하은_261103.pdf',
)

assert.equal(
  buildCertificateDownloadFileName({
    memberName: '강하은',
    downloadedAt: seoulAfternoon,
    extension: 'zip',
  }),
  '수료증_강하은_261103.zip',
)

assert.equal(
  buildCertificateDownloadFileName({
    memberName: '  a/b:c  ',
    downloadedAt: seoulAfternoon,
  }),
  '수료증_a b c_261103.pdf',
)

assert.equal(
  buildCertificateDownloadFileName({
    memberName: '',
    downloadedAt: seoulAfternoon,
  }),
  '수료증_회원_261103.pdf',
)

console.log('certificate-download-file-name.selfcheck ok')
