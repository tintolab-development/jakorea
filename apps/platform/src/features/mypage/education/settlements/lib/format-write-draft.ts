import type { SettlementTripLegDraft, SettlementWriteDraft } from '../model/write-draft.ts'
import { SETTLEMENT_TRANSIT_OPTIONS, SETTLEMENT_TRIP_TYPE_OPTIONS } from './settlement-options.ts'
import { isInstructorTransportSectionVisible } from './instructor-transport-preview.ts'
import { isTransportPaymentItemType } from './payment-items.ts'
import { readTripLegFileNames } from './empty-trip-leg.ts'

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

export function parseSettlementAmount(value: string): number {
  const n = Number(digitsOnly(value))
  return Number.isFinite(n) ? n : 0
}

/** 지급조서 식사비 안내 문구(시간 당 최대 3만원)와 동일한 상한 */
export const INSTRUCTOR_MEAL_MAX_WON = 30_000

export function readPositiveWonLimit(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return null
  return Math.floor(value)
}

export function formatSettlementAmountInput(
  value: string,
  maxWon?: number | null,
): string {
  const digits = digitsOnly(value)
  if (!digits) return ''
  let amount = Number(digits)
  if (!Number.isFinite(amount)) return ''
  const limit = readPositiveWonLimit(maxWon)
  if (limit != null && amount > limit) amount = limit
  return amount.toLocaleString('ko-KR')
}

export function formatSettlementAmountDisplay(value: string): string {
  const amount = parseSettlementAmount(value)
  if (amount <= 0) return ''
  return `${amount.toLocaleString('ko-KR')}원`
}

export function resolveSettlementTransitLabel(transit: string): string {
  return SETTLEMENT_TRANSIT_OPTIONS.find(option => option.value === transit)?.label ?? transit
}

export function resolveSettlementTripTypeLabel(tripType: SettlementWriteDraft['transport']['tripType']): string {
  return SETTLEMENT_TRIP_TYPE_OPTIONS.find(option => option.value === tripType)?.label ?? tripType
}

export function formatSettlementAccountInfo(draft: SettlementWriteDraft): string {
  const { bank, accountNumber, accountHolder } = draft.basic
  return `${bank.trim()} ${accountNumber} (${accountHolder})`
}

export function formatSettlementHomeAddress(draft: SettlementWriteDraft): string {
  const { homeAddress, homeAddressDetail } = draft.basic
  if (homeAddress && homeAddressDetail) {
    return `${homeAddress} ${homeAddressDetail}`
  }
  return homeAddress || homeAddressDetail
}

export function formatSettlementResidentNumber(draft: SettlementWriteDraft): string {
  const front = draft.basic.residentFront.trim()
  const back = draft.basic.residentBack.trim()
  if (!front && !back) return ''
  if (front && back) return `${front} - ${back}`
  return front || back
}

export function formatSettlementFileNames(fileNames: string[]): string {
  return fileNames.join(', ')
}

export function formatSettlementGradeLabel(raw: string | null | undefined): string {
  const trimmed = raw?.trim() ?? ''
  if (!trimmed) return ''
  return trimmed.endsWith('학년') ? trimmed : `${trimmed}학년`
}

/** 기관 프로그램은 `학교명 학년`. 개인형은 기관명이 없으므로 프로그램명. */
export function formatSettlementSessionBannerTitle(
  session: { institutionName?: string | null; grade?: string | null } | undefined,
  programTitle?: string,
  options?: { institutionOnly?: boolean },
): string {
  const institutionName = session?.institutionName?.trim() ?? ''
  const grade = formatSettlementGradeLabel(session?.grade)
  const institutionTitle = [institutionName, grade].filter(Boolean).join(' ')
  const programName = programTitle?.trim() ?? ''
  if (options?.institutionOnly) return institutionTitle || programName || '-'
  if (institutionTitle) return institutionTitle
  return programName
}

