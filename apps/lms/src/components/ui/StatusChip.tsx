/**
 * 상태 표시용 Chip 컴포넌트
 * 상태값에 따라 적절한 배경색을 가진 Chip을 렌더링
 */

import './StatusChip.css'

interface StatusChipProps {
  status: string
  label: string
  className?: string
}

export default function StatusChip({ status, label, className = '' }: StatusChipProps) {
  // 상태값에 따라 CSS 클래스 매핑
  const getStatusClass = (status: string): string => {
    switch (status) {
      // 활성 상태
      case 'active':
        return 'status-active'
      // 대기중 상태
      case 'pending':
      case 'submitted':
        return 'status-pending'
      // 검토중 상태
      case 'reviewing':
        return 'status-pending'
      // 승인/확정 상태
      case 'approved':
        return 'status-approved'
      // 지급완료 상태
      case 'paid':
        return 'status-paid'
      // 비활성 상태
      case 'inactive':
        return 'status-inactive'
      // 거절 상태
      case 'rejected':
        return 'status-rejected'
      // 취소 상태
      case 'cancelled':
        return 'status-cancelled'
      // 산출완료 상태
      case 'calculated':
        return 'status-calculated'
      default:
        return 'status-pending'
    }
  }

  return (
    <span className={`status-chip ${getStatusClass(status)} ${className}`.trim()}>
      {label}
    </span>
  )
}







