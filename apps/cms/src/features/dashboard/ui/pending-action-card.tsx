/**
 * 대기 중인 액션 카드 공통 Presentational 컴포넌트
 * 신청/매칭/정산 대기 카드에서 재사용
 */

import { Card, Statistic } from 'antd'
import { ArrowRightOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import './card-link.css'

export interface PendingActionCardProps {
  title: string
  value: number
  prefix?: React.ReactNode
  suffix: string
  to: string
  loading?: boolean
}

export function PendingActionCard({
  title,
  value,
  prefix,
  suffix,
  to,
  loading = false,
}: PendingActionCardProps) {
  return (
    <Link to={to} className="dashboard-card-link">
      <Card hoverable style={{ height: '100%' }} loading={loading}>
        <Statistic
          title={title}
          value={value}
          prefix={prefix}
          suffix={suffix}
          valueStyle={{
            color: value > 0 ? '#faad14' : '#000000',
            fontWeight: 'bold',
          }}
        />
        {value > 0 && (
          <span className="dashboard-card-link__action">
            <ArrowRightOutlined aria-hidden />
            처리하기
          </span>
        )}
      </Card>
    </Link>
  )
}
