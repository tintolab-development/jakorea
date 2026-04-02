/**
 * 경제 교육 프로그램 Mock 데이터
 * 일반 교육 프로그램(getEducationPrograms)과 동일한 Program 구조·필드로 복제하고,
 * programCategory만 「경제 교육 프로그램」으로 둔다.
 * 건수는 기존과 같이 206건(교육 목록을 순환 복제).
 */

import type { Program, ProgramRound } from '../../types/domain'
import { getEducationPrograms } from './education-programs'

const ECONOMY_PROGRAM_CATEGORY = '경제 교육 프로그램'
const TOTAL_ECONOMY_MOCK_COUNT = 206

function cloneProgramAsEconomy(source: Program, economyId: string): Program {
  const json = JSON.parse(JSON.stringify(source)) as Program
  const rounds: ProgramRound[] = (json.rounds ?? []).map((r: ProgramRound, idx: number) => ({
    ...r,
    id: `${economyId}-round-${r.roundNumber ?? idx + 1}`,
    programId: economyId,
  }))
  return {
    ...json,
    id: economyId,
    rounds,
    programCategory: ECONOMY_PROGRAM_CATEGORY,
  }
}

function pickEducationBase(education: Program[], index: number): Program {
  if (index === 0) {
    const hsbcLike = education.find(
      p =>
        /HSBC|HKU|Business Case/i.test(p.title) ||
        /HSBC|Business Case/i.test(p.mainTitle ?? '')
    )
    if (hsbcLike) return hsbcLike
  }
  return education[index % education.length]
}

let economyProgramsCache: Program[] | null = null

export function getEconomyPrograms(): Program[] {
  if (economyProgramsCache) return economyProgramsCache

  const education = getEducationPrograms()
  if (education.length === 0) {
    economyProgramsCache = []
    return economyProgramsCache
  }

  const programs: Program[] = []
  for (let i = 0; i < TOTAL_ECONOMY_MOCK_COUNT; i++) {
    const base = pickEducationBase(education, i)
    const id = `economy-prog-${String(i + 1).padStart(3, '0')}`
    programs.push(cloneProgramAsEconomy(base, id))
  }

  economyProgramsCache = programs
  return programs
}
