import type {
  BugIssueLogFrontendResponse,
  DownloadLogFrontendResponse,
  PersonalInfoAccessLogFrontendResponse,
} from '@/shared/api/generated/logs/schemas'
import type { LogListPage } from '@/features/logs/api/log-list-page'
import { LOG_LIST_PAGE_SIZE } from '@/features/logs/api/log-list-page'
import type { BugIssueLog } from '@/types/bug-issue-log'
import type { DownloadLog } from '@/types/download-log'
import type { MemberLoginLog } from '@/types/member-login-log'
import type { PersonalInfoAccessLog } from '@/types/personal-info-access-log'

const TARGET_NAME_KEYS = [
  'targetName',
  'accessTarget',
  'targetUserName',
  'subjectName',
  'accessedUserName',
] as const

const MEMBER_LOGIN_ADMIN_NAME_KEYS = ['adminName', 'name', 'userName'] as const
const MEMBER_LOGIN_ID_KEYS = ['loginId', 'email', 'loginEmail', 'userId'] as const
const MEMBER_LOGIN_AT_KEYS = ['loggedAt', 'loginAt', 'accessedAt', 'createdAt'] as const
const MEMBER_LOGIN_IP_KEYS = ['ipAddress', 'ip'] as const

function readExtraString(dto: object, keys: readonly string[]): string {
  const rec = dto as Record<string, unknown>
  for (const key of keys) {
    const value = rec[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
    if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  }
  return '-'
}

function readFiniteNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function unwrapListItems(payload: unknown): unknown[] {
  if (Array.isArray(payload)) {
    return payload
  }
  if (payload != null && typeof payload === 'object') {
    const rec = payload as Record<string, unknown>
    for (const key of ['items', 'content', 'rows', 'data'] as const) {
      const value = rec[key]
      if (Array.isArray(value)) return value
    }
  }
  return []
}

function mapLogListPage<TDto, TItem>(
  payload: unknown,
  mapItem: (dto: TDto) => TItem
): LogListPage<TItem> {
  const rawItems = unwrapListItems(payload)
  const items = rawItems
    .filter((item): item is TDto => item != null && typeof item === 'object')
    .map(mapItem)

  if (Array.isArray(payload)) {
    return {
      items,
      page: 0,
      size: items.length || LOG_LIST_PAGE_SIZE,
      totalElements: items.length,
      totalPages: items.length > 0 ? 1 : 0,
      hasNext: false,
    }
  }

  const rec =
    payload != null && typeof payload === 'object'
      ? (payload as Record<string, unknown>)
      : {}
  const page = readFiniteNumber(rec.page, 0)
  const size = readFiniteNumber(rec.size, LOG_LIST_PAGE_SIZE)
  const totalElements = readFiniteNumber(rec.totalElements, items.length)
  const totalPages = readFiniteNumber(
    rec.totalPages,
    size > 0 ? Math.ceil(totalElements / size) : 0
  )
  const hasNext =
    typeof rec.hasNext === 'boolean' ? rec.hasNext : page + 1 < totalPages

  return { items, page, size, totalElements, totalPages, hasNext }
}

export function mapDownloadLogResponse(dto: DownloadLogFrontendResponse): DownloadLog {
  return {
    id: dto.id ?? `log-${Date.now()}`,
    fileName: dto.fileName ?? '-',
    userId: dto.userId ?? 'unknown',
    userName: dto.userName ?? '-',
    ipAddress: dto.ipAddress ?? '-',
    downloadedAt: dto.downloadedAt ?? new Date().toISOString(),
  }
}

export function mapDownloadLogListPageResponse(payload: unknown): LogListPage<DownloadLog> {
  return mapLogListPage(payload, (dto: DownloadLogFrontendResponse) =>
    mapDownloadLogResponse(dto)
  )
}

export function mapPersonalInfoAccessLogResponse(
  dto: PersonalInfoAccessLogFrontendResponse
): PersonalInfoAccessLog {
  return {
    id: dto.id ?? `pia-${Date.now()}`,
    targetName: readExtraString(dto, TARGET_NAME_KEYS),
    accessItem: dto.accessItem ?? '-',
    accessPurpose: dto.accessPurpose ?? '-',
    accessorId: dto.accessorId ?? 'unknown',
    accessorName: dto.accessorName ?? '-',
    accessedAt: dto.accessedAt ?? new Date().toISOString(),
    ipAddress: dto.ipAddress ?? '-',
  }
}

export function mapPersonalInfoAccessLogListPageResponse(
  payload: unknown
): LogListPage<PersonalInfoAccessLog> {
  return mapLogListPage(payload, (dto: PersonalInfoAccessLogFrontendResponse) =>
    mapPersonalInfoAccessLogResponse(dto)
  )
}

export function mapMemberLoginLogResponse(dto: object): MemberLoginLog {
  const rec = dto as Record<string, unknown>
  const idValue = rec.id
  return {
    id:
      typeof idValue === 'string' && idValue.trim()
        ? idValue.trim()
        : typeof idValue === 'number' && Number.isFinite(idValue)
          ? String(idValue)
          : `mlh-${Date.now()}`,
    adminName: readExtraString(dto, MEMBER_LOGIN_ADMIN_NAME_KEYS),
    loginId: readExtraString(dto, MEMBER_LOGIN_ID_KEYS),
    loggedAt: (() => {
      const value = readExtraString(dto, MEMBER_LOGIN_AT_KEYS)
      return value === '-' ? new Date().toISOString() : value
    })(),
    // 기획: IP 마스킹 없음 — 원문 그대로 표시
    ipAddress: readExtraString(dto, MEMBER_LOGIN_IP_KEYS),
  }
}

export function mapMemberLoginLogListPageResponse(
  payload: unknown
): LogListPage<MemberLoginLog> {
  return mapLogListPage(payload, (dto: object) => mapMemberLoginLogResponse(dto))
}

export function mapBugIssueLogResponse(dto: BugIssueLogFrontendResponse): BugIssueLog {
  return {
    id: dto.id != null ? String(dto.id) : `bug-${Date.now()}`,
    screenName: dto.screenName ?? '-',
    errorMessage: dto.errorMessage ?? '-',
    userName: dto.userName ?? '-',
    occurredAt: dto.occurredAt ?? new Date().toISOString(),
  }
}

export function mapBugIssueLogListPageResponse(payload: unknown): LogListPage<BugIssueLog> {
  return mapLogListPage(payload, (dto: BugIssueLogFrontendResponse) =>
    mapBugIssueLogResponse(dto)
  )
}
