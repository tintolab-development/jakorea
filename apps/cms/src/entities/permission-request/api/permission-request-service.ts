/**
 * 권한 요청 API 서비스 (Mock)
 * Phase 0.5.2: 권한 요청 UX
 */

import type {
  PermissionRequest,
  CreatePermissionRequestInput,
  ReviewPermissionRequestInput,
  TemporaryPermission,
} from '@/types/permission-request'
import { mockPermissionRequests, mockTemporaryPermissions } from '@/data/mock/permission-requests'
import { useAuthStore } from '@/features/auth/model/auth-store'

// Mock: 메모리 기반 저장소
const requests: PermissionRequest[] = [...mockPermissionRequests]
const temporaryPermissions: TemporaryPermission[] = [...mockTemporaryPermissions]

/**
 * 권한 요청 목록 조회
 */
export async function getPermissionRequests(filters?: {
  status?: PermissionRequest['status']
  requesterId?: string
}): Promise<PermissionRequest[]> {
  await new Promise(resolve => setTimeout(resolve, 300))

  let filtered = [...requests]

  if (filters?.status) {
    filtered = filtered.filter(r => r.status === filters.status)
  }

  if (filters?.requesterId) {
    filtered = filtered.filter(r => r.requesterId === filters.requesterId)
  }

  return filtered.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

/**
 * 권한 요청 생성
 */
export async function createPermissionRequest(
  input: CreatePermissionRequestInput
): Promise<PermissionRequest> {
  await new Promise(resolve => setTimeout(resolve, 500))

  const { user } = useAuthStore.getState()
  if (!user) {
    throw new Error('로그인이 필요합니다.')
  }

  // 프로그램 정보 조회 (Mock)
  const { mockPrograms } = await import('@/data/mock/programs')
  const program = mockPrograms.find(p => p.id === input.programId)
  if (!program) {
    throw new Error('프로그램을 찾을 수 없습니다.')
  }

  const newRequest: PermissionRequest = {
    id: `perm-req-${Date.now()}`,
    requesterId: user.id,
    requesterName: user.name,
    programId: input.programId,
    programName: program.title,
    requestedRole: input.requestedRole,
    requestedAction: input.requestedAction,
    reason: input.reason,
    requestedPeriod: input.requestedPeriod,
    status: 'PENDING',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  requests.push(newRequest)
  return newRequest
}

/**
 * 권한 요청 검토 (승인/거부)
 */
export async function reviewPermissionRequest(
  input: ReviewPermissionRequestInput
): Promise<{ request: PermissionRequest; temporaryPermission?: TemporaryPermission }> {
  await new Promise(resolve => setTimeout(resolve, 500))

  const { user } = useAuthStore.getState()
  if (!user) {
    throw new Error('로그인이 필요합니다.')
  }

  const requestIndex = requests.findIndex(r => r.id === input.requestId)
  if (requestIndex === -1) {
    throw new Error('권한 요청을 찾을 수 없습니다.')
  }

  const request = requests[requestIndex]
  if (request.status !== 'PENDING') {
    throw new Error('이미 처리된 요청입니다.')
  }

  // 요청 상태 업데이트
  const updatedRequest: PermissionRequest = {
    ...request,
    status: input.approved ? 'APPROVED' : 'REJECTED',
    reviewedBy: user.id,
    reviewedByName: user.name,
    reviewedAt: new Date().toISOString(),
    reviewComment: input.reviewComment,
    updatedAt: new Date().toISOString(),
  }

  requests[requestIndex] = updatedRequest

  // 승인 시 임시 권한 생성
  let temporaryPermission: TemporaryPermission | undefined

  if (input.approved) {
    const { mockPrograms } = await import('@/data/mock/programs')
    const program = mockPrograms.find(p => p.id === request.programId)
    
    const period = input.grantedPeriod || request.requestedPeriod || {
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30일 후
    }

    temporaryPermission = {
      id: `temp-perm-${Date.now()}`,
      userId: request.requesterId,
      userName: request.requesterName,
      programId: request.programId,
      programName: program?.title || request.programName,
      grantedRole: request.requestedRole,
      grantedActions: [request.requestedAction],
      expiresAt: period.endDate,
      grantedBy: user.id,
      grantedByName: user.name,
      grantedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    temporaryPermissions.push(temporaryPermission)
  }

  return { request: updatedRequest, temporaryPermission }
}

/**
 * 임시 권한 목록 조회
 */
export async function getTemporaryPermissions(filters?: {
  userId?: string
  programId?: string
  activeOnly?: boolean
}): Promise<TemporaryPermission[]> {
  await new Promise(resolve => setTimeout(resolve, 200))

  let filtered = [...temporaryPermissions]

  if (filters?.userId) {
    filtered = filtered.filter(p => p.userId === filters.userId)
  }

  if (filters?.programId) {
    filtered = filtered.filter(p => p.programId === filters.programId)
  }

  if (filters?.activeOnly) {
    const now = new Date()
    filtered = filtered.filter(p => new Date(p.expiresAt) > now)
  }

  return filtered.sort((a, b) => 
    new Date(b.grantedAt).getTime() - new Date(a.grantedAt).getTime()
  )
}

/**
 * 특정 사용자의 프로그램 접근 권한 확인
 */
export async function checkPermission(
  userId: string,
  programId: string,
  action: PermissionRequest['requestedAction']
): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 100))

  // 활성 임시 권한 확인
  const activePermissions = temporaryPermissions.filter(p => {
    const isExpired = new Date(p.expiresAt) <= new Date()
    return !isExpired && 
           p.userId === userId && 
           p.programId === programId &&
           p.grantedActions.includes(action)
  })

  return activePermissions.length > 0
}
