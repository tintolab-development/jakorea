/**
 * 권한 요청 Mock 데이터
 * Phase 0.5.2: 권한 요청 UX
 */

import type { PermissionRequest, TemporaryPermission } from '@/types/permission-request'
import type { UUID, DateValue } from '@/types'
import { mockPrograms } from './programs'
import { mockUsers } from './users'

function generateUUID(): string {
  return `perm-req-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`
}

function generatePastDate(daysAgo: number = 0): string {
  const date = new Date()
  date.setDate(date.getDate() - daysAgo)
  return date.toISOString()
}

function generateFutureDate(daysAhead: number): string {
  const date = new Date()
  date.setDate(date.getDate() + daysAhead)
  return date.toISOString()
}

// 관리자 사용자 (마스터)
const masterUser = mockUsers.find(u => u.role === 'ADMIN' && u.adminRole === 'MASTER')
const adminUsers = mockUsers.filter(u => u.role === 'ADMIN' && u.adminRole !== 'MASTER')

// 일반 관리자 사용자 (권한 요청자)
const requesterUsers = adminUsers.filter(u => u.adminRole === 'GENERAL' || u.adminProgramRole === 'ASSISTANT')

// 프로그램 선택
const selectedPrograms = mockPrograms.slice(0, 5)

/**
 * 권한 요청 Mock 데이터 생성
 */
function createPermissionRequests(): PermissionRequest[] {
  const requests: PermissionRequest[] = []
  const statuses: PermissionRequest['status'][] = ['PENDING', 'APPROVED', 'REJECTED']
  const actions: PermissionRequest['requestedAction'][] = ['VIEW', 'DOWNLOAD', 'EDIT']
  const roles: PermissionRequest['requestedRole'][] = ['OWNER', 'PARTNER', 'ASSISTANT']

  requesterUsers.forEach((requester, index) => {
    const program = selectedPrograms[index % selectedPrograms.length]
    const status = statuses[index % statuses.length]
    const action = actions[index % actions.length]
    const role = roles[index % roles.length]
    
    const daysAgo = Math.floor(Math.random() * 30) + 1
    const createdAt = generatePastDate(daysAgo)
    
    let reviewedBy: UUID | undefined
    let reviewedByName: string | undefined
    let reviewedAt: DateValue | undefined
    let reviewComment: string | undefined

    if (status !== 'PENDING') {
      reviewedBy = masterUser?.id
      reviewedByName = masterUser?.name
      reviewedAt = generatePastDate(daysAgo - Math.floor(Math.random() * 5))
      reviewComment = status === 'APPROVED' 
        ? '임시 권한 부여 승인' 
        : '권한 요청 거부'
    }

    const hasPeriod = Math.random() > 0.5
    const requestedPeriod = hasPeriod ? {
      startDate: generatePastDate(Math.floor(Math.random() * 10)),
      endDate: generateFutureDate(Math.floor(Math.random() * 30) + 10),
    } : undefined

    requests.push({
      id: generateUUID(),
      requesterId: requester.id,
      requesterName: requester.name,
      programId: program.id,
      programName: program.title,
      requestedRole: role,
      requestedAction: action,
      reason: `${program.title} 프로그램에 대한 ${action} 권한이 필요합니다.`,
      requestedPeriod,
      status,
      reviewedBy,
      reviewedByName,
      reviewedAt,
      reviewComment,
      createdAt,
      updatedAt: status !== 'PENDING' ? reviewedAt || createdAt : createdAt,
    })
  })

  return requests
}

/**
 * 임시 권한 Mock 데이터 생성
 */
function createTemporaryPermissions(): TemporaryPermission[] {
  const permissions: TemporaryPermission[] = []
  const approvedRequests = mockPermissionRequests.filter(r => r.status === 'APPROVED')

  approvedRequests.forEach((request) => {
    const daysAhead = Math.floor(Math.random() * 30) + 7
    const expiresAt = generateFutureDate(daysAhead)
    const grantedAt = request.reviewedAt || request.createdAt

    permissions.push({
      id: generateUUID(),
      userId: request.requesterId,
      userName: request.requesterName,
      programId: request.programId,
      programName: request.programName,
      grantedRole: request.requestedRole,
      grantedActions: [request.requestedAction],
      expiresAt,
      grantedBy: request.reviewedBy || masterUser?.id || '',
      grantedByName: request.reviewedByName || masterUser?.name || '시스템',
      grantedAt,
      createdAt: grantedAt,
      updatedAt: grantedAt,
    })
  })

  return permissions
}

export const mockPermissionRequests: PermissionRequest[] = createPermissionRequests()
export const mockTemporaryPermissions: TemporaryPermission[] = createTemporaryPermissions()
