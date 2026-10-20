import { getFormTemplateVersionCacheEntry } from '@/features/template/api/form-template-version-cache'
import { resolveWritingFormBaseTemplateCode } from '@/features/template/lib/form-template-delete-policy'
import {
  getGeneralRecruitOverlayRecord,
  patchGeneralRecruitOverlay,
  peekGeneralRecruitOverlayRecord,
  replaceGeneralRecruitOverlay,
  replaceGeneralRecruitOverlayForScope,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'

/**
 * 상세 정보 단락은 general-recruit 스토어에 쓰이지만,
 * 기관·UJAT 모집은 전용 overlay만 persist 해서 임시저장 후 설명이 사라졌다.
 */

export const RECRUIT_DETAIL_INFO_OVERLAY_PREFIX = {
  institution: 'recruit.detailInfo',
  economy: 'economyRecruit.detailInfo',
  trainedTeachers: 'trainedTeachersRecruit.detailInfo',
  ujatInstitution: 'ujatRecruit.detailInfo',
  volunteer: 'recruitVolunteer.detailInfo',
  gemini: 'geminiRecruit.detailInfo',
} as const

const UJAT_VOLUNTEER_RECRUIT_GENERAL_STORE_PREFIXES = [
  RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.volunteer,
  'recruitVolunteer.h1.detailInfo',
  'recruitVolunteer.h2.detailInfo',
  'recruit.volunteer.h1',
  'recruit.volunteer.h2',
] as const

export function pickUjatVolunteerRecruitGeneralStoreSidecar(
  record: Record<string, unknown> = getGeneralRecruitOverlayRecord()
): Record<string, unknown> {
  return UJAT_VOLUNTEER_RECRUIT_GENERAL_STORE_PREFIXES.reduce(
    (acc, prefix) => ({ ...acc, ...pickOverlayKeysByPrefix(record, prefix) }),
    {} as Record<string, unknown>
  )
}

export function restoreUjatVolunteerRecruitGeneralStoreSidecar(
  overlay: Record<string, unknown> | undefined,
  options?: { forceEmptyLive?: boolean }
): void {
  if (overlay == null) return
  const sidecar = pickUjatVolunteerRecruitGeneralStoreSidecar(overlay)
  if (Object.keys(sidecar).length === 0) return
  const live = getGeneralRecruitOverlayRecord()
  const liveSidecar = pickUjatVolunteerRecruitGeneralStoreSidecar(live)
  const patch =
    options?.forceEmptyLive === true && Object.keys(liveSidecar).length === 0
      ? sidecar
      : overlayEntriesAbsentFromLive(sidecar, live)
  if (Object.keys(patch).length === 0) return
  patchGeneralRecruitOverlay(patch)
}

/** 템플릿 조회 — 반기 sidecar 잔여 키를 지운 뒤 저장본으로 덮어쓴다. */
export function replaceUjatVolunteerRecruitGeneralStoreSidecar(
  overlay: Record<string, unknown> | undefined,
  templateCode?: string | null
): void {
  const live =
    templateCode != null
      ? peekGeneralRecruitOverlayRecord(templateCode)
      : getGeneralRecruitOverlayRecord()
  const next: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(live)) {
    const keep = UJAT_VOLUNTEER_RECRUIT_GENERAL_STORE_PREFIXES.every(prefix => {
      const needle = prefix.endsWith('.') ? prefix : `${prefix}.`
      return key !== prefix && !key.startsWith(needle)
    })
    if (keep) next[key] = value
  }
  if (overlay != null) {
    Object.assign(next, pickUjatVolunteerRecruitGeneralStoreSidecar(overlay))
  }
  if (templateCode != null) replaceGeneralRecruitOverlayForScope(templateCode, next)
  else replaceGeneralRecruitOverlay(next)
}

export function recruitDetailInfoOverlayPrefixForCatalogId(
  catalogTemplateId: string
): string | null {
  const code = resolveWritingFormBaseTemplateCode(
    catalogTemplateId,
    getFormTemplateVersionCacheEntry(catalogTemplateId)?.baseTemplateCode
  )
  switch (code) {
    case 'recruitment-participant-school':
    case 'recruitment-participant-individual':
      return RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.institution
    case 'recruitment-economy':
      return RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.economy
    case 'recruitment-trained-teachers':
      return RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.trainedTeachers
    case 'recruitment-ujat-school':
      return RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.ujatInstitution
    case 'recruitment-ujat-volunteer':
      return RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.volunteer
    case 'recruitment-gemini-visiting-training':
      return RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.gemini
    default:
      return null
  }
}

