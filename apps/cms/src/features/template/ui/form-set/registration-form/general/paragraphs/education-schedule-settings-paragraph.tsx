import { useCallback, useEffect } from 'react'
import type { ProgramRegistrationEducationScheduleMode } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import {
  educationScheduleLinesEqual,
  flattenGroupTimeSlotsByDetail,
  educationScheduleLinesFromSelectionRangeApply,
  rebuildEducationScheduleLinesFromGroupTimes,
  type EducationScheduleGroupTimeSlot,
} from '@/features/template/lib/format-education-schedule-line'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import {
  EducationSchedulePreviewLines,
} from '@/features/template/ui/shared/education-schedule-preview-lines'
import { RegistrationWizardDetailInfoForm as DetailInfoForm } from '@/features/program/shared/ui/registration/registration-wizard-detail-info-form'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { applyEducationScheduleModeLineSwap } from '@/features/program/shared/lib/education-schedule-mode-lines'
import {
  educationOperationRangeSealKeyFromSchedulePrefix,
  isOutsideEducationOperationRange,
  toEducationOperationDayjs,
  type EducationOperationRangeSeal,
} from '@/features/program/shared/lib/education-schedule-change'
import {
  GENERAL_REGISTRATION_OVERLAY_GROUP_TIMES_KEY,
  updateProgramRegistrationOverlayKey,
  useProgramRegistrationOverlayKv,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import {
  getEducationScheduleSelectionDatePickerProps,
  shouldDisableEducationSchedulePeriodTimeInput,
} from '@/features/program/general/lib/schedule-detail-form'
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
  programType?: 'curriculum' | 'schedule'
  sessionRound?: 'single' | 'multi'
  participantOrganization?: boolean
}

export function ProgramRegistrationEducationScheduleSettingsParagraph({
  educationScheduleMode,
  onEducationScheduleModeChange,
  overlayKeyPrefix = 'generalRegistration.educationScheduleSettings',
  autoFillFromScheduleGroupTimes = false,
  disablePeriodMode = false,
  programType = 'curriculum',
  sessionRound = 'single',
  participantOrganization = false,
}: EducationScheduleSettingsProps) {
  const scheduleMode = educationScheduleMode
  const lockDateMode = disablePeriodMode || autoFillFromScheduleGroupTimes
  const disableSchedulePeriodTime = shouldDisableEducationSchedulePeriodTimeInput({
    educationScheduleMode: scheduleMode,
  })
  const scheduleSelectionPickerProps = getEducationScheduleSelectionDatePickerProps({
    educationStructure: programType,
    participantOrganization,
    sessionRound,
    scheduleMode,
  })
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
  const [operationRangeSeal] = useProgramRegistrationOverlayKv<EducationOperationRangeSeal>(
    educationOperationRangeSealKeyFromSchedulePrefix(overlayKeyPrefix),
    null
  )
  const operationStart = toEducationOperationDayjs(operationRangeSeal?.start)
  const operationEnd = toEducationOperationDayjs(operationRangeSeal?.end)
  const disableOutsideOperation = (date: Dayjs) =>
    isOutsideEducationOperationRange(date, operationStart, operationEnd)
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
      const slots = flattenGroupTimeSlotsByDetail(groupTimesByDetail)
      const lines = educationScheduleLinesFromSelectionRangeApply({
        range,
        autoFillFromScheduleGroupTimes,
        educationScheduleMode: scheduleMode,
        groupTimeSlots: slots,
        dateOnlyPeriodRange: disableSchedulePeriodTime,
      })
      for (const line of lines) appendLineIfNew(line)
      setSingleDate(null)
      setPeriodDate(null)
    },
    [
      appendLineIfNew,
      autoFillFromScheduleGroupTimes,
      disableSchedulePeriodTime,
      groupTimesByDetail,
      scheduleMode,
    ]
  )

  const handleDateApply = useCallback(
    (next: Dayjs | null) => {
      if (!next) {
        setSingleDate(null)
        return
      }
      handleScheduleRangeApply([next.startOf('day'), next.startOf('day')])
    },
    [handleScheduleRangeApply]
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
    applyEducationScheduleModeLineSwap({
      overlayKeyPrefix,
      currentMode: scheduleMode,
      nextMode: 'date',
    })
    onEducationScheduleModeChange('date')
  }, [lockDateMode, onEducationScheduleModeChange, overlayKeyPrefix, scheduleMode])

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
                  applyEducationScheduleModeLineSwap({
                    overlayKeyPrefix,
                    currentMode: scheduleMode,
                    nextMode: next,
                  })
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
          validationKey={[
            'educationScheduleSettings.singleDateIso',
            'educationScheduleSettings.periodDateIso',
          ]}
          edit={
            <ParagraphDatePicker
              mode="single"
              customizable={false}
              showPeriodToggle={false}
              showTimeToggle={false}
              {...scheduleSelectionPickerProps}
              suppressAutoTodayWhenEmpty
              value={scheduleMode === 'date' ? singleDate : periodDate}
              onChange={scheduleMode === 'date' ? handleDateApply : setPeriodDate}
              onRangeChange={handleScheduleRangeApply}
              width={scheduleMode === 'date' ? 240 : 360}
              disabledDate={disableOutsideOperation}
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
            <div className="program-registration-paragraph__schedule-lines">
              <EducationSchedulePreviewLines lines={scheduleLines} onRemove={removeLine} />
            </div>
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
