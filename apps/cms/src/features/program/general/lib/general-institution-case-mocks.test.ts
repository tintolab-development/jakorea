import { describe, expect, it } from 'vitest'
import { getGeneralProgramById } from '@/data/mock/general-programs'
import { getApplicantInstructorsByProgramId } from '@/data/mock/applicant-instructors'
import {
  getGeneralVolunteerDoc1Applicants,
  getGeneralVolunteerDocPassedApplicants,
  getGeneralVolunteerInterview2Applicants,
} from '@/data/mock/general-volunteer-applicants-mock'
import { getParticipatingSchoolsForProgram } from '@/data/mock/participating-schools'
import { getParticipatingInstructorsForProgram } from '@/data/mock/participating-instructors'
import { getParticipatingVolunteersForProgram } from '@/data/mock/participating-volunteers'
import { getMockProgramManagers } from '@/data/mock/program-managers'
import { buildGeneralSurveyMockState } from '@/features/program/general/ui/detail-modal/survey-management/survey-mock'
import { getSchoolDetailAttendanceSessions } from './school-detail-attendance-mock'
import {
  buildInitialAssignedSchoolRows,
  buildWaitingSchoolRows,
} from './instructor-institution-assignment-mock'
import { getGeneralInstitutionApplicationsForProgram } from './institution-applications-mock'
import {
  GENERAL_INSTITUTION_CASE_PROGRAM_IDS,
  GENERAL_INSTITUTION_MEMBER_ROSTER,
  GENERAL_INSTITUTION_ORGANIZATION_ROSTER,
} from './general-institution-case-roster'

const memberIds = new Set<number>(
  Object.values(GENERAL_INSTITUTION_MEMBER_ROSTER).map(member => member.memberId)
)
const organizationIds = new Set<number>(
  GENERAL_INSTITUTION_ORGANIZATION_ROSTER.map(organization => organization.organizationId)
)

function expectText(value: unknown): void {
  expect(typeof value).toBe('string')
  expect((value as string).trim()).not.toBe('')
}

