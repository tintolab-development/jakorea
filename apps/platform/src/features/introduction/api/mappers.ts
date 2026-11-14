/**
 * 공개 기관소개 — PublicOrganizationResponse → 화면 모델.
 * 아이콘·지도 좌표·eyebrow·스탯·기간 탭은 프론트 고정.
 * SVG 아이콘 URL은 hooks에서 `applyOrganizationViewAssets`로 채운다.
 */

import type { AchievementRecordItem, HistoryYearData } from '../lib/achievement-data.ts'
import {
  GLOBAL_VALUE_HARDCODED_ROWS,
  type GlobalValueItem,
} from '../lib/global-value-data.ts'
import {
  JA_WORLDWIDE_GLOBAL_LINK,
  JA_WORLDWIDE_REGION_LAYOUT,
  type JaWorldwideRegion,
  type JaWorldwideRegionId,
} from '../lib/ja-worldwide-layout.ts'
import type {
  IntroductionBiContent,
  IntroductionHeroContent,
  IntroductionPageContent,
  IntroductionWorldwideContent,
} from '../model/types.ts'
import type {
  PublicAwardResponse,
  PublicBiResponse,
  PublicCertificationResponse,
  PublicGlobalValueResponse,
  PublicHistoryResponse,
  PublicIntroductionResponse,
  PublicOrganizationResponse,
  PublicWorldwideLinkResponse,
  PublicWorldwideResponse,
} from './types.ts'

/** itemCode 목록 — itemCode가 없을 때 index 순서 대체값으로도 쓴다. */
export const GLOBAL_VALUE_ITEM_CODES = [
  'VALUE_1',
  'VALUE_2',
  'VALUE_3',
  'VALUE_4',
  'VALUE_5',
  'VALUE_6',
] as const

export type GlobalValueItemCode = (typeof GLOBAL_VALUE_ITEM_CODES)[number]

const LINK_CODE_TO_REGION: Record<string, JaWorldwideRegionId> = {
  JA_AMERICAS: 'americas',
  JA_USA: 'usa',
  JA_EUROPE: 'europe',
  JA_AFRICA: 'africa',
  JA_MENA: 'mena',
  JA_ASIA_PACIFIC: 'asia-pacific',
}

function asText(value: string | undefined | null): string {
  return typeof value === 'string' ? value.trim() : ''
}

/** API 연속 문자열 → PC 줄바꿈용 lines. `\n` 있으면 그대로, 없으면 한 줄. */
export function toDisplayLines(text: string): string[] {
  const trimmed = text.trim()
  if (!trimmed) return []
  if (trimmed.includes('\n')) {
    return trimmed
      .split(/\n/)
      .map(line => line.trim())
      .filter(Boolean)
  }
  return [trimmed]
}

function mapHero(row: PublicIntroductionResponse | undefined): IntroductionHeroContent {
  const intro = asText(row?.section1Subtitle)
  const message = asText(row?.section1Title)
  const inspiringTitle = asText(row?.section2TitleEn)
  const inspiringDescription = asText(row?.section2SubtitleKo)
  const networkTitle = asText(row?.content1Title)
  const networkDescription = asText(row?.content1Description)
  const experienceTitle = asText(row?.content2Title)
  const experienceDescription = asText(row?.content2Description)
  const visionEyebrow = asText(row?.globalVisionSubtitleEn)
  const visionBody = asText(row?.globalVisionTextKo)
  const missionEyebrow = asText(row?.globalMissionSubtitleEn)
  const missionBody = asText(row?.globalMissionTextKo)

  return {
    introLines: toDisplayLines(intro),
    introMobile: intro.replace(/\s+/g, ' ').trim(),
    messageLines: toDisplayLines(message),
    inspiringTitleLines: toDisplayLines(inspiringTitle),
    inspiringDescriptionLines: toDisplayLines(inspiringDescription),
    networkTitleLines: toDisplayLines(networkTitle),
    networkDescriptionLines: toDisplayLines(networkDescription),
    experienceTitleLines: toDisplayLines(experienceTitle),
    experienceDescriptionLines: toDisplayLines(experienceDescription),
    visionEyebrowLines: toDisplayLines(visionEyebrow),
    visionBodyLines: toDisplayLines(visionBody),
    missionEyebrowLines: toDisplayLines(missionEyebrow),
    missionBodyLines: toDisplayLines(missionBody),
  }
}

export function resolveGlobalValueItemCode(
  row: { itemCode?: string },
  index: number,
): GlobalValueItemCode {
  const code = asText(row.itemCode).toUpperCase()
  const known = GLOBAL_VALUE_ITEM_CODES.find(itemCode => itemCode === code)
  if (known) return known
  return GLOBAL_VALUE_ITEM_CODES[index] ?? 'VALUE_1'
}

function mapGlobalValues(rows: readonly PublicGlobalValueResponse[] | undefined): GlobalValueItem[] {
  const list = [...(rows ?? [])].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  )
  return list
    .map((row, index) => {
      const code = resolveGlobalValueItemCode(row, index)
      const mainText = asText(row.mainText)
      const subText = asText(row.subText)
      if (!mainText && !subText) return null
      const item: GlobalValueItem = {
        id: row.id != null ? String(row.id) : code.toLowerCase(),
        number: String(index + 1).padStart(2, '0'),
        englishTitleLines: toDisplayLines(mainText),
        koreanTitle: subText,
        /** 임시: itemCode. hooks에서 로컬 SVG URL로 교체 */
        iconUrl: code,
      }
      return item
    })
    .filter((row): row is GlobalValueItem => row != null)
}

