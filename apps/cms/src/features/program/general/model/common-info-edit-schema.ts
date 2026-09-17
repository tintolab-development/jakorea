/**
 * 일반 프로그램 상세 — 공통 정보 「정보 수정」 전용 스키마·변환
 */

import { z } from 'zod'
import type {
  GeneralProgramParticipantType,
  GeneralProgramSessionRoundKind,
  GeneralProgramSurveyMenuKey,
  InstitutionType,
  Program,
} from '@/types/domain'
import type { SponsorContactRow, SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import {
  resolveGeneralProgramCommonInfo,
  resolveScheduleTypeDetailedProgramNameFromDetails,
} from '@/features/program/general/lib/detail-common-info-display'
import {
  isProgramPaymentNoneOnly,
  PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL,
  programPaymentItemLabelsFromIds,
  resolveProgramPaymentItemIdsFromLabels,
  resolveProgramWageDeductionLabel,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import { getGeneralParticipantTypes } from '@/features/program/general/lib/detail-meta'
import {
  isGeneralIndividualParticipantSelection,
  isGeneralIndividualProgram,
} from '@/features/program/general/lib/survey-audience'
import { normalizeGeneralSurveyMenuKeys } from '@/features/program/general/lib/general-survey-menu-keys'
import { resolveEffectiveGeneralProgramTypeFields } from '@/features/program/general/lib/curriculum-display'
import {
  buildDefaultScheduleDetailsForEdit,
  inferScheduleDetailBlockKind,
  isPreEducationCurriculumSession,
  relabelScheduleDetailFormRowsByKind,
  shouldDisableEducationSchedulePeriodMode,
} from '@/features/program/general/lib/schedule-detail-form'
import {
  TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE,
  withDetailedProgramNoneOption,
} from '@/features/template/lib/template-form-select-options'
import { normalizeProgramBusinessAreaValue } from '@/features/program/shared/lib/program-detail-info-constants'
import {
  PROGRAM_REGISTRATION_COURSE_DELIVERED_BY_OPTIONS,
  PROGRAM_REGISTRATION_EDUCATION_COURSE_OPTIONS,
  PROGRAM_REGISTRATION_IP_OWNED_OPTIONS,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import {
  PROGRAM_REGISTRATION_SURVEY_ITEM_LABELS,
  type ProgramRegistrationSurveyItemId,
} from '@/features/template/lib/program-registration-survey-items'
import {
  PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS,
  PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS,
  PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS,
  type ProgramRegistrationIpsCategory,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import { getProgramRegistrationEducationFormOptions } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-form-options'

const curriculumSessionSchema = z.object({
  sessionLabel: z.string(),
  title: z.string(),
  description: z.string(),
  assignmentEnabled: z.boolean().optional(),
  assignmentPeriod: z.string().optional(),
  educationForm: z.string().optional(),
  participationMethod: z.enum(['individual', 'team']).optional(),
  ipsCategory: z.enum(['inspire', 'prepare', 'succeed', '']).optional(),
  ipsDetail: z.string().optional(),
  scheduleDate: z.string().optional(),
})

const scheduleGroupTimeSchema = z.object({
  startTime: z.string().optional(),
  endTime: z.string().optional(),
})

const scheduleDetailFormSchema = z.object({
  scheduleLabel: z.string(),
  blockKind: z.enum(['sub', 'event', 'preEducation']).optional(),
  name: z.string(),
  groupTimes: z.array(scheduleGroupTimeSchema),
  scheduleDate: z.string().optional(),
  assignmentEnabled: z.boolean().optional(),
  assignmentPeriod: z.string().optional(),
  educationForm: z.string().optional(),
  participationMethod: z.enum(['individual', 'team']).optional(),
  ipsCategory: z.enum(['inspire', 'prepare', 'succeed', '']).optional(),
  ipsDetail: z.string().optional(),
})

const participantTypeSchema = z.object({
  participantIndividual: z.boolean(),
  participantOrganization: z.boolean(),
  participantTeacherInstructor: z.boolean(),
  participantVolunteer: z.boolean(),
})

function isBlankText(value: string | undefined | null): boolean {
  return value == null || value.trim() === ''
}

function isIpsTypeIncomplete(category: string | undefined, detail: string | undefined): boolean {
  if (isBlankText(category)) return true
  if (category === 'prepare') return false
  return isBlankText(detail)
}

/**
 * 일반 프로그램 공통 정보 — 등록(`registration-required-fields`)과 동일하게
 * 화면에 노출되는 입력은 모두 필수. 조건부 필드는 superRefine에서 검사.
 */
export const generalProgramCommonInfoEditSchema = z
  .object({
    mainTitle: z.string().trim().min(1, '대표 프로그램명(국문)을 입력해주세요'),
    titleEn: z.string().trim().min(1, '대표 프로그램명(영문)을 입력해주세요'),
    announcementTitle: z.string().trim().min(1, '공고용 프로그램명을 입력해주세요'),
    detailedProgramId: z.string(),
    startDate: z.string().min(1, '사업 운영 기간을 선택해주세요'),
    endDate: z.string().min(1, '사업 운영 기간을 선택해주세요'),
    businessArea: z.string().min(1, '사업 분야를 선택해주세요'),
    sponsorManagementIds: z.array(z.string()).min(1, '후원사를 선택해주세요'),
    sponsorManagerContactIds: z.array(z.string()).min(1, '후원사 담당자를 선택해주세요'),
    /** @deprecated 레거시 단일 — seed 호환용, 검증은 ids 사용 */
    sponsorManagerContactId: z.string().optional(),
    venueKind: z.enum(['inside', 'outside', 'other']),
    venueDetail: z.string().trim().min(1, '교육 장소를 입력해주세요'),
    surveySurvey: z.boolean(),
    surveySatisfaction: z.boolean(),
    surveyLectureEvaluation: z.boolean(),
    educationProcess: z.string().min(1, '교육 과정을 선택해주세요'),
    ipOwned: z.string().min(1, 'IP Owned를 선택해주세요'),
    courseDeliveredBy: z.string().min(1, 'Course Delivered By를 선택해주세요'),
    partnerInvolvement: z.enum(['yes', 'no']),
    kpiFinalParticipants: z.coerce.number({
      invalid_type_error: '참여자 최종 인원을 입력해주세요',
    }),
    kpiInstructorCount: z.coerce.number({
      invalid_type_error: '강사 인원을 입력해주세요',
    }),
    kpiVolunteerCount: z.coerce.number({
      invalid_type_error: '봉사자 인원을 입력해주세요',
    }),
    kpiFinalSchools: z.coerce.number({
      invalid_type_error: '파견 학교 수를 입력해주세요',
    }),
    kpiFinalClasses: z.coerce.number({
      invalid_type_error: '파견 학급 수를 입력해주세요',
    }),
    wageGrade1Amount: z.string().trim().min(1, '1급 강사비를 입력해주세요'),
    wageGrade2Amount: z.string().trim().min(1, '2급 강사비를 입력해주세요'),
    wageGrade3Amount: z.string().trim().min(1, '3급 강사비를 입력해주세요'),
    wagePaymentItemIds: z.array(z.string()).min(1, '지급 항목을 선택해주세요'),
    wageDeductionItems: z.string().optional(),
    educationStructure: z.enum(['curriculum', 'schedule']),
    sessionRound: z.enum(['single', 'multi']),
    educationForm: z.string(),
    educationFormScheduleDetail: z.enum(['common', 'perSchedule']),
    participationScheduleDetail: z.enum(['common', 'perSchedule']),
    ipsScheduleDetail: z.enum(['common', 'perSchedule']),
    ipsCategory: z.enum(['inspire', 'prepare', 'succeed', '']),
    ipsDetail: z.string(),
    participationMethod: z.enum(['individual', 'team']),
    curriculumSessions: z.array(curriculumSessionSchema),
    scheduleGroupCount: z.coerce.number().min(1).max(4).default(1),
    scheduleDetails: z.array(scheduleDetailFormSchema),
    scheduleCurriculumPreEducation: z.boolean(),
    educationScheduleMode: z.enum(['date', 'period']).default('date'),
    educationScheduleLines: z.array(z.string()),
  })
  .merge(participantTypeSchema)
  .superRefine((data, ctx) => {
    const hasParticipant =
      data.participantIndividual ||
      data.participantOrganization ||
      data.participantTeacherInstructor ||
      data.participantVolunteer
    if (!hasParticipant) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '참여자 유형을 선택해주세요',
        path: ['participantOrganization'],
      })
    }

    if (
      data.educationStructure !== 'schedule' &&
      (isBlankText(data.detailedProgramId) ||
        data.detailedProgramId === TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '세부 프로그램명을 선택해주세요',
        path: ['detailedProgramId'],
      })
    }

    if (!data.surveySurvey && !data.surveySatisfaction && !data.surveyLectureEvaluation) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '설문 진행 항목을 선택해주세요',
        path: ['surveySurvey'],
      })
    }

    const isIndividualTarget = isGeneralIndividualParticipantSelection(
      data.participantIndividual,
      data.participantOrganization
    )
    if (!Number.isFinite(data.kpiFinalParticipants) || data.kpiFinalParticipants < 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '참여자 최종 인원을 입력해주세요',
        path: ['kpiFinalParticipants'],
      })
    }
    if (data.participantTeacherInstructor) {
      if (!Number.isFinite(data.kpiInstructorCount) || data.kpiInstructorCount < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '강사 인원을 입력해주세요',
          path: ['kpiInstructorCount'],
        })
      }
    }
    if (data.participantVolunteer) {
      if (!Number.isFinite(data.kpiVolunteerCount) || data.kpiVolunteerCount < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '봉사자 인원을 입력해주세요',
          path: ['kpiVolunteerCount'],
        })
      }
    }
    if (!isIndividualTarget) {
      if (!Number.isFinite(data.kpiFinalSchools) || data.kpiFinalSchools < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '파견 학교 수를 입력해주세요',
          path: ['kpiFinalSchools'],
        })
      }
      if (!Number.isFinite(data.kpiFinalClasses) || data.kpiFinalClasses < 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '파견 학급 수를 입력해주세요',
          path: ['kpiFinalClasses'],
        })
      }
    }

    const showParticipation = !data.participantOrganization
    const educationFormDetail = data.educationFormScheduleDetail
    const participationDetail = data.participationScheduleDetail

    if (data.sessionRound === 'multi') {
      if (educationFormDetail === 'common' && isBlankText(data.educationForm)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '교육 형태를 선택해주세요',
          path: ['educationForm'],
        })
      }
      if (
        showParticipation &&
        participationDetail === 'common' &&
        data.participationMethod !== 'individual' &&
        data.participationMethod !== 'team'
      ) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '참여 방식을 선택해주세요',
          path: ['participationMethod'],
        })
      }
    } else if (isBlankText(data.educationForm)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '교육 형태를 선택해주세요',
        path: ['educationForm'],
      })
    }

    if (data.ipsScheduleDetail === 'common' && isIpsTypeIncomplete(data.ipsCategory, data.ipsDetail)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'IPS Type을 선택해주세요',
        path: ['ipsCategory'],
      })
    }

    if (data.educationStructure === 'curriculum') {
      if (data.curriculumSessions.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '교육 진행(커리큘럼) 차시를 추가해주세요',
          path: ['curriculumSessions'],
        })
      }
      data.curriculumSessions.forEach((session, index) => {
        const isPre = isPreEducationCurriculumSession(session)
        if (isBlankText(session.title)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: isPre ? '사전 교육명을 입력해주세요' : '차시명을 입력해주세요',
            path: ['curriculumSessions', index, 'title'],
          })
        }
        if (!isPre && isBlankText(session.description)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '차시 내용을 입력해주세요',
            path: ['curriculumSessions', index, 'description'],
          })
        }
        if (isPre && isBlankText(session.scheduleDate)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '사전 교육 일정을 입력해주세요',
            path: ['curriculumSessions', index, 'scheduleDate'],
          })
        }
        if (
          educationFormDetail === 'perSchedule' &&
          !isPre &&
          isBlankText(session.educationForm)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '교육 형태를 선택해주세요',
            path: ['curriculumSessions', index, 'educationForm'],
          })
        }
        if (
          showParticipation &&
          participationDetail === 'perSchedule' &&
          !isPre &&
          session.participationMethod !== 'individual' &&
          session.participationMethod !== 'team'
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '참여 방식을 선택해주세요',
            path: ['curriculumSessions', index, 'participationMethod'],
          })
        }
        if (
          data.ipsScheduleDetail === 'perSchedule' &&
          !isPre &&
          isIpsTypeIncomplete(session.ipsCategory, session.ipsDetail)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'IPS Type을 선택해주세요',
            path: ['curriculumSessions', index, 'ipsCategory'],
          })
        }
        if (!isPre && session.assignmentEnabled === true && isBlankText(session.assignmentPeriod)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '과제 제출 기간을 입력해주세요',
            path: ['curriculumSessions', index, 'assignmentPeriod'],
          })
        }
      })
    }

    if (data.educationStructure === 'schedule') {
      if (data.scheduleDetails.length === 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '교육 진행(일정형) 세부 일정을 추가해주세요',
          path: ['scheduleDetails'],
        })
      }
      const groupCount =
        data.sessionRound === 'multi' ? 1 : Math.max(1, data.scheduleGroupCount ?? 1)
      data.scheduleDetails.forEach((detail, index) => {
        const isPre = detail.blockKind === 'preEducation'
        if (isBlankText(detail.name)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: isPre ? '사전 교육명을 입력해주세요' : '일정 상세를 입력해주세요',
            path: ['scheduleDetails', index, 'name'],
          })
        }
        const useEventDate =
          data.sessionRound === 'multi' && educationFormDetail === 'perSchedule'
        if (useEventDate || isPre || detail.blockKind === 'event') {
          if (useEventDate && isBlankText(detail.scheduleDate)) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: '일정을 선택해주세요',
              path: ['scheduleDetails', index, 'scheduleDate'],
            })
          }
        } else {
          const slots = detail.groupTimes ?? []
          if (slots.length < groupCount) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: '진행 시간을 입력해주세요',
              path: ['scheduleDetails', index, 'groupTimes'],
            })
          } else {
            for (let g = 0; g < groupCount; g += 1) {
              const slot = slots[g]
              if (isBlankText(slot?.startTime) || isBlankText(slot?.endTime)) {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: '진행 시간을 입력해주세요',
                  path: ['scheduleDetails', index, 'groupTimes', g],
                })
              }
            }
          }
        }
        if (educationFormDetail === 'perSchedule' && isBlankText(detail.educationForm)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '교육 형태를 선택해주세요',
            path: ['scheduleDetails', index, 'educationForm'],
          })
        }
        if (
          showParticipation &&
          participationDetail === 'perSchedule' &&
          detail.participationMethod !== 'individual' &&
          detail.participationMethod !== 'team'
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '참여 방식을 선택해주세요',
            path: ['scheduleDetails', index, 'participationMethod'],
          })
        }
        if (
          data.ipsScheduleDetail === 'perSchedule' &&
          !isPre &&
          isIpsTypeIncomplete(detail.ipsCategory, detail.ipsDetail)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'IPS Type을 선택해주세요',
            path: ['scheduleDetails', index, 'ipsCategory'],
          })
        }
        if (
          showParticipation &&
          detail.assignmentEnabled === true &&
          isBlankText(detail.assignmentPeriod)
        ) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: '과제 제출 기간을 입력해주세요',
            path: ['scheduleDetails', index, 'assignmentPeriod'],
          })
        }
      })
    }

    const hideEducationSchedule =
      data.educationStructure === 'schedule' && data.sessionRound === 'multi'
    if (!hideEducationSchedule) {
      const hasLine = data.educationScheduleLines.some(line => !isBlankText(line))
      if (!hasLine) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: '교육 진행 일정을 입력해주세요',
          path: ['educationScheduleLines'],
        })
      }
    }
  })

