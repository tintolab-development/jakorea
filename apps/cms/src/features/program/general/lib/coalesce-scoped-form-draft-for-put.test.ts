import { describe, expect, it } from 'vitest'
import { createProgramRegistrationDraft } from '@/features/template/model/program-registration-draft'
import { coalesceScopedFormDraftForPut } from './coalesce-scoped-form-draft-for-put'

describe('coalesceScopedFormDraftForPut', () => {
  it('keeps protected seed paragraph id and kind from baseline', () => {
    const baseline = createProgramRegistrationDraft('general')
    const seedId = baseline.paragraphs[0]?.id
    expect(seedId).toBeDefined()

    const userDraft = {
      ...baseline,
      paragraphs: baseline.paragraphs.map((p, index) =>
        index === 0 ? { ...p, paragraphTitle: '사용자 제목' } : p
      ),
    }

    const merged = coalesceScopedFormDraftForPut(baseline, userDraft)
    expect(merged.paragraphs[0]?.id).toBe(seedId)
    expect(merged.paragraphs[0]?.paragraphTitle).toBe('사용자 제목')

    const idTamperDraft = {
      ...baseline,
      paragraphs: baseline.paragraphs.map((p, index) =>
        index === 0 ? { ...p, id: 'user-overwrite-id', paragraphTitle: '침해 시도' } : p
      ),
    }
    const tamperMerged = coalesceScopedFormDraftForPut(baseline, idTamperDraft)
    expect(tamperMerged.paragraphs[0]?.id).toBe(seedId)
    expect(tamperMerged.paragraphs[0]?.paragraphTitle).toBe(baseline.paragraphs[0]?.paragraphTitle)
  })

  it('inserts a newly added paragraph at its userDraft position, not at the end', () => {
    const baseline = createProgramRegistrationDraft('general')
    expect(baseline.paragraphs.length).toBeGreaterThanOrEqual(3)

    const newParagraph = {
      ...baseline.paragraphs[0]!,
      id: 'new-paragraph-inserted-second',
      paragraphTitle: '새로 추가한 단락',
    }

    const userDraft = {
      ...baseline,
      paragraphs: [
        baseline.paragraphs[0]!,
        newParagraph,
        ...baseline.paragraphs.slice(1),
      ],
    }

    const merged = coalesceScopedFormDraftForPut(baseline, userDraft)
    expect(merged.paragraphs.map(p => p.id)).toEqual([
      baseline.paragraphs[0]!.id,
      'new-paragraph-inserted-second',
      ...baseline.paragraphs.slice(1).map(p => p.id),
    ])
  })
})
