import { useEffect, useMemo } from 'react'
import type { SettlementItemSettingSection } from '@/features/settlement-management/model/settlement-item-settings'
import {
  ensurePaymentItemCatalog,
  getActivePaymentItemCatalogOptions,
  getActivePaymentItemCatalogRows,
  getTemplateRegistrationPaymentItemOptions,
  LEGACY_LOCAL_PAYMENT_ITEM_OPTIONS,
  isPaymentItemCatalogReady,
  isPaymentItemCatalogRemote,
  usePaymentItemCatalogState,
  type PaymentItemCatalogState,
} from '@/features/template/lib/template-registration-payment-item-options'
import type { CmsSelectMultipleOption } from '@/shared/ui/cms-select-multiple'
import {
  LEGACY_SETTLEMENT_WITHHOLDING_ITEM_LABEL,
  SETTLEMENT_WITHHOLDING_ITEM_LABEL,
} from '@/shared/constants/settlement-item-type'

export const PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE = '__payment_none__' as const
export const PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL = '해당없음' as const
export const PROGRAM_WAGE_DEDUCTION_LABEL = SETTLEMENT_WITHHOLDING_ITEM_LABEL
export const LEGACY_PROGRAM_WAGE_DEDUCTION_LABEL = LEGACY_SETTLEMENT_WITHHOLDING_ITEM_LABEL

const PAYMENT_ITEM_CODE_RE = /^(p|w|d)-\d+$/i

function compactPaymentLabel(label: string | undefined): string {
  return (label ?? '').replace(/\s+/g, '')
}

/** settlementPolicy 한글 라벨 → 등록 지급 항목 옵션명 */
const PAYMENT_ITEM_LABEL_ALIASES: Record<string, string> = {
  교통비: '강사 교통비',
  식비: '식사비',
  활동비: '참여자 활동비',
  '교통비(일사일교)': '강사 교통비',
  '숙박비(일사일교)': '숙박비 (1사1교)',
  장거리교통비: '장거리 교통비',
}

const SETTLEMENT_ITEM_TYPE_LABEL: Record<string, string> = {
  TRANSPORTATION: '교통비',
  STUDENT_TRANSPORTATION: '학생 교통비',
  LONG_DISTANCE_TRANSPORTATION: '장거리 교통비',
  LODGING: '숙박비',
  ACTIVITY: '참여자 활동비',
  MEAL: '식비',
}

/** GET·카탈로그 paymentItemType → 프로그램 저장 canonical. 강사/학생 교통은 접지 않는다. */
const SETTLEMENT_TYPE_ALIASES: Record<string, string> = {
  TRANSPORTATION: 'TRANSPORTATION',
  TRANSPORT_INSTRUCTOR: 'TRANSPORTATION',
  STUDENT_TRANSPORTATION: 'STUDENT_TRANSPORTATION',
  TRANSPORT_STUDENT: 'STUDENT_TRANSPORTATION',
  LONG_DISTANCE_TRANSPORTATION: 'LONG_DISTANCE_TRANSPORTATION',
  LONG_DISTANCE: 'LONG_DISTANCE_TRANSPORTATION',
  LODGING: 'LODGING',
  LODGING_GENERAL: 'LODGING',
  LODGING_1C1S: 'LODGING',
  ACTIVITY: 'ACTIVITY',
  MEAL: 'MEAL',
}

function normalizePaymentTypeToken(type: string): string {
  return type.trim().toUpperCase().replace(/[\s-]+/g, '_')
}

function canonicalSettlementPaymentType(token: string): string | undefined {
  const normalized = normalizePaymentTypeToken(token)
  if (!normalized) return undefined
  return SETTLEMENT_TYPE_ALIASES[normalized]
}

function paymentTransportKind(compact: string): 'student' | 'long' | 'instructor' | 'none' {
  if (!compact.includes('교통')) return 'none'
  if (compact.includes('장거리')) return 'long'
  if (compact.includes('학생')) return 'student'
  return 'instructor'
}

