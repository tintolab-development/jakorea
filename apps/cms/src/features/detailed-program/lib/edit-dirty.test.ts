import { describe, expect, it } from 'vitest'
import { hasUnsavedDetailedProgramEdits } from './edit-dirty'

const original = { '1': { name: 'A', active: true } }

describe('hasUnsavedDetailedProgramEdits', () => {
  it('is false when only edit mode is entered', () => {
    expect(
      hasUnsavedDetailedProgramEdits({
        originals: original,
        drafts: { '1': { name: 'A', active: true, version: 2 } },
        stagedDeleteIds: [],
      })
    ).toBe(false)
  })

  it('detects name, useYn, and staged delete changes', () => {
    expect(
      hasUnsavedDetailedProgramEdits({
        originals: original,
        drafts: { '1': { name: 'B', active: true, version: 2 } },
        stagedDeleteIds: [],
      })
    ).toBe(true)
    expect(
      hasUnsavedDetailedProgramEdits({
        originals: original,
        drafts: { '1': { name: 'A', active: false, version: 2 } },
        stagedDeleteIds: [],
      })
    ).toBe(true)
    expect(
      hasUnsavedDetailedProgramEdits({
        originals: original,
        drafts: { '1': { name: 'A', active: true, version: 2 } },
        stagedDeleteIds: ['1'],
      })
    ).toBe(true)
  })
})
