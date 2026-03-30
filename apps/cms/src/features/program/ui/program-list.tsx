/**
 * 프로그램 목록 컴포넌트
 * Phase 2.1: 테이블 + 필터 (기획자 요청: 다양한 컴포넌트 활용)
 */

import { Table, Button, Image, Tag, Card } from 'antd'
import { UnifiedFilterCard } from '@/shared/ui/unified-filter-card'
import { FilterListLayout } from '@/shared/ui/filter-list-layout'
import { message } from 'antd'
import { HeartOutlined, HeartFilled } from '@ant-design/icons'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams, useLocation } from 'react-router-dom'
import { useProgramTable } from '../model/use-program-table'
import type { Program, ProgramLifecycleStatus, ProgramCategory, ProgramType } from '@/types/domain'
import './program-list.css'
import { ProgramCalendarView } from './program-calendar-view'
import { sponsorService } from '@/entities/sponsor/api/sponsor-service'
import {
  programLifecycleStatusConfig,
  commonStatusStatusConfig,
  getProgramLifecycleLabel,
} from '@/shared/constants/status'
import { programTypes, programFormats } from './constants/program-list-constants'
import { resolveEducationColumns } from './table/program-table-column-resolver'
import { ProgramLifecycleStatusBadge } from '@/shared/components/program-lifecycle-status-badge'
import { StatusBadge } from '@/shared/ui/status-badge'
import { MESSAGES } from '@/shared/constants/messages'
import { domainColorsHex } from '@/shared/constants/colors'
import { useAuthStore } from '@/features/auth/model/auth-store'
import {
  addFavoriteProgram,
  removeFavoriteProgram,
  isFavoriteProgram,
} from '@/entities/program/api/favorite-program-service'
import {
  programListFilterFields,
  participantFilterFields,
  economyFilterFields,
} from './table/program-list-filter-fields'
import {
  buildProgramListFilters,
  buildParticipantFilters,
} from './table/program-list-filter-builder'
import dayjs, { type Dayjs } from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'

dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)

export type ProgramListTableVariant = 'education' | 'volunteer' | 'all'

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
  viewMode?: 'list' | 'calendar' // 뷰 모드 (외부에서 제어)
  onViewModeChange?: (mode: 'list' | 'calendar') => void // 뷰 모드 변경 핸들러
  /** 테이블 컬럼 구분: education 경로일 때 No., 프로그램명, 모집 상태, 교육 분야, 수강 유형 구분, 교육 대상, 진행 방식, 공란 */
  tableVariant?: ProgramListTableVariant
  /** 수강자 모집 전용 테이블 컬럼 사용 (No., 프로그램명, 지원자 수, 수강자 모집 인원, 교육 분야, …) */
  studentRecruitmentTable?: boolean
  /** 강사 모집 전용 테이블 컬럼 사용 (No., 프로그램명, 지원자 수, 강사 모집 인원, 교육 분야, …) */
  instructorRecruitmentTable?: boolean
  /** 테이블에 실제 표시되는 건수·필터 적용 여부 전달 (헤더 "총 N건"과 위젯 동기화: 필터 없을 땐 전체 건수, 있을 땐 표시 건수) */
  onDisplayCountChange?: (count: number, hasActiveFilters: boolean) => void
  /** 페이지에서 적용한 진행현황(URL 또는 경로 기본값). 필터 카드 표시와 동기화용, URL에 status 없을 때 사용 */
  effectiveLifecycleStatus?: ProgramLifecycleStatus | null
  /** 모집 신청 현황 컬럼을 텍스트만 표시 (클릭/드롭다운 비활성, 경제 교육 프로그램 페이지용) */
  readOnlyLifecycleStatus?: boolean
  /** 필터와 테이블 사이에 렌더할 콘텐츠 (페이지에서 직접 렌더) */
  children?: React.ReactNode
}

