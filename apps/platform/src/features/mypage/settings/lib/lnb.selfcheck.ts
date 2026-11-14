import assert from 'node:assert/strict'
import { getSettingsLnbItems } from './lnb.ts'

assert.equal(
  getSettingsLnbItems('settingsProfile').some(item => item.key === 'settingsSocial'),
  true,
)
assert.equal(
  getSettingsLnbItems('settingsProfile', { showSocial: false }).some(
    item => item.key === 'settingsSocial',
  ),
  false,
)

console.log('settings lnb selfcheck: ok')
