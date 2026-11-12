/**
 * 참여 기관 상세 — 강사 추가 배정 모달용 옵션·일정 비활성 판별
 */

import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { ParticipatingInstructorRow } from '@/features/program/general/model/participating-instructors'
import type {
  ParticipatingSchoolRow,
  ParticipatingSchoolSession,
} from '@/features/program/general/model/participating-schools'
import type { InstructorAssignSessionOption } from './instructor-assign-session-options'
import {
  resolveAssignmentRoundSessionLabel,
  resolveInstructorAssignSessionDisplayLabels,
} from './instructor-assign-session-options'

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
  applicantInstructors: readonly ApplicantInstructorRow[]
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

/** 해당 프로그램에 승인된 강사만 선택 목록에 노출 (학교 신청 단위 아님) */
export function buildProgramApprovedInstructorAssignOptions(
  instructors: readonly ApplicantInstructorRow[],
  assignedInstructorNames: Iterable<string>
): SchoolAddInstructorAssignOption[] {
  const assignedNames = new Set(assignedInstructorNames)
  return instructors
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
  schoolId: string
  schoolName: string
  sessions: ParticipatingSchoolSession[] | undefined | null
  selectedInstructorId?: string
  applicantInstructors?: readonly ApplicantInstructorRow[]
  participatingInstructorList: ParticipatingInstructorRow[]
  participatingSchoolList?: ParticipatingSchoolRow[]
  /** 칩 순위 라벨. 기본 `N회차` — 1사1교는 회차 대신 지망({@link resolveAssignmentRoundSessionLabel} 대체) */
  resolveSessionRoundLabel?: (session: ParticipatingSchoolSession) => string
}): InstructorAssignSessionOption[] {
  const {
    schoolId,
    schoolName,
    sessions,
    selectedInstructorId,
    applicantInstructors = [],
    participatingInstructorList,
    participatingSchoolList = [],
    resolveSessionRoundLabel = resolveAssignmentRoundSessionLabel,
  } = params

  if (!sessions?.length) return []

  return sessions.map(session => {
    const { dateLabel, timeLabel, scheduleLabel } =
      resolveInstructorAssignSessionDisplayLabels(session)
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
      dateLabel: dateLabel || undefined,
      timeLabel,
      scheduleLabel,
      sessionRoundLabel: resolveSessionRoundLabel(session),
      capacityLabel: '0명',
      dateKey: dateKey ?? undefined,
      slotKey,
      disabled,
    }
  })
}

function findApplicantInstructorByName(
  instructors: readonly ApplicantInstructorRow[],
  instructorName: string
): ApplicantInstructorRow | undefined {
  return instructors.find(row => row.instructorName === instructorName)
}

/** 배정 대기 강사가 프로그램 단위 승인을 받았는지 (선택 배정 플로우 분기) */
export function isWaitingInstructorProgramApproved(
  instructorName: string,
  participatingInstructor: ParticipatingInstructorRow | undefined,
  instructors: readonly ApplicantInstructorRow[] = []
): boolean {
  if (participatingInstructor?.initialApproval === false) return false
  const applicant = findApplicantInstructorByName(instructors, instructorName)
  if (applicant) return applicant.approvalStatus === 'approved'
  return participatingInstructor?.initialApproval ?? true
}

export function resolveWaitingInstructorFeeGradeLabel(
  instructorName: string,
  participatingInstructor: ParticipatingInstructorRow | undefined,
  instructors: readonly ApplicantInstructorRow[] = []
): string | undefined {
  const applicant = findApplicantInstructorByName(instructors, instructorName)
  return (
    applicant?.instructorFeeGradeLabel ?? participatingInstructor?.instructorFeeGradeLabel
  )
}
