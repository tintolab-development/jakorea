/**
 * 정산 지급 완료 페이지
 * 강사단 관리 > 정산 > 정산 지급 완료
 * 기간 설정 시 항목 별(강사비, 교통비 등)로 총액 노출
 */

import { useEffect, useState, useMemo } from 'react'
import { Card, Space, Table, Button, Badge, Tag, Statistic, Row, Col } from 'antd'
import { useLocation } from 'react-router-dom'
import { type Dayjs } from 'dayjs'
import { DatePicker } from 'antd'
import { useSettlementStore } from '@/features/settlement/model/settlement-store'
import { SettlementDetailDrawer } from '@/features/settlement/ui/settlement-detail-drawer'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { getSettlementStatusLabel, getSettlementStatusColor } from '@/shared/constants/status'
import { programService } from '@/entities/program/api/program-service'
import { instructorService } from '@/entities/instructor/api/instructor-service'
import { domainColorsHex } from '@/shared/constants/colors'
import type { Settlement, SettlementItemType } from '@/types/domain'
import type { ColumnsType } from 'antd/es/table'

const { RangePicker } = DatePicker

const itemTypeLabels: Record<SettlementItemType, string> = {
  instructor_fee: '강사비',
  transportation: '교통비',
  accommodation: '숙박비',
  other: '기타',
}

export function SettlementPaidPage() {
  const location = useLocation()
  const categoryName = getCategoryNameByPath(location.pathname, 2) || '강사단 관리'
  
  const { settlements, loading, fetchSettlements, selectedSettlement, setSelectedSettlement } = useSettlementStore()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null] | null>(null)

  useEffect(() => {
    fetchSettlements()
  }, [fetchSettlements])

  // paid 상태의 정산만 필터링
  const paidSettlements = useMemo(() => {
    let filtered = settlements.filter(s => s.status === 'paid')
    
    // 기간 필터링
    if (dateRange && dateRange[0] && dateRange[1]) {
      const startDate = dateRange[0].format('YYYY-MM')
      const endDate = dateRange[1].format('YYYY-MM')
      filtered = filtered.filter(s => {
        const period = s.period
        return period >= startDate && period <= endDate
      })
    }
    
    return filtered
  }, [settlements, dateRange])

  // 항목별 총액 계산
  const itemTotals = useMemo(() => {
    const totals: Record<SettlementItemType, number> = {
      instructor_fee: 0,
      transportation: 0,
      accommodation: 0,
      other: 0,
    }

    paidSettlements.forEach(settlement => {
      settlement.items.forEach(item => {
        if (item.type in totals) {
          totals[item.type as SettlementItemType] += item.amount
        }
      })
    })

    return totals
  }, [paidSettlements])

  const totalAmount = useMemo(() => {
    return paidSettlements.reduce((sum, s) => sum + s.totalAmount, 0)
  }, [paidSettlements])

  const handleView = (settlement: Settlement) => {
    setSelectedSettlement(settlement)
    setDrawerOpen(true)
  }

  const columns: ColumnsType<Settlement> = [
    {
      title: '기간',
      dataIndex: 'period',
      key: 'period',
      render: (period: string) => <Tag color="geekblue">{period}</Tag>,
    },
    {
      title: '프로그램',
      dataIndex: 'programId',
      key: 'programId',
      render: (programId: string) => {
        const program = programService.getByIdSync(programId)
        return program ? (
          <Tag color={domainColorsHex.program.primary}>{program.title}</Tag>
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
        return instructorService.getNameById(instructorId)
      },
    },
    {
      title: '상태',
      dataIndex: 'status',
      key: 'status',
      render: (status: Settlement['status']) => (
        <Badge status={getSettlementStatusColor(status) as any} text={getSettlementStatusLabel(status)} />
      ),
    },
    {
      title: '총액',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      render: (amount: number) => `${amount.toLocaleString('ko-KR')}원`,
    },
  ]

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>{categoryName}</h1>
      </Space>

      <Card title={`정산 지급 완료 (${paidSettlements.length}건)`}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {/* 기간 선택 */}
          <Space>
            <span>기간 선택:</span>
            <RangePicker
              picker="month"
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [Dayjs | null, Dayjs | null] | null)}
              format="YYYY-MM"
            />
            <Button onClick={() => setDateRange(null)}>초기화</Button>
          </Space>

          {/* 항목별 총액 통계 */}
          {dateRange && (
            <Card title="항목별 총액" size="small">
              <Row gutter={16}>
                <Col span={6}>
                  <Statistic
                    title={itemTypeLabels.instructor_fee}
                    value={itemTotals.instructor_fee}
                    suffix="원"
                    formatter={(value) => `${Number(value).toLocaleString('ko-KR')}`}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title={itemTypeLabels.transportation}
                    value={itemTotals.transportation}
                    suffix="원"
                    formatter={(value) => `${Number(value).toLocaleString('ko-KR')}`}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title={itemTypeLabels.accommodation}
                    value={itemTotals.accommodation}
                    suffix="원"
                    formatter={(value) => `${Number(value).toLocaleString('ko-KR')}`}
                  />
                </Col>
                <Col span={6}>
                  <Statistic
                    title={itemTypeLabels.other}
                    value={itemTotals.other}
                    suffix="원"
                    formatter={(value) => `${Number(value).toLocaleString('ko-KR')}`}
                  />
                </Col>
              </Row>
              <Row style={{ marginTop: 16 }}>
                <Col span={24}>
                  <Statistic
                    title="전체 총액"
                    value={totalAmount}
                    suffix="원"
                    formatter={(value) => `${Number(value).toLocaleString('ko-KR')}`}
                    valueStyle={{ fontSize: 20, fontWeight: 'bold' }}
                  />
                </Col>
              </Row>
            </Card>
          )}

          {/* 정산 목록 */}
          <Table
            dataSource={paidSettlements}
            columns={columns}
            rowKey="id"
            loading={loading}
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              showTotal: total => `총 ${total}개`,
            }}
            onRow={(record) => ({
              onClick: () => handleView(record),
              style: { cursor: 'pointer' },
            })}
          />
        </Space>
      </Card>

      <SettlementDetailDrawer
        open={drawerOpen}
        settlement={selectedSettlement}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedSettlement(null)
        }}
        onEdit={() => {}}
        onDelete={() => {}}
        onStatusChange={() => {}}
        loading={loading}
      />
    </div>
  )
}
