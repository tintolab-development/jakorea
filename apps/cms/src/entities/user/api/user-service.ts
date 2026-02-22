/**
 * 사용자 관리 API 서비스 (Mock)
 * Phase 5.1.2: 사용자 관리 페이지
 */

import type { AdminLevel, ProgramRole, User, UserRole } from '@/types/user'
import { mockUsers } from '@/data/mock/users'
import { mockUserHistories } from '@/data/mock/mypage'
import type { UUID } from '@/types/index'

/**
 * 사용자 목록 조회
 */
export async function getUsers(filters?: {
  role?: UserRole
  search?: string
  isActive?: boolean
  createdAtFrom?: string
  createdAtTo?: string
}): Promise<Omit<User, 'password'>[]> {
  await new Promise(resolve => setTimeout(resolve, 300))

  let users = [...mockUsers]

  // 권한 필터
  if (filters?.role) {
    users = users.filter(user => user.role === filters.role)
  }

  // 검색 필터 (이름, 이메일)
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    users = users.filter(
      user =>
        user.name.toLowerCase().includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower)
    )
  }

  // 활성화 상태 필터
  if (filters?.isActive !== undefined) {
    users = users.filter(user => user.isActive === filters.isActive)
  }

  // 가입일 필터
  if (filters?.createdAtFrom || filters?.createdAtTo) {
    users = users.filter(user => {
      const created = user.createdAt ? new Date(user.createdAt).toISOString().slice(0, 10) : ''
      if (filters.createdAtFrom && created < filters.createdAtFrom) return false
      if (filters.createdAtTo && created > filters.createdAtTo) return false
      return true
    })
  }

  // 비밀번호 제외하고 반환, participationHistory 계산
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return users.map(({ password, ...user }) => {
    // 실제 참여이력 데이터에서 계산
    const userHistories = mockUserHistories.filter(
      h => h.userId === user.id && h.finalStatus !== 'CANCELLED'
    )
    return {
      ...user,
      participationHistory: userHistories.length,
    }
  })
}

export interface GetUsersPageParams {
  role?: UserRole
  search?: string
  isActive?: boolean
  createdAtFrom?: string
  createdAtTo?: string
}

export interface GetUsersPageResult {
  users: Omit<User, 'password'>[]
  total: number
  hasMore: boolean
}

const PAGE_SIZE = 15

/**
 * 사용자 목록 페이지 조회 (무한 스크롤용)
 * 필터 적용 후 offset/limit 슬라이스 반환
 */
export async function getUsersPage(
  filters: GetUsersPageParams | undefined,
  page: number
): Promise<GetUsersPageResult> {
  const all = await getUsers(filters)
  const offset = page * PAGE_SIZE
  const users = all.slice(offset, offset + PAGE_SIZE)
  return {
    users,
    total: all.length,
    hasMore: offset + users.length < all.length,
  }
}

/**
 * 사용자 상세 조회
 */
export async function getUserById(userId: UUID): Promise<Omit<User, 'password'> | null> {
  await new Promise(resolve => setTimeout(resolve, 200))

  const user = mockUsers.find(u => u.id === userId)
  if (!user) {
    return null
  }

  // 실제 참여이력 데이터에서 계산
  const userHistories = mockUserHistories.filter(
    h => h.userId === user.id && h.finalStatus !== 'CANCELLED'
  )

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user
  return {
    ...userWithoutPassword,
    participationHistory: userHistories.length,
  }
}

/**
 * 사용자 권한 변경
 */
export async function updateUserRole(
  userId: UUID,
  newRole: UserRole,
  adminLevel?: AdminLevel,
  programRole?: ProgramRole
): Promise<Omit<User, 'password'>> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const userIndex = mockUsers.findIndex(u => u.id === userId)
  if (userIndex === -1) {
    throw new Error('사용자를 찾을 수 없습니다.')
  }

  const user = mockUsers[userIndex]
  user.role = newRole

  if (newRole === 'ADMIN') {
    const effectiveAdminLevel = adminLevel || user.adminLevel || 'ADMIN'
    const effectiveProgramRole = programRole || user.programRoles?.['program-1'] || 'ASSISTANT'

    user.adminLevel = effectiveAdminLevel
    user.programRoles = { 'program-1': effectiveProgramRole }
  } else {
    user.adminLevel = undefined
    user.programRoles = undefined
  }

  user.updatedAt = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user
  return userWithoutPassword
}

