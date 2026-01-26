/**
 * 관리자 보고서 관리 페이지
 * Phase 7.1.1: 관리자 보고서 관리
 * Phase 2: 리팩토링 패턴 적용
 */

import { useState, useEffect, useMemo } from 'react'
import { Space, Card, Table, Statistic } from 'antd'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { useReportService } from '@/features/report/hooks/use-report-service'
import { reportStatusConfig } from '@/shared/constants/status'
import { REPORT_TYPE_CONFIG } from '@/shared/constants/domain-status'
import { PAGINATION_CONFIG, LAYOUT_CONSTANTS } from '@/shared/constants'
import { useModalState } from '@/shared/hooks/use-modal-state'
import { ListPageFilters } from '@/shared/ui/list-page-filters'
import { StatusBadge } from '@/shared/ui/status-badge'
import type { Report, ReportType, ReportStatus } from '@/types/domain'

interface ReportListQueryParams extends Record<string, string | undefined> {
  type?: ReportType | 'all'
  status?: ReportStatus | 'all'
  search?: string
}
import { ReportDetailDrawer } from '@/features/report/ui/report-detail-drawer'
import {
  mockInstructorsMap,
  mockLectureActivitiesMap,
  mockVolunteerActivitiesMap,
} from '@/data/mock'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'

// 보고서 작성자 찾기 헬퍼 함수
const getReportAuthor = (report: Report): string => {
  const instructors = Array.from(mockInstructorsMap.values())

  if (report.type === 'lecture' && report.activityId) {
    const activity = mockLectureActivitiesMap.get(report.activityId)
    if (activity?.instructorId) {
      const instructor = mockInstructorsMap.get(activity.instructorId)
      if (instructor?.name) {
        return instructor.name
      }
    }
    // activityId가 있지만 instructor를 찾을 수 없는 경우, 보고서 ID 기반으로 강사 선택 (일관성 유지)
    const reportIndex = parseInt(report.id.replace('report-', '')) || 0
    const selectedInstructor = instructors[reportIndex % instructors.length]
    return selectedInstructor?.name || '강사명 없음'
  }
  if (report.type === 'volunteer' && report.activityId) {
    const activity = mockVolunteerActivitiesMap.get(report.activityId)
    if (activity?.volunteerId) {
      // volunteerId는 instructorId와 동일한 맵 사용 (강사/봉사자 모두)
      const volunteer = mockInstructorsMap.get(activity.volunteerId)
      if (volunteer?.name) {
        return volunteer.name
      }
    }
    // activityId가 있지만 volunteer를 찾을 수 없는 경우, 보고서 ID 기반으로 강사 선택 (일관성 유지)
    const reportIndex = parseInt(report.id.replace('report-', '')) || 0
    const selectedInstructor = instructors[reportIndex % instructors.length]
    return selectedInstructor?.name || '봉사자명 없음'
  }
  // program 타입은 관리자가 작성하지만, 실제로는 담당 강사 이름 표시
  if (report.type === 'program') {
    // 프로그램 보고서 ID 기반으로 강사 선택 (일관성 유지)
    const reportIndex = parseInt(report.id.replace('report-', '')) || 0
    const selectedInstructor = instructors[reportIndex % instructors.length]
    return selectedInstructor?.name || '담당자명 없음'
  }
  // 기본값: 보고서 ID 기반으로 강사 선택 (일관성 유지)
  const reportIndex = parseInt(report.id.replace('report-', '')) || 0
  const selectedInstructor = instructors[reportIndex % instructors.length]
  return selectedInstructor?.name || '작성자명 없음'
}

// 보고서 타입 옵션
const reportTypeOptions = [
  { label: '전체 타입', value: 'all' },
  { label: REPORT_TYPE_CONFIG.labels.lecture, value: 'lecture' },
  { label: REPORT_TYPE_CONFIG.labels.volunteer, value: 'volunteer' },
  { label: REPORT_TYPE_CONFIG.labels.program, value: 'program' },
]

// 보고서 상태 옵션
const reportStatusOptions = [
  { label: '전체', value: 'all' },
  { label: reportStatusConfig.labels.submitted, value: 'submitted' },
  { label: reportStatusConfig.labels.reviewing, value: 'reviewing' },
  { label: reportStatusConfig.labels.approved, value: 'approved' },
  { label: reportStatusConfig.labels.rejected, value: 'rejected' },
]

