/**
 * 권한 검증 유틸리티 함수
 * Phase 0.1.1: 역할/권한 체계 재정의
 * requirements.md §2 역할 및 권한 기준
 */

import type { AdminLevel, ProgramRole, User, UserRole } from '@/types/user'

/**
 * 사용자가 특정 권한을 보유하고 있는지 확인
 * @param user 사용자 객체 (또는 null)
 * @param role 확인할 권한
 * @returns 권한 보유 여부
 */
export function hasRole(user: Omit<User, 'password'> | null, role: UserRole): boolean {
  if (!user) {
    return false
  }
  return user.role === role
}

/**
 * 사용자가 여러 권한 중 하나라도 보유하고 있는지 확인
 * @param user 사용자 객체 (또는 null)
 * @param roles 확인할 권한 배열
 * @returns 권한 보유 여부
 */
export function hasAnyRole(user: Omit<User, 'password'> | null, roles: UserRole[]): boolean {
  if (!user || roles.length === 0) {
    return false
  }
  return roles.includes(user.role)
}

/**
 * 사용자가 모든 권한을 보유하고 있는지 확인
 * @param user 사용자 객체 (또는 null)
 * @param roles 확인할 권한 배열
 * @returns 모든 권한 보유 여부
 */
export function hasAllRoles(user: Omit<User, 'password'> | null, roles: UserRole[]): boolean {
  if (!user || roles.length === 0) {
    return false
  }
  return roles.every(role => user.role === role)
}

/**
 * 사용자가 관리자 권한을 가지고 있는지 확인
 * @param user 사용자 객체 (또는 null)
 * @returns 관리자 여부
 */
export function isAdmin(user: Omit<User, 'password'> | null): boolean {
  return hasRole(user, 'ADMIN')
}

export function isMasterAdmin(user: Omit<User, 'password'> | null): boolean {
  return Boolean(user && user.role === 'ADMIN' && user.adminLevel === 'MASTER')
}

export function hasAdminLevel(
  user: Omit<User, 'password'> | null,
  adminLevel: AdminLevel
): boolean {
  return Boolean(user && user.role === 'ADMIN' && user.adminLevel === adminLevel)
}

/**
 * GENERAL 관리자인지 확인
 * Phase 0.5.2: GENERAL 관리자는 조회 기능만 가능
 */
export function isGeneralAdmin(user: Omit<User, 'password'> | null): boolean {
  return Boolean(user && user.role === 'ADMIN' && user.adminLevel === 'GENERAL')
}

/**
 * 쓰기 작업(create/update/delete)이 가능한 관리자인지 확인
 * GENERAL은 모든 쓰기 작업 금지
 * Phase 0.5.2: GENERAL 관리자 쓰기 작업 제한
 *
 * 규칙:
 * - MASTER: 모든 쓰기 작업 허용
 * - ADMIN: 모든 쓰기 작업 허용
 * - GENERAL: 모든 쓰기 작업 금지
 * - adminLevel이 undefined/null인 경우: 기본값으로 ADMIN으로 간주하여 허용 (하위 호환성)
 *
 * 디버깅: 개발 환경에서 권한 체크 실패 시 콘솔에 로그 출력
 */
export function canPerformWriteAction(user: Omit<User, 'password'> | null): boolean {
  if (!user) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[canPerformWriteAction] user가 null입니다')
    }
    return false
  }

  if (user.role !== 'ADMIN') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[canPerformWriteAction] 관리자가 아닙니다:', user.role)
    }
    return false
  }

  const adminLevel = user.adminLevel

  // GENERAL은 명시적으로 제한
  if (adminLevel === 'GENERAL') {
    if (process.env.NODE_ENV === 'development') {
      console.log('[canPerformWriteAction] GENERAL 관리자는 쓰기 작업 불가')
    }
    return false
  }

  // MASTER, ADMIN, 또는 undefined/null(기본값)인 경우 쓰기 권한 허용
  // undefined/null은 하위 호환성을 위해 ADMIN으로 간주
  const result = adminLevel === 'MASTER' || adminLevel === 'ADMIN' || !adminLevel

  if (process.env.NODE_ENV === 'development') {
    console.log('[canPerformWriteAction] 권한 체크 결과:', {
      role: user.role,
      adminLevel,
      result,
      userId: user.id,
      userName: user.name,
    })
  }

  return result
}

/**
 * 특정 관리자 레벨 이상의 권한이 있는지 확인
 * Phase 0.5.2: 관리자 레벨 계층 구조 기반 권한 체크
 */
export function hasAdminLevelOrAbove(
  user: Omit<User, 'password'> | null,
  minLevel: AdminLevel
): boolean {
  if (!user || user.role !== 'ADMIN') return false

  const levelHierarchy: Record<AdminLevel, number> = {
    MASTER: 3,
    ADMIN: 2,
    GENERAL: 1,
  }

  return (levelHierarchy[user.adminLevel || 'GENERAL'] || 0) >= levelHierarchy[minLevel]
}

export function hasProgramRole(
  user: Omit<User, 'password'> | null,
  programId: string,
  programRole: ProgramRole
): boolean {
  if (!user || user.role !== 'ADMIN') return false
  return user.programRoles?.[programId] === programRole
}

/**
 * 사용자가 강사 또는 개인(참여자) 권한을 가지고 있는지 확인
 * @param user 사용자 객체 (또는 null)
 * @returns 강사/개인 여부
 */
export function isInstructorOrIndividual(user: Omit<User, 'password'> | null): boolean {
  return hasAnyRole(user, ['INSTRUCTOR', 'INDIVIDUAL'])
}

