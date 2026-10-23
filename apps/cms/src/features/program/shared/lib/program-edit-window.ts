/**
 * 프로그램 수정 가능 기간.
 * 공통 정보는 `businessEndDate`(도메인 `endDate`) 당일까지, 한국 시간 다음 날 00:00부터 불가.
 * 모집 일반 정보는 그 모집행의 `startAt` 전. 같은 유형의 다른 행이 시작해도 아직 시작하지 않은 행은 연다.
 * 신청양식은 유형별 `startAt`. `startAt`이 없으면 아직 시작 전이다.
 */

import type { Program, ProgramRecruitmentWindow } from '@/types/domain'
import { PROGRAM_APPLICATION_FORM_EDIT_PERIOD_ENDED_MESSAGE } from '@/shared/lib/program-edit-window-error-message'

export type ProgramRecruitmentEditType = 'PARTICIPANT' | 'INSTRUCTOR' | 'VOLUNTEER'

const MINUTE_MS = 60_000
const SEOUL_TIME_ZONE = 'Asia/Seoul'

export function toProgramRecruitmentWindows(
  recruitments:
    | Array<{
        id?: number | null
        recruitmentType?: string
        targetType?: string
        applicationType?: string | null
        recruitTerm?: string | null
        startAt?: string | null
        endAt?: string | null
        operationStartDate?: string | null
        operationEndDate?: string | null
        programDescription?: string | null
        recruitmentGuide?: string | null
        applicationMethod?: string | null
        learningSupportContent?: string | null
        additionalContentHtml?: string | null
        remarks?: string | null
        otherMatters?: string | null
        announcementTitle?: string | null
        summary?: string | null
        contactName?: string | null
        contactPhone?: string | null
        contactEmail?: string | null
        interviewEnabled?: boolean | null
        interviewStartAt?: string | null
        interviewEndAt?: string | null
        thumbnailFileObjectId?: number | null
        attachments?: Array<{
          attachmentId?: number
          fileObjectId?: number
          originalFileName?: string | null
          displayOrder?: number
        }> | null
        applicationFormBindingId?: number | null
      }>
    | null
    | undefined
): ProgramRecruitmentWindow[] | undefined {
  if (!recruitments?.length) return undefined
  return recruitments.map(row => ({
    ...(row.id != null ? { id: row.id } : {}),
    recruitmentType: row.recruitmentType,
    targetType: row.targetType,
    ...(row.applicationType ? { applicationType: row.applicationType } : {}),
    ...(row.recruitTerm === 'FIRST_HALF' || row.recruitTerm === 'SECOND_HALF'
      ? { recruitTerm: row.recruitTerm }
      : {}),
    startAt: row.startAt ?? null,
    endAt: row.endAt ?? null,
    operationStartDate: row.operationStartDate ?? null,
    operationEndDate: row.operationEndDate ?? null,
    announcementTitle: row.announcementTitle ?? null,
    summary: row.summary ?? null,
    contactName: row.contactName ?? null,
    contactPhone: row.contactPhone ?? null,
    contactEmail: row.contactEmail ?? null,
    interviewEnabled: row.interviewEnabled ?? null,
    interviewStartAt: row.interviewStartAt ?? null,
    interviewEndAt: row.interviewEndAt ?? null,
    thumbnailFileObjectId: row.thumbnailFileObjectId ?? null,
    attachments: (row.attachments ?? []).map(item => ({
      attachmentId: item.attachmentId,
      fileObjectId: item.fileObjectId,
      originalFileName: item.originalFileName ?? null,
      displayOrder: item.displayOrder,
    })),
    applicationFormBindingId: row.applicationFormBindingId ?? null,
    programDescription: row.programDescription ?? null,
    recruitmentGuide: row.recruitmentGuide ?? null,
    applicationMethod: row.applicationMethod ?? null,
    learningSupportContent: row.learningSupportContent ?? null,
    additionalContentHtml: row.additionalContentHtml ?? null,
    remarks: row.remarks ?? null,
    otherMatters: row.otherMatters ?? null,
  }))
}

function seoulCalendarDate(value: string | Date): string | null {
  if (typeof value === 'string') {
    const dateOnly = value.trim().match(/^(\d{4}-\d{2}-\d{2})$/)
    if (dateOnly) return dateOnly[1]
  }
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return null
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SEOUL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)
  const year = parts.find(part => part.type === 'year')?.value
  const month = parts.find(part => part.type === 'month')?.value
  const day = parts.find(part => part.type === 'day')?.value
  if (!year || !month || !day) return null
  return `${year}-${month}-${day}`
}

