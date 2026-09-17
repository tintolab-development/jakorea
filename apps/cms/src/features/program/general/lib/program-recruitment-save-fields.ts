import { z } from 'zod'
import { normalizeTargetLevelValue } from '@/features/program/shared/lib/program-detail-info-constants'
import type { TargetLevel } from '@/types/domain'

/** API·RHF 는 optional 자리에 `null` / `''` 을 줄 수 있음 — `.optional()` 만 쓰면 safeParse 실패 */
function emptyToUndefined(value: unknown): unknown {
  if (value == null) return undefined
  if (typeof value === 'string' && value.trim() === '') return undefined
  return value
}

const optionalString = z.preprocess(emptyToUndefined, z.string().optional())
const optionalNonNegNumber = z.preprocess(emptyToUndefined, z.number().min(0).optional())
const publishedEnum = z.preprocess(
  emptyToUndefined,
  z.enum(['published', 'unpublished']).optional()
)
const requiredEnum = z.preprocess(
  emptyToUndefined,
  z.enum(['required', 'not_required']).optional()
)
const providedEnum = z.preprocess(
  emptyToUndefined,
  z.enum(['provided', 'not_provided']).optional()
)
const yesNoEnum = z.preprocess(emptyToUndefined, z.enum(['yes', 'no']).optional())
const notesApplicableEnum = z.preprocess(
  emptyToUndefined,
  z.enum(['applicable', 'not_applicable']).optional()
)
const targetLevelEnum = z.enum(['elementary', 'middle', 'high', 'university', 'adult'])

function coerceTargetLevels(value: unknown): TargetLevel[] | undefined {
  if (value == null) return undefined
  if (!Array.isArray(value)) return undefined
  const levels = value
    .map(normalizeTargetLevelValue)
    .filter((level): level is TargetLevel => level != null)
  return levels.length > 0 ? [...new Set(levels)] : undefined
}

const targetLevelsSaveSchema = z.preprocess(
  coerceTargetLevels,
  z.array(targetLevelEnum).nullish()
)

/** 모집 정보 탭 부분 저장 — 공통정보 필수값(설명·학습지원 등) 검증 제외 */
export const programParticipantRecruitmentSaveSchema = z.object({
  applicationStartDate: optionalString,
  applicationEndDate: optionalString,
  documentPassAnnouncementDate: optionalString,
  documentPassAnnouncementMethod: optionalString,
  interviewStartDate: optionalString,
  interviewEndDate: optionalString,
  interviewMethod: optionalString,
  resultAnnouncementDate: optionalString,
  resultAnnouncementMethod: optionalString,
  participantRecruitmentAnnouncementPublished: publishedEnum,
  participantRecruitmentInterviewEnabled: yesNoEnum,
  studentListRequired: requiredEnum,
  participantRecruitmentPreEducationRequired: requiredEnum,
  participantRecruitmentCertificateProvided: providedEnum,
  participantRecruitmentMaxInstructors: optionalNonNegNumber,
  participantRecruitmentMaxClassCount: optionalNonNegNumber,
  participantRecruitmentMaxScheduleCount: optionalNonNegNumber,
  participantRecruitmentMaxSessionsPerDay: optionalNonNegNumber,
  startDate: optionalString,
  endDate: optionalString,
  targetLevels: targetLevelsSaveSchema,
  district: optionalString,
  contactPhone: optionalString,
  contactEmail: optionalString,
  oneLineIntroduction: optionalString,
  remarks: optionalString,
  educationTargetDetail: optionalString,
  participantRecruitmentNotesNotApplicable: notesApplicableEnum,
})

export const programInstructorRecruitmentSaveSchema = z.object({
  instructorRecruitmentAnnouncementPublished: publishedEnum,
  startDate: optionalString,
  endDate: optionalString,
  instructorTargets: z.array(z.string()).nullish(),
  instructorTargetDetail: optionalString,
  instructorApplicationStartDate: optionalString,
  instructorApplicationEndDate: optionalString,
  documentPassAnnouncementDate: optionalString,
  documentPassAnnouncementMethod: optionalString,
  interviewStartDate: optionalString,
  interviewEndDate: optionalString,
  interviewMethod: optionalString,
  finalPassAnnouncementDate: optionalString,
  finalPassAnnouncementMethod: optionalString,
  instructorCapacity: optionalNonNegNumber,
  contactPhone: optionalString,
  contactEmail: optionalString,
  otherNotes: optionalString,
})

export const programVolunteerRecruitmentSaveSchema = z.object({
  volunteerRecruitmentAnnouncementPublished: publishedEnum,
  volunteerRecruitmentInterviewEnabled: yesNoEnum,
  volunteerApplicationStartDate: optionalString,
  volunteerApplicationEndDate: optionalString,
  documentPassAnnouncementDate: optionalString,
  documentPassAnnouncementMethod: optionalString,
  interviewStartDate: optionalString,
  interviewEndDate: optionalString,
  interviewMethod: optionalString,
  finalPassAnnouncementDate: optionalString,
  finalPassAnnouncementMethod: optionalString,
  startDate: optionalString,
  endDate: optionalString,
  volunteerTargets: z.array(z.string()).nullish(),
  volunteerTargetDetail: optionalString,
  contactPhone: optionalString,
  contactEmail: optionalString,
  oneLineIntroduction: optionalString,
})
