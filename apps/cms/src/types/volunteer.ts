/**
 * 봉사자 관련 타입 정의
 */

import type { UUID, DateValue } from './index'

// 봉사자 매칭 이력 (파트너 매칭 추적용)
export interface VolunteerMatchingHistory {
  id: UUID
  programId: UUID
  scheduleId: UUID
  volunteer1Id: UUID
  volunteer2Id: UUID
  matchedAt: DateValue
  createdAt: DateValue
}

// 봉사자 통계 정보
export interface VolunteerStats {
  volunteerId: UUID
  participationCount: number // 총 참여 횟수
  partnerHistory: UUID[] // 과거에 함께 매칭된 파트너 ID 목록
  lastMatchedAt?: DateValue // 마지막 매칭 일자
}

// 봉사자 매칭 결과
export interface VolunteerPair {
  volunteer1Id: UUID
  volunteer2Id: UUID
  volunteer1Name: string
  volunteer2Name: string
  volunteer1ParticipationCount: number
  volunteer2ParticipationCount: number
  isNewPair: boolean // 새로운 조합인지 여부
  previousMatchCount: number // 과거에 함께 매칭된 횟수
}

// 봉사자 랜덤 배치 옵션
export interface VolunteerRandomMatchingOptions {
  programId: UUID
  scheduleId: UUID
  excludeVolunteerIds?: UUID[] // 제외할 봉사자 ID 목록
  maxPreviousMatches?: number // 최대 과거 매칭 횟수 (기본값: 0, 중복 방지)
  prioritizeNewPairs?: boolean // 새로운 조합 우선 (기본값: true)
}
