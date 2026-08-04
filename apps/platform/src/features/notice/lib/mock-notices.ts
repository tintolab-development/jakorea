/**
 * CMS 일반 공지 mock 미러 + 스크린샷 샘플.
 * SSOT 참고: apps/cms/src/data/mock/notices.ts (`mockNotices`)
 */

import type { NoticeAttachment, NoticeDetail, NoticeListItem } from '../model/types'

type CmsNoticeSeed = {
  id: string
  title: string
  content: string
  createdAt: string
  isImportant: boolean
  viewCount: number
  author: string
  status: 'published' | 'draft' | 'archived'
  attachments?: NoticeAttachment[]
}

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

/** 목록용: 2026년 05월 08일 */
function formatPublishedAtLabel(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return '-'

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}년 ${m}월 ${d}일`
}

/** 상세 메타용: 2026년 05월 08일(월) */
function formatPublishedAtDetailLabel(isoDate: string): string {
  const date = new Date(isoDate)
  if (Number.isNaN(date.getTime())) return '-'

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const w = WEEKDAY_KO[date.getDay()]
  return `${y}년 ${m}월 ${d}일(${w})`
}

/** CMS mockNotices + 스크린샷·페이지네이션용 보강 시드 */
const CMS_NOTICE_SEED: readonly CmsNoticeSeed[] = [
  {
    id: 'notice-86',
    title: '2026 JA AP Company of the Year Competition 개최 안내',
    content:
      '2026 JA AP Company of the Year Competition 개최를 안내드립니다. 참가 신청 및 일정은 첨부 안내문을 확인해 주세요.',
    createdAt: '2026-05-08T10:00:00',
    isImportant: true,
    viewCount: 1820,
    author: '운영팀',
    status: 'published',
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
    content: `안녕하세요. JA Korea입니다. 2025년 1월 정산 신청에 대해 안내드립니다.

1. 신청 기간: 2025년 1월 20일 ~ 1월 25일
2. 대상: 1월 중 교육/봉사 활동을 완료한 모든 분
3. 방법: 마이페이지 > 정산 관리 > 정산 신청 메뉴를 통해 접수

기한 내 신청하지 않을 경우 다음 달로 이월되오니 유의하시기 바랍니다.`,
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
    viewCount: 420,
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
    publishedAtLabel: formatPublishedAtLabel(notice.createdAt),
    publishedAtDetailLabel: formatPublishedAtDetailLabel(notice.createdAt),
    content: notice.content,
    author: notice.author,
    viewCount: notice.viewCount,
    attachments: (notice.attachments ?? []).map(file => ({ ...file })),
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
  return MOCK_NOTICE_DETAILS.map(detail => ({
    ...toListItem(detail),
    content: detail.content,
  }))
}

export function getMockNoticeById(id: string): NoticeListItem | null {
  const found = MOCK_NOTICE_DETAILS.find(item => item.id === id)
  return found ? toListItem(found) : null
}

export function getMockNoticeDetailById(id: string): NoticeDetail | null {
  const found = MOCK_NOTICE_DETAILS.find(item => item.id === id)
  return found
    ? {
        ...found,
        attachments: found.attachments.map(file => ({ ...file })),
      }
    : null
}

export function useMockNoticesCatalog(): NoticeCatalogItem[] {
  return getMockNotices()
}

export function useMockNoticeDetail(id: string | null): NoticeDetail | null {
  if (!id) return null
  return getMockNoticeDetailById(id)
}
