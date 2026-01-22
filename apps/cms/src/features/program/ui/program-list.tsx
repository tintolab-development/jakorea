/**
 * 프로그램 목록 컴포넌트
 * Phase 2.1: 테이블 + 필터 (기획자 요청: 다양한 컴포넌트 활용)
 */

import { Table, Input, Select, Button, Space, Tag, Dropdown, message, DatePicker } from 'antd'
import type { MenuProps } from 'antd'
import { MoreOutlined, EditOutlined, DeleteOutlined, EyeOutlined, HeartOutlined, HeartFilled } from '@ant-design/icons'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProgramTable } from '../model/use-program-table'
import type { Program, ProgramLifecycleStatus, ProgramCategory, ProgramType } from '@/types/domain'
import { sponsorService } from '@/entities/sponsor/api/sponsor-service'
import {
  getCommonStatusLabel,
  getCommonStatusColor,
  programLifecycleStatusConfig,
  getProgramLifecycleLabel,
  getProgramLifecycleColor,
} from '@/shared/constants/status'
import { domainColorsHex } from '@/shared/constants/colors'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  addFavoriteProgram,
  removeFavoriteProgram,
  isFavoriteProgram,
} from '@/entities/program/api/favorite-program-service'
import dayjs, { type Dayjs } from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'

dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)

const { Option } = Select

interface ProgramListProps {
  data: Program[]
  loading?: boolean
  onView: (program: Program) => void
  onEdit?: (program: Program) => void // 관리자만 사용
  onDelete?: (program: Program) => void // 관리자만 사용
  showActions?: boolean // 작업 컬럼 표시 여부 (기본값: false, 관리자만 true)
  onChangeStatus?: (program: Program, status: ProgramLifecycleStatus) => void
  showFavorite?: boolean // 찜하기 컬럼 표시 여부 (기본값: false, 강사/봉사자/학생용)
}

const programTypes = [
  { value: 'online', label: '온라인' },
  { value: 'offline', label: '오프라인' },
  { value: 'hybrid', label: '하이브리드' },
]

const programFormats = [
  { value: 'workshop', label: '워크샵' },
  { value: 'seminar', label: '세미나' },
  { value: 'course', label: '과정' },
  { value: 'lecture', label: '강의' },
  { value: 'other', label: '기타' },
]

const statusOptions = programLifecycleStatusConfig.order.map(status => ({
  value: status,
  label: getProgramLifecycleLabel(status),
}))

