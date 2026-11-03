/**
 * 1사1교 CREATE — typed recruit/instructor → Program nested/dates.
 * Overlay store와 applyGeneralRecruitOverlayToProgram 를 쓰지 않는다.
 */
import type {
  GeneralProgramInstructorRecruitmentInfo,
  GeneralProgramParticipantRecruitmentInfo,
  Program,
} from '@/types/domain'
import { formatAnnouncementLabel } from '@/features/program/shared/lib/announcement-label'
import { announcementPublishedFromFormValue } from '@/features/program/shared/lib/participant-recruitment-form-options'
import {
  formatDateRange,
  formatInstructorTargetsLabel,
  formatTargetLevelsLabel,
  normalizeInstructorTargetList,
  parseTargetLevelsSelectValue,
  resolvePersistedProgramTargetLevels,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { coalesceResultAnnouncementDate } from '@/features/program/shared/lib/resolve-result-announcement-date'
import type {
  CompanySchoolInstructorRecruitFormState,
  CompanySchoolRecruitFormState,
  CompanySchoolRecruitRange,
} from './registration-canonical-types'

function text(value: string | null | undefined): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed ? trimmed : undefined
}

function firstText(...values: Array<string | null | undefined>): string | undefined {
  for (const value of values) {
    const next = text(value)
    if (next) return next
  }
  return undefined
}

function bothEnds(range: CompanySchoolRecruitRange | null | undefined): {
  start: string
  end: string
} | undefined {
  const start = range?.start?.trim()
  const end = range?.end?.trim()
  if (!start || !end) return undefined
  return { start, end }
}

function periodLabel(range: CompanySchoolRecruitRange | null | undefined): string | undefined {
  const ends = bothEnds(range)
  if (!ends) return undefined
  const label = formatDateRange(ends.start, ends.end)
  return label && label !== '-' ? label : undefined
}

function publishedFromForm(raw: string | undefined): boolean | undefined {
  const trimmed = raw?.trim()
  if (trimmed === 'published' || trimmed === 'unpublished') {
    return announcementPublishedFromFormValue(trimmed)
  }
  return undefined
}

function needNone(raw: string | undefined): boolean | undefined {
  if (raw === 'need') return true
  if (raw === 'none') return false
  return undefined
}

function certificateProvided(raw: string | undefined): boolean | undefined {
  if (raw === 'provided' || raw === 'yes') return true
  if (raw === 'not_provided' || raw === 'none' || raw === 'no') return false
  return undefined
}

function studentListRequired(
  raw: string | undefined
): 'required' | 'not_required' | undefined {
  if (raw === 'need' || raw === 'required') return 'required'
  if (raw === 'none' || raw === 'not_required') return 'not_required'
  return undefined
}

function finiteNumber(value: number | null | undefined): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function assignText(
  target: Record<string, unknown>,
  key: string,
  value: string | undefined
): void {
  if (value) target[key] = value
}

function assignBool(
  target: Record<string, unknown>,
  key: string,
  value: boolean | undefined
): void {
  if (value !== undefined) target[key] = value
}

function assignNumber(
  target: Record<string, unknown>,
  key: string,
  value: number | undefined
): void {
  if (value !== undefined) target[key] = value
}

function publishedLabel(value: boolean): string {
  return value ? '게시' : '미게시'
}

function preferIso(
  programVal: string | Date | undefined,
  overlayIso: string | undefined
): string | Date | undefined {
  if (overlayIso?.trim()) return overlayIso
  if (programVal != null && String(programVal).trim() !== '') return programVal
  return overlayIso
}

function preferString(programVal: string | undefined, overlayVal: string | undefined): string | undefined {
  if (overlayVal?.trim()) return overlayVal
  const trimmed = programVal?.trim()
  return trimmed ? programVal : overlayVal
}

