/**
 * 홈 public main 매퍼
 *
 * 응답 없음 → 전체 fallback.
 * 응답 있음 → 0 가능 목록은 빈 배열/생략을 빈 목록으로 유지 (mock 되살림 금지).
 */
import assert from 'node:assert/strict'
import { parseHomeHref, resolveHomeHref } from './href.ts'
import { createPendingHomeMainView, mergePublicMainWithFallback } from './map-public-main.ts'
import { isWithinDisplayPeriod } from './period.ts'
import type { HomeMainFallback } from './view.ts'

const fallback: HomeMainFallback = {
  strips: [
    {
      id: 'volunteer',
      label: '경제교육 봉사자 모집 중',
      href: '/programs',
      backgroundColor: 'var(--color-primary-700)',
      external: false,
    },
  ],
  heroes: [
    {
      id: 'hero-1',
      eyebrow: 'JA KOREA',
      titleLines: ['기본 제목'],
      description: '기본 설명',
      placeholderBackground: '#000',
      imageUrl: '/fallback.png',
    },
  ],
  educationTitle: '새로운 배움이 기다리고 있어요',
  programs: [],
  youtubeUrl: 'https://www.youtube.com/watch?v=ts_hit5wXqg',
  impactTitle: 'JA Korea와 함께\n청소년의 가능성을 넓혀주세요',
  featuredStory: null,
  performanceTitle: '함께 만들어온 배움의 여정',
  stats: [
    { label: '전국 교육 네트워크 분포', value: '200', unit: '지역+' },
    { label: '전문 협업 학교, 기관, 단체', value: '1000', unit: '개+' },
    { label: '전문 봉사자, 교사, 강사', value: '3000', unit: '명+' },
  ],
  highlight: { label: '교육 수혜자 청소년들의 수', value: '90,000', unit: '여명' },
  performanceBottomText: null,
  partnerRows: [[{ name: 'SAMSUNG' }]],
  donationTitle: '더 많은 학생들이 배움의 기회를\n만날 수 있게 함께해 주세요',
  donationCta1: { label: '개인후원 시작하기', href: '/support/individual', external: false },
  donationCta2: { label: '기업후원 문의하기', href: '/support/corporate', external: false },
  socialLinks: [
    {
      channelCode: 'INSTAGRAM',
      label: 'JA Korea 인스타그램',
      href: 'https://www.instagram.com/',
      iconUrl: '/ig.svg',
    },
  ],
  popups: [],
}

assert.equal(parseHomeHref('/programs').external, false)
assert.equal(parseHomeHref('https://www.jakorea.org/programs').href, '/programs')
assert.equal(parseHomeHref('https://www.instagram.com/jakorea_official/').external, true)
assert.equal(resolveHomeHref(undefined, '/support/individual').href, '/support/individual')

const empty = mergePublicMainWithFallback({}, fallback)
assert.equal(empty.source, 'remote')
assert.equal(empty.heroes.length, 0)
assert.equal(empty.strips.length, 0)
assert.equal(empty.partnerRows.length, 0)
assert.equal(empty.socialLinks.length, 0)
assert.equal(empty.popups.length, 0)
assert.equal(empty.educationTitle, fallback.educationTitle)
assert.equal(empty.programs.length, 0)

const emptyLists = mergePublicMainWithFallback(
  { heroes: [], stripBanners: [], sponsors: [], socialLinks: [], education: { programs: [] } },
  fallback
)
assert.equal(emptyLists.source, 'remote')
assert.equal(emptyLists.heroes.length, 0)
assert.equal(emptyLists.strips.length, 0)
assert.equal(emptyLists.partnerRows.length, 0)
assert.equal(emptyLists.socialLinks.length, 0)
assert.equal(emptyLists.programs.length, 0)
assert.equal(emptyLists.popups.length, 0)

