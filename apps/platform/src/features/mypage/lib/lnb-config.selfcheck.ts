import assert from 'node:assert/strict'
import { getMypageLnbItems } from './lnb-config.ts'
import type { PlatformMemberProfile } from '../model/types.ts'

function keysOf(profile: PlatformMemberProfile) {
  return getMypageLnbItems(profile).map(item => item.key)
}

function labelsOf(profile: PlatformMemberProfile) {
  return getMypageLnbItems(profile).map(item => item.label)
}

const GENERAL_KEYS = ['home', 'education', 'volunteer', 'inquiries'] as const
const INSTRUCTOR_KEYS = [
  'home',
  'lectures',
  'settlement',
  'education',
  'volunteer',
  'inquiries',
] as const

assert.deepEqual(keysOf('individual'), [...GENERAL_KEYS])
assert.deepEqual(keysOf('instructor_only'), [...INSTRUCTOR_KEYS])
// 교사 회원·교사 겸직 강사 — 봉사현황 비노출
assert.deepEqual(
  keysOf('school_teacher'),
  GENERAL_KEYS.filter(key => key !== 'volunteer'),
)
assert.deepEqual(
  keysOf('instructor_dual'),
  INSTRUCTOR_KEYS.filter(key => key !== 'volunteer'),
)

assert.equal(keysOf('individual').includes('lectures'), false)
assert.equal(keysOf('individual').includes('settlement'), false)
assert.equal(keysOf('school_teacher').includes('lectures'), false)
assert.equal(keysOf('school_teacher').includes('settlement'), false)

assert.deepEqual(labelsOf('instructor_only'), [
  '나의 홈',
  '강의현황',
  '정산 현황',
  '교육현황',
  '봉사현황',
  '문의하기',
])

const instructorItems = getMypageLnbItems('instructor_only')
assert.equal(instructorItems.find(item => item.key === 'lectures')?.enabled, true)
assert.equal(instructorItems.find(item => item.key === 'settlement')?.enabled, true)
assert.equal(instructorItems.find(item => item.key === 'settlement')?.dividerAfter, true)

console.log('lnb-config.selfcheck: ok')
