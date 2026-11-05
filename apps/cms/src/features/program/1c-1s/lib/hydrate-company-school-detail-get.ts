/**
 * 1사1교 상세 GET 경계 — legacy overlay 를 Typed Program 으로 접는다.
 * 화면 정본은 이 함수가 채운 Program 필드다. overlay 는 sidecar + BE wire 호환만.
 *
 * CREATE applyEconomy 기본값(period 모드, 해당없음 지급, 기본 커리큘럼 제목)은 GET 에 넣지 않는다.
 * 이미 매핑된 값(빈 문자열·0·false·[] 포함)은 overlay 로 덮지 않는다.
 */
import type { Program } from '@/types/domain'
import { formatDateRangeDot, formatNumberDisplay } from '@/shared/utils'
import {
  coerceProgramPaymentItemsText,
  programPaymentItemLabelsFromIds,
  resolveProgramWageDeductionLabel,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import { applyCompanySchoolCanonicalRecruitToProgram } from './apply-company-school-canonical-recruit-to-program'
import { importLegacyOverlayToCompanySchoolCanonical } from './import-legacy-registration-overlay'
import { emptyCompanySchoolRecruitFormState } from './registration-rhf-recruitment'
import { emptyCompanySchoolInstructorRecruitFormState } from './registration-rhf-instructor-recruitment'
import { hydrateRecruitmentWindowsOntoProgram } from '@/features/program/shared/lib/hydrate-recruitment-windows'
import { preserveCompanySchoolCompatibilityOverlay } from './serialize-registration-overlay-from-canonical'
import dayjs from 'dayjs'

const BASIC = 'economyRegistration.basicInfo' as const
const KPI = 'economyRegistration.kpi' as const
const CURRICULUM = 'economyRegistration.educationCurriculum' as const
const SCHEDULE = 'economyRegistration.educationScheduleSettings' as const
const WAGE = 'economyRegistration.wageInfo' as const

const WAGE_GRADE_LABELS = ['1급 강사비', '2급 강사비', '3급 강사비'] as const

function overlayHasOwn(overlay: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(overlay, key)
}

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

function overlayNumberOrFallback(
  overlay: Record<string, unknown>,
  key: string,
  fallback: number | undefined
): number | undefined {
  if (!overlayHasOwn(overlay, key)) return fallback
  return overlayNullableNumber(overlay, key) ?? 0
}

function keepDefined<T>(mapped: T | undefined, overlayPresent: boolean, overlayValue: T): T | undefined {
  if (mapped !== undefined) return mapped
  if (overlayPresent) return overlayValue
  return undefined
}

function overlayHasRecruitKeys(overlay: Record<string, unknown>): boolean {
  return Object.keys(overlay).some(
    key =>
      key.startsWith('recruit.') ||
      key.startsWith('economyRecruit.') ||
      key.startsWith('instructorRecruit.') ||
      key.startsWith('instructor.')
  )
}

function overlayHasCurriculumKeys(overlay: Record<string, unknown>): boolean {
  return Object.keys(overlay).some(key => key.startsWith(`${CURRICULUM}.`))
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

function buildWagePricing(fee: number | undefined, distanceFee: number | undefined): string {
  const feeLabel = fee != null && Number.isFinite(fee) ? `${formatNumberDisplay(fee)}원` : '-'
  const distanceLabel =
    distanceFee != null && Number.isFinite(distanceFee)
      ? `${formatNumberDisplay(distanceFee)}원`
      : feeLabel
  return `1시간 당 | 기본 : ${feeLabel} | 장거리 : ${distanceLabel}`
}

function applyEconomyOverlayForDetailGet(
  base: Program,
  overlay: Record<string, unknown>
): Program {
  const baseCommon = base.generalCommonInfo
  const publicTitlePresent = overlayHasOwn(overlay, `${BASIC}.publicProgramTitle`)
  const announcementTitle = keepDefined(
    baseCommon?.announcementTitle,
    publicTitlePresent,
    overlayString(overlay, `${BASIC}.publicProgramTitle`)
  )

  const curriculumSessions =
    baseCommon?.curriculumSessions !== undefined
      ? baseCommon.curriculumSessions
      : overlayHasCurriculumKeys(overlay)
        ? [1, 2].map(n => ({
            sessionLabel: `${n}차시`,
            title: overlayHasOwn(overlay, `${CURRICULUM}.session${n}.title`)
              ? overlayString(overlay, `${CURRICULUM}.session${n}.title`)
              : '',
            description: overlayHasOwn(overlay, `${CURRICULUM}.session${n}.description`)
              ? overlayString(overlay, `${CURRICULUM}.session${n}.description`)
              : '',
          }))
        : baseCommon?.curriculumSessions

  const scheduleRange = readRangeSeal(overlay, `${SCHEDULE}.dateRangeSeal`)
  const educationScheduleLinesFromOverlay =
    scheduleRange != null
      ? (() => {
          const start = dayjs(scheduleRange.start)
          const end = dayjs(scheduleRange.end)
          if (!start.isValid() || !end.isValid()) return []
          const rangeLabel = formatDateRangeDot(start, end)
          return rangeLabel === '-' ? [] : [rangeLabel]
        })()
      : []
  const educationScheduleLines =
    baseCommon?.educationScheduleLines !== undefined
      ? baseCommon.educationScheduleLines
      : educationScheduleLinesFromOverlay.length > 0
        ? educationScheduleLinesFromOverlay
        : baseCommon?.educationScheduleLines
  const educationScheduleMode =
    baseCommon?.educationScheduleMode ??
    (scheduleRange != null ? ('period' as const) : undefined)

  const gradeFees = [1, 2, 3].map(n => overlayNullableNumber(overlay, `${WAGE}.grade${n}Fee`))
  const gradeDistanceFees = [1, 2, 3].map(n =>
    overlayNullableNumber(overlay, `${WAGE}.grade${n}DistanceFee`)
  )
  const hasAnyWageOverlay = gradeFees.some(v => v != null) || gradeDistanceFees.some(v => v != null)
  const wageGradeRows =
    baseCommon?.wageGradeRows != null && baseCommon.wageGradeRows.length > 0
      ? baseCommon.wageGradeRows
      : hasAnyWageOverlay
        ? WAGE_GRADE_LABELS.map((grade, index) => ({
            grade,
            pricing: buildWagePricing(gradeFees[index], gradeDistanceFees[index]),
          }))
        : baseCommon?.wageGradeRows

  const paymentItemIdsRaw = overlay[`${WAGE}.paymentItemValues`]
  const paymentItemIdsPresent = overlayHasOwn(overlay, `${WAGE}.paymentItemValues`)
  const paymentItemIds = Array.isArray(paymentItemIdsRaw)
    ? paymentItemIdsRaw.map(String)
    : undefined
  const mappedPayment = coerceProgramPaymentItemsText(baseCommon?.paymentItems).trim()
  const paymentItems =
    baseCommon?.paymentItems !== undefined
      ? baseCommon.paymentItems
      : paymentItemIdsPresent
        ? paymentItemIds && paymentItemIds.length > 0
          ? programPaymentItemLabelsFromIds(paymentItemIds)
          : undefined
        : mappedPayment || undefined
  const deductionItems =
    baseCommon?.deductionItems !== undefined
      ? baseCommon.deductionItems
      : paymentItemIdsPresent
        ? paymentItemIds && paymentItemIds.length > 0
          ? resolveProgramWageDeductionLabel(paymentItemIds)
          : undefined
        : baseCommon?.deductionItems

  const prevKpi = baseCommon?.kpi
  const hasKpiOverlay = [
    `${KPI}.participantCount`,
    `${KPI}.instructor`,
    `${KPI}.dispatchedSchool`,
    `${KPI}.dispatchedClass`,
  ].some(key => overlayHasOwn(overlay, key))
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

  const overlayRepKo = overlayHasOwn(overlay, `${BASIC}.repKo`)
    ? overlayString(overlay, `${BASIC}.repKo`)
    : ''
  const title = base.title?.trim() ? base.title : overlayRepKo || base.title

  if (
    announcementTitle === baseCommon?.announcementTitle &&
    curriculumSessions === baseCommon?.curriculumSessions &&
    educationScheduleLines === baseCommon?.educationScheduleLines &&
    educationScheduleMode === baseCommon?.educationScheduleMode &&
    wageGradeRows === baseCommon?.wageGradeRows &&
    paymentItems === baseCommon?.paymentItems &&
    deductionItems === baseCommon?.deductionItems &&
    !hasKpiOverlay &&
    title === base.title
  ) {
    return base
  }

  return {
    ...base,
    title,
    approvedStudentCount: participantCount ?? base.approvedStudentCount,
    instructors: instructorCount ?? base.instructors,
    instructorCapacity: instructorCount ?? base.instructorCapacity,
    participatingSchoolCount: dispatchedSchool ?? base.participatingSchoolCount,
    generalCommonInfo: {
      ...baseCommon,
      ...(announcementTitle !== undefined ? { announcementTitle } : {}),
      ...(curriculumSessions !== undefined ? { curriculumSessions } : {}),
      ...(educationScheduleLines !== undefined ? { educationScheduleLines } : {}),
      ...(educationScheduleMode !== undefined ? { educationScheduleMode } : {}),
      ...(wageGradeRows !== undefined ? { wageGradeRows } : {}),
      ...(paymentItems !== undefined ? { paymentItems } : {}),
      ...(deductionItems !== undefined ? { deductionItems } : {}),
      kpi: hasKpiOverlay || prevKpi
        ? {
            finalParticipants: participantCount ?? prevKpi?.finalParticipants ?? 0,
            instructorCount: instructorCount ?? prevKpi?.instructorCount ?? 0,
            volunteerCount: prevKpi?.volunteerCount ?? 0,
            finalSchools: dispatchedSchool ?? prevKpi?.finalSchools ?? 0,
            finalClasses: dispatchedClass ?? prevKpi?.finalClasses ?? 0,
          }
        : prevKpi,
    },
  }
}

export function hydrateCompanySchoolDetailFromGet(program: Program): Program {
  const rawOverlay = program.registrationOverlay ?? {}
  const canonical = importLegacyOverlayToCompanySchoolCanonical({ overlay: rawOverlay })
  const withEconomy = applyEconomyOverlayForDetailGet(program, rawOverlay)
  const withRecruit = overlayHasRecruitKeys(rawOverlay)
    ? applyCompanySchoolCanonicalRecruitToProgram(
        withEconomy,
        canonical.recruit ?? emptyCompanySchoolRecruitFormState(),
        canonical.instructorRecruit ?? emptyCompanySchoolInstructorRecruitFormState()
      )
    : withEconomy
  const withRows = hydrateRecruitmentWindowsOntoProgram(withRecruit)
  return {
    ...withRows,
    registrationOverlay: preserveCompanySchoolCompatibilityOverlay(
      { ...rawOverlay, ...canonical.sidecar },
      rawOverlay
    ),
  }
}