/** 사업 종료일 당일(Asia/Seoul)까지 공통 정보 저장 가능. 종료일이 없으면 막지 않는다. */
export function isCommonInfoEditPeriodOpen(
  businessEndDate: string | Date | null | undefined,
  now: Date = new Date()
): boolean {
  if (businessEndDate == null) return true
  if (typeof businessEndDate === 'string' && !businessEndDate.trim()) return true
  const endKey = seoulCalendarDate(businessEndDate)
  const todayKey = seoulCalendarDate(now)
  if (!endKey || !todayKey) return true
  return todayKey <= endKey
}

/** `startAt`이 속한 분부터 잠금. null·빈 값·파싱 실패는 잠그지 않는다. */
export function isRecruitmentStartLocked(
  startAt: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (startAt == null || !startAt.trim()) return false
  const startMs = Date.parse(startAt)
  if (Number.isNaN(startMs)) return false
  return Math.floor(now.getTime() / MINUTE_MS) >= Math.floor(startMs / MINUTE_MS)
}

export type ProgramTypeSettingsNext = {
  educationStructure?: string | null
  sessionRound?: string | null
  participationMethod?: string | null
  participationScheduleDetail?: string | null
}

function parseRecruitmentStartMs(startAt: string | null | undefined): number | null {
  if (startAt == null || !startAt.trim()) return null
  const ms = Date.parse(startAt)
  return Number.isNaN(ms) ? null : ms
}

/** 저장된 모집 행 중 가장 빠른 `startAt`. id 없거나 파싱 실패인 행은 제외. */
export function getEarliestPersistedRecruitmentStartAt(
  program: Program | null | undefined
): string | null {
  let earliestMs: number | null = null
  let earliest: string | null = null
  for (const row of program?.programRecruitments ?? []) {
    if (row.id == null) continue
    const startAt = row.startAt
    const ms = parseRecruitmentStartMs(startAt)
    if (ms == null || startAt == null) continue
    if (earliestMs == null || ms < earliestMs) {
      earliestMs = ms
      earliest = startAt
    }
  }
  return earliest
}

/** 가장 빠른 기존 모집 시작 시각 전까지만 프로그램 구조(유형·회차·참여 방식) 수정 가능. */
export function isProgramStructureEditPeriodOpen(
  program: Program | null | undefined,
  now: Date = new Date()
): boolean {
  const startAt = getEarliestPersistedRecruitmentStartAt(program)
  if (startAt == null) return true
  return !isRecruitmentStartLocked(startAt, now)
}

function normalizeEducationStructure(
  value: string | null | undefined
): 'curriculum' | 'schedule' | null {
  if (value === 'schedule') return 'schedule'
  if (value === 'curriculum') return 'curriculum'
  return null
}

function normalizeSessionRound(value: string | null | undefined): 'single' | 'multi' | null {
  if (value === 'multi') return 'multi'
  if (value === 'single') return 'single'
  return null
}

function normalizeParticipationMethod(
  value: string | null | undefined
): 'individual' | 'team' | null {
  if (value === 'team') return 'team'
  if (value === 'individual') return 'individual'
  return null
}

function normalizeParticipationScheduleDetail(
  value: string | null | undefined
): 'common' | 'perSchedule' | null {
  if (value === 'perSchedule') return 'perSchedule'
  if (value === 'common') return 'common'
  return null
}

export function isProgramTypeSettingsChanged(
  existing:
    | Pick<
        Program,
        'generalProgramEducationStructure' | 'generalProgramSessionRound' | 'generalCommonInfo'
      >
    | null
    | undefined,
  next: ProgramTypeSettingsNext
): boolean {
  const nextStructure = normalizeEducationStructure(next.educationStructure)
  if (nextStructure != null) {
    const existingStructure =
      normalizeEducationStructure(existing?.generalProgramEducationStructure) ?? 'curriculum'
    if (existingStructure !== nextStructure) return true
  }
  const nextRound = normalizeSessionRound(next.sessionRound)
  if (nextRound != null) {
    const existingRound = normalizeSessionRound(existing?.generalProgramSessionRound) ?? 'single'
    if (existingRound !== nextRound) return true
  }
  const nextMethod = normalizeParticipationMethod(next.participationMethod)
  if (nextMethod != null) {
    const existingMethod =
      normalizeParticipationMethod(existing?.generalCommonInfo?.participationMethod) ?? 'individual'
    if (existingMethod !== nextMethod) return true
  }
  const nextScheduleDetail = normalizeParticipationScheduleDetail(next.participationScheduleDetail)
  if (nextScheduleDetail != null) {
    const existingScheduleDetail =
      normalizeParticipationScheduleDetail(
        existing?.generalCommonInfo?.participationScheduleDetail
      ) ?? 'common'
    if (existingScheduleDetail !== nextScheduleDetail) return true
  }
  return false
}

