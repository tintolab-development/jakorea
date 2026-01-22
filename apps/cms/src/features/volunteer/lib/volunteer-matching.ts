/**
 * 봉사자 랜덤 매칭 알고리즘
 * 참여 횟수 및 파트너 매칭 이력을 기반으로 중복되지 않도록 2인 1조로 랜덤 매칭
 */

import type { UUID } from '@/types/index'
import type {
  VolunteerPair,
  VolunteerStats,
  VolunteerMatchingHistory,
  VolunteerRandomMatchingOptions,
} from '@/types/volunteer'
import { mockVolunteerActivities } from '@/data/mock/activities'
import { mockUsers } from '@/data/mock/users'

/**
 * 봉사자 통계 정보 계산
 */
export function calculateVolunteerStats(
  volunteerId: UUID,
  matchingHistory: VolunteerMatchingHistory[]
): VolunteerStats {
  const participationCount = mockVolunteerActivities.filter(
    activity => activity.volunteerId === volunteerId
  ).length

  const partnerHistory: UUID[] = []
  const partnerCounts = new Map<UUID, number>()

  // 매칭 이력에서 파트너 추출
  for (const history of matchingHistory) {
    if (history.volunteer1Id === volunteerId) {
      partnerHistory.push(history.volunteer2Id)
      partnerCounts.set(history.volunteer2Id, (partnerCounts.get(history.volunteer2Id) || 0) + 1)
    } else if (history.volunteer2Id === volunteerId) {
      partnerHistory.push(history.volunteer1Id)
      partnerCounts.set(history.volunteer1Id, (partnerCounts.get(history.volunteer1Id) || 0) + 1)
    }
  }

  // 마지막 매칭 일자 찾기
  const lastMatchedAt = matchingHistory
    .filter(
      h => h.volunteer1Id === volunteerId || h.volunteer2Id === volunteerId
    )
    .sort((a, b) => new Date(b.matchedAt).getTime() - new Date(a.matchedAt).getTime())[0]
    ?.matchedAt

  return {
    volunteerId,
    participationCount,
    partnerHistory: Array.from(partnerCounts.keys()),
    lastMatchedAt,
  }
}

/**
 * 두 봉사자가 과거에 함께 매칭된 횟수 계산
 */
export function getPreviousMatchCount(
  volunteer1Id: UUID,
  volunteer2Id: UUID,
  matchingHistory: VolunteerMatchingHistory[]
): number {
  return matchingHistory.filter(
    history =>
      (history.volunteer1Id === volunteer1Id && history.volunteer2Id === volunteer2Id) ||
      (history.volunteer1Id === volunteer2Id && history.volunteer2Id === volunteer1Id)
  ).length
}

/**
 * 배열 셔플 (Fisher-Yates 알고리즘)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

/**
 * 봉사자 랜덤 매칭 (2인 1조)
 * 참여 횟수와 파트너 매칭 이력을 고려하여 중복되지 않도록 매칭
 */
