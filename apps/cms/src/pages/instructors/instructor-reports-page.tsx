/**
 * 강사 강의보고서 목록 페이지
 * Phase 0.2.7: 강의보고서 제출 (FR-E03)
 * 강의별 제출 항목 및 제출 상태값 표시
 */

import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, Table, Tag, Button, Space, Typography, Tabs } from 'antd'
import { CmsButton } from '@/shared/ui/cms-button'
import { ContentModal, EmptyState } from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { PlusOutlined, EyeOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getMySchedules } from '@/entities/schedule/api/instructor-schedule-service'
import { useReportService } from '@/features/report/hooks/use-report-service'
import { useProgramService } from '@/features/program/general/hooks/use-program-service'
import { schoolService } from '@/entities/school/api/school-service'
import { mockLectureActivities } from '@/data/mock'
import { mockApplications } from '@/data/mock'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { getStatusConfigAccentColor, reportStatusStatusConfig } from '@/shared/constants/status'
import { StatusBadge } from '@/shared/components/status-badge'
import { getReportTypeLabel, getReportTypeColor } from '@/shared/constants/domain-status'
import dayjs from 'dayjs'
import type { Schedule, Report } from '@/types/domain'
import type { ColumnsType } from 'antd/es/table'

const { Title, Paragraph } = Typography

// Phase 0.2.7: FR-E03 - 제출 상태값 (미제출/제출완료/승인/반려)
type LectureReportStatus = 'NOT_SUBMITTED' | 'SUBMITTED' | 'APPROVED' | 'REJECTED'

const REPORT_STATUS_LABELS: Record<LectureReportStatus, string> = {
  NOT_SUBMITTED: '미제출',
  SUBMITTED: '제출완료',
  APPROVED: '승인',
  REJECTED: '반려',
}

const REPORT_STATUS_COLORS: Record<LectureReportStatus, string> = {
  NOT_SUBMITTED: 'default',
  SUBMITTED: 'processing',
  APPROVED: 'success',
  REJECTED: 'error',
}

interface LectureReportListItem {
  id: string
  scheduleId: string
  programName: string
  schoolName?: string
  date: string
  time: string
  status: LectureReportStatus
  reportId?: string
}

const statusTabs: Array<{ key: LectureReportStatus | 'all'; label: string }> = [
  { key: 'all', label: '전체' },
  { key: 'NOT_SUBMITTED', label: '미제출' },
  { key: 'SUBMITTED', label: '제출완료' },
  { key: 'APPROVED', label: '승인' },
  { key: 'REJECTED', label: '반려' },
]