const pending = createPendingHomeMainView(fallback)
assert.equal(pending.source, 'pending')
assert.equal(pending.strips.length, 0)
assert.equal(pending.heroes.length, 0)
assert.equal(pending.programs.length, 0)
assert.equal(pending.popups.length, 0)
assert.equal(pending.educationTitle, fallback.educationTitle)

const merged = mergePublicMainWithFallback(
  {
    heroes: [
      {
        id: 9,
        displayOrder: 1,
        topText: 'JA KOREA',
        mainTitle: '청소년의 가능성이\n더 넓은 세상과 만납니다',
        bottomText: '원격 설명',
        imageUrl: 'https://cdn.example/hero.png',
        linkUrl: 'https://www.jakorea.org/about',
      },
    ],
    education: {
      title: '원격 교육 제목',
      programs: [
        {
          id: 11,
          uuid: 'trained-teacher-primary-case-05',
          programType: 'TRAINED_TEACHER',
          periodStatus: 'SCHEDULED',
          nameKo: '교사 경제교육 심화 모집',
        },
        {
          id: 12,
          programType: 'GENERAL_INDIVIDUAL',
          periodStatus: 'RECRUITING',
          nameKo: '청소년 금융 캠프',
        },
        {
          id: 13,
          programType: 'GENERAL_INDIVIDUAL',
          periodStatus: 'COMPLETED',
          nameKo: '',
        },
      ],
    },
    performance: { networkDistributionCount: 200, youthBeneficiaryCount: 90000 },
    donation: { cta1Url: 'https://www.jakorea.org/support/individual' },
    stripBanners: [
      { id: 1, displayOrder: 1, bannerText: '경제교육 봉사자 모집 중', linkUrl: '/programs' },
    ],
  },
  fallback
)

assert.equal(merged.heroes.length, 1)
assert.deepEqual(merged.heroes[0]?.titleLines, ['청소년의 가능성이', '더 넓은 세상과 만납니다'])

const escapedTitle = mergePublicMainWithFallback(
  {
    heroes: [
      {
        id: 11,
        displayOrder: 1,
        mainTitle: '첫줄\\n둘째줄',
      },
    ],
  },
  fallback,
)
assert.deepEqual(escapedTitle.heroes[0]?.titleLines, ['첫줄', '둘째줄'])
assert.equal(merged.heroes[0]?.href, '/about')
assert.equal(merged.heroes[0]?.external, false)
assert.equal(merged.educationTitle, '원격 교육 제목')
assert.equal(merged.programs.length, 0)
assert.equal(merged.stats[0]?.value, '200')
assert.equal(merged.highlight?.value, '90,000')
assert.equal(merged.donationCta1.href, '/support/individual')
assert.equal(merged.donationCta1.external, false)
assert.equal(merged.strips[0]?.href, '/programs')

const unlinkStrip = mergePublicMainWithFallback(
  {
    stripBanners: [
      { id: 2, displayOrder: 1, bannerText: '링크 없는 띠배너' },
    ],
  },
  fallback,
)
assert.equal(unlinkStrip.strips[0]?.label, '링크 없는 띠배너')
assert.equal(unlinkStrip.strips[0]?.href, undefined)

const featuredFallback: HomeMainFallback = {
  ...fallback,
  featuredStory: {
    id: 'impact-2',
    category: 'story',
    categoryLabel: '스토리',
    title: 'fallback',
    summary: '',
    publishedAtLabel: '',
    publishedAt: '',
    isFeatured: true,
    placeholderColor: '#c5e8eb',
    imageUrl: '/card-minjae.png',
    featuredImageUrl: '/card-minjae.png',
  },
}

const featuredNoImage = mergePublicMainWithFallback(
  {
    impact: {
      featuredStory: {
        id: 16,
        title: '14년 만에 심사위원으로! 민재님이 JA와 함께하는 이유',
        imageUrl: 'http://localhost:9000/homepage-public/local/seed/impact-story-placeholder.png',
      },
    },
  },
  featuredFallback
)
assert.equal(featuredNoImage.featuredStory?.imageUrl, '/card-minjae.png')
assert.equal(featuredNoImage.featuredStory?.featuredImageUrl, '/card-minjae.png')

