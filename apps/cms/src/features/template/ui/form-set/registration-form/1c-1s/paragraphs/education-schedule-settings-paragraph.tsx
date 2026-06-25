/**
 * 1사 1교 프로그램 등록 폼 — 교육 진행 일정 설정
 */
import { useMemo, useState } from 'react'
import type { ProgramRegistrationEducationScheduleMode } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import type { Dayjs } from 'dayjs'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import {
  EducationSchedulePreviewLines,
  EDUCATION_SCHEDULE_PREVIEW_PLACEHOLDER,
} from '@/features/template/ui/shared/education-schedule-preview-lines'
import { patchInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { formatAppDatepickerDisplay } from '@/shared/ui/cms-datepicker'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

function isValidDayjs(d: Dayjs | null | undefined): d is Dayjs {
  return d != null && d.isValid()
}

export function OneCOneSRegistrationEducationScheduleSettingsParagraph({
  educationScheduleMode: _educationScheduleMode,
  onEducationScheduleModeChange: _onEducationScheduleModeChange,
}: {
  educationScheduleMode: ProgramRegistrationEducationScheduleMode
  onEducationScheduleModeChange: (value: ProgramRegistrationEducationScheduleMode) => void
}) {
  const [dateRange, setDateRange] = useState<[Dayjs | null, Dayjs | null]>([null, null])

  const handleDateRangeChange = (next: [Dayjs | null, Dayjs | null]) => {
    setDateRange(next)
    const [start, end] = next
    patchInstitutionApplicationProgramBridge({
      educationScheduleRange:
        isValidDayjs(start) && isValidDayjs(end)
          ? { start: start.toISOString(), end: end.toISOString() }
          : undefined,
    })
  }

  const previewLines = useMemo((): string[] => {
    const [start, end] = dateRange
    if (isValidDayjs(start) && isValidDayjs(end)) {
      return [`${formatAppDatepickerDisplay(start)} ~ ${formatAppDatepickerDisplay(end)}`]
    }
    return []
  }, [dateRange])

  const rangePlaceholder: [string, string] = ['진행 기간을 선택하세요', '진행 기간을 선택하세요']

  return (
    <DetailInfoForm
      title="교육 진행 일정 설정"
      hideHeader
      mode="edit"
      className="program-registration-paragraph"
    >
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="교육 진행 일정 선택"
          fullRow
          edit={
            <ParagraphDatePicker
              mode="range"
              value={dateRange}
              onChange={handleDateRangeChange}
              width={360}
              placeholder={rangePlaceholder}
            />
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
