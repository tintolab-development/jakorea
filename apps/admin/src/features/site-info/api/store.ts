/**
 * 사이트 정보 관리 — localStorage mock (API 연동 전)
 */

import type { SiteInfo, SiteInfoSaveInput } from '@/entities/site-info/model/types'

const STORAGE_KEY = 'admin.site.siteInfo.v1'

export const SITE_INFO_CHANGED_EVENT = 'jakorea:site-info-changed' as const

type SiteInfoFile = {
  version: 1
  data: SiteInfo
}

const LOGO_PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" viewBox="0 0 200 80">
      <rect width="200" height="80" fill="#0d3d4a"/>
      <text x="100" y="48" text-anchor="middle" fill="#fff" font-family="sans-serif" font-size="18" font-weight="700">JA Korea</text>
    </svg>`
  )

const FAVICON_PLACEHOLDER =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="30" viewBox="0 0 24 30" fill="none">
  <path d="M23.8394 0L15.9014 6.03366L20.8641 6.01985L23.8394 0Z" fill="#296075"/>
  <path d="M23.844 0L20.8687 6.01985L23.8463 9.9993L23.844 0Z" fill="#01A1AF"/>
  <path d="M23.8394 9.99909L20.8641 16.0189L15.9014 16.0328L23.8394 9.99909Z" fill="#296075"/>
  <path d="M23.8438 9.99909L20.8662 16.0189L23.8461 20.0007L23.8438 9.99909Z" fill="#01A1AF"/>
  <path d="M15.8785 6.03373L12.9031 12.0536L7.94043 12.0674L15.8785 6.03373Z" fill="#296075"/>
  <path d="M15.8829 6.03373L12.9053 12.0536L15.8852 16.033L15.8829 6.03373Z" fill="#01A1AF"/>
  <path d="M0 18.1011L4.96042 18.085L7.93805 12.0675L0 18.1011Z" fill="#296075"/>
  <path d="M7.94247 12.0675L4.96484 18.085L7.94247 22.0668V12.0675Z" fill="#01A1AF"/>
  <path d="M15.876 16.0328L12.8984 22.0527L7.93799 22.0665L15.876 16.0328Z" fill="#296075"/>
  <path d="M15.8805 16.0328L12.9028 22.0527L15.8805 26.0344V16.0328Z" fill="#01A1AF"/>
  <path d="M23.837 20.0011L20.8593 26.021L15.8989 26.0348L23.837 20.0011Z" fill="#296075"/>
  <path d="M20.8638 26.0187L23.8437 30.0004L23.8414 20.0011L20.8638 26.0187Z" fill="#01A1AF"/>
</svg>`
  )

function buildSeed(): SiteInfo {
  return {
    siteName: 'JA KOREA',
    siteDescription:
      '청소년들이 과학기술을 기반으로 지식과 정보를 습득하는 방법을 익히고, 디지털 플랫폼을 통하여 분석, 응용, 활용해 문제를 해결하는 통합과정을 다루고 있습니다.',
    ogImageUrl: LOGO_PLACEHOLDER,
    ogImageFileName: 'JA Korea_OG image.png',
    faviconUrl: FAVICON_PLACEHOLDER,
    faviconFileName: 'JA Korea_favicon image.png',
    updatedAt: '2026-07-01T00:00:00.000Z',
  }
}

function asString(value: unknown, fallback: string): string {
  return typeof value === 'string' ? value : fallback
}

function normalize(raw: Partial<SiteInfo> | null | undefined): SiteInfo {
  const seed = buildSeed()
  if (!raw || typeof raw !== 'object') return seed
  return {
    siteName: asString(raw.siteName, seed.siteName),
    siteDescription: asString(raw.siteDescription, seed.siteDescription),
    ogImageUrl: asString(raw.ogImageUrl, ''),
    ogImageFileName:
      typeof raw.ogImageFileName === 'string' ? raw.ogImageFileName : undefined,
    faviconUrl: asString(raw.faviconUrl, ''),
    faviconFileName:
      typeof raw.faviconFileName === 'string' ? raw.faviconFileName : undefined,
    updatedAt: asString(raw.updatedAt, seed.updatedAt),
  }
}

function readFile(): SiteInfoFile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { version: 1, data: buildSeed() }
    const parsed = JSON.parse(raw) as SiteInfoFile
    if (parsed?.version !== 1 || !parsed.data) {
      return { version: 1, data: buildSeed() }
    }
    return { version: 1, data: normalize(parsed.data) }
  } catch {
    return { version: 1, data: buildSeed() }
  }
}

function writeFile(file: SiteInfoFile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(file))
  window.dispatchEvent(new CustomEvent(SITE_INFO_CHANGED_EVENT))
}

export function readSiteInfo(): SiteInfo {
  const file = readFile()
  if (!localStorage.getItem(STORAGE_KEY)) {
    writeFile(file)
  }
  return file.data
}

export function saveSiteInfo(input: SiteInfoSaveInput): SiteInfo {
  const siteName = input.siteName.trim()
  if (!siteName) {
    throw new Error('SITE_NAME_REQUIRED')
  }
  const next = normalize({
    siteName,
    siteDescription: input.siteDescription.trimEnd(),
    ogImageUrl: input.ogImageUrl.trim(),
    ogImageFileName: input.ogImageFileName?.trim() || undefined,
    faviconUrl: input.faviconUrl.trim(),
    faviconFileName: input.faviconFileName?.trim() || undefined,
    updatedAt: new Date().toISOString(),
  })
  writeFile({ version: 1, data: next })
  return next
}
