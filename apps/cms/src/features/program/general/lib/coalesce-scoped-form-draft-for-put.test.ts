import { describe, expect, it } from 'vitest'
import { createProgramParticipantApplicationDraft } from '@/features/template/model/program-application-form-individual-draft'
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

  it('drops editor-only keys (e.g. short_essay items) not present on baseline for seed paragraphs', () => {
    const baseline = createProgramParticipantApplicationDraft()
    const selfIntroId = 'program-participant-application-seed-self-intro'
    const userDraft = {
      ...baseline,
      paragraphs: baseline.paragraphs.map(p =>
        p.id === selfIntroId
          ? {
              ...p,
              paragraphTitle: '3자기소개 및 지원동기',
              items: [
                {
                  id: 'short-essay-item-1',
                  label: 'Title 01',
                  placeholder: '자유롭게 작성해 주세요',
                  bodyText: '',
                },
              ],
            }
          : p
      ),
    }

    const merged = coalesceScopedFormDraftForPut(baseline, userDraft)
    const selfIntro = merged.paragraphs.find(p => p.id === selfIntroId)
    expect(selfIntro?.paragraphTitle).toBe('3자기소개 및 지원동기')
    expect('items' in (selfIntro ?? {})).toBe(false)
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
