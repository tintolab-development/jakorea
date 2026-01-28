/**
 * 본인 프로그램 목록 페이지 (강사/봉사자용)
 * Phase 5.2.2: 본인 프로그램 조회
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { Tag, Button, Table, Empty, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'
import { HeartOutlined, HeartFilled } from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  getMyPrograms,
  type MyProgram,
  type MyProgramFilters,
} from '@/entities/program/api/instructor-program-service'
import {
  addFavoriteProgram,
  removeFavoriteProgram,
  isFavoriteProgram,
} from '@/entities/program/api/favorite-program-service'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { MESSAGES } from '@/shared/constants'
import dayjs from 'dayjs'
import { getCommonStatusLabel, getCommonStatusColor } from '@/shared/constants/status'
import { StatusBadge } from '@/shared/ui/status-badge'

export function MyProgramListPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const { params, setParams } = useQueryParams<{
    status?: string
    category?: string
    search?: string
  }>()
  const [programs, setPrograms] = useState<MyProgram[]>([])
  const [loading, setLoading] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set()) // 찜하기 상태

  // 카테고리명 가져오기
  const categoryName = getCategoryNameByPath(location.pathname, 2) || '강의 프로그램'

  // 필터 상태 관리 (조회 버튼 클릭 전까지 임시 저장)
  const [pendingFilters, setPendingFilters] = useState<{
    search?: string
    status?: MyProgramFilters['status']
    category?: MyProgramFilters['category']
  }>({
    search: params.search || undefined,
    status: (params.status as MyProgramFilters['status']) || 'all',
    category: (params.category as MyProgramFilters['category']) || 'all',
  })

  // 활성 필터 (조회 버튼 클릭 시 적용)
  const [activeFilters, setActiveFilters] = useState<MyProgramFilters>(() => ({
    status: (params.status as MyProgramFilters['status']) || 'all',
    category: (params.category as MyProgramFilters['category']) || 'all',
    search: params.search || undefined,
  }))

  // 필터 값 (활성 필터 사용)
  const filters = useMemo<MyProgramFilters>(() => activeFilters, [activeFilters])

  // 프로그램 목록에 대한 관심 상태 로드
  const loadFavoritesForPrograms = useCallback(async (programList: MyProgram[], userId: string) => {
    try {
      const favoriteStatuses = await Promise.all(
        programList.map(p => isFavoriteProgram(userId, p.id))
      )
      const favoriteSet = new Set<string>()
      programList.forEach((p, index) => {
        if (favoriteStatuses[index]) {
          favoriteSet.add(p.id)
        }
      })
      setFavorites(favoriteSet)
    } catch (error) {
      console.error('관심 프로그램 상태 로드 실패:', error)
    }
  }, [])

  const loadPrograms = useCallback(
    async (userId: string) => {
      setLoading(true)
      try {
        const data = await getMyPrograms(userId, filters)
        setPrograms(data)
        // 프로그램 로드 후 관심 상태도 로드
        await loadFavoritesForPrograms(data, userId)
      } catch (error) {
        console.error('프로그램 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    },
    [filters, loadFavoritesForPrograms]
  )

  useEffect(() => {
    const userId = user?.instructorId || user?.id
    if (userId) {
      loadPrograms(userId)
    }
  }, [user, loadPrograms])

  // 조회 버튼 클릭 핸들러
  const handleSearch = useCallback(() => {
    setActiveFilters(pendingFilters)
    setParams({
      status:
        pendingFilters.status && pendingFilters.status !== 'all'
          ? pendingFilters.status
          : undefined,
      category:
        pendingFilters.category && pendingFilters.category !== 'all'
          ? pendingFilters.category
          : undefined,
      search: pendingFilters.search || undefined,
    })
  }, [pendingFilters, setParams])

  // 필터 초기화 핸들러
  const handleFilterReset = useCallback(() => {
    const resetFilters = {
      search: undefined,
      status: 'all' as const,
      category: 'all' as const,
    }
    setPendingFilters(resetFilters)
    setActiveFilters(resetFilters)
    setParams({})
  }, [setParams])

  const handleToggleFavorite = async (programId: string) => {
    const userId = user?.instructorId || user?.id
    if (!userId) return

    const isFavorite = favorites.has(programId)

    try {
      if (isFavorite) {
        await removeFavoriteProgram(userId, programId)
        message.success(MESSAGES.success.removedFromFavorites)
      } else {
        await addFavoriteProgram(userId, programId)
        message.success(MESSAGES.success.addedToFavorites)
      }

      // 상태 업데이트
      setFavorites(prev => {
        const newSet = new Set(prev)
        if (isFavorite) {
          newSet.delete(programId)
        } else {
          newSet.add(programId)
        }
        return newSet
      })
    } catch (error) {
      console.error('관심 프로그램 토글 실패:', error)
      message.error(MESSAGES.error.favoriteProgramProcessFailed)
    }
  }

  const handleViewProgram = (program: MyProgram) => {
    navigate(`/programs/my/active/${program.id}`)
  }

  const getProgramStatus = (program: MyProgram) => {
    const now = dayjs()
    const startDate = dayjs(program.startDate)
    const endDate = dayjs(program.endDate)

    if (program.status === 'completed' || now.isAfter(endDate)) {
      return { label: '진행완료', color: 'default' }
    }
    if (now.isBefore(startDate)) {
      return { label: '진행 예정', color: 'blue' }
    }
    if (now.isAfter(startDate) && now.isBefore(endDate)) {
      return { label: '진행중', color: 'green' }
    }
    return {
      label: getCommonStatusLabel(program.status),
      color: getCommonStatusColor(program.status),
    }
  }

  // StatusBadge용 statusConfig 생성
  const programCategoryStatusConfig = {
    school: { label: '학교 프로그램', color: 'blue' },
    individual: { label: '개인 프로그램', color: 'purple' },
  } as const

  const programStatusStatusConfig = {
    completed: { label: '진행완료', color: 'default' },
    planned: { label: '진행 예정', color: 'blue' },
    in_progress: { label: '진행중', color: 'green' },
  } as const

  const columns: ColumnsType<MyProgram> = [
    {
      title: '프로그램명',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      fixed: 'left' as const,
      render: (title: string, record: MyProgram) => (
        <div>
          <Button
            type="link"
            onClick={() => handleViewProgram(record)}
            style={{ padding: 0, fontWeight: 500 }}
          >
            {title}
          </Button>
        </div>
      ),
    },
    {
      title: '카테고리',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category: string) => (
        <StatusBadge
          status={category as keyof typeof programCategoryStatusConfig}
          statusConfig={programCategoryStatusConfig}
          showIcon={false}
        />
      ),
    },
    {
      title: '상태',
      key: 'status',
      width: 120,
      render: (_, record) => {
        const status = getProgramStatus(record)
        // 동적 상태는 StatusBadge 대신 Tag 사용 (statusConfig에 없는 경우)
        const statusKey =
          record.status === 'completed'
            ? 'completed'
            : dayjs().isBefore(dayjs(record.startDate))
              ? 'planned'
              : dayjs().isAfter(dayjs(record.endDate))
                ? 'completed'
                : 'in_progress'
        if (statusKey in programStatusStatusConfig) {
          return (
            <StatusBadge
              status={statusKey as keyof typeof programStatusStatusConfig}
              statusConfig={programStatusStatusConfig}
              showIcon={false}
            />
          )
        }
        return <Tag color={status.color}>{status.label}</Tag>
      },
    },
    {
      title: '진행 기간',
      key: 'period',
      width: 200,
      render: (_, record) => {
        const start =
          typeof record.startDate === 'string' ? dayjs(record.startDate) : dayjs(record.startDate)
        const end =
          typeof record.endDate === 'string' ? dayjs(record.endDate) : dayjs(record.endDate)
        return `${start.format('YYYY-MM-DD')} ~ ${end.format('YYYY-MM-DD')}`
      },
    },
    {
      title: '매칭일',
      dataIndex: 'matchedAt',
      key: 'matchedAt',
      width: 150,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '일정 수',
      key: 'scheduleCount',
      width: 100,
      render: (_, record) => record.schedules.length,
    },
    {
      title: '찜하기',
      key: 'favorite',
      width: 100,
      fixed: 'right' as const,
      render: (_, record) => (
        <Button
          type="text"
          icon={
            favorites.has(record.id) ? (
              <HeartFilled style={{ color: '#ff4d4f' }} />
            ) : (
              <HeartOutlined />
            )
          }
          onClick={() => handleToggleFavorite(record.id)}
        />
      ),
    },
  ]

  if (!user?.instructorId) {
    return (
      <div>
        <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
        <Empty description="강사 정보가 없습니다." />
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ ...PAGE_HEADER_STYLE, marginBottom: 24 }}>{categoryName}</h1>

      <UnifiedFilterCard
        fields={[
          {
            key: 'search',
            type: 'search',
            label: '프로그램명',
            placeholder: '프로그램명을 입력하세요',
          },
          {
            key: 'status',
            type: 'select',
            label: '상태',
            placeholder: '전체',
            options: [
              { value: 'all', label: '전체' },
              { value: 'active', label: '진행중' },
              { value: 'scheduled', label: '진행 예정' },
              { value: 'completed', label: '진행완료' },
            ],
          },
          {
            key: 'category',
            type: 'select',
            label: '카테고리',
            placeholder: '전체',
            options: [
              { value: 'all', label: '전체' },
              { value: 'school', label: '학교 프로그램' },
              { value: 'individual', label: '개인 프로그램' },
            ],
          },
        ]}
        filters={{
          search: pendingFilters.search || '',
          status: pendingFilters.status,
          category: pendingFilters.category,
        }}
        onFilterChange={(key, value) => {
          setPendingFilters(prev => ({ ...prev, [key]: value || undefined }))
        }}
        onSearch={handleSearch}
        onReset={handleFilterReset}
        resetButtonText="초기화"
      />

      <Table
        columns={columns}
        dataSource={programs}
        rowKey="id"
        loading={loading}
        pagination={{
          defaultPageSize: 10,
          showSizeChanger: true,
          showTotal: total => `총 ${total}개`,
        }}
        scroll={{ x: 1200 }}
      />
    </div>
  )
}
