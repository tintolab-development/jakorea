import { describe, expect, it } from 'vitest'
import { createParticipatingVolunteerAddRegistrationDraft, JA_VOLUNTEER_EXPERIENCE_OPTION_IDS, PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS } from '@/features/program/general/lib/participating-volunteer-add-registration-draft'
import { buildVolunteerParticipantRegisterRequest } from '@/features/program/general/lib/participating-volunteer-participant-register-request'
import type { ParticipatingVolunteerAddRegistrationPluginValues } from '@/features/program/general/lib/participating-volunteer-add-registration-plugin-state'
import { PROGRAM_VOLUNTEER_FREE_TEXT_QUESTIONS } from '@jakorea/form-schema/paragraph-ids/program-application-form-volunteer-draft'

function agreeConsents(draft = createParticipatingVolunteerAddRegistrationDraft()) {
  return draft.paragraphs.map(p => {
    if (
      p.variant === 'horizontal_table' &&
      (p.id === PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.personalInfoCollection ||
        p.id === PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.thirdPartyConsent)
    ) {
      return { ...p, bottomConsent: 'agree' as const }
    }
    return p
  })
}

function withJaExperience(
  paragraphs: ReturnType<typeof agreeConsents>,
  optionId: string
) {
  return paragraphs.map(p => {
    if (p.id === PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.jaVolunteerExperience) {
      return { ...p, selectedPreviewSingleId: optionId }
    }
    return p
  })
}

const fullFreeText = PROGRAM_VOLUNTEER_FREE_TEXT_QUESTIONS.reduce(
  (acc, q) => {
    acc[q.id] = '내용'
    return acc
  },
  {} as ParticipatingVolunteerAddRegistrationPluginValues['freeTextById']
)

describe('buildVolunteerParticipantRegisterRequest', () => {
  it('maps 있음(yes) and previous JA to register body', () => {
    const paragraphs = withJaExperience(agreeConsents(), JA_VOLUNTEER_EXPERIENCE_OPTION_IDS.yes)
    const result = buildVolunteerParticipantRegisterRequest({
      memberId: 190084,
      paragraphs,
      hideBasicInfoSection: true,
      pluginValues: {
        id1365: '',
        previousJaProgram: {
          programYear: '2024',
          programName: 'JA 봉사',
          certificateFileIds: ['90001'],
        },
        freeTextById: fullFreeText,
      },
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.request.memberId).toBe(190084)
    expect(result.request.jaProgramExperienceConsentRequest).toBe('REQUESTED')
    expect(result.request.previousJaProgram?.certificateFileIds).toEqual(['90001'])
    expect(result.request.freeTextItems?.items).toHaveLength(4)
    expect(result.request.reason.length).toBeGreaterThanOrEqual(5)
  })

  it('maps 없음(no) without previousJaProgram', () => {
    const paragraphs = withJaExperience(agreeConsents(), JA_VOLUNTEER_EXPERIENCE_OPTION_IDS.no)
    const result = buildVolunteerParticipantRegisterRequest({
      memberId: 1,
      paragraphs,
      hideBasicInfoSection: false,
      pluginValues: {
        id1365: 'ID-1365',
        previousJaProgram: {
          programYear: '',
          programName: '',
          certificateFileIds: [],
        },
        freeTextById: fullFreeText,
      },
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.request.jaProgramExperienceConsentRequest).toBe('NOT_REQUESTED')
    expect(result.request.previousJaProgram).toBeUndefined()
    expect(result.request.id1365).toBe('ID-1365')
  })
})
