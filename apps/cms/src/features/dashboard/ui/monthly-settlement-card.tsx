/**
 * 월별 정산 현황 카드
 * Phase 1: 대시보드 고도화
 * Phase 2: 전월 대비 증감률 추가
 * Phase 3: 성능 최적화 (데이터 중앙화)
 */

import { Card, Statistic, Space, Tag, Typography } from 'antd'
import { DollarOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getSettlementStatusColor } from '@/shared/constants/status'
import { domainColorsHex } from '@/shared/constants/colors'
import { useDashboardData } from '../model/use-dashboard-data'

const { Text } = Typography

export function MonthlySettlementCard() {
  const navigate = useNavigate()
  const { monthlySettlement } = useDashboardData()

  const { totalAmount, changeRate, statusCounts } = monthlySettlement
  const isIncrease = changeRate > 0
  const isDecrease = changeRate < 0

  const handleClick = () => {
    navigate('/settlements/monthly')
  }

  return (
    <Card
      hoverable
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      <Statistic
        title="이번 달 정산 현황"
        value={totalAmount}
        prefix={<DollarOutlined />}
        suffix="원"
        valueStyle={{ color: domainColorsHex.settlement.primary }}
        precision={0}
      />
      {(isIncrease || isDecrease) && (
        <div style={{ marginTop: 8 }}>
          <Text
            type={isIncrease ? 'success' : 'danger'}
            style={{ fontSize: 12 }}
          >
            {isIncrease ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            {' '}
            {Math.abs(changeRate).toFixed(1)}% (전월 대비)
          </Text>
        </div>
      )}
      <Space size="small" style={{ marginTop: 16, flexWrap: 'wrap' }}>
        {statusCounts.pending > 0 && (
          <Tag color={getSettlementStatusColor('pending')}>
            대기: {statusCounts.pending}건
          </Tag>
        )}
        {statusCounts.calculated > 0 && (
          <Tag color={getSettlementStatusColor('calculated')}>
            산출완료: {statusCounts.calculated}건
          </Tag>
        )}
        {statusCounts.approved > 0 && (
          <Tag color={getSettlementStatusColor('approved')}>
            승인: {statusCounts.approved}건
          </Tag>
        )}
        {statusCounts.paid > 0 && (
          <Tag color={getSettlementStatusColor('paid')}>
            지급완료: {statusCounts.paid}건
          </Tag>
        )}
      </Space>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
        클릭하여 월별 정산 관리로 이동
      </Text>
    </Card>
  )
}

