/**
 * 봉사단 관리 - 봉사자 목록 페이지
 * Phase: 관리자 페이지 카테고리 정리 및 뎁스 변경
 */

import { useState, useMemo } from 'react'
import { Space, Select, Input, Button } from 'antd'
import { useSearchParams, useLocation } from 'react-router-dom'
import { VolunteerList } from '@/features/volunteer/ui/volunteer-list'
import { UserDetailDrawer } from '@/features/user/ui/user-detail-drawer'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { mockUsers } from '@/data/mock/users'
import type { User, InterviewStatus } from '@/types/user'

const { Option } = Select
const { Search } = Input

export function VolunteerListPage() {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  
  // 2뎁스 카테고리명 가져오기
  const categoryName = getCategoryNameByPath(location.pathname, 2) || '봉사자'
  
  // 상태 관리
  const [selectedUser, setSelectedUser] = useState<Omit<User, 'password'> | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [loading] = useState(false)

  // 쿼리 파라미터에서 필터 값 읽기
  const interviewStatusFilter = useMemo(() => {
    return (searchParams.get('interviewStatus') || 'ALL') as InterviewStatus | 'ALL'
  }, [searchParams])

  const isActiveFilter = useMemo(() => {
    const value = searchParams.get('isActive')
    if (value === 'true') return true
    if (value === 'false') return false
    return 'ALL' as const
  }, [searchParams])

  const searchQuery = useMemo(() => {
    return searchParams.get('search') || ''
  }, [searchParams])

  // 봉사자 목록 필터링
  const filteredVolunteers = useMemo(() => {
    let volunteers = mockUsers
      .filter(user => user.role === 'VOLUNTEER')
      .map(user => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...userWithoutPassword } = user
        return userWithoutPassword
      })

    // 면접 상태 필터
    if (interviewStatusFilter !== 'ALL') {
      volunteers = volunteers.filter(user => user.interviewStatus === interviewStatusFilter)
    }

    // 활성화 상태 필터
    if (isActiveFilter !== 'ALL') {
      volunteers = volunteers.filter(user => user.isActive === isActiveFilter)
    }

    // 검색 필터 (이름, 이메일)
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase()
      volunteers = volunteers.filter(
        user =>
          user.name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
      )
    }

    return volunteers
  }, [interviewStatusFilter, isActiveFilter, searchQuery])

  // 필터 변경 핸들러
  const handleInterviewStatusFilterChange = (value: InterviewStatus | 'ALL') => {
    const newParams = new URLSearchParams(searchParams)
    if (value === 'ALL') {
      newParams.delete('interviewStatus')
    } else {
      newParams.set('interviewStatus', value)
    }
    setSearchParams(newParams, { replace: true })
  }

  const handleIsActiveFilterChange = (value: boolean | 'ALL') => {
    const newParams = new URLSearchParams(searchParams)
    if (value === 'ALL') {
      newParams.delete('isActive')
    } else {
      newParams.set('isActive', String(value))
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

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>{categoryName}</h1>
      </Space>

      <Space style={{ marginBottom: 16 }} size="middle">
        <Search
          placeholder="이름 또는 이메일 검색"
          allowClear
          style={{ width: 300 }}
          defaultValue={searchQuery}
          onSearch={handleSearch}
        />
        <Select
          placeholder="면접 상태"
          style={{ width: 150 }}
          value={interviewStatusFilter}
          onChange={handleInterviewStatusFilterChange}
        >
          <Option value="ALL">전체</Option>
          <Option value="NOT_REQUIRED">면접 불필요</Option>
          <Option value="PENDING">면접 필요</Option>
          <Option value="SCHEDULED">면접 예정</Option>
          <Option value="COMPLETED">면접 완료</Option>
          <Option value="APPROVED">승인 완료</Option>
          <Option value="REJECTED">반려</Option>
        </Select>
        <Select
          placeholder="활성화 상태"
          style={{ width: 150 }}
          value={isActiveFilter}
          onChange={handleIsActiveFilterChange}
        >
          <Option value="ALL">전체</Option>
          <Option value={true}>활성</Option>
          <Option value={false}>비활성</Option>
        </Select>
        <Button onClick={() => setSearchParams({}, { replace: true })}>필터 초기화</Button>
      </Space>

      <VolunteerList
        data={filteredVolunteers}
        loading={loading}
        onView={handleView}
      />

      <UserDetailDrawer
        open={drawerOpen}
        user={selectedUser}
        onClose={handleDrawerClose}
      />
    </div>
  )
}
