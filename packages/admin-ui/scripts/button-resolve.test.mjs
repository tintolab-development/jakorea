import assert from 'node:assert/strict'
import {
  resolveAdminButtonSize,
  resolveAdminButtonVariant,
} from '../dist/button/resolve.js'

assert.equal(resolveAdminButtonSize('large'), 'h44')
assert.equal(resolveAdminButtonSize('medium'), 'h40')
assert.equal(resolveAdminButtonSize('small'), 'h32')
assert.equal(resolveAdminButtonSize('h36'), 'h36')
assert.equal(resolveAdminButtonVariant('cancel'), 'default')
assert.equal(resolveAdminButtonVariant('delete'), 'error')
assert.equal(resolveAdminButtonVariant('primary'), 'primary')

console.log('admin-ui button-resolve.test.mjs ok')
