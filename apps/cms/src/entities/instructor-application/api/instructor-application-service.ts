/**
 * 강사 신청 서비스
 * Phase 4.3: 강의 신청 관리 (FR-F02)
 */

import type { UUID } from '@/types'
import type { Application } from '@/types/domain'
import { applicationService } from '@/entities/application/api/application-service'
import { programService } from '@/entities/program/api/program-service'

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

function toInstructorApplicationItem(app: Application): InstructorApplicationItem {
  const program = programService.getByIdSync(app.programId)
  return {
    id: app.id,
    instructorName: '알 수 없음',
    instructorId: app.subjectId,
    programName: program?.title || '알 수 없음',
    programId: app.programId,
    appliedAt:
      typeof app.submittedAt === 'string' ? app.submittedAt : app.submittedAt.toISOString(),
    status: mapApplicationStatusToInstructorStatus(app.status),
    preferredSchedule: [],
    notes: app.notes,
  }
}

export async function getInstructorApplications(
  filters?: InstructorApplicationFilters
): Promise<InstructorApplicationItem[]> {
  await new Promise(resolve => setTimeout(resolve, 300))

  let applications = applicationService
    .getAllSync()
    .filter(app => app.subjectType === 'instructor')

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

  return applications.map(toInstructorApplicationItem)
}

export async function reviewInstructorApplication(
  applicationId: UUID,
  action: 'APPROVE' | 'REJECT' | 'CLOSE',
  reason?: string
): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 500))

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

export interface ManualAssignmentData {
  programId: UUID
  instructorId?: UUID
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

export function validateManualAssignment(data: ManualAssignmentData): ManualAssignmentValidation {
  if (!data.programId || data.programId.trim().length === 0) {
    return { valid: false, error: '프로그램을 선택해주세요.' }
  }

  if (!data.assignedBy || data.assignedBy.trim().length === 0) {
    return { valid: false, error: '배정자 정보가 없습니다.' }
  }

  if (!data.instructorId && !data.newInstructor) {
    return { valid: false, error: '기존 강사를 선택하거나 신규 강사 정보를 입력해주세요.' }
  }

  if (data.instructorId) {
    const duplicate = applicationService
      .getAllSync()
      .find(
        a =>
          a.subjectType === 'instructor' &&
          a.subjectId === data.instructorId &&
          a.programId === data.programId &&
          a.status === 'approved'
      )
    if (duplicate) {
      return { valid: false, error: '이미 해당 프로그램에 배정된 강사입니다. 중복 배정할 수 없습니다.' }
    }
  }

  if (data.newInstructor) {
    if (!data.newInstructor.name?.trim()) {
      return { valid: false, error: '신규 강사 이름을 입력해주세요.' }
    }
    if (!data.newInstructor.phone?.trim()) {
      return { valid: false, error: '신규 강사 전화번호를 입력해주세요.' }
    }
    if (!data.newInstructor.email?.trim()) {
      return { valid: false, error: '신규 강사 이메일을 입력해주세요.' }
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.newInstructor.email)) {
      return { valid: false, error: '올바른 이메일 형식이 아닙니다.' }
    }
  }

  return { valid: true }
}

export async function createManualAssignment(data: ManualAssignmentData): Promise<Application> {
  const validation = validateManualAssignment(data)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  await new Promise(resolve => setTimeout(resolve, 500))

  const subjectId = data.instructorId || `instructor-new-${Date.now()}`
  return applicationService.create({
    programId: data.programId,
    subjectType: 'instructor',
    subjectId,
    status: 'approved',
    notes: data.notes || '관리자 직접 배정',
    roundId: '',
  })
}