export function ProgramList({
  data,
  loading,
  onView,
  onEdit,
  onDelete,
  showActions = false,
  onChangeStatus,
  showFavorite = false,
}: ProgramListProps) {
  const { user } = useAuthStore()
  const isParticipant =
    user?.role === 'INDIVIDUAL' ||
    user?.role === 'SCHOOL'
  const [searchParams, setSearchParams] = useSearchParams()
  const periodRange = useMemo<[Dayjs | null, Dayjs | null] | null>(() => {
    const start = searchParams.get('startDate')
    const end = searchParams.get('endDate')
    if (!start || !end) return null
    const startDate = dayjs(start)
    const endDate = dayjs(end)
    if (!startDate.isValid() || !endDate.isValid()) return null
    return [startDate, endDate]
  }, [searchParams])
  const targetFilter = useMemo<ProgramCategory | 'all'>(() => {
    const value = searchParams.get('target')
    return value === 'individual' || value === 'school' ? value : 'all'
  }, [searchParams])
  const educationTypeFilter = useMemo<ProgramType | 'all'>(() => {
    const value = searchParams.get('type')
    return value === 'online' || value === 'offline' || value === 'hybrid' ? value : 'all'
  }, [searchParams])
  const progressStatusFilter = useMemo<ProgramLifecycleStatus | 'all'>(() => {
    const value = searchParams.get('status') as ProgramLifecycleStatus | null
    const validStatuses = new Set(programLifecycleStatusConfig.order)
    return value && validStatuses.has(value) ? value : 'all'
  }, [searchParams])
  const searchQuery = useMemo(() => searchParams.get('search') || '', [searchParams])

  const filteredData = useMemo(() => {
    if (!isParticipant) {
      return data
    }

    let filtered = data

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase()
      filtered = filtered.filter(program => program.title.toLowerCase().includes(query))
    }

    if (periodRange?.[0] && periodRange?.[1]) {
      const rangeStart = periodRange[0].startOf('day')
      const rangeEnd = periodRange[1].endOf('day')
      filtered = filtered.filter(program => {
        const startDate = dayjs(program.startDate)
        const endDate = dayjs(program.endDate)
        return startDate.isSameOrBefore(rangeEnd) && endDate.isSameOrAfter(rangeStart)
      })
    }

    if (targetFilter !== 'all') {
      filtered = filtered.filter(program => program.category === targetFilter)
    }

    if (educationTypeFilter !== 'all') {
      filtered = filtered.filter(program => program.type === educationTypeFilter)
    }

    if (progressStatusFilter !== 'all') {
      filtered = filtered.filter(program => program.lifecycleStatus === progressStatusFilter)
    }

    return filtered
  }, [
    data,
    educationTypeFilter,
    isParticipant,
    periodRange,
    progressStatusFilter,
    searchQuery,
    targetFilter,
  ])

  const { table, resetFilters } = useProgramTable(filteredData)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const studentFiltersInitialized = useRef(false)

  const sponsors = sponsorService.getAllSync()
  
  const loadFavorites = useCallback(async (userId: string) => {
    try {
      const favoriteStatuses = await Promise.all(
        data.map(p => isFavoriteProgram(userId, p.id))
      )
      const favoriteSet = new Set<string>()
      data.forEach((p, index) => {
        if (favoriteStatuses[index]) {
          favoriteSet.add(p.id)
        }
      })
      setFavorites(favoriteSet)
    } catch (error) {
      console.error('관심 프로그램 상태 로드 실패:', error)
    }
  }, [data])

  // 찜하기 상태 로드
  useEffect(() => {
    const userId = user?.instructorId || user?.id
    if (showFavorite && userId && data.length > 0) {
      // setTimeout을 사용하여 비동기적으로 실행 (cascading render 경고 방지)
      const timer = setTimeout(() => {
        loadFavorites(userId)
      }, 0)
      return () => clearTimeout(timer)
    }
  }, [showFavorite, user, data, loadFavorites])

  useEffect(() => {
    if (isParticipant && !studentFiltersInitialized.current) {
      resetFilters()
      studentFiltersInitialized.current = true
    }
    if (!isParticipant) {
      studentFiltersInitialized.current = false
    }
  }, [isParticipant, resetFilters])

  const updateSearchParams = useCallback(
    (updater: (next: URLSearchParams) => void) => {
      const nextParams = new URLSearchParams(searchParams)
      updater(nextParams)
      if (nextParams.toString() !== searchParams.toString()) {
        setSearchParams(nextParams, { replace: true })
      }
    },
    [searchParams, setSearchParams]
  )

  const handleToggleFavorite = async (programId: string) => {
    const userId = user?.instructorId || user?.id
    if (!userId) return

    const isFavorite = favorites.has(programId)

    try {
      if (isFavorite) {
        await removeFavoriteProgram(userId, programId)
        message.success('관심 프로그램에서 제거되었습니다.')
      } else {
        await addFavoriteProgram(userId, programId)
        message.success('관심 프로그램에 추가되었습니다.')
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
      message.error('관심 프로그램 처리 중 오류가 발생했습니다.')
    }
  }

  const getMenuItems = (program: Program): MenuProps['items'] => {
    const items: MenuProps['items'] = [
      {
        key: 'view',
        label: '상세 보기',
        icon: <EyeOutlined />,
        onClick: () => onView(program),
      },
    ]

    // 관리자만 수정/삭제 메뉴 표시
    if (showActions && onEdit && onDelete) {
      items.push(
        {
          key: 'edit',
          label: '수정',
          icon: <EditOutlined />,
          onClick: () => onEdit(program),
        },
        {
          type: 'divider',
        },
        {
          key: 'delete',
          label: '삭제',
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => onDelete(program),
        }
      )
    }

    return items
  }

  return (
    <div>
      <Space style={{ marginBottom: 16 }} size="middle" wrap>
        {isParticipant ? (
          <>
           <Input
              placeholder="프로그램명 검색"
              value={searchQuery}
              onChange={e =>
                updateSearchParams(next => {
                  const value = e.target.value.trim()
                  if (value) {
                    next.set('search', value)
                  } else {
                    next.delete('search')
                  }
                })
              }
              style={{ width: 200 }}
            />
            <DatePicker.RangePicker
              value={periodRange || undefined}
              onChange={value =>
                updateSearchParams(next => {
                  if (value?.[0] && value?.[1]) {
                    next.set('startDate', value[0].format('YYYY-MM-DD'))
                    next.set('endDate', value[1].format('YYYY-MM-DD'))
                  } else {
                    next.delete('startDate')
                    next.delete('endDate')
                  }
                })
              }
              allowClear
              placeholder={['시작일', '종료일']}
            />
            <Select
              placeholder="수강 대상"
              value={targetFilter === 'all' ? undefined : targetFilter}
              onChange={value =>
                updateSearchParams(next => {
                  if (value) {
                    next.set('target', value)
                  } else {
                    next.delete('target')
                  }
                })
              }
              allowClear
              style={{ width: 160 }}
            >
              <Option value="individual">개인 학생</Option>
              <Option value="school">학교(선생님)</Option>
            </Select>
            <Select
              placeholder="교육 유형"
              value={educationTypeFilter === 'all' ? undefined : educationTypeFilter}
              onChange={value =>
                updateSearchParams(next => {
                  if (value) {
                    next.set('type', value)
                  } else {
                    next.delete('type')
                  }
                })
              }
              allowClear
              style={{ width: 160 }}
            >
              {programTypes.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="진행 상태"
              value={progressStatusFilter === 'all' ? undefined : progressStatusFilter}
              onChange={value =>
                updateSearchParams(next => {
                  if (value) {
                    next.set('status', value)
                  } else {
                    next.delete('status')
                  }
                })
              }
              allowClear
              style={{ width: 200 }}
            >
              {statusOptions.map(status => (
                <Option key={status.value} value={status.value}>
                  {status.label}
                </Option>
              ))}
            </Select>
            <Button
              onClick={() => {
                updateSearchParams(next => {
                  next.delete('startDate')
                  next.delete('endDate')
                  next.delete('target')
                  next.delete('type')
                  next.delete('status')
                  next.delete('search')
                })
              }}
            >
              필터 초기화
            </Button>
          </>
        ) : (
          <>
            <Input
              placeholder="프로그램명 검색"
              value={(table.getColumn('title')?.getFilterValue() as string) ?? ''}
              onChange={e => table.getColumn('title')?.setFilterValue(e.target.value)}
              style={{ width: 200 }}
            />
            <Select
              placeholder="스폰서 선택"
              value={(table.getColumn('sponsorId')?.getFilterValue() as string) || undefined}
              onChange={value => table.getColumn('sponsorId')?.setFilterValue(value || null)}
              allowClear
              style={{ width: 150 }}
              showSearch
              filterOption={(input, option) => {
                const label = option?.label as string | undefined
                return label ? label.toLowerCase().includes(input.toLowerCase()) : false
              }}
            >
              {sponsors.map(sponsor => (
                <Option key={sponsor.id} value={sponsor.id}>
                  {sponsor.name}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="유형 선택"
              value={(table.getColumn('type')?.getFilterValue() as string) || undefined}
              onChange={value => table.getColumn('type')?.setFilterValue(value || null)}
              allowClear
              style={{ width: 120 }}
            >
              {programTypes.map(type => (
                <Option key={type.value} value={type.value}>
                  {type.label}
                </Option>
              ))}
            </Select>
            <Select
              placeholder="상태 선택"
              value={(table.getColumn('lifecycleStatus')?.getFilterValue() as string) || undefined}
              onChange={value => table.getColumn('lifecycleStatus')?.setFilterValue(value || null)}
              allowClear
              style={{ width: 200 }}
            >
              {statusOptions.map(status => (
                <Option key={status.value} value={status.value}>
                  {status.label}
                </Option>
              ))}
            </Select>
            <Button onClick={() => resetFilters()}>필터 초기화</Button>
          </>
        )}
      </Space>

      <Table
        dataSource={table.getRowModel().rows.map(row => row.original)}
        columns={[
          {
            title: '프로그램명',
            dataIndex: 'title',
            key: 'title',
            width: 260,
            ellipsis: true,
            render: (text: string) => (
              <Tag
                color={domainColorsHex.program.primary}
                style={{
                  maxWidth: 230,
                  display: 'inline-block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  verticalAlign: 'middle',
                }}
              >
                {text}
              </Tag>
            ),
          },
          {
            title: '스폰서',
            dataIndex: 'sponsorId',
            key: 'sponsorId',
            render: (sponsorId: string) => {
              return sponsorService.getNameById(sponsorId)
            },
          },
          {
            title: '유형',
            dataIndex: 'type',
            key: 'type',
            render: (type: string) => {
              const typeLabel = programTypes.find(t => t.value === type)?.label || type
              return <Tag>{typeLabel}</Tag>
            },
          },
          {
            title: '형태',
            dataIndex: 'format',
            key: 'format',
            render: (format: string) => {
              const formatLabel = programFormats.find(f => f.value === format)?.label || format
              return formatLabel
            },
          },
          {
            title: '회차',
            dataIndex: 'rounds',
            key: 'rounds',
            render: (rounds: Program['rounds']) => `${rounds?.length || 0}회차`,
          },
          {
            title: '상태',
            dataIndex: 'status',
            key: 'status',
            render: (_status: string, record: Program) => {
              const lifecycle = record.lifecycleStatus
              const label = lifecycle
                ? getProgramLifecycleLabel(lifecycle)
                : getCommonStatusLabel(_status)
              const color = lifecycle
                ? getProgramLifecycleColor(lifecycle)
                : getCommonStatusColor(record.status)
              const tag = <Tag color={color}>{label}</Tag>

              // 상태 변경 핸들러가 없으면 단순 뱃지로 표시
              if (!onChangeStatus) {
                return tag
              }

              const items: MenuProps['items'] = programLifecycleStatusConfig.order.map(
                status => {
                  const optionLabel = getProgramLifecycleLabel(status)
                  const optionColor = getProgramLifecycleColor(status)
                  return {
                    key: status,
                    label: (
                      <Tag color={optionColor} style={{ margin: 0 }}>
                        {optionLabel}
                      </Tag>
                    ),
                    onClick: (e) => {
                      e?.domEvent?.stopPropagation()
                      onChangeStatus(record, status)
                    },
                  }
                }
              )

              return (
                <div onClick={e => e.stopPropagation()}>
                  <Dropdown
                    menu={{ items }}
                    trigger={['click']}
                    getPopupContainer={(triggerNode) => triggerNode.parentElement || document.body}
                  >
                    <span
                      className="program-status-dropdown-trigger"
                      onClick={e => e.stopPropagation()}
                      style={{ cursor: 'pointer', display: 'inline-block' }}
                    >
                      {tag}
                    </span>
                  </Dropdown>
                </div>
              )
            },
          },
          // 찜하기 컬럼 (강사/봉사자/학생용)
          ...(showFavorite
            ? [
                {
                  title: '찜하기',
                  key: 'favorite',
                  width: 100,
                  fixed: showActions ? undefined : ('right' as const),
                  render: (_: unknown, record: Program) => (
                    <div onClick={e => e.stopPropagation()}>
                      <Button
                        type="text"
                        icon={favorites.has(record.id) ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                        onClick={() => handleToggleFavorite(record.id)}
                      />
                    </div>
                  ),
                },
              ]
            : []),
          // 관리자만 작업 컬럼 표시
          ...(showActions
            ? [
                {
                  title: '작업',
                  key: 'action',
                  fixed: 'right' as const,
                  width: 80,
                  render: (_: unknown, record: Program) => (
                    <div onClick={e => e.stopPropagation()}>
                      <Dropdown menu={{ items: getMenuItems(record) }} trigger={['click']}>
                        <Button
                          type="text"
                          icon={<MoreOutlined />}
                          onClick={e => e.stopPropagation()}
                        />
                      </Dropdown>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
        rowKey="id"
        loading={loading}
        tableLayout="fixed"
        onRow={record => ({
          onClick: event => {
            const target = event.target as HTMLElement
            if (target.closest('.program-status-dropdown-trigger')) {
              return
            }
            onView(record)
          },
          style: { cursor: 'pointer' },
        })}
        pagination={{
          current: table.getState().pagination.pageIndex + 1,
          pageSize: table.getState().pagination.pageSize,
          total: table.getFilteredRowModel().rows.length,
          showSizeChanger: true,
          showTotal: total => `총 ${total}개`,
          onChange: (page, pageSize) => {
            table.setPageIndex(page - 1)
            table.setPageSize(pageSize)
          },
        }}
      />
    </div>
  )
}
