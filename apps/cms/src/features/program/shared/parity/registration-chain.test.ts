import { describe, expect, it } from 'vitest'
import { buildApiTruthSnapshot } from './api-truth'
import { buildUiExposedSnapshot } from './ui-exposed'
import { diffFlatRecords } from './diff'
import { parityScreenById } from './inventory-screens'
import { loadParityFixture } from './load-fixture'

describe('registration → detail seed chain', () => {
  const screen = parityScreenById('registration.general.seed_to_detail')

  it('seedGeneralRegistrationOverlayFromProgram aligns store with persisted overlay keys', () => {
    expect(screen).toBeDefined()
    const fixture =
      loadParityFixture('general-organization-nested_only') ??
      loadParityFixture('general-organization-overlay_only')
    expect(fixture).toBeDefined()
    if (!screen || !fixture) return

    const program = fixture.program
    const api = buildApiTruthSnapshot(screen, program)
    const ui = buildUiExposedSnapshot(screen, program, 'strict')
    const diffs = diffFlatRecords(api.flat, ui.flat)
    expect(diffs, JSON.stringify(diffs, null, 2)).toEqual([])
  })
})
