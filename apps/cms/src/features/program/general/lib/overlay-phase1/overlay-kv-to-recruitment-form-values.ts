/**
 * 테스트 전용 입력 어댑터. overlay KV → RecruitmentFormValues.
 * 프로덕션 Builder는 이 모듈을 import하지 않는다.
 */
import { APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS as INST } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-keys'
import { GENERAL_RECRUIT_OVERLAY_KEYS as KEYS } from '@/features/program/general/lib/general-recruit-overlay-to-program'
import { mapVolunteerInterviewExceptionsFromOverlay } from '@/features/program/shared/lib/volunteer-interview-exception-overlay'
import {
  isEphemeralThumbPreviewUrl,
  readRecruitDetailMediaFromOverlay,
} from '@/features/template/ui/form-set/recruit-form/shared/recruit-detail-info-media'
import { announcementPublishedFromFormValue } from '@/features/program/shared/lib/participant-recruitment-form-options'
import type {
  IndividualRecruitmentValues,
  InstitutionRecruitmentValues,
  InstructorRecruitmentValues,
  RecruitDetailHtml,
  RecruitRangeSeal,
  RecruitmentFormValues,
  RecruitmentSidecars,
  VolunteerRecruitmentValues,
} from './recruitment-form-values'

function overlayString(overlay: Record<string, unknown>, key: string): string | undefined {
  const v = overlay[key]
  if (typeof v !== 'string') return undefined
  const trimmed = v.trim()
  return trimmed ? trimmed : undefined
}

function overlayStringArray(overlay: Record<string, unknown>, key: string): string[] | undefined {
  const v = overlay[key]
  if (!Array.isArray(v)) return undefined
  const out = v
    .map(String)
    .map(s => s.trim())
    .filter(Boolean)
  return out.length > 0 ? out : undefined
}

function readRangeSeal(
  overlay: Record<string, unknown>,
  key: string
): RecruitRangeSeal | undefined {
  const v = overlay[key]
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined
  const start = (v as { start?: unknown }).start
  const end = (v as { end?: unknown }).end
  if (typeof start !== 'string' || typeof end !== 'string') return undefined
  if (!start.trim() || !end.trim()) return undefined
  return { start, end }
}

function overlayAnnouncementPublished(
  overlay: Record<string, unknown>,
  key: string
): boolean | undefined {
  const raw = overlay[key]
  if (raw === 'published' || raw === 'unpublished') {
    return announcementPublishedFromFormValue(raw)
  }
  if (typeof raw === 'boolean') return raw
  return undefined
}

function overlayYesNoBool(overlay: Record<string, unknown>, key: string): boolean | undefined {
  const raw = overlay[key]
  if (raw === 'yes') return true
  if (raw === 'no') return false
  if (typeof raw === 'boolean') return raw
  return undefined
}

function overlayNeedNoneBool(overlay: Record<string, unknown>, key: string): boolean | undefined {
  const raw = overlay[key]
  if (raw === 'need') return true
  if (raw === 'none') return false
  if (typeof raw === 'boolean') return raw
  return undefined
}

function overlayStudentListRequired(
  overlay: Record<string, unknown>,
  key: string
): 'required' | 'not_required' | undefined {
  const raw = overlay[key]
  if (raw === 'need' || raw === 'required') return 'required'
  if (raw === 'none' || raw === 'not_required') return 'not_required'
  return undefined
}

function overlayFiniteNumber(overlay: Record<string, unknown>, key: string): number | undefined {
  const raw = overlay[key]
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string' && raw.trim()) {
    const n = Number(raw)
    if (Number.isFinite(n)) return n
  }
  return undefined
}

function overlayTriBool(overlay: Record<string, unknown>, key: string): boolean | undefined {
  const raw = overlay[key]
  if (raw === true) return true
  if (raw === false) return false
  return undefined
}

function readDetailHtml(
  overlay: Record<string, unknown>,
  keys: {
    programDescription: string
    recruitmentGuide: string
    applicationMethod: string
    learningSupportContent: string
    additionalContentHtml: string
    otherNotes: string
  }
): RecruitDetailHtml | undefined {
  const html: RecruitDetailHtml = {
    programDescription: overlayString(overlay, keys.programDescription),
    recruitmentGuide: overlayString(overlay, keys.recruitmentGuide),
    applicationMethod: overlayString(overlay, keys.applicationMethod),
    learningSupportContent: overlayString(overlay, keys.learningSupportContent),
    additionalContentHtml: overlayString(overlay, keys.additionalContentHtml),
    otherNotes: overlayString(overlay, keys.otherNotes),
  }
  return Object.values(html).some(Boolean) ? html : undefined
}

