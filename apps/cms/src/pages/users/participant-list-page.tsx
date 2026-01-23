/**
 * 참여자 조회 페이지
 * Phase 4.1: 참여자 조회/다운로드 (프로그램별) (FR-F00)
 */

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Space, Select, Input, Button } from 'antd'
import { useLocation } from 'react-router-dom'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { ParticipantList } from '@/features/participant/ui/participant-list'
import { getParticipants, type ParticipantListFilters } from '@/entities/participant/api/participant-service'
import { programService } from '@/entities/program/api/program-service'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { handleError } from '@/shared/utils/error-handler'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import type { Application } from '@/types/domain'

interface ParticipantListQueryParams extends Record<string, string | undefined> {
  programId?: string
  role?: 'INDIVIDUAL' | 'SCHOOL' | 'ALL'
  status?: Application['status'] | 'ALL'
  search?: string
}
import './participant-list-page.css'

const { Option } = Select
const { Search } = Input

export function ParticipantListPage() {
  const location = useLocation()
  const { params, setParam } = useQueryParams<ParticipantListQueryParams>()
  const { user } = useAuthStore()

  // 2뎁스 카테고리명 가져오기
  const categoryName = getCategoryNameByPath(location.pathname, 2) || '참여자 조회'

  // 상태 관리
  const [participants, setParticipants] = useState<
    Awaited<ReturnType<typeof getParticipants>>
  >([])
  const [loading, setLoading] = useState(false)

  // 쿼리 파라미터에서 필터 값 읽기
  const programId = useMemo(() => {
    return params.programId || undefined
  }, [params.programId])

  const roleFilter = useMemo(() => {
    return (params.role || 'ALL') as 'INDIVIDUAL' | 'SCHOOL' | 'ALL'
  }, [params.role])

  const statusFilter = useMemo(() => {
    return (params.status || 'ALL') as Application['status'] | 'ALL'
  }, [params.status])

  const searchQuery = useMemo(() => {
    return params.search || ''
  }, [params.search])

  // 프로그램 목록 조회
  const programs = programService.getAllSync()

  // 참여자 목록 조회
  const loadParticipants = useCallback(async () => {
    setLoading(true)
    try {
      const filters: ParticipantListFilters = {}
      if (programId) filters.programId = programId
      if (roleFilter !== 'ALL') filters.role = roleFilter
      if (statusFilter !== 'ALL') filters.status = statusFilter
      if (searchQuery) filters.keyword = searchQuery

      const data = await getParticipants(filters)
      setParticipants(data)
    } catch (error) {
      handleError(error, { defaultMessage: '참여자 목록을 불러오는데 실패했습니다' })
    } finally {
      setLoading(false)
    }
  }, [programId, roleFilter, statusFilter, searchQuery])

  // 페이지 로드 시 및 필터 변경 시 자동으로 데이터 불러오기
  useEffect(() => {
    loadParticipants()
  }, [loadParticipants])

  // 필터 변경 핸들러
  const handleProgramFilterChange = (value: string) => {
    if (value === 'ALL') {
      setParam('programId', null)
    } else {
      setParam('programId', value)
    }
  }

  const handleRoleFilterChange = (value: 'INDIVIDUAL' | 'SCHOOL' | 'ALL') => {
    if (value === 'ALL') {
      setParam('role', null)
    } else {
      setParam('role', value)
    }
  }

  const handleStatusFilterChange = (value: Application['status'] | 'ALL') => {
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
      <Space className="participant-list-header">
        <h1 className="participant-list-title">{categoryName}</h1>
      </Space>

      <Space className="participant-list-filters" size="middle" wrap>
        <Search
          placeholder="이름 또는 이메일 검색"
          allowClear
          className="participant-list-search"
          defaultValue={searchQuery}
          onSearch={handleSearch}
          style={{ width: 250 }}
        />
        <Select
          placeholder="프로그램 선택"
          className="participant-list-program-filter"
          value={programId || 'ALL'}
          onChange={handleProgramFilterChange}
          style={{ width: 200 }}
        >
          <Option value="ALL">전체 프로그램</Option>
          {programs.map(program => (
            <Option key={program.id} value={program.id}>
              {program.title}
            </Option>
          ))}
        </Select>
        <Select
          placeholder="역할 필터"
          className="participant-list-role-filter"
          value={roleFilter}
          onChange={handleRoleFilterChange}
          style={{ width: 150 }}
        >
          <Option value="ALL">전체</Option>
          <Option value="INDIVIDUAL">개인</Option>
          <Option value="SCHOOL">학교</Option>
        </Select>
        <Select
          placeholder="상태 필터"
          className="participant-list-status-filter"
          value={statusFilter}
          onChange={handleStatusFilterChange}
          style={{ width: 150 }}
        >
          <Option value="ALL">전체</Option>
          <Option value="submitted">접수</Option>
          <Option value="reviewing">검토중</Option>
          <Option value="approved">승인</Option>
          <Option value="rejected">반려</Option>
          <Option value="cancelled">취소</Option>
        </Select>
        <Button onClick={loadParticipants}>새로고침</Button>
      </Space>

      <ParticipantList
        data={participants}
        loading={loading}
        programId={programId}
        currentUser={user}
      />
    </div>
  )
}