export function isProgramTypeSettingsSaveBlocked(
  program: Program | null | undefined,
  next: ProgramTypeSettingsNext,
  now: Date = new Date()
): boolean {
  if (!program) return false
  if (!isProgramTypeSettingsChanged(program, next)) return false
  return !isProgramStructureEditPeriodOpen(program, now)
}

/**
 * 저장된 모집행이 모두 모집 시작 시각을 지났으면 그 유형의 일반 정보 수정을 닫는다.
 * id 없는 행과 시작 전 행이 하나라도 있으면 닫지 않는다.
 */
export function isRecruitmentTypeGeneralInfoClosed(
  program: Program | null | undefined,
  recruitmentType: ProgramRecruitmentEditType,
  now: Date = new Date()
): boolean {
  const rows = (program?.programRecruitments ?? []).filter(
    row => row.recruitmentType === recruitmentType && row.id != null
  )
  if (rows.length === 0) return false
  return rows.every(row => isRecruitmentStartLocked(row.startAt, now))
}

export function isProgramRecruitmentTypeLocked(
  program: Program | null | undefined,
  recruitmentType: ProgramRecruitmentEditType,
  now: Date = new Date()
): boolean {
  const rows = (program?.programRecruitments ?? []).filter(
    row => row.recruitmentType === recruitmentType
  )
  if (rows.length === 0) return false
  return rows.some(row => isRecruitmentStartLocked(row.startAt, now))
}

/**
 * 모집정보 — 운영 시작일(서울 달력) 당일부터 잠금. 날짜가 없으면 잠그지 않는다.
 */
export function isOperationStartDateLocked(
  operationStartDate: string | null | undefined,
  now: Date = new Date()
): boolean {
  if (operationStartDate == null || !operationStartDate.trim()) return false
  const startKey = seoulCalendarDate(operationStartDate)
  const todayKey = seoulCalendarDate(now)
  if (!startKey || !todayKey) return false
  return todayKey >= startKey
}

export function isProgramOperationStartLocked(
  program: Program | null | undefined,
  recruitmentType: ProgramRecruitmentEditType,
  now: Date = new Date()
): boolean {
  const rows = (program?.programRecruitments ?? []).filter(
    row => row.recruitmentType === recruitmentType
  )
  if (rows.length === 0) return false
  return rows.some(row => isOperationStartDateLocked(row.operationStartDate, now))
}

export function recruitmentEditTypeForDetailTab(
  tab: 'institutions' | 'instructors' | 'volunteers'
): ProgramRecruitmentEditType {
  if (tab === 'instructors') return 'INSTRUCTOR'
  if (tab === 'volunteers') return 'VOLUNTEER'
  return 'PARTICIPANT'
}

/**
 * form-binding `targetType` / `targetRole` → 모집 유형.
 * 요청에 값이 있으면 그 값, 없으면 저장된 바인딩 값으로 잠근다.
 */
export function resolveRecruitmentTypeForFormBinding(
  targetType?: string | null,
  targetRole?: string | null
): ProgramRecruitmentEditType | null {
  const raw = (targetType?.trim() || targetRole?.trim() || '').toUpperCase()
  if (!raw) return null
  if (
    raw === 'PARTICIPANT' ||
    raw === 'ORGANIZATION' ||
    raw === 'INDIVIDUAL' ||
    raw === 'SCHOOL' ||
    raw === 'BOTH'
  ) {
    return 'PARTICIPANT'
  }
  if (raw === 'INSTRUCTOR' || raw === 'TEACHER') return 'INSTRUCTOR'
  if (raw === 'VOLUNTEER' || raw === 'COLLEGE_STUDENT' || raw === 'STUDENT') return 'VOLUNTEER'
  return null
}

export function isProgramFormBindingWriteLocked(
  program: Program | null | undefined,
  targetType?: string | null,
  targetRole?: string | null,
  now: Date = new Date()
): boolean {
  const recruitmentType = resolveRecruitmentTypeForFormBinding(targetType, targetRole)
  if (!recruitmentType) return false
  return isProgramRecruitmentTypeLocked(program, recruitmentType, now)
}

export function assertProgramFormBindingWritable(
  program: Program,
  targetType?: string | null,
  targetRole?: string | null,
  now: Date = new Date()
): void {
  if (!isProgramFormBindingWriteLocked(program, targetType, targetRole, now)) return
  throw new Error(PROGRAM_APPLICATION_FORM_EDIT_PERIOD_ENDED_MESSAGE)
}