export type GeneralProgramCommonInfoEditFormValues = z.infer<
  typeof generalProgramCommonInfoEditSchema
>

export function getGeneralCommonInfoEditValidationMessage(
  values: GeneralProgramCommonInfoEditFormValues
): string | undefined {
  const result = generalProgramCommonInfoEditSchema.safeParse(values)
  if (result.success) return undefined
  return result.error.issues[0]?.message ?? '입력값을 확인해 주세요.'
}

export type GeneralProgramScheduleDetailFormValues = z.infer<typeof scheduleDetailFormSchema>

export function padScheduleDetailLabel(index: number): string {
  return `세부 일정 ${String(index + 1).padStart(2, '0')}`
}

function emptyScheduleGroupTimes(count: number) {
  return Array.from({ length: count }, () => ({ startTime: '', endTime: '' }))
}

export function parseScheduleProgressTimeSummary(
  summary: string | undefined
): Array<{ startTime: string; endTime: string }> {
  if (!summary?.trim()) return [{ startTime: '', endTime: '' }]
  return summary.split(/\s*\|\s*/).map(part => {
    const match = part
      .trim()
      .match(/그룹\s+[A-Z]\s*:\s*(\d{1,2}:\d{2})\s*~\s*(\d{1,2}:\d{2})/)
    return { startTime: match?.[1] ?? '', endTime: match?.[2] ?? '' }
  })
}

