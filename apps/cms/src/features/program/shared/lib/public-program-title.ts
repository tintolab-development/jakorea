import type { Program } from '@/types/domain'

export const PUBLIC_PROGRAM_TITLE_OVERLAY_KEYS = [
  'ujat.basicInfo.publicProgramTitle',
  'generalRegistration.basicInfo.publicProgramTitle',
  'economyRegistration.basicInfo.publicProgramTitle',
  'trainedTeachersRegistration.basicInfo.publicProgramTitle',
] as const

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === 'object' && !Array.isArray(value)
}

function normalizeTitle(value?: string | null): string {
  return value?.trim() ?? ''
}

export function readPublicProgramTitleFromOverlay(
  overlay?: Record<string, unknown> | null
): string | undefined {
  if (!overlay) return undefined
  for (const key of PUBLIC_PROGRAM_TITLE_OVERLAY_KEYS) {
    const value = overlay[key]
    if (typeof value === 'string' && value.trim()) return value.trim()
  }
  return undefined
}

export function isRepresentativeTitleAlias(
  value: string,
  program: Pick<Program, 'mainTitle' | 'title'> | { mainTitle?: string | null; title?: string | null }
): boolean {
  const trimmed = value.trim()
  if (!trimmed) return false
  return trimmed === normalizeTitle(program.mainTitle)
}

export function parseRegistrationOverlayFromServiceDetailJson(
  raw?: string | null
): Record<string, unknown> {
  if (!raw?.trim()) return {}
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || !isRecord(parsed.registration) || !isRecord(parsed.registration.overlay)) {
      return {}
    }
    return parsed.registration.overlay
  } catch {
    return {}
  }
}

function readAnnouncementTitleFromCommon(common: unknown): string | undefined {
  if (!isRecord(common) || typeof common.announcementTitle !== 'string') return undefined
  const trimmed = common.announcementTitle.trim()
  return trimmed || undefined
}

export function collectAnnouncementTitleCandidatesFromServiceDetail(
  raw?: string | null
): string[] {
  if (!raw?.trim()) return []
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed)) return []
    const candidates = [
      readAnnouncementTitleFromCommon(parsed.generalCommonInfo),
      isRecord(parsed.program)
        ? readAnnouncementTitleFromCommon(parsed.program.generalCommonInfo)
        : undefined,
    ]
    return candidates.filter((value): value is string => Boolean(value))
  } catch {
    return []
  }
}

export function resolvePublicProgramTitle(input: {
  announcementTitle?: string | null
  announcementTitleCandidates?: Array<string | null | undefined>
  overlay?: Record<string, unknown> | null
  mainTitle?: string | null
  title?: string | null
}): string {
  const overlayTitle = readPublicProgramTitleFromOverlay(input.overlay)
  const seen = new Set<string>()
  const candidates = [
    overlayTitle,
    input.announcementTitle,
    ...(input.announcementTitleCandidates ?? []),
  ]
  for (const candidate of candidates) {
    const trimmed = candidate?.trim()
    if (!trimmed || seen.has(trimmed)) continue
    seen.add(trimmed)
    if (!isRepresentativeTitleAlias(trimmed, input)) return trimmed
  }
  return overlayTitle ?? ''
}

export function resolvePublicProgramTitleDisplay(
  program: Pick<
    Program,
    'generalCommonInfo' | 'mainTitle' | 'title' | 'registrationOverlay' | 'ujatRegistrationOverlay'
  >
): string {
  return (
    resolvePublicProgramTitle({
      announcementTitle: program.generalCommonInfo?.announcementTitle,
      overlay: program.ujatRegistrationOverlay ?? program.registrationOverlay,
      mainTitle: program.mainTitle,
      title: program.title,
    }) || '-'
  )
}

export function buildRegistrationOverlayForPersist(
  program: Pick<Program, 'generalCommonInfo' | 'registrationOverlay' | 'ujatRegistrationOverlay'>
): Record<string, unknown> | undefined {
  const existing = program.registrationOverlay ?? program.ujatRegistrationOverlay ?? {}
  const title = program.generalCommonInfo?.announcementTitle?.trim()
  const next: Record<string, unknown> = { ...existing }
  if (title) {
    const knownKeys = PUBLIC_PROGRAM_TITLE_OVERLAY_KEYS.filter(key => key in next)
    if (knownKeys.length > 0) {
      for (const key of knownKeys) next[key] = title
    } else {
      next['generalRegistration.basicInfo.publicProgramTitle'] = title
    }
  }
  return Object.keys(next).length > 0 ? next : undefined
}

export function applyResolvedAnnouncementTitle<
  T extends Pick<
    Program,
    'mainTitle' | 'title' | 'generalCommonInfo' | 'registrationOverlay' | 'ujatRegistrationOverlay'
  >,
>(
  program: T,
  extra?: {
    serviceDetailJson?: string | null
    overlay?: Record<string, unknown>
  }
): T {
  const overlay =
    extra?.overlay ??
    program.ujatRegistrationOverlay ??
    program.registrationOverlay ??
    parseRegistrationOverlayFromServiceDetailJson(extra?.serviceDetailJson)
  const resolved = resolvePublicProgramTitle({
    announcementTitle: program.generalCommonInfo?.announcementTitle,
    announcementTitleCandidates: collectAnnouncementTitleCandidatesFromServiceDetail(
      extra?.serviceDetailJson
    ),
    overlay,
    mainTitle: program.mainTitle,
    title: program.title,
  })
  const current = program.generalCommonInfo?.announcementTitle?.trim() || ''
  if (resolved === current && (program.registrationOverlay != null || Object.keys(overlay).length === 0)) {
    return program
  }
  const { announcementTitle: _omit, ...commonRest } = program.generalCommonInfo ?? {}
  void _omit
  return {
    ...program,
    ...(Object.keys(overlay).length > 0 ? { registrationOverlay: overlay } : {}),
    generalCommonInfo: {
      ...commonRest,
      ...(resolved ? { announcementTitle: resolved } : {}),
    },
  }
}
