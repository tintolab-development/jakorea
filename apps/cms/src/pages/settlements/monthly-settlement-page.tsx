/**
 * 월별 정산 관리 페이지
 * V3 Phase 4: 월별 정산 관리
 */

import { useEffect, useState, useMemo, type CSSProperties } from 'react'
import { Card, Space, Statistic, Table, Tag, Badge, Button, Select, Typography } from 'antd'
import { CalendarOutlined, DownloadOutlined } from '@ant-design/icons'
import { useMonthlySettlementStore, type MonthlySettlementSummary } from '@/features/settlement/model/monthly-settlement-store'
import { useSettlementStore } from '@/features/settlement/model/settlement-store'
import { useQueryParams } from '@/shared/hooks/use-query-params'
import { mockProgramsMap, mockInstructorsMap } from '@/data/mock'
import type { Settlement } from '@/types/domain'
import dayjs from 'dayjs'
import type { ColumnsType } from 'antd/es/table'

const { Text } = Typography

const statusLabels: Record<Settlement['status'], string> = {
  pending: '대기',
  calculated: '산출 완료',
  review: '검토',
  approved: '승인',
  paid: '지급 완료',
  cancelled: '취소',
}

const statusColors: Record<Settlement['status'], string> = {
  pending: 'default',
  calculated: 'processing',
  review: 'processing',
  approved: 'success',
  paid: 'success',
  cancelled: 'error',
}

const countTagStyle: CSSProperties = {
  minWidth: 56,
  textAlign: 'center',
  paddingInline: 8,
}

