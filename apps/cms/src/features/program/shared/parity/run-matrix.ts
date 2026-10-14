import { writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'
import type { ParityScreenEntry } from './inventory-screens'
import { PARITY_SCREEN_INVENTORY } from './inventory-screens'
import { buildApiTruthSnapshot } from './api-truth'
import { buildUiExposedSnapshot } from './ui-exposed'
import { diffFlatRecords } from './diff'
import { listParityFixtures } from './load-fixture'
import type { Program } from '@/types/domain'

export type MatrixRowResult = {
  screenId: string
  fixtureId: string
  strictDiffCount: number
  liveDiffCount: number
  strictDiffs: ReturnType<typeof diffFlatRecords>
  skipped?: string
}

export type MatrixSummary = {
  generatedAt: string
  totalRows: number
  strictFailures: number
  liveWarnings: number
  rows: MatrixRowResult[]
}

function screenSupportsStrictParity(screen: ParityScreenEntry): boolean {
  return (
    screen.screenId === 'general.info.common' ||
    screen.screenId.startsWith('general.info.recruitment.') ||
    screen.screenId === 'registration.general.seed_to_detail' ||
    screen.screenId.startsWith('company_school.info')
  )
}

export function runParityMatrix(screens: readonly ParityScreenEntry[] = PARITY_SCREEN_INVENTORY): MatrixSummary {
  const fixtures = listParityFixtures()
  const rows: MatrixRowResult[] = []

  for (const screen of screens) {
    for (const fixture of fixtures) {
      if (!screenSupportsStrictParity(screen)) {
        rows.push({
          screenId: screen.screenId,
          fixtureId: fixture.fixtureId,
          strictDiffCount: 0,
          liveDiffCount: 0,
          strictDiffs: [],
          skipped: 'no_strict_builder',
        })
        continue
      }
      const program = fixture.program as Program
      const api = buildApiTruthSnapshot(screen, program)
      const strict = buildUiExposedSnapshot(screen, program, 'strict')
      const live = buildUiExposedSnapshot(screen, program, 'live')
      const strictDiffs = diffFlatRecords(api.flat, strict.flat)
      const liveDiffs = diffFlatRecords(api.flat, live.flat)
      rows.push({
        screenId: screen.screenId,
        fixtureId: fixture.fixtureId,
        strictDiffCount: strictDiffs.length,
        liveDiffCount: liveDiffs.length,
        strictDiffs,
      })
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    totalRows: rows.length,
    strictFailures: rows.filter(r => r.strictDiffCount > 0).length,
    liveWarnings: rows.filter(r => r.liveDiffCount > 0 && !r.skipped).length,
    rows,
  }
}

export function writeMatrixReport(summary: MatrixSummary, outDir: string): void {
  mkdirSync(outDir, { recursive: true })
  writeFileSync(join(outDir, 'summary.json'), `${JSON.stringify(summary, null, 2)}\n`)
  const md = `# Parity matrix summary

- Generated: ${summary.generatedAt}
- Rows: ${summary.totalRows}
- Strict failures: ${summary.strictFailures}
- Live warnings: ${summary.liveWarnings}

## Strict failures

| screenId | fixtureId | diff count |
| --- | --- | --- |
${summary.rows
  .filter(r => r.strictDiffCount > 0)
  .map(r => `| \`${r.screenId}\` | \`${r.fixtureId}\` | ${r.strictDiffCount} |`)
  .join('\n') || '| — | — | 0 |'}
`
  writeFileSync(join(outDir, 'summary.md'), md)
}