export function applyCompanySchoolCanonicalRecruitToProgram(
  program: Program,
  recruit: CompanySchoolRecruitFormState,
  instructor: CompanySchoolInstructorRecruitFormState
): Program {
  const participantRecruitRange = bothEnds(recruit.recruitRange)
  const instructorRecruitRange = bothEnds(instructor.recruitRange)

  const participantPeriod = periodLabel(recruit.recruitRange)
  const instructorPeriod = periodLabel(instructor.recruitRange)
  const operationFromParticipant = periodLabel(recruit.programRange)
  const operationFromInstructor = periodLabel(instructor.programRange)

  const participantContact = text(recruit.inquiryContact)
  const participantTel = text(recruit.inquiryTel)
  const participantEmail = text(recruit.inquiryEmail)
  const instructorContact = text(instructor.inquiryContact)
  const instructorTel = text(instructor.inquiryTel)
  const instructorEmail = text(instructor.inquiryEmail)

  const targetLevels = parseTargetLevelsSelectValue(recruit.targetLevels)
  const targetLevelDetail = text(recruit.targetLevelDetail)
  const instructorTargetsRaw = instructor.recruitTargets.map(String).map(item => item.trim()).filter(Boolean)
  const instructorTargets =
    instructorTargetsRaw.length > 0
      ? normalizeInstructorTargetList(instructorTargetsRaw)
      : undefined

  const common = program.generalCommonInfo ?? {}
  const participantInfo: GeneralProgramParticipantRecruitmentInfo = {
    ...(common.participantRecruitmentInfo ?? {}),
  }
  const instructorInfo: GeneralProgramInstructorRecruitmentInfo = {
    ...(common.instructorRecruitmentInfo ?? {}),
  }

  const participantTargetLabel = targetLevels?.length
    ? formatTargetLevelsLabel(targetLevels)
    : undefined
  if (participantTargetLabel && participantTargetLabel !== '-') {
    participantInfo.educationTarget = participantTargetLabel
    participantInfo.recruitmentTarget = participantTargetLabel
  }
  if (targetLevelDetail) {
    participantInfo.educationTargetDetail = targetLevelDetail
    participantInfo.recruitmentTargetDetail = targetLevelDetail
  }
  assignText(participantInfo as Record<string, unknown>, 'contactOrganizationName', participantContact)
  if (participantTel) {
    participantInfo.inquiryTel = participantTel
  }
  if (participantEmail) {
    participantInfo.inquiryEmail = participantEmail
  }
  assignText(participantInfo as Record<string, unknown>, 'recruitmentPeriodLabel', participantPeriod)
  assignText(participantInfo as Record<string, unknown>, 'operationPeriodLabel', operationFromParticipant)

  const participantDescription = text(recruit.detailInfo.programDescription)
  const participantGuide = text(recruit.detailInfo.recruitmentGuide)
  const participantMethod = text(recruit.detailInfo.applicationMethod)
  const participantLearning = text(recruit.detailInfo.learningSupportContent)
  const participantAdditional = text(recruit.detailInfo.additionalContentHtml)
  const participantRemarks = text(recruit.notes)
  assignText(participantInfo as Record<string, unknown>, 'programDescription', participantDescription)
  assignText(participantInfo as Record<string, unknown>, 'recruitmentGuide', participantGuide)
  assignText(participantInfo as Record<string, unknown>, 'applicationMethod', participantMethod)
  assignText(participantInfo as Record<string, unknown>, 'learningSupportContent', participantLearning)
  assignText(participantInfo as Record<string, unknown>, 'additionalContentHtml', participantAdditional)
  assignText(participantInfo as Record<string, unknown>, 'remarks', participantRemarks)

  const institutionAnnouncementPublished =
    publishedFromForm(recruit.announcementPublished) ??
    (participantRecruitRange || participantContact ? true : undefined)
  if (institutionAnnouncementPublished !== undefined) {
    participantInfo.announcementPublished = institutionAnnouncementPublished
    participantInfo.announcementPublishedLabel = publishedLabel(institutionAnnouncementPublished)
  }
  const preguidance = needNone(recruit.preguidanceRequired)
  if (preguidance !== undefined) {
    participantInfo.preEducationNoticeRequired = preguidance
    participantInfo.advanceGuidanceRequired = preguidance
    participantInfo.preEducationNoticeRequiredLabel = preguidance ? '작성' : '해당없음'
    participantInfo.advanceGuidanceRequiredLabel = preguidance ? '작성' : '해당없음'
  }
  const studentList = studentListRequired(recruit.studentListRequired)
  if (studentList !== undefined) {
    participantInfo.studentListRequired = studentList
    participantInfo.studentListRequiredLabel =
      studentList === 'required' ? '제출 필요' : '제출 불필요'
  }
  const certificate = certificateProvided(recruit.certificateProvided)
  assignBool(participantInfo as Record<string, unknown>, 'certificateIssuanceProvided', certificate)
  assignNumber(
    participantInfo as Record<string, unknown>,
    'maxAssignableInstructors',
    finiteNumber(recruit.maxAssignableInstructors)
  )
  assignNumber(participantInfo as Record<string, unknown>, 'maxClassCount', finiteNumber(recruit.maxClassCount))
  assignNumber(
    participantInfo as Record<string, unknown>,
    'maxScheduleCount',
    finiteNumber(recruit.maxScheduleCount)
  )
  assignNumber(
    participantInfo as Record<string, unknown>,
    'maxSessionsPerDay',
    finiteNumber(recruit.maxSessionsPerDay)
  )
  const participantFinalLabel = formatAnnouncementLabel(
    recruit.finalAnnounce,
    recruit.finalAnnounceMethod
  )
  if (participantFinalLabel) {
    participantInfo.finalAnnouncementLabel = participantFinalLabel
    participantInfo.resultAnnouncementLabel = participantFinalLabel
  }
  participantInfo.notesNotApplicable = recruit.notesNotApplicable

  const instructorTargetLabel = instructorTargets?.length
    ? formatInstructorTargetsLabel(instructorTargets)
    : undefined
  if (instructorTargetLabel && instructorTargetLabel !== '-') {
    instructorInfo.recruitmentTarget = instructorTargetLabel
  }
  assignText(
    instructorInfo as Record<string, unknown>,
    'recruitmentTargetDetail',
    text(instructor.recruitTargetDetail)
  )
  assignText(instructorInfo as Record<string, unknown>, 'contactOrganizationName', instructorContact)
  if (instructorTel) instructorInfo.inquiryTel = instructorTel
  if (instructorEmail) instructorInfo.inquiryEmail = instructorEmail
  assignText(instructorInfo as Record<string, unknown>, 'recruitmentPeriodLabel', instructorPeriod)
  assignText(instructorInfo as Record<string, unknown>, 'operationPeriodLabel', operationFromInstructor)
  assignText(
    instructorInfo as Record<string, unknown>,
    'programDescription',
    text(instructor.detailInfo.programDescription)
  )
  assignText(
    instructorInfo as Record<string, unknown>,
    'recruitmentGuide',
    text(instructor.detailInfo.recruitmentGuide)
  )
  assignText(
    instructorInfo as Record<string, unknown>,
    'applicationMethod',
    text(instructor.detailInfo.applicationMethod)
  )
  assignText(
    instructorInfo as Record<string, unknown>,
    'learningSupportContent',
    text(instructor.detailInfo.learningSupportContent)
  )
  assignText(
    instructorInfo as Record<string, unknown>,
    'additionalContentHtml',
    text(instructor.detailInfo.additionalContentHtml)
  )
  const instructorRemarks = text(instructor.notes)
  if (instructorRemarks) instructorInfo.remarks = instructorRemarks
  assignText(instructorInfo as Record<string, unknown>, 'otherMatters', text(instructor.otherNotes))

  const instructorAnnouncementPublished =
    publishedFromForm(instructor.announcementPublished) ??
    (instructorPeriod || instructorContact || instructorTargets?.length ? true : undefined)
  if (instructorAnnouncementPublished !== undefined) {
    instructorInfo.announcementPublished = instructorAnnouncementPublished
    instructorInfo.announcementPublishedLabel = publishedLabel(instructorAnnouncementPublished)
  }
  const instructorFinalLabel = formatAnnouncementLabel(
    instructor.finalAnnounce,
    instructor.finalAnnounceMethod
  )
  if (instructorFinalLabel) {
    instructorInfo.finalAnnouncementLabel = instructorFinalLabel
    instructorInfo.resultAnnouncementLabel = instructorFinalLabel
  }
  const participantDescriptionRoot = firstText(
    recruit.detailInfo.programDescription,
    instructor.detailInfo.programDescription
  )
  const recruitmentGuide = firstText(
    recruit.detailInfo.recruitmentGuide,
    instructor.detailInfo.recruitmentGuide
  )
  const applicationMethod = firstText(
    recruit.detailInfo.applicationMethod,
    instructor.detailInfo.applicationMethod
  )
  const learningSupportContent = firstText(
    recruit.detailInfo.learningSupportContent,
    instructor.detailInfo.learningSupportContent
  )
  const additionalContentHtml = firstText(
    recruit.detailInfo.additionalContentHtml,
    instructor.detailInfo.additionalContentHtml
  )
  const keyVisualImage = firstText(
    recruit.detailInfo.thumbContentUrl.startsWith('blob:')
      ? ''
      : recruit.detailInfo.thumbContentUrl,
    instructor.detailInfo.thumbContentUrl.startsWith('blob:')
      ? ''
      : instructor.detailInfo.thumbContentUrl
  )
  const attachmentFileNames = [
    ...recruit.detailInfo.attachmentFileNames,
    ...instructor.detailInfo.attachmentFileNames,
  ]
    .map(name => name.trim())
    .filter(Boolean)
  const uniqueAttachmentNames = [...new Set(attachmentFileNames)]

  const nextTargetLevels = resolvePersistedProgramTargetLevels({
    targetLevels: program.targetLevels,
    targetLevel: program.targetLevel,
    registrationOverlay: {
      ...(program.registrationOverlay ?? {}),
      'recruit.targetLevels': [...recruit.targetLevels],
    },
    generalCommonInfo: {
      ...common,
      participantRecruitmentInfo: participantInfo,
    },
  })

  const contactPhone = preferString(
    typeof program.contactPhone === 'string' ? program.contactPhone : undefined,
    participantTel ?? instructorTel
  )
  const contactEmail = preferString(
    typeof program.contactEmail === 'string' ? program.contactEmail : undefined,
    participantEmail ?? instructorEmail
  )

  return {
    ...program,
    description: preferString(program.description, participantDescriptionRoot) ?? program.description,
    recruitmentGuide: preferString(program.recruitmentGuide, recruitmentGuide) ?? program.recruitmentGuide,
    applicationMethod:
      preferString(program.applicationMethod, applicationMethod) ?? program.applicationMethod,
    learningSupportContent:
      preferString(program.learningSupportContent, learningSupportContent) ??
      program.learningSupportContent,
    additionalContentHtml:
      preferString(program.additionalContentHtml, additionalContentHtml) ??
      program.additionalContentHtml,
    keyVisualImage: preferString(program.keyVisualImage ?? program.posterImage, keyVisualImage),
    posterImage: preferString(program.posterImage ?? program.keyVisualImage, keyVisualImage),
    attachmentFileNames:
      uniqueAttachmentNames.length > 0 ? uniqueAttachmentNames : program.attachmentFileNames,
    remarks: preferString(program.remarks ?? participantInfo.remarks, participantRemarks),
    oneLineIntroduction: preferString(program.oneLineIntroduction, participantRemarks),
    targetLevels: nextTargetLevels,
    targetLevel: nextTargetLevels[0] ?? program.targetLevel,
    district: preferString(program.district, targetLevelDetail),
    instructorTargets:
      instructorTargets?.length ? instructorTargets : program.instructorTargets,
    instructorTargetDetail: preferString(
      program.instructorTargetDetail,
      text(instructor.recruitTargetDetail)
    ),
    applicationStartDate: preferIso(program.applicationStartDate, participantRecruitRange?.start),
    applicationEndDate: preferIso(program.applicationEndDate, participantRecruitRange?.end),
    instructorApplicationStartDate: preferIso(
      program.instructorApplicationStartDate,
      instructorRecruitRange?.start
    ),
    instructorApplicationEndDate: preferIso(
      program.instructorApplicationEndDate,
      instructorRecruitRange?.end
    ),
    contactPhone: contactPhone ?? program.contactPhone,
    contactEmail: contactEmail ?? program.contactEmail,
    studentListRequired:
      (preferString(program.studentListRequired, studentList) as Program['studentListRequired']) ??
      program.studentListRequired,
    resultAnnouncementDate: coalesceResultAnnouncementDate({
      overlayIso: text(recruit.finalAnnounce) ?? null,
      programDate: program.resultAnnouncementDate,
      createdAt: program.createdAt,
      updatedAt: program.updatedAt,
      preferOverlay: true,
    }),
    resultAnnouncementMethod: preferString(
      program.resultAnnouncementMethod,
      text(recruit.finalAnnounceMethod)
    ),
    finalPassAnnouncementDate: preferIso(
      program.finalPassAnnouncementDate,
      text(instructor.finalAnnounce)
    ),
    finalPassAnnouncementMethod: preferString(
      program.finalPassAnnouncementMethod,
      text(instructor.finalAnnounceMethod)
    ),
    generalCommonInfo: {
      ...common,
      participantRecruitmentInfo: participantInfo,
      instructorRecruitmentInfo: instructorInfo,
      volunteerRecruitmentInfo: common.volunteerRecruitmentInfo,
    },
  }
}
