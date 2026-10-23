/**
 * 프로그램 상세 정보 수정 폼 전용 스키마·도메인 변환
 * - 비즈니스 규칙: 필수/선택 필드, 검증(Zod), Program ↔ 폼 값 변환
 * - programToDetailEditValues: Program → 폼 기본값 (정보 수정 시 기존 값 채움)
 * - detailEditValuesToProgramPatch: 폼 값 → 저장용 패치 (optional 필드는 existing fallback)
 *
 * ─── React Hook Form / Zod 연동 (풀페이지 수정 모드) ─────────────────────────
 * - 폼 값 타입: `programDetailEditSchemaBase` → `ProgramDetailEditFormValues` (`z.infer`)
 * - 검증: 기본 `programDetailEditSchema`, 참여자 정보 탭만 `programDetailInstitutionsEditSchema` (`use-program-detail-edit-form` 의 `schema` 옵션)
 * - 저장 시 검증: `use-program-detail-info-save.ts` → `form.trigger()` 가 이 스키마 기준으로 동작
 *
 * ─── 브랜치 병합 시 주의 (연동 깨짐 방지) ───────────────────────────────────
 * 1) 새 `Controller`/`register` 필드를 추가하면 반드시:
 *    - 아래 `programDetailEditSchema` 에 동일 키 추가
 *    - `programToDetailEditValues` 에 Program(또는 mock)에서의 매핑 추가
 *    - API/도메인에 내려야 하면 `detailEditValuesToProgramPatch` 와 `Program` 타입에도 필드 추가
 * 2) 스키마 키 이름을 바꾸면 모든 `name="..."` / `setValue` / `watch` 호출부를 함께 수정
 * 3) 임금(`wage*`)·KPI(`kpi*`)는 `detailEditValuesToProgramPatch`에 반영된다.
 *    새 공통정보 필드를 추가하면 패치 함수와 `Program` 모델도 함께 갱신할 것.
 */

