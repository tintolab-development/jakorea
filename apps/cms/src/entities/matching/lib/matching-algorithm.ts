/**
 * 매칭 알고리즘 (FR-F02)
 * Task 3.3.1: 학교 요구사항·강사 정보 기반 자동 매칭, 지역/일정·우선순위 반영
 */

import type { Matching, Program, Schedule, Instructor, School } from '@/types/domain'
import type { UUID } from '@/types'
import {
  mockMatchings,
  mockApplications,
  mockInstructors,
  mockSchools,
  mockPrograms,
  mockSchedules,
} from '@/data/mock'

export interface MatchingAlgorithmInput {
  programId: UUID
  roundId?: UUID
  /** 특정 일정만 대상 (미지정 시 프로그램/회차 내 전체) */
  scheduleIds?: UUID[]
}

export interface MatchingCandidate {
  instructor: Instructor
  schedule: Schedule
  school: School | null
  score: number
  reasons: string[]
}

/**
 * 이미 매칭된 강사 ID 목록 (프로그램·회차 기준)
 */
export function getAlreadyMatchedInstructorIds(
  programId: UUID,
  roundId?: UUID
): UUID[] {
  let list = mockMatchings.filter(
    m => m.programId === programId && m.status !== 'cancelled'
  )
  if (roundId) {
    list = list.filter(m => m.roundId === roundId)
  }
  return [...new Set(list.map(m => m.instructorId))]
}

/**
 * 이미 매칭된 (instructorId, scheduleId) 쌍
 * 수동 배정 시 중복 방지에 사용
 */
export function getAlreadyMatchedPairs(
  programId: UUID,
  roundId?: UUID
): Array<{ instructorId: UUID; scheduleId: UUID }> {
  let list = mockMatchings.filter(
    m =>
      m.programId === programId &&
      m.scheduleId &&
      m.status !== 'cancelled'
  )
  if (roundId) {
    list = list.filter(m => m.roundId === roundId)
  }
  return list
    .filter((m): m is Matching & { scheduleId: UUID } => !!m.scheduleId)
    .map(m => ({ instructorId: m.instructorId, scheduleId: m.scheduleId }))
}

/**
 * 프로그램·회차에 해당하는 일정 목록
 */
function getSchedulesForProgram(
  programId: UUID,
  roundId?: UUID,
  scheduleIds?: UUID[]
): Schedule[] {
  let list = mockSchedules.filter(s => s.programId === programId)
  if (roundId) {
    list = list.filter(s => s.roundId === roundId)
  }
  if (scheduleIds?.length) {
    const set = new Set(scheduleIds)
    list = list.filter(s => set.has(s.id))
  }
  return list
}

/**
 * 프로그램에 대한 승인된 학교 신청 목록
 */
function getApprovedSchoolApplications(programId: UUID, roundId?: UUID) {
  let list = mockApplications.filter(
    a =>
      a.programId === programId &&
      a.subjectType === 'school' &&
      a.status === 'approved'
  )
  if (roundId) {
    list = list.filter(a => a.roundId === roundId)
  }
  return list
}

/**
 * 프로그램에 대한 승인된 강사 신청 강사 ID 목록
 */
function getApprovedInstructorIds(programId: UUID): UUID[] {
  return mockApplications
    .filter(
      a =>
        a.programId === programId &&
        a.subjectType === 'instructor' &&
        a.status === 'approved'
    )
    .map(a => a.subjectId)
}

function getSchoolById(id: UUID): School | undefined {
  return mockSchools.find(s => s.id === id)
}

function getProgramById(id: UUID): Program | undefined {
  return mockPrograms.find(p => p.id === id)
}

/**
 * 강사–학교 매칭 점수 (지역·전문분야·평점 등)
 */
function scoreInstructorForSchool(
  instructor: Instructor,
  school: School | null,
  program: Program | null
): { score: number; reasons: string[] } {
  let score = 0
  const reasons: string[] = []

  if (school) {
    const regionMatch =
      school.region && instructor.region && school.region === instructor.region
    if (regionMatch) {
      score += 20
      reasons.push(`지역 일치: ${school.region}`)
    } else if (
      school.region &&
      instructor.region &&
      school.region.includes(instructor.region) !==
        instructor.region.includes(school.region)
    ) {
      const [r1, r2] = [school.region, instructor.region]
      if (r1.includes(r2) || r2.includes(r1)) {
        score += 10
        reasons.push(`지역 유사: ${school.region} / ${instructor.region}`)
      }
    }
  }

  if (program?.description) {
    const kw = program.description.toLowerCase()
    const matched = instructor.specialty.filter(
      s => kw.includes(s.toLowerCase()) || s.toLowerCase().includes(kw)
    )
    if (matched.length) {
      score += matched.length * 10
      reasons.push(`전문분야 일치: ${matched.join(', ')}`)
    }
  }

  if (instructor.rating != null) {
    score += instructor.rating * 2
    reasons.push(`평점 ${instructor.rating.toFixed(1)}`)
  }

  if (instructor.experience) {
    const exp = parseInt(String(instructor.experience), 10)
    if (!Number.isNaN(exp)) {
      score += Math.min(exp, 10)
      reasons.push(`경력 ${exp}년`)
    }
  }

  return { score, reasons }
}

/**
 * 자동 매칭 알고리즘 실행
 * - 프로그램·회차·일정 범위 내 승인 학교/강사 신청 및 기존 매칭 반영
 * - 미배정 일정별로 후보 강사를 점수화해 정렬해 반환
 */
export function runMatchingAlgorithm(
  input: MatchingAlgorithmInput
): MatchingCandidate[] {
  const { programId, roundId, scheduleIds } = input
  const program = getProgramById(programId)
  const schedules = getSchedulesForProgram(programId, roundId, scheduleIds)
  const approvedSchools = getApprovedSchoolApplications(programId, roundId)
  const approvedInstructorIds = getApprovedInstructorIds(programId)
  const alreadyMatched = getAlreadyMatchedInstructorIds(programId, roundId)
  const alreadyPairs = new Set(
    getAlreadyMatchedPairs(programId, roundId).map(
      p => `${p.instructorId}:${p.scheduleId}`
    )
  )

  const excludeIds = [...new Set([...alreadyMatched])]
  const candidateInstructors = mockInstructors.filter(
    i =>
      !excludeIds.includes(i.id) &&
      (approvedInstructorIds.length === 0 || approvedInstructorIds.includes(i.id))
  )

  const schoolByIndex = (i: number) => {
    const app = approvedSchools[i % approvedSchools.length]
    return app ? getSchoolById(app.subjectId) ?? null : null
  }

  const results: MatchingCandidate[] = []

  for (let idx = 0; idx < schedules.length; idx++) {
    const schedule = schedules[idx]
    const school = schoolByIndex(idx)

    for (const instructor of candidateInstructors) {
      const key = `${instructor.id}:${schedule.id}`
      if (alreadyPairs.has(key)) continue

      const { score, reasons } = scoreInstructorForSchool(
        instructor,
        school,
        program ?? null
      )
      if (score <= 0) continue

      results.push({
        instructor,
        schedule,
        school,
        score,
        reasons,
      })
    }
  }

  results.sort((a, b) => b.score - a.score)
  return results
}
