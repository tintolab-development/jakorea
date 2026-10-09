/**
 * 일반 모집 overlay ← nested *RecruitmentInfo · 컬럼.
 * leftover overlay가 같은 필드를 이기지 않게 저장·serialize에서 재생성한다.
 */
import type { Program } from '@/types/domain'
import dayjs from 'dayjs'
import {
  parseTargetLevelsFromDisplayLabel,
  resolveProgramInstructorTargets,
  resolveProgramTargetLevels,
  resolveProgramVolunteerTargets,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { pickRecruitmentCopyRow } from '@/features/program/shared/lib/recruitment-row-copy'

const inst = {
  targetLevels: 'recruit.targetLevels',
  targetLevelDetail: 'recruit.targetLevelDetail',
  inquiryContact: 'recruit.inquiryContact',
  inquiryTel: 'recruit.inquiryTel',
  inquiryEmail: 'recruit.inquiryEmail',
  notes: 'recruit.notes',
  notesNotApplicable: 'recruit.notesNotApplicable',
  announcementPublished: 'recruit.announcementPublished',
  studentListRequired: 'recruit.studentListRequired',
  recruitRangeSeal: 'recruit.recruitRangeSeal',
  programRangeSeal: 'recruit.programRangeSeal',
  finalAnnounceIso: 'recruit.finalAnnounceIso',
  finalAnnounceMethod: 'recruit.finalAnnounceMethod',
} as const

const keys = {
  individual: {
    recruitRangeSeal: 'recruit.individual.recruitRangeSeal',
    programRangeSeal: 'recruit.individual.programRangeSeal',
    targetLevels: 'recruit.individual.targetLevels',
    targetLevelDetail: 'recruit.individual.targetLevelDetail',
    inquiryContact: 'recruit.individual.inquiryContact',
    inquiryTel: 'recruit.individual.inquiryTel',
    inquiryEmail: 'recruit.individual.inquiryEmail',
    notes: 'recruit.individual.notes',
    notesNotApplicable: 'recruit.individual.notesNotApplicable',
  },
  instructor: {
    recruitRangeSeal: 'recruit.instructor.recruitRangeSeal',
    programRangeSeal: 'recruit.instructor.programRangeSeal',
    recruitTargets: 'recruit.instructor.recruitTargets',
    recruitTargetDetail: 'recruit.instructor.recruitTargetDetail',
    announcementPublished: 'recruit.instructor.announcementPublished',
    inquiryContact: 'recruit.instructor.inquiryContact',
    inquiryTel: 'recruit.instructor.inquiryTel',
    inquiryEmail: 'recruit.instructor.inquiryEmail',
    notes: 'recruit.instructor.notes',
  },
  volunteer: {
    recruitRangeSeal: 'recruit.volunteer.recruitRangeSeal',
    programRangeSeal: 'recruit.volunteer.programRangeSeal',
    volunteerTargets: 'recruit.volunteer.volunteerTargets',
    volunteerTargetDetail: 'recruit.volunteer.volunteerTargetDetail',
    announcementPublished: 'recruit.volunteer.announcementPublished',
    inquiryContact: 'recruit.volunteer.inquiryContact',
    inquiryTel: 'recruit.volunteer.inquiryTel',
    inquiryEmail: 'recruit.volunteer.inquiryEmail',
    notes: 'recruit.volunteer.notes',
    notesNotApplicable: 'recruit.volunteer.notesNotApplicable',
    interviewRequired: 'recruit.volunteer.interviewRequired',
    docDeadlineIso: 'recruit.volunteer.docDeadlineIso',
    docAnnounceMethod: 'recruit.volunteer.docAnnounceMethod',
    interviewRangeSeal: 'recruit.volunteer.interviewRangeSeal',
    interviewMethod: 'recruit.volunteer.interviewMethod',
    finalAnnounceIso: 'recruit.volunteer.finalAnnounceIso',
    finalAnnounceMethod: 'recruit.volunteer.finalAnnounceMethod',
  },
  detailInfo: {
    participantDescription: 'recruit.detailInfo.programDescription',
    participantGuide: 'recruit.detailInfo.recruitmentGuide',
    participantMethod: 'recruit.detailInfo.applicationMethod',
    participantLearningSupport: 'recruit.detailInfo.learningSupportContent',
    participantAdditionalHtml: 'recruit.detailInfo.additionalContentHtml',
    participantOtherNotes: 'recruit.detailInfo.otherNotes',
    instructorDescription: 'recruitInstructor.detailInfo.programDescription',
    instructorGuide: 'recruitInstructor.detailInfo.recruitmentGuide',
    instructorMethod: 'recruitInstructor.detailInfo.applicationMethod',
    instructorLearningSupport: 'recruitInstructor.detailInfo.learningSupportContent',
    instructorAdditionalHtml: 'recruitInstructor.detailInfo.additionalContentHtml',
    instructorOtherNotes: 'recruitInstructor.detailInfo.otherNotes',
    volunteerDescription: 'recruitVolunteer.detailInfo.programDescription',
    volunteerGuide: 'recruitVolunteer.detailInfo.recruitmentGuide',
    volunteerMethod: 'recruitVolunteer.detailInfo.applicationMethod',
    volunteerLearningSupport: 'recruitVolunteer.detailInfo.learningSupportContent',
    volunteerAdditionalHtml: 'recruitVolunteer.detailInfo.additionalContentHtml',
    volunteerOtherNotes: 'recruitVolunteer.detailInfo.otherNotes',
  },
} as const

function parseDisplayPeriodLabelToIsoRange(
  label: string | undefined
): { start?: string; end?: string } {
  if (!label?.trim() || label.trim() === '-') return {}
  const parts = label
    .split(/\s*[~\-–—]\s*/)
    .map(part => part.replace(/\([^)]*\)/g, '').trim())
    .filter(Boolean)
  if (parts.length < 2) return {}
  const start = dayjs(parts[0])
  const end = dayjs(parts[1])
  if (!start.isValid() || !end.isValid()) return {}
  return {
    start: start.startOf('day').toISOString(),
    end: end.startOf('day').toISOString(),
  }
}

