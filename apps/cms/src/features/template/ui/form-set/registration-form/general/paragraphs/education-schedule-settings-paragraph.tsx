import { useCallback, useEffect } from 'react'
import type { ProgramRegistrationEducationScheduleMode } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import {
  buildEducationScheduleLinesFromDateAndGroupTimes,
  educationScheduleLinesEqual,
  flattenGroupTimeSlotsByDetail,
  formatEducationScheduleLineFromRange,
  rebuildEducationScheduleLinesFromGroupTimes,
  type EducationScheduleGroupTimeSlot,
} from '@/features/template/lib/format-education-schedule-line'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import {
  EducationSchedulePreviewLines,
} from '@/features/template/ui/shared/education-schedule-preview-lines'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import {
  GENERAL_REGISTRATION_OVERLAY_GROUP_TIMES_KEY,
  updateProgramRegistrationOverlayKey,
  useProgramRegistrationOverlayKv,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import './program-registration-paragraph.css'

const EMPTY_SCHEDULE_LINES: string[] = []
const EMPTY_GROUP_TIMES: Record<number, Array<EducationScheduleGroupTimeSlot | null>> = {}

type EducationScheduleSettingsProps = {
  educationScheduleMode: ProgramRegistrationEducationScheduleMode
  onEducationScheduleModeChange: (value: ProgramRegistrationEducationScheduleMode) => void
  /** Overlay key prefix (e.g., 'generalRegistration.educationScheduleSettings') */
  overlayKeyPrefix?: string
  /** 일반 개인·일정형·단일 회차 — 날짜 선택 시 진행 시간 자동 반영, 기간/시간 토글 숨김 */
  autoFillFromScheduleGroupTimes?: boolean
  /** 일반 개인·단일 회차 — 기간 지정 라디오·캘린더 기간 토글 비활성 */
  disablePeriodMode?: boolean
}

export function ProgramRegistrationEducationScheduleSettingsParagraph({
  educationScheduleMode,
  onEducationScheduleModeChange,
  overlayKeyPrefix = 'generalRegistration.educationScheduleSettings',
  autoFillFromScheduleGroupTimes = false,
  disablePeriodMode = false,
}: EducationScheduleSettingsProps) {
  const scheduleMode = educationScheduleMode
  const lockDateMode = disablePeriodMode || autoFillFromScheduleGroupTimes
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
    EMPTY_SCHEDULE_LINES
  )
  const [groupTimesByDetail] = useProgramRegistrationOverlayKv<
    Record<number, Array<EducationScheduleGroupTimeSlot | null>>
  >(GENERAL_REGISTRATION_OVERLAY_GROUP_TIMES_KEY, EMPTY_GROUP_TIMES)

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

  const handleDateApply = useCallback(
    (next: Dayjs | null) => {
      if (!next) {
        setSingleDate(null)
        return
      }
      if (autoFillFromScheduleGroupTimes) {
        const slots = flattenGroupTimeSlotsByDetail(groupTimesByDetail)
        for (const line of buildEducationScheduleLinesFromDateAndGroupTimes(next, slots)) {
          appendLineIfNew(line)
        }
        setSingleDate(null)
        return
      }
      setSingleDate(next)
    },
    [appendLineIfNew, autoFillFromScheduleGroupTimes, groupTimesByDetail]
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
    if (periodDateIso == null) return
    setPeriodDate(null)
  }, [periodDateIso, scheduleMode])

  useEffect(() => {
    if (!lockDateMode) return
    if (scheduleMode === 'date') return
    onEducationScheduleModeChange('date')
  }, [lockDateMode, onEducationScheduleModeChange, scheduleMode])

  const autoFillDatePicker = autoFillFromScheduleGroupTimes && scheduleMode === 'date'
  const groupTimeSlotsKey = JSON.stringify(flattenGroupTimeSlotsByDetail(groupTimesByDetail))

  useEffect(() => {
    if (!autoFillDatePicker) return
    const slots = flattenGroupTimeSlotsByDetail(groupTimesByDetail)
    updateProgramRegistrationOverlayKey<string[]>(scheduleLinesKey, prev => {
      const current = prev ?? []
      if (current.length === 0) return current
      const next = rebuildEducationScheduleLinesFromGroupTimes(current, slots)
      return educationScheduleLinesEqual(current, next) ? current : next
    })
  }, [autoFillDatePicker, groupTimeSlotsKey, scheduleLinesKey])

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
                value={lockDateMode ? 'date' : scheduleMode}
                onChange={e => {
                  const next = e.target.value as ProgramRegistrationEducationScheduleMode
                  if (lockDateMode && next === 'period') return
                  onEducationScheduleModeChange(next)
                }}
              >
                <CmsRadio value="date">날짜 지정</CmsRadio>
                <CmsRadio value="period" disabled={lockDateMode}>
                  기간 지정
                </CmsRadio>
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
                presetMode={autoFillDatePicker ? 'date' : 'schedule'}
                customizable={false}
                showTimeToggle={!autoFillDatePicker}
                showPeriodToggle={!lockDateMode}
                suppressAutoTodayWhenEmpty
                value={singleDate}
                onChange={handleDateApply}
                onRangeChange={autoFillDatePicker ? undefined : handleScheduleRangeApply}
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
