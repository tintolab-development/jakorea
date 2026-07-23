import { useCallback, useEffect } from 'react'
import type { ProgramRegistrationEducationScheduleMode } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { formatEducationScheduleLineFromRange } from '@/features/template/lib/format-education-schedule-line'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import {
  EducationSchedulePreviewLines,
} from '@/features/template/ui/shared/education-schedule-preview-lines'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import {
  updateProgramRegistrationOverlayKey,
  useProgramRegistrationOverlayKv,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import './program-registration-paragraph.css'

type EducationScheduleSettingsProps = {
  educationScheduleMode: ProgramRegistrationEducationScheduleMode
  onEducationScheduleModeChange: (value: ProgramRegistrationEducationScheduleMode) => void
  /** Overlay key prefix (e.g., 'generalRegistration.educationScheduleSettings') */
  overlayKeyPrefix?: string
}

export function ProgramRegistrationEducationScheduleSettingsParagraph({
  educationScheduleMode,
  onEducationScheduleModeChange,
  overlayKeyPrefix = 'generalRegistration.educationScheduleSettings',
}: EducationScheduleSettingsProps) {
  const scheduleMode = educationScheduleMode
  const [singleDateIso, setSingleDateIso] = useProgramRegistrationOverlayKv<string | null>(
    `${overlayKeyPrefix}.singleDateIso`,
    null
  )
  const [periodDateIso, setPeriodDateIso] = useProgramRegistrationOverlayKv<string | null>(
    `${overlayKeyPrefix}.periodDateIso`,
    null
  )
  const [scheduleLines] = useProgramRegistrationOverlayKv<string[]>(
    `${overlayKeyPrefix}.scheduleLines`,
    []
  )

  const singleDate = singleDateIso ? dayjs(singleDateIso) : null
  const setSingleDate = (d: Dayjs | null) => setSingleDateIso(d ? d.toISOString() : null)

  const periodDate = periodDateIso ? dayjs(periodDateIso) : null
  const setPeriodDate = (d: Dayjs | null) => setPeriodDateIso(d ? d.toISOString() : null)

  const scheduleLinesKey = `${overlayKeyPrefix}.scheduleLines`

  const appendLineIfNew = useCallback(
    (line: string) => {
      const trimmed = line.trim()
      if (!trimmed) return
      updateProgramRegistrationOverlayKey<string[]>(scheduleLinesKey, prev => {
        const current = prev ?? []
        return current.includes(trimmed) ? current : [...current, trimmed]
      })
    },
    [scheduleLinesKey]
  )

  const handleScheduleRangeApply = useCallback(
    (range: [Dayjs, Dayjs]) => {
      appendLineIfNew(formatEducationScheduleLineFromRange(range))
      setSingleDate(null)
      setPeriodDate(null)
    },
    [appendLineIfNew]
  )

  const removeLine = useCallback(
    (index: number) => {
      updateProgramRegistrationOverlayKey<string[]>(scheduleLinesKey, prev =>
        (prev ?? []).filter((_, i) => i !== index)
      )
    },
    [scheduleLinesKey]
  )

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
                onChange={e =>
                  onEducationScheduleModeChange(
                    e.target.value as ProgramRegistrationEducationScheduleMode
                  )
                }
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
