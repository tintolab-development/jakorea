/**
 * 예산 및 실적 관리 대시보드
 * - 프로그램별 실적 통계 요약 (익명/집계)
 */

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Card, Space, Statistic, Table, Tag, Select, Button } from 'antd'
import { DownloadOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { exportTableToExcel } from '@/shared/utils/table-export'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import type { PerformanceStats } from '@/types/domain'
import { usePerformanceStats } from '@/features/performance/hooks/use-performance-stats'
import './performance-dashboard-page.css'

export default function PerformanceDashboardPage() {
  const location = useLocation()
  const { params, setParams } = useQueryParams<{ period?: string; programId?: string }>()
  const categoryName = getCategoryNameByPath(location.pathname, 1) || '실적 통계'

  const {
    filteredStats,
    loading,
    summary,
    availablePrograms,
    availablePeriods,
    fetchStats,
  } = usePerformanceStats({
    period: params.period,
    programId: params.programId,
  })

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  const selectedPeriod = params.period || availablePeriods[0]
  const selectedProgramId = params.programId

  const handleExportExcel = async () => {
    await exportTableToExcel(columns, filteredStats, '실적통계')
  }

  const columns: ColumnsType<PerformanceStats> = [
    {
      title: '프로그램',
      dataIndex: 'programName',
      key: 'programName',
      width: 220,
      render: (value: string) => <Tag color="cyan">{value}</Tag>,
    },
    {
      title: '기간',
      dataIndex: 'period',
      key: 'period',
      width: 120,
      render: (value: PerformanceStats['period']) =>
        `${dayjs(value.startDate).format('YYYY.MM')} ~ ${dayjs(value.endDate).format('YYYY.MM')}`,
    },
    {
      title: '총 신청',
      dataIndex: ['stats', 'totalApplications'],
      key: 'totalApplications',
      width: 110,
      align: 'right',
      render: (value: number) => `${value.toLocaleString('ko-KR')}건`,
    },
    {
      title: '승인',
      dataIndex: ['stats', 'approvedApplications'],
      key: 'approvedApplications',
      width: 90,
      align: 'right',
      render: (value: number) => `${value.toLocaleString('ko-KR')}건`,
    },
    {
      title: '학교',
      dataIndex: ['stats', 'totalSchools'],
      key: 'totalSchools',
      width: 80,
      align: 'right',
      render: (value: number) => `${value}곳`,
    },
    {
      title: '학생',
      dataIndex: ['stats', 'totalStudents'],
      key: 'totalStudents',
      width: 90,
      align: 'right',
      render: (value: number) => `${value.toLocaleString('ko-KR')}명`,
    },
    {
      title: '강사',
      dataIndex: ['stats', 'totalInstructors'],
      key: 'totalInstructors',
      width: 90,
      align: 'right',
      render: (value: number) => `${value.toLocaleString('ko-KR')}명`,
    },
    {
      title: '총 차시',
      dataIndex: ['stats', 'totalSessions'],
      key: 'totalSessions',
      width: 90,
      align: 'right',
      render: (value: number) => `${value.toLocaleString('ko-KR')}차시`,
    },
    {
      title: '총 정산액',
      dataIndex: ['stats', 'totalSettlementAmount'],
      key: 'totalSettlementAmount',
      width: 140,
      align: 'right',
      render: (value: number) => `${value.toLocaleString('ko-KR')}원`,
    },
    {
      title: '만족도',
      dataIndex: ['stats', 'satisfactionScore'],
      key: 'satisfactionScore',
      width: 90,
      align: 'right',
      render: (value: number) => `${value.toFixed(1)} / 5`,
    },
  ]

  return (
    <div>
      <Space direction="vertical" size="large" className="performance-dashboard">
        {/* 헤더 */}
        <div className="performance-dashboard__header">
          <h1 className="performance-dashboard__title">{categoryName}</h1>
        </div>

        {/* 필터 + 요약 카드 */}
        <Card>
          <Space direction="vertical" size="middle" className="performance-dashboard__filters">
            <Space size="middle" wrap className="performance-dashboard__filter-row">
              <span>기간 선택:</span>
              <Select
                value={selectedPeriod}
                className="performance-dashboard__select"
                onChange={value => setParams({ period: value || undefined })}
                options={availablePeriods.map(period => ({
                  label: dayjs(period).format('YYYY년 MM월'),
                  value: period,
                }))}
              />
              <span>프로그램:</span>
              <Select
                allowClear
                placeholder="전체"
                value={selectedProgramId}
                className="performance-dashboard__select performance-dashboard__select--program"
                onChange={value => setParams({ programId: (value as string) || undefined })}
                options={availablePrograms.map(program => ({
                  label: program.programName,
                  value: program.programId,
                }))}
              />
            </Space>
            <Space size="large" wrap className="performance-dashboard__summary">
              <Statistic title="프로그램 수" value={summary.programCount} suffix="개" />
              <Statistic
                title="총 신청 수"
                value={summary.totalApplications}
                formatter={value => Number(value).toLocaleString('ko-KR')}
              />
              <Statistic
                title="총 학생 수"
                value={summary.totalStudents}
                formatter={value => Number(value).toLocaleString('ko-KR')}
              />
              <Statistic
                title="총 정산액"
                value={summary.totalSettlementAmount}
                formatter={value => Number(value).toLocaleString('ko-KR')}
              />
            </Space>
          </Space>
        </Card>

        {/* 테이블 */}
        <Card
          title="프로그램별 실적 통계"
          extra={
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={handleExportExcel}
            >
              엑셀 다운로드
            </Button>
          }
        >
          <Table
            columns={columns}
            dataSource={filteredStats}
            rowKey="id"
            loading={loading}
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              showTotal: total => `총 ${total}개`,
            }}
          />
        </Card>
      </Space>
    </div>
  )
}
