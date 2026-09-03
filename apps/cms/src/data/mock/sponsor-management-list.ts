/**
 * 후원사 관리 목록 전용 Mock (UI 시안·총 130건 기준)
 * — 프로그램 연동 `mockSponsors`와 분리 (목록 전용 필드·건수)
 */

import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import type { SponsorOrganizationKind, SponsorSponsorshipStatus } from '@/types/domain'

const MAIN_MANAGER = { name: '홍길동', phone: '010-5678-2342' }

const TS = '2026-03-30T09:00:00.000Z'
const START_SCREENSHOT = '2026-03-30T00:00:00.000Z'

/** 스크린샷 상단 13행 순서 (No. 내림차순 표시 시 첫 행이 130에 해당) */
const SCREENSHOT_LEADING: Array<{
  name: string
  organizationKind: SponsorOrganizationKind
  sponsorshipStatus: SponsorSponsorshipStatus
}> = [
  { name: '제이에이코리아', organizationKind: 'foundation', sponsorshipStatus: 'active' },
  { name: '스타벅스', organizationKind: 'corporate', sponsorshipStatus: 'active' },
  { name: '삼성꿈장학재단', organizationKind: 'foundation', sponsorshipStatus: 'active' },
  { name: '한국청소년활동진흥원', organizationKind: 'foundation', sponsorshipStatus: 'active' },
  { name: '현대 자동차', organizationKind: 'corporate', sponsorshipStatus: 'active' },
  { name: 'SK하이닉스', organizationKind: 'corporate', sponsorshipStatus: 'active' },
  { name: 'LG화학', organizationKind: 'corporate', sponsorshipStatus: 'active' },
  { name: '네이버', organizationKind: 'corporate', sponsorshipStatus: 'active' },
  { name: '카카오', organizationKind: 'corporate', sponsorshipStatus: 'active' },
  { name: '포스코홀딩스', organizationKind: 'corporate', sponsorshipStatus: 'ended' },
  { name: '신한금융그룹', organizationKind: 'corporate', sponsorshipStatus: 'ended' },
  { name: 'KB국민은행', organizationKind: 'corporate', sponsorshipStatus: 'active' },
  { name: '한화생명', organizationKind: 'corporate', sponsorshipStatus: 'ended' },
  { name: '아름다운 재단', organizationKind: 'foundation', sponsorshipStatus: 'active' },
]

const FILLER_BASE = [
  '삼성전자',
  'LG전자',
  'SK텔레콤',
  'KT',
  '토스',
  '쿠팡',
  '배달의민족',
  '롯데',
  '신세계',
  'GS리테일',
  '한화시스템',
  '두산',
  '기아',
  'CJ그룹',
  '현대모비스',
  'LG디스플레이',
  'SK바이오사이언스',
  '코웨이',
  '아모레퍼시픽',
  '한진',
  '대한항공',
  'GS칼텍스',
  'S-Oil',
  '한국타이어',
  'LX하우시스',
  'DB손해보험',
  '메리츠화재',
  '현대해상',
  '삼성물산',
  'SK스퀘어',
  'LG유플러스',
  'KT&G',
  '농협은행',
  '우리금융지주',
  '하나금융지주',
  '미래에셋증권',
  'NH투자증권',
  '교보증권',
  '대웅제약',
  '셀트리온',
  '유한양행',
  '한미반도체',
  '동원그룹',
  '빙그레',
  '매일유업',
  '오뚜기',
  '풀무원',
  'SPC그룹',
  '나이키코리아',
  '아디다스코리아',
  '유니클로',
  '이랜드',
  '무신사',
  '컬리',
  '올리브영',
  '다이소',
  '이마트24',
  'BGF리테일',
  'SK이터닉스',
  '한국전력',
  '한국가스공사',
  '한국수력원자력',
  '코레일',
  '한국도로공사',
  'LH',
  'SH공사',
  '인천국제공항공사',
  '한국토지주택공사',
  '한국농어촌공사',
  '한국수자원공사',
  '한국석유공사',
  '한국남부발전',
  '한국중부발전',
  '한국서부발전',
  '한국동서발전',
  '한국남동발전',
]

