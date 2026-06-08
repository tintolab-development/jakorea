import { getUserById, getUsers } from '@/entities/user/api/user-service'
import { INSTRUCTOR_SCHOOL_OPTIONS } from '@/data/mock/participating-instructors'
import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'

export type ParticipatingInstructorMemberCandidate = {
  memberId: string
  instructorName: string
}

/** 강사 회원 목록 — 이미 참여 강사로 등록된 이름 제외 */
export async function fetchParticipatingInstructorMemberCandidates(
  excludeInstructorNames: readonly string[]
): Promise<ParticipatingInstructorMemberCandidate[]> {
  const users = await getUsers({ role: 'INSTRUCTOR', instructorListPureOnly: true })
  const excluded = new Set(excludeInstructorNames.map(name => name.trim()))
  return users
    .filter(user => !excluded.has(user.name.trim()))
    .map(user => ({
      memberId: user.id,
      instructorName: user.name,
    }))
}

export async function buildParticipatingInstructorRowFromMember(
  memberId: string,
  nextNo: number,
  nextId: string
): Promise<ParticipatingInstructorRow | null> {
  const user = await getUserById(memberId)
  if (!user || user.role !== 'INSTRUCTOR') return null

  return {
    id: nextId,
    no: nextNo,
    instructorName: user.name,
    schoolName: INSTRUCTOR_SCHOOL_OPTIONS[0],
    educationGrade: '1학년',
    classCount: 0,
    studentCount: 0,
    lectureRound: '진행 전',
    settlementStatus: 'none',
    teacherName: '-',
    contact: user.phone,
    email: user.email,
    address: user.detailAddress,
    region: user.detailAddress,
    lectureExperienceYears: 0,
    lectureReportSubmitted: false,
    registeredByAdmin: true,
  }
}
