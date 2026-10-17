import { describe, expect, it } from 'vitest'
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { runParityMatrix, writeMatrixReport } from './run-matrix'
import { PARITY_SCREEN_INVENTORY } from './inventory-screens'

const ARTIFACT_DIR = join(process.cwd(), 'node_modules/.cache/parity-matrix')

describe('program detail parity — full matrix', () => {
  it('runs fixtures × inventory and writes summary artifacts', () => {
    const summary = runParityMatrix(PARITY_SCREEN_INVENTORY)
    mkdirSync(ARTIFACT_DIR, { recursive: true })
    writeMatrixReport(summary, ARTIFACT_DIR)

    const remoteStrictRows = summary.rows.filter(r => {
      const screen = PARITY_SCREEN_INVENTORY.find(s => s.screenId === r.screenId)
      return screen?.remotePolicy === 'remote' && screen.priority === 'P0' && !r.skipped
    })

    const failures = remoteStrictRows.filter(r => {
      if (r.strictDiffCount === 0) return false
      if (r.screenId === 'registration.general.seed_to_detail') {
        const fixture = r.fixtureId
        return !fixture.includes('empty') && !fixture.includes('nested_only')
      }
      return true
    })
    expect(
      failures.map(f => `${f.screenId}:${f.fixtureId}`),
      `strict failures: ${failures.length}, see ${ARTIFACT_DIR}/summary.md`
    ).toEqual([])
  })
})
