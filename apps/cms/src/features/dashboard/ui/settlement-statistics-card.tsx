/**
 * 정산 통계 카드
 * Phase 5.1.1: 관리자 대시보드
 */

import { Card, Statistic, Row, Col, Tag } from 'antd'
import { DollarOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { domainColorsHex } from '@/shared/constants/colors'

interface SettlementStatisticsCardProps {
  total: number
  pending: number
  approved: number
  paid: number
  loading?: boolean
}

export function SettlementStatisticsCard({
  total,
  pending,
  approved,
  paid,
  loading = false,
}: SettlementStatisticsCardProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate('/settlements')
  }

  return (
    <Card
      hoverable
      onClick={handleClick}
      style={{ cursor: 'pointer', height: '100%' }}
      loading={loading}
    >
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Statistic
            title="정산"
            value={total}
            prefix={<DollarOutlined />}
            valueStyle={{ color: domainColorsHex.settlement.primary }}
          />
        </Col>
        <Col span={24} style={{ marginTop: 16 }}>
          <Row gutter={[8, 8]} wrap>
            <Col>
              <Tag color="orange">대기: {pending}</Tag>
            </Col>
            <Col>
              <Tag color="blue">승인: {approved}</Tag>
            </Col>
            <Col>
              <Tag color="green">지급완료: {paid}</Tag>
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>
  )
}