export function buildScheduleProgressTimeSummary(
  groupTimes: Array<{ startTime?: string; endTime?: string }>
): string {
  return groupTimes
    .map((gt, gi) => {
      const letter = String.fromCharCode('A'.charCodeAt(0) + gi)
      const start = gt.startTime?.trim() ?? ''
      const end = gt.endTime?.trim() ?? ''
      if (!start || !end) return `그룹 ${letter} : -`
      return `그룹 ${letter} : ${start} ~ ${end}`
    })
    .join(' | ')
}

export function resolveScheduleDetailsFormState(
  commonInfo: NonNullable<Program['generalCommonInfo']>,
  sessionRound: GeneralProgramSessionRoundKind = 'single',
  options?: { participantOrganization?: boolean }
): {
  scheduleGroupCount: number
  scheduleDetails: GeneralProgramScheduleDetailFormValues[]
  scheduleCurriculumPreEducation: boolean
} {
  const eduDetail = commonInfo.educationFormScheduleDetail ?? 'common'
  const partDetail = commonInfo.participationScheduleDetail ?? 'common'
  const ipsDetail =
    commonInfo.ipsScheduleDetail ??
    (commonInfo.ipsTypeSummary?.includes('별') ? 'perSchedule' : 'common')

  const raw = commonInfo.scheduleDetails ?? []
  if (raw.length === 0) {
    const groupCount = 1
    return {
      scheduleGroupCount: groupCount,
      scheduleCurriculumPreEducation: commonInfo.scheduleCurriculumPreEducation ?? false,
      scheduleDetails: buildDefaultScheduleDetailsForEdit({
        sessionRound,
        scheduleGroupCount: groupCount,
        educationFormScheduleDetail: eduDetail,
        participationScheduleDetail: partDetail,
        ipsScheduleDetail: ipsDetail,
        participantOrganization: options?.participantOrganization ?? true,
      }),
    }
  }

  const scheduleDetails = raw.map((d, i) => {
    const blockKind = inferScheduleDetailBlockKind(d.scheduleLabel ?? '')
    const groupTimes = d.progressTimeSummary
      ? parseScheduleProgressTimeSummary(d.progressTimeSummary)
      : emptyScheduleGroupTimes(1)
    const sessionIps = parseSessionIpsTypeSummary(d.ipsTypeSummary)
    return {
      scheduleLabel: d.scheduleLabel || padScheduleDetailLabel(i),
      blockKind,
      name: d.name ?? '',
      groupTimes: groupTimes.length > 0 ? groupTimes : emptyScheduleGroupTimes(1),
      scheduleDate: d.scheduleDateLabel ?? '',
      assignmentEnabled: d.assignmentEnabled ?? false,
      assignmentPeriod: d.assignmentPeriod ?? '',
      educationForm: educationFormValueFromLabel(d.educationFormLabel),
      participationMethod: participationMethodValueFromLabel(d.participationMethodLabel),
      ipsCategory: blockKind === 'preEducation' ? 'prepare' : sessionIps.ipsCategory,
      ipsDetail: blockKind === 'preEducation' ? 'none' : sessionIps.ipsDetail,
    }
  })

  const scheduleGroupCount = Math.max(1, ...scheduleDetails.map(d => d.groupTimes.length))
  return {
    scheduleCurriculumPreEducation: commonInfo.scheduleCurriculumPreEducation ?? false,
    scheduleGroupCount,
    scheduleDetails: scheduleDetails.map(d => ({
      ...d,
      groupTimes: [
        ...d.groupTimes,
        ...emptyScheduleGroupTimes(Math.max(0, scheduleGroupCount - d.groupTimes.length)),
      ].slice(0, scheduleGroupCount),
    })),
  }
}

export function relabelScheduleDetailFormRows(
  details: GeneralProgramScheduleDetailFormValues[]
): GeneralProgramScheduleDetailFormValues[] {
  return relabelScheduleDetailFormRowsByKind(details)
}

function toIso(d: string | Date | undefined): string {
  if (d == null) return ''
  return typeof d === 'string' ? d : (d.toISOString?.() ?? String(d))
}

function resolveBusinessAreaFormValue(businessArea: string | undefined): string {
  return normalizeProgramBusinessAreaValue(businessArea)
}

function resolveEducationProcessFormValue(value: string | undefined): string {
  if (!value?.trim()) return ''
  const byValue = PROGRAM_REGISTRATION_EDUCATION_COURSE_OPTIONS.find(o => o.value === value)
  if (byValue) return byValue.value
  const byLabel = PROGRAM_REGISTRATION_EDUCATION_COURSE_OPTIONS.find(o => o.label === value)
  return byLabel?.value ?? value
}

function resolveIpOwnedFormValue(value: string | undefined): string {
  if (!value?.trim()) return ''
  const normalized = value.toLowerCase()
  const byValue = PROGRAM_REGISTRATION_IP_OWNED_OPTIONS.find(
    o => o.value === normalized || o.label.toLowerCase() === normalized
  )
  if (byValue) return byValue.value
  if (normalized === 'joint') return 'jointly'
  return normalized
}

function resolveCourseDeliveredFormValue(value: string | undefined): string {
  if (!value?.trim()) return ''
  const normalized = value.toLowerCase()
  const byValue = PROGRAM_REGISTRATION_COURSE_DELIVERED_BY_OPTIONS.find(
    o => o.value === normalized || o.label.toLowerCase() === normalized
  )
  return byValue?.value ?? normalized
}

function educationProcessToProgramValue(formValue: string): string {
  return (
    PROGRAM_REGISTRATION_EDUCATION_COURSE_OPTIONS.find(o => o.value === formValue)?.label ??
    formValue
  )
}

function ipOwnedToProgramValue(formValue: string): string {
  const label =
    PROGRAM_REGISTRATION_IP_OWNED_OPTIONS.find(o => o.value === formValue)?.label ?? formValue
  if (label === 'Jointly') return 'Jointly'
  if (label === 'Partner') return 'Partner'
  return 'JA'
}

function courseDeliveredToProgramValue(formValue: string): 'JA' | 'Jointly' | 'Partner' {
  const label =
    PROGRAM_REGISTRATION_COURSE_DELIVERED_BY_OPTIONS.find(o => o.value === formValue)?.label ??
    formValue
  if (label === 'Jointly') return 'Jointly'
  if (label === 'Partner') return 'Partner'
  return 'JA'
}

function businessAreaToProgramValue(formValue: string): string {
  return normalizeProgramBusinessAreaValue(formValue)
}

export function isGeneralProgramScheduleType(program: Program): boolean {
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  return (
    resolveEffectiveGeneralProgramTypeFields({
      generalProgramAudience: program.generalProgramAudience,
      generalProgramEducationStructure: program.generalProgramEducationStructure,
      generalProgramSessionRound: program.generalProgramSessionRound,
      curriculumSessions: commonInfo.curriculumSessions,
    }).educationStructure === 'schedule'
  )
}

function resolveDetailedProgramId(
  program: Program,
  catalog: readonly { id: string; name: string }[] = []
): string {
  if (isGeneralProgramScheduleType(program)) {
    return TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE
  }
  const storedId = program.detailedProgramId?.trim()
  if (storedId && storedId !== TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE) {
    return storedId
  }
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const name =
    commonInfo.detailedProgramName?.trim() ||
    program.textbookName?.trim() ||
    program.teamDivision?.trim()
  if (!name) return ''
  const matched = catalog.find(row => row.name === name)
  return matched?.id ?? ''
}

export type GeneralProgramVenueKind = 'inside' | 'outside' | 'other'

export const GENERAL_PROGRAM_VENUE_KIND_LABELS: Record<GeneralProgramVenueKind, string> = {
  inside: '기관 안',
  outside: '기관 밖',
  other: '기타(직접입력)',
}

export function resolveVenueKind(program: Program): GeneralProgramVenueKind {
  const nested = program.generalCommonInfo?.venueKind
  if (nested === 'inside' || nested === 'outside' || nested === 'other') return nested
  if (program.institutionType === 'inside_school') return 'inside'
  if (program.institutionType === 'outside_school') return 'outside'
  if (program.venue?.trim() || program.generalCommonInfo?.venueDetail?.trim()) return 'other'
  return 'inside'
}

