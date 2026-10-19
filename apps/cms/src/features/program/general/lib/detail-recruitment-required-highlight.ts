import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { isCompanySchoolProgram } from '@/features/program/1c-1s/lib/is-company-school-program'
import { resolveGeneralProgramParticipantRecruitmentDisplay } from '@/features/program/general/lib/participant-recruitment-display'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'
import { resolveVolunteerRecruitmentInterviewEnabled } from '@/features/program/general/lib/volunteer-recruitment-display'
import { isTrainedTeachersDetailProgram } from '@/features/program/trained-teachers/lib/is-trained-teachers-detail-program'
import { buildVolunteerInterviewOverlayKey } from '@/features/template/ui/form-set/application-form/volunteer/lib/interview-schedule-overlay-sync'
import { getGeneralRecruitOverlayRecord } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'

export type DetailRecruitmentHighlightAudience = 'participant' | 'instructor' | 'volunteer'

function blankText(value: unknown): boolean {
  return typeof value !== 'string' || value.trim() === ''
}

function blankNumber(value: unknown): boolean {
  return typeof value !== 'number' || !Number.isFinite(value)
}

function blankList(value: unknown): boolean {
  return !Array.isArray(value) || value.length === 0
}

function push(keys: string[], missing: boolean, key: string) {
  if (missing) keys.push(key)
}

function isInterviewTimeRangeIncomplete(value: unknown): boolean {
  if (!Array.isArray(value) || value.length < 2) return true
  return value[0] == null || value[1] == null
}

function listParticipant(program: Program, values: ProgramDetailEditFormValues): string[] {
  const keys: string[] = []
  const display = resolveGeneralProgramParticipantRecruitmentDisplay(program)
  const isIndividual = isGeneralIndividualProgram(program)
  const isCompanySchool = isCompanySchoolProgram(program)
  const isTrainedTeachers = isTrainedTeachersDetailProgram(program)
  const isGeneralOrg = !isIndividual && !isCompanySchool && !isTrainedTeachers
  const prefix = isIndividual ? 'recruit.individual' : 'recruit.institution'
  const showLimits = display.showInstitutionApplicationLimits
  const showMaxSchedule = display.showMaxScheduleCountField
  const showMaxSessions = display.showMaxSessionsPerDayField

  push(keys, blankText(values.participantRecruitmentAnnouncementPublished), `${prefix}.announcementPublished`)
  if (isTrainedTeachers || isGeneralOrg) {
    push(keys, blankText(values.studentListRequired), `${prefix}.studentListRequired`)
  }
  if (isGeneralOrg) {
    push(
      keys,
      blankText(values.participantRecruitmentPreEducationRequired),
      `${prefix}.preguidanceRequired`
    )
  }
  if (showLimits) {
    if (!isTrainedTeachers) {
      push(
        keys,
        blankNumber(values.participantRecruitmentMaxInstructors),
        `${prefix}.maxAssignableInstructors`
      )
    }
    push(keys, blankNumber(values.participantRecruitmentMaxClassCount), `${prefix}.maxClassCount`)
    if (!isCompanySchool && showMaxSchedule) {
      push(
        keys,
        blankNumber(values.participantRecruitmentMaxScheduleCount),
        `${prefix}.maxScheduleCount`
      )
    }
    if (!isCompanySchool && showMaxSessions) {
      push(
        keys,
        blankNumber(values.participantRecruitmentMaxSessionsPerDay),
        `${prefix}.maxSessionsPerDay`
      )
    }
  }
  push(
    keys,
    blankText(values.participantProgramOperationStartDate) ||
      blankText(values.participantProgramOperationEndDate),
    `${prefix}.programRangeSeal`
  )
  push(keys, blankList(values.targetLevels), `${prefix}.targetLevels`)
  push(keys, blankText(values.educationTargetDetail), `${prefix}.targetLevelDetail`)
  push(
    keys,
    blankText(values.applicationStartDate) || blankText(values.applicationEndDate),
    `${prefix}.recruitRangeSeal`
  )
  push(keys, blankText(values.resultAnnouncementDate), `${prefix}.finalAnnounceIso`)
  push(keys, blankText(values.resultAnnouncementMethod), `${prefix}.finalAnnounceMethod`)
  push(keys, blankText(values.recruitmentContactOrganizationName), `${prefix}.inquiryContact`)
  push(keys, blankText(values.contactPhone), `${prefix}.inquiryTel`)
  push(keys, blankText(values.contactEmail), `${prefix}.inquiryEmail`)
  if (values.participantRecruitmentNotesNotApplicable !== 'not_applicable') {
    push(keys, blankText(values.remarks), `${prefix}.notes`)
  }
  return keys
}