function labelsCompatible(target: string, optionLabel: string): boolean {
  if (target === optionLabel) return true
  if (!target.includes(optionLabel)) return false
  const targetKind = paymentTransportKind(target)
  const optionKind = paymentTransportKind(optionLabel)
  if (targetKind !== 'none' && optionKind !== 'none' && targetKind !== optionKind) return false
  return true
}

function matchOptionIdByLabel(
  token: string,
  options: readonly CmsSelectMultipleOption[]
): string | undefined {
  const aliased = PAYMENT_ITEM_LABEL_ALIASES[compactPaymentLabel(token)] ?? token
  const target = compactPaymentLabel(aliased)
  if (!target) return undefined
  const byValue = options.find(option => option.value === token || option.value === aliased)
  if (byValue) return byValue.value
  const exact = options.find(option => compactPaymentLabel(String(option.label)) === target)
  if (exact) return exact.value
  return options
    .filter(option => {
      const label = compactPaymentLabel(String(option.label))
      return label.length > 0 && labelsCompatible(target, label)
    })
    .sort((a, b) => String(b.label).length - String(a.label).length)[0]?.value
}

function findCatalogIdForCanonicalType(
  canonical: string,
  options: readonly CmsSelectMultipleOption[]
): string | undefined {
  const byType = getActivePaymentItemCatalogRows().find(row => {
    const rowType = row.paymentItemType?.trim()
    if (!rowType) return false
    return canonicalSettlementPaymentType(rowType) === canonical
  })
  if (byType?.id) return byType.id
  const displayLabel = SETTLEMENT_ITEM_TYPE_LABEL[canonical]
  return displayLabel ? matchOptionIdByLabel(displayLabel, options) : undefined
}

function resolveTokenToPaymentItemId(
  token: string,
  options: readonly CmsSelectMultipleOption[]
): string {
  const canonical = canonicalSettlementPaymentType(token)
  if (canonical) {
    return (
      findCatalogIdForCanonicalType(canonical, options) ??
      SETTLEMENT_ITEM_TYPE_LABEL[canonical] ??
      token
    )
  }
  return matchOptionIdByLabel(token, options) ?? token
}

function paymentItemRecords(value: unknown): Array<Record<string, unknown>> | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined
  if (!value.every(item => item != null && typeof item === 'object' && !Array.isArray(item))) {
    return undefined
  }
  if (!value.some(item => 'itemType' in (item as object))) return undefined
  return value as Array<Record<string, unknown>>
}

function resolveIdsFromSettlementRecords(
  records: Array<Record<string, unknown>>,
  options: readonly CmsSelectMultipleOption[]
): string[] {
  const out: string[] = []
  for (const record of records) {
    if (record.useYn === false) continue
    const type = typeof record.itemType === 'string' ? record.itemType.trim() : ''
    if (!type) continue
    const id = resolveTokenToPaymentItemId(type, options)
    if (id && !out.includes(id)) out.push(id)
  }
  return out
}

function labelFromPaymentItemEntry(item: unknown): string {
  if (typeof item === 'string') return item.trim()
  if (typeof item === 'number' && Number.isFinite(item)) return String(item)
  if (!item || typeof item !== 'object') return ''
  const record = item as Record<string, unknown>
  if (record.useYn === false) return ''
  if (typeof record.itemType === 'string' && record.itemType.trim()) {
    const type = record.itemType.trim()
    const canonical = canonicalSettlementPaymentType(type) ?? normalizePaymentTypeToken(type)
    return SETTLEMENT_ITEM_TYPE_LABEL[canonical] ?? type
  }
  for (const key of ['label', 'name', 'itemName'] as const) {
    const raw = record[key]
    if (typeof raw === 'string' && raw.trim()) return raw.trim()
  }
  const code = record.value ?? record.code ?? record.id
  if (typeof code === 'string' && code.trim()) return code.trim()
  if (typeof code === 'number' && Number.isFinite(code)) return String(code)
  return ''
}

/**
 * 공통정보 `paymentItems`는 콤마 라벨 문자열이 기준이다.
 * GET sidecar·정산 응답이 배열이면 같은 문자열로 맞춘다.
 */