/** 조회 모드 — 라디오 선택 · 상세 입력 (`|` 구분) */
export function formatGeneralProgramVenueViewLine(
  program: Program,
  venueDetail?: string | null
): string {
  const kindLabel = GENERAL_PROGRAM_VENUE_KIND_LABELS[resolveVenueKind(program)]
  const detail = venueDetail?.trim() || program.venue?.trim() || '-'
  return `${kindLabel} | ${detail}`
}

const SPONSOR_MANAGER_CONTACT_REF_SEPARATOR = '::'

export function encodeSponsorManagerContactRef(
  sponsorManagementId: string,
  contactId: string
): string {
  return `${sponsorManagementId}${SPONSOR_MANAGER_CONTACT_REF_SEPARATOR}${contactId}`
}

export function decodeSponsorManagerContactRef(
  ref: string
): { sponsorManagementId: string; contactId: string } | null {
  const separatorIndex = ref.indexOf(SPONSOR_MANAGER_CONTACT_REF_SEPARATOR)
  if (separatorIndex <= 0) return null
  return {
    sponsorManagementId: ref.slice(0, separatorIndex),
    contactId: ref.slice(separatorIndex + SPONSOR_MANAGER_CONTACT_REF_SEPARATOR.length),
  }
}

/** 단일/배열 담당자 ref 를 배열로 정규화 */
export function normalizeSponsorManagerContactIds(input: {
  ids?: readonly string[] | null
  id?: string | null
}): string[] {
  if (input.ids != null && input.ids.length > 0) {
    return [...new Set(input.ids.map(v => v.trim()).filter(Boolean))]
  }
  const single = input.id?.trim()
  return single ? [single] : []
}

/**
 * 후원사 id + 담당자 ref[] → PATCH `sponsors[]`.
 * BE는 후원사당 contact 1개 — 동일 후원사에 여러 ref면 마지막 값 사용.
 */
export function buildProgramSponsorAssignmentsWire(
  sponsorManagementIds: readonly string[],
  contactRefs: readonly string[]
): Array<{ sponsorId: string; sponsorContactId?: string }> {
  const contactBySponsor = new Map<string, string>()
  for (const ref of contactRefs) {
    const decoded = decodeSponsorManagerContactRef(ref.trim())
    if (!decoded?.sponsorManagementId || !decoded.contactId) continue
    contactBySponsor.set(decoded.sponsorManagementId, decoded.contactId)
  }
  const sponsorIds = [
    ...new Set(
      [...sponsorManagementIds, ...contactBySponsor.keys()]
        .map(id => String(id).trim())
        .filter(Boolean)
    ),
  ]
  return sponsorIds.map(sponsorId => {
    const contactId = contactBySponsor.get(sponsorId)
    return contactId
      ? { sponsorId, sponsorContactId: contactId }
      : { sponsorId }
  })
}

/**
 * 후원사 담당자 이름(+직함) — `이름 직함`, 직함 없으면 `이름`
 */
export function formatSponsorManagerPersonLabel(input: {
  contactName: string
  position?: string | null
}): string {
  const name = input.contactName.trim()
  const position = input.position?.trim() ?? ''
  if (!name) return position || '-'
  return position ? `${name} ${position}` : name
}

/**
 * 후원사 담당자 셀렉트 라벨
 * - multiSponsor(시안 기본): `소속 | 이름 직함` (직함 없으면 생략) — 예: `스타벅스 | 이가원 책임`
 * - 단일 표시만 필요할 때: `이름 직함` / `이름`
 */
export function formatSponsorManagerSelectLabel(input: {
  sponsorName: string
  contactName: string
  position?: string | null
  multiSponsor: boolean
}): string {
  const nameWithPosition = formatSponsorManagerPersonLabel({
    contactName: input.contactName,
    position: input.position,
  })
  if (!input.multiSponsor) return nameWithPosition
  const sponsorName = input.sponsorName.trim()
  if (!sponsorName) return nameWithPosition
  return `${sponsorName} | ${nameWithPosition}`
}

/**
 * view/저장용 담당자 한 줄 — `이름 직함 | 연락처` (직함·연락처 없으면 생략)
 */
export function formatSponsorManagerDisplayLine(input: {
  contactName: string
  position?: string | null
  phone?: string | null
}): string {
  return [formatSponsorManagerPersonLabel(input), input.phone?.trim()]
    .filter(Boolean)
    .join(' | ')
}

/**
 * view 모드 — 저장된 문구에서 담당자명을 매칭해 `이름 직함`(복수 시 `소속 | …`)으로 재구성.
 * 매칭 실패 시 stored 원문 반환.
 */
export function resolveSponsorManagerViewLine(input: {
  storedLine?: string | null
  sponsors: ReadonlyArray<{ id: string; name: string }>
  contactsBySponsorId: Record<string, ReadonlyArray<{ name: string; position?: string | null; phone?: string | null }>>
}): string {
  const stored = input.storedLine?.trim() ?? ''
  if (!stored || stored === '-') return stored || '-'
  const multiSponsor = input.sponsors.length > 1
  for (const sponsor of input.sponsors) {
    const contacts = input.contactsBySponsorId[sponsor.id] ?? []
    for (const contact of contacts) {
      const name = contact.name?.trim() ?? ''
      if (!name || !stored.includes(name)) continue
      const label = formatSponsorManagerSelectLabel({
        sponsorName: sponsor.name,
        contactName: contact.name,
        position: contact.position,
        multiSponsor,
      })
      const phone = contact.phone?.trim()
      return phone ? `${label} | ${phone}` : label
    }
  }
  return stored
}

export type GeneralProgramSponsorEditContext = {
  sponsors: SponsorManagementRow[]
  contactsBySponsorId: Record<string, SponsorContactRow[]>
}

const EMPTY_SPONSOR_CONTEXT: GeneralProgramSponsorEditContext = {
  sponsors: [],
  contactsBySponsorId: {},
}

function findSponsorByName(
  sponsors: readonly SponsorManagementRow[],
  name: string
): SponsorManagementRow | undefined {
  const trimmed = name.trim()
  if (!trimmed) return undefined
  return sponsors.find(row => row.name === trimmed)
}

export function resolveSponsorManagementIds(
  program: Program,
  context: GeneralProgramSponsorEditContext = EMPTY_SPONSOR_CONTEXT
): string[] {
  const { sponsors } = context
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  if (commonInfo.sponsorManagementIds?.length) return [...commonInfo.sponsorManagementIds]
  if (commonInfo.sponsorManagementId) return [commonInfo.sponsorManagementId]
  const displayName = commonInfo.sponsorDisplayName?.trim()
  if (displayName) {
    const names = displayName.split(',').map(name => name.trim()).filter(Boolean)
    const ids = names
      .map(name => findSponsorByName(sponsors, name)?.id)
      .filter((id): id is string => Boolean(id))
    if (ids.length > 0) return ids
  }
  if (program.sponsorId) {
    const byId = sponsors.find(row => row.id === program.sponsorId)
    if (byId) return [byId.id]
    const sponsorName = commonInfo.sponsorDisplayName?.trim() || program.title
    void sponsorName
  }
  return sponsors[0] ? [sponsors[0].id] : []
}

function resolveSponsorManagerContactIds(
  program: Program,
  sponsorManagementIds: string[],
  context: GeneralProgramSponsorEditContext = EMPTY_SPONSOR_CONTEXT
): string[] {
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const stored = normalizeSponsorManagerContactIds({
    ids: commonInfo.sponsorManagerContactIds,
    id: commonInfo.sponsorManagerContactId,
  })
  if (stored.length > 0) return stored

  // 후원사별 1명씩 시드 (이름·전화 매칭, 없으면 첫 연락처)
  const refs: string[] = []
  for (const sponsorId of sponsorManagementIds) {
    const contacts = context.contactsBySponsorId[sponsorId] ?? []
    if (contacts.length === 0) continue
    const line = commonInfo.sponsorManagerLine?.trim() || program.managerName?.trim() || ''
    const namePart = line.split('|')[0]?.trim() ?? line
    const matched = line
      ? contacts.find(
          c => c.name === namePart || line.includes(c.name) || (c.phone && line.includes(c.phone))
        )
      : undefined
    const contact = matched ?? contacts[0]
    if (contact) refs.push(encodeSponsorManagerContactRef(sponsorId, contact.id))
  }
  return refs
}

