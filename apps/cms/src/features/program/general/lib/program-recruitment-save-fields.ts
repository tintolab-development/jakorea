import { z } from 'zod'
import { isValidKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'
import {
  shouldShowApplicationMaxScheduleFields,
  shouldShowApplicationMaxSessionsPerDayField,
} from '@jakorea/form-schema/program-application'
import { normalizeTargetLevelValue } from '@/features/program/shared/lib/program-detail-info-constants'
import { isAnnouncementUnpublished } from '@/features/program/shared/lib/participant-recruitment-form-options'
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
  educationStructure: z.enum(['curriculum', 'schedule']).optional(),
  sessionRound: z.enum(['single', 'multi']).optional(),
  educationScheduleMode: z.enum(['date', 'period']).optional(),
  participantProgramOperationStartDate: optionalString,
  participantProgramOperationEndDate: optionalString,
  targetLevels: targetLevelsSaveSchema,
  district: optionalString,
  contactPhone: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .optional()
      .refine(
        value => !value?.trim() || isValidKoreanPhoneNumber(value),
        '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'
      )
  ),
  contactEmail: optionalString,
  oneLineIntroduction: optionalString,
  remarks: optionalString,
  educationTargetDetail: optionalString,
  participantRecruitmentNotesNotApplicable: notesApplicableEnum,
  recruitmentContactOrganizationName: optionalString,
})

const requiredText = (message: string) =>
  z.preprocess(
    emptyToUndefined,
    z.string({ required_error: message, invalid_type_error: message }).min(1, message)
  )

const requiredEnumMessage = <T extends [string, ...string[]]>(
  values: T,
  message: string
) => z.preprocess(emptyToUndefined, z.enum(values, { required_error: message }))

const requiredNonNeg = (message: string) =>
  z.preprocess(
    emptyToUndefined,
    z.number({ required_error: message, invalid_type_error: message }).min(0, message)
  )

/** 교육받은 교사 모집 정보 수정 — 화면에 열린 필수 필드만 */
export const programTrainedTeachersRecruitmentSaveSchema = programParticipantRecruitmentSaveSchema
  .extend({
    participantRecruitmentAnnouncementPublished: requiredEnumMessage(
      ['published', 'unpublished'],
      '공고 게시 여부를 선택해주세요'
    ),
    studentListRequired: requiredEnumMessage(
      ['required', 'not_required'],
      '학생 명단 제출 여부를 선택해주세요'
    ),
    participantRecruitmentMaxClassCount: requiredNonNeg('신청 가능 최대 학급 수를 입력해주세요'),
    targetLevels: z.preprocess(
      coerceTargetLevels,
      z.array(targetLevelEnum).min(1, '교육 대상을 선택해주세요')
    ),
    educationTargetDetail: requiredText('교육 대상 상세를 입력해주세요'),
  })
  .superRefine((values, ctx) => {
    // zod의 extend 추론이 공통 스키마의 보조 분기 필드를 좁히지 못하는 버전과도 호환한다.
    const scheduleValues = values as typeof values & {
      educationStructure?: 'curriculum' | 'schedule'
      sessionRound?: 'single' | 'multi'
      educationScheduleMode?: 'date' | 'period'
      participantRecruitmentMaxScheduleCount?: number
      participantRecruitmentMaxSessionsPerDay?: number
      participantRecruitmentAnnouncementPublished?: 'published' | 'unpublished'
      participantRecruitmentNotesNotApplicable?: 'applicable' | 'not_applicable'
      remarks?: string
      resultAnnouncementDate?: string
      resultAnnouncementMethod?: string
    }
    const requireText = (path: string, value: unknown, message: string) => {
      if (value == null || (typeof value === 'string' && value.trim() === '')) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: [path], message })
      }
    }
    const unpublished = isAnnouncementUnpublished(
      scheduleValues.participantRecruitmentAnnouncementPublished
    )
    if (!unpublished) {
      requireText(
        'participantProgramOperationStartDate',
        scheduleValues.participantProgramOperationStartDate,
        '프로그램 운영 시작일을 선택해주세요'
      )
      requireText(
        'participantProgramOperationEndDate',
        scheduleValues.participantProgramOperationEndDate,
        '프로그램 운영 종료일을 선택해주세요'
      )
      requireText(
        'applicationStartDate',
        scheduleValues.applicationStartDate,
        '참여자 모집 시작일을 선택해주세요'
      )
      requireText(
        'applicationEndDate',
        scheduleValues.applicationEndDate,
        '참여자 모집 종료일을 선택해주세요'
      )
      requireText(
        'resultAnnouncementDate',
        scheduleValues.resultAnnouncementDate,
        '합격자 발표일을 선택해주세요'
      )
      requireText(
        'resultAnnouncementMethod',
        scheduleValues.resultAnnouncementMethod,
        '발표 방법을 입력해주세요'
      )
    }
    if (scheduleValues.participantRecruitmentNotesNotApplicable !== 'not_applicable') {
      requireText('remarks', scheduleValues.remarks, '비고를 입력해주세요')
    }
    const visibility = {
      educationStructure: scheduleValues.educationStructure,
      sessionRound: scheduleValues.sessionRound,
      educationScheduleMode: scheduleValues.educationScheduleMode,
    }
    if (
      shouldShowApplicationMaxScheduleFields(visibility) &&
      scheduleValues.participantRecruitmentMaxScheduleCount == null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['participantRecruitmentMaxScheduleCount'],
        message: '신청 가능 최대 일정 수를 입력해주세요',
      })
    }
    if (
      shouldShowApplicationMaxSessionsPerDayField(visibility) &&
      scheduleValues.participantRecruitmentMaxSessionsPerDay == null
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['participantRecruitmentMaxSessionsPerDay'],
        message: '신청 가능 1일 최대 차시를 입력해주세요',
      })
    }
  })

export const programInstructorRecruitmentSaveSchema = z.object({
  instructorRecruitmentAnnouncementPublished: publishedEnum,
  instructorProgramOperationStartDate: optionalString,
  instructorProgramOperationEndDate: optionalString,
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
  instructorRecruitmentContactOrganizationName: optionalString,
  instructorContactPhone: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .optional()
      .refine(
        value => !value?.trim() || isValidKoreanPhoneNumber(value),
        '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'
      )
  ),
  instructorContactEmail: optionalString,
  contactPhone: optionalString,
  contactEmail: optionalString,
  otherNotes: optionalString,
  instructorRecruitmentRemarks: optionalString,
  instructorRecruitmentNotesNotApplicable: notesApplicableEnum,
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
  volunteerProgramOperationStartDate: optionalString,
  volunteerProgramOperationEndDate: optionalString,
  volunteerTargets: z.array(z.string()).nullish(),
  volunteerTargetDetail: optionalString,
  volunteerRecruitmentContactOrganizationName: optionalString,
  volunteerContactPhone: z.preprocess(
    emptyToUndefined,
    z
      .string()
      .optional()
      .refine(
        value => !value?.trim() || isValidKoreanPhoneNumber(value),
        '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'
      )
  ),
  volunteerContactEmail: optionalString,
  contactPhone: optionalString,
  contactEmail: optionalString,
  oneLineIntroduction: optionalString,
})
