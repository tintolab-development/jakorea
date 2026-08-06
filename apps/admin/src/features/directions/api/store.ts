/**
 * 오시는 길 관리 — localStorage mock (API 연동 전)
 */

import type { DirectionsInfo } from '@/entities/directions/model/types'

const STORAGE_KEY = 'admin.jakorea.directions.v1'

export const DIRECTIONS_CHANGED_EVENT = 'jakorea:directions-changed' as const

const SEED_KAKAO_MAP_HTML = `<div id="daumRoughmapContainer1783579310022" class="root_daum_roughmap root_daum_roughmap_landing"></div>
<script class="daum_roughmap_loader_script" src="https://ssl.daumcdn.net/dmaps/map_js_init/roughmapLoader.js"></script>
<script>
  new daum.roughmap.Lander({
    "timestamp" : "1783579310022",
    "key" : "2xyz",
    "mapWidth" : "1440",
    "mapHeight" : "728"
  }).render();
</script>`

type DirectionsFile = {
  version: 1
  data: DirectionsInfo
}

function buildSeedDirections(): DirectionsInfo {
  return {
    addressKo: '서울특별시 강서구 마곡중앙로 171 (마곡나루역 프라이빗타워2차 714호)',
    addressEn:
      'Rm 714, Magoknaru Station Private Tower 2, 171 Magokjungang-ro, Gangseo-gu, Seoul, 07788, Republic of Korea',
    kakaoMapHtml: SEED_KAKAO_MAP_HTML,
    phone: '02-783-2367',
    fax: '070-4275-5115',
    email: 'jakorea@jakorea.org',
    updatedAt: '2026-07-01T00:00:00.000Z',
  }
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function normalizeDirections(
  raw: Partial<DirectionsInfo> | null | undefined
): DirectionsInfo {
  const seed = buildSeedDirections()
  if (!raw || typeof raw !== 'object') return seed
  return {
    addressKo: asString(raw.addressKo, seed.addressKo),
    addressEn: asString(raw.addressEn, seed.addressEn),
    kakaoMapHtml: asString(raw.kakaoMapHtml, seed.kakaoMapHtml),
    phone: asString(raw.phone, seed.phone),
    fax: asString(raw.fax, seed.fax),
    email: asString(raw.email, seed.email),
    updatedAt: asString(raw.updatedAt, seed.updatedAt),
  }
}

function readDirectionsFile(): DirectionsFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { version: 1, data: buildSeedDirections() }
    const parsed = JSON.parse(raw) as DirectionsFile
    if (parsed?.version !== 1 || !parsed.data) {
      return { version: 1, data: buildSeedDirections() }
    }
    return { version: 1, data: normalizeDirections(parsed.data) }
  } catch {
    return { version: 1, data: buildSeedDirections() }
  }
}

function writeDirectionsFile(file: DirectionsFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(DIRECTIONS_CHANGED_EVENT))
}

export function readDirections(): DirectionsInfo {
  const file = readDirectionsFile()
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeDirectionsFile(file)
  }
  return file.data
}

export function saveDirections(data: DirectionsInfo): DirectionsInfo {
  const next = normalizeDirections({
    addressKo: data.addressKo.trimEnd(),
    addressEn: data.addressEn.trimEnd(),
    kakaoMapHtml: data.kakaoMapHtml.trimEnd(),
    phone: data.phone.trimEnd(),
    fax: data.fax.trimEnd(),
    email: data.email.trimEnd(),
    updatedAt: new Date().toISOString(),
  })
  writeDirectionsFile({ version: 1, data: next })
  return next
}
