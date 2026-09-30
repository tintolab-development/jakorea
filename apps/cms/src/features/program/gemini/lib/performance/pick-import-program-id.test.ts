import { describe, expect, it } from 'vitest'
import { pickGeminiImportProgramId } from './pick-import-program-id'

describe('pickGeminiImportProgramId', () => {
  it('prefers the in-progress program in the latest business year', () => {
    expect(
      pickGeminiImportProgramId([
        { programId: 1, draftStatus: 'PUBLISHED', periodStatus: 'ENDED', businessYear: 2026 },
        { programId: 2, draftStatus: 'PUBLISHED', periodStatus: 'IN_PROGRESS', businessYear: 2026 },
        { programId: 3, draftStatus: 'DRAFT', periodStatus: 'IN_PROGRESS', businessYear: 2027 },
      ])
    ).toBe(2)
  })
})
