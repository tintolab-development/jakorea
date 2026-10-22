import { describe, expect, it } from 'vitest'
import { resolveDetailedProgramSaveCall } from './save-call'
import { planDetailedProgramSave } from './validate-edits'

const originals = {
  '1': { name: 'Alpha', active: true, version: 3 },
  '2': { name: 'Beta', active: false, version: 5 },
  '3': { name: 'Gamma', active: true, version: 2 },
}

describe('resolveDetailedProgramSaveCall', () => {
  it('uses bulk-changes once for 2 updates + 1 delete', () => {
    const planned = planDetailedProgramSave({
      originals,
      drafts: {
        '1': { name: 'Alpha 2', active: true, version: 3 },
        '2': { name: 'Beta', active: true, version: 5 },
        '3': { name: 'Gamma', active: true, version: 2 },
      },
      stagedDeleteIds: ['3'],
    })
    expect(planned.ok).toBe(true)
    if (!planned.ok) return
    expect(resolveDetailedProgramSaveCall(planned.plan)).toEqual({
      kind: 'bulk-changes',
      request: {
        updates: [
          { id: 1, nameKo: 'Alpha 2', useYn: true, version: 3 },
          { id: 2, nameKo: 'Beta', useYn: true, version: 5 },
        ],
        deleteItems: [{ id: 3, version: 2 }],
      },
    })
  })

  it('keeps bulk-update for updates only and bulk-delete for deletes only', () => {
    const updateOnly = planDetailedProgramSave({
      originals,
      drafts: {
        '1': { name: 'Alpha 2', active: true, version: 3 },
        '2': { name: 'Beta', active: false, version: 5 },
        '3': { name: 'Gamma', active: true, version: 2 },
      },
      stagedDeleteIds: [],
    })
    expect(updateOnly.ok).toBe(true)
    if (!updateOnly.ok) return
    expect(resolveDetailedProgramSaveCall(updateOnly.plan).kind).toBe('bulk-update')

    const deleteOnly = planDetailedProgramSave({
      originals,
      drafts: originals,
      stagedDeleteIds: ['3'],
    })
    expect(deleteOnly.ok).toBe(true)
    if (!deleteOnly.ok) return
    expect(resolveDetailedProgramSaveCall(deleteOnly.plan)).toEqual({
      kind: 'bulk-delete',
      ids: ['3'],
    })
  })

  it('never splits mixed save into sequential update then delete', () => {
    const planned = planDetailedProgramSave({
      originals,
      drafts: {
        '1': { name: 'Alpha 2', active: true, version: 3 },
        '2': { name: 'Beta', active: false, version: 5 },
        '3': { name: 'Gamma', active: true, version: 2 },
      },
      stagedDeleteIds: ['3'],
    })
    expect(planned.ok).toBe(true)
    if (!planned.ok) return
    const saveCall = resolveDetailedProgramSaveCall(planned.plan)
    expect(saveCall.kind).toBe('bulk-changes')
    expect(saveCall).not.toMatchObject({ kind: 'bulk-update' })
    expect(saveCall).not.toMatchObject({ kind: 'bulk-delete' })
  })
})
