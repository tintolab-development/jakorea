import {
  educationApplicationDetailPath,
  volunteerApplicationDetailPath,
} from '../../../lib/constants.ts'

export type SettlementArea = 'education' | 'volunteer'

export function resolveSettlementAreaFromPathname(pathname: string): SettlementArea {
  return pathname.startsWith('/mypage/volunteer') ? 'volunteer' : 'education'
}

function settlementBasePath(
  applicationId: string,
  area: SettlementArea,
  applicationType?: string,
): string {
  return area === 'volunteer'
    ? volunteerApplicationDetailPath(applicationId, applicationType)
    : educationApplicationDetailPath(applicationId, applicationType)
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
