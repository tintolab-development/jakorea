/**
 * 본인 프로그램 목록 페이지 (강사/봉사자용)
 * Phase 5.2.2: 본인 프로그램 조회
 */

import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Input, Select, Space, Card, Tag, Button, Table, Empty } from 'antd'
import { HeartOutlined, HeartFilled } from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getMyPrograms, type MyProgram, type MyProgramFilters } from '@/entities/program/api/instructor-program-service'
import dayjs from 'dayjs'
import { getCommonStatusLabel, getCommonStatusColor } from '@/shared/constants/status'

const { Option } = Select
const { Search } = Input

export function MyProgramListPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [programs, setPrograms] = useState<MyProgram[]>([])
  const [loading, setLoading] = useState(false)
  const [favorites, setFavorites] = useState<Set<string>>(new Set()) // 찜하기 상태 (Mock)

  // 필터 값 (쿼리 파라미터에서 읽기)
  const filters = useMemo<MyProgramFilters>(() => {
    return {
      status: (searchParams.get('status') as MyProgramFilters['status']) || 'all',
      category: (searchParams.get('category') as MyProgramFilters['category']) || 'all',
      search: searchParams.get('search') || undefined,
    }
  }, [searchParams])

  useEffect(() => {
    if (user?.instructorId) {
      loadPrograms()
    }
  }, [user?.instructorId, filters])

  const loadPrograms = async () => {
    if (!user?.instructorId) return

    setLoading(true)
    try {
      const data = await getMyPrograms(user.instructorId, filters)
      setPrograms(data)
    } catch (error) {
      console.error('프로그램 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (value: MyProgramFilters['status']) => {
    const newParams = new URLSearchParams(searchParams)
    if (!value || value === 'all') {
      newParams.delete('status')
    } else {
      newParams.set('status', value)
    }
    setSearchParams(newParams, { replace: true })
  }

  const handleCategoryChange = (value: MyProgramFilters['category']) => {
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

  const handleToggleFavorite = (programId: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev)
      if (newSet.has(programId)) {
        newSet.delete(programId)
      } else {
        newSet.add(programId)
      }
      return newSet
    })
    // 실제로는 API 호출 필요
  }

  const handleViewProgram = (program: MyProgram) => {
    navigate(`/programs/my/${program.id}`)
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
    return { label: getCommonStatusLabel(program.status), color: getCommonStatusColor(program.status) }
  }

  const columns = [
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
        <Tag color={category === 'school' ? 'blue' : 'purple'}>
          {category === 'school' ? '학교 프로그램' : '개인 프로그램'}
        </Tag>
      ),
    },
    {
      title: '상태',
      key: 'status',
      width: 120,
      render: (_: any, record: MyProgram) => {
        const status = getProgramStatus(record)
        return <Tag color={status.color}>{status.label}</Tag>
      },
    },
    {
      title: '진행 기간',
      key: 'period',
      width: 200,
      render: (_: any, record: MyProgram) => {
        const start = typeof record.startDate === 'string' ? dayjs(record.startDate) : dayjs(record.startDate)
        const end = typeof record.endDate === 'string' ? dayjs(record.endDate) : dayjs(record.endDate)
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
      render: (_: any, record: MyProgram) => record.schedules.length,
    },
    {
      title: '찜하기',
      key: 'favorite',
      width: 100,
      fixed: 'right' as const,
      render: (_: any, record: MyProgram) => (
        <Button
          type="text"
          icon={favorites.has(record.id) ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
          onClick={() => handleToggleFavorite(record.id)}
        />
      ),
    },
  ]

  if (!user?.instructorId) {
    return (
      <div>
        <h1>본인 프로그램</h1>
        <Empty description="강사 정보가 없습니다." />
      </div>
    )
  }

  return (
    <div>
      <h1 style={{ marginBottom: 24 }}>본인 프로그램</h1>

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
            onChange={(value) => handleCategoryChange(value as MyProgramFilters['category'])}
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
          pageSize: 10,
          showSizeChanger: true,
          showTotal: total => `총 ${total}개`,
        }}
        scroll={{ x: 1200 }}
      />
    </div>
  )
}

