/**
 * 모집 Independent 도메인 계산.
 * 기존 모집 overlay apply 및 overlay store 를 호출하지 않는다.
 */
import type {
  GeneralProgramVolunteerInterviewScheduleInfo,
  Program,
  TargetLevel,
} from '@/types/domain'
import { formatAnnouncementLabel } from '@/features/program/shared/lib/announcement-label'
import { buildRecurringUnavailableLabel } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'
import {
  formatDateOnly,
  formatDateRange,
  formatInstructorTargetsLabel,
  formatTargetLevelsLabel,
  formatVolunteerTargetsLabel,
  normalizeInstructorTargetList,
  normalizeVolunteerTargetList,
  parseTargetLevelsFromDisplayLabel,
  resolvePersistedProgramTargetLevels,
  resolveProgramTargetLevels,
} from '@/features/program/shared/lib/program-detail-info-constants'
import dayjs from 'dayjs'

function isEphemeralThumbPreviewUrl(url: string | null | undefined): boolean {
  return Boolean(url?.trim().startsWith('blob:'))
}
import { participantFlagsFromGeneralProgram } from '@/features/program/general/lib/participant-audience-selection'
import { coalesceResultAnnouncementDate } from '@/features/program/shared/lib/resolve-result-announcement-date'
import type {
  InstructorRecruitmentValues,
  RecruitDetailHtml,
  RecruitmentFormValues,
  RecruitmentSidecars,
  VolunteerInterviewValues,
  VolunteerRecruitmentValues,
} from './recruitment-form-values'

function pickParticipantOverlayValue<T>(
  organization: boolean,
  institutionValue: T | undefined,
  individualValue: T | undefined
): T | undefined {
  return organization ? (institutionValue ?? individualValue) : (individualValue ?? institutionValue)
}

const TARGET_LEVEL_VALUES = new Set<string>(['elementary', 'middle', 'high', 'university', 'adult'])

function coalesceString(
  programVal: string | undefined,
  overlayVal: string | undefined,
  preferOverlay: boolean
): string | undefined {
  if (preferOverlay) {
    if (overlayVal?.trim()) return overlayVal
    const trimmed = programVal?.trim()
    return trimmed ? programVal : overlayVal
  }
  const trimmed = programVal?.trim()
  if (trimmed) return programVal
  return overlayVal
}
function coalesceIso(
  programVal: string | Date | undefined,
  overlayIso: string | undefined,
  preferOverlay: boolean
): string | Date | undefined {
  if (preferOverlay) {
    if (overlayIso?.trim()) return overlayIso
    if (programVal != null && String(programVal).trim() !== '') return programVal
    return overlayIso
  }
  if (programVal != null && String(programVal).trim() !== '') return programVal
  return overlayIso
}

function coalesceBool(
  programVal: boolean | undefined,
  overlayVal: boolean | undefined,
  preferOverlay: boolean
): boolean | undefined {
  if (preferOverlay) {
    if (overlayVal !== undefined) return overlayVal
    return programVal
  }
  if (programVal !== undefined) return programVal
  return overlayVal
}

function coalesceNumber(
  programVal: number | undefined,
  overlayVal: number | undefined,
  preferOverlay: boolean
): number | undefined {
  if (preferOverlay) {
    if (overlayVal !== undefined) return overlayVal
    return programVal
  }
  if (programVal !== undefined) return programVal
  return overlayVal
}

function parseTargetLevels(raw: string[] | undefined): TargetLevel[] | undefined {
  if (!raw?.length) return undefined
  const levels = raw.filter((item): item is TargetLevel => TARGET_LEVEL_VALUES.has(item))
  return levels.length > 0 ? levels : undefined
}

function formatAvailableTimeSlotsFromSelectedKeys(keys: unknown): string | undefined {
  if (!Array.isArray(keys) || keys.length === 0) return undefined
  const labels = keys
    .map(key => {
      if (typeof key !== 'string' || !key.trim()) return null
      const match = /^(\d+)-(\d+)$/.exec(key.trim())
      if (!match) return null
      const start = dayjs(Number(match[1]))
      const end = dayjs(Number(match[2]))
      if (!start.isValid() || !end.isValid()) return null
      return `${start.format('HH:mm')} ~ ${end.format('HH:mm')}`
    })
    .filter((label): label is string => label != null)
  return labels.length > 0 ? labels.join(', ') : undefined
}

function parseInterviewScheduleTimeUnitMinutes(value: unknown): number {
  if (value === '15' || value === 15) return 15
  if (value === '60' || value === 60) return 60
  return 30
}

function formatAvailableTimeSlotsFromInterviewTimeRange(
  rangeRaw: unknown,
  timeUnitRaw: unknown
): string | undefined {
  if (!Array.isArray(rangeRaw) || rangeRaw.length < 2) return undefined
  const start = dayjs(rangeRaw[0] as string | number | Date)
  const end = dayjs(rangeRaw[1] as string | number | Date)
  if (!start.isValid() || !end.isValid()) return undefined
  const minutes = parseInterviewScheduleTimeUnitMinutes(timeUnitRaw)
  const labels: string[] = []
  let cursor = start
  while (labels.length < 96) {
    const next = cursor.add(minutes, 'minute')
    if (next.isAfter(end)) break
    labels.push(`${cursor.format('HH:mm')} ~ ${next.format('HH:mm')}`)
    cursor = next
  }
  return labels.length > 0 ? labels.join(', ') : undefined
}

function countVolunteerInterviewTimeSlotLabels(value: string | undefined): number {
  if (!value?.trim()) return 0
  return value
    .split(',')
    .map(part => part.trim())
    .filter(Boolean).length
}

function pickRicherAvailableTimeSlots(nested?: string, fromOverlay?: string): string | undefined {
  const n = nested?.trim()
  const o = fromOverlay?.trim()
  if (!n) return o
  if (!o) return n
  return countVolunteerInterviewTimeSlotLabels(o) >= countVolunteerInterviewTimeSlotLabels(n)
    ? o
    : n
}

