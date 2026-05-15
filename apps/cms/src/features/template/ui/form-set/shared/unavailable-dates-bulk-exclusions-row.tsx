import type { Dayjs } from 'dayjs'
import type { ReactNode } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { DirectUnavailableDateAddButton } from '@/features/template/ui/form-set/shared/direct-unavailable-date-add-button'
import './unavailable-dates-bulk-exclusions-row.css'

export type UnavailableDatesBulkExclusionsRowProps = {
  disabledDate?: (date: Dayjs) => boolean
  initialCalendarDate?: Dayjs | null
  /** `YYYY-MM-DD` 목록 — 넘기면 직접 추가 칩이 제어 모드(풀페이지·미리보기 공유) */
  appliedDates?: string[]
  onApplyDatesChange?: (dates: string[]) => void
  /** 모달 본문 첫 줄 — 면접/교육 등 맥락별 (예: 면접 진행 불가한 날짜를…) */
  modalUnavailableDescriptionLead?: ReactNode
  /** 모달 본문 둘째 줄 */
  modalUnavailableDescriptionSecond?: ReactNode
  /**
   * `false`이면 「진행 불가일 직접 추가」 클릭 시 날짜 모달을 열지 않고 `onDirectUnavailableModalBlocked`만 호출
   * (예: 교육 진행 일정 범위 미선택)
   */
  canOpenDirectUnavailableModal?: boolean
  onDirectUnavailableModalBlocked?: () => void
}

/** 면접·교육 등 공통 — 진행 불가일 직접 추가(chips) + 토/일/공휴일 제외 */
export function UnavailableDatesBulkExclusionsRow({
  disabledDate,
  initialCalendarDate,
  appliedDates,
  onApplyDatesChange,
  modalUnavailableDescriptionLead,
  modalUnavailableDescriptionSecond,
  canOpenDirectUnavailableModal,
  onDirectUnavailableModalBlocked,
}: UnavailableDatesBulkExclusionsRowProps) {
  return (
    <div className="unavailable-dates-bulk-exclusions-row">
      <DirectUnavailableDateAddButton
        appliedDatesDisplay="chips"
        disabledDate={disabledDate}
        initialCalendarDate={initialCalendarDate}
        appliedDates={appliedDates}
        onApplyDatesChange={onApplyDatesChange}
        modalUnavailableDescriptionLead={modalUnavailableDescriptionLead}
        modalUnavailableDescriptionSecond={modalUnavailableDescriptionSecond}
        canOpenDirectUnavailableModal={canOpenDirectUnavailableModal}
        onDirectUnavailableModalBlocked={onDirectUnavailableModalBlocked}
      />
      <DetailInfoForm.InputsSeparator />
      <CmsCheckbox>토요일 제외</CmsCheckbox>
      <CmsCheckbox>일요일 제외</CmsCheckbox>
      <CmsCheckbox defaultChecked>공휴일 제외</CmsCheckbox>
    </div>
  )
}
