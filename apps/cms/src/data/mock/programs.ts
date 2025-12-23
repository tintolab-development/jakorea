/**
 * 프로그램 Mock 데이터
 * Phase 2.1: 40개 이상의 다양한 상태/유형/스폰서를 포함한 샘플 데이터
 */

import type { Program, ProgramRound, ProgramCategory } from '../../types/domain'
import { mockSponsors } from './sponsors'

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

const createRounds = (programId: string, roundCount: number, startDateOffset: number): ProgramRound[] => {
  const rounds: ProgramRound[] = []
  for (let i = 1; i <= roundCount; i++) {
    const roundStartOffset = startDateOffset + (i - 1) * 7
    const statuses: ProgramRound['status'][] = ['active', 'pending', 'inactive', 'completed', 'cancelled']
    rounds.push({
      id: `${programId}-round-${i}`,
      programId,
      roundNumber: i,
      startDate: getFutureDate(roundStartOffset),
      endDate: getFutureDate(roundStartOffset + 3),
      capacity: Math.floor(Math.random() * 30) + 20,
      status: i === 1 ? 'active' : statuses[Math.floor(Math.random() * statuses.length)],
    })
  }
  return rounds
}

const programTemplates = [
  { title: '청소년 리더십 워크샵', type: 'offline' as const, format: 'workshop' as const, desc: '중고등학생 대상 리더십 역량 강화 프로그램' },
  { title: '온라인 과학 탐구 세미나', type: 'online' as const, format: 'seminar' as const, desc: '과학 분야 전문가와 함께하는 탐구 세미나' },
  { title: '혼합형 진로 탐색 코스', type: 'hybrid' as const, format: 'course' as const, desc: '온라인 이론 + 오프라인 실습을 결합한 진로 탐색 프로그램' },
  { title: '창의적 글쓰기 강의', type: 'offline' as const, format: 'lecture' as const, desc: '창의적 글쓰기 기법을 배우는 강의 프로그램' },
  { title: '디지털 리터러시 워크샵', type: 'hybrid' as const, format: 'workshop' as const, desc: '디지털 시대 필요한 리터러시 역량 강화' },
  { title: '환경 보호 실천 세미나', type: 'online' as const, format: 'seminar' as const, desc: '환경 문제와 실천 방법을 다루는 세미나' },
  { title: '수학 올림피아드 준비 코스', type: 'offline' as const, format: 'course' as const, desc: '수학 올림피아드 대회 준비를 위한 집중 코스' },
  { title: '언어/문학 특강', type: 'online' as const, format: 'lecture' as const, desc: '언어와 문학 분야 전문가 특강' },
  { title: '비즈니스 마인드 세트 워크샵', type: 'hybrid' as const, format: 'workshop' as const, desc: '청소년을 위한 비즈니스 마인드셋 형성 프로그램' },
  { title: '예술 창작 실습 세미나', type: 'offline' as const, format: 'seminar' as const, desc: '다양한 예술 매체를 활용한 창작 실습' },
  { title: '코딩 기초 강의', type: 'online' as const, format: 'lecture' as const, desc: '프로그래밍 기초를 배우는 온라인 강의' },
  { title: '사회 문제 탐구 코스', type: 'hybrid' as const, format: 'course' as const, desc: '현대 사회 문제를 탐구하고 해결 방안 모색' },
  { title: 'AI/머신러닝 입문 워크샵', type: 'hybrid' as const, format: 'workshop' as const, desc: 'AI와 머신러닝 기초를 배우는 워크샵' },
  { title: '데이터 분석 실무 세미나', type: 'online' as const, format: 'seminar' as const, desc: '실무 데이터 분석 기법 학습' },
  { title: '웹 개발 풀스택 코스', type: 'hybrid' as const, format: 'course' as const, desc: '프론트엔드와 백엔드 개발 통합 학습' },
  { title: '모바일 앱 개발 강의', type: 'online' as const, format: 'lecture' as const, desc: '모바일 앱 개발 기초부터 고급까지' },
  { title: 'UI/UX 디자인 워크샵', type: 'offline' as const, format: 'workshop' as const, desc: '사용자 경험 중심의 디자인 방법론' },
  { title: '디지털 마케팅 전략 세미나', type: 'online' as const, format: 'seminar' as const, desc: '디지털 시대 마케팅 전략 수립' },
  { title: '창업 기초 코스', type: 'hybrid' as const, format: 'course' as const, desc: '스타트업 창업을 위한 기초 지식' },
  { title: '커뮤니케이션 스킬 강의', type: 'offline' as const, format: 'lecture' as const, desc: '효과적인 소통 방법 학습' },
]

const statuses: Program['status'][] = ['active', 'inactive', 'pending', 'completed', 'cancelled']

export const mockPrograms: Program[] = Array.from({ length: 40 }, (_, index) => {
  const template = programTemplates[index % programTemplates.length]
  const sponsor = mockSponsors[index % mockSponsors.length]
  const roundCount = Math.floor(Math.random() * 6) + 2 // 2-7회차
  const startDateOffset = Math.floor(Math.random() * 60) + 5 // 5-65일 후
  const programStatus = statuses[Math.floor(Math.random() * statuses.length)]

  // 학교 프로그램 vs 개인 프로그램 구분 (50:50 비율)
  const category: ProgramCategory = index % 2 === 0 ? 'school' : 'individual'

  return {
    id: `prog-${String(index + 1).padStart(3, '0')}`,
    sponsorId: sponsor.id,
    title: `${template.title} ${index >= programTemplates.length ? `(${Math.floor(index / programTemplates.length) + 1}기)` : ''}`,
    type: template.type,
    format: template.format,
    category,
    description: template.desc,
    rounds: createRounds(`prog-${String(index + 1).padStart(3, '0')}`, roundCount, startDateOffset),
    startDate: getFutureDate(startDateOffset),
    endDate: getFutureDate(startDateOffset + roundCount * 7),
    status: programStatus,
    settlementRuleId: Math.random() > 0.5 ? `rule-${String(Math.floor(Math.random() * 5) + 1).padStart(3, '0')}` : undefined,
    applicationPathId: Math.random() > 0.3 ? `path-${String(index + 1).padStart(3, '0')}` : undefined, // 70% 확률로 신청 경로 설정
    createdAt: getDate(Math.floor(Math.random() * 60) + 5),
    updatedAt: getDate(Math.floor(Math.random() * 5)),
  }
})

export const mockProgramsMap = new Map(mockPrograms.map(program => [program.id, program]))




