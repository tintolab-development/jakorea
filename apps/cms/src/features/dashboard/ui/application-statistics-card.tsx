/**
 * 신청 통계 카드
 * Phase 5.1.1: 관리자 대시보드
 */

import { Card, Statistic, Row, Col, Tag } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

interface ApplicationStatisticsCardProps {
  total: number
  pending: number
  approved: number
  rejected: number
  loading?: boolean
}

export function ApplicationStatisticsCard({
  total,
  pending,
  approved,
  rejected,
  loading = false,
}: ApplicationStatisticsCardProps) {
  const navigate = useNavigate()

  const handleClick = () => {
    navigate('/applications')
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
            title="신청"
            value={total}
            prefix={<FileTextOutlined />}
            suffix="건"
            valueStyle={{ color: '#000000', fontWeight: 'bold' }}
          />
        </Col>
        <Col span={24} style={{ marginTop: 16 }}>
          <Row gutter={[8, 8]} wrap>
            <Col>
              <Tag color="orange">대기: {pending}</Tag>
            </Col>
            <Col>
              <Tag color="green">승인: {approved}</Tag>
            </Col>
            <Col>
              <Tag color="red">반려: {rejected}</Tag>
            </Col>
          </Row>
        </Col>
      </Row>
    </Card>
  )
}

