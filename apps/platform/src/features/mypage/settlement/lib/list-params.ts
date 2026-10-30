import { MYPAGE_SETTLEMENT_PATH } from '../../lib/constants.ts'
import type {
  SettlementOverviewParams,
  SettlementOverviewStatus,
  SettlementOverviewStatusFilter,
  SettlementOverviewView,
} from '../model/types.ts'
import { defaultDateInMonth, formatMonthKey, parseDateKey, parseMonthKey } from './date-keys.ts'

const VALID_VIEWS = new Set<SettlementOverviewView>(['list', 'calendar'])
const VALID_STATUSES = new Set<SettlementOverviewStatus>([
  'waiting_confirm',
  'confirmed',
  'paid',
  'rejected',
  'correction_requested',
  'reapplied',
])

export function defaultSettlementOverviewParams(now = new Date()): SettlementOverviewParams {
  const month = formatMonthKey(now)
  return {
    view: 'list',
    month,
    date: defaultDateInMonth(month, now),
    q: '',
    status: 'all',
    fixture: false,
  }
}

function parseView(value: string | null): SettlementOverviewView {
  if (value && VALID_VIEWS.has(value as SettlementOverviewView)) {
    return value as SettlementOverviewView
  }
  return 'list'
}

function parseStatus(value: string | null): SettlementOverviewStatusFilter {
  if (value && VALID_STATUSES.has(value as SettlementOverviewStatus)) {
    return value as SettlementOverviewStatus
  }
  return 'all'
}

export function readSettlementOverviewParams(
  search = typeof window === 'undefined' ? '' : window.location.search,
  now = new Date(),
): SettlementOverviewParams {
  const params = new URLSearchParams(search)
  const fixture = params.get('fixture') === '1'
  const fallbackMonth = fixture ? '2026-01' : formatMonthKey(now)
  const month = parseMonthKey(params.get('month') ?? '') ? (params.get('month') as string) : fallbackMonth
  const requestedDate = params.get('date')
  const parsedDate = requestedDate ? parseDateKey(requestedDate) : null
  const date =
    parsedDate && formatMonthKey(parsedDate) === month
      ? requestedDate!
      : defaultDateInMonth(month, now)

  return {
    view: parseView(params.get('view')),
    month,
    date,
    q: params.get('q')?.trim() ?? '',
    status: parseStatus(params.get('status')),
    fixture,
  }
}

export function buildSettlementOverviewPath(
  params: SettlementOverviewParams,
  now = new Date(),
) {
  const defaults = defaultSettlementOverviewParams(now)
  const searchParams = new URLSearchParams()

  if (params.view !== defaults.view) searchParams.set('view', params.view)
  if (params.month !== defaults.month) searchParams.set('month', params.month)
  if (params.date !== defaultDateInMonth(params.month, now)) searchParams.set('date', params.date)
  if (params.q) searchParams.set('q', params.q)
  if (params.status !== 'all') searchParams.set('status', params.status)
  if (params.fixture) searchParams.set('fixture', '1')

  const query = searchParams.toString()
  return query ? `${MYPAGE_SETTLEMENT_PATH}?${query}` : MYPAGE_SETTLEMENT_PATH
}
