import { z } from 'zod'

/** API·RHF 는 optional 자리에 `null` 을 줄 수 있음 — `.optional()` 만 쓰면 safeParse 실패 */
const optionalString = z.string().nullish()
const optionalNonNegNumber = z.number().min(0).nullish()
const publishedEnum = z.enum(['published', 'unpublished']).nullish()
const requiredEnum = z.enum(['required', 'not_required']).nullish()
const providedEnum = z.enum(['provided', 'not_provided']).nullish()
const yesNoEnum = z.enum(['yes', 'no']).nullish()
const targetLevelEnum = z.enum(['elementary', 'middle', 'high', 'university', 'adult'])

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
  targetLevels: z.array(targetLevelEnum).nullish(),
  district: optionalString,
  contactPhone: optionalString,
  contactEmail: optionalString,
  oneLineIntroduction: optionalString,
  participantRecruitmentNotesNotApplicable: z.enum(['applicable', 'not_applicable']).nullish(),
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
