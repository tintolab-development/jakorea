/**
 * 미성년 프로그램 신청 — 시도별 초상권 동의 진행 상태(sessionStorage)
 */
import assert from 'node:assert/strict'
import {
  clearProgramMinorPortraitAttempt,
  isProgramMinorPortraitAttemptSatisfied,
  markProgramMinorPortraitConsentCompleted,
  markProgramMinorPortraitGuardianVerified,
  programMinorPortraitAttemptStorageKey,
  readProgramMinorPortraitAttempt,
} from './program-minor-portrait-attempt.ts'

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (key: string) => map.get(key) ?? null,
    setItem: (key: string, value: string) => {
      map.set(key, value)
    },
    removeItem: (key: string) => {
      map.delete(key)
    },
    size: () => map.size,
  }
}

assert.equal(programMinorPortraitAttemptStorageKey('12'), 'jakorea:program-minor-portrait-attempt:12')
assert.equal(programMinorPortraitAttemptStorageKey(12), 'jakorea:program-minor-portrait-attempt:12')
assert.equal(programMinorPortraitAttemptStorageKey('abc'), null)
assert.equal(programMinorPortraitAttemptStorageKey(null), null)

const storage = memoryStorage()

// 아무 것도 없으면 미충족
assert.equal(isProgramMinorPortraitAttemptSatisfied('12', storage), false)
assert.equal(readProgramMinorPortraitAttempt('12', storage), null)

// 동의서 완료만 먼저 표시할 수는 없다(보호자 인증 선행)
assert.equal(markProgramMinorPortraitConsentCompleted('12', '2026-10-29T12:00:00Z', storage), false)
assert.equal(isProgramMinorPortraitAttemptSatisfied('12', storage), false)

// 보호자 인증만 → 아직 미충족
markProgramMinorPortraitGuardianVerified('12', '2026-10-29T11:00:00Z', storage)
assert.equal(isProgramMinorPortraitAttemptSatisfied('12', storage), false)
assert.deepEqual(readProgramMinorPortraitAttempt('12', storage), {
  guardianVerifiedAt: '2026-10-29T11:00:00Z',
  consentCompletedAt: undefined,
})

// 동의서 완료 → 충족, 다른 프로그램에는 영향 없음
assert.equal(markProgramMinorPortraitConsentCompleted('12', '2026-10-29T12:00:00Z', storage), true)
assert.equal(isProgramMinorPortraitAttemptSatisfied('12', storage), true)
assert.equal(isProgramMinorPortraitAttemptSatisfied('13', storage), false)

// 새 보호자 인증은 새 시도 — 이전 동의 완료 표시는 지운다
markProgramMinorPortraitGuardianVerified('12', '2026-10-29T13:00:00Z', storage)
assert.equal(isProgramMinorPortraitAttemptSatisfied('12', storage), false)

// 제출 성공 후 정리
markProgramMinorPortraitConsentCompleted('12', '2026-10-29T13:05:00Z', storage)
clearProgramMinorPortraitAttempt('12', storage)
assert.equal(isProgramMinorPortraitAttemptSatisfied('12', storage), false)
assert.equal(storage.size(), 0)

// 손상된 값은 무시
storage.setItem('jakorea:program-minor-portrait-attempt:12', '{not json')
assert.equal(readProgramMinorPortraitAttempt('12', storage), null)
storage.setItem('jakorea:program-minor-portrait-attempt:12', JSON.stringify({ consentCompletedAt: 'x' }))
assert.equal(isProgramMinorPortraitAttemptSatisfied('12', storage), false)

// storage 없음(SSR 등) — 예외 없이 미충족
assert.equal(isProgramMinorPortraitAttemptSatisfied('12', null), false)

console.log('program-minor-portrait-attempt selfcheck ok')
