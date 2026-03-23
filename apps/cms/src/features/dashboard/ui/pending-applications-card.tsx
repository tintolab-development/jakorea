/**
 * 대기 중인 신청 카드
 * Phase 4.5: 주요 액션 카드
 */

import { FileTextOutlined } from '@ant-design/icons'
import { useState, useEffect } from 'react'
import { getPendingActionCounts } from '../api/admin-dashboard-service'
import { handleError } from '@/shared/utils/error-handler'
import { PendingActionCard } from './pending-action-card'

export function PendingApplicationsCard() {
  const [count, setCount] = useState<number>(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      try {
        const data = await getPendingActionCounts()
        setCount(data.pendingApplications)
      } catch (error) {
        handleError(error, { defaultMessage: '대기 신청 수를 불러오는데 실패했습니다' })
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  return (
    <PendingActionCard
      title="대기 중인 신청"
      value={count}
      prefix={<FileTextOutlined />}
      suffix="건"
      to="/applications?status=submitted"
      loading={loading}
    />
  )
}
