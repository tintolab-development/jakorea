/**
 * 1사1교(economy) 프로그램 등록 overlay → Program.generalCommonInfo.
 *
 * 버그 수정: 기존에는 `buildGeneralProgramListRowFromRegistrationSnapshot`가
 * `isCompanySchool`일 때 이 매핑 없이 하드코딩된 목업(커리큘럼·강사비 등)을 그대로 반환해,
 * 관리자가 등록 위저드 「공통정보」에 실제로 입력한 값이 생성된 프로그램에 전혀 반영되지 않았다.
 * 이 함수는 `economy-program-registration-required-fields.ts`가 검사하는 것과 **동일한 overlay 키**를 읽어
 * 실입력을 `generalCommonInfo`에 반영하고, overlay가 비어 있으면(=UI 기본값만 두고 안 건드림) 기존 목업 값으로 폴백한다.
 */

import dayjs from 'dayjs'
import { formatDateRangeDot, formatNumberDisplay } from '@/shared/utils'
import type { GeneralProgramSurveyMenuKey, Program } from '@/types/domain'
import {
  coerceProgramPaymentItemsText,
  PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL,
  programPaymentItemLabelsFromIds,
  resolveProgramWageDeductionLabel,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import { normalizeProgramBusinessAreaValue } from '@/features/program/shared/lib/program-detail-info-constants'
import {
  TEMPLATE_FORM_COURSE_DELIVERED_BY_OPTIONS,
  TEMPLATE_FORM_EDUCATION_COURSE_OPTIONS,
  TEMPLATE_FORM_IP_OWNED_OPTIONS,
} from '@/features/template/lib/template-form-select-options'

const BASIC = 'economyRegistration.basicInfo' as const
const KPI = 'economyRegistration.kpi' as const
const CURRICULUM = 'economyRegistration.educationCurriculum' as const
const SCHEDULE = 'economyRegistration.educationScheduleSettings' as const
const WAGE = 'economyRegistration.wageInfo' as const
const UNSELECTED = '__all__'

/** 등록 폼 셀렉트 기본값. overlay에 키가 없어도 화면에는 이 값이 보인다. */
const FORM_DEFAULT_IP_OWNED = 'ja'
const FORM_DEFAULT_COURSE_DELIVERED_BY = 'ja'
const FORM_DEFAULT_PARTNER_INVOLVEMENT = 'no'
const FORM_DEFAULT_IPS_CATEGORY = 'prepare'

const WAGE_GRADE_LABELS = ['1급 강사비', '2급 강사비', '3급 강사비'] as const

const DEFAULT_CURRICULUM_SESSIONS = [
  {
    sessionLabel: '1차시',
    title: '1단원 나를 알리는 기술',
    description: '채용 공고 읽기, 이력서 작성하기 등 취업에 필요한 단계들을 알아봅니다.',
  },
  {
    sessionLabel: '2차시',
    title: '2단원 나를 보여주는 기술',
    description: '올바른 면접 태도에 대해 알아보고, 직접 면접 체험을 해보는 시간을 갖습니다.',
  },
] as const

function overlayString(overlay: Record<string, unknown>, key: string): string {
  const raw = overlay[key]
  if (typeof raw === 'string') return raw.trim()
  if (typeof raw === 'number' && Number.isFinite(raw)) return String(raw)
  return ''
}

function overlayNullableNumber(overlay: Record<string, unknown>, key: string): number | undefined {
  const raw = overlay[key]
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw
  if (typeof raw === 'string' && raw.trim()) {
    const n = Number(raw.replace(/,/g, ''))
    return Number.isFinite(n) ? n : undefined
  }
  return undefined
}

function overlayHasOwn(overlay: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(overlay, key)
}

/** 키가 있으면 빈 값도 의도된 지움(0). 키가 없을 때만 fallback. */
function overlayNumberOrFallback(
  overlay: Record<string, unknown>,
  key: string,
  fallback: number | undefined
): number | undefined {
  if (!overlayHasOwn(overlay, key)) return fallback
  return overlayNullableNumber(overlay, key) ?? 0
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

/** 날짜 피커는 선택일을 서울 자정으로 두고, 저장은 종료일을 23:59:59.999로 다시 쓴다. 달력일이 같으면 기존 instant를 유지해야 잠긴 교육 일정이 변경으로 보이지 않는다. */
function sameSeoulCalendarDay(left: string | undefined, right: string | undefined): boolean {
  const a = seoulCalendarDate(left)
  const b = seoulCalendarDate(right)
  return a != null && a === b
}

function readRangeSeal(
  overlay: Record<string, unknown>,
  key: string
): { start: string; end: string } | undefined {
  const raw = overlay[key]
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const start = (raw as { start?: unknown }).start
  const end = (raw as { end?: unknown }).end
  if (typeof start !== 'string' || typeof end !== 'string') return undefined
  if (!start.trim() || !end.trim()) return undefined
  return { start, end }
}

function buildEconomyCurriculumSessions(
  overlay: Record<string, unknown>
): Array<{ sessionLabel: string; title: string; description: string }> {
  return DEFAULT_CURRICULUM_SESSIONS.map((fallback, index) => {
    const n = index + 1
    const title = overlayString(overlay, `${CURRICULUM}.session${n}.title`) || fallback.title
    const description =
      overlayString(overlay, `${CURRICULUM}.session${n}.description`) || fallback.description
    return { sessionLabel: fallback.sessionLabel, title, description }
  })
}

function buildEconomyEducationScheduleLines(overlay: Record<string, unknown>): string[] {
  const range = readRangeSeal(overlay, `${SCHEDULE}.dateRangeSeal`)
  if (!range) return []
  const start = dayjs(range.start)
  const end = dayjs(range.end)
  if (!start.isValid() || !end.isValid()) return []
  const rangeLabel = formatDateRangeDot(start, end)
  return rangeLabel === '-' ? [] : [rangeLabel]
}

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

function courseDeliveredToProgramValue(
  formValue: string
): Program['courseDeliveredBy'] | undefined {
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

function surveyKeysFromOverlay(
  overlay: Record<string, unknown>
): GeneralProgramSurveyMenuKey[] | undefined {
  const raw = overlay[`${BASIC}.surveyItems`]
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return undefined
  const items = raw as Record<string, unknown>
  const keys: GeneralProgramSurveyMenuKey[] = []
  if (items.survey === true) keys.push('survey')
  if (items.satisfaction === true) keys.push('satisfaction')
  if (items.lecture_evaluation === true) keys.push('lecture_evaluation')
  return keys
}

function buildEconomyWageGradePricing(
  fee: number | undefined,
  distanceFee: number | undefined
): string {
  const feeLabel = fee != null && Number.isFinite(fee) ? `${formatNumberDisplay(fee)}원` : '-'
  const distanceLabel =
    distanceFee != null && Number.isFinite(distanceFee)
      ? `${formatNumberDisplay(distanceFee)}원`
      : feeLabel
  return `1시간 당 | 기본 : ${feeLabel} | 장거리 : ${distanceLabel}`
}

/**
 * 1사1교 등록 위저드 「공통정보」(임금 정보·교육 진행·교육 진행 일정 설정) overlay를
 * `Program.generalCommonInfo`에 반영. 참여자 모집 정보(`participantRecruitmentInfo`)는
 * `applyGeneralRecruitOverlayToProgram`(모집 overlay)이 별도로 처리한다.
 */
export function applyEconomyRegistrationOverlayToProgram(
  base: Program,
  overlay: Record<string, unknown>
): Program {
  const baseCommon = base.generalCommonInfo

  // 버그 수정: 「세부 프로그램명」select에서 고른 값이 generalCommonInfo에 전혀
  // 매핑되지 않아, 수동 선택·자동 채우기 모두 무시되고 항상 기존 값(빈 값)으로 남았다.
  const detailedProgramNameFromOverlay = overlayString(overlay, `${BASIC}.detailedProgramName`)
  const detailedProgramName =
    detailedProgramNameFromOverlay || baseCommon?.detailedProgramName

  // 버그 수정: name(generalCommonInfo.detailedProgramName)만 반영되고 id(top-level
  // Program.detailedProgramId)는 여기서 세팅된 적이 없어, 요청 시 항상 빠졌다(BE는 id로
  // 조회하므로 "세부 프로그램명 없음" 오류) — id도 항상 함께 반영한다.
  const detailedProgramIdFromOverlay = overlayString(overlay, `${BASIC}.detailedProgramId`)
  const detailedProgramId = detailedProgramIdFromOverlay || base.detailedProgramId

  const curriculumSessions = buildEconomyCurriculumSessions(overlay)
  const educationScheduleLinesFromOverlay = buildEconomyEducationScheduleLines(overlay)
  const educationScheduleLines =
    educationScheduleLinesFromOverlay.length > 0
      ? educationScheduleLinesFromOverlay
      : baseCommon?.educationScheduleLines ?? []

  const gradeFees = [1, 2, 3].map(n => overlayNullableNumber(overlay, `${WAGE}.grade${n}Fee`))
  const gradeDistanceFees = [1, 2, 3].map(n =>
    overlayNullableNumber(overlay, `${WAGE}.grade${n}DistanceFee`)
  )
  const hasAnyWageOverlay = gradeFees.some(v => v != null) || gradeDistanceFees.some(v => v != null)
  const wageGradeRows = hasAnyWageOverlay
    ? WAGE_GRADE_LABELS.map((grade, index) => ({
        grade,
        pricing: buildEconomyWageGradePricing(gradeFees[index], gradeDistanceFees[index]),
      }))
    : baseCommon?.wageGradeRows ?? []

  const paymentItemIdsRaw = overlay[`${WAGE}.paymentItemValues`]
  const paymentItemIds = Array.isArray(paymentItemIdsRaw)
    ? paymentItemIdsRaw.map(String)
    : undefined
  const paymentItemsFromIds = paymentItemIds ? programPaymentItemLabelsFromIds(paymentItemIds) : ''
  const paymentItems =
    paymentItemsFromIds ||
    coerceProgramPaymentItemsText(baseCommon?.paymentItems).trim() ||
    PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL
  const deductionItems = paymentItemIds
    ? resolveProgramWageDeductionLabel(paymentItemIds)
    : baseCommon?.deductionItems ?? PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL

  // BE는 create body 1차 컬럼에 온 값만 저장한다. overlay에만 있으면 컬럼은 null로 남는다.
  // 일반 프로그램 create와 같이 공통정보 overlay를 Program 필드로 올린다.
  const repKo = overlayString(overlay, `${BASIC}.repKo`)
  const repEn = overlayString(overlay, `${BASIC}.repEn`)
  const publicProgramTitle = overlayString(overlay, `${BASIC}.publicProgramTitle`)
  const businessArea =
    normalizeProgramBusinessAreaValue(overlayString(overlay, `${BASIC}.businessField`)) ||
    base.businessArea
  // 화면 기본값(JA / No / Prepare)은 사용자가 건드리지 않으면 overlay에 기록되지 않는다.
  // 키가 없으면 그 기본값을 1차 컬럼에 넣는다. 안 넣으면 BE는 null로 저장한다.
  const ipOwned =
    ipOwnedToProgramValue(
      overlayString(overlay, `${BASIC}.ipOwned`) || FORM_DEFAULT_IP_OWNED
    ) ?? base.ipOwned
  const courseDeliveredBy =
    courseDeliveredToProgramValue(
      overlayString(overlay, `${BASIC}.courseDeliveredBy`) || FORM_DEFAULT_COURSE_DELIVERED_BY
    ) ?? base.courseDeliveredBy
  const educationProcess =
    educationProcessToProgramValue(overlayString(overlay, `${BASIC}.educationCourse`)) ??
    base.educationProcess
  const partnerRaw =
    overlayString(overlay, `${BASIC}.partnerInvolvement`) || FORM_DEFAULT_PARTNER_INVOLVEMENT
  const partnerInvolvement = partnerRaw === 'yes'
  const ips =
    ipsToProgramValue(overlayString(overlay, `${BASIC}.ipsCategory`) || FORM_DEFAULT_IPS_CATEGORY) ??
    base.ips

  const operationRange = readRangeSeal(overlay, `${BASIC}.operationRangeSeal`)
  const startUnchanged =
    operationRange != null && sameSeoulCalendarDay(String(base.startDate ?? ''), operationRange.start)
  const endUnchanged =
    operationRange != null && sameSeoulCalendarDay(String(base.endDate ?? ''), operationRange.end)
  const startDate = !operationRange
    ? base.startDate
    : startUnchanged
      ? base.startDate
      : dayjs(operationRange.start).startOf('day').toISOString()
  const endDate = !operationRange
    ? base.endDate
    : endUnchanged
      ? base.endDate
      : dayjs(operationRange.end).endOf('day').toISOString()
  const periodChanged = operationRange != null && (!startUnchanged || !endUnchanged)
  const rounds =
    periodChanged && base.rounds?.length
      ? base.rounds.map((round, index) =>
          index === 0 ? { ...round, startDate, endDate } : round
        )
      : base.rounds

  const prevKpi = baseCommon?.kpi
  const participantCount = overlayNumberOrFallback(
    overlay,
    `${KPI}.participantCount`,
    prevKpi?.finalParticipants ?? base.approvedStudentCount
  )
  const instructorCount = overlayNumberOrFallback(
    overlay,
    `${KPI}.instructor`,
    prevKpi?.instructorCount ?? base.instructors ?? base.instructorCapacity
  )
  const dispatchedSchool = overlayNumberOrFallback(
    overlay,
    `${KPI}.dispatchedSchool`,
    prevKpi?.finalSchools ?? base.participatingSchoolCount
  )
  const dispatchedClass = overlayNumberOrFallback(
    overlay,
    `${KPI}.dispatchedClass`,
    prevKpi?.finalClasses
  )
  const surveyKeys = surveyKeysFromOverlay(overlay)
  const sponsorIdFromOverlay = skipUnselected(overlayString(overlay, `${BASIC}.sponsorId`))
  const sponsorId = sponsorIdFromOverlay || base.sponsorId
  const managerContactIdsRaw = overlay[`${BASIC}.managerContactIds`]
  const managerContactIds = Array.isArray(managerContactIdsRaw)
    ? managerContactIdsRaw
        .map(String)
        .map(id => id.trim())
        .filter(id => id && id !== UNSELECTED)
    : []

  return {
    ...base,
    sponsorId,
    title: repKo || base.title,
    mainTitle: repKo || base.mainTitle,
    titleEn: repEn || base.titleEn,
    businessArea,
    ipOwned,
    courseDeliveredBy,
    educationProcess,
    partnerInvolvement,
    ips,
    startDate,
    endDate,
    rounds,
    detailedProgramId,
    approvedStudentCount: participantCount ?? base.approvedStudentCount,
    instructors: instructorCount ?? base.instructors,
    instructorCapacity: instructorCount ?? base.instructorCapacity,
    participatingSchoolCount: dispatchedSchool ?? base.participatingSchoolCount,
    generalSurveyMenuKeys: surveyKeys ?? base.generalSurveyMenuKeys,
    generalCommonInfo: {
      ...baseCommon,
      announcementTitle: publicProgramTitle || baseCommon?.announcementTitle,
      detailedProgramName,
      curriculumSessions,
      educationScheduleLines,
      educationScheduleMode: 'period',
      wageGradeRows,
      paymentItems,
      deductionItems,
      sponsorManagementId: sponsorId || baseCommon?.sponsorManagementId,
      sponsorManagementIds: sponsorId
        ? [sponsorId]
        : baseCommon?.sponsorManagementIds,
      sponsorManagerContactIds:
        managerContactIds.length > 0
          ? managerContactIds
          : baseCommon?.sponsorManagerContactIds,
      kpi: {
        finalParticipants: participantCount ?? 0,
        instructorCount: instructorCount ?? 0,
        volunteerCount: prevKpi?.volunteerCount ?? 0,
        finalSchools: dispatchedSchool ?? 0,
        finalClasses: dispatchedClass ?? 0,
      },
    },
  }
}
