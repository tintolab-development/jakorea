/**
 * 홈페이지 공개 공지 mock.
 * 추후 어드민 PublicNoticeDetail 응답으로 교체 — 화면 모델은 map-detail 참고.
 */

import { useShouldUsePlatformMockData } from '@/shared/hooks'
import type { NoticeAttachment, NoticeDetail, NoticeListItem } from '../model/types'
import { shouldUsePlatformContentSeed } from '@/shared/lib/dev-auth'
import digitalCrimePreventionImageUrl from '../image/illustration/digital-crime-prevention.png'
import { getAdjacentFromNotices } from './adjacent'
import { filterAndSortNotices } from './filter-notices'
import {
  formatNoticePublishedAtDetailLabel,
  formatNoticePublishedAtLabel,
} from './format'

type CmsNoticeSeed = {
  id: string
  title: string
  content: string
  contentIsHtml?: boolean
  createdAt: string
  isImportant: boolean
  viewCount: number
  author: string
  status: 'published' | 'draft' | 'archived'
  attachments?: Array<Partial<NoticeAttachment> & { name: string }>
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
}

function htmlFromPlain(text: string) {
  return text
    .split(/\n{2,}/)
    .map(block => `<p>${escapeHtml(block.trim()).replace(/\n/g, '<br />')}</p>`)
    .join('')
}

function buildFeaturedNoticeHtml(imageSrc: string) {
  return [
    `<p><img src="${imageSrc}" alt="만화로 보는 디지털 범죄 예방법" width="600" style="width: 600px; max-width: 100%; height: auto; border-radius: 24px;" /></p>`,
    '<p>아시아·태평양 지역 예비 기업가 청소년이 참여하는<br>국제 청소년 창업 경진대회,<br>2026 JA AP Company of the Year Competition이<br>10년 만에 대한민국 서울에서 개최됩니다.</p>',
    '<p>※ Company of the Year Competition이란?<br>JA Company Program에 참여한 학생들의<br>창업 성과를 기념하고 축하하는<br>JA Worldwide의 대표적인 연례 대회입니다.<br>심사위원단의 평가를 통해 선발된 최종 수상팀은<br>\'올해의 JA 아시아·태평양 기업\'이라는 영예를 얻게 됩니다.</p>',
    '<p>이번 대회는 Creating Value in Every Color라는 주제로<br>3월 9일(월)부터 3월 13일(금)까지<br>서울 영등포 일대에서 진행되며,</p>',
    '<p>비즈니스 역량을 키울 수 있는 다양한 교육과<br>투자자를 직접 설득해보는<br>Business Presentation · Panel Interview 등<br>다채로운 프로그램으로 구성됐습니다.</p>',
    '<p>특별히 3월 11일(수) 12:30~15:00<br>청소년들의 창업 아이템을 직접 만나볼 수 있는<br>\'Trade Fair\'가<br>서울 영등포 타임스퀘어 지하 2층<br>영등포아트스퀘어에서 열립니다.</p>',
    '<p>2026 JA AP COYC에서<br>글로벌 비즈니스를 이끌어 갈<br>미래의 주역들을 만나볼 수 있는 기회를<br>놓치지 마세요!</p>',
    '<p>JA Korea는 모든 청소년의 도전을 응원합니다.</p>',
    '<p>Starts Here.<br>JA Korea</p>',
  ].join('')
}

