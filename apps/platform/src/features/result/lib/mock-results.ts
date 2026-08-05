/**
 * CMS 프로그램 결과 공지 mock 미러.
 * SSOT: apps/cms/src/data/mock/notices.ts (`mockProgramResultNotices`)
 */

import type { ResultAttachment, ResultDetail, ResultListItem } from '../model/types'
import { filterAndSortResults } from './filter-results'
import {
  findNoticeCategoryByName,
  RESULT_ANNOUNCEMENT_CATEGORY_NAMES,
} from './mock-notice-categories'

type CmsProgramResultNoticeSeed = {
  id: string
  title: string
  category: (typeof RESULT_ANNOUNCEMENT_CATEGORY_NAMES)[number]
  createdAt: string
  status: 'published' | 'draft' | 'archived'
  content: string
  author: string
  viewCount: number
  attachments?: ResultAttachment[]
}

/** 목록용: 2026년 09월 15일 */
function formatAnnouncedAtLabel(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return '-'

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}년 ${m}월 ${d}일`
}

/** 상세 메타용 — 예: 2026년 01월 15일 오후 3:00 */
function formatAnnouncedAtDetailLabel(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return '-'

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const hours24 = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const period = hours24 < 12 ? '오전' : '오후'
  const hours12 = hours24 % 12 || 12
  return `${y}년 ${m}월 ${d}일 ${period} ${hours12}:${minutes}`
}

/** CMS `mockProgramResultNotices`와 동기 */
const CMS_PROGRAM_RESULT_NOTICE_SEED: readonly CmsProgramResultNoticeSeed[] = [
  {
    id: 'notice-result-1',
    title: '2026 국제무역창업대회(International Trade Challenge, ITC) 참가자 발표',
    category: '최종 합격 발표',
    createdAt: '2026-01-15T15:00:00',
    status: 'published',
    content:
      '2026 국제무역창업대회(ITC) 참가자 최종 결과를 발표합니다. 합격하신 분들께는 개별 안내드릴 예정입니다.',
    author: '운영팀',
    viewCount: 1232,
    attachments: [{ name: 'ITC_2026_참가자_명단.pdf' }],
  },
  {
    id: 'notice-result-2',
    title: '2026 JA Korea 대학생경제교육봉사단 UJAT36기 최종 합격 발표',
    category: '최종 합격 발표',
    createdAt: '2026-09-15T09:00:00',
    status: 'published',
    content: `안녕하세요. JA Korea입니다.

2026 JA Korea 대학생경제교육봉사단 UJAT36기에 지원해 주신 모든 분들께 감사드립니다.

엄격한 서류 심사와 면접을 거쳐 최종 합격자를 아래와 같이 발표합니다.

## [최종 합격자 안내]

상세 합격자 명단은 첨부파일을 확인해 주세요. 합격하신 분들께는 개별 안내 메일·문자를 발송할 예정입니다.

## [합격자 안내 사항]

- 합격자 대상 오리엔테이션 참석이 필수입니다.
- 제출 서류 및 일정은 첨부 안내문을 참고해 주세요.
- 미제출·미참석 시 합격이 취소될 수 있습니다.

## [추후 상세 일정]

- 합격자 서류 제출 및 오리엔테이션 일정은 첨부 「향후 일정 안내」를 확인해 주세요.
- 일정 변경 시 홈페이지 공지 및 개별 안내로 공지합니다.

문의: jakorea@jakorea.org / 02-783-2367

