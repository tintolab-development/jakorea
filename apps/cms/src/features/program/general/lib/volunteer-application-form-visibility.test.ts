import { describe, expect, it } from 'vitest'
import {
  PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS,
  PROGRAM_VOLUNTEER_JA_EXPERIENCE_OPTION_IDS,
  createProgramApplicationFormVolunteerDraft,
} from '@/features/template/model/program-application-form-volunteer-draft'
import type { MultipleChoiceParagraph } from '@/features/template/model/writing-form-draft.schema'
import { getVolunteerApplicationFormHiddenParagraphIds } from './volunteer-application-form-visibility'

describe('getVolunteerApplicationFormHiddenParagraphIds', () => {
  it('경험 「있음」 선택 시 이전 참여 단락을 노출한다', () => {
    const draft = createProgramApplicationFormVolunteerDraft()
    const paragraphs = draft.paragraphs.map(p => {
      if (p.id !== PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.jaVolunteerExperience) return p
      return {
        ...(p as MultipleChoiceParagraph),
        selectedPreviewSingleId: PROGRAM_VOLUNTEER_JA_EXPERIENCE_OPTION_IDS.yes,
      }
    })
    expect(getVolunteerApplicationFormHiddenParagraphIds(paragraphs)).toBeUndefined()
  })

  it('경험 「없음」 또는 미선택 시 이전 참여 단락을 숨긴다', () => {
    const draft = createProgramApplicationFormVolunteerDraft()
    const hidden = getVolunteerApplicationFormHiddenParagraphIds(draft.paragraphs)
    expect(hidden?.has(PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.previousJaProgram)).toBe(true)
  })

  it('면접 없음 프로그램이면 면접 일정 단락을 숨긴다', () => {
    const draft = createProgramApplicationFormVolunteerDraft()
    const hidden = getVolunteerApplicationFormHiddenParagraphIds(draft.paragraphs, {
      interviewEnabled: false,
    })
    expect(hidden?.has(PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.interviewSchedule)).toBe(true)
  })
})