function isoOrUndefined(value: string | Date | undefined): string | undefined {
  if (value == null) return undefined
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value.toISOString()
  const text = String(value).trim()
  return text ? text : undefined
}

function rangeSeal(
  start: string | Date | undefined,
  end: string | Date | undefined,
  fallbackLabel?: string
): { start: string; end: string } | undefined {
  const fromIsoStart = isoOrUndefined(start)
  const fromIsoEnd = isoOrUndefined(end)
  if (fromIsoStart && fromIsoEnd) return { start: fromIsoStart, end: fromIsoEnd }
  const parsed = parseDisplayPeriodLabelToIsoRange(fallbackLabel)
  if (parsed.start && parsed.end) return { start: parsed.start, end: parsed.end }
  return undefined
}

function publishedOverlay(value: boolean | undefined): 'published' | 'unpublished' | undefined {
  if (value === true) return 'published'
  if (value === false) return 'unpublished'
  return undefined
}

function yesNo(value: boolean | undefined): 'yes' | 'no' | undefined {
  if (value === true) return 'yes'
  if (value === false) return 'no'
  return undefined
}

function needNone(value: boolean | undefined): 'need' | 'none' | undefined {
  if (value === true) return 'need'
  if (value === false) return 'none'
  return undefined
}

/** 중첩·컬럼에서 모집 overlay 키를 채운다. 빈 값도 leftover를 덮는다. */
export function buildGeneralRecruitOverlayFromProgram(
  program: Program
): Record<string, unknown> {
  const common = program.generalCommonInfo
  const participant = common?.participantRecruitmentInfo
  const instructor = common?.instructorRecruitmentInfo
  const volunteer = common?.volunteerRecruitmentInfo
  const targetLevels = resolveProgramTargetLevels(program)
  const fromLabel = parseTargetLevelsFromDisplayLabel(
    participant?.educationTarget ?? participant?.recruitmentTarget
  )
  const levels = targetLevels.length > 0 ? targetLevels : fromLabel
  const targetDetail =
    program.educationTargetDetail?.trim() ||
    program.district?.trim() ||
    participant?.educationTargetDetail?.trim() ||
    participant?.recruitmentTargetDetail?.trim() ||
    ''
  const participantRecruit = rangeSeal(
    program.applicationStartDate,
    program.applicationEndDate,
    participant?.recruitmentPeriodLabel
  )
  const participantProgram = rangeSeal(
    program.startDate,
    program.endDate,
    participant?.operationPeriodLabel
  )
  const instructorRecruit = rangeSeal(
    program.instructorApplicationStartDate,
    program.instructorApplicationEndDate,
    instructor?.recruitmentPeriodLabel
  )
  const volunteerRecruit = rangeSeal(
    program.volunteerApplicationStartDate,
    program.volunteerApplicationEndDate,
    volunteer?.recruitmentPeriodLabel
  )
  const volunteerInterviewRange = rangeSeal(
    volunteer?.interviewStartDate ?? program.interviewStartDate,
    volunteer?.interviewEndDate ?? program.interviewEndDate
  )
  const inquiryContact =
    participant?.contactOrganizationName?.trim() ||
    participant?.contactName?.trim() ||
    program.contactName?.trim() ||
    ''
  const inquiryTel = participant?.inquiryTel?.trim() || program.contactPhone?.trim() || ''
  const inquiryEmail = participant?.inquiryEmail?.trim() || program.contactEmail?.trim() || ''
  const instructorTargets = resolveProgramInstructorTargets(program)
  const volunteerTargets = resolveProgramVolunteerTargets(program)

  const overlay: Record<string, unknown> = {
    [inst.targetLevels]: levels,
    [keys.individual.targetLevels]: levels,
    [inst.targetLevelDetail]: targetDetail,
    [keys.individual.targetLevelDetail]: targetDetail,
    [inst.inquiryContact]: inquiryContact,
    [keys.individual.inquiryContact]: inquiryContact,
    [inst.inquiryTel]: inquiryTel,
    [keys.individual.inquiryTel]: inquiryTel,
    [inst.inquiryEmail]: inquiryEmail,
    [keys.individual.inquiryEmail]: inquiryEmail,
    [inst.notes]: participant?.remarks?.trim() || '',
    [keys.individual.notes]: participant?.remarks?.trim() || '',
    [inst.notesNotApplicable]: participant?.notesNotApplicable === true,
    [keys.individual.notesNotApplicable]: participant?.notesNotApplicable === true,
    [keys.detailInfo.participantDescription]: participant?.programDescription?.trim() || '',
    [keys.detailInfo.participantGuide]: participant?.recruitmentGuide?.trim() || '',
    [keys.detailInfo.participantMethod]: participant?.applicationMethod?.trim() || '',
    [keys.detailInfo.participantLearningSupport]:
      participant?.learningSupportContent?.trim() || '',
    [keys.detailInfo.participantAdditionalHtml]: participant?.additionalContentHtml?.trim() || '',
    [keys.detailInfo.participantOtherNotes]: participant?.remarks?.trim() || '',
    [keys.instructor.recruitTargets]: instructorTargets,
    [keys.instructor.recruitTargetDetail]:
      program.instructorTargetDetail?.trim() || instructor?.recruitmentTargetDetail?.trim() || '',
    [keys.instructor.inquiryContact]:
      instructor?.contactOrganizationName?.trim() || '',
    [keys.instructor.inquiryTel]: instructor?.inquiryTel?.trim() || '',
    [keys.instructor.inquiryEmail]: instructor?.inquiryEmail?.trim() || '',
    [keys.instructor.notes]: instructor?.remarks?.trim() || '',
    [keys.detailInfo.instructorDescription]: instructor?.programDescription?.trim() || '',
    [keys.detailInfo.instructorGuide]: instructor?.recruitmentGuide?.trim() || '',
    [keys.detailInfo.instructorMethod]: instructor?.applicationMethod?.trim() || '',
    [keys.detailInfo.instructorLearningSupport]: instructor?.learningSupportContent?.trim() || '',
    [keys.detailInfo.instructorAdditionalHtml]: instructor?.additionalContentHtml?.trim() || '',
    [keys.detailInfo.instructorOtherNotes]:
      pickRecruitmentCopyRow(program, 'instructor')?.otherMatters?.trim() ||
      instructor?.otherMatters?.trim() ||
      '',
    [keys.volunteer.volunteerTargets]: volunteerTargets,
    [keys.volunteer.volunteerTargetDetail]:
      program.volunteerTargetDetail?.trim() || volunteer?.recruitmentTargetDetail?.trim() || '',
    [keys.volunteer.inquiryContact]: volunteer?.contactOrganizationName?.trim() || '',
    [keys.volunteer.inquiryTel]: volunteer?.inquiryTel?.trim() || '',
    [keys.volunteer.inquiryEmail]: volunteer?.inquiryEmail?.trim() || '',
    [keys.volunteer.notes]: volunteer?.remarks?.trim() || '',
    [keys.volunteer.notesNotApplicable]: volunteer?.notesNotApplicable === true,
    [keys.volunteer.interviewRequired]: yesNo(program.generalVolunteerInterviewEnabled),
    [keys.detailInfo.volunteerDescription]: volunteer?.programDescription?.trim() || '',
    [keys.detailInfo.volunteerGuide]: volunteer?.recruitmentGuide?.trim() || '',
    [keys.detailInfo.volunteerMethod]: volunteer?.applicationMethod?.trim() || '',
    [keys.detailInfo.volunteerLearningSupport]: volunteer?.learningSupportContent?.trim() || '',
    [keys.detailInfo.volunteerAdditionalHtml]: volunteer?.additionalContentHtml?.trim() || '',
    [keys.detailInfo.volunteerOtherNotes]:
      pickRecruitmentCopyRow(program, 'volunteer')?.otherMatters?.trim() ||
      volunteer?.otherMatters?.trim() ||
      '',
  }

  const published = publishedOverlay(participant?.announcementPublished)
  if (published) overlay[inst.announcementPublished] = published
  const instructorPublished = publishedOverlay(instructor?.announcementPublished)
  if (instructorPublished) overlay[keys.instructor.announcementPublished] = instructorPublished
  const volunteerPublished = publishedOverlay(volunteer?.announcementPublished)
  if (volunteerPublished) overlay[keys.volunteer.announcementPublished] = volunteerPublished

  const studentList = needNone(
    program.studentListRequired === 'required'
      ? true
      : program.studentListRequired === 'not_required'
        ? false
        : participant?.studentListRequired === 'required'
          ? true
          : participant?.studentListRequired === 'not_required'
            ? false
            : undefined
  )
  if (studentList) overlay[inst.studentListRequired] = studentList

  if (participantRecruit) {
    overlay[inst.recruitRangeSeal] = participantRecruit
    overlay[keys.individual.recruitRangeSeal] = participantRecruit
  }
  if (participantProgram) {
    overlay[inst.programRangeSeal] = participantProgram
    overlay[keys.individual.programRangeSeal] = participantProgram
  }
  if (instructorRecruit) overlay[keys.instructor.recruitRangeSeal] = instructorRecruit
  if (participantProgram) overlay[keys.instructor.programRangeSeal] = participantProgram
  if (volunteerRecruit) overlay[keys.volunteer.recruitRangeSeal] = volunteerRecruit
  if (participantProgram) overlay[keys.volunteer.programRangeSeal] = participantProgram
  if (volunteerInterviewRange) overlay[keys.volunteer.interviewRangeSeal] = volunteerInterviewRange

  const volunteerDocDeadline = isoOrUndefined(
    volunteer?.documentPassAnnouncementDate ?? program.documentPassAnnouncementDate
  )
  if (volunteerDocDeadline) overlay[keys.volunteer.docDeadlineIso] = volunteerDocDeadline
  const volunteerDocMethod =
    volunteer?.documentPassAnnouncementMethod?.trim() ||
    program.documentPassAnnouncementMethod?.trim()
  if (volunteerDocMethod) overlay[keys.volunteer.docAnnounceMethod] = volunteerDocMethod
  const volunteerInterviewMethod =
    volunteer?.interviewMethod?.trim() || program.interviewMethod?.trim()
  if (volunteerInterviewMethod) overlay[keys.volunteer.interviewMethod] = volunteerInterviewMethod
  const volunteerFinalIso = isoOrUndefined(
    volunteer?.finalPassAnnouncementDate ?? program.finalPassAnnouncementDate
  )
  if (volunteerFinalIso) overlay[keys.volunteer.finalAnnounceIso] = volunteerFinalIso
  const volunteerFinalMethod =
    volunteer?.finalPassAnnouncementMethod?.trim() ||
    program.finalPassAnnouncementMethod?.trim()
  if (volunteerFinalMethod) overlay[keys.volunteer.finalAnnounceMethod] = volunteerFinalMethod

  if (program.resultAnnouncementDate) {
    overlay[inst.finalAnnounceIso] = isoOrUndefined(program.resultAnnouncementDate)
  }
  if (program.resultAnnouncementMethod?.trim()) {
    overlay[inst.finalAnnounceMethod] = program.resultAnnouncementMethod.trim()
  }

  return overlay
}

export function resyncGeneralRecruitOverlayFromProgram(
  program: Program,
  editOverlay?: Record<string, unknown>
): Record<string, unknown> {
  const extra =
    editOverlay ??
    (program.registrationOverlay != null && typeof program.registrationOverlay === 'object'
      ? (program.registrationOverlay as Record<string, unknown>)
      : {})
  return { ...extra, ...buildGeneralRecruitOverlayFromProgram(program) }
}
