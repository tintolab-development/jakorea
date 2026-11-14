import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { WritingFormDraft } from '@/features/template/model/writing-form-draft.schema'
import {
  APPLICATION_FORM_PERSONAL_INFO_RETENTION_CELL,
  APPLICATION_FORM_THIRD_PARTY_RETENTION_CELL,
  TRAINED_TEACHERS_APPLICATION_FORM_PERSONAL_INFO_RETENTION_CELL,
} from '@jakorea/form-schema/paragraph-ids/application-form-privacy-retention'
import { createProgramParticipantApplicationDraft } from '@/features/template/model/program-application-form-individual-draft'
import { createProgramApplicationFormTrainedTeachersDraft } from '@/features/template/model/program-application-form-trained-teachers-draft'
import { createProgramApplicationFormInstructorDraft } from '@/features/template/model/program-application-form-instructor-draft'
import { createRecruitFormVolunteerDraft } from '@/features/template/model/recruit-form-volunteer-draft'

const loadWritingFormTemplateDraft = vi.fn()

vi.mock('@/features/template/lib/writing-form-template-local-save', () => ({
  loadWritingFormTemplateDraft: (...args: unknown[]) => loadWritingFormTemplateDraft(...args),
  persistWritingFormTemplateDraft: vi.fn(),
  removeWritingFormTemplateSave: vi.fn(),
  removeWritingFormTemplateSavesByPrefix: vi.fn(),
  captureWritingFormTemplateSavesByPrefix: vi.fn(),
  restoreWritingFormTemplateSavesByPrefix: vi.fn(),
}))

import { loadRegistrationWizardFormDraft } from './registration-wizard-form-draft'

type Cell = { kind: string; value?: string }

function lastCellValue(draft: WritingFormDraft, paragraphId: string): string | undefined {
  const paragraph = draft.paragraphs.find(p => p.id === paragraphId) as
    | { fieldDataRows?: Cell[][] }
    | undefined
  const row = paragraph?.fieldDataRows?.[0]
  return row?.[row.length - 1]?.value
}

/** 보유기간 셀만 구 문구로 바꾼 임시저장본 */
function withStaleRetention(draft: WritingFormDraft, staleValue: string): WritingFormDraft {
  return {
    ...draft,
    paragraphs: draft.paragraphs.map(p => {
      if (!/-seed-(personal-info|third-party)$/.test(p.id)) return p
      const rows = ((p as { fieldDataRows?: Cell[][] }).fieldDataRows ?? []).map(row =>
        row.map((cell, index) => (index === row.length - 1 ? { ...cell, value: staleValue } : cell))
      )
      return { ...p, fieldDataRows: rows }
    }),
  } as WritingFormDraft
}

const STALE = '- 보유 기간: 동의일로부터 3년 보관 후 STALE'

describe('loadRegistrationWizardFormDraft — 신청서 임시저장본 보정', () => {
  beforeEach(() => {
    loadWritingFormTemplateDraft.mockReset()
  })

  it.each([
    [
      'application-participant-individual',
      createProgramParticipantApplicationDraft,
      'program-participant-application-seed-personal-info',
      'program-participant-application-seed-third-party',
      APPLICATION_FORM_PERSONAL_INFO_RETENTION_CELL,
    ],
    [
      'application-trained-teachers',
      createProgramApplicationFormTrainedTeachersDraft,
      'program-application-trained-teachers-seed-personal-info',
      'program-application-trained-teachers-seed-third-party',
      TRAINED_TEACHERS_APPLICATION_FORM_PERSONAL_INFO_RETENTION_CELL,
    ],
    [
      'application-instructor',
      createProgramApplicationFormInstructorDraft,
      'program-instructor-application-seed-personal-info',
      'program-instructor-application-seed-third-party',
      APPLICATION_FORM_PERSONAL_INFO_RETENTION_CELL,
    ],
  ])('%s 구 보유기간 문구를 공통 상수로 바꾼다', async (templateCode, create, personalId, thirdPartyId, personalCell) => {
    loadWritingFormTemplateDraft.mockResolvedValue({
      draft: withStaleRetention(create(), STALE),
      overlay: { keep: 'me' },
    })

    const saved = await loadRegistrationWizardFormDraft({ programType: 'GENERAL', templateCode })

    expect(lastCellValue(saved!.draft, personalId)).toBe(personalCell)
    expect(lastCellValue(saved!.draft, thirdPartyId)).toBe(APPLICATION_FORM_THIRD_PARTY_RETENTION_CELL)
    expect(saved!.overlay).toEqual({ keep: 'me' })
    expect(loadWritingFormTemplateDraft).toHaveBeenCalledWith(`registration-wizard:GENERAL:${templateCode}`, {
      localOnly: true,
    })
  })

  it('이미 최신 문구인 신청서 임시저장본은 같은 객체를 돌려준다', async () => {
    const record = { draft: createProgramParticipantApplicationDraft() }
    loadWritingFormTemplateDraft.mockResolvedValue(record)
    const saved = await loadRegistrationWizardFormDraft({
      programType: 'GENERAL',
      templateCode: 'application-participant-individual',
    })
    expect(saved).toBe(record)
  })

  it('모집 양식·빈 임시저장본은 보정하지 않는다', async () => {
    const recruit = { draft: createRecruitFormVolunteerDraft() }
    loadWritingFormTemplateDraft.mockResolvedValueOnce(recruit)
    expect(
      await loadRegistrationWizardFormDraft({ programType: 'GENERAL', templateCode: 'recruitment-volunteer' })
    ).toBe(recruit)

    loadWritingFormTemplateDraft.mockResolvedValueOnce(null)
    expect(
      await loadRegistrationWizardFormDraft({
        programType: 'GENERAL',
        templateCode: 'application-participant-individual',
      })
    ).toBeNull()
  })
})
