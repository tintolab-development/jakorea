/**
 * 프로그램 Mock 데이터
 * Phase 2.1: 다양한 상태/유형/스폰서를 포함한 샘플 데이터
 */

import type { Program, ProgramRound } from '../../types/domain'
import { mockSponsors } from './sponsors'

// 날짜 생성 헬퍼
const getDate = (daysAgo: number): string => {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString()
}

const getFutureDate = (daysFromNow: number): string => {
  const date = new Date()
  date.setDate(date.getDate() + daysFromNow)
  return date.toISOString()
}

// 회차 데이터 생성 헬퍼
const createRounds = (programId: string, roundCount: number, startDateOffset: number): ProgramRound[] => {
  const rounds: ProgramRound[] = []
  for (let i = 1; i <= roundCount; i++) {
    const roundStartOffset = startDateOffset + (i - 1) * 7 // 각 회차는 1주일 간격
    rounds.push({
      id: `${programId}-round-${i}`,
      programId,
      roundNumber: i,
      startDate: getFutureDate(roundStartOffset),
      endDate: getFutureDate(roundStartOffset + 3), // 3일 진행
      capacity: Math.floor(Math.random() * 30) + 20, // 20-50명
      status: i === 1 ? 'active' : (i <= 3 ? 'pending' : 'inactive'),
    })
  }
  return rounds
}

// 프로그램 Mock 데이터
// 주의: mockSponsors가 반드시 먼저 초기화되어야 함
export const mockPrograms: Program[] = [
  {
    id: 'prog-001',
    sponsorId: mockSponsors[0]!.id,
    title: '청소년 리더십 워크샵',
    type: 'offline',
    format: 'workshop',
    description: '중고등학생 대상 리더십 역량 강화 프로그램',
    rounds: createRounds('prog-001', 5, 10),
    startDate: getFutureDate(10),
    endDate: getFutureDate(45),
    status: 'active',
    createdAt: getDate(30),
    updatedAt: getDate(5),
  },
  {
    id: 'prog-002',
    sponsorId: mockSponsors[1]!.id,
    title: '온라인 과학 탐구 세미나',
    type: 'online',
    format: 'seminar',
    description: '과학 분야 전문가와 함께하는 탐구 세미나',
    rounds: createRounds('prog-002', 3, 20),
    startDate: getFutureDate(20),
    endDate: getFutureDate(41),
    status: 'active',
    createdAt: getDate(25),
    updatedAt: getDate(3),
  },
  {
    id: 'prog-003',
    sponsorId: mockSponsors[0]!.id,
    title: '혼합형 진로 탐색 코스',
    type: 'hybrid',
    format: 'course',
    description: '온라인 이론 + 오프라인 실습을 결합한 진로 탐색 프로그램',
    rounds: createRounds('prog-003', 4, 5),
    startDate: getFutureDate(5),
    endDate: getFutureDate(33),
    status: 'active',
    settlementRuleId: 'rule-001',
    createdAt: getDate(20),
    updatedAt: getDate(1),
  },
  {
    id: 'prog-004',
    sponsorId: mockSponsors[2]!.id,
    title: '창의적 글쓰기 강의',
    type: 'offline',
    format: 'lecture',
    description: '창의적 글쓰기 기법을 배우는 강의 프로그램',
    rounds: createRounds('prog-004', 6, 15),
    startDate: getFutureDate(15),
    endDate: getFutureDate(57),
    status: 'active',
    createdAt: getDate(15),
    updatedAt: getDate(2),
  },
  {
    id: 'prog-005',
    sponsorId: mockSponsors[1]!.id,
    title: '디지털 리터러시 워크샵',
    type: 'hybrid',
    format: 'workshop',
    description: '디지털 시대 필요한 리터러시 역량 강화',
    rounds: createRounds('prog-005', 2, 30),
    startDate: getFutureDate(30),
    endDate: getFutureDate(44),
    status: 'pending',
    createdAt: getDate(10),
    updatedAt: getDate(8),
  },
  {
    id: 'prog-006',
    sponsorId: mockSponsors[3]!.id,
    title: '환경 보호 실천 세미나',
    type: 'online',
    format: 'seminar',
    description: '환경 문제와 실천 방법을 다루는 세미나',
    rounds: createRounds('prog-006', 4, 25),
    startDate: getFutureDate(25),
    endDate: getFutureDate(53),
    status: 'active',
    createdAt: getDate(18),
    updatedAt: getDate(4),
  },
  {
    id: 'prog-007',
    sponsorId: mockSponsors[0]!.id,
    title: '수학 올림피아드 준비 코스',
    type: 'offline',
    format: 'course',
    description: '수학 올림피아드 대회 준비를 위한 집중 코스',
    rounds: createRounds('prog-007', 8, 40),
    startDate: getFutureDate(40),
    endDate: getFutureDate(96),
    status: 'pending',
    createdAt: getDate(5),
    updatedAt: getDate(2),
  },
  {
    id: 'prog-008',
    sponsorId: mockSponsors[4]!.id,
    title: '언어/문학 특강',
    type: 'online',
    format: 'lecture',
    description: '언어와 문학 분야 전문가 특강',
    rounds: createRounds('prog-008', 3, 12),
    startDate: getFutureDate(12),
    endDate: getFutureDate(33),
    status: 'active',
    settlementRuleId: 'rule-002',
    createdAt: getDate(22),
    updatedAt: getDate(1),
  },
  {
    id: 'prog-009',
    sponsorId: mockSponsors[1]!.id,
    title: '비즈니스 마인드 세트 워크샵',
    type: 'hybrid',
    format: 'workshop',
    description: '청소년을 위한 비즈니스 마인드셋 형성 프로그램',
    rounds: createRounds('prog-009', 5, 35),
    startDate: getFutureDate(35),
    endDate: getFutureDate(70),
    status: 'pending',
    createdAt: getDate(8),
    updatedAt: getDate(6),
  },
  {
    id: 'prog-010',
    sponsorId: mockSponsors[2]!.id,
    title: '예술 창작 실습 세미나',
    type: 'offline',
    format: 'seminar',
    description: '다양한 예술 매체를 활용한 창작 실습',
    rounds: createRounds('prog-010', 4, 18),
    startDate: getFutureDate(18),
    endDate: getFutureDate(46),
    status: 'active',
    createdAt: getDate(12),
    updatedAt: getDate(3),
  },
  {
    id: 'prog-011',
    sponsorId: mockSponsors[3]!.id,
    title: '코딩 기초 강의',
    type: 'online',
    format: 'lecture',
    description: '프로그래밍 기초를 배우는 온라인 강의',
    rounds: createRounds('prog-011', 6, 22),
    startDate: getFutureDate(22),
    endDate: getFutureDate(64),
    status: 'active',
    createdAt: getDate(14),
    updatedAt: getDate(2),
  },
  {
    id: 'prog-012',
    sponsorId: mockSponsors[0]!.id,
    title: '사회 문제 탐구 코스',
    type: 'hybrid',
    format: 'course',
    description: '현대 사회 문제를 탐구하고 해결 방안 모색',
    rounds: createRounds('prog-012', 7, 28),
    startDate: getFutureDate(28),
    endDate: getFutureDate(77),
    status: 'pending',
    createdAt: getDate(7),
    updatedAt: getDate(5),
  },
]

// ID로 빠른 조회를 위한 Map
export const mockProgramsMap: Record<string, Program> = {}
mockPrograms.forEach((program) => {
  mockProgramsMap[program.id] = program
})

