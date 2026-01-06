/**
 * 사용자 관리 API 서비스 (Mock)
 * Phase 5.1.2: 사용자 관리 페이지
 */

import type { User, UserRole } from '@/types/user'
import { mockUsers } from '@/data/mock/users'
import type { UUID } from '@/types/index'

/**
 * 사용자 목록 조회
 */
export async function getUsers(filters?: {
  role?: UserRole
  search?: string
  isActive?: boolean
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

  // 비밀번호 제외하고 반환
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return users.map(({ password, ...user }) => user)
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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password, ...userWithoutPassword } = user
  return userWithoutPassword
}

/**
 * 사용자 권한 변경
 */
export async function updateUserRole(
  userId: UUID,
  newRole: UserRole
): Promise<Omit<User, 'password'>> {
  await new Promise(resolve => setTimeout(resolve, 300))

  const userIndex = mockUsers.findIndex(u => u.id === userId)
  if (userIndex === -1) {
    throw new Error('사용자를 찾을 수 없습니다.')
  }

  const user = mockUsers[userIndex]
  user.role = newRole
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
