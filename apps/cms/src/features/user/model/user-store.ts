/**
 * 사용자 관리 상태 관리 스토어 (SSOT - Single Source of Truth)
 * Phase 5.1.2: 사용자 관리 페이지
 *
 * 정규화된 구조:
 * - usersById: Record<UserId, User> - 모든 사용자 데이터
 * - userIds: UserId[] - 전체 사용자 ID 목록
 * - filters: 필터 조건만 저장, 결과는 selector로 계산
 * - selectedUserId: 선택된 사용자 ID만 저장
 */

import { create } from 'zustand'
import type { AdminLevel, ProgramRole, User, UserRole } from '@/types/user'
import {
  getUsers,
  getUserById,
  updateUserRole,
  updateUserStatus,
} from '@/entities/user/api/user-service'

type UserId = string
type UserWithoutPassword = Omit<User, 'password'>

interface UserFilters {
  role?: UserRole
  search?: string
  isActive?: boolean
}

interface UserStore {
  // 정규화된 데이터 구조
  usersById: Record<UserId, UserWithoutPassword>
  userIds: UserId[]

  // 필터 조건 (결과는 selector로 계산)
  filters: UserFilters

  // 선택된 사용자 ID
  selectedUserId: UserId | null

  // UI 상태
  loading: boolean
  error: Error | null

  // Actions
  fetchUsers: (filters?: UserFilters) => Promise<void>
  fetchUserById: (userId: UserId) => Promise<void>
  changeUserRole: (
    userId: UserId,
    newRole: UserRole,
    adminLevel?: AdminLevel,
    programRole?: ProgramRole
  ) => Promise<void>
  changeUserStatus: (userId: UserId, isActive: boolean) => Promise<void>
  setSelectedUserId: (userId: UserId | null) => void
  setFilters: (filters: Partial<UserFilters>) => void
  clearFilters: () => void
  clearError: () => void
}

// Selector 함수들 (스토어 외부에서 사용)
export const selectFilteredUserIds = (
  state: Pick<UserStore, 'usersById' | 'userIds' | 'filters'>
): UserId[] => {
  const { usersById, userIds, filters } = state

  return userIds.filter(userId => {
    const user = usersById[userId]
    if (!user) return false

    // 역할 필터
    if (filters.role && user.role !== filters.role) {
      return false
    }

    // 검색 필터
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      const matchesName = user.name.toLowerCase().includes(searchLower)
      const matchesEmail = user.email.toLowerCase().includes(searchLower)
      if (!matchesName && !matchesEmail) {
        return false
      }
    }

    // 활성화 상태 필터
    if (filters.isActive !== undefined && user.isActive !== filters.isActive) {
      return false
    }

    return true
  })
}

export const selectUserById = (
  state: Pick<UserStore, 'usersById'>,
  userId: UserId | null
): UserWithoutPassword | null => {
  if (!userId) return null
  return state.usersById[userId] || null
}

export const selectSelectedUser = (
  state: Pick<UserStore, 'usersById' | 'selectedUserId'>
): UserWithoutPassword | null => {
  return selectUserById(state, state.selectedUserId)
}

export const useUserStore = create<UserStore>((set, get) => ({
  usersById: {},
  userIds: [],
  filters: {},
  selectedUserId: null,
  loading: false,
  error: null,

  fetchUsers: async filters => {
    set({ loading: true, error: null })
    try {
      const users = await getUsers(filters)

      // 정규화된 구조로 변환
      const usersById: Record<UserId, UserWithoutPassword> = {}
      const userIds: UserId[] = []

      users.forEach(user => {
        usersById[user.id] = user
        userIds.push(user.id)
      })

      // 필터 조건 저장
      set({
        usersById,
        userIds,
        filters: filters || {},
        loading: false,
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('사용자 목록을 불러오는데 실패했습니다.')
      set({ error, loading: false })
      throw error
    }
  },

  fetchUserById: async userId => {
    set({ loading: true, error: null })
    try {
      const user = await getUserById(userId)
      if (!user) {
        set({ loading: false })
        return
      }

      // usersById에 추가/업데이트
      const state = get()
      set({
        usersById: {
          ...state.usersById,
          [userId]: user,
        },
        // userIds에 없으면 추가
        userIds: state.userIds.includes(userId) ? state.userIds : [...state.userIds, userId],
        loading: false,
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('사용자 정보를 불러오는데 실패했습니다.')
      set({ error, loading: false })
      throw error
    }
  },

  changeUserRole: async (userId, newRole, adminLevel, programRole) => {
    set({ loading: true, error: null })
    try {
      const updatedUser = await updateUserRole(userId, newRole, adminLevel, programRole)
      const state = get()

      // usersById 업데이트 (단일 소스 업데이트)
      set({
        usersById: {
          ...state.usersById,
          [userId]: updatedUser,
        },
        loading: false,
      })

      // 현재 로그인한 사용자의 권한이 변경된 경우 authStore의 user도 업데이트
      // 동적 import를 사용하여 순환 참조 방지
      try {
        const { useAuthStore } = await import('@/features/auth/model/auth-store')
        const authState = useAuthStore.getState()
        if (authState.user?.id === userId) {
          // updatedUser 객체 전체를 전달하여 완전한 동기화 보장
          useAuthStore.getState().updateUser(updatedUser)
          if (process.env.NODE_ENV === 'development') {
            console.log('[UserStore] 현재 로그인한 사용자의 권한이 업데이트되었습니다:', {
              userId,
              newRole: updatedUser.role,
              newAdminLevel: updatedUser.adminLevel,
              updatedUser,
            })
          }
        }
      } catch (error) {
        // auth-store import 실패 시 조용히 처리 (순환 참조 방지)
        if (process.env.NODE_ENV === 'development') {
          console.warn('[UserStore] auth-store 업데이트 실패:', error)
        }
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
      const state = get()

      // usersById 업데이트 (단일 소스 업데이트)
      set({
        usersById: {
          ...state.usersById,
          [userId]: updatedUser,
        },
        loading: false,
      })

      // 현재 로그인한 사용자의 상태가 변경된 경우 authStore의 user도 업데이트
      // 동적 import를 사용하여 순환 참조 방지
      try {
        const { useAuthStore } = await import('@/features/auth/model/auth-store')
        const authState = useAuthStore.getState()
        if (authState.user?.id === userId) {
          // updatedUser 객체 전체를 전달하여 완전한 동기화 보장
          useAuthStore.getState().updateUser(updatedUser)
          if (process.env.NODE_ENV === 'development') {
            console.log('[UserStore] 현재 로그인한 사용자의 상태가 업데이트되었습니다:', {
              userId,
              isActive: updatedUser.isActive,
            })
          }
        }
      } catch (error) {
        // auth-store import 실패 시 조용히 처리 (순환 참조 방지)
        if (process.env.NODE_ENV === 'development') {
          console.warn('[UserStore] auth-store 업데이트 실패:', error)
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error('상태 변경에 실패했습니다.')
      set({ error, loading: false })
      throw error
    }
  },

  setSelectedUserId: userId => {
    set({ selectedUserId: userId })
  },

  setFilters: newFilters => {
    const state = get()
    set({
      filters: {
        ...state.filters,
        ...newFilters,
      },
    })
  },

  clearFilters: () => {
    set({ filters: {} })
  },

  clearError: () => {
    set({ error: null })
  },
}))
