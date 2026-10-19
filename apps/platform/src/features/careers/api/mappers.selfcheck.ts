/**
 * 공개 채용 안내 매퍼
 *
 * mainText·subTextKo 개행을 합치지 않는다. culture title에 `\n`을 넣지 않는다.
 * year로 월·일 라벨을 만들지 않는다. bannerImageUrl이 있으면 번들로 바꾸지 않는다.
 */
import assert from 'node:assert/strict'
import {
  formatCareerPublishedAtDetailLabel,
  formatCareerPublishedAtLabel,
  formatCareerRecruitPeriodLabel,
  mapPublicCareerGuide,
  mapPublicCareerPostingDetail,
  mapPublicCareerPostings,
} from './mappers.ts'
import type { CareersGuideView } from '../model/guide-view.ts'
import type {
  PublicCareerGuideResponse,
  PublicCareerPostingDetail,
  PublicCareerPostingListResponse,
} from './types.ts'

const fallback: CareersGuideView = {
  hero: {
    label: '인재채용',
    titleLines: ['가능성을 믿는 사람들이', '만드는 변화, 우리는 청소년의', '가능성을 믿습니다'],
    descriptionKo: [
      '신뢰와 존중을 바탕으로 함께 배우고 성장하며,',
      '그 가능성을 현실로 만들어갑니다.',
    ],
    descriptionEn: 'fallback en',
    imageUrl: '/bundle/hero.png',
    imageFallbackUrl: '/bundle/hero.png',
    imageAlt: 'alt',
  },
  thriveValues: [
    {
      id: 'impact',
      title: 'Make an Impact',
      summary: '청소년의 성장이라는 공동의 목적을 향해 함께 나아갑니다',
      summaryLines: ['청소년의 성장이라는', '공동의 목적을 향해 함께 나아갑니다'],
      detail: 'detail impact',
      detailLines: ['detail', 'impact'],
      tone: 'yellow',
      column: 'left',
      order: 0,
    },
    {
      id: 'learn',
      title: 'Keep Learning',
      summary: '배움은 성장의 시작입니다',
      summaryLines: ['배움은 성장의 시작입니다'],
      detail: 'detail learn',
      detailLines: ['detail', 'learn'],
      tone: 'sky',
      column: 'left',
      order: 1,
    },
    {
      id: 'speak',
      title: 'Speak Openly',
      summary: '좋은 아이디어는 열린 소통에서 시작됩니다',
      summaryLines: ['좋은 아이디어는', '열린 소통에서 시작됩니다'],
      detail: 'detail speak',
      detailLines: ['detail', 'speak'],
      tone: 'mint',
      column: 'right',
      order: 0,
    },
    {
      id: 'help',
      title: 'Ready to Help',
      summary: '협력은 서로를 존중하는 마음에서 시작됩니다',
      summaryLines: ['협력은 서로를 존중하는', '마음에서 시작됩니다'],
      detail: 'detail help',
      detailLines: ['detail', 'help'],
      tone: 'lime',
      column: 'right',
      order: 1,
    },
  ],
  featuredStories: [
    {
      id: 'story-metlife-2026',
      categoryLabel: '스토리',
      title: '메트라이프생명 사회공헌재단과 JA Korea의 여름과 겨울',
      titleLines: ['메트라이프생명 사회공헌재단과 JA', 'Korea의 여름과 겨울'],
      publishedAtLabel: '2026년 08월 15일',
      imageUrl: '/bundle/story.png',
    },
    {
      id: 'story-summer-camp',
      categoryLabel: '스토리',
      title: '청소년과 함께한 JA Korea 여름 캠프 이야기',
      publishedAtLabel: '2025년 07월 20일',
      imageUrl: '/bundle/story.png',
    },
    {
      id: 'story-volunteer-day',
      categoryLabel: '스토리',
      title: '임직원 봉사로 이어진 따뜻한 하루',
      publishedAtLabel: '2025년 03월 10일',
      imageUrl: '/bundle/story.png',
    },
  ],
}