export function randomMatchVolunteers(
  volunteerIds: UUID[],
  options: VolunteerRandomMatchingOptions,
  matchingHistory: VolunteerMatchingHistory[] = []
): VolunteerPair[] {
  // 제외할 봉사자 필터링
  let availableVolunteers = volunteerIds.filter(
    id => !options.excludeVolunteerIds?.includes(id)
  )

  // 봉사자 수가 홀수인 경우 처리
  if (availableVolunteers.length < 2) {
    return []
  }

  // 각 봉사자의 통계 정보 계산
  const statsMap = new Map<UUID, VolunteerStats>()
  for (const volunteerId of availableVolunteers) {
    statsMap.set(volunteerId, calculateVolunteerStats(volunteerId, matchingHistory))
  }

  // 참여 횟수 기준으로 정렬 (참여 횟수가 적은 봉사자 우선)
  availableVolunteers.sort((a, b) => {
    const statsA = statsMap.get(a)!
    const statsB = statsMap.get(b)!
    return statsA.participationCount - statsB.participationCount
  })

  // 랜덤 요소 추가: 참여 횟수가 같은 봉사자들끼리는 랜덤 셔플
  // 같은 참여 횟수를 가진 그룹 내에서 랜덤하게 섞기
  const shuffledVolunteers: UUID[] = []
  let currentGroup: UUID[] = []
  let currentCount = -1

  for (const volunteerId of availableVolunteers) {
    const stats = statsMap.get(volunteerId)!
    if (stats.participationCount !== currentCount) {
      // 새로운 그룹 시작
      if (currentGroup.length > 0) {
        shuffledVolunteers.push(...shuffleArray(currentGroup))
      }
      currentGroup = [volunteerId]
      currentCount = stats.participationCount
    } else {
      currentGroup.push(volunteerId)
    }
  }
  // 마지막 그룹 추가
  if (currentGroup.length > 0) {
    shuffledVolunteers.push(...shuffleArray(currentGroup))
  }

  availableVolunteers = shuffledVolunteers

  const pairs: VolunteerPair[] = []
  const usedVolunteers = new Set<UUID>()
  const maxPreviousMatches = options.maxPreviousMatches ?? 0
  const prioritizeNewPairs = options.prioritizeNewPairs ?? true

  // 매칭 알고리즘: 참여 횟수가 적은 봉사자부터 매칭
  for (let i = 0; i < availableVolunteers.length; i++) {
    if (usedVolunteers.has(availableVolunteers[i])) {
      continue
    }

    const volunteer1Id = availableVolunteers[i]
    const stats1 = statsMap.get(volunteer1Id)!
    const volunteer1 = mockUsers.find(u => u.id === volunteer1Id)

    // 파트너 후보 찾기
    let bestPartner: UUID | null = null
    let bestScore = -1

    for (let j = i + 1; j < availableVolunteers.length; j++) {
      const volunteer2Id = availableVolunteers[j]
      if (usedVolunteers.has(volunteer2Id)) {
        continue
      }

      const stats2 = statsMap.get(volunteer2Id)!
      const previousMatchCount = getPreviousMatchCount(volunteer1Id, volunteer2Id, matchingHistory)

      // 중복 방지: 과거 매칭 횟수가 최대값을 초과하면 제외
      if (previousMatchCount > maxPreviousMatches) {
        continue
      }

      // 점수 계산 (낮을수록 좋음)
      let score = 0

      // 참여 횟수 차이 (비슷한 참여 횟수 우선)
      const participationDiff = Math.abs(stats1.participationCount - stats2.participationCount)
      score += participationDiff * 10

      // 과거 매칭 횟수 (새로운 조합 우선)
      if (prioritizeNewPairs) {
        score += previousMatchCount * 100
      } else {
        score += previousMatchCount * 5
      }

      // 최적 파트너 선택
      if (bestPartner === null || score < bestScore) {
        bestPartner = volunteer2Id
        bestScore = score
      }
    }

    // 매칭 성공
    if (bestPartner) {
      const volunteer2 = mockUsers.find(u => u.id === bestPartner!)
      const stats2 = statsMap.get(bestPartner)!
      const previousMatchCount = getPreviousMatchCount(volunteer1Id, bestPartner, matchingHistory)

      pairs.push({
        volunteer1Id,
        volunteer2Id: bestPartner,
        volunteer1Name: volunteer1?.name || '알 수 없음',
        volunteer2Name: volunteer2?.name || '알 수 없음',
        volunteer1ParticipationCount: stats1.participationCount,
        volunteer2ParticipationCount: stats2.participationCount,
        isNewPair: previousMatchCount === 0,
        previousMatchCount,
      })

      usedVolunteers.add(volunteer1Id)
      usedVolunteers.add(bestPartner)
    }
  }

  // 매칭되지 않은 봉사자가 1명 남은 경우 처리
  const remainingVolunteers = availableVolunteers.filter(id => !usedVolunteers.has(id))
  if (remainingVolunteers.length === 1) {
    // 마지막 봉사자는 단독으로 표시하거나, 가장 적게 매칭된 조에 추가할 수 있음
    // 여기서는 단독으로 표시하지 않고 경고만 표시
    console.warn('매칭되지 않은 봉사자가 있습니다:', remainingVolunteers[0])
  }

  return pairs
}

/**
 * 봉사자 목록에서 봉사자만 필터링
 */
export function getVolunteerIds(): UUID[] {
  return mockUsers
    // Phase 0.1.1: INDIVIDUAL 우선 사용
    .filter(user => (user.role === 'INDIVIDUAL' || user.role === 'VOLUNTEER') && user.isActive)
    .map(user => user.id)
}