const CMS_NOTICE_SEED: readonly CmsNoticeSeed[] = [
  {
    id: 'notice-86',
    title: '2026 JA AP Company of the Year Competition 개최 안내',
    content: buildFeaturedNoticeHtml(digitalCrimePreventionImageUrl),
    contentIsHtml: true,
    createdAt: '2026-01-15T15:00:00',
    isImportant: true,
    viewCount: 1232,
    author: '운영팀',
    status: 'published',
    attachments: [
      { id: 'notice-86-file-1', name: '디지털 범죄예방 코믹북.pdf' },
      {
        id: 'notice-86-file-2',
        name: '2026_JA_AP_COYC_프로그램_일정_및_참가안내_장파일명.pdf',
      },
    ],
  },
  {
    id: 'notice-85',
    title: 'JA Korea, 제5회 대한민국 착한기부대상 한국자선단체협의회 이사장상 수상',
    content:
      'JA Korea가 제5회 대한민국 착한기부대상에서 한국자선단체협의회 이사장상을 수상하였습니다.',
    createdAt: '2025-05-08T10:00:00',
    isImportant: true,
    viewCount: 2400,
    author: '대외협력팀',
    status: 'published',
  },
  {
    id: 'notice-84',
    title: '디지털 범죄예방 코믹북 다운로드',
    content: '디지털 범죄예방 코믹북을 다운로드하실 수 있습니다. 첨부파일을 확인해 주세요.',
    createdAt: '2024-05-08T10:00:00',
    isImportant: false,
    viewCount: 960,
    author: '교육팀',
    status: 'published',
    attachments: [{ name: '디지털_범죄예방_코믹북.pdf' }],
  },
  {
    id: 'notice-83',
    title: 'JA Worldwide Nominated for the 2023 Nobel Peace Prize',
    content: 'JA Worldwide가 2023년 노벨 평화상 후보로 추천되었습니다.',
    createdAt: '2023-05-08T10:00:00',
    isImportant: false,
    viewCount: 3100,
    author: '대외협력팀',
    status: 'published',
  },
  {
    id: 'notice-82',
    title: '2025년 1월 정산 신청 기간 및 방법 안내',
    content: `<p>안녕하세요. JA Korea입니다. 2025년 1월 정산 신청에 대해 안내드립니다.</p>
<ul>
<li>신청 기간: 2025년 1월 20일 ~ 1월 25일</li>
<li>대상: 1월 중 교육/봉사 활동을 완료한 모든 분</li>
<li>방법: 마이페이지 &gt; 정산 관리 &gt; 정산 신청 메뉴를 통해 접수</li>
</ul>
<table>
<thead><tr><th>항목</th><th>내용</th></tr></thead>
<tbody>
<tr><td>신청 기간</td><td>2025년 1월 20일 ~ 1월 25일</td></tr>
<tr><td>문의</td><td><a href="https://www.jakorea.org">www.jakorea.org</a></td></tr>
</tbody>
</table>
<p>기한 내 신청하지 않을 경우 다음 달로 이월되오니 유의하시기 바랍니다.</p>`,
    contentIsHtml: true,
    createdAt: '2025-01-15T10:00:00',
    isImportant: false,
    viewCount: 1250,
    author: '관리자',
    status: 'published',
  },
  {
    id: 'notice-81',
    title: '신규 봉사자 교육 매뉴얼 및 가이드라인 배포',
    content:
      '신규 봉사자분들을 위한 통합 교육 매뉴얼이 업데이트되었습니다. 첨부파일을 확인하여 활동에 참고하시기 바랍니다.',
    createdAt: '2025-01-10T14:00:00',
    isImportant: false,
    viewCount: 850,
    author: '운영팀',
    status: 'published',
    attachments: [{ name: '봉사자_교육_매뉴얼.pdf' }],
  },
  {
    id: 'notice-80',
    title: 'CMS 시스템 정기 점검 안내 (1월 20일)',
    content:
      '보다 안정적인 서비스 제공을 위해 시스템 정기 점검이 진행될 예정입니다. 점검 시간 동안은 접속이 제한됩니다.',
    createdAt: '2025-01-18T09:00:00',
    isImportant: false,
    viewCount: 0,
    author: 'IT지원팀',
    status: 'published',
  },
  {
    id: 'notice-79',
    title: '겨울방학 대학생 교육기부 모집 공고',
    content: '겨울방학 기간 동안 초등학교 금융교육을 담당할 대학생 봉사자를 모집합니다.',
    createdAt: '2025-01-05T11:00:00',
    isImportant: false,
    viewCount: 2100,
    author: '대외협력팀',
    status: 'published',
  },
  {
    id: 'notice-78',
    title: '2024 JA Korea 연차보고서 공개',
    content: '2024년 JA Korea 연차보고서를 홈페이지에 공개합니다. 투명경영 자료를 확인해 주세요.',
    createdAt: '2025-03-20T10:00:00',
    isImportant: false,
    viewCount: 680,
    author: '경영지원팀',
    status: 'published',
    attachments: [{ name: '2024_연차보고서.pdf' }],
  },
  {
    id: 'notice-77',
    title: '개인정보 처리방침 개정 안내',
    content: '개인정보 처리방침이 개정되었습니다. 변경 내용은 공지 본문을 참고해 주세요.',
    createdAt: '2025-02-28T09:00:00',
    isImportant: false,
    viewCount: 540,
    author: '관리자',
    status: 'published',
  },
  {
    id: 'notice-76',
    title: '2025 상반기 강사 워크숍 일정 안내',
    content: '2025년 상반기 강사 워크숍 일정이 확정되었습니다. 참석 대상자께는 개별 안내드립니다.',
    createdAt: '2025-02-15T10:00:00',
    isImportant: false,
    viewCount: 730,
    author: '강사운영팀',
    status: 'published',
  },
  {
    id: 'notice-75',
    title: 'JA Korea 홈페이지 리뉴얼 오픈 안내',
    content: 'JA Korea 홈페이지가 새롭게 리뉴얼되어 오픈되었습니다. 많은 이용 부탁드립니다.',
    createdAt: '2025-02-01T10:00:00',
    isImportant: false,
    viewCount: 1500,
    author: '운영팀',
    status: 'published',
  },
  {
    id: 'notice-74',
    title: '설 연휴 고객센터 운영 안내',
    content: '설 연휴 기간 고객센터 운영 시간을 안내드립니다. 긴급 문의는 이메일을 이용해 주세요.',
    createdAt: '2025-01-22T10:00:00',
    isImportant: false,
    viewCount: 390,
    author: '고객지원팀',
    status: 'published',
  },
  {
    id: 'notice-73',
    title: '2024 기부금영수증 발급 안내',
    content: '2024년 기부금영수증 발급 방법과 일정을 안내드립니다.',
    createdAt: '2025-01-08T10:00:00',
    isImportant: false,
    viewCount: 2200,
    author: '후원팀',
    status: 'published',
  },
  {
    id: 'notice-72',
    title: '금융교육 교재 개정판 배포 안내',
    content: '금융교육 교재 개정판이 배포됩니다. 신청 방법은 첨부 안내문을 확인해 주세요.',
    createdAt: '2024-12-10T10:00:00',
    isImportant: false,
    viewCount: 880,
    author: '교육팀',
    status: 'published',
  },
  {
    id: 'notice-71',
    title: 'Alumni 네트워킹 데이 개최 안내',
    content: 'JA Korea Alumni 네트워킹 데이 개최를 안내드립니다. 많은 참여 부탁드립니다.',
    createdAt: '2024-11-20T10:00:00',
    isImportant: false,
    viewCount: 610,
    author: 'Alumni팀',
    status: 'published',
  },
  {
    id: 'notice-70',
    title: '자원봉사 활동 확인서 발급 절차 변경 안내',
    content: '자원봉사 활동 확인서 발급 절차가 일부 변경되었습니다. 변경 사항을 확인해 주세요.',
    createdAt: '2024-10-15T10:00:00',
    isImportant: false,
    viewCount: 1120,
    author: '운영팀',
    status: 'published',
  },
  {
    id: 'notice-69',
    title: '2024 하반기 프로그램 모집 일정 안내',
    content: '2024년 하반기 주요 프로그램 모집 일정을 안내드립니다.',
    createdAt: '2024-09-01T10:00:00',
    isImportant: false,
    viewCount: 1750,
    author: '운영팀',
    status: 'published',
  },
  {
    id: 'notice-68',
    title: '여름방학 체험 캠프 참가자 모집',
    content: '여름방학 기간 청소년 대상 체험 캠프 참가자를 모집합니다.',
    createdAt: '2024-07-05T10:00:00',
    isImportant: false,
    viewCount: 980,
    author: '교육팀',
    status: 'published',
  },
  {
    id: 'notice-67',
    title: '서비스 이용약관 개정 사전 고지',
    content: '서비스 이용약관이 개정될 예정입니다. 개정안은 본 공지에서 확인해 주세요.',
    createdAt: '2024-06-12T10:00:00',
    isImportant: false,
    viewCount: 450,
    author: '관리자',
    status: 'published',
  },
  {
    id: 'notice-66',
    title: 'JA Korea 창립 기념 행사 안내',
    content: 'JA Korea 창립 기념 행사 일정을 안내드립니다. 관심 있는 분들의 참석을 환영합니다.',
    createdAt: '2024-04-20T10:00:00',
    isImportant: false,
    viewCount: 1320,
    author: '대외협력팀',
    status: 'published',
  },
  {
    id: 'notice-draft-1',
    title: '[작성 중] 2025년 상반기 강사 워크숍 안내',
    content: '2025년 상반기 강사 워크숍 일정이 확정되었습니다. 세부 내용을 작성 중입니다.',
    createdAt: '2025-01-20T10:00:00',
    isImportant: false,
    viewCount: 0,
    author: '관리자',
    status: 'draft',
  },
]

