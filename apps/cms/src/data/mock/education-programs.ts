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
 * - 위젯/필터 오갈 때 건수 불일치 방지: 반환 배열 id 기준 중복 제거, 추가 생성은 한 번만 수행
 */
export function getEducationPrograms(): Program[] {
  const volunteerProgramIds = new Set(getVolunteerPrograms().map(p => p.id))
  // 봉사 프로그램이 아닌 프로그램들을 교육 프로그램으로 분류
  const educationPrograms = mockPrograms.filter(program => !volunteerProgramIds.has(program.id))

  // 이미 이전에 추가한 edu-prog-* 가 있으면 재사용(한 번만 push 하도록). 제목 중복 " (교육 N) (교육 M)" → " (교육 M)" 정규화.
  const existingAdditional = mockPrograms.filter(p => String(p.id).startsWith('edu-prog-'))
  if (existingAdditional.length > 0) {
    existingAdditional.forEach(p => {
      const normalized = p.title.replace(/\s*\(교육\s*\d+\)\s*\(교육\s*(\d+)\)\s*$/, ' (교육 $1)')
      if (normalized !== p.title) (p as Program).title = normalized
    })
    additionalEducationPrograms = existingAdditional
  }

  // 최소 15개 이상 보장 (부족하면 추가 생성, 단 한 번만)
  if (educationPrograms.length < 15) {
    if (additionalEducationPrograms && additionalEducationPrograms.length > 0) {
      // id 기준 중복 제거: educationPrograms에 이미 포함된 항목은 additional에서 제외
      const baseIds = new Set(educationPrograms.map(p => p.id))
      const extra = additionalEducationPrograms.filter(p => !baseIds.has(p.id))
      return [...educationPrograms, ...extra]
    }

    // 기존 프로그램을 기반으로 추가 교육 프로그램 생성 (최초 1회만 push)
    const additionalCount = 15 - educationPrograms.length
    const newAdditionalPrograms: Program[] = []

    for (let i = 0; i < additionalCount; i++) {
      const baseIndex = educationPrograms.length + i
      const baseProgram = mockPrograms[baseIndex % mockPrograms.length]
      // 이미 " (교육 N)"이 붙어 있으면 제거 후 새 번호만 붙여 중복 방지 (예: 신용케어 아카데미 (교육 2) → 신용케어 아카데미 (교육 1))
      const baseTitle = baseProgram.title.replace(/\s*\(교육\s*\d+\)\s*$/, '').trim() || baseProgram.title

      const newProgram: Program = {
        ...baseProgram,
        id: `edu-prog-${String(educationPrograms.length + i + 1).padStart(3, '0')}`,
        title: `${baseTitle} (교육 ${i + 1})`,
        format: 'course' as const, // 교육 프로그램은 주로 course 형식
        createdAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000 + 5).toISOString(),
      }

      mockPrograms.push(newProgram)
      mockProgramsMap.set(newProgram.id, newProgram)
      newAdditionalPrograms.push(newProgram)
    }

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