import { formatNumberDisplay } from '@/shared/lib/numeric-input'
import {
  formatDateOnly,
  formatDateRange,
  formatInstructorTargetsLabel,
  formatTargetLevelsLabel,
  formatVolunteerTargetsLabel,
  normalizeTargetLevelValue,
  resolveProgramInstructorTargets,
  resolveProgramTargetLevels,
  resolveProgramVolunteerTargets,
  resolveStoredBusinessArea,
} from '@/features/program/shared/lib/program-detail-info-constants'
import {
  programPaymentItemLabelsFromIds,
  resolveProgramPaymentItemIdsFromLabels,
  resolveProgramWageDeductionLabel,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import { parseCompanySchoolWageAmountFromPricing } from '@/features/program/shared/lib/company-school-wage-pricing'
import { formatAnnouncementLabel } from '@/features/program/shared/lib/announcement-label'
import { toOperationCalendarDate } from '@/features/program/general/lib/general-program-recruitment-operation-period'
import dayjs from 'dayjs'
import { z } from 'zod'
import { toUjatVolunteerNoticeExposurePayload } from '@/features/template/lib/ujat-volunteer-notice-exposure'
import { formatKoreanPhoneNumber, isValidKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'
import {
  announcementPublishedFromFormValue,
  announcementPublishedToFormValue,
} from '@/features/program/shared/lib/participant-recruitment-form-options'
import { resolveVenueKind } from '@/features/program/general/model/common-info-edit-schema'
import {
  isSponsorContactUnselected,
  resolveSponsorContactIdsForEdit,
} from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import { resolvePublicProgramTitle } from '@/features/program/shared/lib/public-program-title'
import {
  PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS,
  PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import { formatZodIssuesForUser } from '@/features/program/shared/lib/format-zod-validation-message'
import {
  normalizeGeneralSurveyMenuKeys,
  resolveProgramSurveyMenuKeys,
  syncSurveyItemsIntoRegistrationOverlay,
} from '@/features/program/general/lib/general-survey-menu-keys'
import { resolveUjatPersistedSurveyMenuKeysForSave } from '@/features/program/ujat/lib/registration-survey-items'
import {
  generalParticipantTypesFromUjatFlags,
  ujatParticipantFlagsFromOverlaySave,
} from '@/features/program/ujat/lib/participant-type-flags'
import { looksLikeTrainedTeacherProgramId } from '@/features/program/trained-teachers/lib/is-trained-teachers-primary-program'
import type { ProgramDetailRecruitmentAudience } from '@/features/program/shared/lib/apply-recruitment-additional-content-html'
import type { GeneralProgramSurveyMenuKey, TargetLevel } from '@/types/domain'

const roundStatusEnum = z.enum(['active', 'inactive', 'pending', 'completed', 'cancelled'])

const roundDeliveryTypeEnum = z.enum(['online', 'offline', 'hybrid'])

const programLifecycleStatusEnum = z.enum([
  'scheduled',
  'in_progress',
  'completed',
  'planned',
  'instructor_recruitment_planned',
  'volunteer_recruitment_planned',
  'participant_instructor_recruitment_planned',
  'recruiting_students',
  'recruiting_instructors',
  'recruiting_volunteers',
  'participant_instructor_recruiting',
  'education_in_progress',
  'matching_completed',
  'education_before_textbook',
  'education_after_textbook',
  'education_completed',
  'document_processing_completed',
  'participant_instructor_recruitment_completed',
])

/**
 * API/RHF 는 optional 숫자에 `null` 을 넣는 경우가 많다.
 * Zod `optional()` 은 undefined 만 허용해 "Expected number, received null" 로 저장을 막음 → null 은 undefined 로 취급.
 */
function nullToUndefined(value: unknown): unknown {
  return value === null ? undefined : value
}

const optionalNumber = z.preprocess(nullToUndefined, z.number().optional())
const optionalNonNegNumber = z.preprocess(nullToUndefined, z.number().min(0).optional())
/** BE ProgramUpdateRequest Integer 필드 — Jackson int32 초과 시 MALFORMED_REQUEST */
const JAVA_INT_MAX = 2_147_483_647
const optionalNonNegJavaInt = z.preprocess(
  nullToUndefined,
  z
    .number()
    .min(0)
    .max(JAVA_INT_MAX, `0 ~ ${formatNumberDisplay(JAVA_INT_MAX)} 범위로 입력해주세요`)
    .optional()
)

function isUjatDetailEditProgram(
  program: Pick<import('@/types/domain').Program, 'backendProgramType' | 'ujatRegistrationOverlay'>
): boolean {
  return (
    program.backendProgramType?.trim().toUpperCase() === 'UJAT' ||
    program.ujatRegistrationOverlay != null
  )
}

function clampJavaInt(value: number | null | undefined): number | undefined {
  if (value == null || !Number.isFinite(value)) return undefined
  const n = Math.trunc(value)
  if (n < 0) return undefined
  return Math.min(n, JAVA_INT_MAX)
}
const optionalNonNegNumberMessage = (message: string) =>
  z.preprocess(nullToUndefined, z.number().min(0, message).optional())

/** API/RHF optional boolean — null 은 undefined 로 (Expected boolean, received null 방지) */
const optionalBoolean = z.preprocess(nullToUndefined, z.boolean().optional())

const COURSE_DELIVERED_BY_VALUES = new Set(['JA', 'Jointly', 'Partner'] as const)
type CourseDeliveredByFormValue = 'JA' | 'Jointly' | 'Partner'

/** API 확장값(TEACHER 등)은 폼 enum 밖 → undefined 시드·검증 통과, patch 시 existing 유지 */
function normalizeCourseDeliveredByFormValue(
  raw: unknown
): CourseDeliveredByFormValue | undefined {
  if (raw == null || raw === '') return undefined
  const trimmed = String(raw).trim()
  if ((COURSE_DELIVERED_BY_VALUES as Set<string>).has(trimmed)) {
    return trimmed as CourseDeliveredByFormValue
  }
  const lower = trimmed.toLowerCase()
  if (lower === 'ja') return 'JA'
  if (lower === 'jointly' || lower === 'joint') return 'Jointly'
  if (lower === 'partner') return 'Partner'
  return undefined
}

const IPS_FORM_VALUES = new Set(['Inspire', 'Prepare', 'Succeed'] as const)
type IpsFormValue = 'Inspire' | 'Prepare' | 'Succeed'

function sharedFilledText(values: Array<string | null | undefined>): string | undefined {
  const filled = values.map(value => value?.trim()).filter((value): value is string => Boolean(value))
  if (filled.length === 0) return undefined
  return new Set(filled).size === 1 ? filled[0] : undefined
}

/** 조회에 보이는 IPS 문구. 루트가 비면 행 값이 모두 같을 때만 그 문구를 쓴다. */
export function resolveStoredIpsTypeSummary(input: {
  ipsTypeSummary?: string | null
  scheduleDetails?: Array<{ ipsTypeSummary?: string | null }> | null
  curriculumSessions?: Array<{ ipsTypeSummary?: string | null }> | null
}): string {
  const root = input.ipsTypeSummary?.trim()
  if (root) return root
  return (
    sharedFilledText([
      ...(input.scheduleDetails ?? []).map(row => row.ipsTypeSummary),
      ...(input.curriculumSessions ?? []).map(row => row.ipsTypeSummary),
    ]) ?? ''
  )
}

export function resolveStoredEducationFormLabel(input: {
  educationFormLabel?: string | null
  scheduleDetails?: Array<{ educationFormLabel?: string | null }> | null
  curriculumSessions?: Array<{ educationFormLabel?: string | null }> | null
}): string {
  const root = input.educationFormLabel?.trim()
  if (root) return root
  return (
    sharedFilledText([
      ...(input.scheduleDetails ?? []).map(row => row.educationFormLabel),
      ...(input.curriculumSessions ?? []).map(row => row.educationFormLabel),
    ]) ?? ''
  )
}

function educationFormValueFromLabel(
  label: string
): 'participant_selection' | 'hybrid' | 'offline' | 'online' | undefined {
  if (!label) return undefined
  if (label.includes('참여자')) return 'participant_selection'
  if (label.includes('온/오프') || label.includes('하이브리드')) return 'hybrid'
  if (label.includes('오프라인')) return 'offline'
  if (label.includes('온라인')) return 'online'
  return undefined
}

function ipsDetailValueFromSummary(
  category: 'inspire' | 'succeed' | 'prepare' | undefined,
  summary: string
): string | undefined {
  if (!category) return undefined
  if (category === 'prepare') return 'none'
  const options =
    category === 'inspire'
      ? PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS
      : PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS
  return options.find(option => option.value !== 'none' && summary.includes(option.label))?.value
}

function normalizeIpsFormValue(raw: unknown): IpsFormValue | undefined {
  if (raw == null || raw === '') return undefined
  const trimmed = String(raw).trim()
  if ((IPS_FORM_VALUES as Set<string>).has(trimmed)) return trimmed as IpsFormValue
  const lower = trimmed.toLowerCase()
  if (lower === 'inspire') return 'Inspire'
  if (lower === 'prepare') return 'Prepare'
  if (lower === 'succeed') return 'Succeed'
  return undefined
}

const courseDeliveredByFormSchema = z.preprocess(
  normalizeCourseDeliveredByFormValue,
  z.enum(['JA', 'Jointly', 'Partner']).optional()
)

const ipsFormSchema = z.preprocess(
  normalizeIpsFormValue,
  z.enum(['Inspire', 'Prepare', 'Succeed']).optional()
)

const roundEditSchema = z.object({
  id: z.string(),
  programId: z.string(),
  roundNumber: z.number(),
  startDate: z.string(),
  endDate: z.string(),
  capacity: optionalNonNegNumber,
  classCount: optionalNumber,
  status: roundStatusEnum,
  curriculum: z.string().optional(),
  deliveryType: roundDeliveryTypeEnum.optional(),
})

const targetLevelEnum = z.enum(['elementary', 'middle', 'high', 'university', 'adult'])

/** 폼·API 혼용값(한글 라벨 포함) → enum 배열. 알 수 없는 값은 제외 */
function coerceTargetLevels(value: unknown): TargetLevel[] | undefined {
  if (!Array.isArray(value)) return undefined
  const levels = value
    .map(normalizeTargetLevelValue)
    .filter((level): level is TargetLevel => level != null)
  return levels.length > 0 ? [...new Set(levels)] : undefined
}

const targetLevelsFormSchema = z.preprocess(
  coerceTargetLevels,
  z.array(targetLevelEnum).optional()
)

const programDetailEditSchemaBase = z.object({
  title: z.string().min(1, '프로그램명을 입력해주세요'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  /** 참여자 모집 — 프로그램 운영 기간 (사업 startDate/endDate 와 분리) */
  participantProgramOperationStartDate: z.string().optional(),
  participantProgramOperationEndDate: z.string().optional(),
  instructorProgramOperationStartDate: z.string().optional(),
  instructorProgramOperationEndDate: z.string().optional(),
  volunteerProgramOperationStartDate: z.string().optional(),
  volunteerProgramOperationEndDate: z.string().optional(),
  category: z.enum(['school', 'individual']),
  targetLevels: targetLevelsFormSchema,
  district: z.string().optional(),
  type: z.enum(['online', 'offline', 'hybrid']),
  lifecycleStatus: programLifecycleStatusEnum.optional(),
  /** 수강자·참여자 모집 기간(공통/참여자 정보 탭) */
  applicationStartDate: z.string().min(1, '참여자 모집 시작일을 선택해주세요'),
  applicationEndDate: z.string().min(1, '참여자 모집 종료일을 선택해주세요'),
  businessArea: z.string().optional(),
  sponsorId: z.string().min(1, '후원사를 선택해주세요'),
  sponsorManagementIds: z.array(z.string()).optional(),
  sponsorManagerContactIds: z.array(z.string()).optional(),
  /** @deprecated 레거시 단일 — seed 호환 */
  sponsorManagerContactId: z.string().optional(),
  managerName: z.string().min(1, '후원사 담당자를 입력해주세요'),
  contactPhone: z
    .string()
    .optional()
    .refine(
      value => !value?.trim() || isValidKoreanPhoneNumber(value),
      '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'
    ),
  contactEmail: z.string().optional(),
  venueKind: z.enum(['inside', 'outside', 'other']).optional(),
  /** 장소명 (top-level venue). TT는 venueDetail과 분리 왕복 */
  venue: z.string().optional(),
  venueDetail: z.string().optional(),
  oneLineIntroduction: z.string().optional(),
  /** 모집 비고 (BE remarks) — oneLineIntroduction 과 분리 */
  remarks: z.string().optional(),
  /** 강사 모집 비고 (강사 행 remarks) — 기타사항 otherNotes(otherMatters)와 분리 */
  instructorRecruitmentRemarks: z.string().optional(),
  /** 교육 대상 상세 (BE educationTargetDetail) — district 와 분리 */
  educationTargetDetail: z.string().optional(),
  /** 참여자 모집 문의처 기관명 (nested contactOrganizationName) */
  recruitmentContactOrganizationName: z.string().optional(),
  /** 강사 모집 문의처 */
  instructorRecruitmentContactOrganizationName: z.string().optional(),
  instructorContactPhone: z
    .string()
    .optional()
    .refine(
      value => !value?.trim() || isValidKoreanPhoneNumber(value),
      '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'
    ),
  instructorContactEmail: z.string().optional(),
  /** 봉사자 모집 문의처 */
  volunteerRecruitmentContactOrganizationName: z.string().optional(),
  volunteerContactPhone: z
    .string()
    .optional()
    .refine(
      value => !value?.trim() || isValidKoreanPhoneNumber(value),
      '올바른 전화번호 형식이 아닙니다 (예: 010-1234-5678)'
    ),
  volunteerContactEmail: z.string().optional(),
  keyVisualImage: z.string().optional(),
  posterImage: z.string().optional(),
  description: z.string().min(1, '프로그램 설명을 입력해주세요'),
  recruitmentGuide: z
    .string()
    .optional()
    .refine(v => v === undefined || (typeof v === 'string' && v.trim().length >= 1), '모집 안내를 입력해주세요'),
  learningSupportContent: z.string().min(1, '학습 지원 내용을 입력해주세요'),
  attachmentFileNames: z.array(z.string()).optional(),
  rounds: z.array(roundEditSchema),
  curriculumSession1Title: z.string().optional(),
  curriculumSession1Description: z.string().optional(),
  curriculumSession2Title: z.string().optional(),
  curriculumSession2Description: z.string().optional(),
  educationScheduleLines: z.array(z.string()).optional(),
  /** 교육받은 교사·공통정보 — 교육 진행 일정 유형 */
  educationScheduleMode: z.enum(['date', 'period']).optional(),
  // 수강자 모집
  /** 결과 발표일 및 방법(공통 정보 수강자 모집 / 참여자 정보 참여자 모집) */
  resultAnnouncementDate: z.string().min(1, '결과 발표일을 선택해주세요'),
  resultAnnouncementMethod: z
    .string()
    .trim()
    .min(1, '결과 발표 방법을 입력해주세요'),
  studentListRequired: z.enum(['required', 'not_required']).optional(),
  /** 참여자 모집 정보 — 사전 안내·수료증·기관 신청 상한(일반 프로그램) */
  participantRecruitmentAnnouncementPublished: z.enum(['published', 'unpublished']).optional(),
  participantRecruitmentPreEducationRequired: z.enum(['required', 'not_required']).optional(),
  participantRecruitmentCertificateProvided: z.enum(['provided', 'not_provided']).optional(),
  participantRecruitmentMaxInstructors: optionalNonNegNumber,
  participantRecruitmentMaxClassCount: optionalNonNegNumber,
  participantRecruitmentMaxScheduleCount: optionalNonNegNumber,
  participantRecruitmentMaxSessionsPerDay: optionalNonNegNumber,
  participantRecruitmentInterviewEnabled: z.enum(['yes', 'no']).optional(),
  /** 참여자 모집 비고 — 해당 없음 선택 시 공고 비노출 */
  participantRecruitmentNotesNotApplicable: z.enum(['applicable', 'not_applicable']).optional(),
  // 강사 모집
  instructorRecruitmentAnnouncementPublished: z.enum(['published', 'unpublished']).optional(),
  instructorCapacity: optionalNonNegNumber,
  instructorApplicationStartDate: z.string().optional(),
  instructorApplicationEndDate: z.string().optional(),
  documentPassAnnouncementDate: z.string().optional(),
  documentPassAnnouncementMethod: z.string().optional(),
  interviewStartDate: z.string().optional(),
  interviewEndDate: z.string().optional(),
  interviewMethod: z.string().optional(),
  finalPassAnnouncementDate: z.string().optional(),
  finalPassAnnouncementMethod: z.string().optional(),
  instructorTargets: z.array(z.string()).optional(),
  instructorTargetDetail: z.string().optional(),
  // 봉사자
  volunteerRecruitmentAnnouncementPublished: z.enum(['published', 'unpublished']).optional(),
  volunteerRecruitmentInterviewEnabled: z.enum(['yes', 'no']).optional(),
  volunteerApplicationStartDate: z.string().optional(),
  volunteerApplicationEndDate: z.string().optional(),
  volunteerTargets: z.array(z.string()).optional(),
  volunteerTargetDetail: z.string().optional(),
  /** UJAT 하반기 — 모집 공고 노출 시점 */
  volunteerRecruitmentNoticeExposure: z
    .enum(['start-day', 'one-day-before', 'one-week-before'])
    .optional(),
  /** UJAT 봉사자 모집 비고 — 해당 없음 선택 시 공고 비노출 */
  volunteerRecruitmentNotesNotApplicable: z.enum(['applicable', 'not_applicable']).optional(),
  applicationMethod: z
    .string()
    .optional()
    .refine(v => v === undefined || (typeof v === 'string' && v.trim().length >= 1), '지원 방법을 입력해주세요'),
  otherNotes: z
    .string()
    .optional()
    .refine(v => v === undefined || (typeof v === 'string' && v.trim().length >= 1), '기타사항을 입력해주세요'),
  additionalContentHtml: z.string().optional(),
  // 공통 정보
  mainTitle: z.string().optional(),
  /** 대표 프로그램명(영문) — 교육받은 교사 등 */
  titleEn: z.string().optional(),
  announcementTitle: z.string().optional(),
  detailedProgramName: z.string().optional(),
  /** 세부 프로그램 마스터 id — Select 저장용 */
  detailedProgramId: z.string().optional(),
  /** 교육받은 교사 프로그램 유형 설정 (opt-in) */
  educationStructure: z.enum(['curriculum', 'schedule']).optional(),
  sessionRound: z.enum(['single', 'multi']).optional(),
  educationForm: z.string().optional(),
  educationFormScheduleDetail: z.enum(['common', 'perSchedule']).optional(),
  ipsScheduleDetail: z.enum(['common', 'perSchedule']).optional(),
  ipsCategory: z.string().optional(),
  ipsDetail: z.string().optional(),
  teamDivision: z.string().optional(),
  educationProcess: z.string().optional(),
  ipOwned: z.string().optional(),
  courseDeliveredBy: courseDeliveredByFormSchema,
  partnerInvolvement: optionalBoolean,
  ips: ipsFormSchema,
  programCategory: z.string().optional(),
  programChannel: z.string().optional(),
  surveySurvey: optionalBoolean,
  surveySatisfaction: optionalBoolean,
  surveyLectureEvaluation: optionalBoolean,
  // 임금 정보
  wageType: z.string().optional(),
  wagePricingTimeUnit: z.string().optional(),
  /** 임금 책정 기준 — 단위 셀렉트(예: 시간) */
  wagePricingMeasureLabel: z.string().optional(),
  /** 임금 책정 기준 — 수치(예: 1) */
  wagePricingQuantity: optionalNonNegNumberMessage('0 이상을 입력해주세요'),
  /** 임금 책정 기준 — 기준(당) / 초과 / 이하 */
  wagePricingCompareMode: z.enum(['per', 'over', 'under']).optional(),
  wagePricingBase: z.string().optional(),
  wagePricingLongDistance: z.string().optional(),
  wageGrade1Amount: z.string().optional(),
  wageGrade2Amount: z.string().optional(),
  wageGrade3Amount: z.string().optional(),
  wageGrade1LongDistanceAmount: z.string().optional(),
  wageGrade2LongDistanceAmount: z.string().optional(),
  wageGrade3LongDistanceAmount: z.string().optional(),
  wagePaymentItems: z.string().optional(),
  wagePaymentItemIds: z.array(z.string()).optional(),
  wageDeductionItems: z.string().optional(),
  // KPI — BE Integer(int32); 초과 시 MALFORMED_REQUEST
  kpiFinalParticipants: optionalNonNegJavaInt,
  kpiInstructorCount: optionalNonNegJavaInt,
  kpiVolunteerCount: optionalNonNegJavaInt,
  kpiFinalSchools: optionalNonNegJavaInt,
  kpiFinalClasses: optionalNonNegJavaInt,
  /** 교육받은 교사 KPI — programs PATCH `educatedTeachers` */
  kpiEducatedTeachers: optionalNonNegJavaInt,
})

/** 기본: 공통·강사·봉사 탭 등 — 모집 안내는 값이 있으면 공백만 불가 */
export const programDetailEditSchema = programDetailEditSchemaBase

/**
 * 참여자 정보(institutions) 탭 — 모집 안내·추가 내용(HTML)은 저장 시 필수 검증 제외
 * (추가 내용은 폼 필드가 아니며 스키마상 이미 optional)
 */
export const programDetailInstitutionsEditSchema = programDetailEditSchemaBase.extend({
  recruitmentGuide: z.string().optional(),
})

/**
 * 교육받은 교사·1사1교 공통 정보 — 공통정보 탭에 없는 모집 필수값 완화.
 * 일반 스키마의 모집·설명·학습지원 필수값이 화면에 없어 저장이 조용히 실패하던 것을 방지.
 */
const programDetailOverviewCommonInfoEditSchema = programDetailEditSchemaBase
  .extend({
    applicationStartDate: z.string().optional(),
    applicationEndDate: z.string().optional(),
    description: z.string().optional(),
    learningSupportContent: z.string().optional(),
    resultAnnouncementDate: z.string().optional(),
    resultAnnouncementMethod: z.string().optional(),
    managerName: z.string().optional(),
    sponsorId: z.string().optional(),
    sponsorManagementIds: z.array(z.string()).optional(),
  })
  .superRefine((values, ctx) => {
    const hasSponsor =
      Boolean(values.sponsorId?.trim()) || (values.sponsorManagementIds?.length ?? 0) > 0
    if (!hasSponsor) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '후원사를 선택해주세요',
        path: ['sponsorManagementIds'],
      })
    }
  })

/** 1사1교 공통 정보 — overlay 등록 필수 검사가 별도로 있음 */
export const programDetailCompanySchoolCommonInfoEditSchema =
  programDetailOverviewCommonInfoEditSchema

/**
 * UJAT 공통 정보 — 화면에 없는 모집·설명·학습지원 필드로 저장이 막히지 않게 한다.
 * overlay 등록 필수 검사는 `hasIncompleteUjatProgramRegistrationRequiredFields`가 담당.
 */
export const programDetailUjatCommonInfoEditSchema = programDetailOverviewCommonInfoEditSchema

/**
 * 교육받은 교사 공통 정보 — 등록 위저드와 동일한 기본 정보 필수.
 */
export const programDetailTrainedTeachersCommonInfoEditSchema =
  programDetailOverviewCommonInfoEditSchema.superRefine((values, ctx) => {
    const requireTrimmed = (value: string | undefined, path: string, message: string) => {
      if (!value?.trim()) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: [path] })
      }
    }
    requireTrimmed(values.mainTitle, 'mainTitle', '대표 프로그램명(국문)을 입력해주세요')
    requireTrimmed(values.titleEn, 'titleEn', '대표 프로그램명(영문)을 입력해주세요')
    requireTrimmed(values.announcementTitle, 'announcementTitle', '공고용 프로그램명을 입력해주세요')
    if (values.educationStructure !== 'schedule') {
      requireTrimmed(values.detailedProgramId, 'detailedProgramId', '세부 프로그램명을 선택해주세요')
    }
    requireTrimmed(values.startDate, 'startDate', '사업 운영 기간을 선택해주세요')
    requireTrimmed(values.endDate, 'endDate', '사업 운영 기간을 선택해주세요')
    requireTrimmed(values.businessArea, 'businessArea', '사업 분야를 선택해주세요')
    requireTrimmed(values.educationProcess, 'educationProcess', '교육 과정을 선택해주세요')
    requireTrimmed(values.ipOwned, 'ipOwned', 'IP Owned를 선택해주세요')
    if (values.courseDeliveredBy == null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Course Delivered By를 선택해주세요',
        path: ['courseDeliveredBy'],
      })
    }
  })

