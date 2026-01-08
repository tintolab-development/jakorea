/**
 * 강사용 월별 정산 관리 페이지
 * Phase 5.2.4: 본인 정산 정보 - 월별 정산 관리
 */

import { useState, useEffect, useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, Space, Button, Radio, Table, Tag, Select, Statistic, Empty } from 'antd'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { useAuthStore } from '@/features/auth/model/auth-store'
import { getMySettlements } from '@/entities/settlement/api/instructor-settlement-service'
import { getSettlementStatusLabel, getSettlementStatusColor } from '@/shared/constants/status'
import { SettlementCalendar } from '@/features/settlement/ui/settlement-calendar'
import { programService } from '@/entities/program/api/program-service'
import dayjs, { type Dayjs } from 'dayjs'
import type { Settlement, SettlementStatus } from '@/types/domain'
import type { ColumnsType } from 'antd/es/table'

type ViewMode = 'list' | 'calendar'

export function MyMonthlySettlementPage() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(false)

  // 뷰 모드 (리스트/캘린더)
  const viewMode = (searchParams.get('view') as ViewMode) || 'list'
  
  // 선택된 월 (YYYY-MM 형식)
  const selectedPeriod = searchParams.get('period') || dayjs().format('YYYY-MM')

  useEffect(() => {
    if (user?.instructorId) {
      loadSettlements()
    }
  }, [user?.instructorId, selectedPeriod])

  const loadSettlements = async () => {
    if (!user?.instructorId) return

    setLoading(true)
    try {
      const data = await getMySettlements(user.instructorId)
      // 선택된 월의 정산만 필터링
      const filtered = data.filter(s => {
        const settlementPeriod = s.period || dayjs(s.createdAt).format('YYYY-MM')
        return settlementPeriod === selectedPeriod
      })
      setSettlements(filtered)
    } catch (error) {
      console.error('정산 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleViewModeChange = (mode: ViewMode) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('view', mode)
    setSearchParams(newParams, { replace: true })
  }

  const handlePeriodChange = (period: string) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('period', period)
    setSearchParams(newParams, { replace: true })
  }

  const handleDateSelect = (_date: Dayjs, settlement?: Settlement) => {
    if (settlement) {
      navigate(`/settlements/my/${settlement.id}`)
    }
  }

  const handleViewSettlement = (settlement: Settlement) => {
    navigate(`/settlements/my/${settlement.id}`)
  }

  // 월별 통계 계산
  const monthlyStats = useMemo(() => {
    const totalAmount = settlements.reduce((sum, s) => sum + s.totalAmount, 0)
    const statusCounts = {
      pending: settlements.filter(s => s.status === 'pending').length,
      calculated: settlements.filter(s => s.status === 'calculated').length,
      approved: settlements.filter(s => s.status === 'approved').length,
      paid: settlements.filter(s => s.status === 'paid').length,
      cancelled: settlements.filter(s => s.status === 'cancelled').length,
    }
    return { totalAmount, statusCounts, totalCount: settlements.length }
  }, [settlements])

  // 사용 가능한 월 목록 생성 (최근 12개월)
  const availablePeriods = useMemo(() => {
    const periods: string[] = []
    const now = dayjs()
    for (let i = 0; i < 12; i++) {
      periods.push(now.subtract(i, 'month').format('YYYY-MM'))
    }
    return periods
  }, [])

  const columns: ColumnsType<Settlement> = [
    {
      title: '정산 ID',
      dataIndex: 'id',
      key: 'id',
      width: 200,
      render: (id: string, record: Settlement) => (
        <Button type="link" onClick={() => handleViewSettlement(record)} style={{ padding: 0 }}>
          {id.slice(-8)}
        </Button>
      ),
    },
    {
      title: '프로그램',
      dataIndex: 'programId',
      key: 'programId',
      width: 200,
      render: (programId: string) => {
        const program = programService.getByIdSync(programId)
        return program ? (
          <Tag color="cyan">{program.title}</Tag>
        ) : (
          <Tag color="error">프로그램 정보 오류</Tag>
        )
      },
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      render: (status: SettlementStatus) => (
        <Tag color={getSettlementStatusColor(status)}>{getSettlementStatusLabel(status)}</Tag>
      ),
    },
    {
      title: '정산 금액',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      width: 150,
      render: (amount: number) => `${amount.toLocaleString()}원`,
      sorter: (a, b) => a.totalAmount - b.totalAmount,
    },
    {
      title: '생성일',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string | Date) => dayjs(date).format('YYYY-MM-DD'),
      sorter: (a, b) => {
        const dateA = typeof a.createdAt === 'string' ? new Date(a.createdAt) : a.createdAt
        const dateB = typeof b.createdAt === 'string' ? new Date(b.createdAt) : b.createdAt
        return dateA.getTime() - dateB.getTime()
      },
    },
  ]

  if (!user?.instructorId) {
    return (
      <div>
        <h1>월별 정산 관리</h1>
        <Card>
          <div style={{ textAlign: 'center', padding: '50px', color: 'rgba(0, 0, 0, 0.45)' }}>
            강사 정보가 없습니다.
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 헤더 */}
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          {/* <h1 style={{ margin: 0 }}>월별 정산 관리</h1> */}
          <Space>
            <Radio.Group
              value={viewMode}
              onChange={e => handleViewModeChange(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="list">
                <UnorderedListOutlined /> 리스트
              </Radio.Button>
              <Radio.Button value="calendar">
                <CalendarOutlined /> 캘린더
              </Radio.Button>
            </Radio.Group>
          </Space>
        </Space>

        {/* 월 선택 및 통계 */}
        <Card>
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <Space>
              <span>기간 선택:</span>
              <Select
                value={selectedPeriod}
                onChange={handlePeriodChange}
                style={{ width: 150 }}
                options={availablePeriods.map(period => ({
                  label: dayjs(period).format('YYYY년 MM월'),
                  value: period,
                }))}
              />
            </Space>
            <Space size="large" wrap>
              <Statistic
                title="총 정산 건수"
                value={monthlyStats.totalCount}
                suffix="건"
                prefix={<CalendarOutlined />}
              />
              <Statistic
                title="총 정산 금액"
                value={monthlyStats.totalAmount}
                suffix="원"
                formatter={(value) => `${Number(value).toLocaleString('ko-KR')}`}
              />
              <Statistic
                title="대기"
                value={monthlyStats.statusCounts.pending}
                suffix="건"
                valueStyle={{ color: '#8c8c8c' }}
              />
              <Statistic
                title="산출 완료"
                value={monthlyStats.statusCounts.calculated}
                suffix="건"
                valueStyle={{ color: '#1890ff' }}
              />
              <Statistic
                title="승인"
                value={monthlyStats.statusCounts.approved}
                suffix="건"
                valueStyle={{ color: '#52c41a' }}
              />
              <Statistic
                title="지급 완료"
                value={monthlyStats.statusCounts.paid}
                suffix="건"
                valueStyle={{ color: '#52c41a' }}
              />
            </Space>
          </Space>
        </Card>

        {/* 리스트 뷰 */}
        {viewMode === 'list' && (
          <Card title={`${dayjs(selectedPeriod).format('YYYY년 MM월')} 정산 목록`}>
            {settlements.length === 0 ? (
              <Empty description="해당 월의 정산 내역이 없습니다" />
            ) : (
              <Table
                columns={columns}
                dataSource={settlements}
                rowKey="id"
                loading={loading}
                pagination={{
                  defaultPageSize: 10,
                  showSizeChanger: true,
                  showTotal: total => `총 ${total}개`,
                }}
              />
            )}
          </Card>
        )}

        {/* 캘린더 뷰 */}
        {viewMode === 'calendar' && (
          <Card title={`${dayjs(selectedPeriod).format('YYYY년 MM월')} 정산 캘린더`}>
            <SettlementCalendar
              settlements={settlements}
              onDateSelect={handleDateSelect}
              selectedPeriod={selectedPeriod}
            />
          </Card>
        )}
      </Space>
    </div>
  )
}

