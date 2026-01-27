/**
 * 프로그램 목록 컴포넌트
 * Phase 2.1: 테이블 + 필터 (기획자 요청: 다양한 컴포넌트 활용)
 */

import {
  Table,
  Input,
  Select,
  Button,
  Space,
  Dropdown,
  DatePicker,
  Image,
  Tag,
  Card,
  Row,
  Col,
  Calendar,
} from 'antd'
import { message } from 'antd'
import type { MenuProps } from 'antd'
import {
  MoreOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  HeartOutlined,
  HeartFilled,
  CalendarOutlined,
  TableOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useProgramTable } from '../model/use-program-table'
import type {
  Program,
  ProgramLifecycleStatus,
  ProgramCategory,
  ProgramType,
  TargetLevel,
} from '@/types/domain'
import './program-list.css'
import { sponsorService } from '@/entities/sponsor/api/sponsor-service'
import {
  programLifecycleStatusConfig,
  programLifecycleStatusStatusConfig,
  commonStatusStatusConfig,
  getProgramLifecycleLabel,
} from '@/shared/constants/status'
import { StatusBadge } from '@/shared/ui/status-badge'
import { MESSAGES } from '@/shared/constants/messages'
import { domainColorsHex } from '@/shared/constants/colors'
import { PAGINATION_CONFIG } from '@/shared/constants/pagination'
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
  onBulkDelete?: (programs: Program[]) => void // 선택 삭제 (교육 프로그램 등)
  onSelectionChange?: (selectedKeys: React.Key[]) => void // 선택된 항목 변경 시 호출
  selectedRowKeys?: React.Key[] // 외부에서 관리하는 선택된 행 키 (선택사항)
  showActions?: boolean // 작업 컬럼 표시 여부 (기본값: false, 관리자만 true)
  showRowSelection?: boolean // 행 선택 + 선택 삭제 (교육 프로그램 등)
  onChangeStatus?: (program: Program, status: ProgramLifecycleStatus) => void
  showFavorite?: boolean // 찜하기 컬럼 표시 여부 (기본값: false, 강사/봉사자/학생용)
  showCalendarView?: boolean // 캘린더 뷰 전환 여부
  onCreateNew?: () => void // 프로그램 신규 등록 버튼 클릭 핸들러
  tableTitle?: string // 테이블 타이틀 (기본값: '전체 프로그램')
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

// 교육 분야 옵션 (mock 데이터 기반)
const businessAreaOptions = [
  { value: '경제금융', label: '경제금융' },
  { value: '기업가정신', label: '기업가정신' },
  { value: '진로취업', label: '진로취업' },
  { value: '디지털리터러시', label: '디지털리터러시' },
]

// 교육 대상 옵션
const targetLevelOptions: { value: TargetLevel; label: string }[] = [
  { value: 'elementary', label: '초등' },
  { value: 'middle', label: '중등' },
  { value: 'high', label: '고등' },
]

// 수강 대상 옵션
const categoryOptions: { value: ProgramCategory; label: string }[] = [
  { value: 'school', label: '학교(단체)' },
  { value: 'individual', label: '개인 학생' },
]

