import type { SettlementTripLegDraft, SettlementWriteDraft } from '../model/write-draft'
import {
  SETTLEMENT_BANK_OPTIONS,
  SETTLEMENT_TRANSIT_OPTIONS,
  SETTLEMENT_TRIP_TYPE_OPTIONS,
} from './settlement-options'

export function digitsOnly(value: string): string {
  return value.replace(/\D/g, '')
}

export function parseSettlementAmount(value: string): number {
  const n = Number(digitsOnly(value))
  return Number.isFinite(n) ? n : 0
}

export function formatSettlementAmountInput(value: string): string {
  const digits = digitsOnly(value)
  if (!digits) return ''
  return Number(digits).toLocaleString('ko-KR')
}

export function formatSettlementAmountDisplay(value: string): string {
  const amount = parseSettlementAmount(value)
  if (amount <= 0) return ''
  return `${amount.toLocaleString('ko-KR')}원`
}

export function resolveSettlementBankLabel(bank: string): string {
  return SETTLEMENT_BANK_OPTIONS.find(option => option.value === bank)?.label ?? bank
}

export function resolveSettlementTransitLabel(transit: string): string {
  return SETTLEMENT_TRANSIT_OPTIONS.find(option => option.value === transit)?.label ?? transit
}

export function resolveSettlementTripTypeLabel(tripType: SettlementWriteDraft['transport']['tripType']): string {
  return SETTLEMENT_TRIP_TYPE_OPTIONS.find(option => option.value === tripType)?.label ?? tripType
}

export function formatSettlementAccountInfo(draft: SettlementWriteDraft): string {
  const { bank, accountNumber, accountHolder } = draft.basic
  return `${resolveSettlementBankLabel(bank)} ${accountNumber} (${accountHolder})`
}

export function formatSettlementHomeAddress(draft: SettlementWriteDraft): string {
  const { homeAddress, homeAddressDetail } = draft.basic
  if (homeAddress && homeAddressDetail) {
    return `${homeAddress} ${homeAddressDetail}`
  }
  return homeAddress || homeAddressDetail
}

export function formatSettlementResidentNumber(draft: SettlementWriteDraft): string {
  return `${draft.basic.residentFront} - ${draft.basic.residentBack}`
}

export function formatSettlementFileNames(fileNames: string[]): string {
  return fileNames.join(', ')
}

export function isSettlementTripLegStarted(leg: SettlementTripLegDraft): boolean {
  return (
    leg.transit.trim() !== '' ||
    parseSettlementAmount(leg.amount) > 0 ||
    leg.fileNames.length > 0
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

export function hasSettlementTransportSection(draft: SettlementWriteDraft): boolean {
  const { depart, return: returnLeg, tripType } = draft.transport
  const returnStarted = tripType === 'round_trip' && isSettlementTripLegStarted(returnLeg)
  return isSettlementTripLegStarted(depart) || returnStarted || draft.meta.isInstructor
}

export function hasSettlementMealSection(draft: SettlementWriteDraft): boolean {
  return parseSettlementAmount(draft.meal.amount) > 0 || draft.meal.fileNames.length > 0
}

export function hasSettlementActivitySection(draft: SettlementWriteDraft): boolean {
  return parseSettlementAmount(draft.activity.amount) > 0 || draft.activity.fileNames.length > 0
}