감사합니다.
JA Korea 드림`,
    author: '홍길동 매니저',
    viewCount: 915000,
    attachments: [
      { name: '[명단] UJAT 36기 최종합격 명단.pdf' },
      { name: '[안내문] UJAT 36기 향후 일정 안내.pdf' },
    ],
  },
  {
    id: 'notice-result-3',
    title: '2026 JA Korea 금융교육 강사단 서류 심사 결과',
    category: '서류 심사 결과',
    createdAt: '2026-09-14T14:00:00',
    status: 'published',
    content: '금융교육 강사단 모집 서류 심사 결과를 안내드립니다.',
    author: '강사운영팀',
    viewCount: 960,
  },
  {
    id: 'notice-result-4',
    title: '2026 JA Korea 대학생경제교육봉사단 UJAT36기 서류합격발표',
    category: '서류 심사 결과',
    createdAt: '2026-09-12T11:00:00',
    status: 'published',
    content: 'UJAT36기 1차 서류 합격자를 발표합니다.',
    author: '운영팀',
    viewCount: 2100,
  },
  {
    id: 'notice-result-5',
    title: 'SAMSUNG X JA Korea 참가자 선정 발표',
    category: '최종 합격 발표',
    createdAt: '2026-09-10T16:00:00',
    status: 'published',
    content: 'SAMSUNG X JA Korea 프로그램 참가자 선정 결과를 발표합니다.',
    author: '대외협력팀',
    viewCount: 3100,
  },
  {
    id: 'notice-result-6',
    title: '2026 기업가정신 캠프 참가자 최종 발표',
    category: '최종 합격 발표',
    createdAt: '2026-09-08T10:00:00',
    status: 'published',
    content: '기업가정신 캠프 참가자 최종 명단을 발표합니다.',
    author: '운영팀',
    viewCount: 740,
  },
  {
    id: 'notice-result-7',
    title: '2026 경제금융교육 전문강사단 모집 서류 심사 결과',
    category: '서류 심사 결과',
    createdAt: '2026-09-05T13:00:00',
    status: 'published',
    content: '경제금융교육 전문강사단 서류 심사 결과를 안내드립니다.',
    author: '강사운영팀',
    viewCount: 880,
    attachments: [{ name: '서류심사_안내.pdf' }],
  },
  {
    id: 'notice-result-8',
    title: '2026 특별한 JOB담 봉사자 최종 합격 발표',
    category: '최종 합격 발표',
    createdAt: '2026-09-01T09:30:00',
    status: 'published',
    content: '특별한 JOB담 봉사자 최종 합격자를 발표합니다.',
    author: '운영팀',
    viewCount: 1250,
  },
  {
    id: 'notice-result-9',
    title: '2026 디지털 리터러시 프로그램 참가자 발표',
    category: '최종 합격 발표',
    createdAt: '2026-08-28T15:00:00',
    status: 'published',
    content: '디지털 리터러시 프로그램 참가자 최종 결과를 발표합니다.',
    author: '교육팀',
    viewCount: 640,
  },
  {
    id: 'notice-result-10',
    title: '2026 진로취업 아카데미 서류 심사 결과',
    category: '서류 심사 결과',
    createdAt: '2026-08-25T11:00:00',
    status: 'published',
    content: '진로취업 아카데미 서류 심사 결과를 안내드립니다.',
    author: '교육팀',
    viewCount: 520,
  },
  {
    id: 'notice-result-11',
    title: '2026 JA Korea 여름 캠프 최종 합격 발표',
    category: '최종 합격 발표',
    createdAt: '2026-08-20T10:00:00',
    status: 'published',
    content: '여름 캠프 최종 합격자를 발표합니다.',
    author: '운영팀',
    viewCount: 990,
  },
  {
    id: 'notice-result-12',
    title: '2026 금융문해력 강사 모집 서류 심사 결과',
    category: '서류 심사 결과',
    createdAt: '2026-08-18T14:00:00',
    status: 'published',
    content: '금융문해력 강사 모집 서류 심사 결과를 안내드립니다.',
    author: '강사운영팀',
    viewCount: 430,
  },
]

function mapNoticeToResultDetail(notice: CmsProgramResultNoticeSeed): ResultDetail | null {
  if (notice.status !== 'published') return null

  const category = findNoticeCategoryByName(notice.category)
  if (!category) return null

  return {
    id: notice.id,
    title: notice.title,
    categoryId: category.id,
    categoryName: category.name,
    announcedAt: notice.createdAt,
    announcedAtLabel: formatAnnouncedAtLabel(notice.createdAt),
    announcedAtDetailLabel: formatAnnouncedAtDetailLabel(notice.createdAt),
    content: notice.content,
    author: notice.author,
    viewCount: notice.viewCount,
    attachments: (notice.attachments ?? []).map(file => ({ ...file })),
  }
}

function toListItem(detail: ResultDetail): ResultListItem {
  return {
    id: detail.id,
    title: detail.title,
    categoryId: detail.categoryId,
    categoryName: detail.categoryName,
    announcedAt: detail.announcedAt,
    announcedAtLabel: detail.announcedAtLabel,
  }
}

const MOCK_RESULT_DETAILS = CMS_PROGRAM_RESULT_NOTICE_SEED.map(mapNoticeToResultDetail).filter(
  (item): item is ResultDetail => item !== null
)

export function getMockResults(): ResultListItem[] {
  return MOCK_RESULT_DETAILS.map(toListItem)
}

export function getMockResultById(id: string): ResultListItem | null {
  const found = MOCK_RESULT_DETAILS.find(item => item.id === id)
  return found ? toListItem(found) : null
}

export function getMockResultDetailById(id: string): ResultDetail | null {
  const found = MOCK_RESULT_DETAILS.find(item => item.id === id)
  return found
    ? {
        ...found,
        attachments: found.attachments.map(file => ({ ...file })),
      }
    : null
}

export function useMockResultsCatalog(): ResultListItem[] {
  return getMockResults()
}

export function useMockResultDetail(id: string | null): ResultDetail | null {
  if (!id) return null
  return getMockResultDetailById(id)
}

export type AdjacentResults = {
  previous: ResultListItem | null
  next: ResultListItem | null
}

/**
 * 최신순(발표일 desc) 기준 인접 글.
 * - previous(이전글): 목록에서 아래(더 오래된) 글
 * - next(다음글): 목록에서 위(더 최근) 글
 */
export function getAdjacentResults(id: string): AdjacentResults {
  const sorted = filterAndSortResults(getMockResults(), {
    category: 'all',
    q: '',
    sort: 'latest',
  })
  const index = sorted.findIndex(item => item.id === id)
  if (index < 0) {
    return { previous: null, next: null }
  }
  return {
    next: index > 0 ? (sorted[index - 1] ?? null) : null,
    previous: index < sorted.length - 1 ? (sorted[index + 1] ?? null) : null,
  }
}