const featuredEmptyImage = mergePublicMainWithFallback(
  {
    impact: {
      featuredStory: {
        id: 16,
        title: '14년 만에 심사위원으로! 민재님이 JA와 함께하는 이유',
      },
    },
  },
  featuredFallback
)
assert.equal(featuredEmptyImage.featuredStory?.imageUrl, '/card-minjae.png')

const mappedPopups = mergePublicMainWithFallback(
  {
    popups: [
      {
        id: 2,
        displayOrder: 2,
        imageUrl: 'https://cdn.example/popup-b.png',
        altText: '두번째',
        linkUrl: 'https://www.jakorea.org/about',
      },
      {
        id: 1,
        displayOrder: 1,
        imageUrl: 'https://cdn.example/popup-a.png',
        altText: '첫번째',
        displayStartDate: '2020-01-01',
        displayEndDate: '2099-12-31',
        linkUrl: 'https://example.com/report',
      },
      {
        id: 3,
        displayOrder: 3,
        imageUrl: '',
        altText: '이미지 없음',
      },
      {
        id: 4,
        displayOrder: 4,
        imageUrl: 'https://cdn.example/expired.png',
        displayStartDate: '2020-01-01',
        displayEndDate: '2020-12-31',
      },
    ],
  },
  fallback
)
assert.equal(mappedPopups.popups.length, 2)
assert.equal(mappedPopups.popups[0]?.id, '1')
assert.equal(mappedPopups.popups[0]?.href, 'https://example.com/report')
assert.equal(mappedPopups.popups[0]?.external, true)
assert.equal(mappedPopups.popups[1]?.href, '/about')
assert.equal(mappedPopups.popups[1]?.external, false)

const expiredOnly = mergePublicMainWithFallback(
  {
    stripBanners: [
      {
        id: 9,
        displayOrder: 1,
        bannerText: '만료 띠배너',
        linkUrl: '/programs',
        displayStartDate: '2020-01-01',
        displayEndDate: '2020-12-31',
      },
    ],
  },
  fallback
)
assert.equal(expiredOnly.source, 'remote')
assert.equal(expiredOnly.strips.length, 0)

const now = new Date(2026, 8, 20).getTime()
assert.equal(isWithinDisplayPeriod('2026-09-15', '2027-09-15', now), true)
assert.equal(isWithinDisplayPeriod('2026-09-21', '2027-09-15', now), false)
assert.equal(isWithinDisplayPeriod('2020-01-01', '2020-12-31', now), false)
assert.equal(isWithinDisplayPeriod(undefined, undefined, now), true)

const oddSponsors = mergePublicMainWithFallback(
  {
    sponsors: [
      { id: 1, displayOrder: 1, companyName: 'A', logoUrl: '/a.png' },
      { id: 2, displayOrder: 2, companyName: 'B', logoUrl: '/b.png' },
      { id: 3, displayOrder: 3, companyName: 'C', logoUrl: '/c.png' },
      { id: 4, displayOrder: 4, companyName: 'D', logoUrl: '/d.png' },
      { id: 5, displayOrder: 5, companyName: 'E', logoUrl: '/e.png' },
    ],
  },
  fallback,
)
assert.equal(oddSponsors.partnerRows.length, 2)
assert.deepEqual(
  oddSponsors.partnerRows[0]?.map(row => row.name),
  ['A', 'B'],
)
assert.deepEqual(
  oddSponsors.partnerRows[1]?.map(row => row.name),
  ['C', 'D', 'E'],
)

const missing = mergePublicMainWithFallback(null, fallback)
assert.equal(missing.source, 'fallback')
assert.equal(missing.youtubeUrl, fallback.youtubeUrl)
assert.equal(missing.programs.length, 0)

console.log('map-public-main.selfcheck: ok')