export function ProgramList({
  data,
  loading,
  onView,
  onEdit,
  onDelete,
  onBulkDelete,
  onSelectionChange,
  selectedRowKeys: externalSelectedRowKeys,
  showActions = false,
  showRowSelection = false,
  onChangeStatus,
  showFavorite = false,
  showCalendarView = false,
  onCreateNew,
  tableTitle = '전체 프로그램',
}: ProgramListProps) {
  const { user } = useAuthStore()
  const isParticipant = user?.role === 'INDIVIDUAL' || user?.role === 'SCHOOL'
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

  // 관리자용 필터 상태 (운영 기간, 신청 기간)
  const [searchParamsAdmin, setSearchParamsAdmin] = useSearchParams()
  const operationPeriodRange = useMemo<[Dayjs | null, Dayjs | null] | null>(() => {
    const start = searchParamsAdmin.get('operationStartDate')
    const end = searchParamsAdmin.get('operationEndDate')
    if (!start || !end) return null
    const startDate = dayjs(start)
    const endDate = dayjs(end)
    if (!startDate.isValid() || !endDate.isValid()) return null
    return [startDate, endDate]
  }, [searchParamsAdmin])

  const applicationPeriodRange = useMemo<[Dayjs | null, Dayjs | null] | null>(() => {
    const start = searchParamsAdmin.get('applicationStartDate')
    const end = searchParamsAdmin.get('applicationEndDate')
    if (!start || !end) return null
    const startDate = dayjs(start)
    const endDate = dayjs(end)
    if (!startDate.isValid() || !endDate.isValid()) return null
    return [startDate, endDate]
  }, [searchParamsAdmin])

  const filteredData = useMemo(() => {
    if (!isParticipant) {
      // 관리자용: 운영 기간 및 신청 기간 필터링 추가
      let filtered = data

      // 운영 기간 필터링
      if (operationPeriodRange?.[0] && operationPeriodRange?.[1]) {
        const rangeStart = operationPeriodRange[0].startOf('day')
        const rangeEnd = operationPeriodRange[1].endOf('day')
        filtered = filtered.filter(program => {
          const startDate = dayjs(program.startDate)
          const endDate = dayjs(program.endDate)
          return startDate.isSameOrBefore(rangeEnd) && endDate.isSameOrAfter(rangeStart)
        })
      }

      // 신청 기간 필터링
      if (applicationPeriodRange?.[0] && applicationPeriodRange?.[1]) {
        const rangeStart = applicationPeriodRange[0].startOf('day')
        const rangeEnd = applicationPeriodRange[1].endOf('day')
        filtered = filtered.filter(program => {
          // 신청 기간이 있는 경우에만 필터링
          if (program.applicationStartDate && program.applicationEndDate) {
            const appStart = dayjs(program.applicationStartDate)
            const appEnd = dayjs(program.applicationEndDate)
            // 신청 기간과 필터 범위가 겹치는지 확인
            return appStart.isSameOrBefore(rangeEnd) && appEnd.isSameOrAfter(rangeStart)
          }
          // 신청 기간이 없는 프로그램은 필터에서 제외 (필터 적용 시 신청 기간이 있는 프로그램만 표시)
          return false
        })
      }

      return filtered
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
    operationPeriodRange,
    applicationPeriodRange,
  ])

  const { table, resetFilters, columnFilters } = useProgramTable(filteredData)
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  // 외부에서 selectedRowKeys를 관리하는 경우를 위해 내부 상태도 유지
  const [internalSelectedRowKeys, setInternalSelectedRowKeys] = useState<React.Key[]>([])
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const studentFiltersInitialized = useRef(false)

  // 관리자용: Pending 필터 상태 (조회 버튼 클릭 전까지 적용하지 않음)
  const [pendingFilters, setPendingFilters] = useState({
    title: '',
    lifecycleStatus: undefined as string | undefined,
    category: undefined as string | undefined,
    businessArea: undefined as string | undefined,
    targetLevel: undefined as string | undefined,
    applicationStartDate: null as Dayjs | null,
    applicationEndDate: null as Dayjs | null,
    operationStartDate: null as Dayjs | null,
    operationEndDate: null as Dayjs | null,
  })

  // URL에서 필터 값을 읽어와서 pendingFilters 초기화 (관리자용)
  useEffect(() => {
    if (!isParticipant) {
      // 테이블 필터에서 읽어오기 (useTableWithQuery가 URL에서 자동으로 동기화)
      const titleFilter = columnFilters.find(f => f.id === 'title')?.value as string | undefined
      const lifecycleStatusFilter = columnFilters.find(f => f.id === 'lifecycleStatus')?.value as
        | string
        | undefined
      const categoryFilter = columnFilters.find(f => f.id === 'category')?.value as
        | string
        | undefined
      const businessAreaFilter = columnFilters.find(f => f.id === 'businessArea')?.value as
        | string
        | undefined
      const targetLevelFilter = columnFilters.find(f => f.id === 'targetLevel')?.value as
        | string
        | undefined

      // 날짜 필터는 URL에서 직접 읽어오기
      const applicationStartDateStr = searchParamsAdmin.get('applicationStartDate')
      const applicationEndDateStr = searchParamsAdmin.get('applicationEndDate')
      const operationStartDateStr = searchParamsAdmin.get('operationStartDate')
      const operationEndDateStr = searchParamsAdmin.get('operationEndDate')

      setPendingFilters(prev => {
        // 값이 변경된 경우에만 업데이트 (무한 루프 방지)
        const hasChanges =
          prev.title !== (titleFilter || '') ||
          prev.lifecycleStatus !== lifecycleStatusFilter ||
          prev.category !== categoryFilter ||
          prev.businessArea !== businessAreaFilter ||
          prev.targetLevel !== targetLevelFilter ||
          prev.applicationStartDate?.format('YYYY-MM-DD') !== applicationStartDateStr ||
          prev.applicationEndDate?.format('YYYY-MM-DD') !== applicationEndDateStr ||
          prev.operationStartDate?.format('YYYY-MM-DD') !== operationStartDateStr ||
          prev.operationEndDate?.format('YYYY-MM-DD') !== operationEndDateStr

        if (!hasChanges) return prev

        return {
          title: titleFilter || '',
          lifecycleStatus: lifecycleStatusFilter,
          category: categoryFilter,
          businessArea: businessAreaFilter,
          targetLevel: targetLevelFilter,
          applicationStartDate: applicationStartDateStr
            ? dayjs(applicationStartDateStr).isValid()
              ? dayjs(applicationStartDateStr)
              : null
            : null,
          applicationEndDate: applicationEndDateStr
            ? dayjs(applicationEndDateStr).isValid()
              ? dayjs(applicationEndDateStr)
              : null
            : null,
          operationStartDate: operationStartDateStr
            ? dayjs(operationStartDateStr).isValid()
              ? dayjs(operationStartDateStr)
              : null
            : null,
          operationEndDate: operationEndDateStr
            ? dayjs(operationEndDateStr).isValid()
              ? dayjs(operationEndDateStr)
              : null
            : null,
        }
      })
    }
  }, [columnFilters, searchParamsAdmin, isParticipant])

  // 조회 버튼 클릭 시 필터 적용
  const handleSearch = useCallback(() => {
    // 테이블 컬럼 필터 적용
    table.getColumn('title')?.setFilterValue(pendingFilters.title || null)
    table.getColumn('lifecycleStatus')?.setFilterValue(pendingFilters.lifecycleStatus || null)
    table.getColumn('category')?.setFilterValue(pendingFilters.category || null)
    table.getColumn('businessArea')?.setFilterValue(pendingFilters.businessArea || null)
    table.getColumn('targetLevel')?.setFilterValue(pendingFilters.targetLevel || null)

    // URL 파라미터 필터 적용 (날짜)
    const nextParams = new URLSearchParams(searchParamsAdmin)
    if (pendingFilters.applicationStartDate && pendingFilters.applicationEndDate) {
      nextParams.set('applicationStartDate', pendingFilters.applicationStartDate.format('YYYY-MM-DD'))
      nextParams.set('applicationEndDate', pendingFilters.applicationEndDate.format('YYYY-MM-DD'))
    } else {
      nextParams.delete('applicationStartDate')
      nextParams.delete('applicationEndDate')
    }
    if (pendingFilters.operationStartDate && pendingFilters.operationEndDate) {
      nextParams.set('operationStartDate', pendingFilters.operationStartDate.format('YYYY-MM-DD'))
      nextParams.set('operationEndDate', pendingFilters.operationEndDate.format('YYYY-MM-DD'))
    } else {
      nextParams.delete('operationStartDate')
      nextParams.delete('operationEndDate')
    }
    setSearchParamsAdmin(nextParams, { replace: true })
  }, [pendingFilters, table, searchParamsAdmin, setSearchParamsAdmin])

  // 외부에서 selectedRowKeys를 받아오거나 내부 상태 사용
  const effectiveSelectedRowKeys =
    externalSelectedRowKeys !== undefined ? externalSelectedRowKeys : internalSelectedRowKeys

  const handleSelectionChange = useCallback(
    (keys: React.Key[]) => {
      if (externalSelectedRowKeys !== undefined) {
        // 외부에서 관리하는 경우
        onSelectionChange?.(keys)
      } else {
        // 내부에서 관리하는 경우
        setInternalSelectedRowKeys(keys)
        onSelectionChange?.(keys)
      }
    },
    [externalSelectedRowKeys, onSelectionChange]
  )

  const loadFavorites = useCallback(
    async (userId: string) => {
      try {
        const favoriteStatuses = await Promise.all(data.map(p => isFavoriteProgram(userId, p.id)))
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
    },
    [data]
  )

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
        message.success(MESSAGES.success.removedFromFavorites)
      } else {
        await addFavoriteProgram(userId, programId)
        message.success(MESSAGES.success.addedToFavorites)
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
      message.error(MESSAGES.error.unknown)
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
    <div className="program-list-container">
      <div className="program-filter-wrapper">
        {isParticipant && (
          <Space style={{ marginBottom: 16 }} size="middle" wrap>
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
          </Space>
        )}
      </div>

      {/* 관리자용 필터 카드 */}
      {!isParticipant && (
        <Card size="small" className="program-filter-card">
            {/* 첫 번째 줄: 프로그램명, 모집 상태, 수강 대상, 교육 분야, 교육 대상 */}
            <Row gutter={[12, 16]}>
              <Col flex="1">
                <div className="program-filter-field">
                  <span className="program-filter-label">프로그램명</span>
                  <Input
                    placeholder="프로그램명을 입력하세요"
                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    value={pendingFilters.title}
                    onChange={e => setPendingFilters(prev => ({ ...prev, title: e.target.value }))}
                    allowClear
                  />
                </div>
              </Col>
              <Col flex="1">
                <div className="program-filter-field">
                  <span className="program-filter-label">모집 상태</span>
                  <Select
                    placeholder="전체"
                    value={pendingFilters.lifecycleStatus}
                    onChange={value => setPendingFilters(prev => ({ ...prev, lifecycleStatus: value }))}
                    allowClear
                    style={{ width: '100%' }}
                  >
                    {statusOptions.map(status => (
                      <Option key={status.value} value={status.value}>
                        {status.label}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
              <Col flex="1">
                <div className="program-filter-field">
                  <span className="program-filter-label">수강 대상</span>
                  <Select
                    placeholder="전체"
                    value={pendingFilters.category}
                    onChange={value => setPendingFilters(prev => ({ ...prev, category: value }))}
                    allowClear
                    style={{ width: '100%' }}
                  >
                    {categoryOptions.map(category => (
                      <Option key={category.value} value={category.value}>
                        {category.label}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
              <Col flex="1">
                <div className="program-filter-field">
                  <span className="program-filter-label">교육 분야</span>
                  <Select
                    placeholder="전체"
                    value={pendingFilters.businessArea}
                    onChange={value => setPendingFilters(prev => ({ ...prev, businessArea: value }))}
                    allowClear
                    style={{ width: '100%' }}
                  >
                    {businessAreaOptions.map(area => (
                      <Option key={area.value} value={area.value}>
                        {area.label}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
              <Col flex="1">
                <div className="program-filter-field">
                  <span className="program-filter-label">교육 대상</span>
                  <Select
                    placeholder="전체"
                    value={pendingFilters.targetLevel}
                    onChange={value => setPendingFilters(prev => ({ ...prev, targetLevel: value }))}
                    allowClear
                    style={{ width: '100%' }}
                  >
                    {targetLevelOptions.map(level => (
                      <Option key={level.value} value={level.value}>
                        {level.label}
                      </Option>
                    ))}
                  </Select>
                </div>
              </Col>
            </Row>

            {/* 두 번째 줄: 모집 기간, 운영 기간, 조회 버튼 */}
            <Row gutter={[12, 16]} style={{ marginTop: 16 }} align="bottom">
              <Col flex="auto">
                <div className="program-filter-field">
                  <span className="program-filter-label">모집 기간</span>
                  <Space.Compact style={{ width: '100%' }}>
                    <DatePicker
                      placeholder="시작일"
                      value={pendingFilters.applicationStartDate}
                      onChange={date => setPendingFilters(prev => ({ ...prev, applicationStartDate: date }))}
                      style={{ width: '45%' }}
                      format="YYYY.MM.DD"
                    />
                    <span className="program-filter-date-separator">~</span>
                    <DatePicker
                      placeholder="종료일"
                      value={pendingFilters.applicationEndDate}
                      onChange={date => setPendingFilters(prev => ({ ...prev, applicationEndDate: date }))}
                      style={{ width: '45%' }}
                      format="YYYY.MM.DD"
                    />
                  </Space.Compact>
                </div>
              </Col>
              <Col flex="auto">
                <div className="program-filter-field">
                  <span className="program-filter-label">운영 기간</span>
                  <Space.Compact style={{ width: '100%' }}>
                    <DatePicker
                      placeholder="시작일"
                      value={pendingFilters.operationStartDate}
                      onChange={date => setPendingFilters(prev => ({ ...prev, operationStartDate: date }))}
                      style={{ width: '45%' }}
                      format="YYYY.MM.DD"
                    />
                    <span className="program-filter-date-separator">~</span>
                    <DatePicker
                      placeholder="종료일"
                      value={pendingFilters.operationEndDate}
                      onChange={date => setPendingFilters(prev => ({ ...prev, operationEndDate: date }))}
                      style={{ width: '45%' }}
                      format="YYYY.MM.DD"
                    />
                  </Space.Compact>
                </div>
              </Col>
              <Col>
                <Button
                  type="primary"
                  onClick={handleSearch}
                  className="program-filter-search-button"
                >
                  조회
                </Button>
              </Col>
            </Row>
          </Card>
      )}

      {/* 프로그램 목록 카드 (위젯 스타일) */}
      {!isParticipant && (
        <Card
          loading={loading}
          title={
            <div className="program-table-header-left">
              <span className="program-table-header-title">{tableTitle}</span>
              <span className="program-table-header-count">
                총 {table.getRowModel().rows.length}건
              </span>
            </div>
          }
          extra={
            <div className="program-table-header-right">
              {showCalendarView && (
                <Button
                  type={viewMode === 'list' ? 'default' : 'default'}
                  icon={viewMode === 'list' ? <CalendarOutlined /> : <TableOutlined />}
                  onClick={() => setViewMode(viewMode === 'list' ? 'calendar' : 'list')}
                  className="program-view-toggle-single-button"
                >
                  {viewMode === 'list' ? '캘린더로 보기' : '목록으로 보기'}
                </Button>
              )}
              {onCreateNew && (
                <Button type="primary" onClick={onCreateNew} className="program-table-header-button">
                  프로그램 신규 등록
                </Button>
              )}
            </div>
          }
          className="program-list-card"
        >
          {/* 캘린더 뷰 */}
          {showCalendarView && viewMode === 'calendar' ? (
            <Calendar
              dateFullCellRender={(value: Dayjs) => {
                // 테이블 필터링된 데이터 사용 (목록과 완전 동기화)
                const tableData = table.getRowModel().rows.map(row => row.original)
                const dayPrograms = tableData.filter(program => {
                  const start = dayjs(program.startDate)
                  const end = dayjs(program.endDate)
                  return value.isSameOrAfter(start, 'day') && value.isSameOrBefore(end, 'day')
                })

                const hasPrograms = dayPrograms.length > 0

                return (
                  <div
                    className="program-calendar-cell"
                    onClick={() => {
                      if (hasPrograms) {
                        onView(dayPrograms[0])
                      }
                    }}
                    style={{
                      height: '100%',
                      padding: '4px',
                      cursor: hasPrograms ? 'pointer' : 'default',
                    }}
                  >
                    <div className="program-calendar-cell-date">{value.date()}</div>
                    {hasPrograms ? (
                      <div className="program-calendar-cell-content">
                        {dayPrograms.slice(0, 3).map(program => (
                          <div
                            key={program.id}
                            onClick={e => {
                              e.stopPropagation()
                              onView(program)
                            }}
                            className="program-calendar-cell-item"
                          >
                            {program.title}
                          </div>
                        ))}
                        {dayPrograms.length > 3 && (
                          <div className="program-calendar-cell-more">
                            +{dayPrograms.length - 3}개 더
                          </div>
                        )}
                      </div>
                    ) : null}
                  </div>
                )
              }}
              onSelect={(value: Dayjs) => {
                // 테이블 필터링된 데이터 사용 (목록과 완전 동기화)
                const tableData = table.getRowModel().rows.map(row => row.original)
                const dayPrograms = tableData.filter(program => {
                  const start = dayjs(program.startDate)
                  const end = dayjs(program.endDate)
                  return value.isSameOrAfter(start, 'day') && value.isSameOrBefore(end, 'day')
                })
                if (dayPrograms.length > 0) {
                  onView(dayPrograms[0])
                }
              }}
            />
          ) : (
            /* 목록 뷰 */
            <Table
          rowSelection={
            showRowSelection && onBulkDelete
              ? {
                  selectedRowKeys: effectiveSelectedRowKeys,
                  onChange: handleSelectionChange,
                }
              : undefined
          }
          dataSource={table.getRowModel().rows.map(row => row.original)}
          columns={[
            {
              title: '포스터',
              dataIndex: 'posterImage',
              key: 'posterImage',
              width: 100,
              render: (_: unknown, record: Program) => {
                const src = record.posterImage
                if (!src) {
                  return (
                    <div
                      style={{
                        width: 72,
                        height: 54,
                        background: '#f0f0f0',
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10,
                        color: '#bfbfbf',
                      }}
                    >
                      이미지 없음
                    </div>
                  )
                }
                return (
                  <div onClick={e => e.stopPropagation()}>
                    <Image
                      src={src}
                      alt=""
                      width={72}
                      height={54}
                      style={{ objectFit: 'cover', borderRadius: 4 }}
                      preview={{ mask: '확대' }}
                    />
                  </div>
                )
              },
            },
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

                const badge = lifecycle ? (
                  <StatusBadge
                    status={lifecycle}
                    statusConfig={programLifecycleStatusStatusConfig}
                    showIcon={false}
                  />
                ) : (
                  <StatusBadge
                    status={record.status}
                    statusConfig={commonStatusStatusConfig}
                    showIcon={false}
                  />
                )

                // 상태 변경 핸들러가 없으면 단순 뱃지로 표시
                if (!onChangeStatus) {
                  return badge
                }

                const items: MenuProps['items'] = programLifecycleStatusConfig.order.map(status => {
                  return {
                    key: status,
                    label: (
                      <StatusBadge
                        status={status}
                        statusConfig={programLifecycleStatusStatusConfig}
                        showIcon={false}
                      />
                    ),
                    onClick: e => {
                      e?.domEvent?.stopPropagation()
                      onChangeStatus(record, status)
                    },
                  }
                })

                return (
                  <div onClick={e => e.stopPropagation()}>
                    <Dropdown
                      menu={{ items }}
                      trigger={['click']}
                      getPopupContainer={triggerNode => triggerNode.parentElement || document.body}
                    >
                      <span
                        className="program-status-dropdown-trigger"
                        onClick={e => e.stopPropagation()}
                        style={{ cursor: 'pointer', display: 'inline-block' }}
                      >
                        {badge}
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
                          icon={
                            favorites.has(record.id) ? (
                              <HeartFilled style={{ color: '#ff4d4f' }} />
                            ) : (
                              <HeartOutlined />
                            )
                          }
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
              // 상태 드롭다운 클릭 시 무시
              if (target.closest('.program-status-dropdown-trigger')) {
                return
              }
              // 이미지 preview 영역 클릭 시 무시 (이벤트 버블링 방지)
              if (target.closest('.ant-image-preview-wrap') || target.closest('.ant-image')) {
                return
              }
              // 이미지 mask (확대 버튼) 클릭 시 무시
              if (target.closest('.ant-image-mask')) {
                return
              }
              onView(record)
            },
            style: { cursor: 'pointer' },
          })}
          pagination={{
            ...PAGINATION_CONFIG,
            current: table.getState().pagination.pageIndex + 1,
            pageSize: table.getState().pagination.pageSize,
            total: table.getFilteredRowModel().rows.length,
            onChange: (page, pageSize) => {
              table.setPageIndex(page - 1)
              table.setPageSize(pageSize)
            },
          }}
        />
          )}
        </Card>
      )}

      {/* 참가자용 목록 뷰 (카드로 감싸기) */}
      {isParticipant && (
        <Card loading={loading} className="program-list-card">
          <Table
            dataSource={table.getRowModel().rows.map(row => row.original)}
            columns={[
              {
                title: '포스터',
                dataIndex: 'posterImage',
                key: 'posterImage',
                width: 100,
                render: (_: unknown, record: Program) => {
                  const src = record.posterImage
                  if (!src) {
                    return (
                      <div
                        style={{
                          width: 72,
                          height: 54,
                          background: '#f0f0f0',
                          borderRadius: 4,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 10,
                          color: '#bfbfbf',
                        }}
                      >
                        이미지 없음
                      </div>
                    )
                  }
                  return (
                    <div onClick={e => e.stopPropagation()}>
                      <Image
                        src={src}
                        alt=""
                        width={72}
                        height={54}
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                        preview={{ mask: '확대' }}
                      />
                    </div>
                  )
                },
              },
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

                  const badge = lifecycle ? (
                    <StatusBadge
                      status={lifecycle}
                      statusConfig={programLifecycleStatusStatusConfig}
                      showIcon={false}
                    />
                  ) : (
                    <StatusBadge
                      status={record.status}
                      statusConfig={commonStatusStatusConfig}
                      showIcon={false}
                    />
                  )

                  return badge
                },
              },
              ...(showFavorite
                ? [
                    {
                      title: '찜하기',
                      key: 'favorite',
                      width: 100,
                      fixed: 'right' as const,
                      render: (_: unknown, record: Program) => (
                        <div onClick={e => e.stopPropagation()}>
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
                        </div>
                      ),
                    },
                  ]
                : []),
            ]}
            rowKey="id"
            tableLayout="fixed"
            onRow={record => ({
              onClick: event => {
                const target = event.target as HTMLElement
                if (target.closest('.ant-image-preview-wrap') || target.closest('.ant-image')) {
                  return
                }
                if (target.closest('.ant-image-mask')) {
                  return
                }
                onView(record)
              },
              style: { cursor: 'pointer' },
            })}
            pagination={{
              ...PAGINATION_CONFIG,
              current: table.getState().pagination.pageIndex + 1,
              pageSize: table.getState().pagination.pageSize,
              total: table.getFilteredRowModel().rows.length,
              onChange: (page, pageSize) => {
                table.setPageIndex(page - 1)
                table.setPageSize(pageSize)
              },
            }}
          />
        </Card>
      )}
    </div>
  )
}