function pickNonEmptyScheduleString(nested?: string, fromOverlay?: string): string | undefined {
  const nestedTrim = nested?.trim()
  if (nestedTrim) return nested
  const overlayTrim = fromOverlay?.trim()
  return overlayTrim ? fromOverlay : nested
}

function mergeVolunteerInterviewScheduleInfo(
  nested: GeneralProgramVolunteerInterviewScheduleInfo | undefined,
  fromOverlay: GeneralProgramVolunteerInterviewScheduleInfo | undefined,
  preferOverlay: boolean
): GeneralProgramVolunteerInterviewScheduleInfo | undefined {
  if (!nested && !fromOverlay) return undefined
  if (!nested) return fromOverlay
  if (!fromOverlay) return nested
  return {
    ...fromOverlay,
    ...nested,
    recurringUnavailable: pickNonEmptyScheduleString(
      preferOverlay ? fromOverlay.recurringUnavailable : nested.recurringUnavailable,
      preferOverlay ? nested.recurringUnavailable : fromOverlay.recurringUnavailable
    ),
    specificUnavailableDates: pickNonEmptyScheduleString(
      preferOverlay ? fromOverlay.specificUnavailableDates : nested.specificUnavailableDates,
      preferOverlay ? nested.specificUnavailableDates : fromOverlay.specificUnavailableDates
    ),
    specificUnavailableDateIsos: preferOverlay
      ? fromOverlay.specificUnavailableDateIsos?.length
        ? fromOverlay.specificUnavailableDateIsos
        : nested.specificUnavailableDateIsos
      : nested.specificUnavailableDateIsos?.length
        ? nested.specificUnavailableDateIsos
        : fromOverlay.specificUnavailableDateIsos,
    availableTimeSlots: preferOverlay
      ? pickNonEmptyScheduleString(fromOverlay.availableTimeSlots, nested.availableTimeSlots)
      : pickRicherAvailableTimeSlots(nested.availableTimeSlots, fromOverlay.availableTimeSlots),
    exceptions: nested.exceptions?.length ? nested.exceptions : fromOverlay.exceptions,
    periodStartDate: nested.periodStartDate ?? fromOverlay.periodStartDate,
    periodEndDate: nested.periodEndDate ?? fromOverlay.periodEndDate,
  }
}

function firstHtml(
  participant?: RecruitDetailHtml,
  instructor?: RecruitDetailHtml,
  volunteer?: RecruitDetailHtml
): RecruitDetailHtml {
  const pick = (key: keyof RecruitDetailHtml) =>
    participant?.[key]?.trim() || instructor?.[key]?.trim() || volunteer?.[key]?.trim() || undefined
  return {
    programDescription: pick('programDescription'),
    recruitmentGuide: pick('recruitmentGuide'),
    applicationMethod: pick('applicationMethod'),
    learningSupportContent: pick('learningSupportContent'),
    additionalContentHtml: pick('additionalContentHtml'),
    otherNotes: pick('otherNotes'),
  }
}

function formatSpecificUnavailableDateLabel(isos: string[]): string | undefined {
  if (isos.length === 0) return undefined
  const labels = isos.map(iso => {
    const formatted = formatDateOnly(iso)
    return formatted === '-' ? iso : formatted
  })
  return labels.join(', ')
}

function interviewScheduleFromValues(
  interview: VolunteerInterviewValues | undefined,
  interviewRequired: boolean | undefined
): GeneralProgramVolunteerInterviewScheduleInfo | undefined {
  if (interviewRequired === false || interview == null) return undefined
  const exclusion = interview.exclusionState
  const specificUnavailableDateIsos = interview.appliedUnavailableDates ?? []
  const recurringUnavailable = exclusion ? buildRecurringUnavailableLabel(exclusion) : undefined
  const hasSelectedKeys =
    Array.isArray(interview.selectedSlotKeys) && interview.selectedSlotKeys.length > 0
  const availableTimeSlots = hasSelectedKeys
    ? formatAvailableTimeSlotsFromSelectedKeys(interview.selectedSlotKeys)
    : formatAvailableTimeSlotsFromInterviewTimeRange(
        interview.interviewTimeRange,
        interview.timeUnit
      )
  const specificUnavailableDates = formatSpecificUnavailableDateLabel(specificUnavailableDateIsos)
  const exceptions = interview.exceptions ?? []
  if (
    !recurringUnavailable &&
    !specificUnavailableDates &&
    !specificUnavailableDateIsos.length &&
    !availableTimeSlots &&
    exceptions.length === 0
  ) {
    return undefined
  }
  return {
    ...(recurringUnavailable ? { recurringUnavailable } : {}),
    ...(specificUnavailableDates ? { specificUnavailableDates } : {}),
    ...(specificUnavailableDateIsos.length > 0 ? { specificUnavailableDateIsos } : {}),
    ...(availableTimeSlots ? { availableTimeSlots } : {}),
    ...(exceptions.length > 0 ? { exceptions } : {}),
  }
}