function mapWorldwide(
  row: PublicWorldwideResponse | undefined,
): IntroductionWorldwideContent {
  const links = row?.links ?? []
  const byCode = new Map<string, PublicWorldwideLinkResponse>()
  for (const link of links) {
    const code = asText(link.linkCode).toUpperCase()
    if (code) byCode.set(code, link)
  }

  const worldwide = byCode.get('JA_WORLDWIDE')
  const globalLinkHref =
    asText(worldwide?.externalUrl) || JA_WORLDWIDE_GLOBAL_LINK.href

  const regions: JaWorldwideRegion[] = JA_WORLDWIDE_REGION_LAYOUT.map(layout => {
    const code = Object.entries(LINK_CODE_TO_REGION).find(([, id]) => id === layout.id)?.[0]
    const api = code ? byCode.get(code) : undefined
    return {
      id: layout.id,
      ctaLabel: layout.ctaLabel,
      href: asText(api?.externalUrl) || layout.fallbackHref,
      linkX: layout.linkX,
      linkY: layout.linkY,
    }
  })

  return {
    description: asText(row?.guidanceText),
    globalLinkHref,
    regions,
  }
}

function padMonth(month: number): string {
  return String(month).padStart(2, '0')
}

export function mapHistoryByYear(
  rows: PublicHistoryResponse[] | undefined,
): Record<number, HistoryYearData> {
  const byYear = new Map<number, Map<number, string[]>>()
  for (const row of rows ?? []) {
    const year = row.year
    const month = row.month
    const content = asText(row.content)
    if (year == null || month == null || !content) continue
    if (month < 1 || month > 12) continue
    let months = byYear.get(year)
    if (!months) {
      months = new Map()
      byYear.set(year, months)
    }
    const items = months.get(month) ?? []
    items.push(content)
    months.set(month, items)
  }

  const result: Record<number, HistoryYearData> = {}
  for (const [year, months] of byYear) {
    const monthGroups = [...months.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([month, items]) => ({
        month: padMonth(month),
        items,
      }))
    result[year] = { year, months: monthGroups }
  }
  return result
}

function formatYearMonthLabel(isoOrDate: string): string {
  const raw = asText(isoOrDate)
  if (!raw) return ''
  const match = /^(\d{4})-(\d{2})/.exec(raw)
  if (match) {
    return `${match[1]}년 ${Number(match[2])}월`
  }
  const parsed = Date.parse(raw)
  if (Number.isNaN(parsed)) return raw
  const d = new Date(parsed)
  return `${d.getUTCFullYear()}년 ${d.getUTCMonth() + 1}월`
}

function mapAwards(rows: PublicAwardResponse[] | undefined): AchievementRecordItem[] {
  return (rows ?? [])
    .map((row, index) => {
      const title = asText(row.awardName)
      const organization = asText(row.awardingInstitution)
      if (!title && !organization) return null
      return {
        id: row.id != null ? String(row.id) : `award-${index + 1}`,
        dateLabel: formatYearMonthLabel(row.awardedDate ?? ''),
        title,
        organization,
      } satisfies AchievementRecordItem
    })
    .filter((row): row is AchievementRecordItem => row != null)
}

function mapCertifications(
  rows: PublicCertificationResponse[] | undefined,
): AchievementRecordItem[] {
  return (rows ?? [])
    .map((row, index) => {
      const title = asText(row.content)
      const organization = asText(row.certificationInstitution)
      if (!title && !organization) return null
      return {
        id: row.id != null ? String(row.id) : `cert-${index + 1}`,
        dateLabel: formatYearMonthLabel(row.certifiedDate ?? ''),
        title,
        organization,
      } satisfies AchievementRecordItem
    })
    .filter((row): row is AchievementRecordItem => row != null)
}

function mapBi(row: PublicBiResponse | undefined): IntroductionBiContent {
  return {
    title: asText(row?.title),
    lead: asText(row?.mainText),
    description: asText(row?.subText),
  }
}

export function mapPublicOrganization(
  response: PublicOrganizationResponse,
): IntroductionPageContent {
  return {
    hero: mapHero(response.introduction),
    /**
     * 홈페이지 Admin 항목 관리 연동 전까지 FE 하드코딩 6항목.
     * 연동 시 `mapGlobalValues(response.globalValues)`로 교체한다.
     */
    globalValues: mapGlobalValues(GLOBAL_VALUE_HARDCODED_ROWS),
    worldwide: mapWorldwide(response.worldwide),
    historyByYear: mapHistoryByYear(response.history),
    awards: mapAwards(response.awards),
    certifications: mapCertifications(response.certifications),
    bi: mapBi(response.bi),
  }
}

/**
 * 소개·Worldwide·연혁·수상·인증·BI 중 하나라도 있으면 본문을 그린다.
 * Global Value는 FE 하드코딩이라 서버 콘텐츠 유무 판단에서 뺀다(Admin 연동 시 다시 포함).
 */
export function hasOrganizationContent(
  content: IntroductionPageContent | null | undefined,
): boolean {
  if (!content) return false
  const hero = content.hero
  const hasHero = Boolean(
    hero.introLines.length ||
      hero.messageLines.length ||
      hero.inspiringTitleLines.length ||
      hero.networkTitleLines.length ||
      hero.experienceTitleLines.length ||
      hero.visionBodyLines.length ||
      hero.missionBodyLines.length,
  )
  return Boolean(
    hasHero ||
      content.worldwide.description ||
      Object.keys(content.historyByYear).length ||
      content.awards.length ||
      content.certifications.length ||
      content.bi.title ||
      content.bi.lead ||
      content.bi.description,
  )
}
