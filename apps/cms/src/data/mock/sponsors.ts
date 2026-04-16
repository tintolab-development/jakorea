/**
 * 스폰서 Mock 데이터
 * Phase 1.3: 30개 이상의 다양한 샘플 데이터
 */

import type { Sponsor, SponsorOrganizationKind } from '../../types/domain'

function generateUUID(): string {
  return `sponsor-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`
}

function randomPastDate(daysAgo: number = 730): Date {
  const now = Date.now()
  const randomTime = now - Math.random() * daysAgo * 24 * 60 * 60 * 1000
  return new Date(randomTime)
}

const sponsorNames = [
  '삼성전자',
  'LG전자',
  'SK텔레콤',
  'KT',
  '네이버',
  '카카오',
  '토스',
  '라인',
  '쿠팡',
  '배달의민족',
  '당근마켓',
  '우아한형제들',
  '마이크로소프트',
  '구글',
  '아마존웹서비스',
  '오라클',
  'IBM',
  '애플',
  '메타',
  'IBM 코리아',
  '삼성SDS',
  'LG CNS',
  'SK C&C',
  '한국정보통신',
  'NHN',
  '넥슨',
  '넷마블',
  'NC소프트',
  'LG유플러스',
  'KT스카이라이프',
  '한화시스템',
  '두산',
  '현대자동차',
  '기아',
  '포스코',
  '롯데',
  '신세계',
  '이마트',
  'GS리테일',
  'CJ그룹',
]

const descriptionTemplates = [
  '글로벌 IT 기업으로 디지털 혁신을 선도합니다.',
  '한국 대표 기업으로 기술 개발과 사회공헌에 힘쓰고 있습니다.',
  '차세대 기술을 통해 더 나은 세상을 만들어갑니다.',
  '교육과 인재 양성에 관심이 많은 기업입니다.',
  '사회적 가치 실현을 위한 다양한 프로그램을 운영합니다.',
  '스타트업과 협업하여 혁신 생태계를 조성합니다.',
  '청년 취업 및 창업 지원에 적극적입니다.',
  '교육 분야의 디지털 전환을 지원합니다.',
]

function generateContactInfo(name: string): string {
  const domains = ['company.com', 'corp.co.kr', 'group.com', 'inc.kr']
  const domain = domains[Math.floor(Math.random() * domains.length)]
  const email = `contact@${name.toLowerCase().replace(/\s+/g, '')}.${domain}`
  const phone = `02-${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`
  return `${email} / ${phone}`
}

const securityMemos = [
  undefined,
  undefined,
  undefined,
  '개인정보 처리 방침 준수 필요',
  '민감정보 접근 권한 제한',
  '계약 시 기밀 유지 서약 필요',
  '정기 보안 점검 대상',
]

export const mockSponsors: Sponsor[] = sponsorNames.slice(0, 30).map(name => {
  const createdAt = randomPastDate(730)
  const updatedAt = new Date(
    createdAt.getTime() + Math.random() * (Date.now() - createdAt.getTime())
  )

  return {
    id: generateUUID(),
    name,
    description: descriptionTemplates[Math.floor(Math.random() * descriptionTemplates.length)],
    contactInfo: generateContactInfo(name),
    securityMemo: securityMemos[Math.floor(Math.random() * securityMemos.length)],
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  }
})

// JA코리아(JA Korea 고유목적사업) 담당자 목데이터 — 후원사 담당자 셀렉트 연동용 (programs.ts updateSponsors에서 mockSponsors[0]이 JA Korea 고유목적사업으로 설정됨)
// educationRecords[0].managerName('OO팀 이순신 책임') 등과 연동
export const JA_KOREA_MANAGERS = [
  { name: 'OO팀 이순신 책임', phone: '010-1234-5678' },
  { name: '이소율', phone: '02-6347-6113' },
  { name: '김경제', phone: '02-6085-6028' },
  { name: '박교육', phone: '010-2345-6789' },
  { name: '정미래', phone: '010-3456-7890' },
] as const

// 기타 후원사용 기본 담당자 목록 (셀렉트 옵션용)
const defaultManagers = [
  { name: '○○팀 이순신 책임', phone: '010-1234-5678' },
  { name: '홍길동', phone: '010-9876-5432' },
  { name: '김담당', phone: '010-1111-2222' },
  { name: '이소율', phone: '02-6347-6113' },
]

const ORG_KIND_CYCLE: SponsorOrganizationKind[] = ['corporate', 'foundation']

// mockSponsors[0] = JA Korea 고유목적사업으로 연동되므로 JA코리아 담당자 목록 부여, 나머지는 기본 목록
mockSponsors.forEach((s, i) => {
  s.managers = i === 0 ? [...JA_KOREA_MANAGERS] : [...defaultManagers]
  s.organizationKind = ORG_KIND_CYCLE[i % ORG_KIND_CYCLE.length]
  s.sponsorshipStatus = i % 7 === 0 ? 'ended' : 'active'
  const start = randomPastDate(600)
  s.sponsorshipStartDate = start.toISOString()
})

export const mockSponsorsMap = new Map(mockSponsors.map(sponsor => [sponsor.id, sponsor]))




