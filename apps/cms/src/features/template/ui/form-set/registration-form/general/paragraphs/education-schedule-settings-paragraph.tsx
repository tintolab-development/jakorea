import { useCallback, useEffect, useState } from 'react'
import type { Dayjs } from 'dayjs'
import { formatEducationScheduleLineFromRange } from '@/features/template/lib/format-education-schedule-line'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import {
  EducationSchedulePreviewLines,
} from '@/features/template/ui/shared/education-schedule-preview-lines'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import './program-registration-paragraph.css'

type EducationScheduleMode = 'date' | 'period'

export function ProgramRegistrationEducationScheduleSettingsParagraph() {
  const [scheduleMode, setScheduleMode] = useState<EducationScheduleMode>('date')
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
    if (scheduleMode !== 'date') return
    setPeriodDate(null)
  }, [scheduleMode])

  useEffect(() => {
    if (scheduleMode !== 'period') return
    setSingleDate(null)
  }, [scheduleMode])

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
                presetMode="schedule"
                customizable={false}
                suppressAutoTodayWhenEmpty
                value={singleDate}
                onChange={setSingleDate}
                onRangeChange={handleScheduleRangeApply}
                width={240}
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
            <EducationSchedulePreviewLines lines={scheduleLines} onRemove={removeLine} />
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
