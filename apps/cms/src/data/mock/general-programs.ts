/**
 * 일반 프로그램 Mock 데이터
 * `/programs/general` 목록 — 진행현황(예정/진행 중/완료)별 2건
 */

import type {
  Program,
  ProgramCategory,
  ProgramLifecycleStatus,
  ProgramRound,
  TargetLevel,
} from '../../types/domain'
import { mockSponsors } from './sponsors'

const SPONSOR_ID = mockSponsors[0]?.id ?? 'sponsor-1'

const now = new Date()
const getDate = (daysAgo: number) => {
  const d = new Date(now)
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString()
}

function pad2(n: number): string {
  return String(n).padStart(2, '0')
}

/** 주간 시간 격자·겹침 열 분할 확인용 (경제 mock과 동일 패턴) */
function buildProgramStartEndTime(seed: number): { startTime: string; endTime: string } {
  const templates = [
    { startH: 9, startM: 0, durationM: 150 },
    { startH: 10, startM: 30, durationM: 90 },
    { startH: 13, startM: 0, durationM: 120 },
    { startH: 14, startM: 0, durationM: 30 },
    { startH: 15, startM: 30, durationM: 120 },
    { startH: 16, startM: 0, durationM: 120 },
  ] as const
  const t = templates[seed % templates.length]
  const startTotal = t.startH * 60 + t.startM
  const endTotal = Math.min(startTotal + t.durationM, 24 * 60)
  const endH = Math.floor(endTotal / 60)
  const endM = endTotal % 60
  return {
    startTime: `${pad2(t.startH)}:${pad2(t.startM)}`,
    endTime: `${pad2(endH)}:${pad2(endM)}`,
  }
}

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
      deliveryType: 'offline',
      curriculum: '일반 프로그램 커리큘럼',
    },
  ]
}

type GeneralProgramSeed = Omit<Program, 'id' | 'rounds' | 'createdAt' | 'updatedAt'> & {
  id: string
  capacity: number
  /** false면 startTime/endTime 없음 → 주간 격자 종일(00:00–24:00) + 라벨 「종일」 */
  scheduleTimeEnabled?: boolean
}