function resolveManagerFromFormValues(
  values: GeneralProgramCommonInfoEditFormValues,
  context: GeneralProgramSponsorEditContext = EMPTY_SPONSOR_CONTEXT
) {
  const refs = normalizeSponsorManagerContactIds({
    ids: values.sponsorManagerContactIds,
    id: values.sponsorManagerContactId,
  })
  const primaryRef = refs[0] ?? ''
  const decoded = primaryRef ? decodeSponsorManagerContactRef(primaryRef) : null
  const sponsorManagementId = decoded?.sponsorManagementId ?? values.sponsorManagementIds[0]
  const contactId = decoded?.contactId ?? primaryRef
  if (!sponsorManagementId || !contactId) {
    return { manager: undefined, sponsorManagementId, contactRefs: refs }
  }
  const manager = context.contactsBySponsorId[sponsorManagementId]?.find(c => c.id === contactId)
  return { manager, sponsorManagementId, contactRefs: refs }
}

function participantFlagsFromProgram(program: Program): Pick<
  GeneralProgramCommonInfoEditFormValues,
  | 'participantIndividual'
  | 'participantOrganization'
  | 'participantTeacherInstructor'
  | 'participantVolunteer'
> {
  const types = new Set(getGeneralParticipantTypes(program))
  let participantIndividual = types.has('individual')
  let participantOrganization = types.has('school_institution')

  // [개인]/[기관]은 상호 배타 — 양쪽 동시 true면 audience 기준으로 정규화
  if (participantIndividual && participantOrganization) {
    if (isGeneralIndividualProgram(program)) {
      participantOrganization = false
    } else {
      participantIndividual = false
    }
  }

  return {
    participantIndividual,
    participantOrganization,
    participantTeacherInstructor: types.has('teacher_instructor'),
    participantVolunteer: types.has('volunteer'),
  }
}

function surveyFlagsFromProgram(program: Program): Pick<
  GeneralProgramCommonInfoEditFormValues,
  'surveySurvey' | 'surveySatisfaction' | 'surveyLectureEvaluation'
> {
  const keys = new Set(normalizeGeneralSurveyMenuKeys(program.generalSurveyMenuKeys ?? []))
  return {
    surveySurvey: keys.has('survey'),
    surveySatisfaction: keys.has('satisfaction'),
    surveyLectureEvaluation: keys.has('lecture_evaluation'),
  }
}

const WAGE_GRADE_LABELS = ['1급 강사비', '2급 강사비', '3급 강사비'] as const

function parseWageGradeAmount(pricing: string | undefined): string {
  if (!pricing?.trim()) return ''
  const match = pricing.replace(/,/g, '').match(/(\d+)/)
  return match?.[1] ?? ''
}

function buildWageGradePricing(amount: string | undefined): string {
  const trimmed = amount?.trim()
  if (!trimmed) return '1시간 당 | 기본 : -'
  const num = Number(trimmed.replace(/,/g, ''))
  if (Number.isNaN(num)) return `1시간 당 | 기본 : ${trimmed}`
  return `1시간 당 | 기본 : ${num.toLocaleString('ko-KR')}원`
}

function resolvePaymentItemIds(paymentItems: string | undefined): string[] {
  return resolveProgramPaymentItemIdsFromLabels(paymentItems)
}

/** 편집 저장용 — UI 옵션(원격 포함)으로 라벨 해석. 비어 있으면 해당없음 */
function paymentItemLabelsFromIds(
  ids: string[] | undefined,
  options?: readonly { value: string; label: string }[]
): string {
  if (!ids?.length || isProgramPaymentNoneOnly(ids)) {
    return PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL
  }
  if (options && options.length > 0) {
    const labels = ids
      .map(id => options.find(o => o.value === id)?.label?.trim())
      .filter((label): label is string => Boolean(label))
    if (labels.length > 0) return labels.join(', ')
  }
  return programPaymentItemLabelsFromIds(ids) || PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL
}

function educationFormLabelFromValue(value: string | undefined): string {
  const options = getProgramRegistrationEducationFormOptions(true)
  return options.find(o => o.value === value)?.label ?? value ?? '-'
}

const PARTICIPATION_METHOD_LABEL_BY_VALUE = {
  individual: '개인',
  team: '팀',
} as const

export function participationMethodLabelFromValue(
  value: 'individual' | 'team' | undefined
): string {
  if (!value || value === 'individual') return PARTICIPATION_METHOD_LABEL_BY_VALUE.individual
  return PARTICIPATION_METHOD_LABEL_BY_VALUE.team
}

export function participationMethodValueFromLabel(
  label: string | undefined
): 'individual' | 'team' {
  const trimmed = label?.trim()
  if (trimmed === PARTICIPATION_METHOD_LABEL_BY_VALUE.team) return 'team'
  return 'individual'
}

function educationFormValueFromLabel(label: string | undefined): string {
  if (!label?.trim()) return 'online'
  const options = getProgramRegistrationEducationFormOptions(true)
  const matched = options.find(o => o.label === label.trim())
  if (matched) return matched.value
  if (label.includes('온라인')) return 'online'
  if (label.includes('오프라인') && !label.includes('온')) return 'offline'
  if (label.includes('온/오프') || label.includes('하이브리드')) return 'hybrid'
  if (label.includes('참여자')) return 'participant_selection'
  return 'online'
}

function parseSessionIpsTypeSummary(summary: string | undefined): {
  ipsCategory: ProgramRegistrationIpsCategory | ''
  ipsDetail: string
} {
  const trimmed = summary?.trim()
  if (!trimmed) return { ipsCategory: '', ipsDetail: '' }
  if (trimmed.includes('일정')) {
    const parsed = parseIpsTypeSummary(trimmed)
    return { ipsCategory: parsed.ipsCategory, ipsDetail: parsed.ipsDetail }
  }
  const parts = trimmed.split(/\s*\|\s*/)
  const categoryLabel = parts[0]?.trim() ?? ''
  const detailLabel = parts[1]?.trim() ?? ''
  const fakeSummary = `일정 공통 | ${categoryLabel} | ${detailLabel}`
  const parsed = parseIpsTypeSummary(fakeSummary)
  return { ipsCategory: parsed.ipsCategory, ipsDetail: parsed.ipsDetail }
}

export function buildSessionIpsTypeSummary(
  ipsCategory: ProgramRegistrationIpsCategory | '',
  ipsDetail: string | undefined
): string {
  const full = buildIpsTypeSummary('common', ipsCategory, ipsDetail)
  const parts = full.split(/\s*\|\s*/)
  return `${parts[1]?.trim() ?? '-'} | ${parts[2]?.trim() ?? '해당없음'}`
}

function parseIpsTypeSummary(summary: string | undefined): {
  ipsScheduleDetail: 'common' | 'perSchedule'
  ipsCategory: ProgramRegistrationIpsCategory | ''
  ipsDetail: string
} {
  const parts = summary?.split(/\s*\|\s*/) ?? []
  const scheduleLabel = parts[0]?.trim() ?? ''
  const categoryLabel = parts[1]?.trim() ?? ''
  const detailLabel = parts[2]?.trim() ?? ''

  const ipsScheduleDetail: 'common' | 'perSchedule' =
    scheduleLabel.includes('별') ? 'perSchedule' : 'common'

  let ipsCategory: ProgramRegistrationIpsCategory | '' = ''
  if (/inspire/i.test(categoryLabel)) ipsCategory = 'inspire'
  else if (/prepare/i.test(categoryLabel)) ipsCategory = 'prepare'
  else if (/succeed/i.test(categoryLabel)) ipsCategory = 'succeed'

  let ipsDetail = ''
  if (ipsCategory === 'succeed') {
    ipsDetail =
      PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS.find(o => o.label === detailLabel)
        ?.value ??
      (detailLabel.includes('해당') ? 'none' : '')
  } else if (ipsCategory === 'inspire') {
    ipsDetail =
      PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS.find(o => o.label === detailLabel)
        ?.value ??
      (detailLabel.includes('해당') ? 'none' : '')
  } else if (ipsCategory === 'prepare') {
    ipsDetail = 'none'
  }

  return { ipsScheduleDetail, ipsCategory, ipsDetail }
}

function resolveIpsCategoryFromProgramIps(
  ips: string | undefined
): ProgramRegistrationIpsCategory | '' {
  const raw = ips?.trim() ?? ''
  if (!raw) return ''
  const lower = raw.toLowerCase()
  if (lower === 'inspire' || lower === 'prepare' || lower === 'succeed') return lower
  if (/inspire/i.test(raw)) return 'inspire'
  if (/prepare/i.test(raw)) return 'prepare'
  if (/succeed/i.test(raw)) return 'succeed'
  return ''
}

