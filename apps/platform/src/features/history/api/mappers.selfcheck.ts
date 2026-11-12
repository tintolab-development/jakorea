/**
 * 공개 JA History 매퍼
 *
 * 빈 기간은 유지한다. 개행은 한 줄로 합치지 않는다. version은 화면 모델에 없다.
 */
import assert from 'node:assert/strict'
import { mapPublicJaHistoryPage, type HistoryMediaResolver } from './mappers.ts'
import type { HistoryPageView } from '../model/view.ts'
import type { PublicJaHistoryPageResponse } from './types.ts'

const fallback: HistoryPageView = {
  hero: {
    image: { url: '/fallback-hero.png', alt: '히어로' },
    eyebrow: 'JA History',
    mainText: 'FALLBACK',
  },
  origin: {
    yearMark: { url: '/year.svg', alt: '' },
    englishTitle: 'EN',
    koreanTitle: 'KO',
    body: 'origin',
  },
  learning: {
    eyebrow: 'EYE',
    title: '학습',
    body: '본문',
    image: { url: '/learning.png', alt: '학습 사진' },
    outro: '아웃트로',
    emphasis: '강조',
  },
  eras: [],
  world: {
    image: { url: '/world.png', alt: '세계' },
    title: '세계 제목',
    body: '세계 본문',
    periods: [],
  },
  korea: {
    image: { url: '/korea.png', alt: '한국' },
    title: '한국 제목',
    body: '한국 본문',
    periods: [],
  },
  philosophy: { eyebrow: '', title: '', lead: '', cards: [] },
  thrive: { title: '', lead: '', footnote: '', cards: [] },
  cta: {
    title: '',
    body: '',
    image: { url: '/cta.png', alt: 'cta' },
    primaryLabel: '',
    primaryHref: '/programs',
    secondaryLabel: '',
    secondaryHref: '/impact',
  },
}

const resolveMedia: HistoryMediaResolver = (media, slot) => {
  const remote = typeof media?.url === 'string' ? media.url.trim() : ''
  if (remote) return { url: remote, alt: typeof media?.alt === 'string' ? media.alt : slot.alt }
  const fileName = typeof media?.fileName === 'string' && media.fileName ? media.fileName : slot.fileName
  return { url: `local:${fileName}`, alt: typeof media?.alt === 'string' ? media.alt : slot.alt }
}

const page: PublicJaHistoryPageResponse = {
  hero: {
    image: { assetId: 1, fileName: 'hero-visual.png', alt: 'JA History 히어로', url: null },
    eyebrow: 'JA History',
    mainText: 'BOUNDLESS YOUTH;\nTHRIVING COMMUNITIES',
  },
  origin: {
    title: 'A WORLD OF POSSIBILITIES\n청소년을 위한 100년의 여정',
    body: '첫째 단락\n\n둘째 단락',
    learningEmphasis: '직접 해보는 경험이\n스스로를 믿는 힘이 됩니다.',
  },
  eras: {
    items: [
      {
        year: 1920,
        caption: '미국 메사추세츠 스프링필드에서 열린\nTrade Fair에 모자를 비롯한 상품들이 전시되어 있다.',
        image: { fileName: 'era-1920.png', alt: '1920 사진', url: null },
      },
    ],
  },
  worldTimeline: {
    image: { fileName: 'expansion-photo.png', alt: '세계 사진', url: null },
    title: '세상이 바뀔 때마다\nJA의 교육도 진화했습니다.',
    body: '본문',
    periods: [
      {
        id: '1919-1929',
        label: '1919-1929',
        title: '청소년 비즈니스 교육의 시작',
        events: [
          { year: 1919, text: '방과후교실에서 비즈니스 교육 시작' },
          { year: 1920, text: 'Junior Achivement로 이름 변경' },
          { year: 1929, text: '실물 창업에 기반한 기업가정신 교육 진행' },
        ],
      },
      { id: '1955-1962', label: '1955-1962', title: '', events: [] },
      { id: '1969-2000', label: '1969-2000', title: '', events: [] },
      { id: '2019-now', label: '2019-Now', title: '', events: [] },
    ],
  },
  koreaTimeline: {
    periods: [
      {
        id: '2002-2006',
        label: '2002-2006',
        title: '한국에서 시작된 JA 교육',
        events: [
          {
            year: 2006,
            text: '2006년 대학생경제교육봉사단 UJAT 출범\n고등학교 대상 글로벌 기업가정신 교육 프로그램 운영',
          },
        ],
      },
    ],
  },
}

const view = mapPublicJaHistoryPage(page, resolveMedia, fallback)

