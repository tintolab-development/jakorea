import assert from 'node:assert/strict'
import {
  ADMIN_APP_SELECT_OPTION_POLICY,
  CMS_SELECT_OPTION_POLICY,
  mapClearedSelectValue,
  mergeSelectOptions,
} from '../dist/select/select-options.js'

const adminFilterOptions = [
  { label: '전체', value: '' },
  { label: '공개', value: 'PUBLIC' },
]

const cmsOnly = mergeSelectOptions(
  [{ label: '공개', value: 'PUBLIC' }],
  undefined,
  CMS_SELECT_OPTION_POLICY
)
assert.equal(cmsOnly[0].label, '전체')
assert.equal(cmsOnly[0].value, '')

const cmsNoAll = mergeSelectOptions(adminFilterOptions, undefined, {
  includeAllOption: false,
  stripSentinelWhenNoAllOption: true,
})
assert.equal(cmsNoAll.length, 1)
assert.equal(cmsNoAll[0].value, 'PUBLIC')

const adminKeep = mergeSelectOptions(
  adminFilterOptions,
  undefined,
  ADMIN_APP_SELECT_OPTION_POLICY
)
assert.deepEqual(adminKeep, adminFilterOptions)

const adminAllSentinel = mergeSelectOptions(
  [
    { label: '전체', value: 'ALL' },
    { label: '공개', value: 'PUBLIC' },
  ],
  undefined,
  ADMIN_APP_SELECT_OPTION_POLICY
)
assert.equal(adminAllSentinel[0].value, 'ALL')

assert.equal(
  mapClearedSelectValue({ next: undefined, mode: undefined, optionsHaveEmptyValue: false }),
  ''
)
assert.equal(
  mapClearedSelectValue({ next: undefined, mode: undefined, optionsHaveEmptyValue: true }),
  undefined
)
assert.deepEqual(
  mapClearedSelectValue({ next: undefined, mode: 'multiple', optionsHaveEmptyValue: false }),
  undefined
)

console.log('admin-ui select-options.test.mjs ok')