export type ProgramDetailEditFormValues = z.infer<typeof programDetailEditSchema>

export function getProgramDetailEditValidationMessage(
  values: ProgramDetailEditFormValues,
  schema: z.ZodType<unknown> = programDetailEditSchema
): string {
  const result = schema.safeParse(values)
  if (result.success) return '입력값을 확인해 주세요.'
  return formatZodIssuesForUser(result.error.issues)
}

const COMPANY_SCHOOL_WAGE_GRADE_ROWS = [
  {
    grade: '1급 강사비',
    amountKey: 'wageGrade1Amount',
    longDistanceKey: 'wageGrade1LongDistanceAmount',
  },
  {
    grade: '2급 강사비',
    amountKey: 'wageGrade2Amount',
    longDistanceKey: 'wageGrade2LongDistanceAmount',
  },
  {
    grade: '3급 강사비',
    amountKey: 'wageGrade3Amount',
    longDistanceKey: 'wageGrade3LongDistanceAmount',
  },
] as const

function parseWageAmountFromPricing(pricing: string | undefined, kind: 'regular' | 'longDistance') {
  return parseCompanySchoolWageAmountFromPricing(pricing, kind)
}

function periodLabelFromRange(
  start: string | Date | undefined,
  end: string | Date | undefined
): string | undefined {
  const startText = typeof start === 'string' ? start.trim() : start
  const endText = typeof end === 'string' ? end.trim() : end
  if (!startText || !endText) return undefined
  const label = formatDateRange(startText, endText)
  return label === '-' ? undefined : label
}

/** GET 마스킹(`010-****-1234`)은 하이픈 포맷·검증을 깨뜨리므로 수정 폼에 넣지 않는다. */
function firstPlainKoreanPhoneForEdit(
  ...candidates: Array<string | null | undefined>
): string | undefined {
  for (const candidate of candidates) {
    const trimmed = candidate?.trim()
    if (!trimmed || trimmed.includes('*')) continue
    const formatted = formatKoreanPhoneNumber(trimmed)
    if (formatted) return formatted
  }
  return undefined
}

function sameAnnouncementPart(
  a: string | Date | undefined,
  b: string | Date | undefined
): boolean {
  const left = typeof a === 'string' ? a.trim() : a
  const right = typeof b === 'string' ? b.trim() : b
  if (!left && !right) return true
  if (!left || !right) return false
  if (left instanceof Date || right instanceof Date || /^\d{4}-\d{2}-\d{2}/.test(String(left))) {
    return formatDateOnly(left) === formatDateOnly(right)
  }
  return left === right
}

/**
 * 강사·봉사자 최종 합격자 발표는 상세 폼에서 공용 컬럼(`finalPassAnnouncement*`) 하나로 편집된다.
 * 값이 바뀌었을 때만 모집별 라벨·분리 필드를 갱신해, 다른 모집의 등록 시 값을 덮지 않는다.
 */
function finalPassAnnouncementPatch(
  values: ProgramDetailEditFormValues,
  existing: import('@/types/domain').Program,
  info: { finalPassAnnouncementDate?: string; finalPassAnnouncementMethod?: string } | undefined,
  options: {
    nestedFields: boolean
    recruitmentAudience?: ProgramDetailRecruitmentAudience
  }
): Record<string, string | undefined> {
  const audience = options.recruitmentAudience
  const formOwned =
    (audience === 'instructor' && !options.nestedFields) ||
    (audience === 'volunteer' && options.nestedFields)
  if (formOwned) {
    const date = values.finalPassAnnouncementDate
    const method = values.finalPassAnnouncementMethod
    const label = formatAnnouncementLabel(date, method)
    return {
      resultAnnouncementLabel: label,
      finalAnnouncementLabel: label,
      ...(options.nestedFields
        ? {
            finalPassAnnouncementDate:
              date == null ? undefined : dayjs(date).toISOString(),
            finalPassAnnouncementMethod: method?.trim() || undefined,
          }
        : {}),
    }
  }
  const changed =
    (values.finalPassAnnouncementDate !== undefined &&
      !sameAnnouncementPart(values.finalPassAnnouncementDate, existing.finalPassAnnouncementDate)) ||
    (values.finalPassAnnouncementMethod !== undefined &&
      !sameAnnouncementPart(values.finalPassAnnouncementMethod, existing.finalPassAnnouncementMethod))
  if (!changed) return {}
  const date = values.finalPassAnnouncementDate ?? existing.finalPassAnnouncementDate
  const method = values.finalPassAnnouncementMethod ?? existing.finalPassAnnouncementMethod
  const label = formatAnnouncementLabel(date, method)
  return {
    resultAnnouncementLabel: label,
    finalAnnouncementLabel: label,
    ...(options.nestedFields
      ? {
          finalPassAnnouncementDate:
            date == null ? info?.finalPassAnnouncementDate : dayjs(date).toISOString(),
          finalPassAnnouncementMethod: method?.trim() || undefined,
        }
      : {}),
  }
}

type VolunteerInterviewNestedInfo = {
  documentPassAnnouncementDate?: string
  documentPassAnnouncementMethod?: string
  interviewStartDate?: string
  interviewEndDate?: string
  interviewMethod?: string
}

/**
 * 봉사자 서류·면접 필드는 조회 SSOT가 nested `volunteerRecruitmentInfo`다.
 * 공용 컬럼만 갱신하면 표시가 옛 nested 값을 우선해 「수정 미반영」처럼 보인다.
 * 봉사자 탭 저장(`recruitmentAudience=volunteer`)에서만 호출한다.
 */
export function volunteerDocumentInterviewNestedPatch(
  values: ProgramDetailEditFormValues,
  _existingNested: VolunteerInterviewNestedInfo | undefined
): VolunteerInterviewNestedInfo {
  return {
    documentPassAnnouncementDate: values.documentPassAnnouncementDate
      ? dayjs(values.documentPassAnnouncementDate).toISOString()
      : undefined,
    documentPassAnnouncementMethod: values.documentPassAnnouncementMethod?.trim() || undefined,
    interviewStartDate: values.interviewStartDate
      ? dayjs(values.interviewStartDate).toISOString()
      : undefined,
    interviewEndDate: values.interviewEndDate
      ? dayjs(values.interviewEndDate).toISOString()
      : undefined,
    interviewMethod: values.interviewMethod?.trim() || undefined,
  }
}

function formatCompanySchoolWageAmount(amount: string | number | undefined): string {
  if (amount == null || amount === '') return ''
  const num = typeof amount === 'number' ? amount : Number(String(amount).replace(/,/g, ''))
  if (Number.isNaN(num)) return String(amount)
  return formatNumberDisplay(num)
}

