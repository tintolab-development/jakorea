import { describe, expect, it } from 'vitest'
import { planBusinessAreaSave, rebasePendingBusinessAreaDraft } from './business-area-save-plan'
import type { TextbookBusinessAreaRow } from '@/features/textbook/model/business-area.types'

const row = (id: string, name: string): TextbookBusinessAreaRow =>
  ({ id, name, textbookCount: 0, deletable: true })

describe('business-area partial-save recovery', () => {
  it('preserves operation ordering and retries only outstanding changes', () => {
    const old = [row('1', 'old'), row('2', 'delete')]
    const draft = [row('1', 'renamed'), row('draft-1', 'new')]
    const ops = planBusinessAreaSave(old, draft)
    expect(ops.map(op => op.kind)).toEqual(['update', 'create', 'delete'])
    const server = [row('1', 'renamed'), row('2', 'delete'), row('3', 'new'), row('4', 'concurrent')]
    const rebased = rebasePendingBusinessAreaDraft(server, ops.slice(1))
    expect(rebased.map(item => item.id)).toEqual(['1', '3', '4'])
    expect(planBusinessAreaSave(server, rebased)).toEqual([{ kind: 'delete', row: server[1] }])
  })

  it('does not recreate a concurrently deleted row or duplicate a committed create', () => {
    const original = [row('1', 'old')]
    const ops = planBusinessAreaSave(original, [row('1', 'renamed'), row('draft-1', 'new')])
    const server = [row('9', 'new')]
    expect(rebasePendingBusinessAreaDraft(server, ops)).toEqual(server)
  })
})
