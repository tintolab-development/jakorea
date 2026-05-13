import { useCallback, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { UnavailableDatesBulkExclusionsRow } from '@/features/template/ui/form-set/shared/unavailable-dates-bulk-exclusions-row'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import './ujat-education-schedule-settings-paragraph.css'

const FRIDAY_DAY = 5
const disableNonFriday = (date: Dayjs) => date.day() !== FRIDAY_DAY

function SemesterScheduleBlock({ title }: { title: string }) {
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null]>([null, null])
  const [rangeStart, rangeEnd] = range
  const disableUnavailableDate = useCallback(
    (date: Dayjs) => {
      if (rangeStart == null || rangeEnd == null) return true

      const start = rangeStart.isBefore(rangeEnd, 'day') ? rangeStart : rangeEnd
      const end = rangeStart.isBefore(rangeEnd, 'day') ? rangeEnd : rangeStart

      return disableNonFriday(date) || date.isBefore(start, 'day') || date.isAfter(end, 'day')
    },
    [rangeStart, rangeEnd]
  )

  return (
    <div className="ujat-education-schedule-settings__block">
      <div className="ujat-education-schedule-settings__subheading">{title}</div>
      <DetailInfoForm
        title={title}
        hideHeader
        mode="edit"
        className="program-registration-paragraph"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육 진행 일정"
            edit={
              <ParagraphDatePicker
                mode="range"
                value={range}
                onChange={setRange}
                placeholder={['시작일', '종료일']}
                disabledDate={disableNonFriday}
                className="ujat-education-schedule-settings__range-picker"
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육 진행 불가일"
            fullRow
            edit={
              <UnavailableDatesBulkExclusionsRow
                disabledDate={disableUnavailableDate}
                initialCalendarDate={rangeStart ?? rangeEnd}
                modalUnavailableDescriptionLead="교육 진행 불가한 날짜를 모두 선택해 주세요."
                modalUnavailableDescriptionSecond="선택된 날짜는 교육 진행 일정으로 신청할 수 없습니다."
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}

/** 교육 진행 일정 설정 — 상/하반기 공통 UI */
export function UjatEducationScheduleSettingsParagraph() {
  return (
    <div className="ujat-education-schedule-settings">
      <SemesterScheduleBlock title="■ 상반기 (1학기)" />
      <SemesterScheduleBlock title="■ 하반기 (2학기)" />
    </div>
  )
}