function buildWageGradeRowsFromDetailValues(
  values: ProgramDetailEditFormValues,
  existing: import('@/types/domain').Program
) {
  const existingRows = existing.generalCommonInfo?.wageGradeRows ?? []
  const hasAny = COMPANY_SCHOOL_WAGE_GRADE_ROWS.some(row => {
    return values[row.amountKey] != null || values[row.longDistanceKey] != null
  })
  if (!hasAny) return existing.generalCommonInfo?.wageGradeRows

  return COMPANY_SCHOOL_WAGE_GRADE_ROWS.map(row => {
    const existingRow = existingRows.find(saved => saved.grade.startsWith(row.grade.slice(0, 2)))
    const amount =
      values[row.amountKey] ??
      parseWageAmountFromPricing(existingRow?.pricing, 'regular') ??
      ''
    const longDistance =
      values[row.longDistanceKey] ??
      parseWageAmountFromPricing(existingRow?.pricing, 'longDistance') ??
      ''
    return {
      grade: row.grade,
      pricing: `1시간 당 | 기본 : ${formatCompanySchoolWageAmount(amount)}원 | 장거리 : ${formatCompanySchoolWageAmount(longDistance)}원`,
    }
  })
}

/** 폼 참여자 유형(select)은 school | individual 만 지원 */
function toDetailEditCategory(
  category: import('@/types/domain').ProgramCategory | undefined
): 'school' | 'individual' {
  return category === 'individual' ? 'individual' : 'school'
}

/** Program → 폼 기본값 (날짜는 ISO 문자열) */
export function programToDetailEditValues(
  program: import('@/types/domain').Program
): ProgramDetailEditFormValues {
  type DateValue = string | Date
  const toStr = (d: DateValue | undefined): string =>
    d == null ? '' : typeof d === 'string' ? d : ((d as Date).toISOString?.() ?? String(d))
  const sponsorManagementIds =
    program.generalCommonInfo?.sponsorManagementIds?.length
      ? program.generalCommonInfo.sponsorManagementIds
      : program.generalCommonInfo?.sponsorManagementId
        ? [program.generalCommonInfo.sponsorManagementId]
        : program.sponsorId
          ? [program.sponsorId]
          : []
  const isTrainedTeacherForm =
    program.backendProgramType === 'TRAINED_TEACHER' ||
    looksLikeTrainedTeacherProgramId(program.id)
  const sponsorManagerLine =
    program.generalCommonInfo?.sponsorManagerLine?.trim() ||
    program.managerName?.trim() ||
    ''
  const sponsorManagerContactIds = resolveSponsorContactIdsForEdit({
    ids: program.generalCommonInfo?.sponsorManagerContactIds,
    id: program.generalCommonInfo?.sponsorManagerContactId,
    managerLine: sponsorManagerLine,
    hasSelectedSponsors: sponsorManagementIds.length > 0,
  })
  return {
    title: program.title ?? '',
    startDate: toStr(program.startDate),
    endDate: toStr(program.endDate),
    category: toDetailEditCategory(program.category),
    targetLevels: resolveProgramTargetLevels(program),
    district: program.district ?? undefined,
    type: program.type ?? 'offline',
    lifecycleStatus: program.lifecycleStatus ?? undefined,
    applicationStartDate: toStr(program.applicationStartDate),
    applicationEndDate: toStr(program.applicationEndDate),
    businessArea: resolveStoredBusinessArea(program.businessArea) || undefined,
    sponsorId: program.sponsorId ?? '',
    sponsorManagementIds,
    sponsorManagerContactIds,
    sponsorManagerContactId: sponsorManagerContactIds[0],
    managerName: program.managerName ?? '',
    contactPhone: (() => {
      const recruitmentInfo = program.generalCommonInfo?.participantRecruitmentInfo as
        | { inquiryTel?: string; tel?: string; contactPhone?: string }
        | undefined
      // 모집 문의처 SSOT (조회 display와 동일 우선순위). GET 마스킹(*)·후원사 미선택과 섞지 않음.
      const fromRecruitment = firstPlainKoreanPhoneForEdit(
        recruitmentInfo?.inquiryTel,
        recruitmentInfo?.tel,
        recruitmentInfo?.contactPhone
      )
      if (fromRecruitment) return fromRecruitment

      const fromProgram = firstPlainKoreanPhoneForEdit(program.contactPhone)
      const sponsorUnselected = sponsorManagerContactIds.some(isSponsorContactUnselected)
      if (sponsorUnselected) {
        // TT: top-level contactPhone 이 모집 Tel 폴백 (participant-recruitment-display)
        if (
          fromProgram &&
          program.id != null &&
          looksLikeTrainedTeacherProgramId(String(program.id))
        ) {
          return fromProgram
        }
        return undefined
      }
      return fromProgram
    })(),
    contactEmail:
      program.contactEmail?.trim() ||
      program.generalCommonInfo?.participantRecruitmentInfo?.inquiryEmail?.trim() ||
      program.generalCommonInfo?.participantRecruitmentInfo?.contactEmail?.trim() ||
      undefined,
    recruitmentContactOrganizationName:
      program.generalCommonInfo?.participantRecruitmentInfo?.contactOrganizationName?.trim() ||
      undefined,
    instructorRecruitmentContactOrganizationName:
      program.generalCommonInfo?.instructorRecruitmentInfo?.contactOrganizationName?.trim() ||
      undefined,
    instructorContactPhone: (() => {
      const info = program.generalCommonInfo?.instructorRecruitmentInfo
      const raw =
        info?.inquiryTel?.trim() || info?.tel?.trim() || info?.contactPhone?.trim()
      return raw ? formatKoreanPhoneNumber(raw) : undefined
    })(),
    instructorContactEmail: (() => {
      const info = program.generalCommonInfo?.instructorRecruitmentInfo
      return (
        info?.inquiryEmail?.trim() ||
        info?.email?.trim() ||
        info?.contactEmail?.trim() ||
        undefined
      )
    })(),
    volunteerRecruitmentContactOrganizationName:
      program.generalCommonInfo?.volunteerRecruitmentInfo?.contactOrganizationName?.trim() ||
      undefined,
    volunteerContactPhone: (() => {
      const info = program.generalCommonInfo?.volunteerRecruitmentInfo
      const raw =
        info?.inquiryTel?.trim() || info?.tel?.trim() || info?.contactPhone?.trim()
      return raw ? formatKoreanPhoneNumber(raw) : undefined
    })(),
    volunteerContactEmail: (() => {
      const info = program.generalCommonInfo?.volunteerRecruitmentInfo
      return (
        info?.inquiryEmail?.trim() ||
        info?.email?.trim() ||
        info?.contactEmail?.trim() ||
        undefined
      )
    })(),
    venueKind: isTrainedTeacherForm
      ? program.generalCommonInfo?.venueKind === 'inside' ||
        program.generalCommonInfo?.venueKind === 'outside' ||
        program.generalCommonInfo?.venueKind === 'other'
        ? program.generalCommonInfo.venueKind
        : undefined
      : resolveVenueKind(program),
    venue: program.venue?.trim() || undefined,
    venueDetail: (() => {
      const nested = program.generalCommonInfo?.venueDetail?.trim()
      if (nested) return nested
      // TT: venue≠venueDetail 분리 — 레거시(venue만 있는) 경우만 detail에 채움
      const isTt =
        program.backendProgramType === 'TRAINED_TEACHER' ||
        looksLikeTrainedTeacherProgramId(program.id)
      if (isTt) return undefined
      return program.venue?.trim() || undefined
    })(),
    oneLineIntroduction: program.oneLineIntroduction ?? undefined,
    remarks:
      program.remarks?.trim() ||
      program.generalCommonInfo?.participantRecruitmentInfo?.remarks?.trim() ||
      undefined,
    educationTargetDetail:
      program.educationTargetDetail?.trim() ||
      program.generalCommonInfo?.participantRecruitmentInfo?.educationTargetDetail?.trim() ||
      undefined,
    keyVisualImage: program.keyVisualImage ?? undefined,
    posterImage: program.posterImage ?? undefined,
    description: program.description ?? '',
    recruitmentGuide: program.recruitmentGuide?.trim() ? program.recruitmentGuide : undefined,
    learningSupportContent: program.learningSupportContent ?? '',
    attachmentFileNames: program.attachmentFileNames ?? [],
    resultAnnouncementDate: program.resultAnnouncementDate
      ? toStr(program.resultAnnouncementDate)
      : '',
    resultAnnouncementMethod: program.resultAnnouncementMethod ?? '',
    studentListRequired: program.studentListRequired ?? 'required',
    participantRecruitmentAnnouncementPublished: announcementPublishedToFormValue(
      program.generalCommonInfo?.participantRecruitmentInfo?.announcementPublished
    ),
    participantRecruitmentPreEducationRequired: (() => {
      const v = program.generalCommonInfo?.participantRecruitmentInfo?.preEducationNoticeRequired
      if (v === true) return 'required' as const
      if (v === false) return 'not_required' as const
      return undefined
    })(),
    participantRecruitmentCertificateProvided: (() => {
      const v = program.generalCommonInfo?.participantRecruitmentInfo?.certificateIssuanceProvided
      if (v === true) return 'provided' as const
      if (v === false) return 'not_provided' as const
      return undefined
    })(),
    participantRecruitmentMaxInstructors:
      program.generalCommonInfo?.participantRecruitmentInfo?.maxAssignableInstructors,
    participantRecruitmentMaxClassCount:
      program.generalCommonInfo?.participantRecruitmentInfo?.maxClassCount ??
      program.rounds?.[0]?.classCount,
    participantRecruitmentMaxScheduleCount:
      program.generalCommonInfo?.participantRecruitmentInfo?.maxScheduleCount,
    participantRecruitmentMaxSessionsPerDay:
      program.generalCommonInfo?.participantRecruitmentInfo?.maxSessionsPerDay,
    participantRecruitmentInterviewEnabled: (() => {
      const v = program.generalParticipantInterviewEnabled
      if (v === true) return 'yes' as const
      if (v === false) return 'no' as const
      const nested = program.generalCommonInfo?.participantRecruitmentInfo?.interviewEnabled
      if (nested === true) return 'yes' as const
      if (nested === false) return 'no' as const
      return undefined
    })(),
    participantRecruitmentNotesNotApplicable:
      program.generalCommonInfo?.participantRecruitmentInfo?.notesNotApplicable === true
        ? 'not_applicable'
        : 'applicable',
    instructorRecruitmentAnnouncementPublished: announcementPublishedToFormValue(
      program.generalCommonInfo?.instructorRecruitmentInfo?.announcementPublished
    ),
    instructorCapacity: program.instructorCapacity ?? undefined,
    instructorApplicationStartDate: program.instructorApplicationStartDate
      ? toStr(program.instructorApplicationStartDate)
      : undefined,
    instructorApplicationEndDate: program.instructorApplicationEndDate
      ? toStr(program.instructorApplicationEndDate)
      : undefined,
    documentPassAnnouncementDate: program.documentPassAnnouncementDate
      ? toStr(program.documentPassAnnouncementDate)
      : undefined,
    documentPassAnnouncementMethod: program.documentPassAnnouncementMethod ?? undefined,
    interviewStartDate: program.interviewStartDate ? toStr(program.interviewStartDate) : undefined,
    interviewEndDate: program.interviewEndDate ? toStr(program.interviewEndDate) : undefined,
    interviewMethod: program.interviewMethod ?? undefined,
    finalPassAnnouncementDate: program.finalPassAnnouncementDate
      ? toStr(program.finalPassAnnouncementDate)
      : undefined,
    finalPassAnnouncementMethod: program.finalPassAnnouncementMethod ?? undefined,
    instructorTargets: resolveProgramInstructorTargets(program),
    instructorTargetDetail: program.instructorTargetDetail ?? undefined,
    volunteerRecruitmentAnnouncementPublished: announcementPublishedToFormValue(
      program.generalCommonInfo?.volunteerRecruitmentInfo?.announcementPublished
    ),
    volunteerRecruitmentInterviewEnabled: (() => {
      const v = program.generalVolunteerInterviewEnabled
      if (v === true) return 'yes' as const
      if (v === false) return 'no' as const
      return undefined
    })(),
    volunteerApplicationStartDate: program.volunteerApplicationStartDate
      ? toStr(program.volunteerApplicationStartDate)
      : undefined,
    volunteerApplicationEndDate: program.volunteerApplicationEndDate
      ? toStr(program.volunteerApplicationEndDate)
      : undefined,
    volunteerTargets: resolveProgramVolunteerTargets(program),
    volunteerTargetDetail: program.volunteerTargetDetail ?? undefined,
    volunteerRecruitmentNoticeExposure: (() => {
      const raw = program.generalCommonInfo?.volunteerRecruitmentInfo?.noticeExposureTiming
      if (raw === 'start-day' || raw === 'one-day-before' || raw === 'one-week-before') return raw
      return undefined
    })(),
    volunteerRecruitmentNotesNotApplicable:
      program.generalCommonInfo?.volunteerRecruitmentInfo?.notesNotApplicable === true
        ? 'not_applicable'
        : 'applicable',
    applicationMethod: program.applicationMethod?.trim() ? program.applicationMethod : undefined,
    otherNotes: program.otherNotes?.trim() ? program.otherNotes : undefined,
    additionalContentHtml: program.additionalContentHtml ?? undefined,
    rounds: (program.rounds ?? []).map(r => ({
      id: r.id,
      programId: r.programId,
      roundNumber: r.roundNumber,
      startDate: toStr(r.startDate),
      endDate: toStr(r.endDate),
      capacity: r.capacity,
      classCount: r.classCount,
      status: r.status,
      curriculum: r.curriculum ?? undefined,
      deliveryType: r.deliveryType ?? 'offline',
    })),
    curriculumSession1Title: program.generalCommonInfo?.curriculumSessions?.[0]?.title,
    curriculumSession1Description: program.generalCommonInfo?.curriculumSessions?.[0]?.description,
    curriculumSession2Title: program.generalCommonInfo?.curriculumSessions?.[1]?.title,
    curriculumSession2Description: program.generalCommonInfo?.curriculumSessions?.[1]?.description,
    educationScheduleLines: program.generalCommonInfo?.educationScheduleLines,
    educationScheduleMode: program.generalCommonInfo?.educationScheduleMode ?? 'date',
    mainTitle: program.mainTitle ?? undefined,
    titleEn: program.titleEn ?? undefined,
    announcementTitle: isTrainedTeacherForm
      ? program.title?.trim() || undefined
      : resolvePublicProgramTitle({
          announcementTitle: program.generalCommonInfo?.announcementTitle,
          overlay: program.ujatRegistrationOverlay ?? program.registrationOverlay,
          mainTitle: program.mainTitle,
          title: program.title,
        }) || undefined,
    detailedProgramName: program.generalCommonInfo?.detailedProgramName?.trim() || undefined,
    detailedProgramId: program.detailedProgramId ?? undefined,
    educationStructure: (() => {
      const raw = program.generalProgramEducationStructure
      if (raw === 'curriculum' || raw === 'schedule') return raw
      return undefined
    })(),
    sessionRound: (() => {
      const raw = program.generalProgramSessionRound
      if (raw === 'single' || raw === 'multi') return raw
      return undefined
    })(),
    educationForm: educationFormValueFromLabel(
      resolveStoredEducationFormLabel({
        educationFormLabel: program.generalCommonInfo?.educationFormLabel,
        scheduleDetails: program.generalCommonInfo?.scheduleDetails,
        curriculumSessions: program.generalCommonInfo?.curriculumSessions,
      })
    ),
    educationFormScheduleDetail:
      program.generalCommonInfo?.educationFormScheduleDetail ?? 'common',
    ipsScheduleDetail: program.generalCommonInfo?.ipsScheduleDetail ?? (() => {
      const summary = resolveStoredIpsTypeSummary({
        ipsTypeSummary: program.generalCommonInfo?.ipsTypeSummary,
        scheduleDetails: program.generalCommonInfo?.scheduleDetails,
        curriculumSessions: program.generalCommonInfo?.curriculumSessions,
      })
      return summary.includes('별') ? 'perSchedule' : 'common'
    })(),
    ipsCategory: (() => {
      const summary = resolveStoredIpsTypeSummary({
        ipsTypeSummary: program.generalCommonInfo?.ipsTypeSummary,
        scheduleDetails: program.generalCommonInfo?.scheduleDetails,
        curriculumSessions: program.generalCommonInfo?.curriculumSessions,
      })
      if (/inspire/i.test(summary) || program.ips === 'Inspire') return 'inspire'
      if (/succeed/i.test(summary) || program.ips === 'Succeed') return 'succeed'
      if (/prepare/i.test(summary) || program.ips === 'Prepare') return 'prepare'
      return undefined
    })(),
    ipsDetail: (() => {
      const summary = resolveStoredIpsTypeSummary({
        ipsTypeSummary: program.generalCommonInfo?.ipsTypeSummary,
        scheduleDetails: program.generalCommonInfo?.scheduleDetails,
        curriculumSessions: program.generalCommonInfo?.curriculumSessions,
      })
      if (/inspire/i.test(summary) || program.ips === 'Inspire') {
        return ipsDetailValueFromSummary('inspire', summary)
      }
      if (/succeed/i.test(summary) || program.ips === 'Succeed') {
        return ipsDetailValueFromSummary('succeed', summary)
      }
      if (/prepare/i.test(summary) || program.ips === 'Prepare') return 'none'
      return undefined
    })(),
    teamDivision: program.teamDivision ?? undefined,
    educationProcess: program.educationProcess ?? undefined,
    ipOwned: program.ipOwned ?? undefined,
    courseDeliveredBy: normalizeCourseDeliveredByFormValue(program.courseDeliveredBy),
    partnerInvolvement: isTrainedTeacherForm
      ? program.partnerInvolvement
      : program.partnerInvolvement ?? false,
    ips: normalizeIpsFormValue(program.ips),
    programCategory: program.programCategory ?? undefined,
    programChannel: program.programChannel ?? undefined,
    ...(() => {
      const isTrainedTeacherSeed =
        program.backendProgramType === 'TRAINED_TEACHER' ||
        looksLikeTrainedTeacherProgramId(program.id)
      const keys = isTrainedTeacherSeed
        ? program.generalSurveyMenuKeys === undefined
          ? []
          : normalizeGeneralSurveyMenuKeys(program.generalSurveyMenuKeys)
        : resolveProgramSurveyMenuKeys(program)
      return {
        surveySurvey: keys.includes('survey'),
        surveySatisfaction: keys.includes('satisfaction'),
        surveyLectureEvaluation: keys.includes('lecture_evaluation'),
      }
    })(),
    wageType: undefined,
    wagePricingTimeUnit: undefined,
    wagePricingMeasureLabel: undefined,
    wagePricingQuantity: undefined,
    wagePricingCompareMode: undefined,
    wagePricingBase: undefined,
    wagePricingLongDistance: undefined,
    wagePaymentItems: undefined,
    wagePaymentItemIds:
      resolveProgramPaymentItemIdsFromLabels(program.generalCommonInfo?.paymentItems) ||
      undefined,
    wageGrade1Amount: parseWageAmountFromPricing(
      program.generalCommonInfo?.wageGradeRows?.[0]?.pricing,
      'regular'
    ),
    wageGrade2Amount: parseWageAmountFromPricing(
      program.generalCommonInfo?.wageGradeRows?.[1]?.pricing,
      'regular'
    ),
    wageGrade3Amount: parseWageAmountFromPricing(
      program.generalCommonInfo?.wageGradeRows?.[2]?.pricing,
      'regular'
    ),
    wageGrade1LongDistanceAmount: parseWageAmountFromPricing(
      program.generalCommonInfo?.wageGradeRows?.[0]?.pricing,
      'longDistance'
    ),
    wageGrade2LongDistanceAmount: parseWageAmountFromPricing(
      program.generalCommonInfo?.wageGradeRows?.[1]?.pricing,
      'longDistance'
    ),
    wageGrade3LongDistanceAmount: parseWageAmountFromPricing(
      program.generalCommonInfo?.wageGradeRows?.[2]?.pricing,
      'longDistance'
    ),
    wageDeductionItems: undefined,
    kpiFinalParticipants:
      clampJavaInt(program.generalCommonInfo?.kpi?.finalParticipants) ??
      clampJavaInt(program.totalParticipants) ??
      clampJavaInt(program.approvedStudentCount) ??
      undefined,
    kpiInstructorCount:
      clampJavaInt(program.generalCommonInfo?.kpi?.instructorCount) ??
      clampJavaInt(program.instructors) ??
      undefined,
    kpiVolunteerCount:
      clampJavaInt(program.generalCommonInfo?.kpi?.volunteerCount) ??
      clampJavaInt(program.generalVolunteers) ??
      undefined,
    kpiFinalSchools:
      clampJavaInt(program.generalCommonInfo?.kpi?.finalSchools) ??
      clampJavaInt(program.participatingSchoolCount) ??
      undefined,
    kpiFinalClasses: clampJavaInt(program.generalCommonInfo?.kpi?.finalClasses) ?? undefined,
    kpiEducatedTeachers: clampJavaInt(program.educatedTeachers) ?? undefined,
  }
}

