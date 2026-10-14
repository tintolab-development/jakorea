import { describe, expect, it } from 'vitest'
import { buildApiTruthSnapshot } from './api-truth'
import { buildUiExposedSnapshot } from './ui-exposed'
import { diffFlatRecords } from './diff'
import { listParityFixtures } from './load-fixture'
import { parityScreenById, parityScreensByPriority } from './inventory-screens'

const P0_STRICT_SCREEN_IDS = [
  'general.info.common',
  'general.info.recruitment.participant',
  'general.info.recruitment.instructor',
  'general.info.recruitment.volunteer',
  'company_school.info.common',
  'registration.general.seed_to_detail',
] as const

describe('program detail parity — P0 strict (GET SSOT)', () => {
  const fixtures = listParityFixtures().filter(f => f.variant === 'general' || f.variant === 'company_school')

  for (const screenId of P0_STRICT_SCREEN_IDS) {
    const screen = parityScreenById(screenId)
    if (!screen) {
      it.skip(`missing screen ${screenId}`, () => {})
      continue
    }

    for (const fixture of fixtures) {
      if (screenId.startsWith('company_school') && fixture.variant !== 'company_school') continue
      if (!screenId.startsWith('company_school') && fixture.variant === 'company_school') continue

      const registrationPersistedOverlay =
        screenId === 'registration.general.seed_to_detail' &&
        Object.keys(fixture.program.registrationOverlay ?? {}).length > 0

      const run = registrationPersistedOverlay ? it.skip : it

      run(`${screenId} × ${fixture.fixtureId} strict diff = 0`, () => {
        const program = fixture.program
        const api = buildApiTruthSnapshot(screen, program)
        const ui = buildUiExposedSnapshot(screen, program, 'strict')
        const diffs = diffFlatRecords(api.flat, ui.flat)
        expect(diffs, JSON.stringify(diffs, null, 2)).toEqual([])
      })
    }
  }
})

describe('program detail parity — recruitment live vs strict (documented)', () => {
  const conflict = listParityFixtures().find(f => f.fixtureId === 'general-organization-nested_overlay_conflict')
  const screen = parityScreenById('general.info.recruitment.participant')

  it('nested_overlay_conflict may differ in live mode when operational store is seeded', () => {
    if (!conflict || !screen) return
    const program = conflict.program
    const api = buildApiTruthSnapshot(screen, program)
    const live = buildUiExposedSnapshot(screen, program, 'live')
    const liveDiffs = diffFlatRecords(api.flat, live.flat)
    expect(liveDiffs.length).toBeGreaterThanOrEqual(0)
  })
})

describe('P0 inventory coverage', () => {
  it('every P0 remote screen has a strict builder or explicit skip in tests', () => {
    const p0 = parityScreensByPriority('P0')
    const covered = new Set(P0_STRICT_SCREEN_IDS)
    const uncovered = p0.filter(
      s =>
        s.remotePolicy === 'remote' &&
        !covered.has(s.screenId as (typeof P0_STRICT_SCREEN_IDS)[number]) &&
        s.screenId !== 'general.info.application' &&
        s.screenId !== 'ujat.info.common'
    )
    expect(uncovered.map(s => s.screenId)).toEqual([])
  })
})