/**
 * 사용자 활성화 상태 변경
 */
export async function updateUserStatus(
  userId: UUID,
  isActive: boolean
): Promise<Omit<User, 'password'>> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const userIndex = mockUsers.findIndex(u => u.id === userId)
  if (userIndex === -1) {
    throw new Error('사용자를 찾을 수 없습니다.')
  }

  const user = mockUsers[userIndex]
  user.isActive = isActive
  user.updatedAt = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user
  return userWithoutPassword
}

/**
 * 사용자 생성 (관리자용)
 */
export interface CreateUserRequest {
  email: string
  password: string
  name: string
  phone?: string
  role: UserRole
  adminLevel?: AdminLevel
  programRole?: ProgramRole
  schoolInfo?: {
    schoolName: string
    address: string
    position?: string
  }
  instructorInfo?: {
    bankName: string
    accountNumber: string
    accountHolder: string
    isBusinessIncome: boolean
  }
  isActive?: boolean
}

export async function createUser(request: CreateUserRequest): Promise<Omit<User, 'password'>> {
  await new Promise(resolve => setTimeout(resolve, 300))

  // 이메일 중복 체크
  const existingUser = mockUsers.find(u => u.email === request.email)
  if (existingUser) {
    throw new Error('이미 사용 중인 이메일입니다.')
  }

  // UUID 생성
  function generateUUID(): string {
    return `user-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`
  }

  const now = new Date().toISOString()

  const newUser: User = {
    id: generateUUID(),
    email: request.email,
    password: request.password, // 실제로는 해시된 값이어야 함
    name: request.name,
    phone: request.phone,
    role: request.role,
    isActive: request.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  }

  // 관리자 권한 설정
  if (request.role === 'ADMIN') {
    newUser.adminLevel = request.adminLevel || 'ADMIN'
    newUser.programRoles = request.programRole
      ? { 'program-1': request.programRole }
      : { 'program-1': 'ASSISTANT' }
  }

  // 학교 정보 설정
  if (request.role === 'SCHOOL' && request.schoolInfo) {
    newUser.schoolInfo = request.schoolInfo
  }

  // 강사 정보 설정
  if (request.role === 'INSTRUCTOR' && request.instructorInfo) {
    newUser.instructorInfo = request.instructorInfo
  }

  // Mock 데이터에 추가
  mockUsers.push(newUser)

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = newUser
  return userWithoutPassword
}

/**
 * 사용자 프로그램 역할 업데이트
 * 프로그램 생성 시 자동으로 OWNER 권한 부여
 */
export async function updateUserProgramRole(
  userId: UUID,
  programId: string,
  programRole: ProgramRole
): Promise<Omit<User, 'password'>> {
  await new Promise(resolve => setTimeout(resolve, 200))

  const userIndex = mockUsers.findIndex(u => u.id === userId)
  if (userIndex === -1) {
    throw new Error('사용자를 찾을 수 없습니다.')
  }

  const user = mockUsers[userIndex]

  // 관리자가 아니면 프로그램 역할 설정 불가
  if (user.role !== 'ADMIN') {
    throw new Error('관리자만 프로그램 역할을 가질 수 있습니다.')
  }

  // programRoles가 없으면 초기화
  if (!user.programRoles) {
    user.programRoles = {}
  }

  // 해당 프로그램에 역할 부여
  user.programRoles[programId] = programRole
  user.updatedAt = new Date().toISOString()

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user
  return userWithoutPassword
}

/**
 * 사용자 삭제
 */
export async function deleteUser(userId: UUID): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const userIndex = mockUsers.findIndex(u => u.id === userId)
  if (userIndex === -1) {
    throw new Error('사용자를 찾을 수 없습니다.')
  }

  mockUsers.splice(userIndex, 1)
}