describe.each(GENERAL_INSTITUTION_CASE_PROGRAM_IDS)('%s 기관 QA cases', programId => {
  it('기관 신청 승인 상태별 1건이며 기존 기관·회원만 참조한다', () => {
    const rows = getGeneralInstitutionApplicationsForProgram(programId)
    expect(rows).toHaveLength(3)
    expect(rows.map(row => row.approvalStatus).sort()).toEqual([
      'approved',
      'pending',
      'rejected',
    ])
    for (const row of rows) {
      expect(organizationIds.has(row.organizationId!)).toBe(true)
      expect(memberIds.has(row.teacherMemberId!)).toBe(true)
      expect(row.programId).toBe(programId)
      expectText(row.schoolName)
      expectText(row.region)
      expectText(row.teacherName)
      expectText(row.contact)
      expectText(row.appliedAt)
      expectText(row.adminComment)
      expectText(row.detail?.teacherInfo)
      expectText(row.detail?.applicationReason)
      expect(row.sessions?.length).toBeGreaterThan(0)
    }
  })

  it('강사·봉사자 신청 목록은 상태 case별 1건이며 기존 회원만 참조한다', () => {
    const instructors = getApplicantInstructorsByProgramId(programId)
    expect(instructors).toHaveLength(3)
    expect(new Set(instructors.map(row => row.approvalStatus))).toEqual(
      new Set(['pending', 'rejected', 'approved'])
    )
    instructors.forEach(row => {
      expect(memberIds.has(row.instructorMemberId!)).toBe(true)
      expectText(row.instructorName)
      expectText(row.contact)
      expectText(row.email)
    })

    const doc1 = getGeneralVolunteerDoc1Applicants(programId)
    const passed = getGeneralVolunteerDocPassedApplicants(programId)
    const interview2 = getGeneralVolunteerInterview2Applicants(programId)
    expect(doc1).toHaveLength(3)
    expect(passed).toHaveLength(3)
    expect(interview2).toHaveLength(9)
    ;[...doc1, ...passed, ...interview2].forEach(row => {
      expect(memberIds.has(row.memberId!)).toBe(true)
      expectText(row.name)
      expectText(row.contact)
      expectText(row.email)
    })
  })

  it('참여 기관·강사·봉사자 목록의 case cardinality와 연결 필드를 보장한다', () => {
    const schools = getParticipatingSchoolsForProgram(programId)
    expect(schools).toHaveLength(4)
    expect(new Set(schools.map(row => row.approvalStatus)).size).toBe(4)
    expect(new Set(schools.map(row => row.textbookStatus)).size).toBe(4)
    schools.forEach(row => {
      expect(organizationIds.has(row.organizationId!)).toBe(true)
      expect(memberIds.has(row.teacherMemberId!)).toBe(true)
      expectText(row.organizationApplicationId)
      expectText(row.schoolName)
      expectText(row.teacherName)
      expectText(row.instructors)
    })

    const instructors = getParticipatingInstructorsForProgram(programId)
    expect(instructors).toHaveLength(8)
    expect(new Set(instructors.map(row => row.settlementStatus)).size).toBe(8)
    instructors.forEach(row => {
      expect(memberIds.has(Number(row.memberId))).toBe(true)
      expectText(row.instructorName)
      expectText(row.contact)
      expectText(row.email)
      expectText(row.adminComment)
    })

    const volunteers = getParticipatingVolunteersForProgram(programId)
    expect(volunteers).toHaveLength(5)
    volunteers.forEach(row => {
      expect(memberIds.has(row.memberId!)).toBe(true)
      expectText(row.volunteerName)
      expectText(row.contact)
      expectText(row.email)
      expectText(row.adminComment)
    })
  })

  it('배정·출결 상태와 설문·담당자 case를 각각 1건 제공한다', () => {
    const program = getGeneralProgramById(programId)!
    const schools = getParticipatingSchoolsForProgram(programId)
    const instructors = getParticipatingInstructorsForProgram(programId)
    const assigned = buildInitialAssignedSchoolRows(instructors[0]!, schools, instructors)
    const waiting = buildWaitingSchoolRows(
      instructors[0]!,
      schools,
      instructors,
      new Set(assigned.map(row => row.id))
    )
    expect(assigned).toHaveLength(1)
    expect(new Set(waiting.map(row => row.assignmentStatus))).toEqual(
      new Set(['waiting', 'cancelled', 'assigned'])
    )

    const attendance = getSchoolDetailAttendanceSessions(schools[0]!, program)[0]!.students
    expect(attendance).toHaveLength(3)
    expect(new Set(attendance.map(row => row.status))).toEqual(
      new Set(['present', 'absent', 'late'])
    )

    const survey = buildGeneralSurveyMockState(program)
    expect(survey.registeredSurveys).toHaveLength(3)
    expect(new Set(survey.registeredSurveys.map(row => row.status))).toEqual(
      new Set(['before_start', 'in_progress', 'finished'])
    )
    expect(survey.responses).toHaveLength(2)
    survey.responses.forEach(row => {
      expect(memberIds.has(Number(row.respondentId))).toBe(true)
      expectText(row.respondentName)
      Object.values(row.answers).forEach(expectText)
    })

    const managers = getMockProgramManagers(programId)
    expect(managers).toHaveLength(3)
    expect(new Set(managers.map(row => row.role))).toEqual(
      new Set(['OWNER', 'PARTNER', 'ASSISTANT'])
    )
    managers.forEach(row => expect(memberIds.has(row.adminId!)).toBe(true))
  })
})

it('프로그램별 반환 배열과 행 객체를 격리한다', () => {
  const firstProgram = GENERAL_INSTITUTION_CASE_PROGRAM_IDS[0]
  const secondProgram = GENERAL_INSTITUTION_CASE_PROGRAM_IDS[1]
  const first = getGeneralInstitutionApplicationsForProgram(firstProgram)
  const second = getGeneralInstitutionApplicationsForProgram(secondProgram)
  first[0]!.schoolName = '변경된 이름'

  expect(second[0]!.schoolName).not.toBe('변경된 이름')
  expect(getGeneralInstitutionApplicationsForProgram(firstProgram)[0]!.schoolName).not.toBe(
    '변경된 이름'
  )
})