export type ProgramDetailEditPatchOptions = {
  /** 모집 탭 저장 — 해당 audience 프로그램 운영 기간만 갱신, 루트 사업 날짜는 유지 */
  recruitmentAudience?: ProgramDetailRecruitmentAudience
}

/** 모집 탭 저장 시 해당 audience 필드는 빈 값(undefined)도 폼 의도대로 반영한다. */
function recruitAudienceScalar<T>(
  value: T | undefined,
  existingValue: T | undefined,
  activeAudience: ProgramDetailRecruitmentAudience | undefined,
  fieldAudience: ProgramDetailRecruitmentAudience
): T | undefined {
  if (activeAudience === fieldAudience) return value
  return value ?? existingValue
}

function resolveRecruitmentOperationPeriodLabels(
  values: ProgramDetailEditFormValues,
  existing: import('@/types/domain').Program,
  recruitmentAudience?: ProgramDetailRecruitmentAudience
): {
  participant: string | undefined
  instructor: string | undefined
  volunteer: string | undefined
} {
  const keepParticipant =
    existing.generalCommonInfo?.participantRecruitmentInfo?.operationPeriodLabel
  const keepInstructor =
    existing.generalCommonInfo?.instructorRecruitmentInfo?.operationPeriodLabel
  const keepVolunteer =
    existing.generalCommonInfo?.volunteerRecruitmentInfo?.operationPeriodLabel

  const labelFromForm = (start?: string, end?: string, fallback?: string) =>
    periodLabelFromRange(
      toOperationCalendarDate(start) ?? start,
      toOperationCalendarDate(end) ?? end
    ) ?? fallback

  if (recruitmentAudience === 'participant') {
    return {
      participant: labelFromForm(
        values.participantProgramOperationStartDate,
        values.participantProgramOperationEndDate,
        keepParticipant
      ),
      instructor: keepInstructor,
      volunteer: keepVolunteer,
    }
  }
  if (recruitmentAudience === 'instructor') {
    return {
      participant: keepParticipant,
      instructor: labelFromForm(
        values.instructorProgramOperationStartDate,
        values.instructorProgramOperationEndDate,
        keepInstructor
      ),
      volunteer: keepVolunteer,
    }
  }
  if (recruitmentAudience === 'volunteer') {
    return {
      participant: keepParticipant,
      instructor: keepInstructor,
      volunteer: labelFromForm(
        values.volunteerProgramOperationStartDate,
        values.volunteerProgramOperationEndDate,
        keepVolunteer
      ),
    }
  }
  return {
    participant: keepParticipant,
    instructor: keepInstructor,
    volunteer: keepVolunteer,
  }
}