function mapSeedToDetail(notice: CmsNoticeSeed, no: number): NoticeDetail | null {
  if (notice.status !== 'published') return null

  return {
    id: notice.id,
    no,
    title: notice.title,
    isPinned: notice.isImportant,
    publishedAt: notice.createdAt,
    publishedAtLabel: formatNoticePublishedAtLabel(notice.createdAt),
    publishedAtDetailLabel: formatNoticePublishedAtDetailLabel(notice.createdAt),
    content: notice.contentIsHtml ? notice.content : htmlFromPlain(notice.content),
    contentFormat: 'html',
    author: notice.author,
    viewCount: notice.viewCount,
    attachments: (notice.attachments ?? []).map((file, index) => ({
      id: file.id ?? `${notice.id}-file-${index + 1}`,
      name: file.name,
      mime: file.mime,
      size: file.size,
      fileUrl: file.fileUrl,
    })),
  }
}

function toListItem(detail: NoticeDetail): NoticeListItem {
  return {
    id: detail.id,
    no: detail.no,
    title: detail.title,
    isPinned: detail.isPinned,
    publishedAt: detail.publishedAt,
    publishedAtLabel: detail.publishedAtLabel,
  }
}

/** published만, 최신순 기준으로 번호(no) 부여 후 고정 */
const MOCK_NOTICE_DETAILS: NoticeDetail[] = (() => {
  const published = CMS_NOTICE_SEED.filter(item => item.status === 'published')
  const byDateDesc = [...published].sort((a, b) => {
    const timeA = Date.parse(a.createdAt)
    const timeB = Date.parse(b.createdAt)
    return (Number.isNaN(timeB) ? 0 : timeB) - (Number.isNaN(timeA) ? 0 : timeA)
  })
  const baseNo = byDateDesc.length
  return byDateDesc
    .map((seed, index) => mapSeedToDetail(seed, baseNo - index))
    .filter((item): item is NoticeDetail => item !== null)
})()

