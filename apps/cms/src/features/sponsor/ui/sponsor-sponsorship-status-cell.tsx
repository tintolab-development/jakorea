import { memo, useCallback, useState } from 'react'
import type { SponsorSponsorshipStatus } from '@/types/domain'
import { SPONSOR_SPONSORSHIP_STATUS_VALUES } from '@/features/sponsor/model/sponsorship-status'
import { SponsorSponsorshipStatusBadge } from '@/features/sponsor/ui/sponsor-sponsorship-status-badge'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import {
  STATUS_DROPDOWN_CELL_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_100_CLASSNAME,
  StatusDropdownCell,
} from '@/shared/components/status-dropdown-cell'

const SPONSORSHIP_STATUS_OPTIONS = SPONSOR_SPONSORSHIP_STATUS_VALUES

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
      renderBadge={s => <SponsorSponsorshipStatusBadge status={s} />}
      isItemDisabled={(cur, opt) => cur === opt}
      onChange={canWrite ? handleChange : undefined}
      isOpen={open}
      onOpenChange={setOpen}
      tagLayout="tag100"
    />
  )
})

export const SPONSOR_STATUS_CELL_CLASSNAME = `${STATUS_DROPDOWN_CELL_CLASSNAME} ${STATUS_DROPDOWN_CELL_TAG_100_CLASSNAME}`
