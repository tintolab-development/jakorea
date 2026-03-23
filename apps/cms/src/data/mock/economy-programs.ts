/**
 * 경제 교육 프로그램 Mock 데이터
 * 스크린샷 기준: /programs/economy-education 테이블 데이터
 * 전체 206건, 상위 8건은 스크린샷과 동일
 */

import type {
  Program,
  ProgramRound,
  ProgramCategory,
  ProgramLifecycleStatus,
  TargetLevel,
} from '../../types/domain'
import { mockSponsors } from './sponsors'

const SPONSOR_ID = mockSponsors[0].id

const createRounds = (programId: string, capacity: number): ProgramRound[] => {
  const startDate = new Date(2026, 2, 1)
  return [
    {
      id: `${programId}-round-1`,
      programId,
      roundNumber: 1,
      startDate: startDate.toISOString(),
      endDate: new Date(2026, 2, 15).toISOString(),
      capacity,
      status: 'active',
    },
  ]
}

const now = new Date()
const getDate = (daysAgo: number) => {
  const d = new Date(now)
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

/** 스크린샷 상위 8건 (No. 1~8) */
const SCREENSHOT_PROGRAMS: Omit<Program, 'id' | 'rounds' | 'createdAt' | 'updatedAt'>[] = [
  {
    sponsorId: SPONSOR_ID,
    title: 'HSBC/HKU Business Case Competition 2026 모집 안내',
    type: 'offline',
    format: 'workshop',
    category: 'school' as ProgramCategory,
    description: 'HSBC/HKU Business Case Competition 2026',
    startDate: getDate(60),
    endDate: getDate(30),
    applicationStartDate: getDate(90),
    applicationEndDate: getDate(45),
    status: 'pending',
    lifecycleStatus: 'recruiting_students' as ProgramLifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'elementary' as TargetLevel,
    approvedStudentCount: 0,
  },
  {
    sponsorId: SPONSOR_ID,
    title: '2026 JA Korea 대학생경제교육봉사단 UJAT 36기 모집',
    type: 'offline',
    format: 'workshop',
    category: 'individual' as ProgramCategory,
    description: '대학생경제교육봉사단 UJAT 36기',
    startDate: getDate(45),
    endDate: getDate(15),
    applicationStartDate: getDate(90),
    applicationEndDate: getDate(30),
    status: 'active',
    lifecycleStatus: 'education_after_textbook' as ProgramLifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'high' as TargetLevel,
    approvedStudentCount: 30,
    instructors: 30,
  },
  {
    sponsorId: SPONSOR_ID,
    title: 'EY한영-JA Korea Growth to Professional 2026 대학생 참가자 모집',
    type: 'offline',
    format: 'workshop',
    category: 'individual' as ProgramCategory,
    description: 'Growth to Professional 2026',
    startDate: getDate(75),
    endDate: getDate(45),
    applicationStartDate: getDate(120),
    applicationEndDate: getDate(60),
    status: 'pending',
    lifecycleStatus: 'recruiting_students' as ProgramLifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'high' as TargetLevel,
    approvedStudentCount: 30,
  },
  {
    sponsorId: SPONSOR_ID,
    title: '2026년 JA Korea 초등 경제교육 모집 안내',
    type: 'offline',
    format: 'workshop',
    category: 'school' as ProgramCategory,
    description: '초등 경제교육 모집',
    startDate: getDate(90),
    endDate: getDate(60),
    applicationStartDate: getDate(150),
    applicationEndDate: getDate(75),
    status: 'pending',
    lifecycleStatus: 'recruiting_students' as ProgramLifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'elementary' as TargetLevel,
    approvedStudentCount: 10,
  },
  {
    sponsorId: SPONSOR_ID,
    title: '2026 SAP-함께 성장하JA! 참여 고등학생 모집 안내 (IT, SW 멘토링)',
    type: 'offline',
    format: 'workshop',
    category: 'individual' as ProgramCategory,
    description: 'SAP 함께 성장하JA IT SW 멘토링',
    startDate: getDate(100),
    endDate: getDate(70),
    applicationStartDate: getDate(130),
    applicationEndDate: getDate(85),
    status: 'pending',
    lifecycleStatus: 'recruiting_students' as ProgramLifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'high' as TargetLevel,
    approvedStudentCount: 30,
  },
  {
    sponsorId: SPONSOR_ID,
    title: '2026 SAP-JA Korea Global Career Discovery 원데이 취업 멘토링 대학생 참여자 모집',
    type: 'offline',
    format: 'workshop',
    category: 'individual' as ProgramCategory,
    description: 'Global Career Discovery 원데이 취업 멘토링',
    startDate: getDate(50),
    endDate: getDate(20),
    applicationStartDate: getDate(100),
    applicationEndDate: getDate(35),
    status: 'active',
    lifecycleStatus: 'education_after_textbook' as ProgramLifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'high' as TargetLevel,
    approvedStudentCount: 30,
    instructors: 30,
  },
  {
    sponsorId: SPONSOR_ID,
    title: '2026년 JA Korea 경제금융교육 전문강사단 모집',
    type: 'offline',
    format: 'workshop',
    category: 'individual' as ProgramCategory,
    description: '경제금융교육 전문강사단 모집',
    startDate: getDate(55),
    endDate: getDate(25),
    applicationStartDate: getDate(95),
    applicationEndDate: getDate(40),
    status: 'active',
    lifecycleStatus: 'education_after_textbook' as ProgramLifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'high' as TargetLevel,
    approvedStudentCount: 30,
    instructors: 30,
  },
  {
    sponsorId: SPONSOR_ID,
    title: '2026년 한국씨티은행-JA Korea 특별한 JOB담 참가자 모집',
    type: 'offline',
    format: 'workshop',
    category: 'school' as ProgramCategory,
    description: '한국씨티은행 특별한 JOB담',
    startDate: getDate(120),
    endDate: getDate(90),
    applicationStartDate: getDate(180),
    applicationEndDate: getDate(100),
    status: 'completed',
    lifecycleStatus: 'education_completed' as ProgramLifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'high' as TargetLevel,
    approvedStudentCount: 20,
  },
]

const TITLES = [
  'JA Korea 경제교육 프로그램',
  '기업가정신 함양 프로그램',
  '진로탐색 경제교육',
  '금융리터러시 교육',
  '창업 멘토링 프로그램',
  '취업 준비 워크숍',
  '경제교육 봉사단 모집',
  '초등 경제교육 지원',
  '중등 경제교육 지원',
  '고등 경제교육 지원',
]

/** 경제 교육 프로그램 206건 (스크린샷 상위 8건 + 나머지 198건) */
let economyProgramsCache: Program[] | null = null

export function getEconomyPrograms(): Program[] {
  if (economyProgramsCache) return economyProgramsCache

  const programs: Program[] = []

  // 스크린샷 상위 8건
  SCREENSHOT_PROGRAMS.forEach((base, i) => {
    const id = `economy-prog-${String(i + 1).padStart(3, '0')}`
    const capacity = 30
    programs.push({
      ...base,
      id,
      rounds: createRounds(id, capacity),
      createdAt: getDate(90 - i),
      updatedAt: getDate(90 - i),
    } as Program)
  })

  // 나머지 198건 (총 206건) - 위젯 건수: 예정 120, 진행 중 12, 완료 11 (120+12+11=143, 나머지 63은 planned 등)
  const scheduledStatuses: ProgramLifecycleStatus[] = [
    'recruiting_students',
    'recruiting_instructors',
    'matching_completed',
    'education_before_textbook',
  ]
  const inProgressStatus: ProgramLifecycleStatus = 'education_after_textbook'
  const completedStatus: ProgramLifecycleStatus = 'education_completed'
  // 8건 스크린샷: 4 예정, 3 진행중, 1 완료
  // 나머지 198: 116 예정, 9 진행중, 10 완료, 63 planned(미집계)
  const statusSequence: ProgramLifecycleStatus[] = [
    ...Array(116).fill(scheduledStatuses[0]),
    ...Array(9).fill(inProgressStatus),
    ...Array(10).fill(completedStatus),
    ...Array(63).fill('planned' as ProgramLifecycleStatus),
  ]

  for (let i = 8; i < 206; i++) {
    const id = `economy-prog-${String(i + 1).padStart(3, '0')}`
    const capacity = 30
    const lifecycleStatus = statusSequence[i - 8] ?? scheduledStatuses[0]
    const category: ProgramCategory = i % 3 === 0 ? 'school' : 'individual'
    const targetLevels: TargetLevel[] = ['elementary', 'middle', 'high']
    const targetLevel = targetLevels[i % 3]
    const approvedCount = i % 5 === 0 ? 0 : Math.min(30, Math.floor((i * 7) % 31))

    programs.push({
      id,
      sponsorId: SPONSOR_ID,
      title: `${TITLES[i % TITLES.length]} ${2026 - (i % 3)}`,
      type: 'offline',
      format: 'workshop',
      category,
      description: '경제금융 분야 교육 프로그램',
      rounds: createRounds(id, capacity),
      startDate: getDate(120 - i),
      endDate: getDate(90 - i),
      applicationStartDate: getDate(150 - i),
      applicationEndDate: getDate(100 - i),
      status:
        lifecycleStatus === 'document_processing_completed'
          ? 'completed'
          : ['education_after_textbook', 'education_completed'].includes(lifecycleStatus)
            ? 'active'
            : 'pending',
      lifecycleStatus,
      businessArea: '경제금융',
      targetLevel,
      approvedStudentCount: approvedCount,
      createdAt: getDate(200 - i),
      updatedAt: getDate(200 - i),
    })
  }

  economyProgramsCache = programs
  return programs
}
