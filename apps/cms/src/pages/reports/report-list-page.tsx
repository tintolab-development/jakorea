/**
 * 관리자 보고서 관리 페이지
 * Phase 7.1.1: 관리자 보고서 관리
 */

import { useState, useEffect, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Input, Space, Card, Tag, Button, Table, Select, Statistic } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { reportService } from '@/entities/report/api/report-service'
import { getReportStatusLabel, getReportStatusColor } from '@/shared/constants/status'
import type { Report, ReportType, ReportStatus } from '@/types/domain'
import { ReportDetailDrawer } from '@/features/report/ui/report-detail-drawer'
import {
  mockInstructorsMap,
  mockLectureActivitiesMap,
  mockVolunteerActivitiesMap,
} from '@/data/mock'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'

const { Option } = Select

const reportTypeLabels: Record<ReportType, string> = {
  lecture: '강의보고서',
  volunteer: '교육봉사 활동보고서',
  program: '프로그램 종료 보고서',
}

const reportTypeColors: Record<ReportType, string> = {
  lecture: 'blue',
  volunteer: 'purple',
  program: 'cyan',
}

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

const reportStatusOptions: Array<{ value: ReportStatus | 'all'; label: string }> = [
  { value: 'all', label: '전체' },
  { value: 'submitted', label: '제출' },
  { value: 'reviewing', label: '검토 중' },
  { value: 'approved', label: '승인' },
  { value: 'rejected', label: '반려' },
]

export function ReportListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const typeFilter = (searchParams.get('type') as ReportType | 'all') || 'all'
  const statusFilter = (searchParams.get('status') as ReportStatus | 'all') || 'all'
  const searchTerm = searchParams.get('search') || ''

  useEffect(() => {
    loadReports()
  }, [])

  const loadReports = async () => {
    setLoading(true)
    try {
      const data = await reportService.getAll()
      setReports(data)
      return data // 업데이트된 데이터 반환
    } catch (error) {
      console.error('보고서 로드 실패:', error)
      return []
    } finally {
      setLoading(false)
    }
  }

  // 필터링된 보고서
  const filteredReports = useMemo(() => {
    let filtered = [...reports]

    // 타입 필터링
    if (typeFilter !== 'all') {
      filtered = filtered.filter(r => r.type === typeFilter)
    }

    // 상태 필터링
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter)
    }

    // 검색 필터링 (작성자명 검색)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(r => {
        const author = getReportAuthor(r)
        return (
          author?.toLowerCase().includes(term) ||
          reportTypeLabels[r.type].toLowerCase().includes(term)
        )
      })
    }

    return filtered.sort((a, b) => {
      const dateA = typeof a.submittedAt === 'string' ? new Date(a.submittedAt) : a.submittedAt
      const dateB = typeof b.submittedAt === 'string' ? new Date(b.submittedAt) : b.submittedAt
      return dateB.getTime() - dateA.getTime()
    })
  }, [reports, typeFilter, statusFilter, searchTerm])

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

  const handleTypeChange = (type: ReportType | 'all') => {
    const newParams = new URLSearchParams(searchParams)
    if (type === 'all') {
      newParams.delete('type')
    } else {
      newParams.set('type', type)
    }
    setSearchParams(newParams, { replace: true })
  }

  const handleStatusChange = (status: ReportStatus | 'all') => {
    const newParams = new URLSearchParams(searchParams)
    if (status === 'all') {
      newParams.delete('status')
    } else {
      newParams.set('status', status)
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

  const handleView = (report: Report) => {
    setSelectedReport(report)
    setDrawerOpen(true)
  }

  const handleReviewComplete = async () => {
    const updatedReports = await loadReports()
    // 상태 변경 후 업데이트된 report로 selectedReport 갱신
    if (selectedReport && updatedReports) {
      const updatedReport = updatedReports.find(r => r.id === selectedReport.id)
      if (updatedReport) {
        setSelectedReport(updatedReport)
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
        <Tag color={reportTypeColors[type]}>{reportTypeLabels[type]}</Tag>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: ReportStatus) => (
        <Tag color={getReportStatusColor(status)}>{getReportStatusLabel(status)}</Tag>
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
      <Space style={{ marginBottom: 24, width: '100%', justifyContent: 'space-between' }}>
        {/* <h1 style={{ margin: 0 }}>보고서 관리</h1> */}
      </Space>

      {/* 통계 카드 - 간결한 한 줄 배치 */}
      <Card style={{ marginBottom: 16 }}>
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

      {/* 필터 영역 - Card 없이 간결하게 */}
      <Space size="middle" wrap style={{ marginBottom: 16 }}>
        <Select
          value={typeFilter}
          onChange={handleTypeChange}
          style={{ width: 200 }}
          placeholder="보고서 타입"
        >
          <Option value="all">전체 타입</Option>
          <Option value="lecture">강의보고서</Option>
          <Option value="volunteer">교육봉사 활동보고서</Option>
          <Option value="program">프로그램 종료 보고서</Option>
        </Select>

        <Select
          value={statusFilter}
          onChange={handleStatusChange}
          style={{ width: 150 }}
          placeholder="상태"
        >
          {reportStatusOptions.map(opt => (
            <Option key={opt.value} value={opt.value}>
              {opt.label}
            </Option>
          ))}
        </Select>

        <Input.Search
          placeholder="작성자명 검색"
          allowClear
          style={{ width: 250 }}
          defaultValue={searchTerm}
          onSearch={handleSearch}
          enterButton={<SearchOutlined />}
        />

        <Button onClick={() => setSearchParams({}, { replace: true })}>필터 초기화</Button>
      </Space>

      {/* 보고서 목록 테이블 - Card 없이 */}
      <Table
        columns={columns}
        dataSource={filteredReports}
        rowKey="id"
        loading={loading}
        onRow={record => ({
          onClick: () => handleView(record),
          style: { cursor: 'pointer' },
        })}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          showTotal: total => `총 ${total}개`,
        }}
        scroll={{ x: 1000 }}
      />

      {/* 보고서 상세 Drawer */}
      <ReportDetailDrawer
        open={drawerOpen}
        report={selectedReport}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedReport(null)
        }}
        onReviewComplete={handleReviewComplete}
      />
    </div>
  )
}
