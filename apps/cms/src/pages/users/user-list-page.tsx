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
import { Space } from 'antd'
import { useLocation } from 'react-router-dom'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { UserList } from '@/features/user/ui/user-list'
import { UserDetailDrawer } from '@/features/user/ui/user-detail-drawer'
import { UserRoleChangeModal } from '@/features/user/ui/user-role-change-modal'
import { ListPageFilters } from '@/shared/ui/list-page-filters'
import { MESSAGES } from '@/shared/constants'
import {
  useUserStore,
  selectFilteredUserIds,
  selectSelectedUser,
  selectUserById,
} from '@/features/user/model/user-store'
import type { AdminLevel, ProgramRole, User, UserRole } from '@/types/user'

interface UserListQueryParams extends Record<string, string | undefined> {
  role?: UserRole | 'ALL'
  search?: string
  id?: string
}
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import './user-list-page.css'

export function UserListPage() {
  const location = useLocation()
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

  // 2뎁스 카테고리명 가져오기
  const categoryName = getCategoryNameByPath(location.pathname, 2) || '회원 관리'

  // UI 상태만 로컬에서 관리 (도메인 데이터 아님)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [roleChangeModalOpen, setRoleChangeModalOpen] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)

  // 이전 필터 값을 추적하여 불필요한 업데이트 방지
  const prevFiltersRef = useRef<{ role?: UserRole; search?: string }>({})

  // 쿼리 파라미터에서 필터 값 읽기
  const roleFilter = useMemo(() => {
    return (params.role || 'ALL') as UserRole | 'ALL'
  }, [params.role])

  const searchQuery = useMemo(() => {
    return params.search || ''
  }, [params.search])

  // 필터 조건을 스토어에 동기화 (실제 변경이 있을 때만)
  useEffect(() => {
    const newFilters: { role?: UserRole; search?: string } = {}
    if (roleFilter !== 'ALL') {
      newFilters.role = roleFilter
    }
    if (searchQuery) {
      newFilters.search = searchQuery
    }

    // 이전 필터와 비교하여 실제로 변경된 경우에만 업데이트
    const prevRole = prevFiltersRef.current.role
    const prevSearch = prevFiltersRef.current.search
    const newRole = newFilters.role
    const newSearch = newFilters.search

    // 값이 실제로 다를 때만 업데이트
    if (prevRole !== newRole || prevSearch !== newSearch) {
      prevFiltersRef.current = newFilters
      setFilters(newFilters)
    }
  }, [roleFilter, searchQuery, setFilters])

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

  // 편집 중인 사용자
  const editingUser = useMemo(() => {
    return editingUserId ? selectUserById({ usersById }, editingUserId) : null
  }, [editingUserId, usersById])

  // 데이터 불러오기 함수
  const loadUsers = useCallback(async () => {
    try {
      const filters: { role?: UserRole; search?: string } = {}
      if (roleFilter !== 'ALL') {
        filters.role = roleFilter
      }
      if (searchQuery) {
        filters.search = searchQuery
      }
      await fetchUsers(filters)
    } catch (error) {
      handleError(error, { defaultMessage: '사용자 목록을 불러오는데 실패했습니다' })
    }
  }, [fetchUsers, roleFilter, searchQuery])

  // 페이지 로드 시 및 필터 변경 시 데이터 불러오기
  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // 필터 변경 핸들러
  const handleRoleFilterChange = (value: UserRole | 'ALL') => {
    if (value === 'ALL') {
      setParam('role', null)
    } else {
      setParam('role', value)
    }
  }

  const handleSearch = (value: string) => {
    setParam('search', value || null)
  }

  // 사용자 상세 보기
  const handleView = (user: Omit<User, 'password'>) => {
    setSelectedUserId(user.id) // 스토어에 ID만 저장
    setDrawerOpen(true)
    setParam('id', user.id)
  }

  // Drawer 닫기
  const handleDrawerClose = () => {
    setDrawerOpen(false)
    clearSelectedUserId(null) // 스토어에서 선택 해제
    setParam('id', null)
  }

  // 권한 변경
  const handleEdit = (user: Omit<User, 'password'>) => {
    setEditingUserId(user.id) // ID만 저장
    setRoleChangeModalOpen(true)
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
      setRoleChangeModalOpen(false)
      setEditingUserId(null)

      // 목록 새로고침 (필터 조건 유지)
      const currentFilters: { role?: UserRole; search?: string } = {}
      if (roleFilter !== 'ALL') {
        currentFilters.role = roleFilter
      }
      if (searchQuery) {
        currentFilters.search = searchQuery
      }
      await fetchUsers(currentFilters)
    } catch (error) {
      handleError(error, { defaultMessage: '권한 변경에 실패했습니다' })
    }
  }

  const handleRoleChangeCancel = () => {
    setRoleChangeModalOpen(false)
    setEditingUserId(null)
  }

  return (
    <div>
      <Space className="user-list-header">
        <h1 className="user-list-title">{categoryName}</h1>
      </Space>

      <ListPageFilters
        filters={{ role: roleFilter === 'ALL' ? undefined : roleFilter }}
        onFilterChange={(key, value) => {
          if (key === 'role') {
            handleRoleFilterChange(value || 'ALL')
          }
        }}
        searchValue={searchQuery}
        onSearchChange={handleSearch}
        searchPlaceholder="이름 또는 이메일 검색"
        filterConfig={[
          {
            key: 'role',
            type: 'select',
            options: [
              { label: '전체', value: 'ALL' },
              { label: '관리자', value: 'ADMIN' },
              { label: '강사', value: 'INSTRUCTOR' },
              { label: '개인(참여자)', value: 'INDIVIDUAL' },
              { label: '학교', value: 'SCHOOL' },
            ],
            placeholder: '권한 필터',
          },
        ]}
        extra={<button onClick={loadUsers}>새로고침</button>}
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
