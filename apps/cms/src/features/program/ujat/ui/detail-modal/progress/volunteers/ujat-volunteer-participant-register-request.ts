import {
  PROGRAM_VOLUNTEER_FREE_TEXT_MAX_LENGTH,
  PROGRAM_VOLUNTEER_FREE_TEXT_QUESTIONS,
} from '@jakorea/form-schema/paragraph-ids/program-application-form-volunteer-draft'
import { UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@/features/template/model/ujat-program-application-form-volunteer-draft'
import type { HorizontalTableParagraph, WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'
import {
  UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS,
  ujatVolunteerFreeTextOverlayKey,
} from '@/features/template/ui/form-set/application-form/UJAT-volunteer/ujat-application-volunteer-overlay-keys'
import {
  findUjatEducationRegionKeyByCode,
  findUjatEducationRegionKeyByLabel,
} from '@/features/program/ujat/lib/ujat-education-regions'
import {
  includeThirdPartyRecipientInWire,
  resolveThirdPartyRecipientCellValue,
  VOLUNTEER_THIRD_PARTY_RECIPIENT_MAX_LENGTH,
} from '@/features/program/general/lib/participating-volunteer-participant-register-request'
import type { VolunteerParticipantRegisterRequest } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterRequest'
import { VolunteerParticipantRegisterRequestApplicationType } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterRequestApplicationType'
import { VolunteerParticipantRegisterRequestJaProgramExperienceConsentRequest } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterRequestJaProgramExperienceConsentRequest'
import { VolunteerParticipantRegisterRequestPersonalInfoConsent } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterRequestPersonalInfoConsent'
import { VolunteerParticipantRegisterRequestRegistrationChannel } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterRequestRegistrationChannel'
import { VolunteerParticipantRegisterRequestThirdPartyConsent } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterRequestThirdPartyConsent'
import { VolunteerParticipantRegisterRequestVolunteerKind } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterRequestVolunteerKind'
import {
  buildRequiredConsentDisagreeAlertMessage,
  collectDisagreedRequiredConsentLabels,
  hasUnsetConsentSelections,
  REQUIRED_CONSENT_DISAGREE_ALERT_TITLE,
} from '@jakorea/domain/shared/required-consent-alert'
import type { UjatVolunteerAddRegistrationConsentState } from './terms-consent-section'

const REGISTER_REASON = 'CMS UJAT 참여 봉사자 추가 등록'

/** UJAT 시드 제3자 표 「제공받는 곳」 placeholder — 미입력으로 취급 */
const UJAT_THIRD_PARTY_RECIPIENT_PLACEHOLDER = '제공받는 곳을 입력해 주세요'

const REQUIRED_TERMS_FIELDS = [
  { key: 'serviceTerms' as const, label: '서비스 이용약관' },
  { key: 'personalInfo' as const, label: '개인정보 수집·이용 동의' },
]

const ALL_TERMS_KEYS: readonly (keyof UjatVolunteerAddRegistrationConsentState)[] = [
  'serviceTerms',
  'personalInfo',
  'marketing',
  'portrait',
  'educationPledge',
  'jointUse',
  'sexOffenseCheck',
]

export type BuildUjatVolunteerParticipantRegisterRequestInput = {
  memberId: number
  paragraphs: WritingFormParagraph[]
  terms: UjatVolunteerAddRegistrationConsentState
  overlay: Record<string, unknown>
  applicationType: 'new' | 'ujat-graduate'
}

export type BuildUjatVolunteerParticipantRegisterRequestResult =
  | { ok: true; request: VolunteerParticipantRegisterRequest }
  | { ok: false; title: string; message: string }

function overlayString(overlay: Record<string, unknown>, key: string): string {
  const value = overlay[key]
  return typeof value === 'string' ? value.trim() : ''
}

function resolveEducationRegionCode(overlay: Record<string, unknown>): string | undefined {
  const raw = overlayString(overlay, UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.preferredRegion)
  if (!raw) return undefined
  return findUjatEducationRegionKeyByCode(raw) ?? findUjatEducationRegionKeyByLabel(raw) ?? undefined
}

function certificateFileIdsFromOverlay(overlay: Record<string, unknown>): string[] {
  const ids = overlay[UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousTermFileObjectIds]
  if (Array.isArray(ids)) {
    return ids
      .map(value => {
        const n = typeof value === 'number' ? value : Number(String(value).trim())
        return Number.isSafeInteger(n) && n > 0 ? String(n) : ''
      })
      .filter(Boolean)
  }
  // 레거시: 파일명 배열에 숫자 문자열이 들어 있던 경우
  const raw = overlay[UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousTermFileNames]
  if (!Array.isArray(raw)) return []
  return raw
    .map(value => {
      if (value && typeof value === 'object' && 'fileObjectId' in value) {
        const id = (value as { fileObjectId?: unknown }).fileObjectId
        const n = typeof id === 'number' ? id : Number(id)
        return Number.isSafeInteger(n) && n > 0 ? String(n) : ''
      }
      const text = String(value).trim()
      return /^\d+$/.test(text) ? text : ''
    })
    .filter(Boolean)
}

function mapRegisterApplicationType(
  applicationType: 'new' | 'ujat-graduate'
): (typeof VolunteerParticipantRegisterRequestApplicationType)[keyof typeof VolunteerParticipantRegisterRequestApplicationType] {
  return applicationType === 'ujat-graduate'
    ? VolunteerParticipantRegisterRequestApplicationType.UJAT_GRADUATE
    : VolunteerParticipantRegisterRequestApplicationType.NEW
}

function resolveConsentAgreed(paragraphs: WritingFormParagraph[], paragraphId: string): boolean {
  const paragraph = paragraphs.find(p => p.id === paragraphId)
  return (
    paragraph?.variant === 'horizontal_table' &&
    (paragraph as HorizontalTableParagraph).bottomConsent === 'agree'
  )
}

export function buildUjatVolunteerParticipantRegisterRequest(
  input: BuildUjatVolunteerParticipantRegisterRequestInput
): BuildUjatVolunteerParticipantRegisterRequestResult {
  const termsForAlert = Object.fromEntries(
    ALL_TERMS_KEYS.map(key => [key, input.terms[key] || undefined])
  ) as Partial<Record<(typeof ALL_TERMS_KEYS)[number], 'agree' | 'disagree'>>

  if (hasUnsetConsentSelections(termsForAlert, ALL_TERMS_KEYS)) {
    return {
      ok: false,
      title: '안내',
      message: '약관 및 동의 항목을 모두 선택해 주세요.',
    }
  }

  const disagreed = collectDisagreedRequiredConsentLabels(termsForAlert, REQUIRED_TERMS_FIELDS)
  if (disagreed.length > 0) {
    return {
      ok: false,
      title: REQUIRED_CONSENT_DISAGREE_ALERT_TITLE,
      message: buildRequiredConsentDisagreeAlertMessage(disagreed),
    }
  }

  if (
    !resolveConsentAgreed(
      input.paragraphs,
      UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.personalInfoCollection
    )
  ) {
    return { ok: false, title: '안내', message: '개인정보 수집·이용에 동의해 주세요.' }
  }
  if (
    !resolveConsentAgreed(
      input.paragraphs,
      UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent
    )
  ) {
    return {
      ok: false,
      title: '안내',
      message: '개인정보 제3자 정보 제공·이용에 동의해 주세요.',
    }
  }

  /** UJAT는 thirdPartyRecipient 생략 가능. 값이 있으면 동일 wire로 저장. */
  const thirdPartyRecipient = includeThirdPartyRecipientInWire
    ? resolveThirdPartyRecipientCellValue(
        input.paragraphs,
        UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.thirdPartyConsent,
        [UJAT_THIRD_PARTY_RECIPIENT_PLACEHOLDER]
      )
    : null
  if (
    thirdPartyRecipient != null &&
    thirdPartyRecipient.length > VOLUNTEER_THIRD_PARTY_RECIPIENT_MAX_LENGTH
  ) {
    return {
      ok: false,
      title: '안내',
      message: `제공받는 기관명은 ${VOLUNTEER_THIRD_PARTY_RECIPIENT_MAX_LENGTH}자 이내로 입력해 주세요.`,
    }
  }

  const hasExperience = overlayString(input.overlay, UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.hasExperience)
  const jaProgramExperienceConsentRequest =
    hasExperience === 'yes'
      ? VolunteerParticipantRegisterRequestJaProgramExperienceConsentRequest.REQUESTED
      : hasExperience === 'no'
        ? VolunteerParticipantRegisterRequestJaProgramExperienceConsentRequest.NOT_REQUESTED
        : undefined
  if (!jaProgramExperienceConsentRequest) {
    return { ok: false, title: '안내', message: '교육 진행 경험 여부를 선택해 주세요.' }
  }

  const applicationType = mapRegisterApplicationType(input.applicationType)
  const requireFreeText =
    applicationType === VolunteerParticipantRegisterRequestApplicationType.NEW

  const freeTextItems = []
  if (requireFreeText) {
    for (const question of PROGRAM_VOLUNTEER_FREE_TEXT_QUESTIONS) {
      const bodyText = overlayString(input.overlay, ujatVolunteerFreeTextOverlayKey(question.id))
      if (!bodyText) {
        return { ok: false, title: '안내', message: '자유 작성 항목을 모두 작성해 주세요.' }
      }
      if (bodyText.length > PROGRAM_VOLUNTEER_FREE_TEXT_MAX_LENGTH) {
        return {
          ok: false,
          title: '안내',
          message: `자유 작성 항목은 항목당 ${PROGRAM_VOLUNTEER_FREE_TEXT_MAX_LENGTH}자 이내로 작성해 주세요.`,
        }
      }
      freeTextItems.push({
        id: question.id,
        label: question.label,
        bodyText,
      })
    }
  }

  const request: VolunteerParticipantRegisterRequest = {
    memberId: input.memberId,
    volunteerKind: VolunteerParticipantRegisterRequestVolunteerKind.GENERAL,
    registrationChannel: VolunteerParticipantRegisterRequestRegistrationChannel.CMS_PROGRESS_ADD,
    personalInfoConsent: VolunteerParticipantRegisterRequestPersonalInfoConsent.AGREE,
    thirdPartyConsent: VolunteerParticipantRegisterRequestThirdPartyConsent.AGREE,
    jaProgramExperienceConsentRequest,
    applicationType,
    reason: REGISTER_REASON,
  }
  if (thirdPartyRecipient) {
    request.thirdPartyRecipient = thirdPartyRecipient
  }
  if (freeTextItems.length > 0) {
    request.freeTextItems = { items: freeTextItems }
  }

  const id1365 = overlayString(input.overlay, UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.id1365)
  if (id1365) {
    request.id1365 = id1365
  }

  const educationRegionCode = resolveEducationRegionCode(input.overlay)
  if (educationRegionCode) {
    request.educationRegionCode = educationRegionCode
  }

  const previousTerm = overlayString(input.overlay, UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousTerm)
  const previousYear = overlayString(input.overlay, UJAT_APPLICATION_VOLUNTEER_OVERLAY_KEYS.previousYear)
  if (previousTerm && previousYear) {
    const certificateFileIds = certificateFileIdsFromOverlay(input.overlay)
    request.previousUjatTerm = {
      term: previousTerm,
      year: previousYear,
      ...(certificateFileIds.length > 0 ? { certificateFileIds } : {}),
    }
  }

  return { ok: true, request }
}
