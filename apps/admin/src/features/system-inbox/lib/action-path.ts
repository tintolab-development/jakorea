import type { HomepageAdminSystemNotificationItemNotificationType } from '@/shared/api/generated/notifications/schemas/homepageAdminSystemNotificationItemNotificationType'

const ALLOWED_PATHS = [
  '/ja-korea/recruit/applicants',
  '/ja-korea/recruit/postings',
  '/sponsor/corporate/consultations',
  '/sponsor/talent/applications',
] as const

const ALLOWED_QUERY_KEYS = new Set(['applicationId', 'postingId'])

export function fallbackInboxActionPath(
  notificationType: string | undefined,
  aggregateId: number | undefined,
): string | null {
  if (notificationType === 'CAREER_POSTING_DEADLINE') {
    return '/ja-korea/recruit/postings'
  }
  if (aggregateId == null || !Number.isFinite(aggregateId) || aggregateId <= 0) return null
  const id = String(Math.trunc(aggregateId))
  switch (notificationType) {
    case 'CAREER_TALENT_APPLICATION':
      return `/ja-korea/recruit/applicants?applicationId=${id}`
    case 'CORPORATE_CONSULTATION':
      return `/sponsor/corporate/consultations?applicationId=${id}`
    case 'TALENT_APPLICATION':
      return `/sponsor/talent/applications?applicationId=${id}`
    default:
      return null
  }
}

export function sanitizeInboxActionPath(raw: string | null | undefined): string | null {
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  if (!trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.includes('\\')) return null
  if (/^[a-zA-Z][a-zA-Z+.-]*:/.test(trimmed)) return null

  let url: URL
  try {
    url = new URL(trimmed, 'https://admin.jakorea.invalid')
  } catch {
    return null
  }
  if (url.origin !== 'https://admin.jakorea.invalid') return null
  if (url.username || url.password || url.hash) return null

  const pathname = decodeURIComponent(url.pathname)
  if (pathname.includes('..')) return null
  const allowed = ALLOWED_PATHS.some(prefix => pathname === prefix || pathname.startsWith(`${prefix}/`))
  if (!allowed) return null

  const postingDetail = pathname.match(/^\/ja-korea\/recruit\/postings\/([^/]+)$/)
  if (postingDetail && !/^\d+$/.test(postingDetail[1] ?? '')) return null

  const extraSegmentRoutes = new Set([
    '/ja-korea/recruit/applicants',
    '/sponsor/corporate/consultations',
    '/sponsor/talent/applications',
  ])
  for (const route of extraSegmentRoutes) {
    if (pathname.startsWith(`${route}/`)) return null
  }

  const params = new URLSearchParams()
  url.searchParams.forEach((value, key) => {
    if (!ALLOWED_QUERY_KEYS.has(key)) return
    const trimmedValue = value.trim()
    if (trimmedValue) params.set(key, trimmedValue)
  })
  const search = params.toString()
  return search ? `${pathname}?${search}` : pathname
}

export function resolveInboxNavigationPath(input: {
  actionPath?: string | null
  notificationType?: HomepageAdminSystemNotificationItemNotificationType | string | null
  aggregateId?: number | null
}): string | null {
  return (
    sanitizeInboxActionPath(input.actionPath) ??
    fallbackInboxActionPath(input.notificationType ?? undefined, input.aggregateId ?? undefined)
  )
}
