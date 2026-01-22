/**
 * 사용자 관리 상태 관리 스토어
 * Phase 5.1.2: 사용자 관리 페이지
 * Phase 0.1.1: 역할 체계 재정의
 */

import { create } from 'zustand'
import type { AdminProgramRole, AdminLevel, AdminRole, ProgramRole, User, UserRole } from '@/types/user'
import { getUsers, getUserById, updateUserRole, updateUserStatus } from '@/entities/user/api/user-service'

interface UserStore {
  users: Omit<User, 'password'>[]
  selectedUser: Omit<User, 'password'> | null
  loading: boolean
  error: Error | null

  // Actions
  fetchUsers: (filters?: { role?: UserRole; search?: string; isActive?: boolean }) => Promise<void>
  fetchUserById: (userId: string) => Promise<void>
  changeUserRole: (
    userId: string,
    newRole: UserRole,
    adminLevel?: AdminLevel,
    adminRole?: AdminRole, // 하위 호환성
    programRole?: ProgramRole,
    adminProgramRole?: AdminProgramRole // 하위 호환성
  ) => Promise<void>
  changeUserStatus: (userId: string, isActive: boolean) => Promise<void>
  clearSelectedUser: () => void
  clearError: () => void
}

export const useUserStore = create<UserStore>((set, get) => ({
  users: [],
  selectedUser: null,
  loading: false,
  error: null,

  fetchUsers: async (filters) => {
    set({ loading: true, error: null })
    try {
      const users = await getUsers(filters)
      set({ users, loading: false })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('사용자 목록을 불러오는데 실패했습니다.')
      set({ error, loading: false })
      throw error
    }
  },

  fetchUserById: async (userId) => {
    set({ loading: true, error: null })
    try {
      const user = await getUserById(userId)
      set({ selectedUser: user, loading: false })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('사용자 정보를 불러오는데 실패했습니다.')
      set({ error, loading: false })
      throw error
    }
  },

  changeUserRole: async (userId, newRole, adminLevel, adminRole, programRole, adminProgramRole) => {
    set({ loading: true, error: null })
    try {
      // Phase 0.1.1: adminLevel, programRole 우선 사용
      const effectiveAdminLevel = adminLevel || adminRole
      const effectiveProgramRole = programRole || adminProgramRole
      const updatedUser = await updateUserRole(
        userId,
        newRole,
        effectiveAdminLevel,
        adminRole, // 하위 호환성
        effectiveProgramRole,
        adminProgramRole // 하위 호환성
      )
      
      // 목록 업데이트
      const users = get().users.map(user => 
        user.id === userId ? updatedUser : user
      )
      set({ users, loading: false })
      
      // 선택된 사용자도 업데이트
      if (get().selectedUser?.id === userId) {
        set({ selectedUser: updatedUser })
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('권한 변경에 실패했습니다.')
      set({ error, loading: false })
      throw error
    }
  },

  changeUserStatus: async (userId, isActive) => {
    set({ loading: true, error: null })
    try {
      const updatedUser = await updateUserStatus(userId, isActive)
      
      // 목록 업데이트
      const users = get().users.map(user => 
        user.id === userId ? updatedUser : user
      )
      set({ users, loading: false })
      
      // 선택된 사용자도 업데이트
      if (get().selectedUser?.id === userId) {
        set({ selectedUser: updatedUser })
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('상태 변경에 실패했습니다.')
      set({ error, loading: false })
      throw error
    }
  },

  clearSelectedUser: () => {
    set({ selectedUser: null })
  },

  clearError: () => {
    set({ error: null })
  },
}))