export function coerceProgramPaymentItemsText(value: unknown): string {
  if (typeof value === 'string') return value
  if (!Array.isArray(value)) return ''
  return value.map(labelFromPaymentItemEntry).filter(Boolean).join(', ')
}

function isPaymentItemCode(text: string | undefined): boolean {
  return Boolean(text && PAYMENT_ITEM_CODE_RE.test(text.trim()))
}

function noneOption(): CmsSelectMultipleOption {
  return {
    value: PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE,
    label: PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL,
  }
}

function pickBetterPaymentOption(
  current: CmsSelectMultipleOption | undefined,
  incoming: CmsSelectMultipleOption
): CmsSelectMultipleOption {
  const incomingLabel = incoming.label?.trim() || incoming.value
  if (!current) {
    return { ...incoming, label: incomingLabel }
  }
  const currentLabel = current.label?.trim() || current.value
  const incomingIsCode = incomingLabel === incoming.value || isPaymentItemCode(incomingLabel)
  if (incomingIsCode && currentLabel !== current.value && !isPaymentItemCode(currentLabel)) {
    return { ...incoming, label: currentLabel }
  }
  return { ...current, ...incoming, label: incomingIsCode ? currentLabel : incomingLabel }
}

/**
 * 전달 옵션 + 「해당없음」.
 * 백엔드 미설정 로컬 mock 환경에서만 mock 항목을 함께 합친다(실 API 환경에 mock id 노출 금지).
 */
export function mergeProgramWagePaymentItemOptions(
  preferred: readonly CmsSelectMultipleOption[] = []
): CmsSelectMultipleOption[] {
  const base = isPaymentItemCatalogRemote() ? [] : getActivePaymentItemCatalogOptions()
  const byValue = new Map<string, CmsSelectMultipleOption>()
  for (const option of base) {
    byValue.set(option.value, pickBetterPaymentOption(byValue.get(option.value), option))
  }
  for (const option of preferred) {
    byValue.set(option.value, pickBetterPaymentOption(byValue.get(option.value), option))
  }
  byValue.set(PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE, noneOption())
  return [...byValue.values()]
}

export function getProgramWagePaymentItemOptions(
  sections?: readonly SettlementItemSettingSection[]
): CmsSelectMultipleOption[] {
  return mergeProgramWagePaymentItemOptions(
    sections ? getTemplateRegistrationPaymentItemOptions(sections) : getActivePaymentItemCatalogOptions()
  )
}

export type ProgramWagePaymentItemOptionsState = PaymentItemCatalogState

const COMPANY_SCHOOL_ONLY_PAYMENT_LABEL = /\((1사1교|일사일교)\)/

/** 1사1교 전용 지급 항목(예: 「숙박비 (1사1교)」)인지 — 라벨 기준 */
export function isCompanySchoolOnlyPaymentItemOption(option: CmsSelectMultipleOption): boolean {
  return COMPANY_SCHOOL_ONLY_PAYMENT_LABEL.test(String(option.label ?? '').replace(/\s+/g, ''))
}

/**
 * R14: 일반 프로그램 지급 항목 옵션에서 1사1교 전용 항목을 뺀다.
 * 이미 선택된 값은 표시·저장값 보존을 위해 남긴다(기존 데이터 변경 금지).
 */
export function excludeCompanySchoolOnlyPaymentItemOptions(
  options: readonly CmsSelectMultipleOption[],
  selectedValues: readonly string[] | undefined = []
): CmsSelectMultipleOption[] {
  const selected = new Set(selectedValues ?? [])
  return options.filter(
    option => selected.has(option.value) || !isCompanySchoolOnlyPaymentItemOption(option)
  )
}

/** 정산 항목 설정(지급) 목록 + 「해당없음」 + 로딩·실패 상태 — 등록·상세 편집 UI용 */
export function useProgramWagePaymentItemOptionsState(
  catalogEnabled = true
): ProgramWagePaymentItemOptionsState {
  const catalog = usePaymentItemCatalogState(catalogEnabled)
  return useMemo(
    () => ({
      ...catalog,
      options: catalog.ready ? mergeProgramWagePaymentItemOptions(catalog.options) : [],
    }),
    [catalog]
  )
}

