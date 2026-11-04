import type { PublicMainResponse } from '../api/types.ts'
import { parseHomeHref, resolveHomeHref } from './href.ts'
import { isWithinDisplayPeriod } from './period.ts'
import { FALLBACK_STRIP_COLORS } from './strip-colors.ts'
import type {
  HomeDonationCta,
  HomeMainFallback,
  HomeMainView,
  HomePopup,
  HomeSocialLink,
  HomeStripBanner,
} from './view.ts'
import { MAX_HOME_POPUPS } from './view.ts'
import type {
  HomeAchievementStat,
  HomeHeroSlide,
  HomePartnerLogo,
} from './home-fallback-content.ts'

/**
 * Fallback 규율
 *
 * - 응답 없음(미호출·실패): 화면 전체 fallback.
 * - 응답 있음(`source: 'remote'`):
 *   - 0 가능 목록(`stripBanners` · `heroes` · `sponsors` · `socialLinks` · `popups`)
 *     → `[]`이거나 생략이면 **빈 목록**. mock을 되살리지 않는다.
 *   - 프로그램 카드는 public main이 아니라 CMS `GET /api/portal/programs` 를 쓴다.
 *   - 기간 만료·문구 없는 행은 제외. 남은 게 0이면 빈 목록.
 *   - 스칼라(제목·유튜브·CTA·실적 숫자)만 빈 값이면 필드 단위 fallback.
 */
function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

/** textarea 개행·JSON 이스케이프 `\\n`을 실제 줄바꿈으로 맞춘다. */
function expandLineBreaks(value: string): string {
  return value.replace(/\r\n?/g, '\n').replace(/\\n/g, '\n')
}

function readMultiline(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const expanded = expandLineBreaks(value).trim()
  return expanded || undefined
}

/** 공개 URL이 비었거나 시드 placeholder(MinIO 404)면 필드 fallback PNG를 쓴다. */
function readPublicImageUrl(value: unknown): string | undefined {
  const url = readString(value)
  if (!url) return undefined
  if (/impact-story-placeholder/i.test(url)) return undefined
  return url
}

function splitTitleLines(title: string): readonly string[] {
  const lines = expandLineBreaks(title)
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
  return lines.length > 0 ? lines : [expandLineBreaks(title)]
}

function formatCount(count: number): string {
  return count.toLocaleString('ko-KR')
}

function overlayStat(
  fallback: HomeAchievementStat,
  count: number | undefined,
): HomeAchievementStat {
  if (count == null || !Number.isFinite(count)) return fallback
  return { ...fallback, value: formatCount(count) }
}

function normalizeBottomText(value: string | undefined, fallback: string | null): string | null {
  if (!value) return fallback
  const compact = value.replace(/\s+/g, '')
  const fallbackCompact = (fallback ?? '').replace(/\s+/g, '')
  if (fallbackCompact && compact === fallbackCompact) return null
  const designed =
    '학생들이스스로미래를설계하도록전국200여개지역의JA네트워크가함께합니다'
  if (compact === designed) return null
  return value
}

