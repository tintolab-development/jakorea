import { describe, expect, it } from 'vitest'
import {
  createRegistrationProgramDraftPayload,
  parseRegistrationProgramDraftPayload,
} from './registration-wizard-draft-payload'

describe('registration-wizard-draft-payload', () => {
  it('round-trips v1 payload', () => {
    const payload = createRegistrationProgramDraftPayload({
      registrationTemplateCode: 'registration-general',
      activeStep: 'recruit-participant-individual',
      programTitleKo: '테스트 프로그램',
      selectedOperationalTemplates: {
        'recruit-participant-school': 'recruitment-instructor',
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
