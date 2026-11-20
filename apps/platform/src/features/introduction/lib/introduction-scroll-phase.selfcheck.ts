import assert from 'node:assert/strict'
import {
  getValueStepScrollY, resolveIntroductionScrollState, resolveWorldwideRevealProgress,
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
console.log('introduction-scroll-phase.selfcheck: ok')
