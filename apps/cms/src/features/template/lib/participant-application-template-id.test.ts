import { describe, expect, it } from 'vitest'
import {
  getParticipantApplicationEditorVariantForTemplateCode,
  getTemplateIdForParticipantApplicationVariant,
} from './participant-application-template-id'
import type { ProgramParticipantApplicationEditorVariant } from '@/features/template/hooks/use-program-participant-application-editor'

const VARIANTS: ProgramParticipantApplicationEditorVariant[] = [
  'institution',
  'individual',
  'economy-application-institution',
  'trained-teachers-application-institution',
  'gemini-application-institution',
  'gemini-application-instructor',
  'ujat-application-institution',
  'ujat-application-volunteer',
  'applicant-recruit-institution',
  'economy-recruit-institution',
  'trained-teachers-recruit-institution',
  'ujat-recruit-institution',
  'applicant-recruit-individual',
  'recruit-instructor',
  'recruit-volunteer',
  'ujat-recruit-volunteer',
  'gemini-recruit',
  'instructor',
  'volunteer',
]

describe('participant-application-template-id', () => {
  it('round-trips variant ↔ catalog code', () => {
    for (const variant of VARIANTS) {
      const code = getTemplateIdForParticipantApplicationVariant(variant)
      expect(getParticipantApplicationEditorVariantForTemplateCode(code)).toBe(variant)
    }
  })

  it('maps derived codes to the catalog variant', () => {
    expect(
      getParticipantApplicationEditorVariantForTemplateCode(
        'recruitment-participant-school-copy-99'
      )
    ).toBe('applicant-recruit-institution')
    expect(
      getParticipantApplicationEditorVariantForTemplateCode(
        'recruitment-participant-school-custom-01'
      )
    ).toBe('applicant-recruit-institution')
    expect(
      getParticipantApplicationEditorVariantForTemplateCode(
        'recruitment-participant-school-custom-01',
        'recruitment-participant-school'
      )
    ).toBe('applicant-recruit-institution')
  })
})
