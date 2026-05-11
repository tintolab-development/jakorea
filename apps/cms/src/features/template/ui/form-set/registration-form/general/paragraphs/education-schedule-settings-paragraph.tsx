import { useMemo, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { ParagraphDatePicker } from '@/features/template/ui/paragraph/shared/paragraph-date-picker'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { formatAppDatepickerDisplay } from '@/shared/ui/cms-datepicker'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import './program-registration-paragraph.css'

type EducationScheduleMode = 'date' | 'period'

const EDUCATION_SCHEDULE_PREVIEW_PLACEHOLDER =
  '교육 진행 일정을 선택해 주세요. (해당 란에는 선택한 날짜가 노출됩니다.)'

function isValidDayjs(d: Dayjs | null | undefined): d is Dayjs {
  return d != null && d.isValid()
}

export function ProgramRegistrationEducationScheduleSettingsParagraph() {
  const [scheduleMode, setScheduleMode] = useState<EducationScheduleMode>('date')
  const [singleDate, setSingleDate] = useState<Dayjs | null>(null)
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null])

  const educationSchedulePreview = useMemo(() => {
    if (scheduleMode === 'period') {
      const [start, end] = dateRange
      if (isValidDayjs(start) && isValidDayjs(end)) {
        return (
          <div className="detail-info-form-inputs-wrapper-no-gap">
            <span className="detail-info-form--text nowrap">
              {formatAppDatepickerDisplay(start)}
            </span>
            <DetailInfoForm.InputsSeparator />
            <span className="detail-info-form--text nowrap">
              {formatAppDatepickerDisplay(end)}
            </span>
          </div>
        )
      }
      return (
        <span className="program-registration-paragraph__schedule-preview-placeholder">
          {EDUCATION_SCHEDULE_PREVIEW_PLACEHOLDER}
        </span>
      )
    }

    if (isValidDayjs(singleDate)) {
      return (
        <span className="detail-info-form--text">{formatAppDatepickerDisplay(singleDate)}</span>
      )
    }

    return (
      <span className="program-registration-paragraph__schedule-preview-placeholder">
        {EDUCATION_SCHEDULE_PREVIEW_PLACEHOLDER}
      </span>
    )
  }, [scheduleMode, dateRange, singleDate])

  return (
    <DetailInfoForm
      title="교육 진행 일정 설정"
      hideHeader
      mode="edit"
      className="program-registration-paragraph"
    >
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="교육 진행 방식"
          edit={
            <div className="program-registration-paragraph__schedule-inline">
              <CmsRadioGroup
                size="large"
                value={scheduleMode}
                onChange={e => setScheduleMode(e.target.value as EducationScheduleMode)}
              >
                <CmsRadio value="date">날짜 지정</CmsRadio>
                <CmsRadio value="period">기간 지정</CmsRadio>
              </CmsRadioGroup>
            </div>
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="교육 진행 일정 선택"
          edit={
            scheduleMode === 'date' ? (
              <ParagraphDatePicker
                mode="single"
                presetMode="date"
                customizable={false}
                suppressAutoTodayWhenEmpty
                value={singleDate}
                onChange={setSingleDate}
                width={240}
              />
            ) : (
              <ParagraphDatePicker
                mode="range"
                value={dateRange}
                onChange={setDateRange}
                width={360}
                placeholder={['시작일', '종료일']}
              />
            )
          }
          view="-"
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="교육 진행 예정일"
          fullRow
          readOnlyDisplay
          view={educationSchedulePreview}
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
