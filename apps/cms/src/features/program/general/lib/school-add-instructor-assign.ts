/**
 * 참여 기관 상세 — 강사 추가 배정 모달용 옵션·일정 비활성 판별
 */

import {
  getApplicantInstructorsByProgramId,
  type ApplicantInstructorRow,
} from '@/data/mock/applicant-instructors'
import type { ParticipatingInstructorRow } from '@/data/mock/participating-instructors'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/data/mock/participating-schools'
import type { InstructorAssignSessionOption } from './instructor-assign-session-options'

export interface SchoolAddInstructorAssignOption {
  value: string
  label: string
  contact?: string
  email?: string
  /** 프로그램 참여 최초 승인 유무 (false면 강사 신규 배정 안내 모달 노출) */
  initialApproval?: boolean
}

function parseSessionDateKey(dateRaw: string): string | null {
  const cleaned = dateRaw.trim().replace(/\s/g, '')
  const parts = cleaned.split(/[.\\/]/).filter(Boolean)
  if (parts.length < 3) return null
  const y = parts[0]!.length === 2 ? `20${parts[0]}` : parts[0]!
  const m = parts[1]!.padStart(2, '0')
  const d = parts[2]!.padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatScheduleDateLabel(dateRaw: string, dayOfWeek: string): string {
  const cleaned = dateRaw.trim()
  const parts = cleaned.split(/[.\\/]/).filter(p => p.length > 0)
  if (parts.length >= 3) {
    const y = parseInt(parts[0]!, 10)
    const yy = Number.isFinite(y) ? String(y).slice(-2) : parts[0]!.slice(-2)
    const mm = parseInt(parts[1]!, 10)
    const dd = parts[2]!.padStart(2, '0')
    return `${yy}년 ${mm}월 ${dd}일(${dayOfWeek})`
  }
  return `${cleaned}(${dayOfWeek})`
}

function normalizeTimeRangeDisplay(timeRange: string): string {
  const parts = timeRange.split('~').map(part => {
    const p = part.trim()
    const m = p.match(/^(\d{1,2}):(\d{2})$/)
    if (m) return `${m[1]!.padStart(2, '0')}:${m[2]}`
    return p
  })
  return parts.join(' ~ ')
}

export function buildSchoolAddInstructorSessionSlotKey(
  schoolId: string,
  session: ParticipatingSchoolSession
): string {
  const dateKey = parseSessionDateKey(session.date)
  if (!dateKey) return `session-${schoolId}-${session.round}`
  return `${dateKey}|${schoolId}|${session.round}`
}

function findParticipatingInstructorForAssign(
  instructorId: string | undefined,
  applicant: ApplicantInstructorRow | undefined,
  participatingList: ParticipatingInstructorRow[]
): ParticipatingInstructorRow | undefined {
  if (!instructorId && !applicant) return undefined
  const byApplicantId = participatingList.find(row => row.id === instructorId)
  if (byApplicantId) return byApplicantId
  if (!applicant) return undefined
  return participatingList.find(row => row.instructorName === applicant.instructorName)
}

function isInstructorAssignedOnDateAtOtherSchool(
  participating: ParticipatingInstructorRow,
  dateKey: string,
  currentSchoolName: string,
  schoolRows: ParticipatingSchoolRow[]
): boolean {
  const assignedSchoolName = participating.schoolName?.trim()
  if (!assignedSchoolName || assignedSchoolName === currentSchoolName) return false
  const assignedSchool = schoolRows.find(s => s.schoolName === assignedSchoolName)
  if (!assignedSchool?.sessions?.length) return false
  return assignedSchool.sessions.some(session => parseSessionDateKey(session.date) === dateKey)
}

function isSessionDisabledForInstructor(params: {
  session: ParticipatingSchoolSession
  slotKey: string
  dateKey: string | null
  instructorId?: string
  applicantInstructors: ApplicantInstructorRow[]
  participatingList: ParticipatingInstructorRow[]
  currentSchoolId: string
  currentSchoolName: string
  schoolRows: ParticipatingSchoolRow[]
}): boolean {
  const {
    session,
    slotKey,
    dateKey,
    instructorId,
    applicantInstructors,
    participatingList,
    currentSchoolId,
    currentSchoolName,
    schoolRows,
  } = params

  if (session.status === 'completed') return true
  if (!instructorId) return false

  const applicant = applicantInstructors.find(row => row.id === instructorId)
  const participating = findParticipatingInstructorForAssign(
    instructorId,
    applicant,
    participatingList
  )

  if (applicant?.preferredScheduleSlots?.some(slot => slot.slotKey === slotKey && !slot.assignable)) {
    return true
  }

  if (dateKey) {
    if (participating?.unavailableEducationDateKeys?.includes(dateKey)) return true

    if (
      applicant?.assignedLectures?.some(
        lecture => lecture.dateKey === dateKey && lecture.schoolId !== currentSchoolId
      )
    ) {
      return true
    }

    if (
      participating &&
      isInstructorAssignedOnDateAtOtherSchool(
        participating,
        dateKey,
        currentSchoolName,
        schoolRows
      )
    ) {
      return true
    }
  }

  return false
}

function mockAssignedInstructorCount(sessionIndex: number, sessionRound: number): number {
  const counts = [3, 3, 2, 3, 2, 1]
  return counts[(sessionIndex + sessionRound) % counts.length]
}

/** 해당 프로그램에 승인된 강사만 선택 목록에 노출 (학교 신청 단위 아님) */
export function buildProgramApprovedInstructorAssignOptions(
  programId: string,
  assignedInstructorNames: Iterable<string>
): SchoolAddInstructorAssignOption[] {
  const assignedNames = new Set(assignedInstructorNames)
  return getApplicantInstructorsByProgramId(programId)
    .filter(row => row.approvalStatus === 'approved' && !assignedNames.has(row.instructorName))
    .map(row => ({
      value: row.id,
      label: row.instructorName,
      contact: row.contact,
      email: row.email,
      initialApproval: true,
    }))
}

/** 기관 신청 교육일 → 배정일 태그 (강사 선택 시 일정 불가·타 기관 배정일 비활성) */
export function buildSchoolAddInstructorAssignSessionOptions(params: {
  programId: string
  schoolId: string
  schoolName: string
  sessions: ParticipatingSchoolSession[] | undefined | null
  selectedInstructorId?: string
  participatingInstructorList: ParticipatingInstructorRow[]
  participatingSchoolList?: ParticipatingSchoolRow[]
}): InstructorAssignSessionOption[] {
  const {
    programId,
    schoolId,
    schoolName,
    sessions,
    selectedInstructorId,
    participatingInstructorList,
    participatingSchoolList = [],
  } = params

  if (!sessions?.length) return []

  const applicantInstructors = getApplicantInstructorsByProgramId(programId)

  return sessions.map((session, idx) => {
    const dateLabel = formatScheduleDateLabel(session.date, session.dayOfWeek)
    const timeLabel = normalizeTimeRangeDisplay(session.timeRange)
    const dateKey = parseSessionDateKey(session.date)
    const slotKey = buildSchoolAddInstructorSessionSlotKey(schoolId, session)
    const disabled = isSessionDisabledForInstructor({
      session,
      slotKey,
      dateKey,
      instructorId: selectedInstructorId,
      applicantInstructors,
      participatingList: participatingInstructorList,
      currentSchoolId: schoolId,
      currentSchoolName: schoolName,
      schoolRows: participatingSchoolList,
    })

    return {
      id: slotKey,
      dateLabel,
      timeLabel,
      scheduleLabel: `${dateLabel} ${timeLabel}`,
      sessionRoundLabel: `${session.round}차시`,
      capacityLabel: `${mockAssignedInstructorCount(idx, session.round)}명`,
      dateKey: dateKey ?? undefined,
      slotKey,
      disabled,
    }
  })
}

function findApplicantInstructorByName(
  programId: string,
  instructorName: string
): ApplicantInstructorRow | undefined {
  return getApplicantInstructorsByProgramId(programId).find(
    row => row.instructorName === instructorName
  )
}

/** 배정 대기 강사가 프로그램 단위 승인을 받았는지 (선택 배정 플로우 분기) */
export function isWaitingInstructorProgramApproved(
  instructorName: string,
  participatingInstructor: ParticipatingInstructorRow | undefined,
  programId: string
): boolean {
  if (participatingInstructor?.initialApproval === false) return false
  const applicant = findApplicantInstructorByName(programId, instructorName)
  if (applicant) return applicant.approvalStatus === 'approved'
  return participatingInstructor?.initialApproval ?? true
}

export function resolveWaitingInstructorFeeGradeLabel(
  instructorName: string,
  participatingInstructor: ParticipatingInstructorRow | undefined,
  programId: string
): string | undefined {
  const applicant = findApplicantInstructorByName(programId, instructorName)
  return (
    applicant?.instructorFeeGradeLabel ?? participatingInstructor?.instructorFeeGradeLabel
  )
}