function formatPublishedAtLabel(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}년 ${month}월 ${day}일`
}

function mapFeaturedStory(
  remote: PublicMainResponse['impact'],
  fallback: HomeMainFallback['featuredStory'],
): HomeMainFallback['featuredStory'] {
  const story = remote?.featuredStory
  const title = readString(story?.title)
  if (!story || !title) return fallback

  const id = story.id != null ? String(story.id) : fallback?.id ?? 'featured'
  const publishedAt = readString(story.publishAt) ?? fallback?.publishedAt ?? ''

  return {
    id,
    category: fallback?.category ?? 'story',
    categoryLabel: readString(story.categoryName) ?? fallback?.categoryLabel ?? '스토리',
    title,
    summary: fallback?.summary ?? '',
    publishedAtLabel: publishedAt ? formatPublishedAtLabel(publishedAt) : fallback?.publishedAtLabel ?? '',
    publishedAt,
    isFeatured: true,
    placeholderColor: fallback?.placeholderColor ?? '#c5e8eb',
    imageUrl: readPublicImageUrl(story.imageUrl) ?? fallback?.imageUrl,
    featuredImageUrl: readPublicImageUrl(story.imageUrl) ?? fallback?.featuredImageUrl,
  }
}

function mapHeroes(
  remote: PublicMainResponse['heroes'],
  fallback: readonly HomeHeroSlide[],
): readonly HomeHeroSlide[] {
  const rows = [...(remote ?? [])].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  )
  if (rows.length === 0) return []

  return rows.map((hero, index) => {
    const seed = fallback[index % fallback.length]!
    const mainTitle = readMultiline(hero.mainTitle)
    const link = readString(hero.linkUrl)
    const href = link ? parseHomeHref(link) : undefined
    return {
      id: hero.id != null ? `hero-${hero.id}` : seed.id,
      eyebrow: readMultiline(hero.topText) ?? seed.eyebrow,
      titleLines: mainTitle ? splitTitleLines(mainTitle) : seed.titleLines,
      description: readMultiline(hero.bottomText) ?? seed.description,
      placeholderBackground: seed.placeholderBackground,
      imageUrl: readString(hero.imageUrl) ?? seed.imageUrl,
      href: href?.href,
      external: href?.external,
    }
  })
}

function mapStrips(
  remote: PublicMainResponse['stripBanners'],
  fallback: readonly HomeStripBanner[],
): readonly HomeStripBanner[] {
  const rows = [...(remote ?? [])].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  )
  if (rows.length === 0) return []

  return rows.flatMap((banner, index) => {
    const label = readString(banner.bannerText)
    if (!label) return []
    if (!isWithinDisplayPeriod(banner.displayStartDate, banner.displayEndDate)) return []
    const seed = fallback[index % fallback.length]
    const link = readString(banner.linkUrl)
    const href = link ? parseHomeHref(link) : undefined
    return [
      {
        id: banner.id != null ? `strip-${banner.id}` : `strip-${index}`,
        label,
        href: href?.href,
        external: href?.external ?? false,
        backgroundColor:
          seed?.backgroundColor ?? FALLBACK_STRIP_COLORS[index % FALLBACK_STRIP_COLORS.length]!,
      },
    ]
  })
}

function mapSocialLinks(
  remote: PublicMainResponse['socialLinks'],
  fallback: readonly HomeSocialLink[],
): readonly HomeSocialLink[] {
  const rows = [...(remote ?? [])].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  )
  if (rows.length === 0) return []

  const byCode = new Map(fallback.map(item => [item.channelCode, item]))
  const mapped = rows.flatMap(row => {
    const code = readString(row.channelCode)?.toUpperCase()
    const url = readString(row.externalUrl)
    if (!code || !url) return []
    const seed = byCode.get(code)
    if (!seed) return []
    return [
      {
        ...seed,
        href: url,
        label: readString(row.channelName) ?? seed.label,
      },
    ]
  })
  return mapped
}

function mapPartnerRows(
  remote: PublicMainResponse['sponsors'],
): readonly (readonly HomePartnerLogo[])[] {
  const rows = [...(remote ?? [])].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  )
  const logos = rows.flatMap(row => {
    const name = readString(row.companyName)
    if (!name) return []
    return [{ name, logoUrl: readString(row.logoUrl) }]
  })
  if (logos.length === 0) return []

  const mid = Math.ceil(logos.length / 2)
  return [logos.slice(0, mid), logos.slice(mid)]
}

function mapPopups(remote: PublicMainResponse['popups']): readonly HomePopup[] {
  const rows = [...(remote ?? [])].sort(
    (a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0),
  )
  if (rows.length === 0) return []

  return rows
    .flatMap((row, index) => {
      const imageUrl = readPublicImageUrl(row.imageUrl)
      if (!imageUrl) return []
      if (!isWithinDisplayPeriod(row.displayStartDate, row.displayEndDate)) return []

      const link = readString(row.linkUrl)
      const href = link ? parseHomeHref(link) : undefined

      return [
        {
          id: row.id != null ? String(row.id) : `popup-${index}`,
          imageUrl,
          altText: readString(row.altText) ?? '',
          href: href?.href,
          external: href?.external,
        },
      ]
    })
    .slice(0, MAX_HOME_POPUPS)
}

function mapDonationCta(
  label: string | undefined,
  url: string | undefined,
  fallback: HomeDonationCta,
): HomeDonationCta {
  const href = resolveHomeHref(url, fallback.href)
  return {
    label: readString(label) ?? fallback.label,
    href: href.href,
    external: href.external,
  }
}

function normalizeFallbackHref(cta: HomeDonationCta): HomeDonationCta {
  const href = parseHomeHref(cta.href)
  return { ...cta, href: href.href, external: href.external }
}

/**
 * 첫 응답 전. 0 가능 목록은 비워 두어 mock 띠배너가 먼저 뜨지 않게 한다.
 * 스칼라는 fallback을 써서 아래 섹션 레이아웃을 유지한다.
 */
export function createPendingHomeMainView(fallback: HomeMainFallback): HomeMainView {
  return {
    ...fallback,
    source: 'pending',
    strips: [],
    heroes: [],
    programs: [],
    partnerRows: [],
    socialLinks: [],
    popups: [],
  }
}

export function mergePublicMainWithFallback(
  remote: PublicMainResponse | null | undefined,
  fallback: HomeMainFallback,
): HomeMainView {
  if (!remote) {
    return { ...fallback, source: 'fallback' }
  }

  const donationCta1 = normalizeFallbackHref(fallback.donationCta1)
  const donationCta2 = normalizeFallbackHref(fallback.donationCta2)

  return {
    source: 'remote',
    strips: mapStrips(remote.stripBanners, fallback.strips),
    heroes: mapHeroes(remote.heroes, fallback.heroes),
    educationTitle: readString(remote.education?.title) ?? fallback.educationTitle,
    programs: [],
    youtubeUrl: readString(remote.impact?.youtubeUrl) ?? fallback.youtubeUrl,
    impactTitle: readString(remote.impact?.title) ?? fallback.impactTitle,
    featuredStory: mapFeaturedStory(remote.impact, fallback.featuredStory),
    performanceTitle: readString(remote.performance?.title) ?? fallback.performanceTitle,
    stats: [
      overlayStat(fallback.stats[0]!, remote.performance?.networkDistributionCount),
      overlayStat(fallback.stats[1]!, remote.performance?.partnerOrganizationCount),
      overlayStat(fallback.stats[2]!, remote.performance?.educatorCount),
    ],
    highlight: fallback.highlight
      ? overlayStat(fallback.highlight, remote.performance?.youthBeneficiaryCount)
      : null,
    performanceBottomText: normalizeBottomText(
      readString(remote.performance?.bottomText),
      fallback.performanceBottomText,
    ),
    partnerRows: mapPartnerRows(remote.sponsors),
    donationTitle: readString(remote.donation?.title) ?? fallback.donationTitle,
    donationCta1: mapDonationCta(
      remote.donation?.cta1Label,
      remote.donation?.cta1Url,
      donationCta1,
    ),
    donationCta2: mapDonationCta(
      remote.donation?.cta2Label,
      remote.donation?.cta2Url,
      donationCta2,
    ),
    socialLinks: mapSocialLinks(remote.socialLinks, fallback.socialLinks),
    popups: mapPopups(remote.popups),
  }
}