// 보고서 타입 상태 설정 (StatusBadge용)
const reportTypeStatusConfig = {
  lecture: { label: REPORT_TYPE_CONFIG.labels.lecture, color: REPORT_TYPE_CONFIG.colors.lecture },
  volunteer: {
    label: REPORT_TYPE_CONFIG.labels.volunteer,
    color: REPORT_TYPE_CONFIG.colors.volunteer,
  },
  program: { label: REPORT_TYPE_CONFIG.labels.program, color: REPORT_TYPE_CONFIG.colors.program },
}

// 보고서 상태 설정 (StatusBadge용)
const reportStatusStatusConfig = {
  submitted: {
    label: reportStatusConfig.labels.submitted,
    color: reportStatusConfig.colors.submitted,
    icon: reportStatusConfig.icons.submitted,
  },
  reviewing: {
    label: reportStatusConfig.labels.reviewing,
    color: reportStatusConfig.colors.reviewing,
    icon: reportStatusConfig.icons.reviewing,
  },
  approved: {
    label: reportStatusConfig.labels.approved,
    color: reportStatusConfig.colors.approved,
    icon: reportStatusConfig.icons.approved,
  },
  rejected: {
    label: reportStatusConfig.labels.rejected,
    color: reportStatusConfig.colors.rejected,
    icon: reportStatusConfig.icons.rejected,
  },
}

