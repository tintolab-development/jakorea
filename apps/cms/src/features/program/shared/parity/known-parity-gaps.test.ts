import { describe, expect, it } from 'vitest'
import { buildApiTruthSnapshot } from './api-truth'
import { buildUiExposedSnapshot } from './ui-exposed'
import { diffFlatRecords } from './diff'
import { parityScreenById } from './inventory-screens'
import { loadParityFixture } from './load-fixture'

/**
 * persisted recruit overlay 시드 vs GET registrationOverlay — 현재 strict 불일치(백로그).
 * Gate(P0)는 빈 overlay fixture만 사용하고, 여기서 diff를 기록한다.
 */
describe('program detail parity — known gaps (registration overlay persist)', () => {
  const screen = parityScreenById('registration.general.seed_to_detail')

  it('general-organization-overlay_only: recruit.detailInfo persisted keys not rehydrated to store', () => {
    const fixture = loadParityFixture('general-organization-overlay_only')
    expect(screen).toBeDefined()
    expect(fixture).toBeDefined()
    if (!screen || !fixture) return

    const api = buildApiTruthSnapshot(screen, fixture.program)
    const ui = buildUiExposedSnapshot(screen, fixture.program, 'strict')
    const diffs = diffFlatRecords(api.flat, ui.flat)
    expect(diffs.length).toBeGreaterThan(0)
    expect(diffs.some(d => d.path.includes('recruit.detailInfo'))).toBe(true)
  })

  it('general-organization-nested_overlay_conflict: nested wins over overlay on recruit.detailInfo', () => {
    const fixture = loadParityFixture('general-organization-nested_overlay_conflict')
    expect(screen).toBeDefined()
    expect(fixture).toBeDefined()
    if (!screen || !fixture) return

    const api = buildApiTruthSnapshot(screen, fixture.program)
    const ui = buildUiExposedSnapshot(screen, fixture.program, 'strict')
    const diffs = diffFlatRecords(api.flat, ui.flat)
    expect(
      diffs.some(
        d =>
          d.path.includes('recruit.detailInfo.programDescription') &&
          d.apiTruth === 'overlay-participant-desc' &&
          d.uiExposed === 'nested-participant-desc'
      )
    ).toBe(true)
  })
})
