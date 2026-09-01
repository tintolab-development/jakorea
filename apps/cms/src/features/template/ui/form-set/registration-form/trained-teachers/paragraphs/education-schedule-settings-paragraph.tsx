import { useCallback, useEffect } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { ProgramRegistrationEducationScheduleMode } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { formatEducationScheduleLineFromRange } from '@/features/template/lib/format-education-schedule-line'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { EducationSchedulePreviewLines } from '@/features/template/ui/shared/education-schedule-preview-lines'
import {
  updateProgramRegistrationOverlayKey,
  useProgramRegistrationOverlayKv,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

type TrainedTeachersRegistrationEducationScheduleSettingsParagraphProps = {
  educationScheduleMode: ProgramRegistrationEducationScheduleMode
  onEducationScheduleModeChange: (value: ProgramRegistrationEducationScheduleMode) => void
  /** Overlay key prefix (default: 'trainedTeachersRegistration.educationScheduleSettings') */
  overlayKeyPrefix?: string
}

export function TrainedTeachersRegistrationEducationScheduleSettingsParagraph({
  educationScheduleMode,
  onEducationScheduleModeChange,
  overlayKeyPrefix = 'trainedTeachersRegistration.educationScheduleSettings',
}: TrainedTeachersRegistrationEducationScheduleSettingsParagraphProps) {
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
  const scheduleLinesKey = `${overlayKeyPrefix}.scheduleLines`

  const singleDate = singleDateIso ? dayjs(singleDateIso) : null
  const setSingleDate = (d: Dayjs | null) => setSingleDateIso(d ? d.toISOString() : null)

  const periodDate = periodDateIso ? dayjs(periodDateIso) : null
  const setPeriodDate = (d: Dayjs | null) => setPeriodDateIso(d ? d.toISOString() : null)

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
