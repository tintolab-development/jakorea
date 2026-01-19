/**
 * 수강자 수강 프로그램 목록 컴포넌트
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Input, Select, Space, Card, Tag, Button, Table, Empty } from 'antd'
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

const { Option } = Select

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

  const filters = useMemo(() => {
    return {
      status: (searchParams.get('status') as ProgramStatusFilter) || 'all',
      category: (searchParams.get('category') as ProgramCategoryFilter) || 'all',
      search: searchParams.get('search') || '',
    }
  }, [searchParams])

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

  const loadFavorites = useCallback(async (userId: string) => {
    if (programs.length === 0) return

    try {
      const favoriteStatuses = await Promise.all(programs.map(p => isFavoriteProgram(userId, p.id)))
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
  }, [programs])

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

  const updateSearchParams = (updater: (next: URLSearchParams) => void) => {
    const nextParams = new URLSearchParams(searchParams)
    updater(nextParams)
    if (nextParams.toString() !== searchParams.toString()) {
      setSearchParams(nextParams, { replace: true })
    }
  }

  const handleStatusChange = (status: ProgramStatusFilter) => {
    updateSearchParams(next => {
      if (status === 'all') {
        next.delete('status')
      } else {
        next.set('status', status)
      }
    })
  }

  const handleCategoryChange = (category: ProgramCategoryFilter) => {
    updateSearchParams(next => {
      if (category === 'all') {
        next.delete('category')
      } else {
        next.set('category', category)
      }
    })
  }

  const handleSearchChange = (value: string) => {
    updateSearchParams(next => {
      const trimmed = value.trim()
      if (!trimmed) {
        next.delete('search')
      } else {
        next.set('search', trimmed)
      }
    })
  }

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
    return { label: getCommonStatusLabel(program.status), color: getCommonStatusColor(program.status) }
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
          icon={favorites.has(record.id) ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
          onClick={(event) => {
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
      <Card style={{ marginBottom: 16 }}>
        <Space size="middle" wrap>
          <Input
            placeholder="프로그램명 검색"
            allowClear
            style={{ width: 250 }}
            value={filters.search}
            onChange={event => handleSearchChange(event.target.value)}
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
