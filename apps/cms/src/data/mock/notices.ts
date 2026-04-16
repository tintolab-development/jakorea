/**
 * 공지사항 Mock 데이터
 */

import dayjs from 'dayjs'

export interface NoticeAttachment {
  name: string
}

export interface Notice {
  id: string
  title: string
  content: string
  category: '필독' | '안내' | '정산' | '시스템' | '봉사단' | '강사단'
  createdAt: string
  isImportant: boolean
  viewCount: number
  hasAttachment: boolean
  /** 상세·첨부 UI용 — 목록 mock에서만 채움 */
  attachments?: NoticeAttachment[]
  author: string
  status: 'published' | 'draft' | 'archived'
}

export const mockNotices: Notice[] = [
  {
    id: '1',
    title: '2025년 1월 정산 신청 기간 및 방법 안내',
    content: `안녕하세요. JAKorea입니다. 2025년 1월 정산 신청에 대해 안내드립니다.
    
1. 신청 기간: 2025년 1월 20일 ~ 1월 25일
2. 대상: 1월 중 교육/봉사 활동을 완료한 모든 분
3. 방법: 마이페이지 > 정산 관리 > 정산 신청 메뉴를 통해 접수

기한 내 신청하지 않을 경우 다음 달로 이월되오니 유의하시기 바랍니다.`,
    category: '정산',
    createdAt: '2025-01-15T10:00:00',
    isImportant: true,
    viewCount: 1250,
    hasAttachment: true,
    author: '관리자',
    status: 'published',
  },
  {
    id: '2',
    title: '신규 봉사자 교육 매뉴얼 및 가이드라인 배포',
    content: '신규 봉사자분들을 위한 통합 교육 매뉴얼이 업데이트되었습니다. 첨부파일을 확인하여 활동에 참고하시기 바랍니다.',
    category: '봉사단',
    createdAt: '2025-01-10T14:00:00',
    isImportant: true,
    viewCount: 850,
    hasAttachment: true,
    author: '운영팀',
    status: 'published',
  },
  {
    id: '3',
    title: 'CMS 시스템 정기 점검 안내 (1월 20일)',
    content: '보다 안정적인 서비스 제공을 위해 시스템 정기 점검이 진행될 예정입니다. 점검 시간 동안은 접속이 제한됩니다.',
    category: '시스템',
    createdAt: '2025-01-18T09:00:00',
    isImportant: false,
    viewCount: 420,
    hasAttachment: false,
    author: 'IT지원팀',
    status: 'published',
  },
  {
    id: '4',
    title: '겨울방학 대학생 교육기부 모집 공고',
    content: '겨울방학 기간 동안 초등학교 금융교육을 담당할 대학생 봉사자를 모집합니다.',
    category: '안내',
    createdAt: '2025-01-05T11:00:00',
    isImportant: false,
    viewCount: 2100,
    hasAttachment: false,
    author: '대외협력팀',
    status: 'published',
  },
  {
    id: '5',
    title: '[작성 중] 2025년 상반기 강사 워크숍 안내',
    content: '2025년 상반기 강사 워크숍 일정이 확정되었습니다. 세부 내용을 작성 중입니다.',
    category: '강사단',
    createdAt: '2025-01-20T10:00:00',
    isImportant: false,
    viewCount: 0,
    hasAttachment: false,
    author: '관리자',
    status: 'draft',
  },
]

const ADMIN_NOTICE_DEMO_ATTACHMENTS: NoticeAttachment[] = [
  { name: '(2026) JA Korea 경제금융교육 커리큘럼.pdf' },
  { name: 'JA Korea 공지 부록.pdf' },
]

/** mockNotices 인덱스(0~4) + 상단고정·공개여부·첨부 — 15건 고정 */
type AdminNoticeBuildSpec = {
  seedIndex: number
  isImportant: boolean
  status: Notice['status']
  hasAttachment: boolean
}

/** 15건: 상단 고정 3건, 공개/비공개(draft·archived)·첨부 유/무 혼합 */
const ADMIN_NOTICE_BUILD_SPECS: AdminNoticeBuildSpec[] = [
  { seedIndex: 0, isImportant: true, status: 'published', hasAttachment: true },
  { seedIndex: 1, isImportant: true, status: 'published', hasAttachment: true },
  { seedIndex: 2, isImportant: true, status: 'published', hasAttachment: false },
  { seedIndex: 3, isImportant: false, status: 'published', hasAttachment: false },
  { seedIndex: 4, isImportant: false, status: 'draft', hasAttachment: true },
  { seedIndex: 0, isImportant: false, status: 'published', hasAttachment: false },
  { seedIndex: 1, isImportant: false, status: 'archived', hasAttachment: true },
  { seedIndex: 2, isImportant: false, status: 'published', hasAttachment: false },
  { seedIndex: 3, isImportant: false, status: 'draft', hasAttachment: false },
  { seedIndex: 4, isImportant: false, status: 'published', hasAttachment: true },
  { seedIndex: 0, isImportant: false, status: 'archived', hasAttachment: false },
  { seedIndex: 1, isImportant: false, status: 'published', hasAttachment: true },
  { seedIndex: 2, isImportant: false, status: 'draft', hasAttachment: true },
  { seedIndex: 3, isImportant: false, status: 'published', hasAttachment: false },
  { seedIndex: 4, isImportant: false, status: 'published', hasAttachment: false },
]

/** CMS 관리자 공지 목록 mock 건수 — 목록·상세 조회와 동일해야 함 */
export const ADMIN_NOTICE_MOCK_LIST_COUNT = ADMIN_NOTICE_BUILD_SPECS.length

/** CMS 관리자 공지 목록 데모용 — 15건 고정, 스펙 기반 분포 */
export function buildAdminNoticeMockList(count: number = ADMIN_NOTICE_MOCK_LIST_COUNT): Notice[] {
  const nSeeds = mockNotices.length
  const take = Math.min(Math.max(0, count), ADMIN_NOTICE_BUILD_SPECS.length)
  return ADMIN_NOTICE_BUILD_SPECS.slice(0, take).map((spec, i) => {
    const seed = mockNotices[spec.seedIndex % nSeeds]
    const createdAt = dayjs(seed.createdAt).subtract(i, 'day').format('YYYY-MM-DDTHH:mm:ss')
    const attachments: NoticeAttachment[] | undefined = spec.hasAttachment
      ? i % 2 === 0
        ? [ADMIN_NOTICE_DEMO_ATTACHMENTS[0]]
        : [...ADMIN_NOTICE_DEMO_ATTACHMENTS]
      : undefined
    return {
      ...seed,
      id: `notice-admin-${i + 1}`,
      title: i < nSeeds ? seed.title : `${seed.title} (${i + 1})`,
      createdAt,
      viewCount: seed.viewCount + i * 17,
      isImportant: spec.isImportant,
      status: spec.status,
      hasAttachment: spec.hasAttachment,
      attachments,
    }
  })
}

let adminNoticeMockListCache: Notice[] | null = null

function getBuiltAdminNoticeMockList(): Notice[] {
  if (!adminNoticeMockListCache) {
    adminNoticeMockListCache = buildAdminNoticeMockList(ADMIN_NOTICE_MOCK_LIST_COUNT)
  }
  return adminNoticeMockListCache
}

/** 관리자 공지 상세 — 목록과 동일 ID·데이터 */
export function getAdminNoticeById(id: string): Notice | undefined {
  return getBuiltAdminNoticeMockList().find(n => n.id === id)
}
