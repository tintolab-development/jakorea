import assert from 'node:assert/strict'
import { HERO_PHASE_PROGRESS } from './hero-copy.ts'
import {
  getHeroPhaseScrollY,
  getNextHeroPhase,
  getPreviousHeroPhase,
  resolveHeroPhase,
} from './hero-phase.ts'
import { resolveHeroPhaseWheelStep } from './introduction-scroll-phase.ts'

const RANGE = 10000

assert.equal(resolveHeroPhase(0, RANGE), 'idle')
assert.equal(resolveHeroPhase(RANGE * HERO_PHASE_PROGRESS.idle - 1, RANGE), 'idle')
assert.equal(resolveHeroPhase(RANGE * HERO_PHASE_PROGRESS.idle, RANGE), 'intro')
assert.equal(resolveHeroPhase(RANGE * HERO_PHASE_PROGRESS.intro - 1, RANGE), 'intro')
assert.equal(resolveHeroPhase(RANGE * HERO_PHASE_PROGRESS.intro, RANGE), 'message')
assert.equal(resolveHeroPhase(RANGE * HERO_PHASE_PROGRESS.message, RANGE), 'inspiring')
assert.equal(resolveHeroPhase(RANGE * HERO_PHASE_PROGRESS.inspiring, RANGE), 'vision')
assert.equal(resolveHeroPhase(RANGE * HERO_PHASE_PROGRESS.vision, RANGE), 'mission')
assert.equal(resolveHeroPhase(RANGE, RANGE), 'mission')

assert.equal(getNextHeroPhase('idle'), 'intro')
assert.equal(getNextHeroPhase('intro'), 'message')
assert.equal(getNextHeroPhase('mission'), null)
assert.equal(getPreviousHeroPhase('intro'), 'idle')
assert.equal(getPreviousHeroPhase('message'), 'intro')
assert.equal(getPreviousHeroPhase('idle'), null)

const idleY = getHeroPhaseScrollY('idle', RANGE)
assert.equal(idleY, 0)
assert.equal(resolveHeroPhase(idleY, RANGE), 'idle')

const introY = getHeroPhaseScrollY('intro', RANGE)
assert.equal(resolveHeroPhase(introY, RANGE), 'intro')
assert.ok(introY > RANGE * HERO_PHASE_PROGRESS.idle)

const messageY = getHeroPhaseScrollY('message', RANGE)
assert.equal(resolveHeroPhase(messageY, RANGE), 'message')

assert.deepEqual(resolveHeroPhaseWheelStep(0, 40, 64), {
  accumulated: 40,
  direction: 0,
})
assert.deepEqual(resolveHeroPhaseWheelStep(40, 40, 64), {
  accumulated: 0,
  direction: 1,
})
assert.deepEqual(resolveHeroPhaseWheelStep(0, -80, 64), {
  accumulated: 0,
  direction: -1,
})

console.log('hero-phase.selfcheck ok')