function hasAnyInstitution(overlay: Record<string, unknown>): boolean {
  return Object.values(INST).some(key => Object.prototype.hasOwnProperty.call(overlay, key))
}

function hasPrefix(overlay: Record<string, unknown>, prefix: string): boolean {
  return Object.keys(overlay).some(key => key === prefix || key.startsWith(`${prefix}.`))
}

function readCertificate(overlay: Record<string, unknown>): boolean | undefined {
  const raw = overlayString(overlay, INST.certificateProvided)
  if (raw === 'provided' || raw === 'yes') return true
  if (raw === 'not_provided' || raw === 'none' || raw === 'no') return false
  return undefined
}

function institutionFromOverlay(
  overlay: Record<string, unknown>
): InstitutionRecruitmentValues | undefined {
  if (!hasAnyInstitution(overlay) && !hasPrefix(overlay, 'recruit.detailInfo')) return undefined
  return {
    maxAssignableInstructors: overlayFiniteNumber(overlay, INST.maxAssignableInstructors),
    maxClassCount: overlayFiniteNumber(overlay, INST.maxClassCount),
    maxScheduleCount: overlayFiniteNumber(overlay, INST.maxScheduleCount),
    maxSessionsPerDay: overlayFiniteNumber(overlay, INST.maxSessionsPerDay),
    announcementPublished: overlayAnnouncementPublished(overlay, INST.announcementPublished),
    preguidanceRequired: overlayNeedNoneBool(overlay, INST.preguidanceRequired),
    studentListRequired: overlayStudentListRequired(overlay, INST.studentListRequired),
    certificateProvided: readCertificate(overlay),
    recruitRangeSeal: readRangeSeal(overlay, INST.recruitRangeSeal),
    programRangeSeal: readRangeSeal(overlay, INST.programRangeSeal),
    finalAnnounceIso: overlayString(overlay, INST.finalAnnounceIso),
    finalAnnounceMethod: overlayString(overlay, INST.finalAnnounceMethod),
    targetLevels: overlayStringArray(overlay, INST.targetLevels),
    targetLevelDetail: overlayString(overlay, INST.targetLevelDetail),
    inquiryContact: overlayString(overlay, INST.inquiryContact),
    inquiryTel: overlayString(overlay, INST.inquiryTel),
    inquiryEmail: overlayString(overlay, INST.inquiryEmail),
    notes: overlayString(overlay, INST.notes),
    notesNotApplicable: overlayTriBool(overlay, INST.notesNotApplicable),
    detailHtml: readDetailHtml(overlay, {
      programDescription: KEYS.detailInfo.participantDescription,
      recruitmentGuide: KEYS.detailInfo.participantGuide,
      applicationMethod: KEYS.detailInfo.participantMethod,
      learningSupportContent: KEYS.detailInfo.participantLearningSupport,
      additionalContentHtml: KEYS.detailInfo.participantAdditionalHtml,
      otherNotes: KEYS.detailInfo.participantOtherNotes,
    }),
  }
}

