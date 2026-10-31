import { toSeoulYmd } from '@/features/program/ujat/api/applications-adapters'
import {
  parseUjatScheduleConfirmStatus,
  type UjatOrganizationApplicationDetail,
} from '@/features/program/ujat/api/ujat-applications-contract'
import type { UjatOrganizationScheduleResponse } from '@/features/program/ujat/api/temporary-schedule-api'
import {
  findUjatEducationRegionKeyByCode,
  getUjatEducationRegionLabel,
} from '@/features/program/ujat/lib/ujat-education-regions'
import type { TextbookDeliveryStatus } from '@/shared/components/delivery-status-badge'
import { formatUjatPreferredEducationDateDisplay } from '../education-schedule'
import { formatUjatGradeClassDisplayLabelFromParts } from '@/features/program/ujat/lib/ujat-grade-class-display'
import type { UjatInstitutionApplicationRow } from '../list/types'
import type { UjatInstitutionApplicationDetail } from '../detail/detail-types'
import type { UjatInstitutionApplicationGradeBlockDetail } from '../detail/detail-types'
import type {
  ScheduleConfirmTextbookInfo,
  UjatScheduleConfirmConfirmedDetail,
  UjatScheduleConfirmEducationScheduleDay,
  UjatScheduleConfirmGuidanceNotes,
} from './confirmed-detail-types'

function displayOrDash(value: string | null | undefined): string {
  return value?.trim() || '-'
}

function ownString(source: object | null | undefined, key: string): string | null {
  if (!source || !Object.prototype.hasOwnProperty.call(source, key)) return null
  const value = (source as Record<string, unknown>)[key]
  return typeof value === 'string' ? value : null
}

function mapDeliveryStatus(value: string | null | undefined): TextbookDeliveryStatus | null {
  const normalized = value?.trim().toLowerCase().replace(/-/g, '_')
  if (
    normalized === 'before_shipping' ||
    normalized === 'preparing' ||
    normalized === 'before_delivery'
  ) {
    return 'before_shipping'
  }
  if (normalized === 'shipping' || normalized === 'in_transit') return 'shipping'
  if (normalized === 'delivered' || normalized === 'complete') return 'delivered'
  return null
}

function formatKitSummary(kits: number | null | undefined, quantity: number | null | undefined): string {
  const kitLabel = typeof kits === 'number' ? `${kits}키트` : ''
  const quantityLabel = typeof quantity === 'number' ? `(${quantity}권)` : ''
  return [kitLabel, quantityLabel].filter(Boolean).join(' ').trim()
}

function numericOrNull(value: number | null | undefined): number | null {
  return typeof value === 'number' ? value : null
}

function hasOwnGradeTextbook(block: UjatInstitutionApplicationGradeBlockDetail): boolean {
  return (
    block.textbookName !== undefined ||
    block.textbookNameEn !== undefined ||
    block.kitCount !== undefined ||
    block.bookCount !== undefined ||
    block.textbookDeliveryStatus !== undefined
  )
}

function mapTextbookForGrade(
  dto: UjatOrganizationApplicationDetail | null | undefined,
  block: UjatInstitutionApplicationGradeBlockDetail
): ScheduleConfirmTextbookInfo | null {
  const useBlock = hasOwnGradeTextbook(block)
  const rootGrade = dto?.textbookGrade?.trim()
  if (!useBlock && rootGrade && rootGrade !== block.gradeLabel) return null

  const textbookName = displayOrDash(
    useBlock ? block.textbookName : (dto?.textbookDisplayLabel ?? dto?.textbookName)
  )
  const kitSummary = formatKitSummary(
    useBlock
      ? numericOrNull(block.kitCount)
      : numericOrNull(dto?.kitCount) ?? numericOrNull(dto?.textbookKits),
    useBlock
      ? numericOrNull(block.bookCount)
      : numericOrNull(dto?.bookCount) ?? numericOrNull(dto?.textbookQuantity)
  )
  const deliveryStatus = mapDeliveryStatus(
    useBlock
      ? block.textbookDeliveryStatus
      : ownString(dto, 'textbookDeliveryStatus') ?? ownString(dto, 'deliveryStatus')
  )

  if (textbookName === '-' && !kitSummary && !deliveryStatus) return null
  return {
    textbookName,
    kitSummary,
    deliveryStatus,
  }
}

function slotClassLabel(slot: {
  classLabel?: string | null
  grade?: string | null
  className?: string | null
}): string | null {
  const labeled = slot.classLabel?.trim()
  if (labeled) return formatUjatGradeClassDisplayLabelFromParts(labeled, null)
  const formatted = formatUjatGradeClassDisplayLabelFromParts(slot.grade, slot.className)
  return formatted === '-' ? null : formatted
}

function classLabelSortKey(label: string): { grade: number; classNo: number } {
  const gradeMatch = label.match(/(\d+)\s*학년/)
  const classMatch = label.match(/(\d+)\s*반/)
  return {
    grade: gradeMatch ? Number(gradeMatch[1]) : 0,
    classNo: classMatch ? Number(classMatch[1]) : 0,
  }
}

