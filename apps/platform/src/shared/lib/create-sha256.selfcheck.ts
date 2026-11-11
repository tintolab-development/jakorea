import assert from 'node:assert/strict'
import { createSha256, resolveMemberPortalUploadSha256 } from './create-sha256.ts'

const file = new Blob(['abc'])
const expected = 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
assert.equal(await createSha256(file), expected)
assert.equal(await resolveMemberPortalUploadSha256(file), expected)
assert.equal(await resolveMemberPortalUploadSha256(file, '   '), expected)
assert.equal(await resolveMemberPortalUploadSha256(file, expected.toUpperCase()), expected)
await assert.rejects(resolveMemberPortalUploadSha256(file, 'invalid'), /SHA-256/)

console.log('create-sha256.selfcheck: ok')
