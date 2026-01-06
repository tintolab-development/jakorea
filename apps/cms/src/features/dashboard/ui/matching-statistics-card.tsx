/**
 * 매칭 통계 카드
 * Phase 5.1.1: 관리자 대시보드
 */

import { Card, Statistic, Row, Col, Tag } from 'antd'
import { TeamOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { domainColorsHex } from '@/shared/constants/colors'

interface MatchingStatisticsCardProps {
  total: number
  confirmed: number
  pending: number
  loading?: boolean
}

export function MatchingStatisticsCard({
  total,
  confirmed,
  pending,
  loading = false,
}: MatchingStatisticsCardProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate('/matchings')
  }

  return (
    <Card
      hoverable
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
      loading={loading}
    >
      <Row gutter={16}>
        <Col span={24}>
          <Statistic
            title="매칭"
            value={total}
            prefix={<TeamOutlined />}
            valueStyle={{ color: domainColorsHex.matching.primary }}
          />
        </Col>
        <Col span={24} style={{ marginTop: 16 }}>
          <Row gutter={8}>
            <Col>
              <Tag color="green">확정: {confirmed}</Tag>
            </Col>
            <Col>
              <Tag color="orange">대기: {pending}</Tag>
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>
  )
}