export type NoticeCatalogItem = NoticeListItem & { content: string }

export function getMockNotices(): NoticeCatalogItem[] {
  if (!shouldUsePlatformContentSeed()) return []
  return MOCK_NOTICE_DETAILS.map(detail => ({
    ...toListItem(detail),
    content: detail.content,
  }))
}

export function getMockNoticeById(id: string): NoticeListItem | null {
  if (!shouldUsePlatformContentSeed()) return null
  const found = MOCK_NOTICE_DETAILS.find(item => item.id === id)
  return found ? toListItem(found) : null
}

export function getMockNoticeDetailById(id: string): NoticeDetail | null {
  if (!shouldUsePlatformContentSeed()) return null
  const found = MOCK_NOTICE_DETAILS.find(item => item.id === id)
  return found
    ? {
        ...found,
        attachments: found.attachments.map(file => ({ ...file })),
      }
    : null
}

export function useMockNoticesCatalog(): NoticeCatalogItem[] {
  useShouldUsePlatformMockData()
  return getMockNotices()
}

export function useMockNoticeDetail(id: string | null): NoticeDetail | null {
  useShouldUsePlatformMockData()
  if (!id) return null
  return getMockNoticeDetailById(id)
}

/**
 * mock 카탈로그 기준 인접 글. remote는 `useNoticeDetail().adjacent` 를 쓴다.
 */
export function getAdjacentNotices(id: string) {
  return getAdjacentFromNotices(filterAndSortNotices(getMockNotices(), { q: '' }), id)
}