function parseIpsTypeSummaryFromProgram(
  program: Program,
  summary: string | undefined
): ReturnType<typeof parseIpsTypeSummary> {
  const parsed = parseIpsTypeSummary(summary)
  if (!parsed.ipsCategory) {
    parsed.ipsCategory = resolveIpsCategoryFromProgramIps(program.ips)
    if (parsed.ipsCategory === 'prepare') parsed.ipsDetail = parsed.ipsDetail || 'none'
    else if (parsed.ipsCategory === 'succeed' && program.programCategory) {
      parsed.ipsDetail =
        PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS.find(
          o => o.label === program.programCategory || o.value === program.programCategory
        )?.value ||
        parsed.ipsDetail ||
        'none'
    } else if (parsed.ipsCategory === 'inspire' && program.programChannel) {
      parsed.ipsDetail =
        PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS.find(
          o => o.label === program.programChannel || o.value === program.programChannel
        )?.value ||
        parsed.ipsDetail ||
        'none'
    }
  }
  return parsed
}

function buildIpsTypeSummary(
  ipsScheduleDetail: 'common' | 'perSchedule',
  ipsCategory: ProgramRegistrationIpsCategory | '',
  ipsDetail: string | undefined
): string {
  const scheduleLabel = ipsScheduleDetail === 'perSchedule' ? '일정 별 상이' : '일정 공통'
  const categoryLabel =
    PROGRAM_REGISTRATION_IPS_CATEGORY_OPTIONS.find(o => o.value === ipsCategory)?.label ?? '-'
  let detailLabel = '해당없음'
  if (ipsCategory === 'succeed') {
    detailLabel =
      PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS.find(o => o.value === ipsDetail)
        ?.label ?? '해당 없음'
  } else if (ipsCategory === 'inspire') {
    detailLabel =
      PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS.find(o => o.value === ipsDetail)
        ?.label ?? '해당 없음'
  } else if (ipsCategory === 'prepare') {
    detailLabel = '해당없음'
  }
  return `${scheduleLabel} | ${categoryLabel} | ${detailLabel}`
}

function resolveTypeSettingsFromProgram(program: Program): Pick<
  GeneralProgramCommonInfoEditFormValues,
  | 'educationStructure'
  | 'sessionRound'
  | 'educationForm'
  | 'educationFormScheduleDetail'
  | 'participationScheduleDetail'
  | 'ipsScheduleDetail'
  | 'ipsCategory'
  | 'ipsDetail'
  | 'participationMethod'
> {
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const typeFields = resolveEffectiveGeneralProgramTypeFields({
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    curriculumSessions: commonInfo.curriculumSessions,
  })
  const ips = parseIpsTypeSummaryFromProgram(program, commonInfo.ipsTypeSummary)

  return {
    educationStructure: typeFields.educationStructure,
    sessionRound: typeFields.sessionRound,
    educationForm: educationFormValueFromLabel(commonInfo.educationFormLabel ?? undefined),
    educationFormScheduleDetail:
      commonInfo.educationFormScheduleDetail ??
      (commonInfo.educationFormLabel && !commonInfo.curriculumSessions?.some(s => s.educationFormLabel)
        ? 'common'
        : commonInfo.curriculumSessions?.some(s => s.educationFormLabel)
          ? 'perSchedule'
          : 'common'),
    participationScheduleDetail: commonInfo.participationScheduleDetail ?? 'common',
    ipsScheduleDetail: commonInfo.ipsScheduleDetail ?? ips.ipsScheduleDetail,
    ipsCategory: ips.ipsCategory,
    ipsDetail: ips.ipsDetail,
    participationMethod: commonInfo.participationMethod ?? 'individual',
  }
}

function resolveKpiFromProgram(program: Program): Pick<
  GeneralProgramCommonInfoEditFormValues,
  | 'kpiFinalParticipants'
  | 'kpiInstructorCount'
  | 'kpiVolunteerCount'
  | 'kpiFinalSchools'
  | 'kpiFinalClasses'
> {
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const kpi = commonInfo.kpi
  const isIndividual = isGeneralIndividualProgram(program)
  return {
    kpiFinalParticipants: kpi?.finalParticipants ?? program.approvedStudentCount ?? 0,
    kpiInstructorCount: kpi?.instructorCount ?? program.instructors ?? 0,
    kpiVolunteerCount: kpi?.volunteerCount ?? program.generalVolunteers ?? 0,
    kpiFinalSchools: isIndividual ? 0 : (kpi?.finalSchools ?? program.participatingSchoolCount ?? 0),
    kpiFinalClasses: isIndividual ? 0 : (kpi?.finalClasses ?? 0),
  }
}

function resolveWageFromProgram(program: Program): Pick<
  GeneralProgramCommonInfoEditFormValues,
  | 'wageGrade1Amount'
  | 'wageGrade2Amount'
  | 'wageGrade3Amount'
  | 'wagePaymentItemIds'
  | 'wageDeductionItems'
> {
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const rows = commonInfo.wageGradeRows ?? []
  const byGrade = Object.fromEntries(rows.map(r => [r.grade, r.pricing]))
  return {
    wageGrade1Amount: parseWageGradeAmount(byGrade[WAGE_GRADE_LABELS[0]]),
    wageGrade2Amount: parseWageGradeAmount(byGrade[WAGE_GRADE_LABELS[1]]),
    wageGrade3Amount: parseWageGradeAmount(byGrade[WAGE_GRADE_LABELS[2]]),
    wagePaymentItemIds: resolvePaymentItemIds(commonInfo.paymentItems),
    wageDeductionItems: resolveProgramWageDeductionLabel(
      resolvePaymentItemIds(commonInfo.paymentItems)
    ),
  }
}

export function programToGeneralCommonInfoEditValues(
  program: Program,
  context: GeneralProgramSponsorEditContext = EMPTY_SPONSOR_CONTEXT,
  detailedProgramCatalog: readonly { id: string; name: string }[] = []
): GeneralProgramCommonInfoEditFormValues {
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const sponsorManagementIds = resolveSponsorManagementIds(program, context)
  const typeSettings = resolveTypeSettingsFromProgram(program)
  const educationProcess =
    resolveEducationProcessFormValue(program.educationProcess) ||
    PROGRAM_REGISTRATION_EDUCATION_COURSE_OPTIONS[0]?.value ||
    'traditional_paper'
  const ipOwned =
    resolveIpOwnedFormValue(program.ipOwned) ||
    PROGRAM_REGISTRATION_IP_OWNED_OPTIONS[0]?.value ||
    'ja'
  const courseDeliveredBy =
    resolveCourseDeliveredFormValue(program.courseDeliveredBy) ||
    PROGRAM_REGISTRATION_COURSE_DELIVERED_BY_OPTIONS[0]?.value ||
    'ja'
  const participantFlags = participantFlagsFromProgram(program)
  const sponsorManagerContactIds = resolveSponsorManagerContactIds(
    program,
    sponsorManagementIds,
    context
  )

  return {
    mainTitle: program.mainTitle?.trim() ?? '',
    titleEn: program.titleEn?.trim() ?? '',
    announcementTitle: commonInfo.announcementTitle?.trim() || program.title?.trim() || '',
    detailedProgramId: resolveDetailedProgramId(program, detailedProgramCatalog),
    startDate: toIso(program.startDate),
    endDate: toIso(program.endDate),
    businessArea: resolveBusinessAreaFormValue(program.businessArea),
    sponsorManagementIds,
    sponsorManagerContactIds,
    sponsorManagerContactId: sponsorManagerContactIds[0],
    venueKind: resolveVenueKind(program),
    venueDetail: commonInfo.venueDetail?.trim() || program.venue?.trim() || '',
    ...participantFlags,
    ...surveyFlagsFromProgram(program),
    educationProcess,
    ipOwned,
    courseDeliveredBy,
    partnerInvolvement: program.partnerInvolvement ? 'yes' : 'no',
    ...resolveKpiFromProgram(program),
    ...resolveWageFromProgram(program),
    ...typeSettings,
    curriculumSessions: (commonInfo.curriculumSessions ?? []).map(s => {
      const sessionIps = parseSessionIpsTypeSummary(s.ipsTypeSummary)
      const isPreEducation = isPreEducationCurriculumSession(s)
      return {
        sessionLabel: s.sessionLabel,
        title: s.title,
        description: s.description,
        assignmentEnabled: isPreEducation ? false : (s.assignmentEnabled ?? false),
        assignmentPeriod: isPreEducation ? '' : (s.assignmentPeriod ?? ''),
        educationForm: educationFormValueFromLabel(s.educationFormLabel),
        participationMethod: isPreEducation
          ? undefined
          : participationMethodValueFromLabel(s.participationMethodLabel),
        ipsCategory: isPreEducation ? 'prepare' : sessionIps.ipsCategory,
        ipsDetail: isPreEducation ? 'none' : sessionIps.ipsDetail,
        scheduleDate: isPreEducation ? (s.scheduleDateLabel ?? '') : '',
      }
    }),
    ...resolveScheduleDetailsFormState(commonInfo, typeSettings.sessionRound, {
      participantOrganization: participantFlags.participantOrganization,
    }),
    educationScheduleMode: shouldDisableEducationSchedulePeriodMode({
      participantOrganization: participantFlags.participantOrganization,
      sessionRound: typeSettings.sessionRound,
    })
      ? 'date'
      : (commonInfo.educationScheduleMode ?? 'date'),
    educationScheduleLines: [...(commonInfo.educationScheduleLines ?? [])],
  }
}

