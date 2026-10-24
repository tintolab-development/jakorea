import assert from 'node:assert/strict'
import {
  applyResidentBackMaskedDisplayChange,
  formatResidentBackMaskedDisplay,
  formatResidentNumberForPreview,
  formatResidentNumberRawForPreview,
  maskResidentBackForPreview,
  sanitizeResidentBackDigits,
} from './resident-back-mask.ts'

assert.equal(sanitizeResidentBackDigits('1a2*34567'), '1234567')
assert.equal(formatResidentBackMaskedDisplay('1234567'), '1******')
assert.equal(formatResidentBackMaskedDisplay('1234567', true), '1234567')
assert.equal(formatResidentBackMaskedDisplay('1'), '1')
assert.equal(formatResidentBackMaskedDisplay('12'), '1*')
assert.equal(formatResidentBackMaskedDisplay(''), '')

assert.equal(applyResidentBackMaskedDisplayChange('', '1', false), '1')
assert.equal(applyResidentBackMaskedDisplayChange('1', '12', false), '12')
assert.equal(applyResidentBackMaskedDisplayChange('12', '1*3', false), '123')
assert.equal(applyResidentBackMaskedDisplayChange('1234567', '1******', false), '1234567')
assert.equal(applyResidentBackMaskedDisplayChange('123', '1*', false), '12')
assert.equal(applyResidentBackMaskedDisplayChange('123', '9', false), '9')
assert.equal(applyResidentBackMaskedDisplayChange('1234567', '1234567', true), '1234567')
assert.equal(applyResidentBackMaskedDisplayChange('1', '1a2*34567', true), '1234567')

assert.equal(formatResidentNumberForPreview('970721', '1234567'), '970721-1******')
assert.equal(formatResidentNumberForPreview('970721', '1******'), '970721-1******')
assert.equal(formatResidentNumberRawForPreview('9707211234567'), '970721-1******')
assert.equal(formatResidentNumberRawForPreview('970721-1234567'), '970721-1******')
assert.equal(formatResidentNumberRawForPreview('970721-1******'), '970721-1******')
assert.equal(formatResidentNumberRawForPreview(''), '')
assert.equal(maskResidentBackForPreview('1234567'), '1******')
assert.equal(maskResidentBackForPreview('1******'), '1******')

console.log('resident-back-mask.test.ts: ok')