function individualFromOverlay(
  overlay: Record<string, unknown>
): IndividualRecruitmentValues | undefined {
  if (!hasPrefix(overlay, 'recruit.individual') && !hasPrefix(overlay, 'recruit.detailInfo'))
    return undefined
  return {
    recruitRangeSeal: readRangeSeal(overlay, KEYS.individual.recruitRangeSeal),
    programRangeSeal: readRangeSeal(overlay, KEYS.individual.programRangeSeal),
    announcementPublished: overlayAnnouncementPublished(
      overlay,
      KEYS.individual.announcementPublished
    ),
    interviewRequired: overlayYesNoBool(overlay, KEYS.individual.interviewRequired),
    targetLevels: overlayStringArray(overlay, KEYS.individual.targetLevels),
    targetLevelDetail: overlayString(overlay, KEYS.individual.targetLevelDetail),
    docDeadlineIso: overlayString(overlay, KEYS.individual.docDeadlineIso),
    docAnnounceMethod: overlayString(overlay, KEYS.individual.docAnnounceMethod),
    interviewRangeSeal: readRangeSeal(overlay, KEYS.individual.interviewRangeSeal),
    interviewMethod: overlayString(overlay, KEYS.individual.interviewMethod),
    finalAnnounceIso: overlayString(overlay, KEYS.individual.finalAnnounceIso),
    finalAnnounceMethod: overlayString(overlay, KEYS.individual.finalAnnounceMethod),
    inquiryContact: overlayString(overlay, KEYS.individual.inquiryContact),
    inquiryTel: overlayString(overlay, KEYS.individual.inquiryTel),
    inquiryEmail: overlayString(overlay, KEYS.individual.inquiryEmail),
    notes: overlayString(overlay, KEYS.individual.notes),
    notesNotApplicable: overlayTriBool(overlay, KEYS.individual.notesNotApplicable),
    detailHtml: readDetailHtml(overlay, {
      programDescription: KEYS.detailInfo.participantDescription,
      recruitmentGuide: KEYS.detailInfo.participantGuide,
      applicationMethod: KEYS.detailInfo.participantMethod,
      learningSupportContent: KEYS.detailInfo.participantLearningSupport,
      additionalContentHtml: KEYS.detailInfo.participantAdditionalHtml,
      otherNotes: KEYS.detailInfo.participantOtherNotes,
    }),
  }
}

function instructorFromOverlay(
  overlay: Record<string, unknown>
): InstructorRecruitmentValues | undefined {
  if (
    !hasPrefix(overlay, 'recruit.instructor') &&
    !hasPrefix(overlay, 'recruitInstructor.detailInfo')
  ) {
    return undefined
  }
  return {
    recruitRangeSeal: readRangeSeal(overlay, KEYS.instructor.recruitRangeSeal),
    programRangeSeal: readRangeSeal(overlay, KEYS.instructor.programRangeSeal),
    recruitTargets: overlayStringArray(overlay, KEYS.instructor.recruitTargets),
    recruitTargetDetail: overlayString(overlay, KEYS.instructor.recruitTargetDetail),
    announcementPublished: overlayAnnouncementPublished(
      overlay,
      KEYS.instructor.announcementPublished
    ),
    inquiryContact: overlayString(overlay, KEYS.instructor.inquiryContact),
    inquiryTel: overlayString(overlay, KEYS.instructor.inquiryTel),
    inquiryEmail: overlayString(overlay, KEYS.instructor.inquiryEmail),
    notes: overlayString(overlay, KEYS.instructor.notes),
    finalAnnounceIso: overlayString(overlay, KEYS.instructor.finalAnnounceIso),
    finalAnnounceMethod: overlayString(overlay, KEYS.instructor.finalAnnounceMethod),
    detailHtml: readDetailHtml(overlay, {
      programDescription: KEYS.detailInfo.instructorDescription,
      recruitmentGuide: KEYS.detailInfo.instructorGuide,
      applicationMethod: KEYS.detailInfo.instructorMethod,
      learningSupportContent: KEYS.detailInfo.instructorLearningSupport,
      additionalContentHtml: KEYS.detailInfo.instructorAdditionalHtml,
      otherNotes: KEYS.detailInfo.instructorOtherNotes,
    }),
  }
}

