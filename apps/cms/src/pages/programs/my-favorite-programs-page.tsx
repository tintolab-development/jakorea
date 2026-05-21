/**
 * 관심 프로그램 목록 페이지 (강사/봉사자용)
 * Phase 5.2.6: 관심 프로그램 관리
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { Select, Space, Card, Tag, Button, Table, Empty } from 'antd'
import { ProgramCategoryBadge } from '@/shared/components/program-category-badge'
import type { ColumnsType } from 'antd/es/table'
import { LabeledSearchInput } from '@/shared/ui/labeled-search-input'
import { HeartFilled } from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  getFavoritePrograms,
  removeFavoriteProgram,
  type FavoriteProgram,
  type FavoriteProgramFilters,
} from '@/entities/program/api/favorite-program-service'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import dayjs from 'dayjs'
import { getCommonStatusLabel, getCommonStatusColor } from '@/shared/constants/status'

const { Option } = Select

export function MyFavoriteProgramsPage() {
  const { user } = useAuthStore()
  const location = useLocation()
  const { params, setParams } = useQueryParams<{
    status?: string
    category?: string
    search?: string
  }>()
  const [programs, setPrograms] = useState<FavoriteProgram[]>([])
  const [loading, setLoading] = useState(false)

  // 카테고리명 가져오기
  const categoryName = getCategoryNameByPath(location.pathname, 3) || '관심 프로그램 관리'

  // 필터 값 (쿼리 파라미터에서 읽기)
  const filters = useMemo<FavoriteProgramFilters>(() => {
    return {
      status: (params.status as FavoriteProgramFilters['status']) || 'all',
      category: (params.category as FavoriteProgramFilters['category']) || 'all',
      search: params.search || '',
    }
  }, [params])

  const loadPrograms = useCallback(
    async (userId: string) => {
      setLoading(true)
      try {
        const data = await getFavoritePrograms(userId, filters)
        setPrograms(data)
      } catch (error) {
        console.error('관심 프로그램 로드 실패:', error)
        } finally {
        setLoading(false)
      }
    },
    [filters]
  )

  useEffect(() => {
    const userId = user?.instructorId || user?.id
    if (userId) {
      loadPrograms(userId)
    }
  }, [user, loadPrograms])

  const handleStatusChange = (value: FavoriteProgramFilters['status']) => {
    setParams({
      status: !value || value === 'all' ? undefined : value,
    })
  }

  const handleCategoryChange = (value: FavoriteProgramFilters['category']) => {
    setParams({
      category: !value || value === 'all' ? undefined : value,
    })
  }

  const handleSearchChange = (value: string) => {
    setParams({
      search: value.trim() || undefined,
    })
  }

  const handleRemoveFavorite = async (programId: string) => {
    const userId = user?.instructorId || user?.id
    if (!userId) return

    try {
      await removeFavoriteProgram(userId, programId)
      await loadPrograms(userId) // 목록 새로고침
    } catch (error) {
      console.error('관심 프로그램 해제 실패:', error)
      }
  }

  const getProgramStatus = (program: FavoriteProgram) => {
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

  const columns: ColumnsType<FavoriteProgram> = [
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
      width: 120,
      render: (category: string) => <ProgramCategoryBadge category={category} />,
    },
    {
      title: '상태',
      key: 'status',
      width: 120,
      render: (_, record) => {
        const status = getProgramStatus(record)
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
      title: '관심 등록일',
      dataIndex: 'favoritedAt',
      key: 'favoritedAt',
      width: 150,
      render: (date: string) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '관심 해제',
      key: 'remove',
      width: 100,
      fixed: 'right' as const,
      render: (_, record) => (
        <Button
          type="text"
          danger
          icon={<HeartFilled style={{ color: '#ff4d4f' }} />}
          onClick={event => {
            event.stopPropagation()
            handleRemoveFavorite(record.id)
          }}
        >
          해제
        </Button>
      ),
    },
  ]

  if (!user?.id) {
    return (
      <div>
        <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
        <Empty description="로그인이 필요합니다." />
      </div>
    )
  }

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <Space size="middle" wrap align="start">
          <LabeledSearchInput
            label="프로그램명"
            placeholder="프로그램명을 입력하세요"
            value={filters.search || ''}
            onChange={handleSearchChange}
            width={300}
          />
          <Select
            placeholder="상태 필터"
            style={{ width: 150 }}
            value={filters.status}
            onChange={handleStatusChange}
          >
            <Option value="all">전체</Option>
            <Option value="active">진행중</Option>
            <Option value="scheduled">진행 예정</Option>
            <Option value="completed">진행완료</Option>
          </Select>
          <Select
            placeholder="카테고리"
            style={{ width: 150 }}
            value={filters.category}
            onChange={value => handleCategoryChange(value as FavoriteProgramFilters['category'])}
          >
            <Option value="all">전체</Option>
            <Option value="school">학교 프로그램</Option>
            <Option value="individual">개인 프로그램</Option>
          </Select>
          <Button
            onClick={() => setParams({ status: undefined, category: undefined, search: undefined })}
          >
            필터 초기화
          </Button>
        </Space>
      </Card>

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
        locale={{
          emptyText: <Empty description="관심 등록한 프로그램이 없습니다." />,
        }}
      />
    </div>
  )
}

export default MyFavoriteProgramsPage
