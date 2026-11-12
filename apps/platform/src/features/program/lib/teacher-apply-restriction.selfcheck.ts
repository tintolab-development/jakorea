import assert from 'node:assert/strict'
import { isTeacherRestrictedApplication } from './teacher-apply-restriction.ts'

const teacher = (programType: string | undefined, applicationType: string | undefined) =>
  isTeacherRestrictedApplication({ isTeacher: true, programType, applicationType })

// 일반 프로그램(개인) — 참여자·봉사자 모집 제한
assert.equal(teacher('GENERAL_INDIVIDUAL', 'INDIVIDUAL'), true)
assert.equal(teacher('general_individual', ' individual '), true)
assert.equal(teacher('GENERAL_INDIVIDUAL', 'VOLUNTEER'), true)

// 그 외 프로그램 — 봉사자 모집만 제한
assert.equal(teacher('UJAT', 'VOLUNTEER'), true)
assert.equal(teacher('GENERAL_ORGANIZATION', 'VOLUNTEER'), true)
assert.equal(teacher(undefined, 'VOLUNTEER'), true)
assert.equal(teacher('UJAT', 'INDIVIDUAL'), false)
assert.equal(teacher('ECONOMY', 'INDIVIDUAL'), false)
assert.equal(teacher(undefined, 'INDIVIDUAL'), false)

// 기관·강사 모집은 제한하지 않음
assert.equal(teacher('GENERAL_ORGANIZATION', 'ORGANIZATION'), false)
assert.equal(teacher('GENERAL_INDIVIDUAL', 'INSTRUCTOR'), false)
assert.equal(teacher('GENERAL_INDIVIDUAL', undefined), false)

// 교사가 아니면 제한 없음
assert.equal(
  isTeacherRestrictedApplication({
    isTeacher: false,
    programType: 'GENERAL_INDIVIDUAL',
    applicationType: 'VOLUNTEER',
  }),
  false,
)

console.log('teacher-apply-restriction.selfcheck: ok')
