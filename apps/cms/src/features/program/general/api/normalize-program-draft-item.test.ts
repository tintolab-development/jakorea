import { describe, expect, it } from 'vitest'
import {
  normalizeProgramDraftItem,
  normalizeProgramDraftSaveResponse,
} from './normalize-program-draft-item'

describe('normalizeProgramDraftItem', () => {
  it('unwraps nested draft field', () => {
    const item = normalizeProgramDraftItem({
      success: true,
      data: {
        draft: {
          draftId: 42,
          programType: 'GENERAL',
          draftPayload: { version: 1 },
        },
      },
    })
    expect(item?.draftId).toBe(42)
    expect(item?.programType).toBe('GENERAL')
  })

  it('supports legacy id + draftPayloadJson string', () => {
    const item = normalizeProgramDraftItem({
      success: true,
      data: {
        id: 99,
        programType: 'GENERAL',
        draftPayloadJson: JSON.stringify({ version: 1, registrationTemplateCode: 'registration-general' }),
      },
    })
    expect(item?.draftId).toBe(99)
    expect(item?.draftPayload?.version).toBe(1)
  })

  it('returns null when draft id is missing', () => {
    expect(normalizeProgramDraftItem({ success: true, data: {} })).toBeNull()
  })

  it('returns null when draft field is explicitly null', () => {
    expect(
      normalizeProgramDraftItem({
        success: true,
        data: { draft: null },
      })
    ).toBeNull()
  })
})

describe('normalizeProgramDraftSaveResponse', () => {
  it('reads draftId from save response', () => {
    const item = normalizeProgramDraftSaveResponse({
      success: true,
      data: { draftId: 7, programType: 'GENERAL', saved: true },
    })
    expect(item?.draftId).toBe(7)
  })
})
