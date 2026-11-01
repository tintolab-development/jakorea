import { PROGRAM_VOLUNTEER_FREE_TEXT_MAX_LENGTH, PROGRAM_VOLUNTEER_FREE_TEXT_QUESTIONS } from '@jakorea/form-schema/paragraph-ids/program-application-form-volunteer-draft'
import type { HorizontalTableParagraph, WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'
import {
  PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS,
  PARTICIPATING_VOLUNTEER_THIRD_PARTY_RECIPIENT_PLACEHOLDER,
  resolveJaVolunteerExperienceFromParagraph,
  type JaVolunteerExperience,
} from '@/features/program/general/lib/participating-volunteer-add-registration-draft'
import type { ParticipatingVolunteerAddRegistrationPluginValues } from '@/features/program/general/lib/participating-volunteer-add-registration-plugin-state'
import type { VolunteerParticipantRegisterRequest } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterRequest'
import { VolunteerParticipantRegisterRequestJaProgramExperienceConsentRequest } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterRequestJaProgramExperienceConsentRequest'
import { VolunteerParticipantRegisterRequestPersonalInfoConsent } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterRequestPersonalInfoConsent'
import { VolunteerParticipantRegisterRequestRegistrationChannel } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterRequestRegistrationChannel'
import { VolunteerParticipantRegisterRequestThirdPartyConsent } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterRequestThirdPartyConsent'
import { VolunteerParticipantRegisterRequestVolunteerKind } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterRequestVolunteerKind'

const REGISTER_REASON = 'CMS 참여 봉사자 추가 등록'

/** OpenAPI VolunteerParticipantRegisterRequest.thirdPartyRecipient maxLength */
export const VOLUNTEER_THIRD_PARTY_RECIPIENT_MAX_LENGTH = 200

/**
 * BE nullable 계약 반영 후 register body에 `thirdPartyRecipient`를 포함한다.
 * false면 필드를 omit(레거시). GENERAL AGREE 시 필수 검증도 이 플래그와 함께 켠다.
 */
export const includeThirdPartyRecipientInWire = true

export type BuildVolunteerParticipantRegisterRequestInput = {
  memberId: number
  paragraphs: WritingFormParagraph[]
  pluginValues: ParticipatingVolunteerAddRegistrationPluginValues
  hideBasicInfoSection: boolean
}

export type BuildVolunteerParticipantRegisterRequestResult =
  | { ok: true; request: VolunteerParticipantRegisterRequest }
  | { ok: false; message: string }

function resolveConsentAgreed(
  paragraphs: WritingFormParagraph[],
  paragraphId: string
): boolean {
  const paragraph = paragraphs.find(p => p.id === paragraphId)
  return (
    paragraph?.variant === 'horizontal_table' &&
    (paragraph as HorizontalTableParagraph).bottomConsent === 'agree'
  )
}

/**
 * 제3자 「제공받는 곳」 — trim 후 빈값·placeholder·'-' 는 미입력.
 * wire에는 '' / '-' 를 넣지 않는다 (omit / null).
 */
export function resolveThirdPartyRecipientCellValue(
  paragraphs: WritingFormParagraph[],
  paragraphId: string,
  placeholders: readonly string[] = []
): string | null {
  const paragraph = paragraphs.find(p => p.id === paragraphId)
  if (!paragraph || paragraph.variant !== 'horizontal_table') return null
  const cell = paragraph.fieldDataRows?.[0]?.[0]
  if (!cell || (cell.kind !== 'text' && cell.kind !== 'subjective')) return null
  const value = cell.value.trim()
  if (value.length === 0 || value === '-' || placeholders.includes(value)) {
    return null
  }
  return value
}

export function resolveThirdPartyRecipientForWire(
  paragraphs: WritingFormParagraph[]
): string | null {
  return resolveThirdPartyRecipientCellValue(
    paragraphs,
    PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.thirdPartyConsent,
    [PARTICIPATING_VOLUNTEER_THIRD_PARTY_RECIPIENT_PLACEHOLDER]
  )
}

function mapJaExperienceToConsentRequest(
  experience: JaVolunteerExperience
): VolunteerParticipantRegisterRequest['jaProgramExperienceConsentRequest'] | undefined {
  if (experience === 'yes') {
    return VolunteerParticipantRegisterRequestJaProgramExperienceConsentRequest.REQUESTED
  }
  if (experience === 'no') {
    return VolunteerParticipantRegisterRequestJaProgramExperienceConsentRequest.NOT_REQUESTED
  }
  return undefined
}

export function buildVolunteerParticipantRegisterRequest(
  input: BuildVolunteerParticipantRegisterRequestInput
): BuildVolunteerParticipantRegisterRequestResult {
  const personalAgreed = resolveConsentAgreed(
    input.paragraphs,
    PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.personalInfoCollection
  )
  const thirdPartyAgreed = resolveConsentAgreed(
    input.paragraphs,
    PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.thirdPartyConsent
  )
  if (!personalAgreed) {
    return { ok: false, message: '개인정보 수집·이용에 동의해 주세요.' }
  }
  if (!thirdPartyAgreed) {
    return { ok: false, message: '개인정보 제3자 정보 제공·이용에 동의해 주세요.' }
  }

  const thirdPartyRecipient = includeThirdPartyRecipientInWire
    ? resolveThirdPartyRecipientForWire(input.paragraphs)
    : null
  if (includeThirdPartyRecipientInWire) {
    if (!thirdPartyRecipient) {
      return { ok: false, message: '제공받는 기관명을 입력해 주세요.' }
    }
    if (thirdPartyRecipient.length > VOLUNTEER_THIRD_PARTY_RECIPIENT_MAX_LENGTH) {
      return {
        ok: false,
        message: `제공받는 기관명은 ${VOLUNTEER_THIRD_PARTY_RECIPIENT_MAX_LENGTH}자 이내로 입력해 주세요.`,
      }
    }
  }

  const jaParagraph = input.paragraphs.find(
    p => p.id === PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS.jaVolunteerExperience
  )
  const jaExperience = resolveJaVolunteerExperienceFromParagraph(jaParagraph)
  const jaProgramExperienceConsentRequest = mapJaExperienceToConsentRequest(jaExperience)
  if (!jaProgramExperienceConsentRequest) {
    return { ok: false, message: 'JA 봉사 프로그램 진행 경험 여부를 선택해 주세요.' }
  }

  const trimmedId1365 = input.pluginValues.id1365.trim()
  if (!input.hideBasicInfoSection && trimmedId1365.length === 0) {
    return { ok: false, message: '1365 ID를 입력해 주세요.' }
  }

  const previousJa = input.pluginValues.previousJaProgram
  if (
    jaProgramExperienceConsentRequest ===
    VolunteerParticipantRegisterRequestJaProgramExperienceConsentRequest.REQUESTED
  ) {
    if (!/^\d{4}$/.test(previousJa.programYear.trim())) {
      return { ok: false, message: '이전 참여 JA 봉사 프로그램의 진행년도를 선택해 주세요.' }
    }
    if (!previousJa.programName.trim()) {
      return { ok: false, message: '이전 참여 JA 봉사 프로그램명을 입력해 주세요.' }
    }
    if (previousJa.certificateFiles.length === 0) {
      return { ok: false, message: '이전 참여 JA 봉사 프로그램 증빙서류를 첨부해 주세요.' }
    }
  }

  const freeTextItems = []
  for (const question of PROGRAM_VOLUNTEER_FREE_TEXT_QUESTIONS) {
    const bodyText = (input.pluginValues.freeTextById[question.id] ?? '').trim()
    if (!bodyText) {
      return { ok: false, message: '자유 작성 항목을 모두 작성해 주세요.' }
    }
    if (bodyText.length > PROGRAM_VOLUNTEER_FREE_TEXT_MAX_LENGTH) {
      return {
        ok: false,
        message: `자유 작성 항목은 항목당 ${PROGRAM_VOLUNTEER_FREE_TEXT_MAX_LENGTH}자 이내로 작성해 주세요.`,
      }
    }
    freeTextItems.push({
      id: question.id,
      label: question.label,
      bodyText,
    })
  }

  const request: VolunteerParticipantRegisterRequest = {
    memberId: input.memberId,
    volunteerKind: VolunteerParticipantRegisterRequestVolunteerKind.GENERAL,
    registrationChannel: VolunteerParticipantRegisterRequestRegistrationChannel.CMS_PROGRESS_ADD,
    personalInfoConsent: VolunteerParticipantRegisterRequestPersonalInfoConsent.AGREE,
    thirdPartyConsent: VolunteerParticipantRegisterRequestThirdPartyConsent.AGREE,
    jaProgramExperienceConsentRequest,
    freeTextItems: { items: freeTextItems },
    reason: REGISTER_REASON,
  }

  if (includeThirdPartyRecipientInWire && thirdPartyRecipient) {
    request.thirdPartyRecipient = thirdPartyRecipient
  }

  if (!input.hideBasicInfoSection && trimmedId1365) {
    request.id1365 = trimmedId1365
  }

  if (
    jaProgramExperienceConsentRequest ===
    VolunteerParticipantRegisterRequestJaProgramExperienceConsentRequest.REQUESTED
  ) {
    request.previousJaProgram = {
      programYear: previousJa.programYear.trim(),
      programName: previousJa.programName.trim(),
      certificateFileIds: previousJa.certificateFiles.map(file => file.fileObjectId),
    }
  }

  return { ok: true, request }
}
