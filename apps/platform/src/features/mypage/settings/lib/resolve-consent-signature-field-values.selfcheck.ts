import assert from 'node:assert/strict'
import { resolveConsentSignatureValuesForServerFields } from './resolve-consent-signature-field-values.ts'

const mid = { dataUrl: 'data:image/png;base64,mid', signedAt: '2026-01-01T00:00:00.000Z' }
const final = { dataUrl: 'data:image/png;base64,final', signedAt: '2026-01-01T00:00:00.000Z' }

const mapped = resolveConsentSignatureValuesForServerFields(
  [
    { fieldKey: 'receipt-pre-consent-seed-mid-signature', displayOrder: 1, required: true, signed: false },
    { fieldKey: 'receipt-pre-consent-seed-tail-signature', displayOrder: 2, required: true, signed: false },
  ],
  { mid, final },
)
assert.equal(mapped[0]?.fieldKey, 'receipt-pre-consent-seed-mid-signature')
assert.equal(mapped[0]?.signature?.dataUrl, mid.dataUrl)
assert.equal(mapped[1]?.signature?.dataUrl, final.dataUrl)

const dynamic = resolveConsentSignatureValuesForServerFields(
  [
    { fieldKey: 'server-sig-a', displayOrder: 2, required: true, signed: false },
    { fieldKey: 'server-sig-b', displayOrder: 1, required: true, signed: false },
  ],
  { mid, final },
)
assert.equal(dynamic[0]?.fieldKey, 'server-sig-b')
assert.equal(dynamic[0]?.signature?.dataUrl, mid.dataUrl)
assert.equal(dynamic[1]?.fieldKey, 'server-sig-a')
assert.equal(dynamic[1]?.signature?.dataUrl, final.dataUrl)

const skippedSigned = resolveConsentSignatureValuesForServerFields(
  [{ fieldKey: 'server-sig-a', displayOrder: 1, required: true, signed: true }],
  { final },
)
assert.equal(skippedSigned.length, 0)

const missingRequired = resolveConsentSignatureValuesForServerFields(
  [{ fieldKey: 'server-only', displayOrder: 1, required: true, signed: false }],
  {},
)
assert.equal(missingRequired[0]?.signature, null)
assert.equal(missingRequired[0]?.required, true)

console.log('resolve-consent-signature-field-values.selfcheck: ok')
