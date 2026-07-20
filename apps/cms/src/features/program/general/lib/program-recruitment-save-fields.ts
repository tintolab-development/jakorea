import { z } from 'zod'

const optionalString = z.string().optional()
const optionalNonNegNumber = z.number().min(0).optional()
const publishedEnum = z.enum(['published', 'unpublished']).optional()
const requiredEnum = z.enum(['required', 'not_required']).optional()
const providedEnum = z.enum(['provided', 'not_provided']).optional()
const yesNoEnum = z.enum(['yes', 'no']).optional()
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
  targetLevels: z.array(targetLevelEnum).optional(),
  district: optionalString,
  contactPhone: optionalString,
  contactEmail: optionalString,
  oneLineIntroduction: optionalString,
})

export const programInstructorRecruitmentSaveSchema = z.object({
  instructorRecruitmentAnnouncementPublished: publishedEnum,
  startDate: optionalString,
  endDate: optionalString,
  instructorTargets: z.array(z.string()).optional(),
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
  volunteerTargets: z.array(z.string()).optional(),
  volunteerTargetDetail: optionalString,
  contactPhone: optionalString,
  contactEmail: optionalString,
  oneLineIntroduction: optionalString,
})
