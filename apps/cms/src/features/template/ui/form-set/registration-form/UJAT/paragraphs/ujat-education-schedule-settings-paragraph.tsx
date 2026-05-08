import { useState } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { ParagraphDatePicker } from '@/features/template/ui/paragraph/shared/paragraph-date-picker'
import { DirectUnavailableDateAddButton } from '@/features/template/ui/form-set/shared/direct-unavailable-date-add-button'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import './ujat-education-schedule-settings-paragraph.css'

const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

function formatUnavailableDateLabel(isoDate: string): string {
  const d = dayjs(isoDate)
  if (!d.isValid()) return isoDate
  return `${d.format('YY년 M월 D일')}(${WEEKDAYS_KO[d.day()]})`
}

function SemesterScheduleBlock({ title }: { title: string }) {
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null]>([null, null])
  const [unavailableDates, setUnavailableDates] = useState<string[]>([])

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
              <div className="detail-info-form-inputs-wrapper">
                <CmsCheckbox defaultChecked>공휴일 제외</CmsCheckbox>
                <DetailInfoForm.InputsSeparator />
                <DirectUnavailableDateAddButton onApplyDatesChange={setUnavailableDates} />
                {unavailableDates.length > 0 ? (
                  <span className="ujat-education-schedule-settings__unavailable-tag">
                    {unavailableDates.map(formatUnavailableDateLabel).join(', ')}
                  </span>
                ) : null}
              </div>
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