const KIND_CYCLE: SponsorOrganizationKind[] = ['corporate', 'foundation']

const SPONSOR_ENGLISH_NAME_MAP: Record<string, string> = {
  제이에이코리아: 'JA KOREA',
  스타벅스: 'STARBUCKS',
  삼성꿈장학재단: 'SAMSUNG DREAM SCHOLARSHIP FOUNDATION',
  한국청소년활동진흥원: 'KOREA YOUTH ACTIVITY PROMOTION AGENCY',
  '현대 자동차': 'HYUNDAI MOTOR',
  SK하이닉스: 'SK HYNIX',
  LG화학: 'LG CHEM',
  네이버: 'NAVER',
  카카오: 'KAKAO',
  포스코홀딩스: 'POSCO HOLDINGS',
  신한금융그룹: 'SHINHAN FINANCIAL GROUP',
  KB국민은행: 'KB KOOKMIN BANK',
  한화생명: 'HANWHA LIFE',
  '아름다운 재단': 'BEAUTIFUL FOUNDATION',
  '한국씨티은행': 'CITI BANK',
}

function resolveSponsorNameEn(name: string, index: number): string {
  const known = SPONSOR_ENGLISH_NAME_MAP[name]
  if (known) return known

  const normalized = name
    .replace(/\(.+\)/g, '')
    .replace(/[^A-Za-z0-9\s&-]/g, '')
    .trim()
    .replace(/\s+/g, ' ')
    .toUpperCase()
  if (normalized.length > 0) return normalized

  return `SPONSOR ${String(index + 1).padStart(3, '0')}`
}

function createRow(
  index: number,
  o: {
    name: string
    organizationKind: SponsorOrganizationKind
    sponsorshipStatus: SponsorSponsorshipStatus
    sponsorshipStartDate?: string
  }
): SponsorManagementRow {
  const id = `sponsor-list-${String(index + 1).padStart(3, '0')}`
  return {
    id,
    name: o.name,
    nameEn: resolveSponsorNameEn(o.name, index),
    createdAt: TS,
    updatedAt: TS,
    managers: [MAIN_MANAGER],
    organizationKind: o.organizationKind,
    sponsorshipStatus: o.sponsorshipStatus,
    sponsorshipStartDate: o.sponsorshipStartDate ?? START_SCREENSHOT,
    programCount: 13,
    totalDonationAmount: 91_500_000,
    totalBeneficiaryCount: 915,
  }
}

function buildMockSponsorManagementList(): SponsorManagementRow[] {
  const rows: SponsorManagementRow[] = SCREENSHOT_LEADING.map((def, i) =>
    createRow(i, {
      ...def,
      sponsorshipStartDate: START_SCREENSHOT,
    })
  )

  for (let i = 13; i < 130; i++) {
    const n = i - 13
    const base = FILLER_BASE[n % FILLER_BASE.length]
    const group = Math.floor(n / FILLER_BASE.length)
    const name = group === 0 ? base : `${base} (${group + 1})`
    const organizationKind = KIND_CYCLE[i % KIND_CYCLE.length]
    const sponsorshipStatus: SponsorSponsorshipStatus =
      i % 7 === 0 || i % 11 === 0 ? 'ended' : 'active'
    const day = 1 + (i % 28)
    const sponsorshipStartDate = `2026-03-${String(day).padStart(2, '0')}T00:00:00.000Z`
    rows.push(
      createRow(i, {
        name,
        organizationKind,
        sponsorshipStatus,
        sponsorshipStartDate,
      })
    )
  }

  rows.push(
    createRow(130, {
      name: '한국씨티은행',
      organizationKind: 'corporate',
      sponsorshipStatus: 'active',
      sponsorshipStartDate: START_SCREENSHOT,
    })
  )

  return rows
}

export const mockSponsorManagementListRows: SponsorManagementRow[] = buildMockSponsorManagementList()