export function applyIndependentRecruitmentFormValues(
  program: Program,
  values: RecruitmentFormValues,
  sidecars: RecruitmentSidecars | undefined,
  preferOverlay: boolean
): Program {
  const institution = values.institution
  const individual = values.individual
  const instructor = values.instructor
  const volunteer = values.volunteer
  const hasAny =
    institution != null ||
    individual != null ||
    instructor != null ||
    volunteer != null ||
    sidecars?.media != null
  if (!hasAny) return program

  const keepRecruitmentRows = (program.programRecruitments?.length ?? 0) > 0
  const preferInstitution = participantFlagsFromGeneralProgram(program).organization === true

  const participantRecruitRange = keepRecruitmentRows
    ? undefined
    : pickParticipantOverlayValue(
        preferInstitution,
        institution?.recruitRangeSeal,
        individual?.recruitRangeSeal
      )
  const participantProgramRange = keepRecruitmentRows
    ? undefined
    : pickParticipantOverlayValue(
        preferInstitution,
        institution?.programRangeSeal,
        individual?.programRangeSeal
      )
  const instructorRecruitRange = keepRecruitmentRows ? undefined : instructor?.recruitRangeSeal
  const instructorProgramRange = keepRecruitmentRows ? undefined : instructor?.programRangeSeal
  const volunteerRecruitRange = keepRecruitmentRows ? undefined : volunteer?.recruitRangeSeal
  const volunteerProgramRange = keepRecruitmentRows ? undefined : volunteer?.programRangeSeal

  const targetLevels = pickParticipantOverlayValue(
    preferInstitution,
    parseTargetLevels(institution?.targetLevels),
    parseTargetLevels(individual?.targetLevels)
  )
  const targetLevelDetail = pickParticipantOverlayValue(
    preferInstitution,
    institution?.targetLevelDetail,
    individual?.targetLevelDetail
  )

  const instructorTargetsRaw = instructor?.recruitTargets
  const instructorTargets =
    instructorTargetsRaw?.length && instructorTargetsRaw.length > 0
      ? normalizeInstructorTargetList(instructorTargetsRaw)
      : instructorTargetsRaw
  const instructorTargetDetail = instructor?.recruitTargetDetail
  const volunteerTargetsRaw = volunteer?.volunteerTargets
  const volunteerTargets =
    volunteerTargetsRaw?.length && volunteerTargetsRaw.length > 0
      ? normalizeVolunteerTargetList(volunteerTargetsRaw)
      : volunteerTargetsRaw
  const volunteerTargetDetail = volunteer?.volunteerTargetDetail

  const participantContact = keepRecruitmentRows
    ? undefined
    : pickParticipantOverlayValue(
        preferInstitution,
        institution?.inquiryContact,
        individual?.inquiryContact
      )
  const participantTel = keepRecruitmentRows
    ? undefined
    : pickParticipantOverlayValue(
        preferInstitution,
        institution?.inquiryTel,
        individual?.inquiryTel
      )
  const participantEmail = keepRecruitmentRows
    ? undefined
    : pickParticipantOverlayValue(
        preferInstitution,
        institution?.inquiryEmail,
        individual?.inquiryEmail
      )
  const instructorContact = keepRecruitmentRows ? undefined : instructor?.inquiryContact
  const instructorTel = keepRecruitmentRows ? undefined : instructor?.inquiryTel
  const instructorEmail = keepRecruitmentRows ? undefined : instructor?.inquiryEmail
  const volunteerContact = keepRecruitmentRows ? undefined : volunteer?.inquiryContact
  const volunteerTel = keepRecruitmentRows ? undefined : volunteer?.inquiryTel
  const volunteerEmail = keepRecruitmentRows ? undefined : volunteer?.inquiryEmail

  const html = firstHtml(
    pickParticipantOverlayValue(preferInstitution, institution?.detailHtml, individual?.detailHtml),
    instructor?.detailHtml,
    volunteer?.detailHtml
  )
  const description = coalesceString(program.description, html.programDescription, preferOverlay)
  const recruitmentGuide = coalesceString(
    program.recruitmentGuide,
    html.recruitmentGuide,
    preferOverlay
  )
  const applicationMethod = coalesceString(
    program.applicationMethod,
    html.applicationMethod,
    preferOverlay
  )
  const learningSupportContent = coalesceString(
    program.learningSupportContent,
    html.learningSupportContent,
    preferOverlay
  )
  const additionalContentHtml = coalesceString(
    program.additionalContentHtml,
    html.additionalContentHtml,
    preferOverlay
  )

  const participantPeriodLabel = participantRecruitRange
    ? formatDateRange(participantRecruitRange.start, participantRecruitRange.end)
    : undefined
  const instructorPeriodLabel = instructorRecruitRange
    ? formatDateRange(instructorRecruitRange.start, instructorRecruitRange.end)
    : undefined
  const volunteerPeriodLabel = volunteerRecruitRange
    ? formatDateRange(volunteerRecruitRange.start, volunteerRecruitRange.end)
    : undefined
  const operationFromParticipant = participantProgramRange
    ? formatDateRange(participantProgramRange.start, participantProgramRange.end)
    : undefined
  const operationFromInstructor = instructorProgramRange
    ? formatDateRange(instructorProgramRange.start, instructorProgramRange.end)
    : undefined
  const operationFromVolunteer = volunteerProgramRange
    ? formatDateRange(volunteerProgramRange.start, volunteerProgramRange.end)
    : undefined

  const common = program.generalCommonInfo ?? {}
  const participantInfo = { ...(common.participantRecruitmentInfo ?? {}) }
  const instructorInfo = { ...(common.instructorRecruitmentInfo ?? {}) }
  const volunteerInfo = { ...(common.volunteerRecruitmentInfo ?? {}) }

  const participantTargetLabel = targetLevels?.length
    ? formatTargetLevelsLabel(targetLevels)
    : undefined
  if (participantTargetLabel && participantTargetLabel !== '-') {
    const nextTarget = coalesceString(
      participantInfo.educationTarget ?? participantInfo.recruitmentTarget,
      participantTargetLabel,
      preferOverlay
    )
    if (nextTarget) {
      participantInfo.educationTarget = nextTarget
      participantInfo.recruitmentTarget = nextTarget
    }
  }
  if (targetLevelDetail) {
    const nextDetail = coalesceString(
      participantInfo.educationTargetDetail ?? participantInfo.recruitmentTargetDetail,
      targetLevelDetail,
      preferOverlay
    )
    if (nextDetail) {
      participantInfo.educationTargetDetail = nextDetail
      participantInfo.recruitmentTargetDetail = nextDetail
    }
  }
  if (participantContact) {
    participantInfo.contactOrganizationName = coalesceString(
      participantInfo.contactOrganizationName,
      participantContact,
      preferOverlay
    )
  }
  if (participantTel) {
    participantInfo.inquiryTel = coalesceString(
      participantInfo.inquiryTel ?? participantInfo.tel ?? participantInfo.contactPhone,
      participantTel,
      preferOverlay
    )
  }
  if (participantEmail) {
    participantInfo.inquiryEmail = coalesceString(
      participantInfo.inquiryEmail ?? participantInfo.email ?? participantInfo.contactEmail,
      participantEmail,
      preferOverlay
    )
  }
  if (participantPeriodLabel && participantPeriodLabel !== '-') {
    participantInfo.recruitmentPeriodLabel = coalesceString(
      participantInfo.recruitmentPeriodLabel,
      participantPeriodLabel,
      preferOverlay
    )
  }
  if (operationFromParticipant && operationFromParticipant !== '-') {
    participantInfo.operationPeriodLabel = coalesceString(
      participantInfo.operationPeriodLabel,
      operationFromParticipant,
      preferOverlay
    )
  }

  const participantHtml = pickParticipantOverlayValue(
    preferInstitution,
    institution?.detailHtml,
    individual?.detailHtml
  )
  const participantDescription = participantHtml?.programDescription
  const participantGuide = participantHtml?.recruitmentGuide
  const participantMethod = participantHtml?.applicationMethod
  const participantRemarks =
    pickParticipantOverlayValue(preferInstitution, institution?.notes, individual?.notes) ??
    participantHtml?.otherNotes
  if (participantDescription) {
    participantInfo.programDescription = coalesceString(
      participantInfo.programDescription,
      participantDescription,
      preferOverlay
    )
  }
  if (participantGuide) {
    participantInfo.recruitmentGuide = coalesceString(
      participantInfo.recruitmentGuide,
      participantGuide,
      preferOverlay
    )
  }
  if (participantMethod) {
    participantInfo.applicationMethod = coalesceString(
      participantInfo.applicationMethod,
      participantMethod,
      preferOverlay
    )
  }
  if (participantHtml?.learningSupportContent) {
    participantInfo.learningSupportContent = coalesceString(
      participantInfo.learningSupportContent,
      participantHtml.learningSupportContent,
      preferOverlay
    )
  }
  if (participantHtml?.additionalContentHtml) {
    participantInfo.additionalContentHtml = coalesceString(
      participantInfo.additionalContentHtml,
      participantHtml.additionalContentHtml,
      preferOverlay
    )
  }
  if (participantRemarks) {
    participantInfo.remarks = coalesceString(
      participantInfo.remarks,
      participantRemarks,
      preferOverlay
    )
  }

  const institutionAnnouncementPublished =
    pickParticipantOverlayValue(
      preferInstitution,
      institution?.announcementPublished,
      individual?.announcementPublished
    ) ?? (participantRecruitRange || participantContact ? true : undefined)
  const institutionPreguidance = institution?.preguidanceRequired
  const institutionStudentList = institution?.studentListRequired
  const institutionCertificate = institution?.certificateProvided
  const participantFinalAnnounceIso = pickParticipantOverlayValue(
    preferInstitution,
    institution?.finalAnnounceIso,
    individual?.finalAnnounceIso
  )
  const participantFinalAnnounceMethod = pickParticipantOverlayValue(
    preferInstitution,
    institution?.finalAnnounceMethod,
    individual?.finalAnnounceMethod
  )
  const participantFinalAnnouncementLabel = formatAnnouncementLabel(
    participantFinalAnnounceIso,
    participantFinalAnnounceMethod
  )

  if (institutionAnnouncementPublished !== undefined) {
    const nextPublished = coalesceBool(
      participantInfo.announcementPublished,
      institutionAnnouncementPublished,
      preferOverlay
    )
    if (nextPublished !== undefined) {
      participantInfo.announcementPublished = nextPublished
      participantInfo.announcementPublishedLabel = nextPublished ? '게시' : '미게시'
    }
  }
  if (institutionPreguidance !== undefined) {
    const nextPreguidance = coalesceBool(
      participantInfo.preEducationNoticeRequired ?? participantInfo.advanceGuidanceRequired,
      institutionPreguidance,
      preferOverlay
    )
    if (nextPreguidance !== undefined) {
      participantInfo.preEducationNoticeRequired = nextPreguidance
      participantInfo.advanceGuidanceRequired = nextPreguidance
      participantInfo.preEducationNoticeRequiredLabel = nextPreguidance ? '작성' : '해당없음'
      participantInfo.advanceGuidanceRequiredLabel = nextPreguidance ? '작성' : '해당없음'
    }
  }
  if (institutionStudentList !== undefined) {
    if (preferOverlay || participantInfo.studentListRequired == null) {
      participantInfo.studentListRequired = institutionStudentList
      participantInfo.studentListRequiredLabel =
        institutionStudentList === 'required' ? '제출 필요' : '제출 불필요'
    }
  }
  if (institutionCertificate !== undefined) {
    const nextCert = coalesceBool(
      participantInfo.certificateIssuanceProvided,
      institutionCertificate,
      preferOverlay
    )
    if (nextCert !== undefined) participantInfo.certificateIssuanceProvided = nextCert
  }
  if (institution?.maxAssignableInstructors !== undefined) {
    participantInfo.maxAssignableInstructors = coalesceNumber(
      participantInfo.maxAssignableInstructors,
      institution.maxAssignableInstructors,
      preferOverlay
    )
  }
  if (institution?.maxClassCount !== undefined) {
    participantInfo.maxClassCount = coalesceNumber(
      participantInfo.maxClassCount,
      institution.maxClassCount,
      preferOverlay
    )
  }
  if (institution?.maxScheduleCount !== undefined) {
    participantInfo.maxScheduleCount = coalesceNumber(
      participantInfo.maxScheduleCount,
      institution.maxScheduleCount,
      preferOverlay
    )
  }
  if (institution?.maxSessionsPerDay !== undefined) {
    participantInfo.maxSessionsPerDay = coalesceNumber(
      participantInfo.maxSessionsPerDay,
      institution.maxSessionsPerDay,
      preferOverlay
    )
  }
  if (participantFinalAnnouncementLabel) {
    const nextFinal = coalesceString(
      participantInfo.finalAnnouncementLabel ?? participantInfo.resultAnnouncementLabel,
      participantFinalAnnouncementLabel,
      preferOverlay
    )
    if (nextFinal) {
      participantInfo.finalAnnouncementLabel = nextFinal
      participantInfo.resultAnnouncementLabel = nextFinal
    }
  }
  const overlayParticipantNotesNA = pickParticipantOverlayValue(
    preferInstitution,
    institution?.notesNotApplicable,
    individual?.notesNotApplicable
  )
  if (overlayParticipantNotesNA !== undefined) {
    const nextNotesNA = coalesceBool(
      participantInfo.notesNotApplicable,
      overlayParticipantNotesNA,
      preferOverlay
    )
    if (nextNotesNA !== undefined) participantInfo.notesNotApplicable = nextNotesNA
  }
  const individualInterviewEnabled = keepRecruitmentRows
    ? undefined
    : individual?.interviewRequired
  if (individualInterviewEnabled !== undefined) {
    const nextInterview = coalesceBool(
      participantInfo.interviewEnabled,
      individualInterviewEnabled,
      preferOverlay
    )
    if (nextInterview !== undefined) participantInfo.interviewEnabled = nextInterview
  }

  fillInstructorInfo(instructorInfo, {
    instructorTargets,
    instructorTargetDetail,
    instructorContact,
    instructorTel,
    instructorEmail,
    instructorPeriodLabel,
    operationFromInstructor,
    instructor,
    preferOverlay,
  })
  fillVolunteerInfo(volunteerInfo, {
    volunteerTargets,
    volunteerTargetDetail,
    volunteerContact,
    volunteerTel,
    volunteerEmail,
    volunteerPeriodLabel,
    operationFromVolunteer,
    volunteer,
    keepRecruitmentRows,
    preferOverlay,
  })

  const volunteerInterviewEnabled = keepRecruitmentRows ? undefined : volunteer?.interviewRequired
  const volunteerInterviewScheduleFromOverlay = interviewScheduleFromValues(
    volunteer?.interview,
    volunteerInterviewEnabled
  )
  const nextVolunteerInterviewSchedule = mergeVolunteerInterviewScheduleInfo(
    common.volunteerInterviewScheduleInfo,
    volunteerInterviewScheduleFromOverlay,
    preferOverlay
  )

  const contactPhone = coalesceString(
    typeof program.contactPhone === 'string' ? program.contactPhone : undefined,
    participantTel ?? instructorTel ?? volunteerTel,
    preferOverlay
  )
  const contactEmail = coalesceString(
    typeof program.contactEmail === 'string' ? program.contactEmail : undefined,
    participantEmail ?? instructorEmail ?? volunteerEmail,
    preferOverlay
  )

  const fromProgramLevels = resolveProgramTargetLevels(program)
  const fromNestedLabel = parseTargetLevelsFromDisplayLabel(
    participantInfo.educationTarget ?? participantInfo.recruitmentTarget
  )
  const persistEcho = sidecars?.unownedOverlay ?? {}
  const nextTargetLevels = preferOverlay
    ? resolvePersistedProgramTargetLevels({
        targetLevels: program.targetLevels,
        targetLevel: program.targetLevel,
        registrationOverlay: {
          ...(program.registrationOverlay != null && typeof program.registrationOverlay === 'object'
            ? (program.registrationOverlay as Record<string, unknown>)
            : {}),
          ...persistEcho,
          ...(institution?.targetLevels
            ? { 'recruit.targetLevels': institution.targetLevels }
            : {}),
          ...(individual?.targetLevels
            ? { 'recruit.individual.targetLevels': individual.targetLevels }
            : {}),
        },
        generalCommonInfo: {
          ...common,
          participantRecruitmentInfo: participantInfo,
        },
      })
    : fromProgramLevels.length > 0
      ? fromProgramLevels
      : fromNestedLabel.length > 0
        ? fromNestedLabel
        : (targetLevels ?? [])

  const nextInstructorTargets =
    preferOverlay && instructorTargets?.length
      ? instructorTargets
      : program.instructorTargets?.length
        ? program.instructorTargets
        : instructorTargets
  const nextVolunteerTargets =
    preferOverlay && volunteerTargets?.length
      ? volunteerTargets
      : program.volunteerTargets?.length
        ? program.volunteerTargets
        : volunteerTargets

  const media = sidecars?.media
  const mediaKeyVisual =
    media?.keyVisualImage && !isEphemeralThumbPreviewUrl(media.keyVisualImage)
      ? media.keyVisualImage
      : undefined
  const keyVisualImage = coalesceString(
    program.keyVisualImage ?? program.posterImage,
    mediaKeyVisual,
    preferOverlay
  )
  const attachmentFileNames =
    preferOverlay && media?.attachmentFileNames?.length
      ? media.attachmentFileNames
      : program.attachmentFileNames?.length
        ? program.attachmentFileNames
        : media?.attachmentFileNames

  const instructorFinalAnnounceIso = instructor?.finalAnnounceIso
  const instructorFinalAnnounceMethod = instructor?.finalAnnounceMethod
  const volunteerDocDeadlineIso =
    volunteerInterviewEnabled === false ? undefined : volunteer?.docDeadlineIso
  const volunteerDocAnnounceMethod = volunteer?.docAnnounceMethod
  const volunteerInterviewRange =
    keepRecruitmentRows || volunteerInterviewEnabled === false
      ? undefined
      : volunteer?.interviewRangeSeal
  const volunteerInterviewMethod = volunteer?.interviewMethod
  const volunteerFinalAnnounceIso = volunteer?.finalAnnounceIso
  const volunteerFinalAnnounceMethod = volunteer?.finalAnnounceMethod
  const individualDocDeadlineIso =
    individualInterviewEnabled === false ? undefined : individual?.docDeadlineIso
  const individualDocAnnounceMethod = individual?.docAnnounceMethod
  const individualInterviewRange =
    keepRecruitmentRows || individualInterviewEnabled === false
      ? undefined
      : individual?.interviewRangeSeal
  const individualInterviewMethod = individual?.interviewMethod

  return {
    ...program,
    description: description ?? program.description,
    recruitmentGuide: recruitmentGuide ?? program.recruitmentGuide,
    applicationMethod: applicationMethod ?? program.applicationMethod,
    learningSupportContent: learningSupportContent ?? program.learningSupportContent,
    additionalContentHtml: additionalContentHtml ?? program.additionalContentHtml,
    keyVisualImage: keyVisualImage ?? program.keyVisualImage,
    posterImage: keyVisualImage ?? program.posterImage,
    attachmentFileNames: attachmentFileNames ?? program.attachmentFileNames,
    otherNotes: program.otherNotes,
    remarks: coalesceString(
      program.remarks ?? participantInfo.remarks,
      participantRemarks,
      preferOverlay
    ),
    oneLineIntroduction: coalesceString(
      program.oneLineIntroduction,
      pickParticipantOverlayValue(preferInstitution, institution?.notes, individual?.notes),
      preferOverlay
    ),
    targetLevels: nextTargetLevels,
    targetLevel: nextTargetLevels?.[0] ?? program.targetLevel,
    district: coalesceString(program.district, targetLevelDetail, preferOverlay),
    instructorTargets: nextInstructorTargets,
    instructorTargetDetail: coalesceString(
      program.instructorTargetDetail,
      instructorTargetDetail,
      preferOverlay
    ),
    volunteerTargets: nextVolunteerTargets,
    volunteerTargetDetail: coalesceString(
      program.volunteerTargetDetail,
      volunteerTargetDetail,
      preferOverlay
    ),
    applicationStartDate: coalesceIso(
      program.applicationStartDate,
      participantRecruitRange?.start,
      preferOverlay
    ),
    applicationEndDate: coalesceIso(
      program.applicationEndDate,
      participantRecruitRange?.end,
      preferOverlay
    ),
    instructorApplicationStartDate: coalesceIso(
      program.instructorApplicationStartDate,
      instructorRecruitRange?.start,
      preferOverlay
    ),
    instructorApplicationEndDate: coalesceIso(
      program.instructorApplicationEndDate,
      instructorRecruitRange?.end,
      preferOverlay
    ),
    volunteerApplicationStartDate: coalesceIso(
      program.volunteerApplicationStartDate,
      volunteerRecruitRange?.start,
      preferOverlay
    ),
    volunteerApplicationEndDate: coalesceIso(
      program.volunteerApplicationEndDate,
      volunteerRecruitRange?.end,
      preferOverlay
    ),
    contactPhone: contactPhone ?? program.contactPhone,
    contactEmail: contactEmail ?? program.contactEmail,
    studentListRequired: coalesceString(
      program.studentListRequired,
      institutionStudentList,
      preferOverlay
    ) as Program['studentListRequired'],
    resultAnnouncementDate: coalesceResultAnnouncementDate({
      overlayIso: participantFinalAnnounceIso ?? volunteerFinalAnnounceIso,
      programDate: program.resultAnnouncementDate,
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
      preferOverlay,
    }),
    resultAnnouncementMethod: coalesceString(
      program.resultAnnouncementMethod,
      participantFinalAnnounceMethod ?? volunteerFinalAnnounceMethod,
      preferOverlay
    ),
    documentPassAnnouncementDate: coalesceIso(
      program.documentPassAnnouncementDate,
      individualDocDeadlineIso ?? volunteerDocDeadlineIso,
      preferOverlay
    ),
    documentPassAnnouncementMethod: coalesceString(
      program.documentPassAnnouncementMethod,
      individualDocAnnounceMethod ?? volunteerDocAnnounceMethod,
      preferOverlay
    ),
    interviewStartDate: coalesceIso(
      program.interviewStartDate,
      individualInterviewRange?.start ?? volunteerInterviewRange?.start,
      preferOverlay
    ),
    interviewEndDate: coalesceIso(
      program.interviewEndDate,
      individualInterviewRange?.end ?? volunteerInterviewRange?.end,
      preferOverlay
    ),
    interviewMethod: coalesceString(
      program.interviewMethod,
      individualInterviewMethod ?? volunteerInterviewMethod,
      preferOverlay
    ),
    finalPassAnnouncementDate: coalesceIso(
      program.finalPassAnnouncementDate,
      volunteerFinalAnnounceIso ?? instructorFinalAnnounceIso,
      preferOverlay
    ),
    finalPassAnnouncementMethod: coalesceString(
      program.finalPassAnnouncementMethod,
      volunteerFinalAnnounceMethod ?? instructorFinalAnnounceMethod,
      preferOverlay
    ),
    generalParticipantInterviewEnabled: coalesceBool(
      program.generalParticipantInterviewEnabled,
      individualInterviewEnabled,
      preferOverlay
    ),
    generalVolunteerInterviewEnabled: coalesceBool(
      program.generalVolunteerInterviewEnabled,
      volunteerInterviewEnabled,
      preferOverlay
    ),
    generalCommonInfo: {
      ...common,
      participantRecruitmentInfo: participantInfo,
      instructorRecruitmentInfo: instructorInfo,
      volunteerRecruitmentInfo: volunteerInfo,
      ...(nextVolunteerInterviewSchedule
        ? { volunteerInterviewScheduleInfo: nextVolunteerInterviewSchedule }
        : {}),
    },
  }
}

