import type {
  BugIssueLogFrontendResponse,
  DownloadLogFrontendResponse,
  PersonalInfoAccessLogFrontendResponse,
  SystemIssueDetailResponse,
} from '@/shared/api/generated/logs/schemas'
import type { LogListPage } from '@/features/logs/api/log-list-page'
import { LOG_LIST_PAGE_SIZE } from '@/features/logs/api/log-list-page'
import type { BugIssueLog, BugIssueLogDetail } from '@/types/bug-issue-log'
import {
  CONTAINED_PII_LABEL,
  formatContainedPiiLead,
} from '@jakorea/domain/shared/file-download-password'
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

/**
 * 파일 다운로드 이력 `kind` 표시 라벨 (서버 기록 코드). 없는 값은 코드 원문을 보여 준다.
 * PAYMENT_STATEMENT_BULK_DOWNLOAD 는 기존 이력에만 남은 옛 코드다.
 */
const DOWNLOAD_LOG_KIND_LABEL: Record<string, string> = {
  PERFORMANCE_EXPORT: '실적 데이터',
  PAYMENT_STATEMENT: '지급조서',
  PAYMENT_STATEMENT_BULK_DOWNLOAD: '지급조서',
  SETTLEMENT_EXPORT: '정산 양식(대량이체/세금신고)',
  CONSENT_DOCUMENT: '동의서',
  FORM_RESPONSE: '신청서 첨부파일(과제)',
  CLIENT_GENERATED_FILE: '기타 파일',
}

/** 이력 화면 전용 PII 라벨 — 공용 다운로드 암호 유형(주민번호·계좌)에 이력 전용 유형을 더한다. */
const DOWNLOAD_LOG_PII_LABEL: Record<string, string> = {
  ...CONTAINED_PII_LABEL,
  NAME: '이름',
}

const DOWNLOAD_LOG_PII_ORDER = ['RESIDENT_REGISTRATION_NUMBER', 'ACCOUNT_NUMBER', 'NAME']

export function formatDownloadLogKind(kind: string): string {
  return DOWNLOAD_LOG_KIND_LABEL[kind] ?? kind
}

/** 받침 유무로 주격 조사(이/가)를 고른다. 한글이 아니면 '가'. */
function subjectParticle(word: string): '이' | '가' {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  if (code < 0 || code > 11171) return '가'
  return code % 28 === 0 ? '가' : '이'
}

/**
 * containedPiiTypes → "이름·계좌번호가 포함된 파일입니다."
 * 라벨이 없는 값은 코드 원문을 그대로 쓴다. 빈 배열·null은 일반 개인정보 문구.
 */
export function formatDownloadLogContainedPii(value: unknown): string {
  const types = Array.isArray(value)
    ? [...new Set(value.filter((item): item is string => typeof item === 'string' && item.trim() !== ''))]
    : []
  if (types.length === 0) return formatContainedPiiLead([])
  const known = DOWNLOAD_LOG_PII_ORDER.filter(type => types.includes(type))
  const unknown = types.filter(type => !DOWNLOAD_LOG_PII_ORDER.includes(type))
  const labels = [...known.map(type => DOWNLOAD_LOG_PII_LABEL[type] ?? type), ...unknown]
  const joined = labels.join('·')
  return `${joined}${subjectParticle(joined)} 포함된 파일입니다.`
}

export function mapDownloadLogResponse(dto: DownloadLogFrontendResponse | object): DownloadLog {
  const rec = dto as Record<string, unknown>
  const idValue = rec.id
  return {
    id:
      typeof idValue === 'string' && idValue.trim()
        ? idValue.trim()
        : typeof idValue === 'number' && Number.isFinite(idValue)
          ? String(idValue)
          : `log-${Date.now()}`,
    // 서버가 [JA Korea] 규칙 이름으로 변환해 내려준다(GET /api/admin/logs/file-access).
    fileName: readExtraString(dto, ['fileName']),
    userId: readExtraString(dto, ['userId']),
    userName: readExtraString(dto, ['userName']),
    ipAddress: readExtraString(dto, ['ipAddress', 'requestIp']),
    downloadedAt: (() => {
      const value = readExtraString(dto, ['downloadedAt', 'createdAt', 'requestedAt'])
      return value === '-' ? new Date().toISOString() : value
    })(),
    kind: formatDownloadLogKind(readExtraString(dto, ['kind', 'eventType', 'fileType'])),
    containedPiiLabel: formatDownloadLogContainedPii(rec.containedPiiTypes),
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
    result: dto.result?.trim() || '-',
    traceId: dto.traceId?.trim() || '-',
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

function dash(value: string | null | undefined): string {
  const trimmed = value?.trim()
  return trimmed ? trimmed : '-'
}

function actorTypeLabel(actorType: string | undefined): string {
  const key = actorType?.trim().toUpperCase()
  if (key === 'SYSTEM') return '시스템'
  if (key === 'ADMIN') return '관리자'
  if (key === 'MEMBER') return '회원'
  return dash(actorType)
}

export function mapSystemIssueDetailResponse(
  dto: SystemIssueDetailResponse
): BugIssueLogDetail {
  return {
    issueId: dto.issueId != null ? String(dto.issueId) : '-',
    messageKo: dash(dto.messageKo),
    message: dash(dto.message),
    apiPath: dash(dto.apiPath),
    featureKey: dash(dto.featureKey),
    screenKey: dash(dto.screenKey),
    actorType: dash(dto.actorType),
    actorTypeLabel: actorTypeLabel(dto.actorType),
  }
}