export function useProgramWagePaymentItemOptions(): CmsSelectMultipleOption[] {
  return useProgramWagePaymentItemOptionsState().options
}

/** 예전 FE mock id → 항목명 (실 API 카탈로그 교정용). */
const LEGACY_MOCK_PAYMENT_ITEM_ID_TO_LABEL: Record<string, string> = {
  'p-1': '강사 교통비',
  'p-3': '숙박비',
  'p-6': '참여자 활동비',
  'p-7': '숙박비 (1사1교)',
}

/** 예전 mock 지급 항목 id(`p-1` 등) → mock 항목명. 실제 항목으로 교정할 때 라벨 키로만 쓴다. */
function legacyMockPaymentItemLabel(id: string): string | undefined {
  const legacy = LEGACY_MOCK_PAYMENT_ITEM_ID_TO_LABEL[id]
  if (legacy) return legacy
  return getActivePaymentItemCatalogOptions().find(option => option.value === id)?.label
}

/** 현재 카탈로그에서 항목명으로 지급 항목 id 찾기 (공백 무시) */
export function findProgramPaymentItemIdByLabel(label: string): string | undefined {
  return matchOptionIdByLabel(label, getActivePaymentItemCatalogOptions())
}

/**
 * 저장된 지급 항목 id를 현재 정산 지급 항목 id로 교정한다.
 * - 현재 목록에 있으면 유지, 예전 mock id는 mock 항목명으로 실제 항목을 찾아 바꾼다.
 * - 찾지 못한 id는 제거한다(재선택 유도).
 * - 실제 목록을 아직 모르면(응답 전) 판정하지 않고 그대로 둔다.
 */
function isLegacyMockPaymentItemId(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(LEGACY_MOCK_PAYMENT_ITEM_ID_TO_LABEL, id)
}

export function normalizeProgramPaymentItemIds(ids: readonly unknown[]): string[] {
  const tokens = ids.map(id => String(id ?? '').trim()).filter(Boolean)
  if (!isPaymentItemCatalogReady()) return tokens
  const options = getActivePaymentItemCatalogOptions()
  const known = new Set(options.map(option => option.value))
  const out: string[] = []
  for (const id of tokens) {
    let next: string | undefined
    if (id === PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE || known.has(id)) {
      next = id
    } else {
      const legacyLabel = legacyMockPaymentItemLabel(id)
      next = legacyLabel ? findProgramPaymentItemIdByLabel(legacyLabel) : undefined
      if (!next) {
        const canonical = canonicalSettlementPaymentType(id)
        next = canonical ? findCatalogIdForCanonicalType(canonical, options) : undefined
      }
      if (!next) next = findProgramPaymentItemIdByLabel(id)
      if (!next && !isLegacyMockPaymentItemId(id)) {
        next = id
      }
    }
    if (next && !out.includes(next)) out.push(next)
  }
  return out
}

function sameIds(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index])
}

/** 화면 진입 시 저장값(임시저장·템플릿·기존 프로그램)을 실제 지급 항목 id로 교정 */
export function useNormalizeProgramPaymentItemValues(
  values: readonly string[] | undefined,
  setValues: (next: string[]) => void,
  catalogReady: boolean
): void {
  useEffect(() => {
    if (!catalogReady || !Array.isArray(values) || values.length === 0) return
    const next = normalizeProgramPaymentItemIds(values)
    if (!sameIds(values, next)) setValues(next)
  }, [catalogReady, values, setValues])
}

export type PaymentItemOverlayField = {
  valuesKey: string
  /** 같이 저장하는 라벨 문자열 키 (일반 등록 `paymentItemLabels`) */
  labelsKey?: string
}

export type PaymentItemOverlayNormalization = {
  patch: Record<string, unknown>
  /** 저장값이 있었지만 실제 항목을 하나도 찾지 못한 필드 */
  clearedKeys: string[]
}

/**
 * 등록 제출 직전 — 실제 지급 항목 목록을 불러온 뒤 overlay 지급 항목 id를 교정한다.
 * 호출부는 `patch`를 overlay에 반영하고, `clearedKeys`가 있으면 재선택을 안내하고 제출을 멈춘다.
 */