/**
 * 사용자가 개인(참여자) 권한을 가지고 있는지 확인
 * @param user 사용자 객체 (또는 null)
 * @returns 개인(참여자) 여부
 */
export function isIndividual(user: Omit<User, 'password'> | null): boolean {
  return hasRole(user, 'INDIVIDUAL')
}

/**
 * 사용자가 학교 권한을 가지고 있는지 확인
 * @param user 사용자 객체 (또는 null)
 * @returns 학교 여부
 */
export function isSchool(user: Omit<User, 'password'> | null): boolean {
  return hasRole(user, 'SCHOOL')
}

/**
 * 권한 레벨 비교 (관리자 > 강사 > 수강자)
 * @param role1 첫 번째 권한
 * @param role2 두 번째 권한
 * @returns role1이 role2보다 높은 권한이면 true
 */
export function hasHigherRole(role1: UserRole, role2: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    ADMIN: 4,
    INSTRUCTOR: 3,
    SCHOOL: 2,
    INDIVIDUAL: 1,
  }

  return (roleHierarchy[role1] || 0) > (roleHierarchy[role2] || 0)
}

/**
 * 권한 레벨 비교 (같거나 높은 권한인지 확인)
 * @param role1 첫 번째 권한
 * @param role2 두 번째 권한
 * @returns role1이 role2보다 같거나 높은 권한이면 true
 */
export function hasEqualOrHigherRole(role1: UserRole, role2: UserRole): boolean {
  const roleHierarchy: Record<UserRole, number> = {
    ADMIN: 4,
    INSTRUCTOR: 3,
    SCHOOL: 2,
    INDIVIDUAL: 1,
  }

  return (roleHierarchy[role1] || 0) >= (roleHierarchy[role2] || 0)
}

/**
 * Phase 0.5: 서버사이드 권한 검증 시뮬레이션
 * 실제 백엔드에서는 서버에서 권한을 검증하지만, Mock 환경에서는 클라이언트에서 시뮬레이션
 */
export async function validatePermissionServerSide(
  userId: string,
  programId: string,
  action: 'VIEW' | 'DOWNLOAD' | 'EDIT'
): Promise<{ allowed: boolean; reason?: string }> {
  // Mock: 서버 검증 시뮬레이션 (지연 시간)
  await new Promise(resolve => setTimeout(resolve, 100))

  // 실제로는 백엔드에서 검증하지만, Mock에서는 클라이언트 로직 재사용
  const { checkPermissionSync } =
    await import('@/entities/permission-request/api/permission-request-service')
  const hasPermission = checkPermissionSync(userId, programId, action)

  if (hasPermission) {
    return { allowed: true }
  }

  return {
    allowed: false,
    reason: '프로그램 접근 권한이 없습니다. 권한 요청이 필요합니다.',
  }
}

/**
 * Phase 0.5: 권한 요청 승인/거부 Mock 플로우
 */
export interface PermissionRequestFlow {
  requestId: string
  requesterId: string
  programId: string
  action: 'VIEW' | 'DOWNLOAD' | 'EDIT'
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  reason?: string
}

// Mock: 권한 요청 플로우 저장소
const permissionRequestFlows: PermissionRequestFlow[] = []

/**
 * 권한 요청 플로우 생성
 */
export function createPermissionRequestFlow(
  requesterId: string,
  programId: string,
  action: 'VIEW' | 'DOWNLOAD' | 'EDIT'
): PermissionRequestFlow {
  const flow: PermissionRequestFlow = {
    requestId: `perm-flow-${Date.now()}`,
    requesterId,
    programId,
    action,
    status: 'PENDING',
  }
  permissionRequestFlows.push(flow)
  return flow
}

/**
 * 권한 요청 플로우 승인/거부
 */
export function reviewPermissionRequestFlow(
  requestId: string,
  approved: boolean,
  reason?: string
): PermissionRequestFlow | null {
  const flow = permissionRequestFlows.find(f => f.requestId === requestId)
  if (!flow) return null

  flow.status = approved ? 'APPROVED' : 'REJECTED'
  if (reason) {
    flow.reason = reason
  }

  return flow
}

/**
 * Phase 0.5: 임시 권한 부여 Mock 로직 강화
 */
export interface TemporaryPermissionGrant {
  userId: string
  programId: string
  actions: ('VIEW' | 'DOWNLOAD' | 'EDIT')[]
  expiresAt: string
  grantedBy: string
  reason?: string
}

// Mock: 임시 권한 부여 저장소
const temporaryPermissionGrants: TemporaryPermissionGrant[] = []

/**
 * 임시 권한 부여
 */
export function grantTemporaryPermission(
  grant: TemporaryPermissionGrant
): TemporaryPermissionGrant {
  temporaryPermissionGrants.push(grant)
  return grant
}

/**
 * 임시 권한 확인
 */
export function checkTemporaryPermission(
  userId: string,
  programId: string,
  action: 'VIEW' | 'DOWNLOAD' | 'EDIT'
): boolean {
  const now = new Date()
  return temporaryPermissionGrants.some(
    grant =>
      grant.userId === userId &&
      grant.programId === programId &&
      grant.actions.includes(action) &&
      new Date(grant.expiresAt) > now
  )
}

/**
 * 만료된 임시 권한 정리
 */
export function cleanupExpiredPermissions(): void {
  const now = new Date()
  const expiredIndexes: number[] = []

  temporaryPermissionGrants.forEach((grant, index) => {
    if (new Date(grant.expiresAt) <= now) {
      expiredIndexes.push(index)
    }
  })

  // 역순으로 삭제 (인덱스 변경 방지)
  expiredIndexes.reverse().forEach(index => {
    temporaryPermissionGrants.splice(index, 1)
  })
}