function fillInstructorInfo(
  instructorInfo: Record<string, any>,
  args: {
    instructorTargets?: string[]
    instructorTargetDetail?: string
    instructorContact?: string
    instructorTel?: string
    instructorEmail?: string
    instructorPeriodLabel?: string
    operationFromInstructor?: string
    instructor?: InstructorRecruitmentValues
    preferOverlay: boolean
  }
): void {
  const {
    instructorTargets,
    instructorTargetDetail,
    instructorContact,
    instructorTel,
    instructorEmail,
    instructorPeriodLabel,
    operationFromInstructor,
    instructor,
    preferOverlay,
  } = args
  const instructorTargetLabel = instructorTargets?.length
    ? formatInstructorTargetsLabel(instructorTargets)
    : undefined
  if (instructorTargetLabel && instructorTargetLabel !== '-') {
    instructorInfo.recruitmentTarget = coalesceString(
      instructorInfo.recruitmentTarget,
      instructorTargetLabel,
      preferOverlay
    )
  }
  if (instructorTargetDetail) {
    instructorInfo.recruitmentTargetDetail = coalesceString(
      instructorInfo.recruitmentTargetDetail,
      instructorTargetDetail,
      preferOverlay
    )
  }
  if (instructorContact) {
    instructorInfo.contactOrganizationName = coalesceString(
      instructorInfo.contactOrganizationName,
      instructorContact,
      preferOverlay
    )
  }
  if (instructorTel) {
    instructorInfo.inquiryTel = coalesceString(
      instructorInfo.inquiryTel ?? instructorInfo.tel ?? instructorInfo.contactPhone,
      instructorTel,
      preferOverlay
    )
  }
  if (instructorEmail) {
    instructorInfo.inquiryEmail = coalesceString(
      instructorInfo.inquiryEmail ?? instructorInfo.email ?? instructorInfo.contactEmail,
      instructorEmail,
      preferOverlay
    )
  }
  if (instructorPeriodLabel && instructorPeriodLabel !== '-') {
    instructorInfo.recruitmentPeriodLabel = coalesceString(
      instructorInfo.recruitmentPeriodLabel,
      instructorPeriodLabel,
      preferOverlay
    )
  }
  if (operationFromInstructor && operationFromInstructor !== '-') {
    instructorInfo.operationPeriodLabel = coalesceString(
      instructorInfo.operationPeriodLabel,
      operationFromInstructor,
      preferOverlay
    )
  }
  const html = instructor?.detailHtml
  if (html?.programDescription) {
    instructorInfo.programDescription = coalesceString(
      instructorInfo.programDescription,
      html.programDescription,
      preferOverlay
    )
  }
  if (html?.recruitmentGuide) {
    instructorInfo.recruitmentGuide = coalesceString(
      instructorInfo.recruitmentGuide,
      html.recruitmentGuide,
      preferOverlay
    )
  }
  if (html?.applicationMethod) {
    instructorInfo.applicationMethod = coalesceString(
      instructorInfo.applicationMethod,
      html.applicationMethod,
      preferOverlay
    )
  }
  if (html?.learningSupportContent) {
    instructorInfo.learningSupportContent = coalesceString(
      instructorInfo.learningSupportContent,
      html.learningSupportContent,
      preferOverlay
    )
  }
  if (html?.additionalContentHtml) {
    instructorInfo.additionalContentHtml = coalesceString(
      instructorInfo.additionalContentHtml,
      html.additionalContentHtml,
      preferOverlay
    )
  }
  if (preferOverlay && instructor?.notes) {
    instructorInfo.remarks = coalesceString(instructorInfo.remarks, instructor.notes, true)
  }
  if (html?.otherNotes) {
    instructorInfo.otherMatters = coalesceString(
      instructorInfo.otherMatters,
      html.otherNotes,
      preferOverlay
    )
  }
  const instructorAnnouncementPublished =
    instructor?.announcementPublished ??
    (instructorPeriodLabel || instructorContact || instructorTargets?.length ? true : undefined)
  if (instructorAnnouncementPublished !== undefined) {
    const nextPublished = coalesceBool(
      instructorInfo.announcementPublished,
      instructorAnnouncementPublished,
      preferOverlay
    )
    if (nextPublished !== undefined) {
      instructorInfo.announcementPublished = nextPublished
      instructorInfo.announcementPublishedLabel = nextPublished ? '게시' : '미게시'
    }
  }
  const instructorFinalAnnouncementLabel = formatAnnouncementLabel(
    instructor?.finalAnnounceIso,
    instructor?.finalAnnounceMethod
  )
  if (instructorFinalAnnouncementLabel) {
    const nextFinal = coalesceString(
      instructorInfo.finalAnnouncementLabel ?? instructorInfo.resultAnnouncementLabel,
      instructorFinalAnnouncementLabel,
      preferOverlay
    )
    if (nextFinal) {
      instructorInfo.finalAnnouncementLabel = nextFinal
      instructorInfo.resultAnnouncementLabel = nextFinal
    }
  }
}

