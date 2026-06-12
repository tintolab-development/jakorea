import type {
  BugIssueLogFrontendResponse,
  DownloadLogFrontendResponse,
  PersonalInfoAccessLogFrontendResponse,
  SystemIssueDetailResponse,
} from '@/shared/api/generated/logs/schemas'
import type { BugIssueLog } from '@/types/bug-issue-log'
import type { DownloadLog } from '@/types/download-log'
import type { PersonalInfoAccessLog } from '@/types/personal-info-access-log'

export type SystemIssueDetail = {
  issueId: number
  issueType: string
  severity: string
  screenKey: string
  apiPath: string
  message: string
  detailSummary: string
  issueStatus: string
  createdAt: string
  resolvedAt?: string
  stackTraceAvailable: boolean
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

export function mapSystemIssueDetailResponse(
  dto: SystemIssueDetailResponse
): SystemIssueDetail {
  return {
    issueId: dto.issueId ?? 0,
    issueType: dto.issueType ?? '-',
    severity: dto.severity ?? '-',
    screenKey: dto.screenKey ?? '-',
    apiPath: dto.apiPath ?? '-',
    message: dto.message ?? '-',
    detailSummary: dto.detailSummary ?? '-',
    issueStatus: dto.issueStatus ?? '-',
    createdAt: dto.createdAt ?? new Date().toISOString(),
    resolvedAt: dto.resolvedAt,
    stackTraceAvailable: dto.stackTraceAvailable ?? false,
  }
}