const sample: PublicCareerGuideResponse = {
  mainText: '가능성을 믿는 사람들이\n만드는 변화, 우리는 청소년의\n가능성을 믿습니다',
  subTextKo: '신뢰와 존중을 바탕으로 함께 배우고 성장하며,\n그 가능성을 현실로 만들어갑니다.',
  subTextEn:
    'People who believe in young people, creating impact together through trust, partnership, and continuous learning.',
  bannerImageUrl: 'http://localhost:9000/homepage-public/local/seed/careers-hero.png',
  cultureItems: [
    {
      displayOrder: 1,
      code: 'MAKE_AN_IMPACT',
      label: 'Make an Impact',
      title: '청소년의 성장이라는 공동의 목적을 향해 함께 나아갑니다',
      description: 'impact desc',
    },
    {
      displayOrder: 2,
      code: 'KEEP_LEARNING',
      label: 'Keep Learning',
      title: '배움은 성장의 시작입니다',
      description: 'learn desc',
    },
    {
      displayOrder: 3,
      code: 'SPEAK_OPENLY',
      label: 'Speak Openly',
      title: '좋은 아이디어는 열린 소통에서 시작됩니다',
      description: 'speak desc',
    },
    {
      displayOrder: 4,
      code: 'READY_TO_HELP',
      label: 'Ready to Help',
      title: '협력은 서로를 존중하는 마음에서 시작됩니다',
      description: 'help desc',
    },
  ],
  interviews: [
    {
      displayOrder: 1,
      storyKey: 'story-metlife-2026',
      title: '메트라이프생명 사회공헌재단과 JA Korea의 여름과 겨울',
      year: 2026,
      coverImageUrl: 'http://localhost:9000/homepage-public/local/seed/careers-story-metlife.png',
    },
    {
      displayOrder: 2,
      storyKey: 'story-summer-camp',
      title: '청소년과 함께한 JA Korea 여름 캠프 이야기',
      year: 2025,
      coverImageUrl: 'http://localhost:9000/homepage-public/local/seed/careers-story-metlife.png',
    },
    {
      displayOrder: 3,
      storyKey: 'story-volunteer-day',
      title: '임직원 봉사로 이어진 따뜻한 하루',
      year: 2025,
      coverImageUrl: 'http://localhost:9000/homepage-public/local/seed/careers-story-metlife.png',
    },
  ],
}

const view = mapPublicCareerGuide(sample, fallback)

assert.equal(view.hero.label, '인재채용')
assert.deepEqual(view.hero.titleLines, [
  '가능성을 믿는 사람들이',
  '만드는 변화, 우리는 청소년의',
  '가능성을 믿습니다',
])
assert.equal(view.hero.titleLines.length, 3)
assert.deepEqual(view.hero.descriptionKo, [
  '신뢰와 존중을 바탕으로 함께 배우고 성장하며,',
  '그 가능성을 현실로 만들어갑니다.',
])
assert.equal(view.hero.imageUrl, sample.bannerImageUrl)
assert.match(view.hero.imageUrl, /careers-hero\.png/)

assert.equal(view.thriveValues.length, 4)
assert.equal(view.thriveValues[0]?.id, 'impact')
assert.equal(view.thriveValues[0]?.title, 'Make an Impact')
assert.ok(!view.thriveValues[0]!.summary.includes('\n'))
assert.deepEqual(view.thriveValues[0]?.summaryLines, [
  '청소년의 성장이라는',
  '공동의 목적을 향해 함께 나아갑니다',
])
assert.deepEqual(view.thriveValues[0]?.detailLines, ['impact desc'])
assert.equal(view.thriveValues[0]?.tone, 'yellow')

const withCultureBreaks = mapPublicCareerGuide(
  {
    ...sample,
    cultureItems: sample.cultureItems?.map((item, index) =>
      index === 0
        ? {
            ...item,
            title: '청소년의 성장이라는\n공동의 목적을 향해 함께 나아갑니다',
            description:
              '각자의 노력이 만드는 작은 변화가 더 큰 사회적 가치로 이어진다고 믿으며, 맡은 일에 책임감을 가지고\n긍정적인 변화를 만들어갑니다.',
          }
        : item,
    ),
  },
  fallback,
)
assert.deepEqual(withCultureBreaks.thriveValues[0]?.summaryLines, [
  '청소년의 성장이라는',
  '공동의 목적을 향해 함께 나아갑니다',
])
assert.deepEqual(withCultureBreaks.thriveValues[0]?.detailLines, [
  '각자의 노력이 만드는 작은 변화가 더 큰 사회적 가치로 이어진다고 믿으며, 맡은 일에 책임감을 가지고',
  '긍정적인 변화를 만들어갑니다.',
])
assert.ok(!withCultureBreaks.thriveValues[0]!.summary.includes('\n'))

assert.equal(view.featuredStories.length, 3)
assert.equal(view.featuredStories[0]?.id, 'story-metlife-2026')
assert.equal(view.featuredStories[0]?.categoryLabel, '스토리')
assert.equal(view.featuredStories[0]?.publishedAtLabel, '2026년 08월 15일')
assert.match(view.featuredStories[0]!.imageUrl, /careers-story-metlife\.png/)
assert.ok(view.featuredStories[0]?.titleLines)

const nullBanner = mapPublicCareerGuide(
  {
    ...sample,
    bannerImageUrl: null,
    interviews: sample.interviews?.map(item => ({ ...item, coverImageUrl: null })),
  },
  fallback,
)
assert.equal(nullBanner.hero.imageUrl, fallback.hero.imageUrl)
assert.equal(nullBanner.featuredStories[0]?.imageUrl, fallback.featuredStories[0]?.imageUrl)

console.log('careers mapPublicCareerGuide selfcheck: ok')

assert.equal(formatCareerPublishedAtLabel('2026-05-08'), '2026년 05월 08일')
assert.equal(formatCareerPublishedAtLabel('2026-05-08T00:00:00Z'), '2026년 05월 08일')