function fillVolunteerInfo(
  volunteerInfo: Record<string, any>,
  args: {
    volunteerTargets?: string[]
    volunteerTargetDetail?: string
    volunteerContact?: string
    volunteerTel?: string
    volunteerEmail?: string
    volunteerPeriodLabel?: string
    operationFromVolunteer?: string
    volunteer?: VolunteerRecruitmentValues
    keepRecruitmentRows: boolean
    preferOverlay: boolean
  }
): void {
  const {
    volunteerTargets,
    volunteerTargetDetail,
    volunteerContact,
    volunteerTel,
    volunteerEmail,
    volunteerPeriodLabel,
    operationFromVolunteer,
    volunteer,
    keepRecruitmentRows,
    preferOverlay,
  } = args
  const volunteerTargetLabel = volunteerTargets?.length
    ? formatVolunteerTargetsLabel(volunteerTargets)
    : undefined
  if (volunteerTargetLabel && volunteerTargetLabel !== '-') {
    volunteerInfo.recruitmentTarget = coalesceString(
      volunteerInfo.recruitmentTarget,
      volunteerTargetLabel,
      preferOverlay
    )
  }
  if (volunteerTargetDetail) {
    volunteerInfo.recruitmentTargetDetail = coalesceString(
      volunteerInfo.recruitmentTargetDetail,
      volunteerTargetDetail,
      preferOverlay
    )
  }
  if (volunteerContact) {
    volunteerInfo.contactOrganizationName = coalesceString(
      volunteerInfo.contactOrganizationName,
      volunteerContact,
      preferOverlay
    )
  }
  if (volunteerTel) {
    volunteerInfo.inquiryTel = coalesceString(
      volunteerInfo.inquiryTel ?? volunteerInfo.tel ?? volunteerInfo.contactPhone,
      volunteerTel,
      preferOverlay
    )
  }
  if (volunteerEmail) {
    volunteerInfo.inquiryEmail = coalesceString(
      volunteerInfo.inquiryEmail ?? volunteerInfo.email ?? volunteerInfo.contactEmail,
      volunteerEmail,
      preferOverlay
    )
  }
  if (volunteerPeriodLabel && volunteerPeriodLabel !== '-') {
    volunteerInfo.recruitmentPeriodLabel = coalesceString(
      volunteerInfo.recruitmentPeriodLabel,
      volunteerPeriodLabel,
      preferOverlay
    )
  }
  if (operationFromVolunteer && operationFromVolunteer !== '-') {
    volunteerInfo.operationPeriodLabel = coalesceString(
      volunteerInfo.operationPeriodLabel,
      operationFromVolunteer,
      preferOverlay
    )
  }
  const html = volunteer?.detailHtml
  if (html?.programDescription) {
    volunteerInfo.programDescription = coalesceString(
      volunteerInfo.programDescription,
      html.programDescription,
      preferOverlay
    )
  }
  if (html?.recruitmentGuide) {
    volunteerInfo.recruitmentGuide = coalesceString(
      volunteerInfo.recruitmentGuide,
      html.recruitmentGuide,
      preferOverlay
    )
  }
  if (html?.applicationMethod) {
    volunteerInfo.applicationMethod = coalesceString(
      volunteerInfo.applicationMethod,
      html.applicationMethod,
      preferOverlay
    )
  }
  if (html?.learningSupportContent) {
    volunteerInfo.learningSupportContent = coalesceString(
      volunteerInfo.learningSupportContent,
      html.learningSupportContent,
      preferOverlay
    )
  }
  if (html?.additionalContentHtml) {
    volunteerInfo.additionalContentHtml = coalesceString(
      volunteerInfo.additionalContentHtml,
      html.additionalContentHtml,
      preferOverlay
    )
  }
  if (preferOverlay && volunteer?.notes) {
    volunteerInfo.remarks = coalesceString(volunteerInfo.remarks, volunteer.notes, true)
  }
  if (html?.otherNotes) {
    volunteerInfo.otherMatters = coalesceString(
      volunteerInfo.otherMatters,
      html.otherNotes,
      preferOverlay
    )
  }
  if (volunteer?.notesNotApplicable !== undefined) {
    const nextVolunteerNotesNA = coalesceBool(
      volunteerInfo.notesNotApplicable,
      volunteer.notesNotApplicable,
      preferOverlay
    )
    if (nextVolunteerNotesNA !== undefined) volunteerInfo.notesNotApplicable = nextVolunteerNotesNA
  }

  const volunteerInterviewEnabled = keepRecruitmentRows ? undefined : volunteer?.interviewRequired
  const volunteerFinalAnnouncementLabel = formatAnnouncementLabel(
    volunteer?.finalAnnounceIso,
    volunteer?.finalAnnounceMethod
  )
  const volunteerAnnouncementPublished =
    volunteer?.announcementPublished ??
    (volunteerInterviewEnabled !== undefined ||
    volunteerFinalAnnouncementLabel ||
    volunteerTargets?.length ||
    volunteerContact
      ? true
      : undefined)
  if (volunteerAnnouncementPublished !== undefined) {
    const nextPublished = coalesceBool(
      volunteerInfo.announcementPublished,
      volunteerAnnouncementPublished,
      preferOverlay
    )
    if (nextPublished !== undefined) {
      volunteerInfo.announcementPublished = nextPublished
      volunteerInfo.announcementPublishedLabel = nextPublished ? '게시' : '미게시'
    }
  }
  if (volunteerInterviewEnabled !== undefined) {
    const nextInterview = coalesceBool(
      volunteerInfo.volunteerInterviewEnabled ?? volunteerInfo.generalVolunteerInterviewEnabled,
      volunteerInterviewEnabled,
      preferOverlay
    )
    if (nextInterview !== undefined) {
      volunteerInfo.volunteerInterviewEnabled = nextInterview
      volunteerInfo.generalVolunteerInterviewEnabled = nextInterview
      volunteerInfo.volunteerInterviewEnabledLabel = nextInterview ? '면접 있음' : '면접 없음'
    }
  }
  if (volunteerFinalAnnouncementLabel) {
    const nextFinal = coalesceString(
      volunteerInfo.finalAnnouncementLabel ?? volunteerInfo.resultAnnouncementLabel,
      volunteerFinalAnnouncementLabel,
      preferOverlay
    )
    if (nextFinal) {
      volunteerInfo.finalAnnouncementLabel = nextFinal
      volunteerInfo.resultAnnouncementLabel = nextFinal
    }
  }
  if (volunteer?.docDeadlineIso) {
    volunteerInfo.documentPassAnnouncementDate = coalesceString(
      typeof volunteerInfo.documentPassAnnouncementDate === 'string'
        ? volunteerInfo.documentPassAnnouncementDate
        : undefined,
      volunteer.docDeadlineIso,
      preferOverlay
    )
  }
  if (volunteer?.docAnnounceMethod) {
    volunteerInfo.documentPassAnnouncementMethod = coalesceString(
      volunteerInfo.documentPassAnnouncementMethod,
      volunteer.docAnnounceMethod,
      preferOverlay
    )
  }
  const volunteerInterviewRange = keepRecruitmentRows ? undefined : volunteer?.interviewRangeSeal
  if (volunteerInterviewRange?.start) {
    volunteerInfo.interviewStartDate = coalesceString(
      typeof volunteerInfo.interviewStartDate === 'string'
        ? volunteerInfo.interviewStartDate
        : undefined,
      volunteerInterviewRange.start,
      preferOverlay
    )
  }
  if (volunteerInterviewRange?.end) {
    volunteerInfo.interviewEndDate = coalesceString(
      typeof volunteerInfo.interviewEndDate === 'string'
        ? volunteerInfo.interviewEndDate
        : undefined,
      volunteerInterviewRange.end,
      preferOverlay
    )
  }
  if (volunteer?.interviewMethod) {
    volunteerInfo.interviewMethod = coalesceString(
      volunteerInfo.interviewMethod,
      volunteer.interviewMethod,
      preferOverlay
    )
  }
  if (volunteer?.finalAnnounceIso) {
    volunteerInfo.finalPassAnnouncementDate = coalesceString(
      typeof volunteerInfo.finalPassAnnouncementDate === 'string'
        ? volunteerInfo.finalPassAnnouncementDate
        : undefined,
      volunteer.finalAnnounceIso,
      preferOverlay
    )
  }
  if (volunteer?.finalAnnounceMethod) {
    volunteerInfo.finalPassAnnouncementMethod = coalesceString(
      volunteerInfo.finalPassAnnouncementMethod,
      volunteer.finalAnnounceMethod,
      preferOverlay
    )
  }
}
