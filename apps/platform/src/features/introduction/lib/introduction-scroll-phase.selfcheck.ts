import assert from 'node:assert/strict'
import {
  getValueStepScrollY, isWheelInertia, resolveIntroductionScrollState, resolveWorldwideRevealProgress,
  INTRODUCTION_HERO_VH, INTRODUCTION_PUSH_VH, INTRODUCTION_VALUE_VH, INTRODUCTION_TRACK_VH,
} from './introduction-scroll-phase.ts'

const range = 15000
const start = range * (INTRODUCTION_HERO_VH + INTRODUCTION_PUSH_VH) / INTRODUCTION_TRACK_VH
const length = range * INTRODUCTION_VALUE_VH / INTRODUCTION_TRACK_VH
const at = (index: number) => start + (index + 0.5) * length / 6

assert.equal(getValueStepScrollY(0, range, 6, 1), null)
for (let i = 0; i < 5; i++) {
  const next = getValueStepScrollY(at(i), range, 6, 1)
  const previous = getValueStepScrollY(at(i + 1), range, 6, -1)
  assert.ok(next !== null && previous !== null)
  assert.equal(resolveIntroductionScrollState(next!, range, 6).activeValueIndex, i + 1)
  assert.equal(resolveIntroductionScrollState(previous!, range, 6).activeValueIndex, i)
}
const worldwide = getValueStepScrollY(at(5), range, 6, 1)
assert.ok(worldwide !== null && resolveWorldwideRevealProgress(worldwide, range) > 0)
const back = getValueStepScrollY(worldwide!, range, 6, -1)
assert.equal(resolveIntroductionScrollState(back!, range, 6).activeValueIndex, 5)
assert.equal(getValueStepScrollY(worldwide!, range, 6, 1), null)

// Mission → Push → 01..05 접힘 → Worldwide: 한 번에 한 화면, index0(=Push 화면) 정지 없음
const heroEnd = range * INTRODUCTION_HERO_VH / INTRODUCTION_TRACK_VH
const missionY = heroEnd * 0.95
assert.equal(resolveIntroductionScrollState(missionY, range, 6).heroPhase, 'mission')
assert.equal(getValueStepScrollY(heroEnd * 0.5, range, 6, 1), null) // Mission 이전은 Hero 스텝
assert.equal(getValueStepScrollY(missionY, range, 6, -1), null) // Mission 위는 Hero 스텝
let y = missionY
const downStates: string[] = []
for (;;) {
  const next = getValueStepScrollY(y, range, 6, 1)
  if (next === null) break
  y = next
  const s = resolveIntroductionScrollState(y, range, 6)
  downStates.push(`${s.isFramePushed ? 'P' : 'H'}${s.activeValueIndex}${resolveWorldwideRevealProgress(y, range) > 0 ? 'W' : ''}`)
}
assert.deepEqual(downStates, ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P5W'])
const upStates: string[] = []
for (;;) {
  const prev = getValueStepScrollY(y, range, 6, -1)
  if (prev === null) break
  y = prev
  const s = resolveIntroductionScrollState(y, range, 6)
  upStates.push(`${s.isFramePushed ? 'P' : 'H'}${s.activeValueIndex}:${s.heroPhase}`)
}
assert.deepEqual(upStates, ['P5:exit', 'P4:exit', 'P3:exit', 'P2:exit', 'P1:exit', 'P0:mission', 'H0:mission'])
// 네이티브 스크롤로 index0 구간에 있어도 아래 한 번이면 01 접힘
assert.equal(resolveIntroductionScrollState(getValueStepScrollY(start + 1, range, 6, 1)!, range, 6).activeValueIndex, 1)

// 관성: 같은 제스처에서 감소하는 delta만 무시, 마우스 고정 delta·새 제스처는 통과
assert.equal(isWheelInertia(16, 40, 60), true)
assert.equal(isWheelInertia(16, 100, 100), false)
assert.equal(isWheelInertia(400, 10, 60), false)
assert.equal(isWheelInertia(16, 80, 40), false)
console.log('introduction-scroll-phase.selfcheck: ok')
