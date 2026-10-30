/**
 * UJAT 등록 위저드(typed 모집 RHF) 동안 레거시 모집 overlay prefix 기록을 막는다.
 * 읽기·일반 프로그램·저장된 UJAT 상세는 건드리지 않는다.
 */

const BLOCKED_PREFIXES = [
  'ujatRecruit.detailInfo',
  'recruitVolunteer.detailInfo',
  'recruitVolunteer.h1.detailInfo',
  'recruitVolunteer.h2.detailInfo',
  'ujat.recruit.',
] as const

let writesBlocked = false

export function setUjatTypedRecruitmentOverlayWritesBlocked(blocked: boolean): void {
  writesBlocked = blocked
}

export function isUjatTypedRecruitmentOverlayWritesBlocked(): boolean {
  return writesBlocked
}

export function isBlockedUjatTypedRecruitmentOverlayKey(key: string): boolean {
  for (const prefix of BLOCKED_PREFIXES) {
    if (prefix.endsWith('.')) {
      if (key.startsWith(prefix) || key === prefix.slice(0, -1)) return true
      continue
    }
    if (key === prefix || key.startsWith(`${prefix}.`)) return true
  }
  return false
}

/** blocked면 허용 키만 남긴다. 전부 막히면 null */
export function filterUjatTypedRecruitmentOverlayPatch(
  partial: Record<string, unknown>
): Record<string, unknown> | null {
  if (!writesBlocked) return partial
  const next: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(partial)) {
    if (!isBlockedUjatTypedRecruitmentOverlayKey(key)) next[key] = value
  }
  return Object.keys(next).length === 0 ? null : next
}
