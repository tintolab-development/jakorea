/**
 * 이번 달 신청 현황 카드
 * Phase 1: 대시보드 고도화
 * Phase 2: 전월 대비 증감률 추가
 * Phase 3: 성능 최적화 (데이터 중앙화)
 */

import { Card, Statistic, Space, Tag, Typography } from 'antd'
import { FileTextOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { getApplicationStatusColor } from '@/shared/constants/status'
import { domainColorsHex } from '@/shared/constants/colors'
import { useDashboardData } from '../model/use-dashboard-data'

const { Text } = Typography

export function MonthlyApplicationCard() {
  const navigate = useNavigate()
  const { monthlyApplications } = useDashboardData()

  const { total, changeCount, statusCounts } = monthlyApplications
  const isIncrease = changeCount > 0
  const isDecrease = changeCount < 0

  const handleClick = () => {
    navigate('/applications')
  }

  return (
    <Card
      hoverable
      onClick={handleClick}
      style={{ cursor: 'pointer' }}
    >
      <Statistic
        title="이번 달 신청 현황"
        value={total}
        prefix={<FileTextOutlined />}
        suffix="건"
        valueStyle={{ color: domainColorsHex.application.primary }}
      />
      {(isIncrease || isDecrease) && (
        <div style={{ marginTop: 8 }}>
          <Text
            type={isIncrease ? 'success' : 'danger'}
            style={{ fontSize: 12 }}
          >
            {isIncrease ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            {' '}
            {Math.abs(changeCount)}건 (전월 대비)
          </Text>
        </div>
      )}
      <Space size="small" style={{ marginTop: 16, flexWrap: 'wrap' }}>
        {statusCounts.submitted > 0 && (
          <Tag color={getApplicationStatusColor('submitted')}>
            접수: {statusCounts.submitted}
          </Tag>
        )}
        {statusCounts.reviewing > 0 && (
          <Tag color={getApplicationStatusColor('reviewing')}>
            검토: {statusCounts.reviewing}
          </Tag>
        )}
        {statusCounts.approved > 0 && (
          <Tag color={getApplicationStatusColor('approved')}>
            확정: {statusCounts.approved}
          </Tag>
        )}
        {statusCounts.rejected > 0 && (
          <Tag color={getApplicationStatusColor('rejected')}>
            거절: {statusCounts.rejected}
          </Tag>
        )}
      </Space>
      <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 8 }}>
        클릭하여 신청 목록으로 이동
      </Text>
    </Card>
  )
}

