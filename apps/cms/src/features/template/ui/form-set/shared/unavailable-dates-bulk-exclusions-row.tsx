import type { Dayjs } from 'dayjs'
import type { ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { DirectUnavailableDateAddButton } from '@/features/template/ui/form-set/shared/direct-unavailable-date-add-button'
import './unavailable-dates-bulk-exclusions-row.css'

export type UnavailableDatesBulkExclusionsRowProps = {
  disabledDate?: (date: Dayjs) => boolean
  initialCalendarDate?: Dayjs | null
  /** 모달 본문 첫 줄 — 면접/교육 등 맥락별 (예: 면접 진행 불가한 날짜를…) */
  modalUnavailableDescriptionLead?: ReactNode
  /** 모달 본문 둘째 줄 */
  modalUnavailableDescriptionSecond?: ReactNode
}

/** 면접·교육 등 공통 — 진행 불가일 직접 추가(chips) + 토/일/공휴일 제외 */
export function UnavailableDatesBulkExclusionsRow({
  disabledDate,
  initialCalendarDate,
  modalUnavailableDescriptionLead,
  modalUnavailableDescriptionSecond,
}: UnavailableDatesBulkExclusionsRowProps) {
  return (
    <div className="unavailable-dates-bulk-exclusions-row">
      <DirectUnavailableDateAddButton
        appliedDatesDisplay="chips"
        disabledDate={disabledDate}
        initialCalendarDate={initialCalendarDate}
        modalUnavailableDescriptionLead={modalUnavailableDescriptionLead}
        modalUnavailableDescriptionSecond={modalUnavailableDescriptionSecond}
      />
      <DetailInfoForm.InputsSeparator />
      <CmsCheckbox>토요일 제외</CmsCheckbox>
      <CmsCheckbox>일요일 제외</CmsCheckbox>
      <CmsCheckbox defaultChecked>공휴일 제외</CmsCheckbox>
    </div>
  )
}
