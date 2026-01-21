/**
 * 신청 진행 상태 변경 드롭다운
 * Phase 4.6: 상태 운영 관리
 */

import { Select } from 'antd'
import { useStatusChange } from '../hooks/use-status-change'
import {
  type ApplicationProgressStatus,
  getNextProgressStatuses,
  PROGRESS_STATUS_LABELS,
} from '@/types/application-progress'

const { Option } = Select

interface StatusChangeDropdownProps {
  applicationId: string
  currentStatus: ApplicationProgressStatus
  onStatusChange?: (newStatus: ApplicationProgressStatus) => void
  disabled?: boolean
}

export function StatusChangeDropdown({
  applicationId,
  currentStatus,
  onStatusChange,
  disabled = false,
}: StatusChangeDropdownProps) {
  const { changeStatus, loading } = useStatusChange()

  const nextStatuses = getNextProgressStatuses(currentStatus)

  const handleChange = async (newStatus: ApplicationProgressStatus) => {
    try {
      await changeStatus(applicationId, newStatus)
      onStatusChange?.(newStatus)
    } catch {
      // 에러는 useStatusChange에서 처리됨
    }
  }

  if (nextStatuses.length === 0) {
    return (
      <Select value={currentStatus} disabled style={{ width: 200 }}>
        <Option value={currentStatus}>{PROGRESS_STATUS_LABELS[currentStatus]}</Option>
      </Select>
    )
  }

  return (
    <Select
      value={currentStatus}
      onChange={handleChange}
      loading={loading}
      disabled={disabled || loading}
      style={{ width: 200 }}
    >
      <Option value={currentStatus}>{PROGRESS_STATUS_LABELS[currentStatus]}</Option>
      {nextStatuses.map(status => (
        <Option key={status} value={status}>
          {PROGRESS_STATUS_LABELS[status]}
        </Option>
      ))}
    </Select>
  )
}
