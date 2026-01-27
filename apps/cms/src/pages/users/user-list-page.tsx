/**
 * 사용자 관리 페이지 (SSOT 패턴 적용)
 * Phase 5.1.2: 사용자 관리 페이지
 *
 * 규칙:
 * - 모든 사용자 데이터는 스토어에서만 관리
 * - 로컬 state로 사용자 데이터 복제 금지
 * - 필터 조건은 스토어에 저장, 결과는 selector로 계산
 */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { useModalState } from '@/shared/hooks/use-modal-state'
import { UserList } from '@/features/user/ui/user-list'
import { UserDetailDrawer } from '@/features/user/ui/user-detail-drawer'
import { UserRoleChangeModal } from '@/features/user/ui/user-role-change-modal'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'
import { MESSAGES } from '@/shared/constants'
import {
  useUserStore,
  selectFilteredUserIds,
  selectSelectedUser,
} from '@/features/user/model/user-store'
import type { AdminLevel, ProgramRole, User, UserRole } from '@/types/user'

interface UserListQueryParams extends Record<string, string | undefined> {
  role?: UserRole | 'ALL'
  search?: string
  id?: string
}
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'
import './user-list-page.css'

export function UserListPage() {
  const { params, setParam } = useQueryParams<UserListQueryParams>()

  // 스토어에서 필요한 데이터만 선택적으로 구독
  const usersById = useUserStore(state => state.usersById)
  const userIds = useUserStore(state => state.userIds)
  const loading = useUserStore(state => state.loading)
  const filters = useUserStore(state => state.filters)
  const fetchUsers = useUserStore(state => state.fetchUsers)
  const changeUserRole = useUserStore(state => state.changeUserRole)
  const setSelectedUserId = useUserStore(state => state.setSelectedUserId)
  const setFilters = useUserStore(state => state.setFilters)
  const clearSelectedUserId = useUserStore(state => state.setSelectedUserId)

  // Drawer 상태 관리 (useModalState 사용)
  const {
    open: drawerOpen,
    openModal: openDrawer,
    closeModal: closeDrawer,
  } = useModalState<Omit<User, 'password'>>()

  // 권한 변경 모달 상태 관리 (useModalState 사용)
  const {
    open: roleChangeModalOpen,
    openModal: openRoleChangeModal,
    closeModal: closeRoleChangeModal,
    selectedItem: editingUser,
  } = useModalState<Omit<User, 'password'>>()

  // 이전 필터 값을 추적하여 불필요한 업데이트 방지
  const prevFiltersRef = useRef<{ role?: UserRole; search?: string }>({})

  // Pending 필터 상태 (조회 버튼 클릭 전까지 적용하지 않음)
  const [pendingFilters, setPendingFilters] = useState({
    search: params.search || '',
    role: (params.role || 'ALL') as UserRole | 'ALL',
  })

  // URL에서 필터 값을 읽어와서 pendingFilters 초기화
  useEffect(() => {
    setPendingFilters({
      search: params.search || '',
      role: (params.role || 'ALL') as UserRole | 'ALL',
    })
  }, [params.search, params.role])

  // 필터 조건을 스토어에 동기화 (조회 버튼 클릭 시)
  const applyFilters = useCallback(() => {
    const newFilters: { role?: UserRole; search?: string } = {}
    if (pendingFilters.role !== 'ALL') {
      newFilters.role = pendingFilters.role
    }
    if (pendingFilters.search) {
      newFilters.search = pendingFilters.search
    }
    setFilters(newFilters)
  }, [pendingFilters, setFilters])

  // 필터된 사용자 ID 목록 (selector로 계산, useMemo로 메모이제이션)
  const filteredUserIds = useMemo(() => {
    return selectFilteredUserIds({ usersById, userIds, filters })
  }, [usersById, userIds, filters])

  // 필터된 사용자 객체 배열 (렌더링용)
  const filteredUsers = useMemo(() => {
    return filteredUserIds.map(id => usersById[id]).filter(Boolean)
  }, [filteredUserIds, usersById])

  // 선택된 사용자 (selector로 계산)
  const selectedUser = useUserStore(state => selectSelectedUser(state))

  // 데이터 불러오기 함수
  const loadUsers = useCallback(async () => {
    try {
      const filters: { role?: UserRole; search?: string } = {}
      if (pendingFilters.role !== 'ALL') {
        filters.role = pendingFilters.role
      }
      if (pendingFilters.search) {
        filters.search = pendingFilters.search
      }
      await fetchUsers(filters)
    } catch (error) {
      handleError(error, { defaultMessage: MESSAGES.error.userListLoadFailed })
    }
  }, [fetchUsers, pendingFilters])

  // 조회 버튼 클릭 시 필터 적용 및 데이터 로드
  const handleSearch = () => {
    setParam('search', pendingFilters.search || null)
    setParam('role', pendingFilters.role === 'ALL' ? null : pendingFilters.role)
    applyFilters()
    loadUsers()
  }

  // 필터 초기화
  const handleFilterReset = () => {
    setPendingFilters({
      search: '',
      role: 'ALL',
    })
    setParam('search', null)
    setParam('role', null)
    setFilters({})
    loadUsers()
  }

  // 페이지 로드 시 초기 데이터 불러오기
  useEffect(() => {
    loadUsers()
  }, [])

  // 사용자 상세 보기
  const handleView = (user: Omit<User, 'password'>) => {
    setSelectedUserId(user.id) // 스토어에 ID만 저장
    openDrawer(user)
    setParam('id', user.id)
  }

  // Drawer 닫기
  const handleDrawerClose = () => {
    closeDrawer()
    clearSelectedUserId(null) // 스토어에서 선택 해제
    setParam('id', null)
  }

  // 권한 변경
  const handleEdit = (user: Omit<User, 'password'>) => {
    openRoleChangeModal(user)
  }

  const handleRoleChange = async (
    userId: string,
    newRole: UserRole,
    adminLevel?: AdminLevel,
    programRole?: ProgramRole
  ) => {
    try {
      await changeUserRole(userId, newRole, adminLevel, programRole)
      showSuccessMessage(MESSAGES.success.updated)
      closeRoleChangeModal()

      // 목록 새로고침 (필터 조건 유지)
      const currentFilters: { role?: UserRole; search?: string } = {}
      if (filters.role) {
        currentFilters.role = filters.role
      }
      if (filters.search) {
        currentFilters.search = filters.search
      }
      await fetchUsers(currentFilters)
    } catch (error) {
      handleError(error, { defaultMessage: MESSAGES.error.roleChangeFailed })
    }
  }

  const handleRoleChangeCancel = () => {
    closeRoleChangeModal()
  }

  return (
    <div>
      <UnifiedFilterCard
        fields={[
          {
            key: 'search',
            type: 'search',
            label: '이름/이메일',
            placeholder: '이름 또는 이메일을 입력하세요',
          },
          {
            key: 'role',
            type: 'select',
            label: '권한',
            placeholder: '전체',
            options: [
              { label: '전체', value: 'ALL' },
              { label: '관리자', value: 'ADMIN' },
              { label: '강사', value: 'INSTRUCTOR' },
              { label: '개인(참여자)', value: 'INDIVIDUAL' },
              { label: '학교', value: 'SCHOOL' },
            ],
          },
        ]}
        filters={pendingFilters}
        onFilterChange={(key, value) => {
          setPendingFilters(prev => ({ ...prev, [key]: value }))
        }}
        onSearch={handleSearch}
        onReset={handleFilterReset}
        loading={loading}
      />

      <UserList data={filteredUsers} loading={loading} onView={handleView} onEdit={handleEdit} />

      <UserDetailDrawer
        open={drawerOpen}
        user={selectedUser}
        onClose={handleDrawerClose}
        onEdit={selectedUser ? () => handleEdit(selectedUser) : undefined}
      />

      <UserRoleChangeModal
        open={roleChangeModalOpen}
        user={editingUser}
        loading={loading}
        onConfirm={handleRoleChange}
        onCancel={handleRoleChangeCancel}
      />
    </div>
  )
}
