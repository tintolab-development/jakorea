import { describe, expect, it } from 'vitest'
import { DETAILED_PROGRAM_BULK_MAX } from './bulk-update'
import {
  DETAILED_PROGRAM_NAME_DUPLICATE_MESSAGE,
  DETAILED_PROGRAM_NAME_REQUIRED_MESSAGE,
  DETAILED_PROGRAM_VERSION_MISSING_MESSAGE,
  isOwnNameRetention,
  planDetailedProgramSave,
} from './validate-edits'

const originals = {
  '1': { name: 'Alpha', active: true, version: 3 },
  '2': { name: 'Beta', active: false, version: 5 },
}

describe('planDetailedProgramSave', () => {
  it('builds a single bulk-update payload for changed rows with original versions', () => {
    const result = planDetailedProgramSave({
      originals,
      drafts: {
        '1': { name: 'Alpha 2', active: true, version: 3 },
        '2': { name: 'Beta', active: true, version: 5 },
      },
      stagedDeleteIds: [],
    })
    expect(result).toEqual({
      ok: true,
      plan: {
        deleteIds: [],
        updateItems: [
          { id: 1, nameKo: 'Alpha 2', useYn: true, version: 3 },
          { id: 2, nameKo: 'Beta', useYn: true, version: 5 },
        ],
      },
    })
  })

  it('skips unchanged rows and keeps own name', () => {
    expect(isOwnNameRetention('Alpha', 'alpha')).toBe(true)
    const result = planDetailedProgramSave({
      originals,
      drafts: {
        '1': { name: 'Alpha', active: true, version: 3 },
        '2': { name: 'Beta', active: false, version: 5 },
      },
      stagedDeleteIds: [],
    })
    expect(result).toEqual({ ok: true, plan: { deleteIds: [], updateItems: [] } })
  })

  it('blocks empty or whitespace names', () => {
    const result = planDetailedProgramSave({
      originals,
      drafts: {
        '1': { name: '   ', active: true, version: 3 },
        '2': { name: 'Beta', active: false, version: 5 },
      },
      stagedDeleteIds: [],
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.block.reason).toBe('required-name')
    expect(result.block).toMatchObject({
      message: DETAILED_PROGRAM_NAME_REQUIRED_MESSAGE,
      nameErrorById: { '1': DETAILED_PROGRAM_NAME_REQUIRED_MESSAGE },
    })
  })

  it('blocks duplicate names among current edit rows, case-insensitive', () => {
    const result = planDetailedProgramSave({
      originals,
      drafts: {
        '1': { name: 'beta', active: true, version: 3 },
        '2': { name: 'Beta', active: false, version: 5 },
      },
      stagedDeleteIds: [],
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.block.reason).toBe('duplicate-name')
    expect(result.block.message).toBe(DETAILED_PROGRAM_NAME_DUPLICATE_MESSAGE)
  })

  it('does not invent version 1 when the snapshot has no version', () => {
    const result = planDetailedProgramSave({
      originals: { '1': { name: 'Alpha', active: true } },
      drafts: { '1': { name: 'Alpha 2', active: true } },
      stagedDeleteIds: [],
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.block.reason).toBe('version-missing')
    expect(result.block.message).toBe(DETAILED_PROGRAM_VERSION_MISSING_MESSAGE)
  })

  it('blocks more than 500 update or delete items without splitting', () => {
    const manyOriginals = Object.fromEntries(
      Array.from({ length: DETAILED_PROGRAM_BULK_MAX + 1 }, (_, i) => [
        String(i + 1),
        { name: `N${i}`, active: true, version: 1 },
      ])
    )
    const manyDrafts = Object.fromEntries(
      Object.entries(manyOriginals).map(([id, row]) => [id, { ...row, name: `${row.name}-x` }])
    )
    const updateResult = planDetailedProgramSave({
      originals: manyOriginals,
      drafts: manyDrafts,
      stagedDeleteIds: [],
    })
    expect(updateResult.ok).toBe(false)
    if (!updateResult.ok) expect(updateResult.block.reason).toBe('over-max')

    const deleteResult = planDetailedProgramSave({
      originals,
      drafts: originals,
      stagedDeleteIds: Array.from({ length: DETAILED_PROGRAM_BULK_MAX + 1 }, (_, i) => String(i)),
    })
    expect(deleteResult.ok).toBe(false)
    if (!deleteResult.ok) expect(deleteResult.block.reason).toBe('over-max')
  })
})