function listInstructor(values: ProgramDetailEditFormValues): string[] {
  const keys: string[] = []
  const prefix = 'recruit.instructor'
  push(keys, blankText(values.instructorRecruitmentAnnouncementPublished), `${prefix}.announcementPublished`)
  push(
    keys,
    blankText(values.instructorProgramOperationStartDate) ||
      blankText(values.instructorProgramOperationEndDate),
    `${prefix}.programRangeSeal`
  )
  push(keys, blankList(values.instructorTargets), `${prefix}.recruitTargets`)
  push(keys, blankText(values.instructorTargetDetail), `${prefix}.recruitTargetDetail`)
  push(
    keys,
    blankText(values.instructorApplicationStartDate) || blankText(values.instructorApplicationEndDate),
    `${prefix}.recruitRangeSeal`
  )
  push(keys, blankText(values.finalPassAnnouncementDate), `${prefix}.finalAnnounceIso`)
  push(keys, blankText(values.finalPassAnnouncementMethod), `${prefix}.finalAnnounceMethod`)
  push(keys, blankText(values.instructorRecruitmentContactOrganizationName), `${prefix}.inquiryContact`)
  push(keys, blankText(values.instructorContactPhone), `${prefix}.inquiryTel`)
  push(keys, blankText(values.instructorContactEmail), `${prefix}.inquiryEmail`)
  push(keys, blankText(values.instructorRecruitmentRemarks), `${prefix}.notes`)
  return keys
}

function listVolunteer(program: Program, values: ProgramDetailEditFormValues): string[] {
  const keys: string[] = []
  const prefix = 'recruit.volunteer'
  const interviewOn = resolveVolunteerRecruitmentInterviewEnabled(
    program,
    values.volunteerRecruitmentInterviewEnabled
  )
  push(keys, blankText(values.volunteerRecruitmentAnnouncementPublished), `${prefix}.announcementPublished`)
  push(keys, blankText(values.volunteerRecruitmentInterviewEnabled), `${prefix}.interviewRequired`)
  push(
    keys,
    blankText(values.volunteerProgramOperationStartDate) ||
      blankText(values.volunteerProgramOperationEndDate),
    `${prefix}.programRangeSeal`
  )
  push(keys, blankList(values.volunteerTargets), `${prefix}.volunteerTargets`)
  push(keys, blankText(values.volunteerTargetDetail), `${prefix}.volunteerTargetDetail`)
  push(
    keys,
    blankText(values.volunteerApplicationStartDate) || blankText(values.volunteerApplicationEndDate),
    `${prefix}.recruitRangeSeal`
  )
  if (interviewOn) {
    push(keys, blankText(values.documentPassAnnouncementDate), `${prefix}.docDeadlineIso`)
    push(keys, blankText(values.documentPassAnnouncementMethod), `${prefix}.docAnnounceMethod`)
    push(
      keys,
      blankText(values.interviewStartDate) || blankText(values.interviewEndDate),
      `${prefix}.interviewRangeSeal`
    )
    push(keys, blankText(values.interviewMethod), `${prefix}.interviewMethod`)
    const overlay = getGeneralRecruitOverlayRecord()
    const rangeKey = buildVolunteerInterviewOverlayKey('recruit', 'interviewTimeRange')
    const slotsKey = buildVolunteerInterviewOverlayKey('recruit', 'selectedSlotKeys')
    push(keys, isInterviewTimeRangeIncomplete(overlay[rangeKey]), `${prefix}.interview.interviewTimeRange`)
    push(keys, blankList(overlay[slotsKey]), `${prefix}.interview.selectedSlotKeys`)
  }
  push(keys, blankText(values.finalPassAnnouncementDate), `${prefix}.finalAnnounceIso`)
  push(keys, blankText(values.finalPassAnnouncementMethod), `${prefix}.finalAnnounceMethod`)
  push(keys, blankText(values.volunteerRecruitmentContactOrganizationName), `${prefix}.inquiryContact`)
  push(keys, blankText(values.volunteerContactPhone), `${prefix}.inquiryTel`)
  push(keys, blankText(values.volunteerContactEmail), `${prefix}.inquiryEmail`)
  if (values.volunteerRecruitmentNotesNotApplicable !== 'not_applicable') {
    push(keys, blankText(values.oneLineIntroduction), `${prefix}.notes`)
  }
  return keys
}

/** 상세 모집 수정 폼 값 → 등록 위저드와 같은 필수 누락 키 */
export function listIncompleteDetailRecruitmentHighlightKeys(args: {
  program: Program
  audience: DetailRecruitmentHighlightAudience
  values: ProgramDetailEditFormValues
}): string[] {
  if (args.audience === 'instructor') return listInstructor(args.values)
  if (args.audience === 'volunteer') return listVolunteer(args.program, args.values)
  return listParticipant(args.program, args.values)
}
