/**
 * 사용자 관리 페이지
 * Phase 5.1.2: 사용자 관리 페이지
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Space, Select, Input, Button } from 'antd'
import { useSearchParams, useLocation } from 'react-router-dom'
import { UserList } from '@/features/user/ui/user-list'
import { UserDetailDrawer } from '@/features/user/ui/user-detail-drawer'
import { UserRoleChangeModal } from '@/features/user/ui/user-role-change-modal'
import { useUserStore } from '@/features/user/model/user-store'
import type { AdminProgramRole, AdminLevel, AdminRole, ProgramRole, User, UserRole } from '@/types/user'
import { handleError, showSuccessMessage } from '@/shared/utils/error-handler'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import './user-list-page.css'

const { Option } = Select
const { Search } = Input

export function UserListPage() {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const { users, loading, fetchUsers, changeUserRole } = useUserStore()
  
  // 2뎁스 카테고리명 가져오기
  const categoryName = getCategoryNameByPath(location.pathname, 2) || '회원 관리'

  // 상태 관리
  const [selectedUser, setSelectedUser] = useState<Omit<User, 'password'> | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [roleChangeModalOpen, setRoleChangeModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<Omit<User, 'password'> | null>(null)

  // 쿼리 파라미터에서 필터 값 읽기
  const roleFilter = useMemo(() => {
    return (searchParams.get('role') || 'ALL') as UserRole | 'ALL'
  }, [searchParams])

  const searchQuery = useMemo(() => {
    return searchParams.get('search') || ''
  }, [searchParams])

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

  // 페이지 로드 시 및 필터 변경 시 자동으로 데이터 불러오기
  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  // 필터 변경 핸들러
  const handleRoleFilterChange = (value: UserRole | 'ALL') => {
    const newParams = new URLSearchParams(searchParams)
    if (value === 'ALL') {
      newParams.delete('role')
    } else {
      newParams.set('role', value)
    }
    setSearchParams(newParams, { replace: true })
  }

  const handleSearch = (value: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set('search', value)
    } else {
      newParams.delete('search')
    }
    setSearchParams(newParams, { replace: true })
  }

  // 사용자 상세 보기
  const handleView = (user: Omit<User, 'password'>) => {
    setSelectedUser(user)
    setDrawerOpen(true)
    const newParams = new URLSearchParams(searchParams)
    newParams.set('id', user.id)
    setSearchParams(newParams, { replace: true })
  }

  // Drawer 닫기
  const handleDrawerClose = () => {
    setDrawerOpen(false)
    setSelectedUser(null)
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('id')
    setSearchParams(newParams, { replace: true })
  }

  // 권한 변경
  const handleEdit = (user: Omit<User, 'password'>) => {
    setEditingUser(user)
    setRoleChangeModalOpen(true)
  }

  const handleRoleChange = async (
    userId: string,
    newRole: UserRole,
    adminLevel?: AdminLevel,
    adminRole?: AdminRole, // 하위 호환성
    programRole?: ProgramRole,
    adminProgramRole?: AdminProgramRole // 하위 호환성
  ) => {
    try {
      // Phase 0.1.1: adminLevel, programRole 우선 사용
      await changeUserRole(
        userId,
        newRole,
        adminLevel,
        adminRole,
        programRole,
        adminProgramRole
      )
      showSuccessMessage('권한이 변경되었습니다.')
      setRoleChangeModalOpen(false)
      setEditingUser(null)
      // 목록 새로고침
      await loadUsers()
    } catch (error) {
      handleError(error, { defaultMessage: '권한 변경에 실패했습니다' })
    }
  }

  const handleRoleChangeCancel = () => {
    setRoleChangeModalOpen(false)
    setEditingUser(null)
  }

  return (
    <div>
      <Space className="user-list-header">
        <h1 className="user-list-title">{categoryName}</h1>
      </Space>

      <Space className="user-list-filters" size="middle">
        <Search
          placeholder="이름 또는 이메일 검색"
          allowClear
          className="user-list-search"
          defaultValue={searchQuery}
          onSearch={handleSearch}
        />
        <Select
          placeholder="권한 필터"
          className="user-list-role-filter"
          value={roleFilter}
          onChange={handleRoleFilterChange}
        >
          <Option value="ALL">전체</Option>
          <Option value="ADMIN">관리자</Option>
          <Option value="INSTRUCTOR">강사</Option>
          <Option value="INDIVIDUAL">개인(참여자)</Option>
          <Option value="SCHOOL">학교</Option>
          {/* 하위 호환성 */}
          <Option value="STUDENT">수강자 (구)</Option>
        </Select>
        <Button onClick={loadUsers}>새로고침</Button>
      </Space>

      <UserList
        data={users}
        loading={loading}
        onView={handleView}
        onEdit={handleEdit}
      />

      <UserDetailDrawer
        open={drawerOpen}
        user={selectedUser}
        onClose={handleDrawerClose}
        onEdit={handleEdit}
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