const GENERAL_PROGRAM_SEEDS: GeneralProgramSeed[] = [
  {
    id: 'general-prog-scheduled-1',
    capacity: 30,
    sponsorId: SPONSOR_ID,
    title: 'HSBC/HKU Business Case Competition 2026 모집 안내',
    mainTitle: 'HSBC/HKU Business Case Competition 2026',
    type: 'offline',
    format: 'workshop',
    category: 'school' as ProgramCategory,
    description: '프로그램 진행 예정(모집 전) 샘플 1',
    startDate: getDate(60),
    endDate: getDate(30),
    applicationStartDate: getDate(90),
    applicationEndDate: getDate(45),
    status: 'pending',
    lifecycleStatus: 'recruiting_students' as ProgramLifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'elementary' as TargetLevel,
    approvedStudentCount: 0,
    scheduleTimeEnabled: true,
  },
  {
    id: 'general-prog-scheduled-2',
    capacity: 40,
    sponsorId: SPONSOR_ID,
    title: '2026 JA Korea 대학생경제교육봉사단 UJAT 36기 모집',
    mainTitle: '대학생경제교육봉사단 UJAT 36기',
    type: 'offline',
    format: 'workshop',
    category: 'individual' as ProgramCategory,
    description: '프로그램 진행 예정(모집 중) 샘플 2',
    startDate: getDate(58),
    endDate: getDate(26),
    applicationStartDate: getDate(92),
    applicationEndDate: getDate(42),
    status: 'pending',
    lifecycleStatus: 'recruiting_instructors' as ProgramLifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'college' as TargetLevel,
    approvedStudentCount: 0,
    scheduleTimeEnabled: false,
  },
  {
    id: 'general-prog-in-progress-1',
    capacity: 30,
    sponsorId: SPONSOR_ID,
    title: 'EY한영-JA Korea Growth to Professional 2026 대학생 참가자 모집',
    mainTitle: 'Growth to Professional 2026',
    type: 'offline',
    format: 'workshop',
    category: 'individual' as ProgramCategory,
    description: '프로그램 진행 중 샘플 1',
    startDate: getDate(45),
    endDate: getDate(15),
    applicationStartDate: getDate(90),
    applicationEndDate: getDate(30),
    status: 'active',
    lifecycleStatus: 'education_after_textbook' as ProgramLifecycleStatus,
    businessArea: '경제금융',
    targetLevel: 'high' as TargetLevel,
    approvedStudentCount: 30,
    scheduleTimeEnabled: false,
  },
  {
    id: 'general-prog-in-progress-2',
    capacity: 35,
    sponsorId: SPONSOR_ID,
    title: '2026년 한국씨티은행-JA Korea 특별한 JOB탐 참가자 모집',
    mainTitle: '특별한 JOB탐',
    type: 'offline',
    format: 'seminar',
    category: 'school' as ProgramCategory,
    description: '프로그램 진행 중 샘플 2',
    startDate: getDate(43),
    endDate: getDate(12),
    applicationStartDate: getDate(86),
    applicationEndDate: getDate(28),
    status: 'active',
    lifecycleStatus: 'education_after_textbook' as ProgramLifecycleStatus,
    businessArea: '진로취업',
    targetLevel: 'high' as TargetLevel,
    approvedStudentCount: 24,
    scheduleTimeEnabled: true,
  },
  {
    id: 'general-prog-completed-1',
    capacity: 30,
    sponsorId: SPONSOR_ID,
    title: '2026 SAP-함께 성장JA! 참여 고등학생 모집 안내 (IT, SW 멘토링)',
    mainTitle: 'SAP-함께 성장JA!',
    type: 'offline',
    format: 'seminar',
    category: 'school' as ProgramCategory,
    description: '프로그램 진행 완료 샘플 1',
    startDate: getDate(120),
    endDate: getDate(90),
    applicationStartDate: getDate(150),
    applicationEndDate: getDate(100),
    status: 'completed',
    lifecycleStatus: 'education_completed' as ProgramLifecycleStatus,
    businessArea: '진로취업',
    targetLevel: 'college' as TargetLevel,
    approvedStudentCount: 28,
    scheduleTimeEnabled: true,
  },
  {
    id: 'general-prog-completed-2',
    capacity: 28,
    sponsorId: SPONSOR_ID,
    title: '2026 SAP-JA Korea Global Career Discovery 원데이 취업 멘토링 대학생 참가자 모집',
    mainTitle: 'Global Career Discovery',
    type: 'offline',
    format: 'seminar',
    category: 'individual' as ProgramCategory,
    description: '프로그램 진행 완료 샘플 2',
    startDate: getDate(118),
    endDate: getDate(88),
    applicationStartDate: getDate(152),
    applicationEndDate: getDate(98),
    status: 'completed',
    lifecycleStatus: 'document_processing_completed' as ProgramLifecycleStatus,
    businessArea: '진로취업',
    targetLevel: 'college' as TargetLevel,
    approvedStudentCount: 22,
    scheduleTimeEnabled: false,
  },
]

let generalProgramsCache: Program[] | null = null

export function getGeneralPrograms(): Program[] {
  if (generalProgramsCache) return generalProgramsCache

  generalProgramsCache = GENERAL_PROGRAM_SEEDS.map((seed, index) => {
    const { id, capacity, scheduleTimeEnabled, ...rest } = seed
    const createdAt = getDate(30)
    const timeFields =
      scheduleTimeEnabled === false ? {} : buildProgramStartEndTime(index)
    return {
      ...rest,
      id,
      rounds: createRounds(id, capacity),
      ...timeFields,
      createdAt,
      updatedAt: createdAt,
    } as Program
  })

  return generalProgramsCache
}

export function getGeneralProgramById(id: string): Program | undefined {
  return getGeneralPrograms().find(p => p.id === id)
}
