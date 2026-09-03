/**
 * 공지사항 Mock 데이터
 */

import dayjs from 'dayjs'

export interface NoticeAttachment {
  name: string
  /** API 연동 시 — 없으면 mock placeholder 텍스트 파일로 다운로드 */
  fileUrl?: string
}

export interface Notice {
  id: string
  title: string
  content: string
  /** 관리자에서 동적 카테고리 추가 가능 — mock·스토어와 문자열로 일치 */
  category: string
  createdAt: string
  /** 수정일시 — API에 없으면 createdAt으로 표시 */
  updatedAt?: string
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

/** Platform 「결과 확인」목록용 — 카테고리: 최종 합격 발표 | 서류 심사 결과 */
export const PROGRAM_RESULT_NOTICE_CATEGORIES = [
  '최종 합격 발표',
  '서류 심사 결과',
] as const

export type ProgramResultNoticeCategory = (typeof PROGRAM_RESULT_NOTICE_CATEGORIES)[number]

export function isProgramResultNoticeCategory(category: string): category is ProgramResultNoticeCategory {
  return (PROGRAM_RESULT_NOTICE_CATEGORIES as readonly string[]).includes(category)
}

/** 프로그램 결과 발표 공지 mock (CMS 공지 카테고리·게시글과 동일 Notice shape) */
export const mockProgramResultNotices: Notice[] = [
  {
    id: 'notice-result-1',
    title: '2026 국제무역창업대회(International Trade Challenge, ITC) 참가자 발표',
    content:
      '2026 국제무역창업대회(ITC) 참가자 최종 결과를 발표합니다. 합격하신 분들께는 개별 안내드릴 예정입니다.',
    category: '최종 합격 발표',
    createdAt: '2026-09-15T10:00:00',
    isImportant: true,
    viewCount: 1820,
    hasAttachment: false,
    author: '운영팀',
    status: 'published',
  },
  {
    id: 'notice-result-2',
    title: '2026 JA Korea 대학생경제교육봉사단 UJAT36기 최종 합격 발표',
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
    category: '최종 합격 발표',
    createdAt: '2026-09-15T09:00:00',
    isImportant: true,
    viewCount: 915000,
    hasAttachment: true,
    attachments: [
      { name: '[명단] UJAT 36기 최종합격 명단.pdf' },
      { name: '[안내문] UJAT 36기 향후 일정 안내.pdf' },
    ],
    author: '홍길동 매니저',
    status: 'published',
  },
  {
    id: 'notice-result-3',
    title: '2026 JA Korea 금융교육 강사단 서류 심사 결과',
    content: '금융교육 강사단 모집 서류 심사 결과를 안내드립니다.',
    category: '서류 심사 결과',
    createdAt: '2026-09-14T14:00:00',
    isImportant: false,
    viewCount: 960,
    hasAttachment: false,
    author: '강사운영팀',
    status: 'published',
  },
  {
    id: 'notice-result-4',
    title: '2026 JA Korea 대학생경제교육봉사단 UJAT36기 서류합격발표',
    content: 'UJAT36기 1차 서류 합격자를 발표합니다.',
    category: '서류 심사 결과',
    createdAt: '2026-09-12T11:00:00',
    isImportant: true,
    viewCount: 2100,
    hasAttachment: false,
    author: '운영팀',
    status: 'published',
  },
  {
    id: 'notice-result-5',
    title: 'SAMSUNG X JA Korea 참가자 선정 발표',
    content: 'SAMSUNG X JA Korea 프로그램 참가자 선정 결과를 발표합니다.',
    category: '최종 합격 발표',
    createdAt: '2026-09-10T16:00:00',
    isImportant: true,
    viewCount: 3100,
    hasAttachment: false,
    author: '대외협력팀',
    status: 'published',
  },
  {
    id: 'notice-result-6',
    title: '2026 기업가정신 캠프 참가자 최종 발표',
    content: '기업가정신 캠프 참가자 최종 명단을 발표합니다.',
    category: '최종 합격 발표',
    createdAt: '2026-09-08T10:00:00',
    isImportant: false,
    viewCount: 740,
    hasAttachment: false,
    author: '운영팀',
    status: 'published',
  },
  {
    id: 'notice-result-7',
    title: '2026 경제금융교육 전문강사단 모집 서류 심사 결과',
    content: '경제금융교육 전문강사단 서류 심사 결과를 안내드립니다.',
    category: '서류 심사 결과',
    createdAt: '2026-09-05T13:00:00',
    isImportant: false,
    viewCount: 880,
    hasAttachment: true,
    attachments: [{ name: '서류심사_안내.pdf' }],
    author: '강사운영팀',
    status: 'published',
  },
  {
    id: 'notice-result-8',
    title: '2026 특별한 JOB담 봉사자 최종 합격 발표',
    content: '특별한 JOB담 봉사자 최종 합격자를 발표합니다.',
    category: '최종 합격 발표',
    createdAt: '2026-09-01T09:30:00',
    isImportant: true,
    viewCount: 1250,
    hasAttachment: false,
    author: '운영팀',
    status: 'published',
  },
  {
    id: 'notice-result-9',
    title: '2026 디지털 리터러시 프로그램 참가자 발표',
    content: '디지털 리터러시 프로그램 참가자 최종 결과를 발표합니다.',
    category: '최종 합격 발표',
    createdAt: '2026-08-28T15:00:00',
    isImportant: false,
    viewCount: 640,
    hasAttachment: false,
    author: '교육팀',
    status: 'published',
  },
  {
    id: 'notice-result-10',
    title: '2026 진로취업 아카데미 서류 심사 결과',
    content: '진로취업 아카데미 서류 심사 결과를 안내드립니다.',
    category: '서류 심사 결과',
    createdAt: '2026-08-25T11:00:00',
    isImportant: false,
    viewCount: 520,
    hasAttachment: false,
    author: '교육팀',
    status: 'published',
  },
  {
    id: 'notice-result-11',
    title: '2026 JA Korea 여름 캠프 최종 합격 발표',
    content: '여름 캠프 최종 합격자를 발표합니다.',
    category: '최종 합격 발표',
    createdAt: '2026-08-20T10:00:00',
    isImportant: false,
    viewCount: 990,
    hasAttachment: false,
    author: '운영팀',
    status: 'published',
  },
  {
    id: 'notice-result-12',
    title: '2026 금융문해력 강사 모집 서류 심사 결과',
    content: '금융문해력 강사 모집 서류 심사 결과를 안내드립니다.',
    category: '서류 심사 결과',
    createdAt: '2026-08-18T14:00:00',
    isImportant: false,
    viewCount: 430,
    hasAttachment: false,
    author: '강사운영팀',
    status: 'published',
  },
]

/** Platform·공개 목록용 — 게시된 프로그램 결과 공지만 */
export function listPublishedProgramResultNotices(): Notice[] {
  return mockProgramResultNotices
    .filter(n => n.status === 'published' && isProgramResultNoticeCategory(n.category))
    .map(n => ({ ...n }))
}

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