export function formatSettlementEducationSessionProgress(
  session: { sessionNumber?: number; sessionMeta?: string } | undefined,
): string {
  if (!session) return ''
  const sessionLabel =
    typeof session.sessionNumber === 'number' && session.sessionNumber > 0
      ? `${session.sessionNumber}차시`
      : ''
  const timeMatch = session.sessionMeta?.trim().match(/(\d{2}:\d{2})\s*[~\-–]\s*(\d{2}:\d{2})/)
  const time = timeMatch ? `${timeMatch[1]} ~ ${timeMatch[2]}` : ''
  return [sessionLabel, time].filter(Boolean).join(', ')
}

export function isSettlementTripLegStarted(leg: SettlementTripLegDraft): boolean {
  return (
    leg.transit.trim() !== '' ||
    parseSettlementAmount(leg.amount) > 0 ||
    readTripLegFileNames(leg).length > 0
  )
}

export function computeSettlementTransportTotal(draft: SettlementWriteDraft): number {
  const depart = parseSettlementAmount(draft.transport.depart.amount)
  const back =
    draft.transport.tripType === 'round_trip'
      ? parseSettlementAmount(draft.transport.return.amount)
      : 0
  return depart + back
}

export function isReceiptWriteDraft(draft: SettlementWriteDraft): boolean {
  return draft.meta.documentKind === 'receipt'
}

function isTransportEnabled(draft: SettlementWriteDraft): boolean {
  if (draft.transport.itemType) return true
  return draft.enabledItemTypes.some(type => isTransportPaymentItemType(type))
}

export function hasSettlementTransportSection(draft: SettlementWriteDraft): boolean {
  const { depart, return: returnLeg, tripType } = draft.transport
  const returnStarted = tripType === 'round_trip' && isSettlementTripLegStarted(returnLeg)
  const started = isSettlementTripLegStarted(depart) || returnStarted
  if (isReceiptWriteDraft(draft)) {
    return isTransportEnabled(draft) && started
  }
  if (draft.meta.isInstructor) {
    return isInstructorTransportSectionVisible(draft.transport.autoPreview)
  }
  return started
}

export function hasSettlementMealSection(draft: SettlementWriteDraft): boolean {
  if (isReceiptWriteDraft(draft)) {
    return draft.extraItems.some(
      item =>
        item.itemType === 'MEAL' &&
        (parseSettlementAmount(item.amount) > 0 || item.attachments.length > 0)
    )
  }
  return (
    parseSettlementAmount(draft.meal.amount) > 0 ||
    (draft.meal.fileNames?.length ?? 0) > 0 ||
    (draft.meal.attachments?.length ?? 0) > 0
  )
}

export function hasSettlementActivitySection(draft: SettlementWriteDraft): boolean {
  if (isReceiptWriteDraft(draft)) {
    return draft.extraItems.some(
      item =>
        item.itemType === 'ACTIVITY' &&
        (parseSettlementAmount(item.amount) > 0 || item.attachments.length > 0)
    )
  }
  return (
    parseSettlementAmount(draft.activity.amount) > 0 ||
    (draft.activity.fileNames?.length ?? 0) > 0 ||
    (draft.activity.attachments?.length ?? 0) > 0
  )
}

/** 지급조서 확인 기본정보 — 신청한 항목명으로 `교통비, 식사비 지급` */
export function formatSettlementPaymentPurpose(draft: SettlementWriteDraft): string {
  const names: string[] = []
  const returnStarted =
    draft.transport.tripType === 'round_trip' &&
    isSettlementTripLegStarted(draft.transport.return)
  if (
    isSettlementTripLegStarted(draft.transport.depart) ||
    returnStarted ||
    (draft.meta.isInstructor &&
      isInstructorTransportSectionVisible(draft.transport.autoPreview))
  ) {
    names.push('교통비')
  }
  if (hasSettlementMealSection(draft)) names.push('식사비')
  if (hasSettlementActivitySection(draft)) names.push('활동비')
  if (draft.companySchoolLodging?.requested) names.push('숙박비')
  if (names.length === 0) return ''
  return `${names.join(', ')} 지급`
}

export function startedReceiptExtraItems(draft: SettlementWriteDraft) {
  return draft.extraItems.filter(
    item => parseSettlementAmount(item.amount) > 0 || item.attachments.length > 0
  )
}