export function ReportListPage() {
  const { params, setParams, clearParams } = useQueryParams<ReportListQueryParams>()
  const { getAll: getAllReports } = useReportService()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)

  // Drawer 상태 관리
  const {
    open: drawerOpen,
    openModal: openDrawer,
    closeModal: closeDrawer,
    selectedItem: selectedReport,
  } = useModalState<Report>()

  // URL 쿼리 파라미터에서 필터 값 읽기
  const typeFilter = (params.type as ReportType | 'all') || 'all'
  const statusFilter = (params.status as ReportStatus | 'all') || 'all'
  const searchTerm = params.search || ''

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    setLoading(true)
    try {
      const data = await getAllReports()
      setReports(data)
      return data // 업데이트된 데이터 반환
    } catch (error) {
      console.error('보고서 로드 실패:', error)
      return []
    } finally {
      setLoading(false)
    }
  }

  // 필터 상태 관리
  const [filters, setFilters] = useState<{
    type: ReportType | 'all'
    status: ReportStatus | 'all'
  }>({
    type: typeFilter,
    status: statusFilter,
  })
  const [searchText, setSearchText] = useState(searchTerm)

  // URL 쿼리 파라미터와 필터 동기화
  useEffect(() => {
    setFilters({ type: typeFilter, status: statusFilter })
    setSearchText(searchTerm)
  }, [typeFilter, statusFilter, searchTerm])

  // 필터 변경 핸들러
  const handleFilterChange = (key: 'type' | 'status', value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    setParams({
      type: newFilters.type === 'all' ? undefined : newFilters.type,
      status: newFilters.status === 'all' ? undefined : newFilters.status,
    })
  }

  const handleSearchChange = (value: string) => {
    setSearchText(value)
    setParams({
      search: value || undefined,
    })
  }

  // 필터링된 보고서
  const filteredReports = useMemo(() => {
    let filtered = [...reports]

    // 타입 필터링
    if (filters.type !== 'all') {
      filtered = filtered.filter(r => r.type === filters.type)
    }

    // 상태 필터링
    if (filters.status !== 'all') {
      filtered = filtered.filter(r => r.status === filters.status)
    }

    // 검색 필터링 (작성자명 검색)
    if (searchText) {
      const term = searchText.toLowerCase()
      filtered = filtered.filter(r => {
        const author = getReportAuthor(r)
        return (
          author?.toLowerCase().includes(term) ||
          REPORT_TYPE_CONFIG.labels[r.type].toLowerCase().includes(term)
        )
      })
    }

    return filtered
  }, [reports, filters, searchText])

  // 정렬된 데이터
  const sortedReports = useMemo(() => {
    return [...filteredReports].sort((a, b) => {
      const dateA = typeof a.submittedAt === 'string' ? new Date(a.submittedAt) : a.submittedAt
      const dateB = typeof b.submittedAt === 'string' ? new Date(b.submittedAt) : b.submittedAt
      return dateB.getTime() - dateA.getTime()
    })
  }, [filteredReports])

  // 필터 초기화
  const handleFilterReset = () => {
    setFilters({ type: 'all', status: 'all' })
    setSearchText('')
    clearParams()
  }

  // 통계 계산
  const statistics = useMemo(() => {
    return {
      total: reports.length,
      submitted: reports.filter(r => r.status === 'submitted').length,
      reviewing: reports.filter(r => r.status === 'reviewing').length,
      approved: reports.filter(r => r.status === 'approved').length,
      rejected: reports.filter(r => r.status === 'rejected').length,
    }
  }, [reports])

  const handleView = (report: Report) => {
    openDrawer(report)
  }

  const handleReviewComplete = async () => {
    const updatedReports = await loadReports()
    // 상태 변경 후 업데이트된 report로 selectedReport 갱신
    if (selectedReport && updatedReports) {
      const updatedReport = updatedReports.find(r => r.id === selectedReport.id)
      if (updatedReport) {
        openDrawer(updatedReport)
      }
    }
  }

  const columns: ColumnsType<Report> = [
    {
      title: '작성자',
      key: 'author',
      width: 150,
      render: (_: unknown, record: Report) => {
        const author = getReportAuthor(record)
        return author
      },
    },
    {
      title: '타입',
      dataIndex: 'type',
      key: 'type',
      width: 150,
      render: (type: ReportType) => (
        <StatusBadge status={type} statusConfig={reportTypeStatusConfig} showIcon={false} />
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: LAYOUT_CONSTANTS.widths.status,
      render: (status: ReportStatus) => (
        <StatusBadge status={status} statusConfig={reportStatusStatusConfig} />
      ),
      filters: reportStatusOptions
        .filter(opt => opt.value !== 'all')
        .map(opt => ({ text: opt.label, value: opt.value })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: '제출일',
      dataIndex: 'submittedAt',
      key: 'submittedAt',
      width: 150,
      sorter: (a, b) => {
        const dateA = typeof a.submittedAt === 'string' ? new Date(a.submittedAt) : a.submittedAt
        const dateB = typeof b.submittedAt === 'string' ? new Date(b.submittedAt) : b.submittedAt
        return dateA.getTime() - dateB.getTime()
      },
      render: (date: string | Date) => dayjs(date).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '검토일',
      dataIndex: 'reviewedAt',
      key: 'reviewedAt',
      width: 150,
      render: (date?: string | Date) => (date ? dayjs(date).format('YYYY-MM-DD HH:mm') : '-'),
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: LAYOUT_CONSTANTS.margins.xl, width: '100%', justifyContent: 'space-between' }}>
        {/* <h1 style={{ margin: 0 }}>보고서 관리</h1> */}
      </Space>

      {/* 통계 카드 - 간결한 한 줄 배치 */}
      <Card style={{ marginBottom: LAYOUT_CONSTANTS.margins.lg }}>
        <Space size="large" wrap>
          <Statistic title="전체" value={statistics.total} />
          <Statistic title="제출" value={statistics.submitted} valueStyle={{ color: '#1890ff' }} />
          <Statistic
            title="검토 중"
            value={statistics.reviewing}
            valueStyle={{ color: '#faad14' }}
          />
          <Statistic title="승인" value={statistics.approved} valueStyle={{ color: '#52c41a' }} />
          <Statistic title="반려" value={statistics.rejected} valueStyle={{ color: '#ff4d4f' }} />
        </Space>
      </Card>

      {/* 필터 영역 */}
      <ListPageFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        searchValue={searchText}
        onSearchChange={handleSearchChange}
        searchPlaceholder="작성자명 검색"
        filterConfig={[
          {
            key: 'type',
            type: 'select',
            options: reportTypeOptions,
            placeholder: '보고서 타입',
            style: { width: 200 },
          },
          {
            key: 'status',
            type: 'select',
            options: reportStatusOptions,
            placeholder: '상태',
            style: { width: LAYOUT_CONSTANTS.widths.filter },
          },
        ]}
        onReset={handleFilterReset}
      />

      {/* 보고서 목록 테이블 */}
      <Table
        columns={columns}
        dataSource={sortedReports}
        rowKey="id"
        loading={loading}
        onRow={record => ({
          onClick: () => handleView(record),
          style: { cursor: 'pointer' },
        })}
        pagination={{
          ...PAGINATION_CONFIG,
        }}
        scroll={{ x: 1000 }}
      />

      {/* 보고서 상세 Drawer */}
      <ReportDetailDrawer
        open={drawerOpen}
        report={selectedReport || null}
        onClose={closeDrawer}
        onReviewComplete={handleReviewComplete}
      />
    </div>
  )
}