export function buildEducationScheduleDaysFromTemporarySchedule(
  schedule: UjatOrganizationScheduleResponse | null | undefined
): UjatScheduleConfirmEducationScheduleDay[] {
  const grouped = new Map<string, string[]>()

  for (const slot of schedule?.slots ?? []) {
    const iso = toSeoulYmd(slot.scheduleStartAt)
    const label = slotClassLabel(slot)
    if (!iso || !label) continue
    const labels = grouped.get(iso) ?? []
    if (!labels.includes(label)) labels.push(label)
    grouped.set(iso, labels)
  }

  return [...grouped.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([iso, labels]) => ({
      dateLabel: formatUjatPreferredEducationDateDisplay(iso),
      classLabels: [...labels].sort((a, b) => {
        const left = classLabelSortKey(a)
        const right = classLabelSortKey(b)
        return left.grade - right.grade || left.classNo - right.classNo
      }),
    }))
}

/**
 * 간식 제공 가능 여부 — 시안 표시값 `가능` / `불가`.
 * wire: possible|impossible · 포털 라디오 문구 · 한글 단축.
 */
export function mapSnackAvailabilityLabel(raw: string | null | undefined): string | null {
  const snack = raw?.trim().toLowerCase() ?? ''
  if (!snack) return null
  if (
    snack === 'possible' ||
    snack === '가능' ||
    snack.includes('가능합니다') ||
    snack === 'yes'
  ) {
    return '가능'
  }
  if (
    snack === 'impossible' ||
    snack === '불가' ||
    snack === '불가능' ||
    snack.includes('불가능합니다') ||
    snack === 'no'
  ) {
    return '불가'
  }
  return raw?.trim() || null
}

function mapSnackAvailability(dto: UjatOrganizationApplicationDetail | null | undefined): string {
  // OpenAPI: snackAvailability = possible|impossible|null. mealNotice와 혼용하지 않는다.
  // 스펙 필드가 생성 타입에 아직 없을 수 있어 ownString으로만 읽는다.
  const fromField = mapSnackAvailabilityLabel(ownString(dto, 'snackAvailability'))
  if (fromField) return fromField
  const fromNotice = mapSnackAvailabilityLabel(ownString(dto, 'snackNotice'))
  if (fromNotice) return fromNotice
  return '-'
}

function mapSexOffenderCheckLabel(raw: string | null | undefined): string {
  const trimmed = raw?.trim()
  if (!trimmed) return '-'
  const parts = trimmed
    .split('|')
    .map(part => part.trim())
    .filter(Boolean)
  // wire enum만 온 경우 시안 라벨로
  if (parts.length === 1) {
    const token = parts[0]!.toLowerCase().replace(/-/g, '_')
    if (token === 'online' || token === 'online_submit') return '온라인 제출'
    if (token === 'direct' || token === 'direct_submit') return '직접 제출'
    if (token === 'ja_system') return 'JA 시스템 내에서 동의서 확인'
    if (token === 'no_submit') return '동의서 미제출'
    if (token === 'request') return '동의서 제출 요청'
  }
  return trimmed
}

/** 안내 사항 — detail API 프로젝션만 사용 (mealNotice≠간식). */
export function mapUjatOrganizationGuidanceNotes(
  dto: UjatOrganizationApplicationDetail | null | undefined
): UjatScheduleConfirmGuidanceNotes {
  return {
    searchDeviceGrade6: displayOrDash(dto?.computerInRoom),
    waitingArea: displayOrDash(dto?.waitingRoomLocation),
    textbookDisposalLocation: displayOrDash(
      ownString(dto, 'leftoverTextbookDisposal') ?? dto?.mealNotice
    ),
    otherSpecialNotes: displayOrDash(dto?.parkingInfo),
    snackAvailability: mapSnackAvailability(dto),
    sexOffenderCheck: mapSexOffenderCheckLabel(ownString(dto, 'sexOffenseCheckRequest')),
  }
}

function regionLabelFromDto(
  dto: UjatOrganizationApplicationDetail | null | undefined,
  fallback: string
): string {
  const code = dto?.educationRegionCode?.trim()
  if (!code) return displayOrDash(fallback)
  const regionKey = findUjatEducationRegionKeyByCode(code)
  if (!regionKey) return '-'
  return getUjatEducationRegionLabel(regionKey, '-')
}

export function buildUjatScheduleConfirmConfirmedDetail(
  row: UjatInstitutionApplicationRow | null,
  baseDetail?: UjatInstitutionApplicationDetail | null,
  dto?: UjatOrganizationApplicationDetail | null,
  temporarySchedule?: UjatOrganizationScheduleResponse | null
): UjatScheduleConfirmConfirmedDetail | null {
  if (!row || !baseDetail) return null

  const scheduleConfirmStatus =
    parseUjatScheduleConfirmStatus(dto?.scheduleConfirmStatus) ?? row.scheduleConfirmStatus ?? null

  return {
    scheduleConfirmStatus,
    institutionName: displayOrDash(dto?.organizationName ?? baseDetail.institutionName),
    regionLabel: regionLabelFromDto(dto, baseDetail.regionLabel),
    address: displayOrDash(dto ? dto.organizationAddress : baseDetail.address),
    addressDetail: displayOrDash(dto ? dto.organizationAddressDetail : baseDetail.addressDetail),
    teacherContact: baseDetail.teacherContact,
    otherRequests: displayOrDash(baseDetail.otherRequests),
    gradeEducationBlocks: baseDetail.gradeBlocks.map(block => ({
      ...block,
      textbook: mapTextbookForGrade(dto, block),
    })),
    classTimeRows: baseDetail.classTimeRows,
    preferredEducationDates: [...(baseDetail.preferredEducationDates ?? [])],
    educationScheduleDays: buildEducationScheduleDaysFromTemporarySchedule(temporarySchedule),
    guidanceNotes: mapUjatOrganizationGuidanceNotes(dto),
  }
}
