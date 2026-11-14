import { describe, expect, it } from 'vitest'
import { createProgramApplicationFormInstructorDraft } from '@/features/template/model/program-application-form-instructor-draft'
import { createProgramParticipantApplicationDraft } from '@/features/template/model/program-application-form-individual-draft'
import {
  expectedSeedPrefixesForTemplateCode,
  isForeignSeedDraft,
  seedPrefixOf,
} from './form-seed-prefix'

/** BE canonical seed(local-demo/form-templates/application-*.json) 문단 ID의 seed 접두어 — 2026-11-13 대조 */
const BE_APPLICATION_SEED_PREFIXES: Record<string, string> = {
  'application-participant-school': 'program-application-institution-seed-',
  'application-participant-individual': 'program-participant-application-seed-',
  'application-instructor': 'program-instructor-application-seed-',
  'application-volunteer': 'program-volunteer-application-seed-',
  'application-economy': 'program-application-economy-seed-',
  'application-trained-teachers': 'program-application-trained-teachers-seed-',
  'application-ujat-school': 'ujat-program-application-institution-seed-',
  'application-ujat-volunteer': 'ujat-program-application-volunteer-seed-',
  'application-gemini-visiting-training-school': 'gemini-vt-inst-seed-',
  'application-gemini-visiting-training-instructor': 'gemini-vt-instructor-seed-',
}

describe('form-seed-prefix', () => {
  it('seedPrefixOf는 "-seed-"까지 자른다', () => {
    expect(seedPrefixOf('program-instructor-application-seed-personal-info')).toBe(
      'program-instructor-application-seed-'
    )
    expect(seedPrefixOf('user-added-paragraph-1')).toBeNull()
  })

  it.each(Object.entries(BE_APPLICATION_SEED_PREFIXES))(
    '%s FE seed 접두어가 BE seed 접두어와 같다',
    (templateCode, bePrefix) => {
      expect([...expectedSeedPrefixesForTemplateCode(templateCode)]).toEqual([bePrefix])
    }
  )

  it('다른 양식 seed draft만 foreign으로 본다', () => {
    const participantExpected = expectedSeedPrefixesForTemplateCode('application-participant-individual')
    expect(isForeignSeedDraft(createProgramApplicationFormInstructorDraft(), participantExpected)).toBe(true)
    expect(isForeignSeedDraft(createProgramParticipantApplicationDraft(), participantExpected)).toBe(false)
    // seed 문단이 없거나 기대 접두어를 모르면 판단하지 않는다
    expect(isForeignSeedDraft({ paragraphs: [] }, participantExpected)).toBe(false)
    expect(isForeignSeedDraft(createProgramApplicationFormInstructorDraft(), new Set())).toBe(false)
  })
})
