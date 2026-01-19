/**
 * 전체 정산 현황 페이지
 * 강사단 관리 > 정산 > 전체 정산 현황
 * 정산 현황 하단에 테이블로 디폴트 표시, 토글 통해 캘린더 형태로 전환 가능
 */

import { useEffect, useState, useMemo } from 'react'
import { Card, Space, Table, Radio, Badge, Tag, Select } from 'antd'
import { CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons'
import { useLocation } from 'react-router-dom'
import { useSettlementStore } from '@/features/settlement/model/settlement-store'
import { SettlementDetailDrawer } from '@/features/settlement/ui/settlement-detail-drawer'
import { SettlementCalendar } from '@/features/settlement/ui/settlement-calendar'
import { getCategoryNameByPath } from '@/shared/config/menu-config'
import { PAGE_HEADER_STYLE } from '@/shared/constants/page-styles'
import { getSettlementStatusLabel, getSettlementStatusColor } from '@/shared/constants/status'
import { programService } from '@/entities/program/api/program-service'
import { instructorService } from '@/entities/instructor/api/instructor-service'
import { domainColorsHex } from '@/shared/constants/colors'
import type { Settlement } from '@/types/domain'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'

type ViewMode = 'table' | 'calendar'

export function SettlementOverviewPage() {
  const location = useLocation()
  const categoryName = getCategoryNameByPath(location.pathname, 2) || '강사단 관리'
  
  const { settlements, loading, fetchSettlements, selectedSettlement, setSelectedSettlement } = useSettlementStore()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [selectedPeriod, setSelectedPeriod] = useState<string>(dayjs().format('YYYY-MM'))

  useEffect(() => {
    fetchSettlements()
  }, [fetchSettlements])

  // 선택된 기간의 정산만 필터링
  const filteredSettlements = useMemo(() => {
    return settlements.filter(s => {
      const period = s.period || dayjs(s.createdAt).format('YYYY-MM')
      return period === selectedPeriod
    })
  }, [settlements, selectedPeriod])

  // 사용 가능한 기간 목록
  const availablePeriods = useMemo(() => {
    const periods = new Set<string>()
    settlements.forEach(s => {
      const period = s.period || dayjs(s.createdAt).format('YYYY-MM')
      periods.add(period)
    })
    return Array.from(periods).sort((a, b) => (a > b ? -1 : 1)).reverse()
  }, [settlements])

  const handleView = (settlement: Settlement) => {
    setSelectedSettlement(settlement)
    setDrawerOpen(true)
  }

  const handleCalendarSelect = (_date: dayjs.Dayjs, settlement?: Settlement) => {
    if (settlement) {
      handleView(settlement)
    }
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
        <h1 style={PAGE_HEADER_STYLE}>{categoryName}</h1>
        <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)} buttonStyle="solid">
          <Radio.Button value="table">
            <UnorderedListOutlined /> 테이블
          </Radio.Button>
          <Radio.Button value="calendar">
            <CalendarOutlined /> 캘린더
          </Radio.Button>
        </Radio.Group>
      </Space>

      <Card
        title="전체 정산 현황"
        extra={
          <Space>
            <span>기간 선택:</span>
            <Select
              value={selectedPeriod}
              onChange={setSelectedPeriod}
              style={{ width: 160 }}
              options={availablePeriods.map(period => ({
                label: dayjs(period).format('YYYY년 MM월'),
                value: period,
              }))}
            />
          </Space>
        }
      >
        {viewMode === 'table' ? (
          <Table
            dataSource={filteredSettlements}
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
        ) : (
          <SettlementCalendar
            settlements={filteredSettlements}
            onDateSelect={handleCalendarSelect}
            selectedPeriod={selectedPeriod}
          />
        )}
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
        onStatusChange={async () => {}}
        loading={loading}
      />
    </div>
  )
}