export function ProgramList({
  data,
  loading,
  onView,
  // onEdit,
  // onDelete,
  onBulkDelete,
  onSelectionChange,
  selectedRowKeys: externalSelectedRowKeys,
  // showActions = false,
  showRowSelection = false,
  onChangeStatus,
  showFavorite = false,
  showCalendarView = false,
  onCreateNew: _onCreateNew,
  tableTitle: _tableTitle = '전체 프로그램',
  studentRecruitmentTable = false,
  instructorRecruitmentTable = false,
  viewMode: externalViewMode,
  onViewModeChange: _onViewModeChange,
  tableVariant = 'all',
  onDisplayCountChange,
  effectiveLifecycleStatus,
  readOnlyLifecycleStatus = false,
  children,
}: ProgramListProps) {
  const { user } = useAuthStore()
  const location = useLocation()
  const isEconomyPage = location.pathname === '/programs/economy-education'
  const isParticipant = user?.role === 'INDIVIDUAL' || user?.role === 'SCHOOL'
  const [searchParams, setSearchParams] = useSearchParams()

  // 사용자 권한 필터 상태 관리 (조회 버튼 클릭 전까지 임시 저장)
  const [pendingUserFilters, setPendingUserFilters] = useState<{
    search?: string
    dateRange?: [Dayjs | null, Dayjs | null] | null
    target?: ProgramCategory | 'all'
    type?: ProgramType | 'all'
    status?: ProgramLifecycleStatus | 'all'
  }>(() => {
    const start = searchParams.get('startDate')
    const end = searchParams.get('endDate')
    let dateRange: [Dayjs | null, Dayjs | null] | null = null
    if (start && end) {
      const startDate = dayjs(start)
      const endDate = dayjs(end)
      if (startDate.isValid() && endDate.isValid()) {
        dateRange = [startDate, endDate]
      }
    }
    return {
      search: searchParams.get('search') || '',
      dateRange,
      target: (searchParams.get('target') as ProgramCategory) || 'all',
      type: (searchParams.get('type') as ProgramType) || 'all',
      status: (searchParams.get('status') as ProgramLifecycleStatus) || 'all',
    }
  })

  // 교육 테이블 모집신청 현황 컬럼: 드롭다운 열림/변경 중 상태 (위젯과 동일 UI·로직)
  const [openStatusDropdownId, setOpenStatusDropdownId] = useState<string | null>(null)
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null)
  const handleLifecycleStatusChange = useCallback(
    async (record: Program, newStatus: ProgramLifecycleStatus) => {
      if (!onChangeStatus) return
      setUpdatingStatusId(record.id)
      try {
        await onChangeStatus(record, newStatus)
      } finally {
        setUpdatingStatusId(null)
      }
    },
    [onChangeStatus]
  )

  // 활성 필터 (조회 버튼 클릭 시 적용)
  const [activeUserFilters, setActiveUserFilters] = useState<typeof pendingUserFilters>(() => {
    const start = searchParams.get('startDate')
    const end = searchParams.get('endDate')
    let dateRange: [Dayjs | null, Dayjs | null] | null = null
    if (start && end) {
      const startDate = dayjs(start)
      const endDate = dayjs(end)
      if (startDate.isValid() && endDate.isValid()) {
        dateRange = [startDate, endDate]
      }
    }
    return {
      search: searchParams.get('search') || '',
      dateRange,
      target: (searchParams.get('target') as ProgramCategory) || 'all',
      type: (searchParams.get('type') as ProgramType) || 'all',
      status: (searchParams.get('status') as ProgramLifecycleStatus) || 'all',
    }
  })

  // 위젯 클릭 등으로 URL의 status가 바뀌면 필터 상태 동기화 (다른 위젯 클릭 시 올바르게 전환되도록)
  const urlStatus = searchParams.get('status') as ProgramLifecycleStatus | 'all' | null
  useEffect(() => {
    const statusFromUrl = urlStatus && urlStatus !== 'all' ? urlStatus : 'all'
    setActiveUserFilters(prev =>
      prev.status !== statusFromUrl ? { ...prev, status: statusFromUrl } : prev
    )
    setPendingUserFilters(prev =>
      prev.status !== statusFromUrl ? { ...prev, status: statusFromUrl } : prev
    )
  }, [urlStatus])

  const periodRange = useMemo<[Dayjs | null, Dayjs | null] | null>(() => {
    // activeUserFilters의 dateRange를 우선 사용
    if (activeUserFilters.dateRange?.[0] && activeUserFilters.dateRange[1]) {
      return activeUserFilters.dateRange
    }
    // 없으면 URL 파라미터에서 읽기
    const start = searchParams.get('startDate')
    const end = searchParams.get('endDate')
    if (!start || !end) return null
    const startDate = dayjs(start)
    const endDate = dayjs(end)
    if (!startDate.isValid() || !endDate.isValid()) return null
    return [startDate, endDate]
  }, [activeUserFilters.dateRange, searchParams])
  const targetFilter = useMemo<ProgramCategory | 'all'>(() => {
    const value = activeUserFilters.target || searchParams.get('target')
    return value === 'individual' || value === 'school' ? value : 'all'
  }, [activeUserFilters.target, searchParams])
  const educationTypeFilter = useMemo<ProgramType | 'all'>(() => {
    const value = activeUserFilters.type || searchParams.get('type')
    return value === 'online' || value === 'offline' || value === 'hybrid' ? value : 'all'
  }, [activeUserFilters.type, searchParams])
  // 위젯 클릭 시 URL이 곧바로 반영되도록 URL 우선 (activeUserFilters는 필터 패널 '조회'용)
  const progressStatusFilter = useMemo<ProgramLifecycleStatus | 'all'>(() => {
    const fromUrl = searchParams.get('status') as ProgramLifecycleStatus | null
    const value = fromUrl || activeUserFilters.status
    if (!value || value === 'all') return 'all'
    const validStatuses = new Set(programLifecycleStatusConfig.order)
    return validStatuses.has(value as ProgramLifecycleStatus)
      ? (value as ProgramLifecycleStatus)
      : 'all'
  }, [activeUserFilters.status, searchParams])
  const searchQuery = useMemo(
    () => activeUserFilters.search || searchParams.get('search') || '',
    [activeUserFilters.search, searchParams]
  )

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
      // 관리자용: 운영 기간·신청 기간 필터링 (진행현황·진행방식은 테이블 컬럼 필터로 처리)
      let filtered = data

      // 운영 기간 필터링
      if (operationPeriodRange?.[0] && operationPeriodRange?.[1]) {
        const rangeStart = operationPeriodRange[0].startOf('day')
        const rangeEnd = operationPeriodRange[1].endOf('day')
        filtered = filtered.filter(program => {
          if (!program.startDate || !program.endDate) {
            return false
          }
          const startDate = dayjs(program.startDate)
          const endDate = dayjs(program.endDate)
          // 날짜 유효성 검사
          if (!startDate.isValid() || !endDate.isValid()) {
            return false
          }
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
            // 날짜 유효성 검사
            if (!appStart.isValid() || !appEnd.isValid()) {
              return false
            }
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
        if (!program.startDate || !program.endDate) {
          return false
        }
        const startDate = dayjs(program.startDate)
        const endDate = dayjs(program.endDate)
        // 날짜 유효성 검사
        if (!startDate.isValid() || !endDate.isValid()) {
          return false
        }
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

  // 경제 교육: 제목·진행현황 텍스트로 데이터 선필터 (테이블 컬럼 필터와 별도)
  const economyFilteredData = useMemo(() => {
    if (!readOnlyLifecycleStatus) return filteredData
    const title = searchParamsAdmin.get('title') || ''
    const statusText = searchParamsAdmin.get('statusText') || ''
    let result = filteredData
    if (title.trim()) {
      const q = title.trim().toLowerCase()
      result = result.filter(p => p.title?.toLowerCase().includes(q))
    }
    if (statusText.trim()) {
      const q = statusText.trim().toLowerCase()
      result = result.filter(p => {
        const label = p.lifecycleStatus ? getProgramLifecycleLabel(p.lifecycleStatus) : ''
        return label.toLowerCase().includes(q)
      })
    }
    return result
  }, [filteredData, readOnlyLifecycleStatus, searchParamsAdmin])

  const dataForTable = readOnlyLifecycleStatus ? economyFilteredData : filteredData
  const { table, resetFilters, columnFilters } = useProgramTable(dataForTable)

  // 목록에 필터가 적용됐는지 (관리자: 운영/신청 기간 + 테이블 컬럼 필터(검색·진행현황 등), 강사 등: 검색·기간·대상·진행상태)
  const hasActiveFilters = useMemo(() => {
    if (!isParticipant) {
      if (readOnlyLifecycleStatus) {
        const title = searchParamsAdmin.get('title') || ''
        const statusText = searchParamsAdmin.get('statusText') || ''
        const hasColumnFilter = columnFilters.some(
          f => f.value != null && String(f.value).trim() !== ''
        )
        return Boolean(hasColumnFilter || title.trim() !== '' || statusText.trim() !== '')
      }
      const hasColumnFilter = columnFilters.some(
        f => f.value != null && String(f.value).trim() !== ''
      )
      return Boolean(
        hasColumnFilter ||
        (operationPeriodRange?.[0] && operationPeriodRange?.[1]) ||
        (applicationPeriodRange?.[0] && applicationPeriodRange?.[1])
      )
    }
    return Boolean(
      searchQuery.trim() ||
      (periodRange?.[0] && periodRange?.[1]) ||
      targetFilter !== 'all' ||
      educationTypeFilter !== 'all' ||
      progressStatusFilter !== 'all'
    )
  }, [
    isParticipant,
    columnFilters,
    operationPeriodRange,
    applicationPeriodRange,
    searchQuery,
    periodRange,
    targetFilter,
    educationTypeFilter,
    progressStatusFilter,
    readOnlyLifecycleStatus,
    searchParamsAdmin,
  ])

  // 표시 건수·필터 여부를 부모로 전달 (필터 없을 땐 페이지에서 전체 건수 표시 → 위젯과 일치)
  const displayedCount = hasActiveFilters
    ? table.getFilteredRowModel().rows.length
    : filteredData.length
  useEffect(() => {
    onDisplayCountChange?.(displayedCount, hasActiveFilters)
  }, [displayedCount, hasActiveFilters, onDisplayCountChange])

  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  // 외부에서 selectedRowKeys를 관리하는 경우를 위해 내부 상태도 유지
  const [internalSelectedRowKeys, setInternalSelectedRowKeys] = useState<React.Key[]>([])
  // 뷰 모드: 외부에서 제어되면 그것을 사용, 아니면 내부 상태 사용
  const [internalViewMode] = useState<'list' | 'calendar'>('list')
  const viewMode = externalViewMode ?? internalViewMode
  const studentFiltersInitialized = useRef(false)

  // 관리자용: Pending 필터 상태 (조회 버튼 클릭 전까지 적용하지 않음)
  const [pendingFilters, setPendingFilters] = useState({
    title: '',
    lifecycleStatus: undefined as ProgramLifecycleStatus | undefined,
    lifecycleStatusText: '' as string, // 경제 교육: 진행현황 텍스트 검색
    category: undefined as string | undefined,
    businessArea: undefined as string | undefined,
    targetLevel: undefined as string | undefined,
    type: undefined as string | undefined,
    applicationStartDate: null as Dayjs | null,
    applicationEndDate: null as Dayjs | null,
    operationStartDate: null as Dayjs | null,
    operationEndDate: null as Dayjs | null,
  })

  // URL에서 필터 값을 읽어와서 pendingFilters 초기화 및 검색어 즉시 적용 (관리자용)
  useEffect(() => {
    if (!isParticipant) {
      if (readOnlyLifecycleStatus) {
        // 경제 교육: title, statusText, category, targetLevel
        const titleFromUrl = searchParamsAdmin.get('title') || ''
        const statusTextFromUrl = searchParamsAdmin.get('statusText') || ''
        const categoryFilter = searchParamsAdmin.get('category') || undefined
        const targetLevelFilter = searchParamsAdmin.get('targetLevel') || undefined

        setPendingFilters(prev => {
          const hasChanges =
            prev.title !== titleFromUrl ||
            prev.lifecycleStatusText !== statusTextFromUrl ||
            prev.category !== categoryFilter ||
            prev.targetLevel !== targetLevelFilter

          if (!hasChanges) return prev

          return {
            ...prev,
            title: titleFromUrl,
            lifecycleStatusText: statusTextFromUrl,
            category: categoryFilter,
            targetLevel: targetLevelFilter,
          }
        })
      } else {
        // 일반 교육: 기존 로직
        const titleFromUrl = searchParamsAdmin.get('title') || ''
        const titleFilter = columnFilters.find(f => f.id === 'title')?.value as string | undefined
        const currentTitle = titleFromUrl || titleFilter || ''

        if (currentTitle !== ((table.getColumn('title')?.getFilterValue() as string) || '')) {
          table.getColumn('title')?.setFilterValue(currentTitle || null)
        }

        const categoryFilter = columnFilters.find(f => f.id === 'category')?.value as
          | string
          | undefined
        const businessAreaFilter = columnFilters.find(f => f.id === 'businessArea')?.value as
          | string
          | undefined
        const targetLevelFilter = columnFilters.find(f => f.id === 'targetLevel')?.value as
          | string
          | undefined

        const statusFromUrl = searchParamsAdmin.get('status') as ProgramLifecycleStatus | null
        const statusFilter = statusFromUrl ?? effectiveLifecycleStatus ?? null
        const typeFilter = searchParamsAdmin.get('type') || null

        const operationStartDateStr = searchParamsAdmin.get('operationStartDate')
        const operationEndDateStr = searchParamsAdmin.get('operationEndDate')

        setPendingFilters(prev => {
          const hasChanges =
            prev.title !== currentTitle ||
            prev.lifecycleStatus !== (statusFilter || undefined) ||
            prev.type !== (typeFilter || undefined) ||
            prev.category !== categoryFilter ||
            prev.businessArea !== businessAreaFilter ||
            prev.targetLevel !== targetLevelFilter ||
            prev.operationStartDate?.format('YYYY-MM-DD') !== operationStartDateStr ||
            prev.operationEndDate?.format('YYYY-MM-DD') !== operationEndDateStr

          if (!hasChanges) return prev

          return {
            title: currentTitle,
            lifecycleStatus: statusFilter || undefined,
            lifecycleStatusText: '',
            category: categoryFilter,
            businessArea: businessAreaFilter,
            targetLevel: targetLevelFilter,
            type: typeFilter || undefined,
            applicationStartDate: null,
            applicationEndDate: null,
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
    }
  }, [
    columnFilters,
    searchParamsAdmin,
    isParticipant,
    table,
    effectiveLifecycleStatus,
    readOnlyLifecycleStatus,
  ])

  // 조회 버튼 클릭 시 필터 적용
  const handleSearch = useCallback(() => {
    const nextParams = new URLSearchParams(searchParamsAdmin)

    if (readOnlyLifecycleStatus) {
      // 경제 교육: title, statusText, category, targetLevel
      if (pendingFilters.title?.trim()) {
        nextParams.set('title', pendingFilters.title.trim())
      } else {
        nextParams.delete('title')
      }
      if (pendingFilters.lifecycleStatusText?.trim()) {
        nextParams.set('statusText', pendingFilters.lifecycleStatusText.trim())
      } else {
        nextParams.delete('statusText')
      }
      if (pendingFilters.category) {
        nextParams.set('category', pendingFilters.category)
      } else {
        nextParams.delete('category')
      }
      if (pendingFilters.targetLevel) {
        nextParams.set('targetLevel', pendingFilters.targetLevel)
      } else {
        nextParams.delete('targetLevel')
      }
      table.getColumn('category')?.setFilterValue(pendingFilters.category || null)
      table.getColumn('targetLevel')?.setFilterValue(pendingFilters.targetLevel || null)
    } else {
      // 일반 교육: 기존 로직
      table.getColumn('category')?.setFilterValue(pendingFilters.category || null)
      table.getColumn('businessArea')?.setFilterValue(pendingFilters.businessArea || null)
      table.getColumn('targetLevel')?.setFilterValue(pendingFilters.targetLevel || null)
      table
        .getColumn('type')
        ?.setFilterValue(
          pendingFilters.type && pendingFilters.type !== 'all' ? pendingFilters.type : null
        )

      if (pendingFilters.title) {
        nextParams.set('title', pendingFilters.title)
      } else {
        nextParams.delete('title')
      }
      if (pendingFilters.lifecycleStatus) {
        nextParams.set('status', pendingFilters.lifecycleStatus)
      } else {
        nextParams.delete('status')
      }
      if (pendingFilters.type && pendingFilters.type !== 'all') {
        nextParams.set('type', pendingFilters.type)
      } else {
        nextParams.delete('type')
      }
      if (pendingFilters.operationStartDate && pendingFilters.operationEndDate) {
        nextParams.set('operationStartDate', pendingFilters.operationStartDate.format('YYYY-MM-DD'))
        nextParams.set('operationEndDate', pendingFilters.operationEndDate.format('YYYY-MM-DD'))
      } else {
        nextParams.delete('operationStartDate')
        nextParams.delete('operationEndDate')
      }
    }

    setSearchParamsAdmin(nextParams, { replace: true })
  }, [pendingFilters, table, searchParamsAdmin, setSearchParamsAdmin, readOnlyLifecycleStatus])

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

  const columnsAdmin = useMemo(() => {
    if (tableVariant !== 'education') return []

    return resolveEducationColumns({
      studentRecruitmentTable,
      instructorRecruitmentTable,
      isEconomyPage,
      readOnlyLifecycleStatus,
      handleLifecycleStatusChange,
      updatingStatusId,
      openStatusDropdownId,
      setOpenStatusDropdownId,
    })
  }, [
    tableVariant,
    studentRecruitmentTable,
    instructorRecruitmentTable,
    isEconomyPage,
    readOnlyLifecycleStatus,
    handleLifecycleStatusChange,
    updatingStatusId,
    openStatusDropdownId,
    setOpenStatusDropdownId,
  ])

  return (
    <div
      className={
        viewMode === 'list' ? 'program-list-container' : 'program-list-calendar-view-container'
      }
    >
      {isParticipant && (
        <UnifiedFilterCard
          fields={participantFilterFields}
          filters={buildParticipantFilters(pendingUserFilters, periodRange)}
          onFilterChange={(key, value) => {
            if (key === 'dateRange') {
              setPendingUserFilters(prev => ({
                ...prev,
                dateRange: value as [Dayjs | null, Dayjs | null] | null,
              }))
            } else {
              setPendingUserFilters(prev => ({ ...prev, [key]: value || undefined }))
            }
          }}
          onSearch={() => {
            setActiveUserFilters(pendingUserFilters)
            const nextParams = new URLSearchParams(searchParams)
            if (pendingUserFilters.search?.trim()) {
              nextParams.set('search', pendingUserFilters.search.trim())
            } else {
              nextParams.delete('search')
            }
            if (pendingUserFilters.dateRange?.[0] && pendingUserFilters.dateRange[1]) {
              nextParams.set('startDate', pendingUserFilters.dateRange[0].format('YYYY-MM-DD'))
              nextParams.set('endDate', pendingUserFilters.dateRange[1].format('YYYY-MM-DD'))
            } else {
              nextParams.delete('startDate')
              nextParams.delete('endDate')
            }
            if (pendingUserFilters.target && pendingUserFilters.target !== 'all') {
              nextParams.set('target', pendingUserFilters.target)
            } else {
              nextParams.delete('target')
            }
            if (pendingUserFilters.type && pendingUserFilters.type !== 'all') {
              nextParams.set('type', pendingUserFilters.type)
            } else {
              nextParams.delete('type')
            }
            if (pendingUserFilters.status && pendingUserFilters.status !== 'all') {
              nextParams.set('status', pendingUserFilters.status)
            } else {
              nextParams.delete('status')
            }
            setSearchParams(nextParams, { replace: true })
          }}
        />
      )}

      {/* 관리자 목록 뷰: 필터, tableButtonSection, 테이블을 단일 배경 컨테이너로 감쌈 */}
      {!isParticipant && viewMode === 'list' ? (
        <FilterListLayout
          className="program-list-content-wrapper"
          fields={readOnlyLifecycleStatus ? economyFilterFields : programListFilterFields}
          filters={buildProgramListFilters(pendingFilters, readOnlyLifecycleStatus)}
          onFilterChange={(key, value) => {
            if (key === 'operationPeriod') {
              const dates = value as [Dayjs, Dayjs] | null
              setPendingFilters(prev => ({
                ...prev,
                operationStartDate: dates?.[0] || null,
                operationEndDate: dates?.[1] || null,
              }))
            } else if (readOnlyLifecycleStatus && (key === 'category' || key === 'targetLevel')) {
              setPendingFilters(prev => ({
                ...prev,
                [key]: value && String(value).trim() ? value : undefined,
              }))
            } else {
              setPendingFilters(prev => ({ ...prev, [key]: value }))
            }
          }}
          onSearch={handleSearch}
          bordered={false}
          listHeader={children}
        >
          <div className="program-list-content-wrapper__table">
            <Card
              loading={loading}
              className="program-list-card program-list-card--in-wrapper program-list-card--no-border"
              style={{ border: 'none', boxShadow: 'none' }}
            >
              <div className="program-list-table-wrapper program-list-table-wrapper--scroll-x">
                <Table
                  rowSelection={
                    showRowSelection && onBulkDelete
                      ? {
                          selectedRowKeys: effectiveSelectedRowKeys,
                          onChange: handleSelectionChange,
                        }
                      : undefined
                  }
                  dataSource={table.getFilteredRowModel().rows.map(row => row.original)}
                  columns={columnsAdmin}
                  rowKey="id"
                  loading={loading}
                  tableLayout="fixed"
                  scroll={{ x: 2000, y: 'calc(100vh - 320px)' }}
                  onRow={record => ({
                    onClick: () => onView(record),
                    style: { cursor: 'pointer' },
                  })}
                  pagination={false}
                />
              </div>
            </Card>
          </div>
        </FilterListLayout>
      ) : null}

      {!isParticipant && showCalendarView && viewMode === 'calendar' ? (
        <>
          {children}
          <ProgramCalendarView
            programs={table.getRowModel().rows.map(row => row.original)}
            loading={loading}
            onProgramClick={onView}
          />
        </>
      ) : null}

      {/* 참가자용 목록 뷰 (카드로 감싸기) */}
      {isParticipant && (
        <Card loading={loading} className="program-list-card">
          <div className="program-list-table-wrapper">
            <Table
              dataSource={table.getFilteredRowModel().rows.map(row => row.original)}
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
                  render: (sponsorId: string | undefined) => {
                    if (!sponsorId) {
                      return '-'
                    }
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
                    const formatLabel =
                      programFormats.find(f => f.value === format)?.label || format
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
                      <ProgramLifecycleStatusBadge status={lifecycle} />
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
                              onClick={e => {
                                e.stopPropagation()
                                handleToggleFavorite(record.id)
                              }}
                            />
                          </div>
                        ),
                      },
                    ]
                  : []),
              ]}
              rowKey="id"
              tableLayout="fixed"
              scroll={{ x: 2000, y: 'calc(100vh - 320px)' }}
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
              pagination={false}
            />
          </div>
        </Card>
      )}
    </div>
  )
}