function participantTypesFromFlags(
  values: GeneralProgramCommonInfoEditFormValues
): GeneralProgramParticipantType[] {
  const types: GeneralProgramParticipantType[] = []
  if (values.participantIndividual) types.push('individual')
  if (values.participantOrganization) types.push('school_institution')
  if (values.participantTeacherInstructor) types.push('teacher_instructor')
  if (values.participantVolunteer) types.push('volunteer')
  return types
}

function surveyKeysFromFlags(
  values: GeneralProgramCommonInfoEditFormValues
): GeneralProgramSurveyMenuKey[] {
  const keys: GeneralProgramSurveyMenuKey[] = []
  if (values.surveySurvey) keys.push('survey')
  if (values.surveySatisfaction) keys.push('satisfaction')
  if (values.surveyLectureEvaluation) keys.push('lecture_evaluation')
  return keys
}

function institutionTypeFromVenueKind(
  venueKind: GeneralProgramCommonInfoEditFormValues['venueKind']
): InstitutionType | undefined {
  if (venueKind === 'inside') return 'inside_school'
  if (venueKind === 'outside') return 'outside_school'
  return undefined
}

function resolveDetailedProgramName(
  detailedProgramId: string | undefined,
  catalog: readonly { id: string; name: string }[] = []
): string | undefined {
  if (!detailedProgramId || detailedProgramId === TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE) {
    return undefined
  }
  return catalog.find(row => row.id === detailedProgramId)?.name
}

