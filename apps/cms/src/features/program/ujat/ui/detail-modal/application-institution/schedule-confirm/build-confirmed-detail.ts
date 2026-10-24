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
import type { UjatInstitutionApplicationRow } from '../list/types'
import type { UjatInstitutionApplicationDetail } from '../detail/detail-types'
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

function mapTextbookForGrade(
  dto: UjatOrganizationApplicationDetail | null | undefined,
  gradeLabel: string
): ScheduleConfirmTextbookInfo | null {
  if (!dto) return null
  const textbookGrade = dto.textbookGrade?.trim()
  if (textbookGrade && textbookGrade !== gradeLabel) return null

  const textbookName = displayOrDash(dto.textbookDisplayLabel ?? dto.textbookName)
  const kitSummary = formatKitSummary(dto.textbookKits, dto.textbookQuantity)
  const deliveryStatus = mapDeliveryStatus(
    ownString(dto, 'textbookDeliveryStatus') ?? ownString(dto, 'deliveryStatus')
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
  if (labeled) return labeled
  const grade = slot.grade?.trim()
  const className = slot.className?.trim()
  if (grade && className) return `${grade} ${className}`
  return grade || className || null
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

function mapSnackAvailability(dto: UjatOrganizationApplicationDetail | null | undefined): string {
  const snack = ownString(dto, 'snackAvailability')?.trim().toLowerCase()
  if (snack === 'possible' || snack === '가능') return '가능'
  if (snack === 'impossible' || snack === '불가' || snack === '불가능') return '불가'
  const snackNotice = ownString(dto, 'snackNotice')
  if (snackNotice?.trim()) return snackNotice.trim()
  return '-'
}

function mapGuidanceNotes(
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
    sexOffenderCheck: displayOrDash(ownString(dto, 'sexOffenseCheckRequest')),
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
      textbook: mapTextbookForGrade(dto, block.gradeLabel),
    })),
    classTimeRows: baseDetail.classTimeRows,
    educationScheduleDays: buildEducationScheduleDaysFromTemporarySchedule(temporarySchedule),
    guidanceNotes: mapGuidanceNotes(dto),
  }
}
