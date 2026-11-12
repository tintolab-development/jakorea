import assert from 'node:assert/strict'
import { resolveProgramDetailCategoryTabs } from './portal-category.ts'

assert.deepEqual(
  resolveProgramDetailCategoryTabs({
    tabs: ['institution'],
    detailCase: 'instructor',
  }),
  ['instructor'],
)

assert.deepEqual(
  resolveProgramDetailCategoryTabs({
    tabs: ['instructor', 'institution'],
    detailCase: 'instructor',
  }),
  ['instructor'],
)

assert.deepEqual(
  resolveProgramDetailCategoryTabs({
    tabs: ['instructor', 'institution'],
    detailCase: 'gemini',
  }),
  ['institution'],
)

assert.deepEqual(
  resolveProgramDetailCategoryTabs({
    tabs: ['instructor', 'institution'],
    detailCase: 'gemini',
    focusedTab: 'instructor',
  }),
  ['instructor'],
)

assert.deepEqual(
  resolveProgramDetailCategoryTabs({
    tabs: ['youth'],
    detailCase: 'volunteer',
  }),
  ['youth'],
)

console.log('portal-category.selfcheck: ok')