const postingSample: PublicCareerPostingListResponse = {
  items: [
    {
      id: 2,
      externalKey: 'job-2',
      status: 'RECRUITING',
      title: '마케팅·커뮤니케이션 담당자 채용',
      publishedOn: '2026-04-22',
    },
    {
      id: 1,
      externalKey: 'job-1',
      status: 'RECRUITING',
      title: '교육사업팀 프로그램 매니저 채용',
      publishedOn: '2026-05-08',
    },
    {
      id: 5,
      externalKey: 'job-5',
      status: 'CLOSED',
      title: '경영지원팀 회계·총무 담당자 채용',
      publishedOn: '2025-12-10',
    },
    {
      id: 3,
      externalKey: 'job-3',
      status: 'RESULT',
      title: '디지털 콘텐츠 기획자 채용 — 서류 합격자 안내',
      publishedOn: '2026-03-15',
    },
  ],
}

const jobs = mapPublicCareerPostings(postingSample)
assert.equal(jobs.length, 3)
assert.equal(jobs[0]?.id, 'job-1')
assert.equal(jobs[0]?.status, 'recruiting')
assert.equal(jobs[0]?.statusLabel, '모집중')
assert.equal(jobs[0]?.publishedAtLabel, '2026년 05월 08일')
assert.equal(jobs[1]?.id, 'job-2')
assert.equal(jobs[2]?.id, 'job-3')
assert.equal(jobs[2]?.statusLabel, '결과발표')
assert.ok(jobs.every(job => job.status !== 'closed'))

console.log('careers mapPublicCareerPostings selfcheck: ok')

assert.equal(formatCareerPublishedAtDetailLabel('2026-01-15'), '2026년 01월 15일')
assert.equal(
  formatCareerPublishedAtDetailLabel('2026-01-15T15:00:00'),
  '2026년 01월 15일 오후 3:00',
)
assert.equal(
  formatCareerRecruitPeriodLabel('2026-04-03', '2026-11-20'),
  '2026년 04월 03일(금) ~ 2026년 11월 20일(금)',
)
assert.equal(formatCareerRecruitPeriodLabel('2026-04-03', undefined), '')

const detailSample: PublicCareerPostingDetail = {
  id: 1,
  externalKey: 'job-1',
  status: 'RECRUITING',
  title: '교육사업팀 프로그램 매니저 채용',
  publishedOn: '2026-05-08',
  recruitStart: '2026-04-03',
  recruitEnd: '2026-11-20',
  body: '<p>본문</p>',
  viewCount: 1232,
  attachment: {
    assetId: 9,
    originalName: '모집요강.pdf',
    publicUrl: 'https://example.test/file.pdf',
    purpose: 'CAREERS_POSTING_ATTACHMENT',
    status: 'READY',
  },
}

const detail = mapPublicCareerPostingDetail(detailSample)
assert.equal(detail?.id, 'job-1')
assert.equal(detail?.statusLabel, '모집중')
assert.equal(detail?.publishedAtDetailLabel, '2026년 05월 08일')
assert.equal(detail?.recruitPeriodLabel, '2026년 04월 03일(금) ~ 2026년 11월 20일(금)')
assert.equal(detail?.viewCount, 1232)
assert.equal(detail?.content, '<p>본문</p>')
assert.equal(detail?.attachments.length, 1)
assert.equal(detail?.attachments[0]?.name, '모집요강.pdf')

const detailFromPublishedAt = mapPublicCareerPostingDetail({
  ...detailSample,
  publishedOn: undefined,
  publishedAt: '2026-05-08T15:00:00',
})
assert.equal(detailFromPublishedAt?.publishedAtLabel, '2026년 05월 08일')
assert.equal(detailFromPublishedAt?.publishedAtDetailLabel, '2026년 05월 08일 오후 3:00')
assert.equal(detail?.attachments[0]?.fileUrl, 'https://example.test/file.pdf')
assert.equal(
  mapPublicCareerPostingDetail({
    ...detailSample,
    body: '',
    recruitStart: null,
    recruitEnd: null,
    attachment: null,
    viewCount: 1,
  })?.content,
  '',
)
assert.equal(
  mapPublicCareerPostingDetail({
    ...detailSample,
    attachment: { originalName: '모집요강.pdf' },
  })?.attachments.length,
  0,
)
assert.equal(
  mapPublicCareerPostingDetail({
    ...detailSample,
    attachment: { publicUrl: 'https://example.test/file.pdf' },
  })?.attachments.length,
  0,
)

assert.equal(
  mapPublicCareerPostingDetail({
    id: 5,
    status: 'CLOSED',
    title: '마감',
    publishedOn: '2026-01-01',
  }),
  null,
)
assert.equal(
  mapPublicCareerPostingDetail({
    id: 8,
    status: 'RESULT',
    title: '결과',
    publishedOn: '2026-03-15',
    body: '<p>결과</p>',
  })?.recruitPeriodLabel,
  '',
)
assert.equal(
  mapPublicCareerPostingDetail({
    id: 8,
    status: 'RESULT',
    title: '결과',
    publishedOn: '2026-03-15',
  })?.viewCount,
  null,
)

console.log('careers mapPublicCareerPostingDetail selfcheck: ok')
