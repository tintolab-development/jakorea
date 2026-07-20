import { useCallback, useEffect, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { ProgramRegistrationEducationScheduleMode } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { formatEducationScheduleLineFromRange } from '@/features/template/lib/format-education-schedule-line'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { EducationSchedulePreviewLines } from '@/features/template/ui/shared/education-schedule-preview-lines'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

type TrainedTeachersRegistrationEducationScheduleSettingsParagraphProps = {
  educationScheduleMode: ProgramRegistrationEducationScheduleMode
  onEducationScheduleModeChange: (value: ProgramRegistrationEducationScheduleMode) => void
}

export function TrainedTeachersRegistrationEducationScheduleSettingsParagraph({
  educationScheduleMode,
  onEducationScheduleModeChange,
}: TrainedTeachersRegistrationEducationScheduleSettingsParagraphProps) {
  const [singleDate, setSingleDate] = useState<Dayjs | null>(null)
  const [periodDate, setPeriodDate] = useState<Dayjs | null>(null)
  const [scheduleLines, setScheduleLines] = useState<string[]>([])

  const appendLineIfNew = useCallback((line: string) => {
    const trimmed = line.trim()
    if (!trimmed) return
    setScheduleLines(prev => (prev.includes(trimmed) ? prev : [...prev, trimmed]))
  }, [])

  const handleScheduleRangeApply = useCallback(
    (range: [Dayjs, Dayjs]) => {
      appendLineIfNew(formatEducationScheduleLineFromRange(range))
      setSingleDate(null)
      setPeriodDate(null)
    },
    [appendLineIfNew]
  )

  const removeLine = useCallback((index: number) => {
    setScheduleLines(prev => prev.filter((_, i) => i !== index))
  }, [])

  useEffect(() => {
    if (educationScheduleMode !== 'date') return
    setPeriodDate(null)
  }, [educationScheduleMode])

  useEffect(() => {
    if (educationScheduleMode !== 'period') return
    setSingleDate(null)
  }, [educationScheduleMode])

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
            <CmsRadioGroup
              size="large"
              value={educationScheduleMode}
              onChange={e =>
                onEducationScheduleModeChange(
                  e.target.value as ProgramRegistrationEducationScheduleMode
                )
              }
            >
              <CmsRadio value="date">날짜 지정</CmsRadio>
              <CmsRadio value="period">기간 지정</CmsRadio>
            </CmsRadioGroup>
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="교육 진행 일정 선택"
          edit={
            educationScheduleMode === 'date' ? (
              <ParagraphDatePicker
                mode="single"
                presetMode="schedule"
                customizable={false}
                suppressAutoTodayWhenEmpty
                value={singleDate}
                onChange={setSingleDate}
                onRangeChange={handleScheduleRangeApply}
                width={240}
                placeholder="날짜를 선택하세요"
              />
            ) : (
              <ParagraphDatePicker
                mode="single"
                presetMode="period"
                customizable={false}
                suppressAutoTodayWhenEmpty
                value={periodDate}
                onChange={setPeriodDate}
                onRangeChange={handleScheduleRangeApply}
                width={360}
                placeholder="기간을 선택하세요"
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
          view={<EducationSchedulePreviewLines lines={scheduleLines} onRemove={removeLine} />}
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