/**
 * 폼 값 → Program 패치 (저장 시 병합용)
 * `useProgramDetailInfoSave` 의 `triggerSave` 에서만 호출 — RHF `getValues()` 결과를 받음.
 * 병합: 새 폼 필드를 저장하려면 여기와 `@/types/domain` Program 정의를 함께 갱신.
 */
export function detailEditValuesToProgramPatch(
  values: ProgramDetailEditFormValues,
  existing: import('@/types/domain').Program,
  options?: ProgramDetailEditPatchOptions
): Partial<import('@/types/domain').Program> {
  type ProgramRound = import('@/types/domain').ProgramRound
  const announcementPublished =
    announcementPublishedFromFormValue(values.participantRecruitmentAnnouncementPublished) ??
    existing.generalCommonInfo?.participantRecruitmentInfo?.announcementPublished
  const studentListRequired =
    values.studentListRequired ?? existing.studentListRequired
  const recruitmentAudience = options?.recruitmentAudience
  const startDate = recruitmentAudience
    ? existing.startDate
    : values.startDate ?? existing.startDate
  const endDate = recruitmentAudience
    ? existing.endDate
    : values.endDate ?? existing.endDate
  const operationPeriodLabels = resolveRecruitmentOperationPeriodLabels(
    values,
    existing,
    recruitmentAudience
  )
  const applicationStartDate = values.applicationStartDate
  const applicationEndDate = values.applicationEndDate
  const resultAnnouncementDate = recruitAudienceScalar(
    values.resultAnnouncementDate,
    existing.resultAnnouncementDate,
    recruitmentAudience,
    'participant'
  )
  const resultAnnouncementMethod = recruitAudienceScalar(
    values.resultAnnouncementMethod,
    existing.resultAnnouncementMethod,
    recruitmentAudience,
    'participant'
  )
  const targetLabel =
    values.targetLevels && values.targetLevels.length > 0
      ? formatTargetLevelsLabel(values.targetLevels)
      : undefined
  const recruitmentPeriodLabel =
    periodLabelFromRange(applicationStartDate, applicationEndDate) ??
    existing.generalCommonInfo?.participantRecruitmentInfo?.recruitmentPeriodLabel
  const operationPeriodLabel = operationPeriodLabels.participant
  const contactPhone = recruitAudienceScalar(
    values.contactPhone,
    existing.contactPhone,
    recruitmentAudience,
    'participant'
  )
  const contactEmail = recruitAudienceScalar(
    values.contactEmail,
    existing.contactEmail,
    recruitmentAudience,
    'participant'
  )
  const isTrainedTeacherProgram =
    existing.backendProgramType === 'TRAINED_TEACHER' ||
    looksLikeTrainedTeacherProgramId(existing.id)
  const contactOrganizationName =
    values.recruitmentContactOrganizationName?.trim() ||
    existing.generalCommonInfo?.participantRecruitmentInfo?.contactOrganizationName
  /** 문의처 표시명 — BE contactName (managerName/후원 담당자와 분리) */
  const inquiryContactName =
    values.recruitmentContactOrganizationName?.trim() ||
    existing.contactName?.trim() ||
    existing.generalCommonInfo?.participantRecruitmentInfo?.contactName?.trim() ||
    undefined
  const instructorContactOrganizationName =
    values.instructorRecruitmentContactOrganizationName?.trim() ||
    existing.generalCommonInfo?.instructorRecruitmentInfo?.contactOrganizationName
  const instructorContactPhone = recruitAudienceScalar(
    values.instructorContactPhone,
    existing.generalCommonInfo?.instructorRecruitmentInfo?.inquiryTel,
    recruitmentAudience,
    'instructor'
  )
  const instructorContactEmail = recruitAudienceScalar(
    values.instructorContactEmail,
    existing.generalCommonInfo?.instructorRecruitmentInfo?.inquiryEmail,
    recruitmentAudience,
    'instructor'
  )
  const volunteerContactOrganizationName =
    values.volunteerRecruitmentContactOrganizationName?.trim() ||
    existing.generalCommonInfo?.volunteerRecruitmentInfo?.contactOrganizationName
  const volunteerContactPhone = recruitAudienceScalar(
    values.volunteerContactPhone,
    existing.generalCommonInfo?.volunteerRecruitmentInfo?.inquiryTel,
    recruitmentAudience,
    'volunteer'
  )
  const surveyKeysTouched =
    values.surveySurvey != null ||
    values.surveySatisfaction != null ||
    values.surveyLectureEvaluation != null
  const isUjatProgram = isUjatDetailEditProgram(existing)
  const ujatSurveyMenuKeys = isUjatProgram
    ? resolveUjatPersistedSurveyMenuKeysForSave(
        existing.ujatRegistrationOverlay,
        existing.generalSurveyMenuKeys
      )
    : undefined
  // 체크된 항목만 keys에 실음. 전부 해제 시 [] — LNB가 keys를 SSOT로 따른다.
  // UJAT는 overlay 4종을 유지한다. 일반 3종 `satisfaction`으로 접지 않는다.
  const generalSurveyMenuKeys = isUjatProgram
    ? (ujatSurveyMenuKeys as GeneralProgramSurveyMenuKey[] | undefined) ??
      existing.generalSurveyMenuKeys
    : surveyKeysTouched
      ? ([
          ...(values.surveySurvey ? (['survey'] as const) : []),
          ...(values.surveySatisfaction ? (['satisfaction'] as const) : []),
          ...(values.surveyLectureEvaluation ? (['lecture_evaluation'] as const) : []),
        ] as GeneralProgramSurveyMenuKey[])
      : existing.generalSurveyMenuKeys
  const registrationOverlay =
    isTrainedTeacherProgram && surveyKeysTouched
      ? syncSurveyItemsIntoRegistrationOverlay(
          existing.registrationOverlay,
          generalSurveyMenuKeys
        )
      : undefined
  const ujatParticipantFlags = isUjatProgram
    ? ujatParticipantFlagsFromOverlaySave(existing.ujatRegistrationOverlay)
    : null
  const volunteerContactEmail = recruitAudienceScalar(
    values.volunteerContactEmail,
    existing.generalCommonInfo?.volunteerRecruitmentInfo?.inquiryEmail,
    recruitmentAudience,
    'volunteer'
  )

  return {
    title:
      (isTrainedTeacherProgram ? values.announcementTitle?.trim() : values.title?.trim()) ||
      existing.title,
    textbookName: existing.textbookName,
    startDate,
    endDate,
    category: values.category,
    targetLevels: values.targetLevels?.length ? values.targetLevels : undefined,
    targetLevel: values.targetLevels?.[0],
    district: values.district,
    type: values.type,
    lifecycleStatus: values.lifecycleStatus ?? existing.lifecycleStatus,
    applicationStartDate,
    applicationEndDate,
    businessArea: isTrainedTeacherProgram
      ? resolveStoredBusinessArea(values.businessArea) || undefined
      : resolveStoredBusinessArea(values.businessArea) ||
        resolveStoredBusinessArea(existing.businessArea) ||
        undefined,
    sponsorId:
      values.sponsorId ||
      values.sponsorManagementIds?.[0] ||
      existing.sponsorId,
    managerName: values.managerName,
    contactName: inquiryContactName,
    contactPhone,
    contactEmail,
    institutionType:
      values.venueKind === 'outside'
        ? 'outside_school'
        : values.venueKind === 'inside'
          ? 'inside_school'
          : values.venueKind === 'other'
            ? undefined
            : existing.institutionType,
    venue: isTrainedTeacherProgram
      ? values.venue?.trim() || undefined
      : values.venueDetail?.trim() || values.venue?.trim() || undefined,
    oneLineIntroduction: values.oneLineIntroduction,
    remarks:
      values.participantRecruitmentNotesNotApplicable === 'not_applicable'
        ? undefined
        : (values.remarks?.trim() || undefined),
    educationTargetDetail: values.educationTargetDetail?.trim() || undefined,
    recruitmentTargetDetail:
      values.educationTargetDetail?.trim() ||
      existing.recruitmentTargetDetail ||
      undefined,
    keyVisualImage: values.keyVisualImage,
    posterImage: values.posterImage,
    description: values.description,
    recruitmentGuide: values.recruitmentGuide,
    learningSupportContent: values.learningSupportContent,
    attachmentFileNames: values.attachmentFileNames,
    ...(recruitmentAudience ? {} : { rounds: values.rounds as ProgramRound[] }),
    resultAnnouncementDate,
    resultAnnouncementMethod,
    studentListRequired,
    totalParticipants: clampJavaInt(
      values.kpiFinalParticipants ?? existing.totalParticipants
    ),
    educatedTeachers: clampJavaInt(
      values.kpiEducatedTeachers ?? existing.educatedTeachers
    ),
    approvedStudentCount: clampJavaInt(
      values.kpiFinalParticipants ?? existing.approvedStudentCount
    ),
    generalVolunteers: clampJavaInt(
      values.kpiVolunteerCount ?? existing.generalVolunteers
    ),
    participatingSchoolCount: clampJavaInt(
      values.kpiFinalSchools ?? existing.participatingSchoolCount
    ),
    generalSurveyMenuKeys,
    ...(ujatParticipantFlags
      ? { generalParticipantTypes: generalParticipantTypesFromUjatFlags(ujatParticipantFlags) }
      : {}),
    ...(registrationOverlay ? { registrationOverlay } : {}),
    generalCommonInfo: {
      ...existing.generalCommonInfo,
      announcementTitle:
        values.announcementTitle ?? existing.generalCommonInfo?.announcementTitle,
      detailedProgramName:
        values.detailedProgramName ?? existing.generalCommonInfo?.detailedProgramName,
      sponsorManagementIds:
        values.sponsorManagementIds ?? existing.generalCommonInfo?.sponsorManagementIds,
      sponsorManagerContactIds: (() => {
        if (values.sponsorManagerContactIds != null) return values.sponsorManagerContactIds
        if (values.sponsorManagerContactId != null) {
          return values.sponsorManagerContactId.trim()
            ? [values.sponsorManagerContactId.trim()]
            : []
        }
        return existing.generalCommonInfo?.sponsorManagerContactIds
      })(),
      sponsorManagerContactId: (() => {
        const ids =
          values.sponsorManagerContactIds ??
          (values.sponsorManagerContactId?.trim()
            ? [values.sponsorManagerContactId.trim()]
            : undefined)
        return (
          ids?.[0] ??
          existing.generalCommonInfo?.sponsorManagerContactId
        )
      })(),
      venueDetail: values.venueDetail ?? existing.generalCommonInfo?.venueDetail,
      venueKind: values.venueKind ?? existing.generalCommonInfo?.venueKind,
      curriculumSessions: (() => {
        const existingSessions = existing.generalCommonInfo?.curriculumSessions
        const hasSlotEdit =
          values.curriculumSession1Title != null ||
          values.curriculumSession1Description != null ||
          values.curriculumSession2Title != null ||
          values.curriculumSession2Description != null
        if (!hasSlotEdit) return existingSessions
        const slot = (index: number, title: string | undefined, description: string | undefined) => {
          const current = existingSessions?.[index]
          return {
            sessionLabel: current?.sessionLabel ?? (index === 0 ? '1차시' : '2차시'),
            title: title ?? current?.title ?? '',
            description: description ?? current?.description ?? '',
            ...(current?.assignmentEnabled != null
              ? { assignmentEnabled: current.assignmentEnabled }
              : {}),
            ...(current?.assignmentPeriod ? { assignmentPeriod: current.assignmentPeriod } : {}),
            ...(current?.educationFormLabel
              ? { educationFormLabel: current.educationFormLabel }
              : {}),
            ...(current?.ipsTypeSummary ? { ipsTypeSummary: current.ipsTypeSummary } : {}),
            ...(current?.scheduleDateLabel
              ? { scheduleDateLabel: current.scheduleDateLabel }
              : {}),
          }
        }
        const edited = [
          slot(0, values.curriculumSession1Title, values.curriculumSession1Description),
          slot(1, values.curriculumSession2Title, values.curriculumSession2Description),
        ]
        // 폼은 1·2차시만 가진다. 동적으로 추가된 3차시 이후는 유지.
        if ((existingSessions?.length ?? 0) > 2) {
          return [...edited, ...existingSessions!.slice(2)]
        }
        return edited
      })(),
      educationScheduleLines:
        values.educationScheduleLines ?? existing.generalCommonInfo?.educationScheduleLines,
      educationScheduleMode:
        values.educationScheduleMode ?? existing.generalCommonInfo?.educationScheduleMode,
      educationFormLabel: (() => {
        if (values.educationForm == null) return existing.generalCommonInfo?.educationFormLabel
        const map: Record<string, string> = {
          online: '온라인',
          offline: '오프라인',
          hybrid: '온/오프라인',
          participant_selection: '참여자 선택',
        }
        return map[values.educationForm] ?? values.educationForm
      })(),
      educationFormScheduleDetail:
        values.educationFormScheduleDetail ??
        existing.generalCommonInfo?.educationFormScheduleDetail,
      ipsScheduleDetail:
        values.ipsScheduleDetail ?? existing.generalCommonInfo?.ipsScheduleDetail,
      ipsTypeSummary: (() => {
        if (
          values.ipsScheduleDetail == null &&
          values.ipsCategory == null &&
          values.ipsDetail == null
        ) {
          return existing.generalCommonInfo?.ipsTypeSummary
        }
        const scheduleLabel =
          (values.ipsScheduleDetail ?? existing.generalCommonInfo?.ipsScheduleDetail) ===
          'perSchedule'
            ? '일정 별 상이'
            : '일정 공통'
        const category = values.ipsCategory ?? ''
        const categoryLabel =
          category === 'inspire'
            ? 'Inspire'
            : category === 'succeed'
              ? 'Succeed'
              : category === 'prepare'
                ? 'Prepare'
                : '-'
        const detailLabel =
          category === 'prepare' || !values.ipsDetail ? '해당없음' : values.ipsDetail
        return `${scheduleLabel} | ${categoryLabel} | ${detailLabel}`
      })(),
      paymentItems:
        values.wagePaymentItemIds != null
          ? programPaymentItemLabelsFromIds(values.wagePaymentItemIds) ||
            existing.generalCommonInfo?.paymentItems
          : existing.generalCommonInfo?.paymentItems,
      deductionItems:
        values.wagePaymentItemIds != null
          ? resolveProgramWageDeductionLabel(values.wagePaymentItemIds)
          : existing.generalCommonInfo?.deductionItems,
      wageGradeRows: buildWageGradeRowsFromDetailValues(values, existing),
      kpi: {
        finalParticipants:
          clampJavaInt(values.kpiFinalParticipants) ??
          clampJavaInt(existing.generalCommonInfo?.kpi?.finalParticipants) ??
          clampJavaInt(existing.approvedStudentCount) ??
          0,
        instructorCount:
          clampJavaInt(values.kpiInstructorCount) ??
          clampJavaInt(existing.generalCommonInfo?.kpi?.instructorCount) ??
          0,
        volunteerCount:
          clampJavaInt(values.kpiVolunteerCount) ??
          clampJavaInt(existing.generalCommonInfo?.kpi?.volunteerCount) ??
          clampJavaInt(existing.generalVolunteers) ??
          0,
        finalSchools:
          clampJavaInt(values.kpiFinalSchools) ??
          clampJavaInt(existing.generalCommonInfo?.kpi?.finalSchools) ??
          clampJavaInt(existing.participatingSchoolCount) ??
          0,
        finalClasses:
          clampJavaInt(values.kpiFinalClasses) ??
          clampJavaInt(existing.generalCommonInfo?.kpi?.finalClasses) ??
          0,
      },
      participantRecruitmentInfo: {
        ...existing.generalCommonInfo?.participantRecruitmentInfo,
        announcementPublished,
        announcementPublishedLabel:
          announcementPublished === true
            ? '게시'
            : announcementPublished === false
              ? '미게시'
              : existing.generalCommonInfo?.participantRecruitmentInfo?.announcementPublishedLabel,
        studentListRequired,
        studentListRequiredLabel:
          studentListRequired === 'required'
            ? '제출 필요'
            : studentListRequired === 'not_required'
              ? '제출 불필요'
              : existing.generalCommonInfo?.participantRecruitmentInfo?.studentListRequiredLabel,
        preEducationNoticeRequired: isTrainedTeacherProgram
          ? false
          : values.participantRecruitmentPreEducationRequired === 'required'
            ? true
            : values.participantRecruitmentPreEducationRequired === 'not_required'
              ? false
              : existing.generalCommonInfo?.participantRecruitmentInfo?.preEducationNoticeRequired,
        certificateIssuanceProvided:
          values.participantRecruitmentCertificateProvided === 'provided'
            ? true
            : values.participantRecruitmentCertificateProvided === 'not_provided'
              ? false
              : existing.generalCommonInfo?.participantRecruitmentInfo?.certificateIssuanceProvided,
        maxAssignableInstructors: isTrainedTeacherProgram
          ? 0
          : values.participantRecruitmentMaxInstructors,
        maxClassCount: values.participantRecruitmentMaxClassCount,
        maxScheduleCount: values.participantRecruitmentMaxScheduleCount,
        maxSessionsPerDay: values.participantRecruitmentMaxSessionsPerDay,
        interviewEnabled:
          values.participantRecruitmentInterviewEnabled === 'yes'
            ? true
            : values.participantRecruitmentInterviewEnabled === 'no'
              ? false
              : existing.generalCommonInfo?.participantRecruitmentInfo?.interviewEnabled,
        notesNotApplicable: values.participantRecruitmentNotesNotApplicable === 'not_applicable',
        remarks:
          values.participantRecruitmentNotesNotApplicable === 'not_applicable'
            ? undefined
            : (values.remarks?.trim() ||
              existing.generalCommonInfo?.participantRecruitmentInfo?.remarks),
        educationTarget:
          targetLabel && targetLabel !== '-'
            ? targetLabel
            : existing.generalCommonInfo?.participantRecruitmentInfo?.educationTarget,
        recruitmentTarget:
          targetLabel && targetLabel !== '-'
            ? targetLabel
            : existing.generalCommonInfo?.participantRecruitmentInfo?.recruitmentTarget,
        educationTargetDetail:
          values.educationTargetDetail?.trim() ||
          existing.generalCommonInfo?.participantRecruitmentInfo?.educationTargetDetail,
        recruitmentPeriodLabel,
        operationPeriodLabel,
        resultAnnouncementLabel: formatAnnouncementLabel(
          resultAnnouncementDate,
          resultAnnouncementMethod
        ),
        finalAnnouncementLabel: formatAnnouncementLabel(
          resultAnnouncementDate,
          resultAnnouncementMethod
        ),
        inquiryTel: contactPhone?.trim() || existing.generalCommonInfo?.participantRecruitmentInfo?.inquiryTel,
        inquiryEmail:
          contactEmail?.trim() || existing.generalCommonInfo?.participantRecruitmentInfo?.inquiryEmail,
        contactPhone: contactPhone?.trim() || existing.generalCommonInfo?.participantRecruitmentInfo?.contactPhone,
        contactEmail: contactEmail?.trim() || existing.generalCommonInfo?.participantRecruitmentInfo?.contactEmail,
        contactOrganizationName,
        contactName:
          values.recruitmentContactOrganizationName?.trim() ||
          existing.generalCommonInfo?.participantRecruitmentInfo?.contactName,
      },
      instructorRecruitmentInfo: {
        ...existing.generalCommonInfo?.instructorRecruitmentInfo,
        announcementPublished:
          announcementPublishedFromFormValue(values.instructorRecruitmentAnnouncementPublished) ??
          existing.generalCommonInfo?.instructorRecruitmentInfo?.announcementPublished,
        contactOrganizationName: instructorContactOrganizationName,
        inquiryTel: instructorContactPhone?.trim() || undefined,
        inquiryEmail: instructorContactEmail?.trim() || undefined,
        contactPhone: instructorContactPhone?.trim() || undefined,
        contactEmail: instructorContactEmail?.trim() || undefined,
        recruitmentTarget:
          values.instructorTargets != null
            ? values.instructorTargets.length
              ? formatInstructorTargetsLabel(values.instructorTargets)
              : undefined
            : existing.generalCommonInfo?.instructorRecruitmentInfo?.recruitmentTarget,
        recruitmentTargetDetail:
          values.instructorTargetDetail != null
            ? values.instructorTargetDetail.trim() || undefined
            : existing.generalCommonInfo?.instructorRecruitmentInfo?.recruitmentTargetDetail,
        recruitmentPeriodLabel:
          recruitmentAudience === 'instructor'
            ? periodLabelFromRange(
                values.instructorApplicationStartDate,
                values.instructorApplicationEndDate
              )
            : periodLabelFromRange(
                values.instructorApplicationStartDate ?? existing.instructorApplicationStartDate,
                values.instructorApplicationEndDate ?? existing.instructorApplicationEndDate
              ) ?? existing.generalCommonInfo?.instructorRecruitmentInfo?.recruitmentPeriodLabel,
        operationPeriodLabel: operationPeriodLabels.instructor,
        ...finalPassAnnouncementPatch(values, existing, undefined, {
          nestedFields: false,
          recruitmentAudience,
        }),
      },
      volunteerRecruitmentInfo: {
        ...existing.generalCommonInfo?.volunteerRecruitmentInfo,
        announcementPublished:
          announcementPublishedFromFormValue(values.volunteerRecruitmentAnnouncementPublished) ??
          existing.generalCommonInfo?.volunteerRecruitmentInfo?.announcementPublished,
        noticeExposureTiming:
          toUjatVolunteerNoticeExposurePayload(values.volunteerRecruitmentNoticeExposure) ??
          toUjatVolunteerNoticeExposurePayload(
            existing.generalCommonInfo?.volunteerRecruitmentInfo?.noticeExposureTiming
          ),
        notesNotApplicable: values.volunteerRecruitmentNotesNotApplicable === 'not_applicable',
        contactOrganizationName: volunteerContactOrganizationName,
        inquiryTel: volunteerContactPhone?.trim() || undefined,
        inquiryEmail: volunteerContactEmail?.trim() || undefined,
        contactPhone: volunteerContactPhone?.trim() || undefined,
        contactEmail: volunteerContactEmail?.trim() || undefined,
        recruitmentTarget:
          values.volunteerTargets != null
            ? values.volunteerTargets.length
              ? formatVolunteerTargetsLabel(values.volunteerTargets)
              : undefined
            : existing.generalCommonInfo?.volunteerRecruitmentInfo?.recruitmentTarget,
        recruitmentTargetDetail:
          values.volunteerTargetDetail != null
            ? values.volunteerTargetDetail.trim() || undefined
            : existing.generalCommonInfo?.volunteerRecruitmentInfo?.recruitmentTargetDetail,
        recruitmentPeriodLabel:
          recruitmentAudience === 'volunteer'
            ? periodLabelFromRange(
                values.volunteerApplicationStartDate,
                values.volunteerApplicationEndDate
              )
            : periodLabelFromRange(
                values.volunteerApplicationStartDate ?? existing.volunteerApplicationStartDate,
                values.volunteerApplicationEndDate ?? existing.volunteerApplicationEndDate
              ) ?? existing.generalCommonInfo?.volunteerRecruitmentInfo?.recruitmentPeriodLabel,
        operationPeriodLabel: operationPeriodLabels.volunteer,
        volunteerInterviewEnabled:
          values.volunteerRecruitmentInterviewEnabled === 'yes'
            ? true
            : values.volunteerRecruitmentInterviewEnabled === 'no'
              ? false
              : existing.generalCommonInfo?.volunteerRecruitmentInfo?.volunteerInterviewEnabled,
        generalVolunteerInterviewEnabled:
          values.volunteerRecruitmentInterviewEnabled === 'yes'
            ? true
            : values.volunteerRecruitmentInterviewEnabled === 'no'
              ? false
              : existing.generalCommonInfo?.volunteerRecruitmentInfo?.generalVolunteerInterviewEnabled,
        ...finalPassAnnouncementPatch(
          values,
          existing,
          existing.generalCommonInfo?.volunteerRecruitmentInfo as
            | { finalPassAnnouncementDate?: string; finalPassAnnouncementMethod?: string }
            | undefined,
          { nestedFields: true, recruitmentAudience }
        ),
      },
    },
    generalVolunteerInterviewEnabled:
      values.volunteerRecruitmentInterviewEnabled === 'yes'
        ? true
        : values.volunteerRecruitmentInterviewEnabled === 'no'
          ? false
          : existing.generalVolunteerInterviewEnabled,
    generalParticipantInterviewEnabled:
      values.participantRecruitmentInterviewEnabled === 'yes'
        ? true
        : values.participantRecruitmentInterviewEnabled === 'no'
          ? false
          : existing.generalParticipantInterviewEnabled,
    instructorCapacity: recruitAudienceScalar(
      values.instructorCapacity,
      existing.instructorCapacity,
      recruitmentAudience,
      'instructor'
    ),
    instructorApplicationStartDate: recruitAudienceScalar(
      values.instructorApplicationStartDate,
      existing.instructorApplicationStartDate,
      recruitmentAudience,
      'instructor'
    ),
    instructorApplicationEndDate: recruitAudienceScalar(
      values.instructorApplicationEndDate,
      existing.instructorApplicationEndDate,
      recruitmentAudience,
      'instructor'
    ),
    documentPassAnnouncementDate: recruitAudienceScalar(
      values.documentPassAnnouncementDate,
      existing.documentPassAnnouncementDate,
      recruitmentAudience,
      'instructor'
    ),
    documentPassAnnouncementMethod: recruitAudienceScalar(
      values.documentPassAnnouncementMethod,
      existing.documentPassAnnouncementMethod,
      recruitmentAudience,
      'instructor'
    ),
    interviewStartDate: recruitAudienceScalar(
      values.interviewStartDate,
      existing.interviewStartDate,
      recruitmentAudience,
      'instructor'
    ),
    interviewEndDate: recruitAudienceScalar(
      values.interviewEndDate,
      existing.interviewEndDate,
      recruitmentAudience,
      'instructor'
    ),
    interviewMethod: recruitAudienceScalar(
      values.interviewMethod,
      existing.interviewMethod,
      recruitmentAudience,
      'instructor'
    ),
    finalPassAnnouncementDate:
      recruitmentAudience === 'instructor' || recruitmentAudience === 'volunteer'
        ? values.finalPassAnnouncementDate
        : values.finalPassAnnouncementDate ?? existing.finalPassAnnouncementDate,
    finalPassAnnouncementMethod:
      recruitmentAudience === 'instructor' || recruitmentAudience === 'volunteer'
        ? values.finalPassAnnouncementMethod
        : values.finalPassAnnouncementMethod ?? existing.finalPassAnnouncementMethod,
    instructorTargets:
      values.instructorTargets != null ? values.instructorTargets : undefined,
    instructorTarget:
      values.instructorTargets != null
        ? values.instructorTargets.length
          ? values.instructorTargets.join(', ')
          : undefined
        : undefined,
    instructorTargetDetail:
      values.instructorTargetDetail != null
        ? values.instructorTargetDetail
        : existing.instructorTargetDetail,
    volunteerApplicationStartDate: recruitAudienceScalar(
      values.volunteerApplicationStartDate,
      existing.volunteerApplicationStartDate,
      recruitmentAudience,
      'volunteer'
    ),
    volunteerApplicationEndDate: recruitAudienceScalar(
      values.volunteerApplicationEndDate,
      existing.volunteerApplicationEndDate,
      recruitmentAudience,
      'volunteer'
    ),
    volunteerTargets: values.volunteerTargets != null ? values.volunteerTargets : undefined,
    volunteerTarget:
      values.volunteerTargets != null
        ? values.volunteerTargets.length
          ? formatVolunteerTargetsLabel(values.volunteerTargets)
          : undefined
        : undefined,
    volunteerTargetDetail:
      values.volunteerTargetDetail != null
        ? values.volunteerTargetDetail
        : existing.volunteerTargetDetail,
    applicationMethod: values.applicationMethod ?? existing.applicationMethod,
    otherNotes: values.otherNotes ?? existing.otherNotes,
    additionalContentHtml: values.additionalContentHtml ?? existing.additionalContentHtml,
    mainTitle: values.mainTitle ?? existing.mainTitle,
    titleEn: values.titleEn ?? existing.titleEn,
    detailedProgramId: values.detailedProgramId ?? existing.detailedProgramId,
    generalProgramEducationStructure:
      values.educationStructure ?? existing.generalProgramEducationStructure,
    generalProgramSessionRound: values.sessionRound ?? existing.generalProgramSessionRound,
    teamDivision: values.teamDivision ?? existing.teamDivision,
    educationProcess: values.educationProcess ?? existing.educationProcess,
    ipOwned: values.ipOwned ?? existing.ipOwned,
    courseDeliveredBy: values.courseDeliveredBy ?? existing.courseDeliveredBy,
    partnerInvolvement: values.partnerInvolvement ?? existing.partnerInvolvement,
    ips: (() => {
      if (values.ipsCategory === 'inspire') return 'Inspire'
      if (values.ipsCategory === 'succeed') return 'Succeed'
      if (values.ipsCategory === 'prepare') return 'Prepare'
      return values.ips ?? existing.ips
    })(),
    programCategory: values.programCategory ?? existing.programCategory,
    programChannel: values.programChannel ?? existing.programChannel,
  }
}

