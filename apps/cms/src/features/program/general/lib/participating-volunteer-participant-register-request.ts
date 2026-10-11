import { PROGRAM_VOLUNTEER_FREE_TEXT_MAX_LENGTH, PROGRAM_VOLUNTEER_FREE_TEXT_QUESTIONS } from '@jakorea/form-schema/paragraph-ids/program-application-form-volunteer-draft'
import type { HorizontalTableParagraph, WritingFormParagraph } from '@/features/template/model/writing-form-draft.schema'
import {
  PARTICIPATING_VOLUNTEER_ADD_REGISTRATION_IDS,
  resolveJaVolunteerExperienceFromParagraph,
  type JaVolunteerExperience,
} from '@/features/program/general/lib/participating-volunteer-add-registration-draft'
import type { ParticipatingVolunteerAddRegistrationPluginValues } from '@/features/program/general/lib/participating-volunteer-add-registration-plugin-state'
import type { VolunteerParticipantRegisterRequest } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterRequest'
import { VolunteerParticipantRegisterConsent } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterConsent'
import { VolunteerParticipantRegisterRequestRegistrationChannel } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterRequestRegistrationChannel'
import { VolunteerParticipantRegisterRequestVolunteerKind } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantRegisterRequestVolunteerKind'
import { VolunteerParticipantJaConsentRequest } from '@/shared/api/generated/program-progress/schemas/volunteerParticipantJaConsentRequest'

const REGISTER_REASON = 'CMS 참여 봉사자 추가 등록'

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

function mapJaExperienceToConsentRequest(
  experience: JaVolunteerExperience
): VolunteerParticipantRegisterRequest['jaProgramExperienceConsentRequest'] | undefined {
  if (experience === 'yes') return VolunteerParticipantJaConsentRequest.REQUESTED
  if (experience === 'no') return VolunteerParticipantJaConsentRequest.NOT_REQUESTED
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
  if (jaProgramExperienceConsentRequest === VolunteerParticipantJaConsentRequest.REQUESTED) {
    if (!previousJa.programYear.trim() || !previousJa.programName.trim()) {
      return { ok: false, message: '이전 참여 JA 봉사 프로그램의 진행년도와 프로그램명을 입력해 주세요.' }
    }
    if (previousJa.certificateFileIds.length === 0) {
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
    personalInfoConsent: VolunteerParticipantRegisterConsent.AGREE,
    thirdPartyConsent: VolunteerParticipantRegisterConsent.AGREE,
    jaProgramExperienceConsentRequest,
    freeTextItems: { items: freeTextItems },
    reason: REGISTER_REASON,
  }

  if (!input.hideBasicInfoSection && trimmedId1365) {
    request.id1365 = trimmedId1365
  }

  if (jaProgramExperienceConsentRequest === VolunteerParticipantJaConsentRequest.REQUESTED) {
    request.previousJaProgram = {
      programYear: previousJa.programYear.trim(),
      programName: previousJa.programName.trim(),
      certificateFileIds: previousJa.certificateFileIds,
    }
  }

  return { ok: true, request }
}
