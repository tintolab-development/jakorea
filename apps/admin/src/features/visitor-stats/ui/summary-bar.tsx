/**
 * 총 방문자 수 합계 바
 */

import { formatVisitorCount } from '@/features/visitor-stats/lib/format'

import './section-shared.css'

type Props = {
  total: number
  loading?: boolean
}

export function VisitorStatsSummaryBar({ total, loading }: Props) {
  return (
    <div className="visitor-stats-summary" aria-live="polite">
      <div className="visitor-stats-summary__header">총 방문자 수 합계</div>
      <div className="visitor-stats-summary__value">
        {loading ? '…' : formatVisitorCount(total)}
      </div>
    </div>
  )
}
