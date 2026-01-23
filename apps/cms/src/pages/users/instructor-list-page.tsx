/**
 * 강사 조회 페이지
 * Phase 4.1: 강사 조회/다운로드 (필라별) (FR-F00)
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Space, Select, Input, Button } from 'antd'
import { useLocation } from 'react-router-dom'
import { useQueryParams } from '@/shared/hooks/use-query-params'

interface InstructorListQueryParams extends Record<string, string | undefined> {
  pillar?: string
  status?: 'ACTIVE' | 'INACTIVE' | 'ALL'
  search?: string
}
import { InstructorList } from '@/features/instructor-list/ui/instructor-list'
import { getInstructors, type InstructorListFilters } from '@/entities/instructor/api/instructor-list-service'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { handleError } from '@/shared/utils/error-handler'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import './instructor-list-page.css'

const { Option } = Select
const { Search } = Input

export function InstructorListPage() {
  const location = useLocation()
  const { params, setParam } = useQueryParams<InstructorListQueryParams>()
  const { user } = useAuthStore()

  // 2뎁스 카테고리명 가져오기
  const categoryName = getCategoryNameByPath(location.pathname, 2) || '강사 조회'

  // 필라 목록 (동적으로 가져오기)
  const [pillars, setPillars] = useState<string[]>([])
  useEffect(() => {
    const loadPillars = async () => {
      const { getInstructors } = await import('@/entities/instructor/api/instructor-list-service')
      const allInstructors = await getInstructors()
      const uniquePillars = Array.from(
        new Set(allInstructors.map(inst => inst.pillar).filter(Boolean))
      ).sort() as string[]
      setPillars(uniquePillars)
    }
    loadPillars()
  }, [])

  // 상태 관리
  const [instructors, setInstructors] = useState<
    Awaited<ReturnType<typeof getInstructors>>
  >([])
  const [loading, setLoading] = useState(false)

  // 쿼리 파라미터에서 필터 값 읽기
  const pillarFilter = useMemo(() => {
    return params.pillar || undefined
  }, [params.pillar])

  const statusFilter = useMemo(() => {
    return (params.status || 'ALL') as 'ACTIVE' | 'INACTIVE' | 'ALL'
  }, [params.status])

  const searchQuery = useMemo(() => {
    return params.search || ''
  }, [params.search])

  // 강사 목록 조회
  const loadInstructors = useCallback(async () => {
    setLoading(true)
    try {
      const filters: InstructorListFilters = {}
      if (pillarFilter) filters.pillar = pillarFilter
      if (statusFilter !== 'ALL') filters.status = statusFilter
      if (searchQuery) filters.keyword = searchQuery

      const data = await getInstructors(filters)
      setInstructors(data)
    } catch (error) {
      handleError(error, { defaultMessage: '강사 목록을 불러오는데 실패했습니다' })
    } finally {
      setLoading(false)
    }
  }, [pillarFilter, statusFilter, searchQuery])

  // 페이지 로드 시 및 필터 변경 시 자동으로 데이터 불러오기
  useEffect(() => {
    loadInstructors()
  }, [loadInstructors])

  // 필터 변경 핸들러
  const handlePillarFilterChange = (value: string) => {
    if (value === 'ALL') {
      setParam('pillar', null)
    } else {
      setParam('pillar', value)
    }
  }

  const handleStatusFilterChange = (value: 'ACTIVE' | 'INACTIVE' | 'ALL') => {
    if (value === 'ALL') {
      setParam('status', null)
    } else {
      setParam('status', value)
    }
  }

  const handleSearch = (value: string) => {
    setParam('search', value || null)
  }

  return (
    <div>
      <Space className="instructor-list-header">
        <h1 className="instructor-list-title">{categoryName}</h1>
      </Space>

      <Space className="instructor-list-filters" size="middle" wrap>
        <Search
          placeholder="이름, 이메일 또는 전문분야 검색"
          allowClear
          className="instructor-list-search"
          defaultValue={searchQuery}
          onSearch={handleSearch}
          style={{ width: 250 }}
        />
        <Select
          placeholder="필라 선택"
          className="instructor-list-pillar-filter"
          value={pillarFilter || 'ALL'}
          onChange={handlePillarFilterChange}
          style={{ width: 200 }}
          loading={pillars.length === 0}
        >
          <Option value="ALL">전체 필라</Option>
          {pillars.map(pillar => (
            <Option key={pillar} value={pillar}>
              {pillar}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="상태 필터"
          className="instructor-list-status-filter"
          value={statusFilter}
          onChange={handleStatusFilterChange}
          style={{ width: 150 }}
        >
          <Option value="ALL">전체</Option>
          <Option value="ACTIVE">활성</Option>
          <Option value="INACTIVE">비활성</Option>
        </Select>
        <Button onClick={loadInstructors}>새로고침</Button>
      </Space>

      <InstructorList
        data={instructors}
        loading={loading}
        currentUser={user}
      />
    </div>
  )
}
