/**
 * 수강자 수강 프로그램 목록 컴포넌트
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, Tag, Button, Table, Empty } from 'antd'
import { ProgramCategoryBadge } from '@/shared/components/program-category-badge'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'
import { HeartOutlined, HeartFilled } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getStudentEnrolledPrograms } from '@/data/mock'
import {
  addFavoriteProgram,
  removeFavoriteProgram,
  isFavoriteProgram,
} from '@/entities/program/api/favorite-program-service'
import { ProgramDetailDrawer } from '@/features/program/ui/program-detail-drawer'
import { getCommonStatusLabel, getCommonStatusColor } from '@/shared/constants/status'
import type { Program } from '@/types/domain'

type ProgramStatusFilter = 'all' | 'active' | 'scheduled' | 'completed'
type ProgramCategoryFilter = 'all' | 'individual' | 'school'

export function MyEnrolledProgramList() {
  const { user } = useAuthStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // 필터 상태 관리 (조회 버튼 클릭 전까지 임시 저장)
  const [pendingFilters, setPendingFilters] = useState<{
    search?: string
    status?: ProgramStatusFilter
    category?: ProgramCategoryFilter
  }>({
    search: searchParams.get('search') || '',
    status: (searchParams.get('status') as ProgramStatusFilter) || 'all',
    category: (searchParams.get('category') as ProgramCategoryFilter) || 'all',
  })

  // 활성 필터 (조회 버튼 클릭 시 적용)
  const [activeFilters, setActiveFilters] = useState<{
    status: ProgramStatusFilter
    category: ProgramCategoryFilter
    search: string
  }>(() => ({
    status: (searchParams.get('status') as ProgramStatusFilter) || 'all',
    category: (searchParams.get('category') as ProgramCategoryFilter) || 'all',
    search: searchParams.get('search') || '',
  }))

  const filters = useMemo(() => activeFilters, [activeFilters])

  const loadPrograms = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const allPrograms = getStudentEnrolledPrograms(user.id)
      let filtered = allPrograms

      if (filters.status !== 'all') {
        const now = dayjs()
        filtered = filtered.filter(program => {
          const startDate = dayjs(program.startDate)
          const endDate = dayjs(program.endDate)

          if (filters.status === 'completed') {
            return program.status === 'completed' || now.isAfter(endDate)
          }
          if (filters.status === 'scheduled') {
            return now.isBefore(startDate)
          }
          if (filters.status === 'active') {
            return now.isAfter(startDate) && now.isBefore(endDate)
          }
          return true
        })
      }

      if (filters.category !== 'all') {
        filtered = filtered.filter(program => program.category === filters.category)
      }

      if (filters.search.trim()) {
        const query = filters.search.trim().toLowerCase()
        filtered = filtered.filter(program => program.title.toLowerCase().includes(query))
      }

      setPrograms(filtered)
    } catch (error) {
      console.error('수강 프로그램 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }, [filters, user?.id])

  const loadFavorites = useCallback(
    async (userId: string) => {
      if (programs.length === 0) return

      try {
        const favoriteStatuses = await Promise.all(
          programs.map(p => isFavoriteProgram(userId, p.id))
        )
        const favoriteSet = new Set<string>()
        programs.forEach((p, index) => {
          if (favoriteStatuses[index]) {
            favoriteSet.add(p.id)
          }
        })
        setFavorites(favoriteSet)
      } catch (error) {
        console.error('관심 프로그램 로드 실패:', error)
      }
    },
    [programs]
  )

  useEffect(() => {
    if (user?.id) {
      loadPrograms()
    }
  }, [user?.id, loadPrograms])

  useEffect(() => {
    if (user?.id && programs.length > 0) {
      loadFavorites(user.id)
    }
  }, [user?.id, programs, loadFavorites])

  // 조회 버튼 클릭 핸들러
  const handleSearch = useCallback(() => {
    setActiveFilters(pendingFilters as typeof activeFilters)
    const nextParams = new URLSearchParams()
    if (pendingFilters.status && pendingFilters.status !== 'all') {
      nextParams.set('status', pendingFilters.status)
    }
    if (pendingFilters.category && pendingFilters.category !== 'all') {
      nextParams.set('category', pendingFilters.category)
    }
    if (pendingFilters.search?.trim()) {
      nextParams.set('search', pendingFilters.search.trim())
    }
    setSearchParams(nextParams, { replace: true })
  }, [pendingFilters, setSearchParams])

  // 필터 초기화 핸들러
  const handleFilterReset = useCallback(() => {
    const resetFilters = {
      search: '',
      status: 'all' as ProgramStatusFilter,
      category: 'all' as ProgramCategoryFilter,
    }
    setPendingFilters(resetFilters)
    setActiveFilters(resetFilters)
    setSearchParams({}, { replace: true })
  }, [setSearchParams])

  const handleToggleFavorite = async (programId: string) => {
    const userId = user?.id
    if (!userId) return

    const isFavorite = favorites.has(programId)

    try {
      if (isFavorite) {
        await removeFavoriteProgram(userId, programId)
      } else {
        await addFavoriteProgram(userId, programId)
      }

      setFavorites(prev => {
        const next = new Set(prev)
        if (isFavorite) {
          next.delete(programId)
        } else {
          next.add(programId)
        }
        return next
      })
    } catch (error) {
      console.error('관심 프로그램 토글 실패:', error)
    }
  }

  const handleViewProgram = (program: Program) => {
    setSelectedProgram(program)
    setDrawerOpen(true)
  }

  const getProgramStatus = (program: Program) => {
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

  const columns = [
    {
      title: '프로그램명',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      fixed: 'left' as const,
      render: (title: string) => <span style={{ fontWeight: 500 }}>{title}</span>,
    },
    {
      title: '카테고리',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (category: string) => <ProgramCategoryBadge category={category} />,
    },
    {
      title: '진행 기간',
      key: 'period',
      width: 200,
      render: (_: unknown, record: Program) => {
        const start = dayjs(record.startDate)
        const end = dayjs(record.endDate)
        return `${start.format('YYYY-MM-DD')} ~ ${end.format('YYYY-MM-DD')}`
      },
    },
    {
      title: '상태',
      key: 'status',
      width: 120,
      render: (_: unknown, record: Program) => {
        const status = getProgramStatus(record)
        return <Tag color={status.color}>{status.label}</Tag>
      },
    },
    {
      title: '찜하기',
      key: 'favorite',
      width: 100,
      fixed: 'right' as const,
      render: (_: unknown, record: Program) => (
        <Button
          type="text"
          icon={
            favorites.has(record.id) ? (
              <HeartFilled style={{ color: '#ff4d4f' }} />
            ) : (
              <HeartOutlined />
            )
          }
          onClick={event => {
            event.stopPropagation()
            handleToggleFavorite(record.id)
          }}
        />
      ),
    },
  ]

  if (!user?.id) {
    return (
      <Card>
        <Empty description="로그인이 필요합니다." />
      </Card>
    )
  }

  return (
    <>
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
              { value: 'scheduled', label: '진행 예정' },
              { value: 'active', label: '진행중' },
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
              { value: 'individual', label: '개인 프로그램' },
              { value: 'school', label: '학교 프로그램' },
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

      <Card>
        {programs.length === 0 ? (
          <Empty description="수강한 프로그램이 없습니다." />
        ) : (
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
            onRow={record => ({
              onClick: () => handleViewProgram(record),
              style: { cursor: 'pointer' },
            })}
            scroll={{ x: 1000 }}
          />
        )}
      </Card>

      <ProgramDetailDrawer
        open={drawerOpen}
        program={selectedProgram}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedProgram(null)
        }}
        onEdit={() => {}}
        onDelete={() => {}}
        loading={false}
        hideActions
      />
    </>
  )
}
