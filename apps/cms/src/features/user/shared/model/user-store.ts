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
  createUser,
  deleteUser,
  patchUserBasicInfo,
  type CreateUserRequest,
  type PatchUserBasicInfoInput,
  type PatchUserBasicInfoOptions,
} from '@/entities/user/api/user-service'
import { isMembersRemoteEnabled } from '@/features/user/api/member-remote-capabilities'
import { mergeListUserWithFetchedDetail } from '@/features/user/api/merge-list-user-with-detail'
import { matchesUserInstitutionLocation } from '@/entities/user/lib/matches-institution-location'
import {
  matchesInstructorJaEvaluationGradeFilter,
  matchesInstructorSettlementFilter,
} from '@/entities/user/lib/matches-instructor-list-filters'
import {
  getAdminPermissionVariant,
  type AdminPermissionTagVariant,
} from '@/features/user/shared/lib/admin-permission-display'

type UserId = string
type UserWithoutPassword = Omit<User, 'password'>

interface UserFilters {
  role?: UserRole
  search?: string
  isActive?: boolean
  /** 가입일 필터 (YYYY-MM-DD). 클라이언트 필터링용 */
  createdAtFrom?: string
  createdAtTo?: string
  institutionLocation?: string
  jaEvaluationGrade?: string
  settlementStatus?: string
  adminPermissionVariant?: AdminPermissionTagVariant
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
  fetchUserById: (
    userId: UserId,
    options?: {
      memberId?: number
      organizationId?: number
      role?: UserRole
      adminAccountId?: number
      email?: string
    }
  ) => Promise<UserWithoutPassword | null>
  createUser: (request: CreateUserRequest) => Promise<UserWithoutPassword>
  deleteUser: (
    userId: UserId,
    options?: { memberId?: number; adminAccountId?: number; role?: UserRole; email?: string }
  ) => Promise<void>
  changeUserRole: (
    userId: UserId,
    newRole: UserRole,
    adminLevel?: AdminLevel,
    programRole?: ProgramRole
  ) => Promise<void>
  changeUserStatus: (userId: UserId, isActive: boolean) => Promise<void>
  patchUserBasicInfo: (
    userId: UserId,
    patch: PatchUserBasicInfoInput,
    options?: PatchUserBasicInfoOptions
  ) => Promise<UserWithoutPassword>
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

    // 가입일 필터 (클라이언트 측, createdAt 기준)
    const createdAt = user.createdAt ? new Date(user.createdAt).toISOString().slice(0, 10) : ''
    if (filters.createdAtFrom && createdAt < filters.createdAtFrom) {
      return false
    }
    if (filters.createdAtTo && createdAt > filters.createdAtTo) {
      return false
    }

    if (filters.institutionLocation?.trim()) {
      if (!matchesUserInstitutionLocation(user, filters.institutionLocation)) {
        return false
      }
    }

    if (filters.jaEvaluationGrade?.trim()) {
      if (!matchesInstructorJaEvaluationGradeFilter(user, filters.jaEvaluationGrade)) {
        return false
      }
    }

    if (filters.settlementStatus?.trim()) {
      if (!matchesInstructorSettlementFilter(user, filters.settlementStatus)) {
        return false
      }
    }

    if (filters.adminPermissionVariant) {
      if (
        user.role !== 'ADMIN' ||
        getAdminPermissionVariant(user) !== filters.adminPermissionVariant
      ) {
        return false
      }
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

  fetchUserById: async (userId, options) => {
    set({ loading: true, error: null })
    try {
      const state = get()
      const existingHint =
        state.usersById[userId] ??
        (options?.memberId != null
          ? Object.values(state.usersById).find(u => u.memberId === options.memberId)
          : undefined)

      const fetched = await getUserById(userId, options)
      if (!fetched) {
        set({ loading: false })
        return null
      }

      const user =
        existingHint && isMembersRemoteEnabled()
          ? mergeListUserWithFetchedDetail(existingHint, fetched)
          : fetched

      // usersById에 추가/업데이트 — 요청 키·canonical id 모두 저장
      const nextUsersById = {
        ...state.usersById,
        [userId]: user,
        ...(user.id !== userId ? { [user.id]: user } : {}),
      }
      const nextUserIds = state.userIds.includes(user.id)
        ? state.userIds
        : [...state.userIds, user.id]

      set({
        usersById: nextUsersById,
        userIds: nextUserIds,
        loading: false,
      })
      return user
    } catch (err) {
      const error = err instanceof Error ? err : new Error('사용자 정보를 불러오는데 실패했습니다.')
      set({ error, loading: false })
      throw error
    }
  },

  createUser: async request => {
    set({ loading: true, error: null })
    try {
      const newUser = await createUser(request)
      const state = get()

      // usersById에 추가
      set({
        usersById: {
          ...state.usersById,
          [newUser.id]: newUser,
        },
        // 최신 등록 사용자가 목록 상단에 오도록 앞에 추가
        userIds: [newUser.id, ...state.userIds],
        loading: false,
      })

      return newUser
    } catch (err) {
      const error = err instanceof Error ? err : new Error('사용자 생성에 실패했습니다.')
      set({ error, loading: false })
      throw error
    }
  },

  deleteUser: async (userId, options) => {
    set({ loading: true, error: null })
    try {
      await deleteUser(userId, 'CMS 관리자 회원 삭제', options)
      const state = get()

      // usersById에서 제거
      const { [userId]: removed, ...remainingUsers } = state.usersById

      // userIds에서 제거
      const updatedUserIds = state.userIds.filter(id => id !== userId)

      set({
        usersById: remainingUsers,
        userIds: updatedUserIds,
        // 선택된 사용자가 삭제된 경우 선택 해제
        selectedUserId: state.selectedUserId === userId ? null : state.selectedUserId,
        loading: false,
      })
    } catch (err) {
      const error = err instanceof Error ? err : new Error('사용자 삭제에 실패했습니다.')
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

  patchUserBasicInfo: async (userId, patch, options) => {
    set({ loading: true, error: null })
    try {
      const updatedUser = await patchUserBasicInfo(userId, patch, options)
      const state = get()
      set({
        usersById: {
          ...state.usersById,
          [userId]: updatedUser,
        },
        loading: false,
      })
      return updatedUser
    } catch (err) {
      const error = err instanceof Error ? err : new Error('회원 정보 수정에 실패했습니다.')
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
