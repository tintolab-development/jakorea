/**
 * 1사1교 신규 등록 CREATE — canonical values → Program.
 * Overlay store를 persist SSOT 로 쓰지 않는다.
 */
import dayjs from 'dayjs'
import { formatDateRangeDot, formatNumberDisplay } from '@/shared/utils'
import type { Program } from '@/types/domain'
import {
  normalizeProgramBusinessAreaValue,
  resolvePersistedProgramTargetLevels,
} from '@/features/program/shared/lib/program-detail-info-constants'
import {
  PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL,
  programPaymentItemLabelsFromIds,
  resolveProgramWageDeductionLabel,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import { resolveCompanySchoolWageDefaultPaymentItemIds } from './company-school-wage-defaults'
import { applyCompanySchoolCanonicalRecruitToProgram } from './apply-company-school-canonical-recruit-to-program'
import {
  TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS,
  TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS,
  TEMPLATE_FORM_IP_OWNED_OPTIONS,
} from '@/features/template/lib/template-form-select-options'
import { collectCompanySchoolRegistrationCommonState } from './collect-registration-common-info-state'
import {
  COMPANY_SCHOOL_REGISTRATION_CANONICAL_VERSION,
  type CompanySchoolDateRange,
  type CompanySchoolRegistrationCanonical,
  type CompanySchoolRegistrationCommonCanonical,
} from './registration-canonical-types'
import type { CompanySchoolRegistrationRhfValues } from './registration-rhf-values'
import {
  collectCompanySchoolRecruitmentState,
  emptyCompanySchoolRecruitFormState,
  serializeCompanySchoolRecruitmentForFormVersion,
} from './registration-rhf-recruitment'
import {
  collectCompanySchoolInstructorRecruitmentState,
  emptyCompanySchoolInstructorRecruitFormState,
  serializeCompanySchoolInstructorRecruitmentForFormVersion,
  withCompanySchoolInstructorRecruitCreateDefaults,
} from './registration-rhf-instructor-recruitment'
import { collectCompanySchoolApplicationState } from './registration-rhf-application'
import { serializeCompanySchoolCompatibilityOverlay } from './serialize-registration-overlay-from-canonical'

const UNSELECTED = '__all__'
const WAGE_GRADE_LABELS = ['1급 강사비', '2급 강사비', '3급 강사비'] as const

function skipUnselected(value: string): string {
  if (!value || value === UNSELECTED) return ''
  return value
}

function ipOwnedToProgramValue(formValue: string): Program['ipOwned'] | undefined {
  const value = skipUnselected(formValue)
  if (!value) return undefined
  const label = TEMPLATE_FORM_IP_OWNED_OPTIONS.find(o => o.value === value)?.label ?? value
  if (label === 'Jointly') return 'Jointly'
  if (label === 'Partner') return 'Partner'
  return 'JA'
}

function courseDeliveredToProgramValue(formValue: string): Program['courseDeliveredBy'] | undefined {
  const value = skipUnselected(formValue)
  if (!value) return undefined
  const label =
    TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS.find(o => o.value === value)?.label ?? value
  if (label === 'Jointly') return 'Jointly'
  if (label === 'Partner') return 'Partner'
  return 'JA'
}

function educationProcessToProgramValue(formValue: string): string | undefined {
  const value = skipUnselected(formValue)
  if (!value) return undefined
  return TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS.find(o => o.value === value)?.label ?? value
}

function ipsToProgramValue(formValue: string): Program['ips'] | undefined {
  if (formValue === 'inspire') return 'Inspire'
  if (formValue === 'succeed') return 'Succeed'
  if (formValue === 'prepare') return 'Prepare'
  return undefined
}

function seoulCalendarDate(value: string | undefined): string | null {
  if (!value?.trim()) return null
  const dateOnly = value.trim().match(/^(\d{4}-\d{2}-\d{2})$/)
  if (dateOnly) return dateOnly[1]
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const year = parts.find(part => part.type === 'year')?.value
  const month = parts.find(part => part.type === 'month')?.value
  const day = parts.find(part => part.type === 'day')?.value
  if (!year || !month || !day) return null
  return `${year}-${month}-${day}`
}

/**
 * C11: 사업 운영 기간이 없으면 CREATE를 만들지 않는다(예전: 올해 1/1~12/31로 조용히 대체).
 * 미리보기(`requireOperationRange: false`)만 화면 표시용 대체값을 쓴다.
 */
export class CompanySchoolOperationRangeRequiredError extends Error {
  readonly reasonKey = 'basicInfo.operationRangeSeal'
  constructor() {
    super('사업 운영 기간을 입력해 주세요.')
    this.name = 'CompanySchoolOperationRangeRequiredError'
  }
}

export function hasCompanySchoolOperationRange(range: CompanySchoolDateRange | null): boolean {
  if (range == null) return false
  const start = seoulCalendarDate(range.start) ?? range.start
  const end = seoulCalendarDate(range.end) ?? range.end
  return Boolean(start?.trim()) && Boolean(end?.trim()) && dayjs(start).isValid() && dayjs(end).isValid()
}

function rangeToIso(
  range: CompanySchoolDateRange | null,
  fallbackYear: number,
  requireOperationRange: boolean
): {
  startDate: string
  endDate: string
} {
  if (requireOperationRange && !hasCompanySchoolOperationRange(range)) {
    throw new CompanySchoolOperationRangeRequiredError()
  }
  if (!range) {
    return {
      startDate: dayjs(`${fallbackYear}-01-01`).startOf('day').toISOString(),
      endDate: dayjs(`${fallbackYear}-12-31`).endOf('day').toISOString(),
    }
  }
  const startDay = seoulCalendarDate(range.start) ?? range.start
  const endDay = seoulCalendarDate(range.end) ?? range.end
  return {
    startDate: dayjs(startDay).startOf('day').toISOString(),
    endDate: dayjs(endDay).endOf('day').toISOString(),
  }
}

function buildEducationScheduleLines(range: CompanySchoolDateRange | null): string[] {
  if (!range) return []
  const start = dayjs(seoulCalendarDate(range.start) ?? range.start)
  const end = dayjs(seoulCalendarDate(range.end) ?? range.end)
  if (!start.isValid() || !end.isValid()) return []
  const rangeLabel = formatDateRangeDot(start, end)
  return rangeLabel === '-' ? [] : [rangeLabel]
}

function buildWagePricing(fee: number | null, distanceFee: number | null): string {
  const feeLabel = fee != null && Number.isFinite(fee) ? `${formatNumberDisplay(fee)}원` : '-'
  const distanceLabel =
    distanceFee != null && Number.isFinite(distanceFee)
      ? `${formatNumberDisplay(distanceFee)}원`
      : feeLabel
  return `1시간 당 | 기본 : ${feeLabel} | 장거리 : ${distanceLabel}`
}

function withTargetLevels(program: Program): Program {
  const targetLevels = resolvePersistedProgramTargetLevels(program)
  if (targetLevels.length === 0) return program
  return { ...program, targetLevels, targetLevel: targetLevels[0] }
}

export function buildCompanySchoolCanonicalFromRhf(args: {
  values: CompanySchoolRegistrationRhfValues
}): CompanySchoolRegistrationCanonical {
  return {
    schemaVersion: COMPANY_SCHOOL_REGISTRATION_CANONICAL_VERSION,
    common: collectCompanySchoolRegistrationCommonState(args.values),
    recruit: collectCompanySchoolRecruitmentState(args.values.recruitment),
    instructorRecruit: collectCompanySchoolInstructorRecruitmentState(args.values.instructorRecruit),
    application: collectCompanySchoolApplicationState(args.values.application),
    sidecar: { ...args.values.sidecar },
  }
}

export function buildCompanySchoolProgramFromCanonical(args: {
  id: string
  canonical: CompanySchoolRegistrationCanonical
  /** CREATE 경로는 true — 운영 기간이 없으면 CompanySchoolOperationRangeRequiredError */
  requireOperationRange?: boolean
}): Program {
  const common = args.canonical.common
  const now = new Date().toISOString()
  const y = dayjs().year()
  const period = rangeToIso(common.operationRange, y, args.requireOperationRange === true)
  const sponsorId = skipUnselected(common.sponsorId)
  const managerContactIds = common.managerContactIds
    .map(id => id.trim())
    .filter(id => id && id !== UNSELECTED)
  const title = common.repKo.trim() || `신규 1사1교 프로그램 (${dayjs().format('YYYY-MM-DD HH:mm:ss')})`
  const educationScheduleLines =
    common.educationScheduleLines.length > 0
      ? [...common.educationScheduleLines]
      : buildEducationScheduleLines(common.educationScheduleRange)
  const hasAnyWage =
    common.grade1Fee != null ||
    common.grade1DistanceFee != null ||
    common.grade2Fee != null ||
    common.grade2DistanceFee != null ||
    common.grade3Fee != null ||
    common.grade3DistanceFee != null
  const wageGradeRows = hasAnyWage
    ? [
        { grade: WAGE_GRADE_LABELS[0], pricing: buildWagePricing(common.grade1Fee, common.grade1DistanceFee) },
        { grade: WAGE_GRADE_LABELS[1], pricing: buildWagePricing(common.grade2Fee, common.grade2DistanceFee) },
        { grade: WAGE_GRADE_LABELS[2], pricing: buildWagePricing(common.grade3Fee, common.grade3DistanceFee) },
      ]
    : []
  const paymentItemIds =
    common.paymentItemValues === undefined
      ? resolveCompanySchoolWageDefaultPaymentItemIds()
      : common.paymentItemValues
  const paymentItemsFromIds = paymentItemIds
    ? programPaymentItemLabelsFromIds(paymentItemIds)
    : ''
  const paymentItems = paymentItemsFromIds || PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL
  const deductionItems = paymentItemIds?.length
    ? resolveProgramWageDeductionLabel(paymentItemIds)
    : PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL

  const program: Program = {
    id: args.id,
    backendProgramType: 'COMPANY_SCHOOL',
    sponsorId,
    title,
    mainTitle: common.repKo,
    titleEn: common.repEn,
    type: 'offline',
    format: 'workshop',
    category: 'school',
    description: title,
    startDate: period.startDate,
    endDate: period.endDate,
    applicationStartDate: dayjs().startOf('day').toISOString(),
    applicationEndDate: dayjs().add(30, 'day').endOf('day').toISOString(),
    status: 'pending',
    lifecycleStatus: 'recruiting_students',
    businessArea: normalizeProgramBusinessAreaValue(common.businessField) || undefined,
    detailedProgramId: common.detailedProgramId || undefined,
    ipOwned: ipOwnedToProgramValue(common.ipOwned),
    courseDeliveredBy: courseDeliveredToProgramValue(common.courseDeliveredBy),
    educationProcess: educationProcessToProgramValue(common.educationCourse),
    partnerInvolvement: common.partnerInvolvement === 'yes',
    ips: ipsToProgramValue(common.ipsCategory),
    approvedStudentCount: common.participantCount ?? undefined,
    instructors: common.instructor ?? undefined,
    instructorCapacity: common.instructor ?? undefined,
    participatingSchoolCount: common.dispatchedSchool ?? undefined,
    generalVolunteers: 0,
    staffVolunteers: 0,
    returningVolunteers: 0,
    studentListRequired: 'not_required',
    generalProgramAudience: 'organization',
    generalParticipantTypes: ['school_institution', 'teacher_instructor'],
    generalProgramEducationStructure: 'curriculum',
    generalSurveyMenuKeys: [...common.generalSurveyMenuKeys],
    generalCommonInfo: {
      announcementTitle: common.publicProgramTitle,
      detailedProgramName: common.detailedProgramName,
      sponsorManagementId: sponsorId || undefined,
      sponsorManagementIds: sponsorId ? [sponsorId] : [],
      sponsorManagerContactIds: managerContactIds,
      sponsorManagerContactId: managerContactIds[0],
      educationScheduleMode: 'period',
      educationScheduleLines,
      curriculumSessions: common.curriculumSessions.map(session => ({ ...session })),
      wageGradeRows,
      paymentItems,
      deductionItems,
      kpi: {
        finalParticipants: common.participantCount ?? 0,
        instructorCount: common.instructor ?? 0,
        volunteerCount: 0,
        finalSchools: common.dispatchedSchool ?? 0,
        finalClasses: common.dispatchedClass ?? 0,
      },
    },
    registrationOverlay: serializeCompanySchoolCompatibilityOverlay(
      common,
      args.canonical.sidecar
    ),
    rounds: [
      {
        id: `${args.id}-round-1`,
        programId: args.id,
        roundNumber: 1,
        startDate: period.startDate,
        endDate: period.endDate,
        capacity: 30,
        status: 'active',
        deliveryType: 'offline',
        curriculum: `${title} 커리큘럼`,
      },
    ],
    createdAt: now,
    updatedAt: now,
  }

  const recruit = args.canonical.recruit ?? emptyCompanySchoolRecruitFormState()
  const instructor = withCompanySchoolInstructorRecruitCreateDefaults(
    args.canonical.instructorRecruit ?? emptyCompanySchoolInstructorRecruitFormState()
  )
  const mapped = applyCompanySchoolCanonicalRecruitToProgram(program, recruit, instructor)
  const wireOverlay = {
    ...serializeCompanySchoolRecruitmentForFormVersion(recruit),
    ...serializeCompanySchoolInstructorRecruitmentForFormVersion(instructor),
  }
  return withTargetLevels({
    ...mapped,
    registrationOverlay: {
      ...(mapped.registrationOverlay ?? {}),
      ...wireOverlay,
    },
  })
}

export function buildCompanySchoolProgramFromRhf(args: {
  id: string
  values: CompanySchoolRegistrationRhfValues
  requireOperationRange?: boolean
}): Program {
  return buildCompanySchoolProgramFromCanonical({
    id: args.id,
    canonical: buildCompanySchoolCanonicalFromRhf(args),
    requireOperationRange: args.requireOperationRange,
  })
}

export type { CompanySchoolRegistrationCommonCanonical }
