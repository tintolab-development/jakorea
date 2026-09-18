import { describe, expect, it } from 'vitest'
import {
  createProgramParticipantApplicationDraft,
  migrateProgramParticipantApplicationParagraphs,
} from '@/features/template/model/program-application-form-individual-draft'
import { createProgramApplicationFormVolunteerDraft } from '@/features/template/model/program-application-form-volunteer-draft'

describe('migrateProgramParticipantApplicationParagraphs', () => {
  it('keeps the catalog individual application paragraphs', () => {
    const draft = createProgramParticipantApplicationDraft()
    expect(migrateProgramParticipantApplicationParagraphs(draft)).toBe(draft)
    expect(draft.paragraphs.some(p => p.paragraphTitle === '면접 진행 가능 일정')).toBe(false)
  })

  it('strips volunteer interview schedule paragraphs leaked into individual draft', () => {
    const individual = createProgramParticipantApplicationDraft()
    const volunteer = createProgramApplicationFormVolunteerDraft()
    const interview = volunteer.paragraphs.find(p => p.paragraphTitle === '면접 진행 가능 일정')
    expect(interview).toBeDefined()

    const polluted = {
      ...individual,
      paragraphs: [...individual.paragraphs, interview!],
    }
    const cleaned = migrateProgramParticipantApplicationParagraphs(polluted)
    expect(cleaned.paragraphs.some(p => p.paragraphTitle === '면접 진행 가능 일정')).toBe(false)
    expect(cleaned.paragraphs).toHaveLength(individual.paragraphs.length)
  })
})
