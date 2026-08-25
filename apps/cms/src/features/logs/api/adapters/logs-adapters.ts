import type {
  BugIssueLogFrontendResponse,
  DownloadLogFrontendResponse,
  PersonalInfoAccessLogFrontendResponse,
} from '@/shared/api/generated/logs/schemas'
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

export function mapDownloadLogListResponse(
  items: DownloadLogFrontendResponse[] | undefined
): DownloadLog[] {
  return (items ?? []).map(mapDownloadLogResponse)
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

export function mapPersonalInfoAccessLogListResponse(
  items: PersonalInfoAccessLogFrontendResponse[] | undefined
): PersonalInfoAccessLog[] {
  return (items ?? []).map(mapPersonalInfoAccessLogResponse)
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

export function mapMemberLoginLogListResponse(payload: unknown): MemberLoginLog[] {
  const items = normalizeMemberLoginListPayload(payload)
  return items.map(item => mapMemberLoginLogResponse(item))
}

function normalizeMemberLoginListPayload(payload: unknown): object[] {
  if (Array.isArray(payload)) {
    return payload.filter((item): item is object => item != null && typeof item === 'object')
  }
  if (payload != null && typeof payload === 'object') {
    const rec = payload as Record<string, unknown>
    for (const key of ['items', 'content', 'rows', 'data'] as const) {
      const value = rec[key]
      if (Array.isArray(value)) {
        return value.filter((item): item is object => item != null && typeof item === 'object')
      }
    }
  }
  return []
}

export function mapBugIssueLogResponse(dto: BugIssueLogFrontendResponse): BugIssueLog {
  return {
    id: dto.id ?? `bug-${Date.now()}`,
    screenName: dto.screenName ?? '-',
    errorMessage: dto.errorMessage ?? '-',
    userName: dto.userName ?? '-',
    occurredAt: dto.occurredAt ?? new Date().toISOString(),
  }
}

export function mapBugIssueLogListResponse(
  items: BugIssueLogFrontendResponse[] | undefined
): BugIssueLog[] {
  return (items ?? []).map(mapBugIssueLogResponse)
}
