/**
 * 강사 후보 제안 로직
 * Phase 3.2: 지역/전문분야 기반 필터링
 */

import type { Instructor, Program } from '@/types/domain'
import { mockInstructors } from '@/data/mock'

export interface InstructorCandidate extends Instructor {
  matchScore: number
  matchReasons: string[]
}

/**
 * 프로그램에 적합한 강사 후보 제안
 * @param program 프로그램 정보
 * @param excludeInstructorIds 제외할 강사 ID 목록 (이미 매칭된 강사)
 * @returns 강사 후보 목록 (매칭 점수 순으로 정렬)
 */
export function suggestInstructorCandidates(
  program: Program,
  excludeInstructorIds: string[] = []
): InstructorCandidate[] {
  const candidates: InstructorCandidate[] = []

  for (const instructor of mockInstructors) {
    // 이미 매칭된 강사는 제외
    if (excludeInstructorIds.includes(instructor.id)) {
      continue
    }

    let matchScore = 0
    const matchReasons: string[] = []

    // 지역 매칭 (프로그램 설명이나 제목에서 지역 정보 추출)
    // 실제로는 프로그램에 지역 정보가 있어야 하지만, Mock 데이터에는 없으므로
    // 강사의 지역을 우선 고려

    // 전문분야 매칭
    if (program.description) {
      const programKeywords = program.description.toLowerCase()
      const matchedSpecialties = instructor.specialty.filter(specialty => {
        const specialtyLower = specialty.toLowerCase()
        return programKeywords.includes(specialtyLower) || specialtyLower.includes(programKeywords)
      })

      if (matchedSpecialties.length > 0) {
        matchScore += matchedSpecialties.length * 10
        matchReasons.push(`전문분야 일치: ${matchedSpecialties.join(', ')}`)
      }
    }

    // 프로그램 유형 매칭
    if (program.type === 'online' && instructor.availableTime) {
      matchScore += 5
      matchReasons.push('온라인 가능')
    }

    // 평점 기반 점수
    if (instructor.rating) {
      matchScore += instructor.rating * 2
      matchReasons.push(`평점: ${instructor.rating.toFixed(1)}`)
    }

    // 경력 기반 점수
    if (instructor.experience) {
      const experience = typeof instructor.experience === 'string' ? parseInt(instructor.experience) : instructor.experience
      matchScore += Math.min(experience, 10)
      matchReasons.push(`경력: ${experience}년`)
    }

    if (matchScore > 0) {
      candidates.push({
        ...instructor,
        matchScore,
        matchReasons,
      })
    }
  }

  // 매칭 점수 순으로 정렬
  return candidates.sort((a, b) => b.matchScore - a.matchScore)
}