export function recruitDetailInfoOverlayPrefixForEditorVariant(
  variant: string
): string | null {
  switch (variant) {
    case 'applicant-recruit-institution':
    case 'applicant-recruit-individual':
      return RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.institution
    case 'economy-recruit-institution':
      return RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.economy
    case 'trained-teachers-recruit-institution':
      return RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.trainedTeachers
    case 'ujat-recruit-institution':
      return RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.ujatInstitution
    case 'ujat-recruit-volunteer':
      return RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.volunteer
    case 'gemini-recruit':
      return RECRUIT_DETAIL_INFO_OVERLAY_PREFIX.gemini
    default:
      return null
  }
}

export function pickOverlayKeysByPrefix(
  record: Record<string, unknown>,
  prefix: string
): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  const needle = prefix.endsWith('.') ? prefix : `${prefix}.`
  for (const [key, value] of Object.entries(record)) {
    if (key === prefix || key.startsWith(needle)) out[key] = value
  }
  return out
}

export function pickRecruitDetailInfoFromGeneralStore(
  prefix: string,
  record: Record<string, unknown> = getGeneralRecruitOverlayRecord()
): Record<string, unknown> {
  return pickOverlayKeysByPrefix(record, prefix)
}

/**
 * 단계 복원용. live에 이미 있는 키(첨부 파일명·썸네일 포함)는 이전 스냅샷으로 덮지 않는다.
 * live에 없는 키만 스냅샷에서 채운다.
 */
export function overlayEntriesAbsentFromLive(
  incoming: Record<string, unknown>,
  live: Record<string, unknown>
): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(incoming)) {
    if (Object.prototype.hasOwnProperty.call(live, key)) continue
    patch[key] = value
  }
  return patch
}

/**
 * 상세 정보 편집값은 general-recruit 스토어가 최신이다.
 * 기관 overlay에 남아 있는 이전 스냅샷(첨부 파일명 등)이 방금 입력한 값을 덮지 않게 live 키를 우선한다.
 * live에 없는 키만 전용 overlay 값을 유지한다.
 */
export function mergeRecruitDetailInfoFromGeneralStore(
  overlay: Record<string, unknown>,
  prefix: string | null,
  record: Record<string, unknown> = getGeneralRecruitOverlayRecord()
): Record<string, unknown> {
  if (prefix == null) return overlay
  return {
    ...overlay,
    ...pickRecruitDetailInfoFromGeneralStore(prefix, record),
  }
}

export function restoreRecruitDetailInfoIntoGeneralStore(
  overlay: Record<string, unknown> | undefined,
  prefix: string | null,
  options?: { forceEmptyLive?: boolean }
): void {
  if (overlay == null || prefix == null) return
  const detail = pickOverlayKeysByPrefix(overlay, prefix)
  if (Object.keys(detail).length === 0) return
  const liveDetail = pickRecruitDetailInfoFromGeneralStore(prefix)
  const patch =
    options?.forceEmptyLive === true && Object.keys(liveDetail).length === 0
      ? detail
      : overlayEntriesAbsentFromLive(detail, liveDetail)
  if (Object.keys(patch).length === 0) return
  patchGeneralRecruitOverlay(patch)
}

/** 템플릿 조회·변경 — prefix 잔여 키를 지운 뒤 불러온 상세 정보로 덮어쓴다. */
export function replaceRecruitDetailInfoIntoGeneralStore(
  overlay: Record<string, unknown> | undefined,
  prefix: string | null,
  templateCode?: string | null
): void {
  if (prefix == null) return
  const live =
    templateCode != null
      ? peekGeneralRecruitOverlayRecord(templateCode)
      : getGeneralRecruitOverlayRecord()
  const needle = prefix.endsWith('.') ? prefix : `${prefix}.`
  const next: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(live)) {
    if (key === prefix || key.startsWith(needle)) continue
    next[key] = value
  }
  if (overlay != null) {
    Object.assign(next, pickOverlayKeysByPrefix(overlay, prefix))
  }
  if (templateCode != null) replaceGeneralRecruitOverlayForScope(templateCode, next)
  else replaceGeneralRecruitOverlay(next)
}
