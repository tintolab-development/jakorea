import { describe, expect, it } from 'vitest'
import {
  createRegistrationProgramDraftPayload,
  parseRegistrationProgramDraftPayload,
} from './registration-program-draft-payload'

describe('registration-program-draft-payload', () => {
  it('round-trips v1 payload', () => {
    const payload = createRegistrationProgramDraftPayload({
      registrationTemplateCode: 'registration-general',
      activeStep: 'recruit-participant-individual',
      programTitleKo: '테스트 프로그램',
      formVersions: {
        'registration-general': { templateId: 1, draftVersionId: 10 },
      },
    })

    const parsed = parseRegistrationProgramDraftPayload(payload)
    expect(parsed).toEqual(payload)
  })

  it('rejects invalid payload', () => {
    expect(parseRegistrationProgramDraftPayload(null)).toBeNull()
    expect(parseRegistrationProgramDraftPayload({ version: 2 })).toBeNull()
  })
})