function volunteerFromOverlay(
  overlay: Record<string, unknown>
): VolunteerRecruitmentValues | undefined {
  if (!hasPrefix(overlay, 'recruit.volunteer') && !hasPrefix(overlay, 'recruitVolunteer'))
    return undefined
  const exclusionRaw = overlay['recruit.volunteer.interview.exclusionState']
  const exclusion =
    exclusionRaw != null && typeof exclusionRaw === 'object' && !Array.isArray(exclusionRaw)
      ? {
          excludeNone: (exclusionRaw as { excludeNone?: boolean }).excludeNone === true,
          excludeSaturday: (exclusionRaw as { excludeSaturday?: boolean }).excludeSaturday === true,
          excludeSunday: (exclusionRaw as { excludeSunday?: boolean }).excludeSunday === true,
          excludeHoliday: (exclusionRaw as { excludeHoliday?: boolean }).excludeHoliday === true,
        }
      : undefined
  const appliedRaw = overlay['recruit.volunteer.interview.appliedUnavailableDates']
  return {
    recruitRangeSeal: readRangeSeal(overlay, KEYS.volunteer.recruitRangeSeal),
    programRangeSeal: readRangeSeal(overlay, KEYS.volunteer.programRangeSeal),
    volunteerTargets: overlayStringArray(overlay, KEYS.volunteer.volunteerTargets),
    volunteerTargetDetail: overlayString(overlay, KEYS.volunteer.volunteerTargetDetail),
    announcementPublished: overlayAnnouncementPublished(
      overlay,
      KEYS.volunteer.announcementPublished
    ),
    interviewRequired: overlayYesNoBool(overlay, KEYS.volunteer.interviewRequired),
    docDeadlineIso: overlayString(overlay, KEYS.volunteer.docDeadlineIso),
    docAnnounceMethod: overlayString(overlay, KEYS.volunteer.docAnnounceMethod),
    interviewRangeSeal: readRangeSeal(overlay, KEYS.volunteer.interviewRangeSeal),
    interviewMethod: overlayString(overlay, KEYS.volunteer.interviewMethod),
    finalAnnounceIso: overlayString(overlay, KEYS.volunteer.finalAnnounceIso),
    finalAnnounceMethod: overlayString(overlay, KEYS.volunteer.finalAnnounceMethod),
    inquiryContact: overlayString(overlay, KEYS.volunteer.inquiryContact),
    inquiryTel: overlayString(overlay, KEYS.volunteer.inquiryTel),
    inquiryEmail: overlayString(overlay, KEYS.volunteer.inquiryEmail),
    notes: overlayString(overlay, KEYS.volunteer.notes),
    notesNotApplicable: overlayTriBool(overlay, KEYS.volunteer.notesNotApplicable),
    detailHtml: readDetailHtml(overlay, {
      programDescription: KEYS.detailInfo.volunteerDescription,
      recruitmentGuide: KEYS.detailInfo.volunteerGuide,
      applicationMethod: KEYS.detailInfo.volunteerMethod,
      learningSupportContent: KEYS.detailInfo.volunteerLearningSupport,
      additionalContentHtml: KEYS.detailInfo.volunteerAdditionalHtml,
      otherNotes: KEYS.detailInfo.volunteerOtherNotes,
    }),
    interview: {
      selectedSlotKeys: overlayStringArray(overlay, 'recruit.volunteer.interview.selectedSlotKeys'),
      interviewTimeRange: overlay['recruit.volunteer.interview.interviewTimeRange'],
      timeUnit: overlay['recruit.volunteer.interview.timeUnit'],
      exclusionState: exclusion,
      appliedUnavailableDates: Array.isArray(appliedRaw)
        ? appliedRaw
            .map(String)
            .map(s => s.trim())
            .filter(Boolean)
        : undefined,
      exceptions: mapVolunteerInterviewExceptionsFromOverlay(overlay, 'recruit'),
    },
  }
}

export function overlayKvToRecruitmentFormValues(
  overlay: Record<string, unknown>
): RecruitmentFormValues {
  return {
    institution: institutionFromOverlay(overlay),
    individual: individualFromOverlay(overlay),
    instructor: instructorFromOverlay(overlay),
    volunteer: volunteerFromOverlay(overlay),
  }
}

export function overlayKvToRecruitmentSidecars(
  overlay: Record<string, unknown>
): RecruitmentSidecars {
  const media = readRecruitDetailMediaFromOverlay(overlay)
  return {
    overlayKeyOrder: Object.keys(overlay),
    unownedOverlay: overlay,
    media: {
      origin: media.thumbFileObjectId
        ? 'uploaded-object-id'
        : isEphemeralThumbPreviewUrl(media.thumbObjectUrl)
          ? 'ephemeral-blob'
          : 'empty',
      ...media,
    },
  }
}

export function overlayKvToIndependentRecruitmentInput(overlay: Record<string, unknown>): {
  formValues: RecruitmentFormValues
  sidecars: RecruitmentSidecars
} {
  return {
    formValues: overlayKvToRecruitmentFormValues(overlay),
    sidecars: overlayKvToRecruitmentSidecars(overlay),
  }
}
