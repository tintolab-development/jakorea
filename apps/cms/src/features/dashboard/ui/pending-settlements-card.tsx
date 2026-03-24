/**
 * 대기 중인 정산 카드
 * Phase 4.5: 주요 액션 카드
 */

import { DollarOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { getPendingActionCounts } from '../api/admin-dashboard-service'
import { handleError } from '@/shared/utils/error-handler'
import { PendingActionCard } from './pending-action-card'

export function PendingSettlementsCard() {
  const [count, setCount] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const data = await getPendingActionCounts()
        setCount(data.pendingSettlements)
      } catch (error) {
        handleError(error, { defaultMessage: '대기 정산 수를 불러오는데 실패했습니다' })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <PendingActionCard
      title="대기 중인 정산"
      value={count}
      prefix={<DollarOutlined />}
      suffix="건"
      to="/programs/education/enrollment"
      loading={loading}
    />
  )
}