export function InstructorReportsPage() {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { getAll: getAllReports, getById: getReportById } = useReportService()
  const { getByIdSync: getProgramByIdSync } = useProgramService()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<LectureReportStatus | 'all'>('all')
  const [detailModalOpen, setDetailModalOpen] = useState(false)
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  useEffect(() => {
    const loadData = async () => {
      if (!user?.instructorId) return

      setLoading(true)
      try {
        const [scheduleData, reportData] = await Promise.all([
          getMySchedules(user.instructorId),
          getAllReports(),
        ])
        setSchedules(scheduleData)
        setReports(reportData.filter(r => r.type === 'lecture'))
      } catch (error) {
        console.error('데이터 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user?.instructorId, getAllReports])

  // Phase 0.2.7: 강의보고서 목록 생성 (일정 기반)
  const reportList = useMemo<LectureReportListItem[]>(() => {
    return schedules
      .filter(schedule => {
        // 완료된 일정만 표시 (과거 일정)
        const scheduleDate = dayjs(schedule.date)
        return scheduleDate.isBefore(dayjs(), 'day')
      })
      .map(schedule => {
        const program = getProgramByIdSync(schedule.programId)
        const programName = program?.title || '-'

        // 학교 정보 찾기
        const application = mockApplications.find(
          app =>
            app.programId === schedule.programId &&
            app.subjectType === 'school' &&
            app.status === 'approved'
        )
        const school = application ? schoolService.getByIdSync(application.subjectId) : null
        const schoolName = school?.name

        // 강의보고서 찾기: activityId 또는 scheduleId, 동일 일정 복수 제출 시 최신만 사용 (FR-E03)
        const activity = mockLectureActivities.find(
          act => act.scheduleId === schedule.id && act.instructorId === user?.instructorId
        )
        const matchingReports = reports
          .filter(r => {
            if (r.type !== 'lecture') return false
            if (activity && r.activityId === activity.id) return true
            return r.scheduleId === schedule.id
          })
          .sort((a, b) => dayjs(b.updatedAt).valueOf() - dayjs(a.updatedAt).valueOf())
        const report = matchingReports[0] ?? null

        // Phase 0.2.7 / FR-E03: 상태값 (미제출/제출완료/승인/반려)
        let status: LectureReportStatus = 'NOT_SUBMITTED'
        if (report) {
          if (report.status === 'approved') status = 'APPROVED'
          else if (report.status === 'rejected') status = 'REJECTED'
          else if (report.status === 'submitted' || report.status === 'reviewing')
            status = 'SUBMITTED'
        }

        return {
          id: schedule.id,
          scheduleId: schedule.id,
          programName,
          schoolName,
          date: dayjs(schedule.date).format('YYYY-MM-DD'),
          time: `${schedule.startTime} - ${schedule.endTime}`,
          status,
          reportId: report?.id,
        }
      })
      .sort((a, b) => {
        // 날짜 내림차순 (최근 일정 먼저)
        return dayjs(b.date).valueOf() - dayjs(a.date).valueOf()
      })
  }, [schedules, reports, user?.instructorId])

  // 탭별 필터링
  const filteredReports = useMemo(() => {
    if (activeTab === 'all') {
      return reportList
    }
    return reportList.filter(item => item.status === activeTab)
  }, [reportList, activeTab])

  // 탭별 카운트
  const tabCounts = useMemo(() => {
    return {
      all: reportList.length,
      NOT_SUBMITTED: reportList.filter(item => item.status === 'NOT_SUBMITTED').length,
      SUBMITTED: reportList.filter(item => item.status === 'SUBMITTED').length,
      APPROVED: reportList.filter(item => item.status === 'APPROVED').length,
      REJECTED: reportList.filter(item => item.status === 'REJECTED').length,
    }
  }, [reportList])

  const scheduleToFormParams = (scheduleId: string) => {
    const schedule = schedules.find(s => s.id === scheduleId)
    const program = schedule ? getProgramByIdSync(schedule.programId) : null
    const activity = mockLectureActivities.find(
      act => act.scheduleId === scheduleId && act.instructorId === user?.instructorId
    )
    const params = new URLSearchParams({ type: 'lecture' })
    if (activity) params.set('activityId', activity.id)
    params.set('scheduleId', scheduleId)
    if (program?.id) params.set('programId', program.id)
    return params
  }

  const handleView = async (item: LectureReportListItem) => {
    const canResubmit = item.status === 'NOT_SUBMITTED' || item.status === 'REJECTED'
    if (canResubmit) {
      navigate(`/reports/new?${scheduleToFormParams(item.scheduleId).toString()}`)
      return
    }
    if (item.reportId) {
      try {
        const report = await getReportById(item.reportId)
        setSelectedReport(report)
        setDetailModalOpen(true)
      } catch (e) {
        console.error('보고서 조회 실패:', e)
      }
    }
  }

  const columns: ColumnsType<LectureReportListItem> = [
    {
      title: '프로그램명',
      dataIndex: 'programName',
      key: 'programName',
      width: 200,
    },
    {
      title: '학교명',
      dataIndex: 'schoolName',
      key: 'schoolName',
      width: 150,
      render: (schoolName: string) => schoolName || '-',
    },
    {
      title: '일정',
      key: 'schedule',
      width: 180,
      render: (_: unknown, record: LectureReportListItem) => (
        <Space direction="vertical" size={0}>
          <div>{record.date}</div>
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>{record.time}</div>
        </Space>
      ),
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: LectureReportStatus) => (
        <Tag color={REPORT_STATUS_COLORS[status]}>{REPORT_STATUS_LABELS[status]}</Tag>
      ),
    },
    {
      title: '작업',
      key: 'action',
      width: 120,
      render: (_: unknown, record: LectureReportListItem) => (
        <Space>
          {record.status === 'NOT_SUBMITTED' ? (
            <CmsButton
              size="small"
              icon={<PlusOutlined />}
              onClick={() => handleView(record)}
            >
              작성
            </CmsButton>
          ) : record.status === 'REJECTED' ? (
            <CmsButton
              size="small"
              icon={<PlusOutlined />}
              onClick={() => handleView(record)}
            >
              다시 작성
            </CmsButton>
          ) : (
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => handleView(record)}
            >
              보기
            </Button>
          )}
        </Space>
      ),
    },
  ]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <div style={PAGE_HEADER_STYLE}>
        <Title level={2} style={{ margin: 0 }}>
          강의보고서
        </Title>
        <Paragraph type="secondary" style={{ margin: '8px 0 0 0' }}>
          완료된 강의에 대한 보고서를 작성하고 제출할 수 있습니다.
        </Paragraph>
      </div>

      <Card>
        <Tabs
          activeKey={activeTab}
          onChange={key => setActiveTab(key as LectureReportStatus | 'all')}
          items={statusTabs.map(tab => ({
            key: tab.key,
            label: (
              <span>
                {tab.label} ({tabCounts[tab.key]})
              </span>
            ),
          }))}
        />

        <Table
          columns={columns}
          dataSource={filteredReports}
          rowKey="id"
          loading={loading}
          pagination={{
            defaultPageSize: 10,
            showSizeChanger: true,
            showTotal: total => `총 ${total}개`,
            pageSizeOptions: ['10', '20', '50'],
          }}
          locale={{
            emptyText: <EmptyState description="보고서가 없습니다." />,
          }}
        />
      </Card>

      <ContentModal
        title="보고서 상세"
        open={detailModalOpen}
        onCancel={() => {
          setDetailModalOpen(false)
          setSelectedReport(null)
        }}
        size="default"
      >
        {selectedReport && (
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <DetailInfoForm title="기본 정보" mode="view">
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field label="보고서 ID" view={selectedReport.id} />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="타입"
                  view={
                    <Tag color={getReportTypeColor(selectedReport.type)}>
                      {getReportTypeLabel(selectedReport.type)}
                    </Tag>
                  }
                />
              </DetailInfoForm.Row>
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="상태"
                  view={
                    <StatusBadge
                      domain="custom"
                      label={reportStatusStatusConfig[selectedReport.status].label}
                      accentColor={getStatusConfigAccentColor(
                        reportStatusStatusConfig[selectedReport.status].color
                      )}
                    />
                  }
                />
              </DetailInfoForm.Row>
              {selectedReport.programId && (
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field label="프로그램" view={getProgramByIdSync(selectedReport.programId)?.title ?? '-'} />
                </DetailInfoForm.Row>
              )}
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field label="제출일" view={dayjs(selectedReport.submittedAt).format('YYYY.MM.DD HH:mm')} />
              </DetailInfoForm.Row>
              {selectedReport.reviewedAt && (
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field label="검토일" view={dayjs(selectedReport.reviewedAt).format('YYYY.MM.DD HH:mm')} />
                </DetailInfoForm.Row>
              )}
              {selectedReport.reviewNotes && (
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field label="검토 사유" view={selectedReport.reviewNotes} />
                </DetailInfoForm.Row>
              )}
            </DetailInfoForm>
            <DetailInfoForm title="보고서 내용" mode="view">
              {Object.entries(selectedReport.fields).map(([key, value]) => (
                <DetailInfoForm.Row key={key} type="single">
                  <DetailInfoForm.Field label={key} view={typeof value === 'number' ? value.toLocaleString() : String(value)} />
                </DetailInfoForm.Row>
              ))}
            </DetailInfoForm>
          </Space>
        )}
      </ContentModal>
    </div>
  )
}
