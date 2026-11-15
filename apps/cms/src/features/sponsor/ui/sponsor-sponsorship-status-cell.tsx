import { memo, useCallback, useState } from 'react'
import type { SponsorSponsorshipStatus } from '@/types/domain'
import { SPONSOR_SPONSORSHIP_STATUS_VALUES } from '@/features/sponsor/model/sponsorship-status'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import {
  STATUS_DROPDOWN_CELL_CLASSNAME,
  StatusDropdownCell,
} from '@/shared/components/status-dropdown-cell'
import type { StatusTagSpec } from '@/shared/components/status-tag'
import { getSponsorSponsorshipStatusTag } from '@/shared/lib/status-tag-specs'

const SPONSORSHIP_STATUS_OPTIONS = SPONSOR_SPONSORSHIP_STATUS_VALUES

/**
 * 후원사 목록 후원 상태 태그 — 시안 80×32(`compact`), 후원 종료는 배경 6%·테두리 10%
 * (공통 red 프리셋 배경 10%보다 옅음 → accentColor로 지정). QA 2026-11-15 데이터 관리 C2
 */
function getSponsorListStatusTag(status: SponsorSponsorshipStatus): StatusTagSpec {
  const tag = getSponsorSponsorshipStatusTag(status)
  if (status === 'ended') {
    return { label: tag.label, accentColor: 'var(--editable-badge-red-text, #c32f4a)', width: 'compact' }
  }
  return { ...tag, width: 'compact' }
}

type SponsorSponsorshipStatusCellProps = {
  row: SponsorManagementRow
  canWrite: boolean
  onStatusChange: (row: SponsorManagementRow, status: SponsorSponsorshipStatus) => void
}

/**
 * 드롭다운 open 상태를 셀 로컬로 두어 columns useMemo deps에서 제외한다.
 */
export const SponsorSponsorshipStatusCell = memo(function SponsorSponsorshipStatusCell({
  row,
  canWrite,
  onStatusChange,
}: SponsorSponsorshipStatusCellProps) {
  const [open, setOpen] = useState(false)

  const handleChange = useCallback(
    (newStatus: SponsorSponsorshipStatus) => {
      onStatusChange(row, newStatus)
      setOpen(false)
    },
    [onStatusChange, row]
  )

  return (
    <StatusDropdownCell<SponsorSponsorshipStatus>
      status={row.sponsorshipStatus ?? 'active'}
      statusOptions={SPONSORSHIP_STATUS_OPTIONS}
      getTag={getSponsorListStatusTag}
      isItemDisabled={(cur, opt) => cur === opt}
      onChange={canWrite ? handleChange : undefined}
      isOpen={open}
      onOpenChange={setOpen}
    />
  )
})

export const SPONSOR_STATUS_CELL_CLASSNAME = STATUS_DROPDOWN_CELL_CLASSNAME