export async function normalizeOverlayPaymentItemsBeforeSubmit(
  overlay: Record<string, unknown>,
  fields: readonly PaymentItemOverlayField[]
): Promise<PaymentItemOverlayNormalization> {
  await ensurePaymentItemCatalog()
  const patch: Record<string, unknown> = {}
  const clearedKeys: string[] = []
  for (const { valuesKey, labelsKey } of fields) {
    const raw = overlay[valuesKey]
    if (!Array.isArray(raw)) continue
    const current = raw.map(id => String(id ?? '').trim()).filter(Boolean)
    const next = normalizeProgramPaymentItemIds(current)
    if (sameIds(current, next)) continue
    patch[valuesKey] = next
    if (labelsKey) {
      patch[labelsKey] = programPaymentItemLabelsFromIds(next) || PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL
    }
    if (current.length > 0 && next.length === 0) clearedKeys.push(valuesKey)
  }
  return { patch, clearedKeys }
}

export const PAYMENT_ITEM_RESELECT_ALERT = {
  title: '지급 항목 확인 필요',
  content: '저장된 지급 항목이 현재 정산 항목 설정에 없습니다. 임금 정보에서 지급 항목을 다시 선택해 주세요.',
} as const

export function isProgramPaymentNoneOnly(ids: string[] | undefined): boolean {
  return ids?.length === 1 && ids[0] === PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE
}

export function resolveProgramWageDeductionLabel(paymentItemIds: string[] | undefined): string {
  if (isProgramPaymentNoneOnly(paymentItemIds)) return PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL
  if (!paymentItemIds?.length) return PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL
  if (paymentItemIds.includes(PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE)) {
    return PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL
  }
  return PROGRAM_WAGE_DEDUCTION_LABEL
}

export function resolveProgramPaymentItemLabel(
  id: string | undefined,
  sections?: readonly SettlementItemSettingSection[]
): string {
  const token = id?.trim() ?? ''
  if (!token) return ''
  if (token === PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE) return PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL
  const options = getProgramWagePaymentItemOptions(sections)
  return options.find(o => o.value === token)?.label || legacyMockPaymentItemLabel(token) || token
}

export function programPaymentItemLabelsFromIds(
  ids: string[] | undefined,
  sections?: readonly SettlementItemSettingSection[]
): string {
  if (!ids?.length) return ''
  if (isProgramPaymentNoneOnly(ids)) return PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL
  return ids
    .map(id => resolveProgramPaymentItemLabel(id, sections))
    .filter(Boolean)
    .join(', ')
}

export function resolveProgramPaymentItemIdsFromLabels(
  paymentItems: unknown,
  sections?: readonly SettlementItemSettingSection[]
): string[] {
  const text = coerceProgramPaymentItemsText(paymentItems)
  if (!text.trim()) return []
  if (
    text.trim() === PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL ||
    text.includes('해당없음')
  ) {
    return [PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE]
  }
  // 실제 목록 응답 전에는 항목명 보존용으로 mock 카탈로그를 쓴다. 이 id는 화면 진입·제출 시 실제 id로 교정된다.
  const options =
    sections || isPaymentItemCatalogReady()
      ? getProgramWagePaymentItemOptions(sections)
      : mergeProgramWagePaymentItemOptions(
          isPaymentItemCatalogRemote()
            ? LEGACY_LOCAL_PAYMENT_ITEM_OPTIONS
            : getTemplateRegistrationPaymentItemOptions()
        )
  const records = paymentItemRecords(paymentItems)
  if (records) return resolveIdsFromSettlementRecords(records, options)

  return text
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(token => resolveTokenToPaymentItemId(token, options))
    .filter((v, index, all): v is string => Boolean(v) && all.indexOf(v) === index)
}

export function normalizeProgramPaymentItemSelection(next: string[], prev: string[]): string[] {
  const none = PROGRAM_WAGE_PAYMENT_ITEM_NONE_VALUE
  if (next.includes(none) && !prev.includes(none)) return [none]
  if (next.length > 1 && next.includes(none)) return next.filter(v => v !== none)
  return next
}
