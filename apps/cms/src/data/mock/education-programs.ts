/**
 * 교육 프로그램 Mock 데이터
 * 봉사자가 필요하지 않은 일반 교육 프로그램 목록
 */

import type { Program } from '../../types/domain'
import { mockPrograms, mockProgramsMap } from './programs'
import { getVolunteerPrograms } from './volunteer-programs'

// 추가 생성된 교육 프로그램을 저장 (한 번만 생성)
let additionalEducationPrograms: Program[] | null = null

/**
 * 교육 프로그램 필터링
 * 봉사 프로그램이 아닌 일반 교육 프로그램
 */
export function getEducationPrograms(): Program[] {
  const volunteerProgramIds = new Set(getVolunteerPrograms().map(p => p.id))
  // 봉사 프로그램이 아닌 프로그램들을 교육 프로그램으로 분류
  const educationPrograms = mockPrograms.filter(program => !volunteerProgramIds.has(program.id))

  // 최소 15개 이상 보장 (부족하면 추가 생성)
  if (educationPrograms.length < 15) {
    // 이미 생성된 추가 프로그램이 있으면 재사용
    if (additionalEducationPrograms) {
      return [...educationPrograms, ...additionalEducationPrograms]
    }

    // 기존 프로그램을 기반으로 추가 교육 프로그램 생성
    const additionalCount = 15 - educationPrograms.length
    const newAdditionalPrograms: Program[] = []

    for (let i = 0; i < additionalCount; i++) {
      const baseIndex = educationPrograms.length + i
      const baseProgram = mockPrograms[baseIndex % mockPrograms.length]

      const newProgram: Program = {
        ...baseProgram,
        id: `edu-prog-${String(educationPrograms.length + i + 1).padStart(3, '0')}`,
        title: `${baseProgram.title} (교육 ${i + 1})`,
        format: 'course' as const, // 교육 프로그램은 주로 course 형식
        createdAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000 + 5).toISOString(),
      }

      // mockPrograms와 mockProgramsMap에 추가
      mockPrograms.push(newProgram)
      mockProgramsMap.set(newProgram.id, newProgram)
      newAdditionalPrograms.push(newProgram)
    }

    // 캐시에 저장
    additionalEducationPrograms = newAdditionalPrograms

    return [...educationPrograms, ...newAdditionalPrograms]
  }

  return educationPrograms.slice(0, Math.max(15, educationPrograms.length))
}

/**
 * 교육 프로그램 Map
 */
export const mockEducationProgramsMap = new Map(
  getEducationPrograms().map(program => [program.id, program])
)
