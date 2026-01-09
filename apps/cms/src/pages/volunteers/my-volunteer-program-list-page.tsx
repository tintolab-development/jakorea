/**
 * 본인 봉사 프로그램 목록 페이지 (봉사자용)
 * Phase: 봉사단 권한 마이그레이션
 */

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'
import { Input, Select, Space, Card, Tag, Button, Table, Empty } from 'antd'
import { HeartOutlined, HeartFilled } from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getVolunteerPrograms } from '@/data/mock'
import {
  addFavoriteProgram,
  removeFavoriteProgram,
  isFavoriteProgram,
} from '@/entities/program/api/favorite-program-service'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { ProgramDetailDrawer } from '@/features/program/ui/program-detail-drawer'
import dayjs from 'dayjs'
import { getCommonStatusLabel, getCommonStatusColor } from '@/shared/constants/status'
import type { Program } from '@/types/domain'

const { Option } = Select
const { Search } = Input

export function MyVolunteerProgramListPage() {
  const { user } = useAuthStore()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [programs, setPrograms] = useState<Program[]>([])
  const [loading, setLoading] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  
  // 카테고리명 가져오기
  const categoryName = getCategoryNameByPath(location.pathname, 2) || '봉사 프로그램'

  // 필터 값 (쿼리 파라미터에서 읽기)
  const filters = useMemo(() => {
    return {
      status: (searchParams.get('status') as 'all' | 'active' | 'scheduled' | 'completed') || 'all',
      category: (searchParams.get('category') as 'all' | 'individual' | 'school') || 'all',
      search: searchParams.get('search') || undefined,
    }
  }, [searchParams])

  useEffect(() => {
    const userId = user?.instructorId || user?.id
    if (userId) {
      loadPrograms()
    }
  }, [user, filters])

  useEffect(() => {
    const userId = user?.instructorId || user?.id
    if (userId && programs.length > 0) {
      loadFavorites(userId)
    }
  }, [user, programs])

  const loadPrograms = async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      // TODO: API 연동 필요
      // 현재는 mock 데이터 사용
      const allPrograms = getVolunteerPrograms()
      
      // 필터링
      let filtered = allPrograms
      
      // 상태 필터
      if (filters.status !== 'all') {
        const now = dayjs()
        filtered = filtered.filter(p => {
          const startDate = dayjs(p.startDate)
          const endDate = dayjs(p.endDate)
          
          if (filters.status === 'completed') {
            return p.status === 'completed' || now.isAfter(endDate)
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
      
      // 카테고리 필터
      if (filters.category !== 'all') {
        filtered = filtered.filter(p => p.category === filters.category)
      }
      
      // 검색 필터
      if (filters.search) {
        filtered = filtered.filter(p =>
          p.title.toLowerCase().includes(filters.search!.toLowerCase())
        )
      }
      
      setPrograms(filtered)
    } catch (error) {
      console.error('프로그램 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFavorites = async (userId: string) => {
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
  }

  const handleStatusChange = (status: 'all' | 'active' | 'scheduled' | 'completed') => {
    const newParams = new URLSearchParams(searchParams)
    if (status === 'all') {
      newParams.delete('status')
    } else {
      newParams.set('status', status)
    }
    setSearchParams(newParams, { replace: true })
  }

  const handleCategoryChange = (category: 'all' | 'individual' | 'school') => {
    const newParams = new URLSearchParams(searchParams)
    if (category === 'all') {
      newParams.delete('category')
    } else {
      newParams.set('category', category)
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

  const handleToggleFavorite = async (programId: string) => {
    const userId = user?.instructorId || user?.id
    if (!userId) return

    const isFavorite = favorites.has(programId)

    try {
      if (isFavorite) {
        await removeFavoriteProgram(userId, programId)
      } else {
        await addFavoriteProgram(userId, programId)
      }

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
    return { label: getCommonStatusLabel(program.status), color: getCommonStatusColor(program.status) }
  }

  const columns = [
    {
      title: '프로그램명',
      dataIndex: 'title',
      key: 'title',
      width: 250,
      fixed: 'left' as const,
      render: (title: string, record: Program) => (
        <Button
          type="link"
          onClick={() => handleViewProgram(record)}
          style={{ padding: 0, fontWeight: 500 }}
        >
          {title}
        </Button>
      ),
    },
    {
      title: '카테고리',
      dataIndex: 'category',
      key: 'category',
      width: 150,
      render: (category: string) => (
        <Tag color={category === 'school' ? 'blue' : 'purple'}>
          {category === 'school' ? '학교 프로그램' : '개인 프로그램'}
        </Tag>
      ),
    },
    {
      title: '진행 기간',
      key: 'period',
      width: 200,
      render: (_: any, record: Program) => {
        const start = typeof record.startDate === 'string' ? dayjs(record.startDate) : dayjs(record.startDate)
        const end = typeof record.endDate === 'string' ? dayjs(record.endDate) : dayjs(record.endDate)
        return `${start.format('YYYY-MM-DD')} ~ ${end.format('YYYY-MM-DD')}`
      },
    },
    {
      title: '상태',
      key: 'status',
      width: 120,
      render: (_: any, record: Program) => {
        const status = getProgramStatus(record)
        return <Tag color={status.color}>{status.label}</Tag>
      },
    },
    {
      title: '찜하기',
      key: 'favorite',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: Program) => (
        <Button
          type="text"
          icon={favorites.has(record.id) ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
          onClick={() => handleToggleFavorite(record.id)}
        />
      ),
    },
  ]

  if (!user?.id) {
    return (
      <div>
        <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
        <Card>
          <Empty description="로그인이 필요합니다." />
        </Card>
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
            value={filters.status}
            onChange={handleStatusChange}
            style={{ width: 150 }}
          >
            <Option value="all">전체 상태</Option>
            <Option value="scheduled">진행 예정</Option>
            <Option value="active">진행중</Option>
            <Option value="completed">진행완료</Option>
          </Select>
          <Select
            value={filters.category}
            onChange={handleCategoryChange}
            style={{ width: 150 }}
          >
            <Option value="all">전체 카테고리</Option>
            <Option value="individual">개인 프로그램</Option>
            <Option value="school">학교 프로그램</Option>
          </Select>
          <Button onClick={() => setSearchParams({}, { replace: true })}>필터 초기화</Button>
        </Space>
      </Card>

      <Card>
        {programs.length === 0 ? (
          <Empty description="봉사 프로그램이 없습니다." />
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
    </div>
  )
}