export function MonthlySettlementPage() {
  const { monthlySummaries, loading, fetchMonthlySummaries, getMonthlySummary } = useMonthlySettlementStore()
  const { settlements, fetchSettlements } = useSettlementStore()
  const { params, setParams } = useQueryParams<{ period?: string; status?: Settlement['status'] }>()
  
  // URL 파라미터를 우선으로 사용하되, 로컬 상태도 유지
  const selectedPeriod = useMemo(() => params.period || null, [params.period])
  const selectedStatus = params.status || null
  const [localPeriod, setLocalPeriod] = useState<string | null>(selectedPeriod)

  useEffect(() => {
    fetchMonthlySummaries()
    fetchSettlements()
  }, [fetchMonthlySummaries, fetchSettlements])

  // URL 파라미터가 변경되면 로컬 상태도 업데이트
  const currentPeriod = selectedPeriod || localPeriod

  const currentSummary = currentPeriod ? getMonthlySummary(currentPeriod) : null
  const currentSettlements = useMemo(() => {
    if (!currentPeriod) return []
    return settlements.filter(s => {
      if (s.period !== currentPeriod) return false
      if (selectedStatus && s.status !== selectedStatus) return false
      return true
    })
  }, [settlements, currentPeriod, selectedStatus])

  const handlePeriodChange = (period: string | null) => {
    setLocalPeriod(period)
    setParams({ period: period || undefined })
  }

  const handleStatusChange = (status: Settlement['status'] | null) => {
    setParams({ status: status || undefined })
  }

  const periodOptions = monthlySummaries.map(summary => ({
    label: `${summary.period} (${summary.totalCount}건)`,
    value: summary.period,
  }))

  const columns: ColumnsType<Settlement> = [
    {
      title: '프로그램',
      dataIndex: 'programId',
      key: 'programId',
      render: (programId: string) => {
        const program = mockProgramsMap.get(programId)
        return program ? (
          <Tag color="cyan">{program.title}</Tag>
        ) : (
          <Tag color="error">프로그램 정보 오류</Tag>
        )
      },
    },
    {
      title: '강사',
      dataIndex: 'instructorId',
      key: 'instructorId',
      render: (instructorId: string) => {
        const instructor = mockInstructorsMap.get(instructorId)
        return instructor ? instructor.name : instructorId.slice(-6)
      },
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      sorter: (a: Settlement, b: Settlement) => {
        const order: Settlement['status'][] = ['pending', 'calculated', 'review', 'approved', 'paid', 'cancelled']
        return order.indexOf(a.status) - order.indexOf(b.status)
      },
      filters: [
        { text: '대기', value: 'pending' },
        { text: '산출 완료', value: 'calculated' },
        { text: '검토', value: 'review' },
        { text: '승인', value: 'approved' },
        { text: '지급 완료', value: 'paid' },
        { text: '취소', value: 'cancelled' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: Settlement['status']) => (
        <Badge status={statusColors[status] as any} text={statusLabels[status]} />
      ),
    },
    {
      title: '금액',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `${amount.toLocaleString('ko-KR')}원`,
      sorter: (a: Settlement, b: Settlement) => a.totalAmount - b.totalAmount,
    },
    {
      title: '문서 생성일',
      dataIndex: 'documentGeneratedAt',
      key: 'documentGeneratedAt',
      render: (date: string | undefined) =>
        date ? dayjs(date).format('YYYY-MM-DD') : '-',
    },
  ]

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 헤더 */}
        <Space style={{ width: '100%', justifyContent: 'flex-start' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 20 }}>강사단 관리</h1>
            <Text type="secondary" style={{ fontSize: 12 }}>
              상단에서 기간을 선택하면 해당 월의 정산 목록을, 아래 요약 테이블에서는 월별·상태별 건수와 금액을 한눈에 보고
              상태 배지를 클릭해 바로 상세 목록으로 이동할 수 있습니다.
            </Text>
          </div>
        </Space>

        {/* 월 선택 */}
        <Card>
          <Space size="middle" wrap>
            <span>기간 선택:</span>
            <Select
              placeholder="월을 선택하세요"
              value={currentPeriod}
              onChange={handlePeriodChange}
              style={{ width: 200 }}
              allowClear
              options={periodOptions}
            />
            {currentPeriod && (
              <Button
                icon={<DownloadOutlined />}
                onClick={() => {
                  // TODO: 월별 정산 일괄 다운로드
                  console.log('Download monthly settlements:', currentPeriod)
                }}
              >
                월별 지급조서 일괄 다운로드
              </Button>
            )}
          </Space>
        </Card>

        {/* 월별 집계 통계 */}
        {currentSummary && (
          <Card>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <h2 style={{ margin: 0 }}>{currentSummary.period} 월별 집계</h2>
              </div>
              <Space size="large" wrap>
                <Statistic
                  title="총 정산 건수"
                  value={currentSummary.totalCount}
                  suffix="건"
                  prefix={<CalendarOutlined />}
                />
                <Statistic
                  title="총 정산 금액"
                  value={currentSummary.totalAmount}
                  suffix="원"
                  formatter={(value) => `${Number(value).toLocaleString('ko-KR')}`}
                />
                <Statistic
                  title="대기"
                  value={currentSummary.statusCounts.pending}
                  suffix="건"
                  valueStyle={{ color: '#8c8c8c' }}
                />
                <Statistic
                  title="산출 완료"
                  value={currentSummary.statusCounts.calculated}
                  suffix="건"
                  valueStyle={{ color: '#1890ff' }}
                />
                <Statistic
                  title="검토"
                  value={currentSummary.statusCounts.review}
                  suffix="건"
                  valueStyle={{ color: '#1890ff' }}
                />
                <Statistic
                  title="승인"
                  value={currentSummary.statusCounts.approved}
                  suffix="건"
                  valueStyle={{ color: '#52c41a' }}
                />
                <Statistic
                  title="지급 완료"
                  value={currentSummary.statusCounts.paid}
                  suffix="건"
                  valueStyle={{ color: '#52c41a' }}
                />
                <Statistic
                  title="취소"
                  value={currentSummary.statusCounts.cancelled}
                  suffix="건"
                  valueStyle={{ color: '#ff4d4f' }}
                />
              </Space>
            </Space>
          </Card>
        )}

        {/* 월별 정산 목록 */}
        {currentPeriod && (
          <Card title={`${currentPeriod} 정산 목록`}>
            <Table
              dataSource={currentSettlements}
              columns={columns}
              rowKey="id"
              loading={loading}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `총 ${total}개`,
              }}
            />
          </Card>
        )}

        {/* 월별 정산 목록 (전체) */}
        {!currentPeriod && (
          <Card title="월별 정산 요약">
            <Table
              dataSource={monthlySummaries}
              columns={[
                {
                  title: '기간',
                  dataIndex: 'period',
                  key: 'period',
                  align: 'center' as const,
                  render: (period: string) => (
                    <Button
                      type="link"
                      onClick={() => handlePeriodChange(period)}
                    >
                      {period}
                    </Button>
                  ),
                },
                {
                  title: '총 건수',
                  dataIndex: 'totalCount',
                  key: 'totalCount',
                  align: 'center' as const,
                  render: (count: number) => `${count}건`,
                },
                {
                  title: '총 금액',
                  dataIndex: 'totalAmount',
                  key: 'totalAmount',
                  align: 'right' as const,
                  render: (amount: number) => `${amount.toLocaleString('ko-KR')}원`,
                  sorter: (a: MonthlySettlementSummary, b: MonthlySettlementSummary) =>
                    a.totalAmount - b.totalAmount,
                },
                {
                  title: '대기',
                  dataIndex: ['statusCounts', 'pending'],
                  key: 'pending',
                  align: 'center' as const,
                  render: (count: number, record: MonthlySettlementSummary) =>
                    count > 0 ? (
                      <Button
                        type="link"
                        size="small"
                        onClick={() => {
                          handlePeriodChange(record.period)
                          handleStatusChange('pending')
                        }}
                      >
                        <Tag style={countTagStyle}>{count}건</Tag>
                      </Button>
                    ) : (
                      '-'
                    ),
                },
                {
                  title: '산출 완료',
                  dataIndex: ['statusCounts', 'calculated'],
                  key: 'calculated',
                  align: 'center' as const,
                  render: (count: number, record: MonthlySettlementSummary) =>
                    count > 0 ? (
                      <Button
                        type="link"
                        size="small"
                        onClick={() => {
                          handlePeriodChange(record.period)
                          handleStatusChange('calculated')
                        }}
                      >
                        <Tag color="processing" style={countTagStyle}>
                          {count}건
                        </Tag>
                      </Button>
                    ) : (
                      '-'
                    ),
                },
                {
                  title: '검토',
                  dataIndex: ['statusCounts', 'review'],
                  key: 'review',
                  align: 'center' as const,
                  render: (count: number, record: MonthlySettlementSummary) =>
                    count > 0 ? (
                      <Button
                        type="link"
                        size="small"
                        onClick={() => {
                          handlePeriodChange(record.period)
                          handleStatusChange('review')
                        }}
                      >
                        <Tag color="processing" style={countTagStyle}>
                          {count}건
                        </Tag>
                      </Button>
                    ) : (
                      '-'
                    ),
                },
                {
                  title: '승인',
                  dataIndex: ['statusCounts', 'approved'],
                  key: 'approved',
                  align: 'center' as const,
                  render: (count: number, record: MonthlySettlementSummary) =>
                    count > 0 ? (
                      <Button
                        type="link"
                        size="small"
                        onClick={() => {
                          handlePeriodChange(record.period)
                          handleStatusChange('approved')
                        }}
                      >
                        <Tag color="success" style={countTagStyle}>
                          {count}건
                        </Tag>
                      </Button>
                    ) : (
                      '-'
                    ),
                },
                {
                  title: '지급 완료',
                  dataIndex: ['statusCounts', 'paid'],
                  key: 'paid',
                  align: 'center' as const,
                  render: (count: number, record: MonthlySettlementSummary) =>
                    count > 0 ? (
                      <Button
                        type="link"
                        size="small"
                        onClick={() => {
                          handlePeriodChange(record.period)
                          handleStatusChange('paid')
                        }}
                      >
                        <Tag color="success" style={countTagStyle}>
                          {count}건
                        </Tag>
                      </Button>
                    ) : (
                      '-'
                    ),
                },
                {
                  title: '취소',
                  dataIndex: ['statusCounts', 'cancelled'],
                  key: 'cancelled',
                  align: 'center' as const,
                  render: (count: number, record: MonthlySettlementSummary) =>
                    count > 0 ? (
                      <Button
                        type="link"
                        size="small"
                        onClick={() => {
                          handlePeriodChange(record.period)
                          handleStatusChange('cancelled')
                        }}
                      >
                        <Tag color="error" style={countTagStyle}>
                          {count}건
                        </Tag>
                      </Button>
                    ) : (
                      '-'
                    ),
                },
              ]}
              rowKey="period"
              loading={loading}
              pagination={{
                pageSize: 12,
                showSizeChanger: true,
                showTotal: (total) => `총 ${total}개월`,
              }}
            />
          </Card>
        )}
      </Space>
    </div>
  )
}

// MonthlySettlementSummary는 monthly-settlement-store.ts에서 import해야 함

