/**
 * 1사 1교 프로그램 등록 폼 — 교육 진행 일정 설정
 */
import { useMemo, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import {
  EducationSchedulePreviewLines,
  EDUCATION_SCHEDULE_PREVIEW_PLACEHOLDER,
} from '@/features/template/ui/shared/education-schedule-preview-lines'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { formatAppDatepickerDisplay } from '@/shared/ui/cms-datepicker'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

type EducationScheduleMode = 'date' | 'period'

function isValidDayjs(d: Dayjs | null | undefined): d is Dayjs {
  return d != null && d.isValid()
}

export function OneCOneSRegistrationEducationScheduleSettingsParagraph() {
  const [scheduleMode, setScheduleMode] = useState<EducationScheduleMode>('period')
  const [singleDate, setSingleDate] = useState<Dayjs | null>(null)
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null])

  const previewLines = useMemo((): string[] => {
    if (scheduleMode === 'period') {
      const [start, end] = dateRange
      if (isValidDayjs(start) && isValidDayjs(end)) {
        return [`${formatAppDatepickerDisplay(start)} ~ ${formatAppDatepickerDisplay(end)}`]
      }
      return []
    }

    if (isValidDayjs(singleDate)) {
      return [formatAppDatepickerDisplay(singleDate)]
    }

    return []
  }, [scheduleMode, dateRange, singleDate])

  const rangePlaceholder: [string, string] = ['진행 기간을 선택하세요', '진행 기간을 선택하세요']

  return (
    <DetailInfoForm
      title="교육 진행 일정 설정"
      hideHeader
      mode="edit"
      className="program-registration-paragraph"
    >
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="교육 진행 일정 유형"
          edit={
            <div className="program-registration-paragraph__schedule-inline">
              <CmsRadioGroup
                size="large"
                value={scheduleMode}
                onChange={e => setScheduleMode(e.target.value as EducationScheduleMode)}
              >
                <CmsRadio value="date" disabled>
                  날짜 지정
                </CmsRadio>
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
                placeholder={rangePlaceholder}
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
          view={
            <EducationSchedulePreviewLines
              lines={previewLines}
              placeholder={EDUCATION_SCHEDULE_PREVIEW_PLACEHOLDER}
            />
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
