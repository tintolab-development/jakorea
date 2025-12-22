/**
 * 프로그램 관련 비즈니스 로직 헬퍼 함수
 * Phase 2.2: 비즈니스 로직 분리
 */

import type { Program, ProgramRound } from '@/types/domain'
import { mockApplications } from '@/data/mock'

/**
 * 프로그램별 신청 수 계산
 * @param programId 프로그램 ID
 * @returns 신청 수
 */
export function getApplicationCountByProgram(programId: string): number {
  return mockApplications.filter(app => app.programId === programId).length
}

/**
 * 확정된 회차만 필터링
 * @param rounds 회차 배열
 * @returns 확정된 회차 배열 (status가 'active' 또는 'completed')
 */
export function getConfirmedRounds(rounds: ProgramRound[]): ProgramRound[] {
  return rounds.filter(round => round.status === 'active' || round.status === 'completed')
}

/**
 * 신청 가능 여부 확인
 * @param program 프로그램 정보
 * @returns 신청 가능 여부
 */
export function isApplicationAvailable(program: Program): boolean {
  // 실제로는 Program 타입에 applicationAvailable 필드가 필요
  // 현재는 프로그램 상태로 시뮬레이션
  return program.status === 'active'
}

/**
 * 신청 URL 생성
 * @param programId 프로그램 ID
 * @returns 신청 URL 또는 undefined
 */
export function getApplicationUrl(programId: string): string | undefined {
  // 실제로는 프로그램의 applicationAvailable 필드를 확인해야 함
  return `/applications/new?programId=${programId}`
}


