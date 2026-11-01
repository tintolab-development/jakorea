import assert from 'node:assert/strict'
import { formatFormSignatureDate } from './normalize-form-signature.ts'

assert.equal(
  formatFormSignatureDate({ dataUrl: 'data:image/png;base64,xx', signedAt: '2026-10-31T15:30:00Z' }),
  '2026년 11월 01일',
)
assert.equal(
  formatFormSignatureDate({ dataUrl: 'data:image/png;base64,xx', signedAt: '2026-10-31T07:30:08Z' }),
  '2026년 10월 31일',
)

console.log('normalize-form-signature.selfcheck: ok')
