import { describe, expect, it } from 'vitest'
import {
  createUjatProgramApplicationFormVolunteerDraft,
  UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS,
} from '@/features/template/model/ujat-program-application-form-volunteer-draft'
import {
  UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS,
  ujatVolunteerFreeTextOverlayKey,
} from '@/features/template/ui/form-set/application-form/UJAT-volunteer/ujat-application-volunteer-overlay-keys'
import { PROGRAM_VOLUNTEER_FREE_TEXT_QUESTIONS } from '@jakorea/form-schema/paragraph-ids/program-application-form-volunteer-draft'
import { EMPTY_UJAT_VOLUNTEER_ADD_REGISTRATION_CONSENTS } from './terms-consent-section'
import { buildUjatVolunteerParticipantRegisterRequest } from './ujat-volunteer-participant-register-request'

function agreeDraftParagraphs() {
  return createUjatProgramApplicationFormVolunteerDraft().paragraphs.map(paragraph => {
    if (
      paragraph.variant === 'horizontal_table' &&
      (paragraph.id === UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.personalInfoCollection ||
        paragraph.id === UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent)
    ) {
      return { ...paragraph, bottomConsent: 'agree' as const }
    }
    return paragraph
  })
}

const agreedTerms = {
  ...EMPTY_UJAT_VOLUNTEER_ADD_REGISTRATION_CONSENTS,
  serviceTerms: 'agree' as const,
  personalInfo: 'agree' as const,
  marketing: 'disagree' as const,
  portrait: 'disagree' as const,
  educationPledge: 'disagree' as const,
  jointUse: 'disagree' as const,
  sexOffenseCheck: 'disagree' as const,
}

function overlayWithFreeText(extra: Record<string, unknown> = {}) {
  const overlay: Record<string, unknown> = {
    [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.hasExperience]: 'no',
    [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.id1365]: 'id-1365',
    ...extra,
  }
  for (const question of PROGRAM_VOLUNTEER_FREE_TEXT_QUESTIONS) {
    overlay[ujatVolunteerFreeTextOverlayKey(question.id)] = '작성 내용'
  }
  return overlay
}

describe('buildUjatVolunteerParticipantRegisterRequest', () => {
  it('blocks unset required terms', () => {
    const result = buildUjatVolunteerParticipantRegisterRequest({
      memberId: 12,
      paragraphs: agreeDraftParagraphs(),
      terms: { ...EMPTY_UJAT_VOLUNTEER_ADD_REGISTRATION_CONSENTS },
      overlay: overlayWithFreeText({
        [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.preferredRegion]: '서울',
      }),
      applicationType: 'new',
    })
    expect(result.ok).toBe(false)
  })

  it('maps agreed consents and overlay to register body', () => {
    const result = buildUjatVolunteerParticipantRegisterRequest({
      memberId: 12,
      paragraphs: agreeDraftParagraphs(),
      terms: agreedTerms,
      overlay: overlayWithFreeText({
        [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.preferredRegion]: '서울',
      }),
      applicationType: 'new',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.request.memberId).toBe(12)
    expect(result.request.volunteerKind).toBe('GENERAL')
    expect(result.request.personalInfoConsent).toBe('AGREE')
    expect(result.request.thirdPartyConsent).toBe('AGREE')
    expect(result.request.jaProgramExperienceConsentRequest).toBe('NOT_REQUESTED')
    expect(result.request.applicationType).toBe('NEW')
    expect(result.request.educationRegionCode).toBe('seoul')
    expect(result.request.id1365).toBe('id-1365')
    expect(result.request.freeTextItems?.items).toHaveLength(4)
    expect(result.request.previousJaProgram).toBeUndefined()
  })

  it('omits freeTextItems for UJAT graduate and does not require previousJaProgram', () => {
    const result = buildUjatVolunteerParticipantRegisterRequest({
      memberId: 190094,
      paragraphs: agreeDraftParagraphs(),
      terms: agreedTerms,
      overlay: {
        [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.hasExperience]: 'yes',
        [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.preferredRegion]: 'busan',
        [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousTerm]: '5기',
        [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousYear]: '2025',
        [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousTermFileNames]: ['certificate.pdf'],
      },
      applicationType: 'ujat-graduate',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.request.applicationType).toBe('UJAT_GRADUATE')
    expect(result.request.jaProgramExperienceConsentRequest).toBe('REQUESTED')
    expect(result.request.freeTextItems).toBeUndefined()
    expect(result.request.previousJaProgram).toBeUndefined()
    expect(result.request.previousUjatTerm).toEqual({ term: '5기', year: '2025' })
    expect(result.request.educationRegionCode).toBe('busan')
  })

  it('maps previousTermFileObjectIds to certificateFileIds', () => {
    const result = buildUjatVolunteerParticipantRegisterRequest({
      memberId: 12,
      paragraphs: agreeDraftParagraphs(),
      terms: agreedTerms,
      overlay: overlayWithFreeText({
        [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.hasExperience]: 'yes',
        [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousTerm]: '5기',
        [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousYear]: '2025',
        [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousTermFileNames]: ['certificate.pdf'],
        [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousTermFileObjectIds]: [9001],
        [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.preferredRegion]: 'seoul',
      }),
      applicationType: 'new',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.request.previousUjatTerm).toEqual({
      term: '5기',
      year: '2025',
      certificateFileIds: ['9001'],
    })
  })

  it('omits certificateFileIds when none uploaded', () => {
    const result = buildUjatVolunteerParticipantRegisterRequest({
      memberId: 12,
      paragraphs: agreeDraftParagraphs(),
      terms: agreedTerms,
      overlay: overlayWithFreeText({
        [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.hasExperience]: 'yes',
        [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousTerm]: '5기',
        [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousYear]: '2025',
        [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousTermFileNames]: ['certificate.pdf'],
        [UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.preferredRegion]: 'seoul',
      }),
      applicationType: 'new',
    })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.request.previousUjatTerm).toEqual({
      term: '5기',
      year: '2025',
    })
  })
})
