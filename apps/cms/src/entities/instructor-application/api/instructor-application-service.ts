/**
 * 강사 신청 서비스
 * Phase 4.3: 강의 신청 관리 (FR-F02)
 */

import type { UUID } from '@/types'
import type { Application } from '@/types/domain'
import { mockApplications, mockApplicationsMap } from '@/data/mock'
import { mockInstructors } from '@/data/mock/instructors'
import { mockPrograms } from '@/data/mock/programs'
import { mockInstructorUsers } from '@/data/mock/instructor-users'
import { mockUsers } from '@/data/mock/users'
import { applicationService } from '@/entities/application/api/application-service'

export interface InstructorApplicationItem {
  id: string
  instructorName: string
  instructorId: string
  programName: string
  programId: string
  appliedAt: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLOSED'
  preferredSchedule?: string[]
  notes?: string
}

export interface InstructorApplicationFilters {
  programId?: UUID
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLOSED' | 'ALL'
  instructorId?: UUID
}

/**
 * Application 상태를 InstructorApplication 상태로 변환
 */
function mapApplicationStatusToInstructorStatus(
  status: Application['status']
): 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLOSED' {
  switch (status) {
    case 'submitted':
    case 'reviewing':
      return 'PENDING'
    case 'approved':
      return 'APPROVED'
    case 'rejected':
      return 'REJECTED'
    case 'cancelled':
      return 'CLOSED'
    default:
      return 'PENDING'
  }
}

/**
 * 강사 신청 목록 조회
 */
export async function getInstructorApplications(
  filters?: InstructorApplicationFilters
): Promise<InstructorApplicationItem[]> {
  await new Promise(resolve => setTimeout(resolve, 300))

  // 강사 신청만 필터링 (subjectType === 'instructor')
  let applications = mockApplications.filter(
    app => app.subjectType === 'instructor'
  )

  // 필터 적용
  if (filters?.programId) {
    applications = applications.filter(app => app.programId === filters.programId)
  }

  if (filters?.instructorId) {
    applications = applications.filter(app => app.subjectId === filters.instructorId)
  }

  if (filters?.status && filters.status !== 'ALL') {
    const targetStatuses: Application['status'][] = []
    switch (filters.status) {
      case 'PENDING':
        targetStatuses.push('submitted', 'reviewing')
        break
      case 'APPROVED':
        targetStatuses.push('approved')
        break
      case 'REJECTED':
        targetStatuses.push('rejected')
        break
      case 'CLOSED':
        targetStatuses.push('cancelled')
        break
    }
    applications = applications.filter(app => targetStatuses.includes(app.status))
  }

  // InstructorApplicationItem로 변환
  return applications.map(app => {
    const instructor = mockInstructors.find(inst => inst.id === app.subjectId)
    const program = mockPrograms.find(prog => prog.id === app.programId)
    const user = mockInstructorUsers.find(u => u.instructorId === app.subjectId) ||
                 mockUsers.find(u => u.instructorId === app.subjectId)

    return {
      id: app.id,
      instructorName: instructor?.name || user?.name || '알 수 없음',
      instructorId: app.subjectId,
      programName: program?.title || '알 수 없음',
      programId: app.programId,
      appliedAt: typeof app.submittedAt === 'string' ? app.submittedAt : app.submittedAt.toISOString(),
      status: mapApplicationStatusToInstructorStatus(app.status),
      preferredSchedule: [], // TODO: 실제 일정 정보 연결
      notes: app.notes,
    }
  })
}

/**
 * Phase 0.3.3: 강사 신청 승인/마감 처리
 */
export async function reviewInstructorApplication(
  applicationId: UUID,
  action: 'APPROVE' | 'REJECT' | 'CLOSE',
  reason?: string
): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 500))

  const application = mockApplications.find(app => app.id === applicationId)
  if (!application) {
    throw new Error('신청을 찾을 수 없습니다.')
  }

  // Phase 0.3.3: application-service.updateStatus 사용 (progressStatus, appendReceivedLog 등 자동 처리)
  switch (action) {
    case 'APPROVE':
      await applicationService.updateStatus(applicationId, 'approved')
      break
    case 'REJECT':
      await applicationService.updateStatus(applicationId, 'rejected', reason)
      break
    case 'CLOSE':
      await applicationService.updateStatus(applicationId, 'cancelled')
      break
  }
}

/**
 * 추가 배정 (관리자 직접 입력)
 * Task 3.3.1: 검증 로직 및 중복 배정 방지
 */
export interface ManualAssignmentData {
  programId: UUID
  instructorId?: UUID // 기존 강사 선택
  newInstructor?: {
    name: string
    phone: string
    email: string
  }
  scheduleIds: UUID[]
  assignedBy: UUID
  notes?: string
}

export interface ManualAssignmentValidation {
  valid: boolean
  error?: string
}

/**
 * 수동 배정 검증: 중복 배정 방지
 * 동일 강사가 같은 프로그램에 대해 이미 승인된 강사 신청이 있으면 중복
 */
export function validateManualAssignment(
  data: ManualAssignmentData
): ManualAssignmentValidation {
  if (!data.instructorId) {
    return { valid: true }
  }
  const duplicate = mockApplications.find(
    a =>
      a.subjectType === 'instructor' &&
      a.subjectId === data.instructorId &&
      a.programId === data.programId &&
      a.status === 'approved'
  )
  if (duplicate) {
    return {
      valid: false,
      error: '이미 해당 프로그램에 배정된 강사입니다. 중복 배정할 수 없습니다.',
    }
  }
  return { valid: true }
}

export async function createManualAssignment(
  data: ManualAssignmentData
): Promise<Application> {
  const validation = validateManualAssignment(data)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  await new Promise(resolve => setTimeout(resolve, 500))

  const subjectId = data.instructorId || `instructor-new-${Date.now()}`
  const newApplication: Application = {
    id: `app-manual-${Date.now()}`,
    programId: data.programId,
    subjectType: 'instructor',
    subjectId,
    status: 'approved',
    notes: data.notes || '관리자 직접 배정',
    submittedAt: new Date().toISOString(),
    reviewedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  mockApplications.push(newApplication)
  mockApplicationsMap.set(newApplication.id, newApplication)

  return newApplication
}
