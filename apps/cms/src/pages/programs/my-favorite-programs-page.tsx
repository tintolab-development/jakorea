/**
 * 관심 프로그램 목록 페이지 (강사/봉사자용)
 * Phase 5.2.6: 관심 프로그램 관리
 */

import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom'
import { Input, Select, Space, Card, Tag, Button, Table, Empty } from 'antd'
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
const { Search } = Input

export function MyFavoriteProgramsPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [programs, setPrograms] = useState<FavoriteProgram[]>([])
  const [loading, setLoading] = useState(false)
  
  // 카테고리명 가져오기
  const categoryName = getCategoryNameByPath(location.pathname, 2) || '관심 프로그램 관리'

  // 필터 값 (쿼리 파라미터에서 읽기)
  const filters = useMemo<FavoriteProgramFilters>(() => {
    return {
      status: (searchParams.get('status') as FavoriteProgramFilters['status']) || 'all',
      category: (searchParams.get('category') as FavoriteProgramFilters['category']) || 'all',
      search: searchParams.get('search') || undefined,
    }
  }, [searchParams])

  useEffect(() => {
    if (user?.id) {
      loadPrograms()
    }
  }, [user?.id, filters])

  const loadPrograms = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const data = await getFavoritePrograms(user.id, filters)
      setPrograms(data)
    } catch (error) {
      console.error('관심 프로그램 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (value: FavoriteProgramFilters['status']) => {
    const newParams = new URLSearchParams(searchParams)
    if (!value || value === 'all') {
      newParams.delete('status')
    } else {
      newParams.set('status', value)
    }
    setSearchParams(newParams, { replace: true })
  }

  const handleCategoryChange = (value: FavoriteProgramFilters['category']) => {
    const newParams = new URLSearchParams(searchParams)
    if (!value || value === 'all') {
      newParams.delete('category')
    } else {
      newParams.set('category', value)
    }
    setSearchParams(newParams, { replace: true })
  }

  const handleSearch = (value: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (!value) {
      newParams.delete('search')
    } else {
      newParams.set('search', value)
    }
    setSearchParams(newParams, { replace: true })
  }

  const handleRemoveFavorite = async (programId: string) => {
    if (!user?.id) return

    try {
      await removeFavoriteProgram(user.id, programId)
      await loadPrograms() // 목록 새로고침
    } catch (error) {
      console.error('관심 프로그램 해제 실패:', error)
    }
  }

  const handleViewProgram = (program: FavoriteProgram) => {
    // 본인 프로그램이면 본인 프로그램 상세로, 아니면 일반 프로그램 상세로
    if (user?.instructorId) {
      navigate(`/programs/my/active/${program.id}`)
    } else {
      navigate(`/programs/${program.id}`)
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
    return { label: getCommonStatusLabel(program.status), color: getCommonStatusColor(program.status) }
  }

  const columns = [
    {
      title: '프로그램명',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      fixed: 'left' as const,
      render: (title: string, record: FavoriteProgram) => (
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
        <Tag color={category === 'school' ? 'blue' : 'purple'}>
          {category === 'school' ? '학교 프로그램' : '개인 프로그램'}
        </Tag>
      ),
    },
    {
      title: '상태',
      key: 'status',
      width: 120,
      render: (_: any, record: FavoriteProgram) => {
        const status = getProgramStatus(record)
        return <Tag color={status.color}>{status.label}</Tag>
      },
    },
    {
      title: '진행 기간',
      key: 'period',
      width: 200,
      render: (_: any, record: FavoriteProgram) => {
        const start = typeof record.startDate === 'string' ? dayjs(record.startDate) : dayjs(record.startDate)
        const end = typeof record.endDate === 'string' ? dayjs(record.endDate) : dayjs(record.endDate)
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
      render: (_: any, record: FavoriteProgram) => (
        <Button
          type="text"
          danger
          icon={<HeartFilled style={{ color: '#ff4d4f' }} />}
          onClick={() => handleRemoveFavorite(record.id)}
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
      <h1 style={{ ...PAGE_HEADER_STYLE, marginBottom: 24 }}>{categoryName}</h1>

      <Card style={{ marginBottom: 16 }}>
        <Space size="middle" wrap>
          <Search
            placeholder="프로그램명 검색"
            allowClear
            style={{ width: 250 }}
            defaultValue={filters.search}
            onSearch={handleSearch}
            enterButton
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
            onChange={(value) => handleCategoryChange(value as FavoriteProgramFilters['category'])}
          >
            <Option value="all">전체</Option>
            <Option value="school">학교 프로그램</Option>
            <Option value="individual">개인 프로그램</Option>
          </Select>
          <Button onClick={() => setSearchParams({}, { replace: true })}>필터 초기화</Button>
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

