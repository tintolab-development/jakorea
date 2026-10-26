import {
  educationApplicationDetailPath,
  lectureApplicationDetailPath,
  volunteerApplicationDetailPath,
} from '../../../lib/constants.ts'
import type { ProgramApplicationType } from '../../applications/api/types.ts'

export type SettlementArea = 'education' | 'volunteer' | 'lecture'

export function resolveSettlementAreaFromPathname(pathname: string): SettlementArea {
  if (pathname.startsWith('/mypage/volunteer')) return 'volunteer'
  if (pathname.startsWith('/mypage/lectures')) return 'lecture'
  return 'education'
}

export function readSettlementRouteApplicationType(
  value: string | undefined,
): ProgramApplicationType | null {
  const normalized = value?.trim().toUpperCase()
  if (
    normalized === 'INDIVIDUAL' ||
    normalized === 'ORGANIZATION' ||
    normalized === 'INSTRUCTOR' ||
    normalized === 'VOLUNTEER'
  ) {
    return normalized
  }
  return null
}

function settlementBasePath(
  applicationId: string,
  area: SettlementArea,
  applicationType?: string,
): string {
  if (area === 'volunteer') {
    return volunteerApplicationDetailPath(applicationId, applicationType)
  }
  if (area === 'lecture') {
    return lectureApplicationDetailPath(applicationId, applicationType ?? 'INSTRUCTOR')
  }
  return educationApplicationDetailPath(applicationId, applicationType)
}

export function buildSettlementWritePath(options: {
  applicationId: string
  sessionId: string
  area?: SettlementArea
  applicationType?: string
}): string {
  const params = new URLSearchParams({ sessionId: options.sessionId })
  return `${settlementBasePath(options.applicationId, options.area ?? 'education', options.applicationType)}/settlement/write?${params.toString()}`
}

export function buildSettlementConfirmPath(options: {
  applicationId: string
  sessionId: string
  area?: SettlementArea
  applicationType?: string
  mode?: 'view'
}): string {
  const params = new URLSearchParams({ sessionId: options.sessionId })
  if (options.mode) params.set('mode', options.mode)
  return `${settlementBasePath(options.applicationId, options.area ?? 'education', options.applicationType)}/settlement/confirm?${params.toString()}`
}

export function buildSettlementTabPath(
  applicationId: string,
  area: SettlementArea = 'education',
  applicationType?: string,
): string {
  return `${settlementBasePath(applicationId, area, applicationType)}?section=settlement`
}