/**
 * 공통정보 탭 저장 — remote PATCH 에서 모집·회차 필드를 제외한다.
 * (모집 시작 후 BE `PROGRAM_PARTICIPANT_RECRUITMENT_EDIT_PERIOD_ENDED` 충돌 방지)
 */
export function narrowProgramDetailPatchForCommonInfoSave(
  patch: Partial<import('@/types/domain').Program>
): Partial<import('@/types/domain').Program> {
  const {
    applicationStartDate: _applicationStartDate,
    applicationEndDate: _applicationEndDate,
    resultAnnouncementDate: _resultAnnouncementDate,
    resultAnnouncementMethod: _resultAnnouncementMethod,
    studentListRequired: _studentListRequired,
    recruitmentGuide: _recruitmentGuide,
    learningSupportContent: _learningSupportContent,
    additionalContentHtml: _additionalContentHtml,
    remarks: _remarks,
    rounds: _rounds,
    generalParticipantInterviewEnabled: _generalParticipantInterviewEnabled,
    generalVolunteerInterviewEnabled: _generalVolunteerInterviewEnabled,
    instructorCapacity: _instructorCapacity,
    instructorApplicationStartDate: _instructorApplicationStartDate,
    instructorApplicationEndDate: _instructorApplicationEndDate,
    documentPassAnnouncementDate: _documentPassAnnouncementDate,
    documentPassAnnouncementMethod: _documentPassAnnouncementMethod,
    interviewStartDate: _interviewStartDate,
    interviewEndDate: _interviewEndDate,
    interviewMethod: _interviewMethod,
    finalPassAnnouncementDate: _finalPassAnnouncementDate,
    finalPassAnnouncementMethod: _finalPassAnnouncementMethod,
    instructorTarget: _instructorTarget,
    instructorTargets: _instructorTargets,
    instructorTargetDetail: _instructorTargetDetail,
    volunteerApplicationStartDate: _volunteerApplicationStartDate,
    volunteerApplicationEndDate: _volunteerApplicationEndDate,
    volunteerTarget: _volunteerTarget,
    volunteerTargets: _volunteerTargets,
    volunteerTargetDetail: _volunteerTargetDetail,
    applicationMethod: _applicationMethod,
    otherNotes: _otherNotes,
    educationTargetDetail: _educationTargetDetail,
    ...rest
  } = patch

  if (!rest.generalCommonInfo) return rest

  const {
    participantRecruitmentInfo: _participantRecruitmentInfo,
    instructorRecruitmentInfo: _instructorRecruitmentInfo,
    volunteerRecruitmentInfo: _volunteerRecruitmentInfo,
    volunteerInterviewScheduleInfo: _volunteerInterviewScheduleInfo,
    ...commonRest
  } = rest.generalCommonInfo

  return {
    ...rest,
    generalCommonInfo: commonRest,
  }
}
