import { describe, expect, it, vi } from 'vitest'
import {
  createProgramParticipantApplicationDraft,
  PROGRAM_PARTICIPANT_APPLICATION_IDS,
} from '@/features/template/model/program-application-form-individual-draft'
import {
  createProgramApplicationFormInstructorDraft,
  PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS,
} from '@/features/template/model/program-application-form-instructor-draft'
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

  it('restores the last (retention) cell of privacy tables from baseline, keeping other user cells', () => {
    const baseline = createProgramParticipantApplicationDraft()
    const privacyIds: string[] = [
      PROGRAM_PARTICIPANT_APPLICATION_IDS.personalInfoCollection,
      PROGRAM_PARTICIPANT_APPLICATION_IDS.thirdPartyConsent,
    ]
    type Cell = { kind: string; value?: string }
    const rowsOf = (paragraph: unknown): Cell[][] =>
      ((paragraph as { fieldDataRows?: Cell[][] }).fieldDataRows ?? []) as Cell[][]

    const userDraft = {
      ...baseline,
      paragraphs: baseline.paragraphs.map(p => {
        if (!privacyIds.includes(p.id)) return p
        return {
          ...p,
          fieldDataRows: rowsOf(p).map(row =>
            row.map((cell, index) =>
              index === 0
                ? { ...cell, value: '사용자 수정 셀' }
                : index === row.length - 1
                  ? { ...cell, value: '동의일로부터 3년 보관 후 STALE' }
                  : cell
            )
          ),
        }
      }),
    } as typeof baseline

    const merged = coalesceScopedFormDraftForPut(baseline, userDraft)
    for (const id of privacyIds) {
      const baseRows = rowsOf(baseline.paragraphs.find(p => p.id === id))
      const mergedRows = rowsOf(merged.paragraphs.find(p => p.id === id))
      expect(baseRows.length).toBeGreaterThan(0)
      expect(mergedRows.length).toBe(baseRows.length)
      mergedRows.forEach((row, rowIndex) => {
        const baseRow = baseRows[rowIndex]!
        expect(row[row.length - 1]?.value).toBe(baseRow[baseRow.length - 1]?.value)
        expect(row[0]?.value).toBe('사용자 수정 셀')
      })
    }
  })

  it('drops user paragraphs carrying another form’s seed id (FOREIGN_PROTECTED_ID guard)', () => {
    const baseline = createProgramParticipantApplicationDraft()
    const foreignSeed = createProgramApplicationFormInstructorDraft().paragraphs.find(
      p => p.id === PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.personalInfoCollection
    )!
    const userAdded = { ...baseline.paragraphs[0]!, id: 'user-added-paragraph-1', paragraphTitle: '사용자 문단' }
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const userDraft = {
      ...baseline,
      paragraphs: [...baseline.paragraphs, foreignSeed, userAdded],
    }
    const merged = coalesceScopedFormDraftForPut(baseline, userDraft)
    const ids = merged.paragraphs.map(p => p.id)

    expect(ids).not.toContain(PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.personalInfoCollection)
    expect(ids).toEqual([...baseline.paragraphs.map(p => p.id), 'user-added-paragraph-1'])
    expect(warn).toHaveBeenCalledTimes(1)
    warn.mockRestore()
  })

  it('keeps inserting plain user paragraphs (no -seed-) right after the preceding baseline paragraph', () => {
    const baseline = createProgramParticipantApplicationDraft()
    expect(baseline.paragraphs.length).toBeGreaterThanOrEqual(3)
    const first = { ...baseline.paragraphs[0]!, id: 'user-added-a', paragraphTitle: 'A' }
    const second = { ...baseline.paragraphs[0]!, id: 'user-added-b', paragraphTitle: 'B' }
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const userDraft = {
      ...baseline,
      paragraphs: [
        baseline.paragraphs[0]!,
        baseline.paragraphs[1]!,
        first,
        second,
        ...baseline.paragraphs.slice(2),
      ],
    }
    const merged = coalesceScopedFormDraftForPut(baseline, userDraft)
    expect(merged.paragraphs.map(p => p.id)).toEqual([
      baseline.paragraphs[0]!.id,
      baseline.paragraphs[1]!.id,
      'user-added-a',
      'user-added-b',
      ...baseline.paragraphs.slice(2).map(p => p.id),
    ])
    expect(merged.paragraphs.find(p => p.id === 'user-added-b')?.paragraphTitle).toBe('B')
    expect(warn).not.toHaveBeenCalled()
    warn.mockRestore()
  })
})