assert.equal(view.hero.mainText, 'BOUNDLESS YOUTH;\nTHRIVING COMMUNITIES')
assert.equal(view.hero.mainText.includes('\n'), true)
assert.equal(view.hero.image.url, 'local:hero-visual.png')
assert.equal('version' in view, false)

assert.equal(view.origin.body, '첫째 단락\n\n둘째 단락')
assert.equal(view.origin.englishTitle, 'A WORLD OF POSSIBILITIES')
assert.equal(view.origin.koreanTitle, '청소년을 위한 100년의 여정')
assert.equal(view.learning.emphasis.includes('\n'), true)

assert.equal(view.eras.length, 1)
assert.equal(view.eras[0]?.year, '1920')
assert.equal(view.eras[0]?.image.url, 'local:era-1920.png')
assert.equal(view.eras[0]?.caption.includes('\n'), true)

assert.equal(view.world.periods.length, 4)
assert.equal(view.world.periods[1]?.id, '1955-1962')
assert.equal(view.world.periods[1]?.title, '')
assert.equal(view.world.periods[1]?.events.length, 0)
assert.equal(view.world.periods[0]?.events[1]?.text, 'Junior Achivement로 이름 변경')

assert.equal(
  view.korea.periods[0]?.events[0]?.text,
  '2006년 대학생경제교육봉사단 UJAT 출범\n고등학교 대상 글로벌 기업가정신 교육 프로그램 운영',
)

const sparse = mapPublicJaHistoryPage(
  {
    worldTimeline: {
      periods: [{ id: '1955-1962', label: '1955-1962', title: '', events: [] }],
    },
  },
  resolveMedia,
  fallback,
)
assert.equal(sparse.world.periods.length, 1)
assert.equal(sparse.world.periods[0]?.title, '')
assert.equal(sparse.hero.mainText, 'FALLBACK')

const labels = mapPublicJaHistoryPage(
  {
    worldTimeline: {
      periods: [
        {
          id: '1969-2000',
          label: '1969-2000',
          title: '',
          events: [
            { year: '1980 ~ 1990', text: '아프리카, 중남미, 유럽, 아시아로 JA 네트워크 확장' },
          ],
        },
        {
          id: '2019-now',
          label: '2019-Now',
          title: '',
          events: [{ year: 'Now', text: '2050년까지 청소년에게 연간 1억 건의 학습 경험 제공 목표' }],
        },
      ],
    },
  },
  resolveMedia,
  fallback,
)
assert.equal(labels.world.periods.length, 2)
assert.equal(labels.world.periods[0]?.events[0]?.year, '1980 ~ 1990')
assert.equal(labels.world.periods[1]?.events[0]?.year, 'Now')
assert.equal(labels.korea.periods.length, 0)

/** 내용이 빈 이벤트(연도만 있는 행)는 세계·한국 연혁 모두에서 숨긴다(QA-0485). 기간은 유지한다. */
const emptyEvents = mapPublicJaHistoryPage(
  {
    worldTimeline: {
      periods: [
        {
          id: '1919-1954',
          label: '1919-1954',
          title: '',
          events: [
            { year: '1919', text: 'JA 설립' },
            { year: '1925', text: '' },
            { year: '1930', text: '   ' },
            { year: '1940' },
          ],
        },
      ],
    },
    koreaTimeline: {
      periods: [
        { id: '2002-2010', label: '2002-2010', title: '', events: [{ year: '2002', text: '' }] },
      ],
    },
  } as unknown as PublicJaHistoryPageResponse,
  resolveMedia,
  fallback,
)
assert.deepEqual(
  emptyEvents.world.periods[0]?.events.map(event => event.year),
  ['1919'],
)
assert.equal(emptyEvents.korea.periods.length, 1)
assert.equal(emptyEvents.korea.periods[0]?.events.length, 0)

const philosophyRemote = mapPublicJaHistoryPage(
  {
    philosophy: {
      cards: [
        {
          id: 'practice',
          title: '직접 해보며 익힙니다',
          description: '설명',
          image: {
            assetId: 101,
            fileName: 'practice.png',
            alt: '헤드셋을 착용하고 미소 짓는 청소년',
            url: 'https://cdn.example/assets/practice.png',
          },
        },
      ],
    },
  },
  resolveMedia,
  fallback,
)
assert.equal(philosophyRemote.philosophy.cards[0]?.image.url, 'https://cdn.example/assets/practice.png')

const philosophyEmptyImage = mapPublicJaHistoryPage(
  {
    philosophy: {
      cards: [
        {
          id: 'practice',
          title: '직접 해보며 익힙니다',
          description: '설명',
          image: { fileName: 'philosophy-practice.png', url: null },
        },
      ],
    },
  },
  resolveMedia,
  fallback,
)
assert.equal(philosophyEmptyImage.philosophy.cards[0]?.image.url, '')
