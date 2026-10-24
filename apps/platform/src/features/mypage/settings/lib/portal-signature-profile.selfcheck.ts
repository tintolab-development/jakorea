import assert from 'node:assert/strict'
import {
  buildPortalSignatureProfileRequest,
  PORTAL_SIGNATURE_TYPE_DRAWN,
} from './portal-signature-profile.ts'

const drawn = buildPortalSignatureProfileRequest(2056052)
assert.deepEqual(drawn, {
  signatureType: PORTAL_SIGNATURE_TYPE_DRAWN,
  fileObjectId: 2056052,
})
assert.equal(drawn.signatureType, 'DRAWN')
assert.equal('displayName' in drawn, false)
assert.equal('fontStyleCode' in drawn, false)

const typedPng = buildPortalSignatureProfileRequest(2056021)
assert.equal(typedPng.signatureType, 'DRAWN')
assert.notEqual(typedPng.signatureType, 'TYPED')

console.log('portal-signature-profile.selfcheck: ok')
