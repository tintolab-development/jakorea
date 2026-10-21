/**
 * CMS `resolveGeneralApplicationFormHiddenParagraphIds` 와 동일 규칙 (Platform 신청).
 */

import {
  getInstitutionApplicationFormHiddenParagraphIds,
  getVolunteerApplicationFormHiddenParagraphIds,
  isApplicationScheduleParagraphForcedHidden,
  mergeApplicationScheduleVisibilityInput,
  readApplicationScheduleInputMode,
  readEducationScheduleLinesForApplicationForm,
  shouldShowApplicationScheduleParagraphResolved,
} from '@jakorea/form-schema/program-application'
import { PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-instructor-draft'
import { PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-volunteer-draft'
import { PROGRAM_APPLICATION_FORM_ECONOMY_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-economy-draft'
import { PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-trained-teachers-draft'
import { PROGRAM_PARTICIPANT_APPLICATION_IDS } from '@jakorea/form-schema/paragraph-ids/program-application-form-individual-draft'
import type { WritingFormParagraph } from '@jakorea/form-schema/writing-form'
import { UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS } from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-volunteer-draft'
import { isVolunteerApplyFormCase, type ProgramApplyFormCase } from './apply-form-case.ts'
import { shouldShowIndividualTeamInfoParagraph } from './apply-form-case.ts'
import type { ProgramDetail } from '../model/types.ts'
import { isApplyScheduleChoiceParagraphId } from './apply-form-schedule.ts'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

/** CMS 모집 「사전 안내 사항 작성 여부」 — runtime `preEducationNoticeRequired` */
export function readPreEducationNoticeRequiredFromRuntime(runtime: unknown): boolean | null {
  if (!isRecord(runtime)) return null
  const raw = runtime.preEducationNoticeRequired ?? runtime.advanceGuidanceRequired
  if (typeof raw === 'boolean') return raw
  const audience = runtime.audienceApplication
  if (isRecord(audience)) {
    const fromAudience =
      audience.preEducationNoticeRequired ?? audience.advanceGuidanceRequired
    if (typeof fromAudience === 'boolean') return fromAudience
  }
  return null
}

/**
 * 기관 신청 화면 전용.
 * form runtime이 있으면 그 값이 정본이다. 없으면 기관 참여자 모집 상세 값.
 * 둘 다 없으면 레거시 작성(true). 강사·봉사자 신청에는 호출하지 않는다.
 */
export function resolveInstitutionPreEducationNoticeRequired(
  program: { preEducationNoticeRequired?: boolean | null } | null | undefined,
  runtimeContext?: unknown,
): boolean {
  return (
    readPreEducationNoticeRequiredFromRuntime(runtimeContext) ??
    program?.preEducationNoticeRequired ??
    true
  )
}

export type ResolvePortalApplicationHiddenParagraphIdsInput = {
  applyCase: ProgramApplyFormCase | null
  program?: ProgramDetail | null
  runtimeContext?: unknown
  paragraphs: readonly WritingFormParagraph[]
  /** 성범죄 조회 방식 단락 — 동의서 제출 요청이 아니면 false */
  showSexOffenseConsentInquiryParagraph?: boolean
  volunteerInterviewEnabled?: boolean
  /** 봉사 진행 가능 일정 — 면접과 독립 (optionCount 0이면 false) */
  volunteerActivityScheduleEnabled?: boolean
  /** 강사 강의 진행 가능 일정 — OSA 0건이면 false */
  instructorAvailableScheduleEnabled?: boolean
  volunteerJaExperienceParagraph?: WritingFormParagraph
}

export function resolvePortalApplicationHiddenParagraphIds(
  input: ResolvePortalApplicationHiddenParagraphIdsInput
): ReadonlySet<string> {
  const hidden = new Set<string>()
  const { applyCase, program, runtimeContext, paragraphs } = input

  const scheduleParagraphRaw = paragraphs.find(paragraph =>
    applyCase === 'trained-teachers'
      ? paragraph.id === PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.preferredSchedule
      : isApplyScheduleChoiceParagraphId(paragraph.id)
  )
  const scheduleLines = readEducationScheduleLinesForApplicationForm(
    runtimeContext,
    program?.educationScheduleLines
  )
  const scheduleVisibility = mergeApplicationScheduleVisibilityInput({
    runtime: runtimeContext,
    program: program
      ? {
          educationStructure: program.educationStructure,
          sessionRound: program.sessionRound,
          educationScheduleMode: program.educationScheduleMode,
        }
      : undefined,
    educationScheduleLines: scheduleLines,
  })

  if (
    !shouldShowApplicationScheduleParagraphResolved({
      ...scheduleVisibility,
      runtimeContext,
      scheduleParagraphRaw,
    })
  ) {
    for (const paragraph of paragraphs) {
      if (isApplyScheduleChoiceParagraphId(paragraph.id)) hidden.add(paragraph.id)
    }
  }

  if (applyCase && !shouldShowIndividualTeamInfoParagraph(applyCase)) {
    for (const paragraph of paragraphs) {
      if (paragraph.id === PROGRAM_PARTICIPANT_APPLICATION_IDS.teamInfo) {
        hidden.add(paragraph.id)
      }
    }
  }

  if (applyCase === 'institution-general' || applyCase === 'institution-economy') {
    const preEducation = resolveInstitutionPreEducationNoticeRequired(program, runtimeContext)
    if (applyCase === 'institution-general') {
      const institutionHidden = getInstitutionApplicationFormHiddenParagraphIds({
        ...scheduleVisibility,
        preEducationNoticeRequired: preEducation,
        showSexOffenseConsentInquiryParagraph:
          input.showSexOffenseConsentInquiryParagraph ?? true,
      })
      institutionHidden?.forEach(id => hidden.add(id))
    } else if (preEducation === false) {
      hidden.add(PROGRAM_APPLICATION_FORM_ECONOMY_IDS.guidance)
    }
  }

  if (applyCase === 'trained-teachers') {
    const trainedScheduleParagraph = paragraphs.find(
      paragraph => paragraph.id === PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.preferredSchedule
    )
    const trainedScheduleMode = readApplicationScheduleInputMode(
      runtimeContext,
      trainedScheduleParagraph
    )
    if (isApplicationScheduleParagraphForcedHidden(scheduleVisibility)) {
      hidden.add(PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.preferredSchedule)
    } else if (trainedScheduleMode !== 'fixed_schedule_options') {
      if (
        !shouldShowApplicationScheduleParagraphResolved({
          ...scheduleVisibility,
          runtimeContext,
          scheduleParagraphRaw: trainedScheduleParagraph,
        })
      ) {
        hidden.add(PROGRAM_APPLICATION_FORM_TRAINED_TEACHERS_IDS.preferredSchedule)
      }
    }
  }

  if (
    (applyCase === 'individual-general' || applyCase === 'individual-team') &&
    !shouldShowApplicationScheduleParagraphResolved({
      ...scheduleVisibility,
      runtimeContext,
      scheduleParagraphRaw,
    })
  ) {
    hidden.add(PROGRAM_PARTICIPANT_APPLICATION_IDS.scheduleChoice)
  }

  if (applyCase === 'instructor' && input.instructorAvailableScheduleEnabled === false) {
    hidden.add(PROGRAM_APPLICATION_FORM_INSTRUCTOR_IDS.availableSchedule)
  }

  if (isVolunteerApplyFormCase(applyCase)) {
    const volunteerParagraphs = input.volunteerJaExperienceParagraph
      ? paragraphs.map(p =>
          p.id === input.volunteerJaExperienceParagraph!.id
            ? input.volunteerJaExperienceParagraph!
            : p
        )
      : paragraphs
    const volunteerHidden = getVolunteerApplicationFormHiddenParagraphIds(volunteerParagraphs, {
      interviewEnabled: input.volunteerInterviewEnabled,
      isTemplateAuthoringMode: false,
    })
    volunteerHidden?.forEach(id => hidden.add(id))
    if (applyCase === 'individual-volunteer' && input.volunteerActivityScheduleEnabled === false) {
      hidden.add(PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.activitySchedule)
    }
    if (applyCase === 'ujat-volunteer' && input.volunteerInterviewEnabled === false) {
      hidden.add(UJAT_PROGRAM_APPLICATION_FORM_VOLUNTEER_IDS.interviewSchedule)
    }
  }

  if (applyCase === 'institution-economy') {
    if (input.showSexOffenseConsentInquiryParagraph === false) {
      hidden.add(PROGRAM_APPLICATION_FORM_ECONOMY_IDS.sexOffenseConsentInquiryMethod)
    }
  }

  return hidden
}