export function generalCommonInfoEditValuesToProgramPatch(
  values: GeneralProgramCommonInfoEditFormValues,
  existing: Program,
  context: GeneralProgramSponsorEditContext = EMPTY_SPONSOR_CONTEXT,
  detailedProgramCatalog: readonly { id: string; name: string }[] = [],
  paymentItemOptions?: readonly { value: string; label: string }[]
): Partial<Program> {
  const sponsorRows = values.sponsorManagementIds
    .map(id => context.sponsors.find(row => row.id === id))
    .filter((row): row is SponsorManagementRow => row != null)
  const { manager } = resolveManagerFromFormValues(values, context)
  const participantTypes = participantTypesFromFlags(values)
  const primaryCategory =
    participantTypes.includes('individual') && !participantTypes.includes('school_institution')
      ? 'individual'
      : 'school'

  const isScheduleType = values.educationStructure === 'schedule'
  const relabeledScheduleDetails = isScheduleType
    ? relabelScheduleDetailFormRows(values.scheduleDetails)
    : undefined
  const detailedProgramName = isScheduleType
    ? resolveScheduleTypeDetailedProgramNameFromDetails(relabeledScheduleDetails)
    : resolveDetailedProgramName(values.detailedProgramId, detailedProgramCatalog)
  const existingCommon = resolveGeneralProgramCommonInfo(existing)

  const managerLine = manager
    ? formatSponsorManagerDisplayLine({
        contactName: manager.name,
        position: manager.position,
        phone: manager.phone,
      })
    : existingCommon.sponsorManagerLine

  const ipsCategory = values.ipsCategory as ProgramRegistrationIpsCategory | ''
  const ipsCapitalized =
    ipsCategory === 'inspire'
      ? ('Inspire' as const)
      : ipsCategory === 'prepare'
        ? ('Prepare' as const)
        : ipsCategory === 'succeed'
          ? ('Succeed' as const)
          : existing.ips

  const programCategory =
    ipsCategory === 'succeed'
      ? (PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS.find(o => o.value === values.ipsDetail)
          ?.label ?? existing.programCategory)
      : existing.programCategory

  const programChannel =
    ipsCategory === 'inspire'
      ? (PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS.find(
          o => o.value === values.ipsDetail
        )?.label ?? existing.programChannel)
      : existing.programChannel

  const educationForm = values.educationForm ?? 'online'
  const programType =
    educationForm === 'online'
      ? ('online' as const)
      : educationForm === 'offline'
        ? ('offline' as const)
        : educationForm === 'hybrid'
          ? ('hybrid' as const)
          : existing.type

  const audienceKind =
    values.participantOrganization && !values.participantIndividual
      ? ('organization' as const)
      : values.participantIndividual && !values.participantOrganization
        ? ('individual' as const)
        : (existing.generalProgramAudience ?? 'organization')

  const isIndividualTarget = isGeneralIndividualParticipantSelection(
    values.participantIndividual,
    values.participantOrganization
  )
  const kpiFinalSchools = isIndividualTarget
    ? 0
    : (values.kpiFinalSchools ?? existingCommon.kpi?.finalSchools ?? 0)
  const kpiFinalClasses = isIndividualTarget
    ? 0
    : (values.kpiFinalClasses ?? existingCommon.kpi?.finalClasses ?? 0)

  const wageGradeRows = WAGE_GRADE_LABELS.map((grade, index) => {
    const amountKey = ['wageGrade1Amount', 'wageGrade2Amount', 'wageGrade3Amount'] as const
    return {
      grade,
      pricing: buildWageGradePricing(values[amountKey[index]]),
    }
  })

  return {
    mainTitle: values.mainTitle.trim(),
    titleEn: values.titleEn?.trim() || undefined,
    startDate: values.startDate,
    endDate: values.endDate,
    businessArea: businessAreaToProgramValue(values.businessArea),
    category: primaryCategory,
    generalParticipantTypes: participantTypes,
    generalSurveyMenuKeys: surveyKeysFromFlags(values),
    institutionType: institutionTypeFromVenueKind(values.venueKind),
    venue: values.venueKind === 'other' ? values.venueDetail?.trim() || undefined : undefined,
    detailedProgramId: isScheduleType
      ? undefined
      : values.detailedProgramId === TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE
        ? undefined
        : values.detailedProgramId.trim() || undefined,
    educationProcess: educationProcessToProgramValue(values.educationProcess),
    ipOwned: ipOwnedToProgramValue(values.ipOwned),
    courseDeliveredBy: courseDeliveredToProgramValue(values.courseDeliveredBy),
    partnerInvolvement: values.partnerInvolvement === 'yes',
    type: programType,
    ips: ipsCapitalized,
    programCategory,
    programChannel,
    approvedStudentCount: values.kpiFinalParticipants ?? existing.approvedStudentCount,
    totalParticipants: values.kpiFinalParticipants ?? existing.totalParticipants,
    instructors: values.kpiInstructorCount ?? existing.instructors,
    instructorCapacity: values.kpiInstructorCount ?? existing.instructorCapacity,
    generalVolunteers: values.kpiVolunteerCount ?? existing.generalVolunteers,
    participatingSchoolCount: kpiFinalSchools,
    generalProgramAudience: audienceKind,
    generalProgramEducationStructure: values.educationStructure,
    generalProgramSessionRound: values.sessionRound,
    /** 후원사 관리 id = Program.sponsorId (목록/상세 API 탑레벨) */
    sponsorId: values.sponsorManagementIds[0] ?? existing.sponsorId,
    // 담당자 평문만 — GET 마스킹값(existing)으로 폴백하지 않음
    ...(manager?.name && !manager.name.includes('*') ? { managerName: manager.name } : {}),
    ...(manager?.phone && !manager.phone.includes('*') ? { contactPhone: manager.phone } : {}),
    generalCommonInfo: {
      ...existing.generalCommonInfo,
      announcementTitle: values.announcementTitle.trim(),
      detailedProgramName: detailedProgramName ?? existingCommon.detailedProgramName,
      sponsorDisplayName:
        sponsorRows.map(row => row.name).join(', ') || existingCommon.sponsorDisplayName,
      sponsorManagementId: values.sponsorManagementIds[0] ?? existingCommon.sponsorManagementId,
      sponsorManagementIds: values.sponsorManagementIds,
      sponsorManagerContactIds: normalizeSponsorManagerContactIds({
        ids: values.sponsorManagerContactIds,
        id: values.sponsorManagerContactId,
      }),
      sponsorManagerContactId: normalizeSponsorManagerContactIds({
        ids: values.sponsorManagerContactIds,
        id: values.sponsorManagerContactId,
      })[0],
      sponsorManagerLine: managerLine,
      venueDetail: values.venueDetail?.trim() || existingCommon.venueDetail,
      educationFormLabel:
        values.educationFormScheduleDetail === 'common'
          ? educationFormLabelFromValue(educationForm)
          : undefined,
      educationFormScheduleDetail: values.educationFormScheduleDetail ?? 'common',
      participationScheduleDetail: values.participationScheduleDetail ?? 'common',
      participationMethod:
        values.participationScheduleDetail === 'perSchedule'
          ? undefined
          : (values.participationMethod ?? existingCommon.participationMethod ?? 'individual'),
      ipsScheduleDetail: values.ipsScheduleDetail,
      ipsTypeSummary: buildIpsTypeSummary(
        values.ipsScheduleDetail,
        ipsCategory,
        values.ipsDetail
      ),
      curriculumSessions: values.curriculumSessions.map(s => {
        const isPreEducation = isPreEducationCurriculumSession(s)
        if (isPreEducation) {
          return {
            sessionLabel: '사전 교육',
            title: s.title.trim() || '사전 교육',
            description: '',
            scheduleDateLabel: s.scheduleDate?.trim() || undefined,
            assignmentEnabled: false,
            assignmentPeriod: undefined,
            educationFormLabel:
              values.educationFormScheduleDetail === 'perSchedule' && s.educationForm
                ? educationFormLabelFromValue(s.educationForm)
                : undefined,
            ipsTypeSummary:
              values.ipsScheduleDetail === 'perSchedule'
                ? buildSessionIpsTypeSummary('prepare', 'none')
                : undefined,
          }
        }
        return {
          sessionLabel: s.sessionLabel,
          title: s.title,
          description: s.description,
          assignmentEnabled:
            values.participantOrganization || values.sessionRound === 'single'
              ? false
              : (s.assignmentEnabled ?? false),
          assignmentPeriod:
            values.participantOrganization || values.sessionRound === 'single'
              ? undefined
              : s.assignmentPeriod,
          educationFormLabel:
            values.educationFormScheduleDetail === 'perSchedule' && s.educationForm
              ? educationFormLabelFromValue(s.educationForm)
              : undefined,
          participationMethodLabel:
            values.participationScheduleDetail === 'perSchedule' && s.participationMethod
              ? participationMethodLabelFromValue(s.participationMethod)
              : undefined,
          ipsTypeSummary:
            values.ipsScheduleDetail === 'perSchedule' && s.ipsCategory
              ? buildSessionIpsTypeSummary(
                  s.ipsCategory as ProgramRegistrationIpsCategory,
                  s.ipsDetail
                )
              : values.ipsScheduleDetail === 'perSchedule'
                ? buildSessionIpsTypeSummary('prepare', 'none')
                : undefined,
        }
      }),
      scheduleCurriculumPreEducation: values.scheduleCurriculumPreEducation ?? false,
      scheduleDetails:
        values.educationStructure === 'schedule'
          ? (relabeledScheduleDetails ?? []).map(d => {
              const row = {
                scheduleLabel: d.scheduleLabel,
                name: d.name.trim(),
              }
              if (
                d.blockKind === 'preEducation' ||
                inferScheduleDetailBlockKind(d.scheduleLabel) === 'preEducation'
              ) {
                return {
                  ...row,
                  scheduleLabel: '사전 교육',
                  name: d.name.trim() || '사전 교육',
                  scheduleDateLabel: d.scheduleDate?.trim() || undefined,
                  assignmentEnabled: false,
                  assignmentPeriod: undefined,
                  educationFormLabel:
                    values.educationFormScheduleDetail === 'perSchedule' && d.educationForm
                      ? educationFormLabelFromValue(d.educationForm)
                      : undefined,
                  ipsTypeSummary:
                    values.ipsScheduleDetail === 'perSchedule'
                      ? buildSessionIpsTypeSummary('prepare', 'none')
                      : undefined,
                }
              }
              if (d.blockKind === 'event' || inferScheduleDetailBlockKind(d.scheduleLabel) === 'event') {
                return {
                  ...row,
                  scheduleDateLabel: d.scheduleDate?.trim() || undefined,
                  assignmentEnabled:
                    values.participantOrganization || values.sessionRound === 'single'
                      ? false
                      : d.assignmentEnabled,
                  assignmentPeriod:
                    values.participantOrganization || values.sessionRound === 'single'
                      ? undefined
                      : d.assignmentPeriod?.trim() || undefined,
                  educationFormLabel:
                    values.educationFormScheduleDetail === 'perSchedule' && d.educationForm
                      ? educationFormLabelFromValue(d.educationForm)
                      : undefined,
                  participationMethodLabel:
                    values.participationScheduleDetail === 'perSchedule' && d.participationMethod
                      ? participationMethodLabelFromValue(d.participationMethod)
                      : undefined,
                  ipsTypeSummary:
                    values.ipsScheduleDetail === 'perSchedule' && d.ipsCategory
                      ? buildSessionIpsTypeSummary(
                          d.ipsCategory as ProgramRegistrationIpsCategory,
                          d.ipsDetail
                        )
                      : undefined,
                }
              }
              return {
                ...row,
                progressTimeSummary: buildScheduleProgressTimeSummary(d.groupTimes),
                educationFormLabel:
                  values.educationFormScheduleDetail === 'perSchedule' && d.educationForm
                    ? educationFormLabelFromValue(d.educationForm)
                    : undefined,
                participationMethodLabel:
                  values.participationScheduleDetail === 'perSchedule' && d.participationMethod
                    ? participationMethodLabelFromValue(d.participationMethod)
                    : undefined,
                ipsTypeSummary:
                  values.ipsScheduleDetail === 'perSchedule' && d.ipsCategory
                    ? buildSessionIpsTypeSummary(
                        d.ipsCategory as ProgramRegistrationIpsCategory,
                        d.ipsDetail
                      )
                    : undefined,
              }
            })
          : existingCommon.scheduleDetails,
      educationScheduleMode: shouldDisableEducationSchedulePeriodMode({
        participantOrganization: values.participantOrganization,
        sessionRound: values.sessionRound,
      })
        ? 'date'
        : values.educationScheduleMode,
      educationScheduleLines: [...values.educationScheduleLines],
      wageGradeRows,
      paymentItems: paymentItemLabelsFromIds(values.wagePaymentItemIds, paymentItemOptions),
      deductionItems: resolveProgramWageDeductionLabel(values.wagePaymentItemIds),
      kpi: {
        finalParticipants: values.kpiFinalParticipants ?? existingCommon.kpi?.finalParticipants ?? 0,
        instructorCount: values.kpiInstructorCount ?? existingCommon.kpi?.instructorCount ?? 0,
        volunteerCount: values.kpiVolunteerCount ?? existingCommon.kpi?.volunteerCount ?? 0,
        finalSchools: kpiFinalSchools,
        finalClasses: kpiFinalClasses,
      },
    },
  }
}

export function getGeneralDetailedProgramSelectOptions(
  catalog: readonly { id: string; name: string }[] = []
) {
  return withDetailedProgramNoneOption(
    catalog.map(row => ({ value: row.id, label: row.name }))
  )
}

export const GENERAL_SURVEY_EDIT_FIELDS: {
  id: ProgramRegistrationSurveyItemId
  formKey: keyof Pick<
    GeneralProgramCommonInfoEditFormValues,
    'surveySurvey' | 'surveySatisfaction' | 'surveyLectureEvaluation'
  >
}[] = [
  { id: 'survey', formKey: 'surveySurvey' },
  { id: 'satisfaction', formKey: 'surveySatisfaction' },
  { id: 'lecture_evaluation', formKey: 'surveyLectureEvaluation' },
]

export type GeneralSurveyEditFieldConfig = (typeof GENERAL_SURVEY_EDIT_FIELDS)[number] & {
  label: string
}

export function getGeneralSurveyEditFieldsForAudience(
  _isIndividualTarget: boolean
): GeneralSurveyEditFieldConfig[] {
  return GENERAL_SURVEY_EDIT_FIELDS.map(field => ({
    ...field,
    label: PROGRAM_REGISTRATION_SURVEY_ITEM_LABELS[field.id],
  }))
}
