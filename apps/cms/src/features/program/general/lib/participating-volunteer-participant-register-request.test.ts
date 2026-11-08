import { describe, expect, it } from 'vitest'
import {
  createParticipatingVolunteerAddRegistrationDraft,
  JA_VOLUNTEER_EXPERIENCE_OPTION_IDS,
  PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS,
} from '@/features/program/general/lib/participating-volunteer-add-registration-draft'
import {
  buildVolunteerParticipantRegisterRequest,
  VOLUNTEER_THIRD_PARTY_RECIPIENT_MAX_LENGTH,
} from '@/features/program/general/lib/participating-volunteer-participant-register-request'
import type { ParticipatingVolunteerAddRegistrationPluginValues } from '@/features/program/general/lib/participating-volunteer-add-registration-plugin-state'
import { PROGRAM_VOLUNTEER_FREE_TEXT_QUESTIONS } from '@jakorea/form-schema/paragraph-ids/program-application-form-volunteer-draft'
import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'

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

function withThirdPartyRecipient(
  paragraphs: ReturnType<typeof agreeConsents>,
  recipient: string
) {
  return paragraphs.map(p => {
    if (p.id !== PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.thirdPartyConsent) return p
    const table = p as HorizontalTableParagraph
    const row = [...(table.fieldDataRows?.[0] ?? [])]
    row[0] = { kind: 'text', value: recipient }
    return { ...table, fieldDataRows: [row] }
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
  it('maps 동의서 제출 요청(yes) and previous JA to register body with thirdPartyRecipient', () => {
    const paragraphs = withJaExperience(
      withThirdPartyRecipient(agreeConsents(), '서울○○중학교'),
      JA_VOLUNTEER_EXPERIENCE_OPTION_IDS.yes
    )
    const result = buildVolunteerParticipantRegisterRequest({
      memberId: 190084,
      paragraphs,
      hideBasicInfoSection: true,
      pluginValues: {
        id1365: '',
        previousJaProgram: {
          programYear: '2024',
          programName: 'JA 봉사',
          certificateFiles: [{ fileObjectId: '90001', fileName: 'cert.jpg' }],
        },
        freeTextById: fullFreeText,
      },
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.request.memberId).toBe(190084)
    expect(result.request.thirdPartyRecipient).toBe('서울○○중학교')
    expect(result.request.jaProgramExperienceConsentRequest).toBe('REQUESTED')
    expect(result.request.previousJaProgram?.certificateFileIds).toEqual(['90001'])
    expect(result.request.freeTextItems?.items).toHaveLength(4)
    expect(result.request.reason.length).toBeGreaterThanOrEqual(5)
  })

  it('rejects empty / dash third-party recipient', () => {
    for (const recipient of ['', '   ', '-']) {
      const paragraphs = withJaExperience(
        withThirdPartyRecipient(agreeConsents(), recipient),
        JA_VOLUNTEER_EXPERIENCE_OPTION_IDS.no
      )
      const result = buildVolunteerParticipantRegisterRequest({
        memberId: 1,
        paragraphs,
        hideBasicInfoSection: true,
        pluginValues: {
          id1365: '',
          previousJaProgram: {
            programYear: '',
            programName: '',
            certificateFiles: [],
          },
          freeTextById: fullFreeText,
        },
      })
      expect(result.ok).toBe(false)
      if (result.ok) return
      expect(result.kind).toBe('required')
      expect(result.message).toContain('제공받는 기관명')
    }
  })

  it('rejects third-party recipient over max length', () => {
    const paragraphs = withJaExperience(
      withThirdPartyRecipient(
        agreeConsents(),
        '가'.repeat(VOLUNTEER_THIRD_PARTY_RECIPIENT_MAX_LENGTH + 1)
      ),
      JA_VOLUNTEER_EXPERIENCE_OPTION_IDS.no
    )
    const result = buildVolunteerParticipantRegisterRequest({
      memberId: 1,
      paragraphs,
      hideBasicInfoSection: true,
      pluginValues: {
        id1365: '',
        previousJaProgram: {
          programYear: '',
          programName: '',
          certificateFiles: [],
        },
        freeTextById: fullFreeText,
      },
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.kind).toBe('invalid')
    expect(result.message).toContain(`${VOLUNTEER_THIRD_PARTY_RECIPIENT_MAX_LENGTH}자`)
  })

  it('maps 동의서 미제출(no) without previousJaProgram', () => {
    const paragraphs = withJaExperience(
      withThirdPartyRecipient(agreeConsents(), '배정 학교 B'),
      JA_VOLUNTEER_EXPERIENCE_OPTION_IDS.no
    )
    const result = buildVolunteerParticipantRegisterRequest({
      memberId: 1,
      paragraphs,
      hideBasicInfoSection: false,
      pluginValues: {
        id1365: 'ID-1365',
        previousJaProgram: {
          programYear: '',
          programName: '',
          certificateFiles: [],
        },
        freeTextById: fullFreeText,
      },
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.request.thirdPartyRecipient).toBe('배정 학교 B')
    expect(result.request.jaProgramExperienceConsentRequest).toBe('NOT_REQUESTED')
    expect(result.request.previousJaProgram).toBeUndefined()
    expect(result.request.id1365).toBe('ID-1365')
  })

  it('rejects REQUESTED without previousJaProgram', () => {
    const paragraphs = withJaExperience(
      withThirdPartyRecipient(agreeConsents(), '배정학교A'),
      JA_VOLUNTEER_EXPERIENCE_OPTION_IDS.yes
    )
    const result = buildVolunteerParticipantRegisterRequest({
      memberId: 190080,
      paragraphs,
      hideBasicInfoSection: true,
      pluginValues: {
        id1365: '',
        previousJaProgram: {
          programYear: '',
          programName: '',
          certificateFiles: [],
        },
        freeTextById: fullFreeText,
      },
    })
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.kind).toBe('required')
    expect(result.message).toContain('이전 참여 JA')
  })
})
