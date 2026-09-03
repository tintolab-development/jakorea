import type {
  SponsorManagementDetailView,
  SponsorManagementRow,
  SponsorContactRow,
  SponsorProgramHistoryRow,
  SponsorYearlyBusinessRow,
} from '@/features/sponsor/model/sponsor-management.types'

/** LNB 상세 시드·정합 테스트 SSOT */
export const SPONSOR_DETAIL_SEED_CONTACTS: readonly SponsorContactRow[] = [
  {
    id: 'sponsor-contact-1',
    name: '김제이',
    department: '사회공헌팀',
    position: '책임',
    officePhone: '',
    phone: '010-2431-0000',
    email: 'gwanl123@naver.com',
    companyAddress: '',
    memo: '',
    registeredAt: '2026-02-10T09:15:00+09:00',
    contactType: 'lead',
  },
  {
    id: 'sponsor-contact-2',
    name: '박제이',
    department: '사회공헌팀',
    position: '선임',
    officePhone: '',
    phone: '010-7353-0000',
    email: 'gwanl433@naver.com',
    companyAddress: '',
    memo: '',
    registeredAt: '2026-02-10T09:15:00+09:00',
    contactType: 'assistant',
  },
  {
    id: 'sponsor-contact-3',
    name: '강제이',
    department: '사회공헌팀',
    position: '사원',
    officePhone: '',
    phone: '010-3145-0000',
    email: 'gwanl213@naver.com',
    companyAddress: '',
    memo: '',
    registeredAt: '2026-02-10T09:15:00+09:00',
    contactType: 'assistant',
  },
]

/** 시안 연도별 후원금 테이블 (누적 후원금 109,150,000원). 누적 수혜자 카드는 프로그램 참여자 합. */
export const SPONSOR_DETAIL_SEED_YEARLY_BUSINESSES: readonly SponsorYearlyBusinessRow[] = [
  {
    id: 'sponsor-yearly-2026',
    year: 2026,
    donationAmount: 91_500_000,
    beneficiaryCount: 915,
    memo: '',
    businessName: '2026년',
    managerNameSnapshot: '홍길동',
  },
  {
    id: 'sponsor-yearly-2025',
    year: 2025,
    donationAmount: 10_150_000,
    beneficiaryCount: 0,
    memo: '',
    businessName: '2025년',
    managerNameSnapshot: '홍길동',
  },
  {
    id: 'sponsor-yearly-2024',
    year: 2024,
    donationAmount: 7_500_000,
    beneficiaryCount: 0,
    memo: '',
    businessName: '2024년',
    managerNameSnapshot: '홍길동',
  },
]

export const SPONSOR_DETAIL_SEED_PROGRAM_HISTORIES: readonly SponsorProgramHistoryRow[] = [
  {
    id: 'sponsor-program-history-206',
    programId: 'economy-prog-001',
    title: 'HSBC/HKU Business Case Competition 2026 도전 안내',
    year: 2026,
    lifecycleStatus: 'planned',
    managerName: '홍길동',
    participantCount: '0 / 30',
    participantType: 'school',
    educationTarget: 'elementary',
  },
  {
    id: 'sponsor-program-history-205',
    programId: 'economy-prog-002',
    title: '2026 JA Korea 대학생경제캠프 ULT 36기 모집',
    year: 2026,
    lifecycleStatus: 'education_in_progress',
    managerName: '홍길동',
    participantCount: '30 / 30',
    participantType: 'individual',
    educationTarget: 'college',
  },
  {
    id: 'sponsor-program-history-204',
    programId: 'economy-prog-003',
    title: 'EY한영_JA Kova Growth to Professional 2026 대학생 자기 탐진',
    year: 2026,
    lifecycleStatus: 'planned',
    managerName: '홍길동',
    participantCount: '30 / 30',
    participantType: 'individual',
    educationTarget: 'college',
  },
  {
    id: 'sponsor-program-history-203',
    programId: 'economy-prog-004',
    title: '2026년 JA Korea 초등 경제교육 모집 안내',
    year: 2026,
    lifecycleStatus: 'planned',
    managerName: '홍길동',
    participantCount: '10 / 30',
    participantType: 'school',
    educationTarget: 'elementary',
  },
  {
    id: 'sponsor-program-history-202',
    programId: 'economy-prog-005',
    title: '2026 SAP-함께 성장하JA 참여 고등학생 모집 안내 (IT, SW 멘토링)',
    year: 2026,
    lifecycleStatus: 'education_in_progress',
    managerName: '홍길동',
    participantCount: '30 / 30',
    participantType: 'individual',
    educationTarget: 'high',
  },
  {
    id: 'sponsor-program-history-201',
    programId: 'economy-prog-006',
    title: '2026 SAP-JA Korea Global Career Discovery 원데이 취업 멘토링',
    year: 2026,
    lifecycleStatus: 'education_in_progress',
    managerName: '홍길동',
    participantCount: '3 / 30',
    participantType: 'volunteer',
    educationTarget: 'adult',
  },
  {
    id: 'sponsor-program-history-200',
    programId: 'economy-prog-007',
    title: '2026년 JA Korea 경제금융 교육 전문가단 모집',
    year: 2026,
    lifecycleStatus: 'education_completed',
    managerName: '홍길동',
    participantCount: '3 / 30',
    participantType: 'school',
    educationTarget: 'middle',
  },
  {
    id: 'sponsor-program-history-199',
    programId: 'economy-prog-008',
    title: '2026 한국지멘스-JA Korea 특별반 JOB 참가자 모집',
    year: 2026,
    lifecycleStatus: 'education_completed',
    managerName: '홍길동',
    participantCount: '2 / 30',
    participantType: 'school',
    educationTarget: 'high',
  },
]

function fallbackNameEn(row: SponsorManagementRow): string {
  if (row.nameEn?.trim()) return row.nameEn.trim()
  const seq = row.id.match(/(\d+)$/)?.[1]
  return seq ? `SPONSOR ${seq}` : 'SPONSOR'
}

export function buildSponsorManagementDetailView(
  row: SponsorManagementRow
): SponsorManagementDetailView {
  return {
    ...row,
    nameDisplayKo: row.name,
    nameDisplayEn: fallbackNameEn(row),
    businessNumber: '124-81-00998',
    executives: '전영현, 노태문',
    address: '경기도 수원시 영통구 삼성로 129(매탄동)',
    homepageUrl: 'https://www.samsung.com',
    logos: [
      { id: 'sponsor-logo-workmark', fileName: 'samsung_logo (workmark).ai' },
      { id: 'sponsor-logo', fileName: 'samsung_logo.ai' },
    ],
    contacts: [...SPONSOR_DETAIL_SEED_CONTACTS],
    programHistories: [...SPONSOR_DETAIL_SEED_PROGRAM_HISTORIES],
    yearlyBusinesses: [...SPONSOR_DETAIL_SEED_YEARLY_BUSINESSES],
  }
}
