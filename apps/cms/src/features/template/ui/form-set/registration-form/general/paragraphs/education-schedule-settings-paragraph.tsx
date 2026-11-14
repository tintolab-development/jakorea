import { useCallback, useEffect, useMemo, useState } from 'react'
import type { ProgramRegistrationEducationScheduleMode } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import {
  educationScheduleLinesEqual,
  educationScheduleLinesFromSelectionRangeApply,
  mergeUniqueEducationScheduleLines,
  normalizeEducationSchedulePeriodLineDateOnly,
  rebuildEducationScheduleLinesFromGroupTimes,
  type EducationScheduleGroupTimeSlot,
} from '@/features/template/lib/format-education-schedule-line'
import { resolveEducationScheduleGroupTimeSlots } from '@/features/program/general/lib/education-schedule-lines-display'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import {
  EDUCATION_SCHEDULE_PREVIEW_PLACEHOLDER,
  EducationSchedulePreviewLines,
} from '@/features/template/ui/shared/education-schedule-preview-lines'
import { RegistrationWizardDetailInfoForm as DetailInfoForm } from '@/features/program/shared/ui/registration/registration-wizard-detail-info-form'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { applyEducationScheduleModeLineSwap } from '@/features/program/shared/lib/education-schedule-mode-lines'
import {
  educationOperationRangeSealKeyFromSchedulePrefix,
  isEducationScheduleSelectionDateDisabled,
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
  shouldLockEducationScheduleDateMode,
} from '@/features/program/general/lib/schedule-detail-form'
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'
import './program-registration-paragraph.css'

/** 시안 — 「교육 진행 일정 선택」 트리거 문구(날짜 지정 / 기간 지정) */
const SCHEDULE_SELECTION_PLACEHOLDER = {
  date: '날짜를 선택해 주세요',
  period: '진행 기간을 선택해 주세요',
} as const

/** 시안 — 「교육 진행 예정일」 빈 값 안내(기간 지정은「기간」) */
const SCHEDULE_PREVIEW_PERIOD_PLACEHOLDER =
  '교육 진행 일정을 선택해 주세요. (해당 란에는 선택한 기간이 노출됩니다.)'

const EMPTY_SCHEDULE_LINES: string[] = []
const EMPTY_GROUP_TIMES: Record<number, Array<EducationScheduleGroupTimeSlot | null>> = {}

type EducationScheduleSettingsProps = {
  educationScheduleMode: ProgramRegistrationEducationScheduleMode
  onEducationScheduleModeChange: (value: ProgramRegistrationEducationScheduleMode) => void
  /** Overlay key prefix (e.g., 'generalRegistration.educationScheduleSettings') */
  overlayKeyPrefix?: string
  /** 일반 일정형·단일 — 날짜 선택 시 진행 시간 자동 반영(기관·개인). 기간 라디오 잠금은 SSOT `shouldLockEducationScheduleDateMode` */
  autoFillFromScheduleGroupTimes?: boolean
  /** @deprecated 잠금은 `shouldLockEducationScheduleDateMode` — 호환용으로만 전달 */
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
  // 템플릿 관리 등록 폼 시안(12931:3911 · 12829:411618): 「교육 진행 일정 유형」 미선택 시작, 일정 선택 240.
  // 기본값(날짜 지정)인 동안은 표시만 비우고, 고르면 그대로 보인다. 등록 위저드·상세는 기존 동작.
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
  const [scheduleModeTouched, setScheduleModeTouched] = useState(false)
  const lockDateMode = shouldLockEducationScheduleDateMode({
    participantOrganization,
    educationStructure: programType,
    sessionRound,
  })
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
  // 사업 운영 기간 밖 + 오늘 이전 비활성
  const disableOutsideOperation = (date: Dayjs) =>
    isEducationScheduleSelectionDateDisabled(date, operationStart, operationEnd)
  const [groupTimesByDetail] = useProgramRegistrationOverlayKv<
    Record<number, Array<EducationScheduleGroupTimeSlot | null>>
  >(GENERAL_REGISTRATION_OVERLAY_GROUP_TIMES_KEY, EMPTY_GROUP_TIMES)

  const singleDate = singleDateIso ? dayjs(singleDateIso) : null
  const setSingleDate = (d: Dayjs | null) => setSingleDateIso(d ? d.toISOString() : null)

  const periodDate = periodDateIso ? dayjs(periodDateIso) : null
  const setPeriodDate = (d: Dayjs | null) => setPeriodDateIso(d ? d.toISOString() : null)

  const scheduleLinesKey = `${overlayKeyPrefix}.scheduleLines`

  const handleScheduleRangeApply = useCallback(
    (range: [Dayjs, Dayjs]) => {
      const slots = resolveEducationScheduleGroupTimeSlots({
        overlay: { [GENERAL_REGISTRATION_OVERLAY_GROUP_TIMES_KEY]: groupTimesByDetail },
      })
      const newLines = educationScheduleLinesFromSelectionRangeApply({
        range,
        autoFillFromScheduleGroupTimes,
        educationScheduleMode: scheduleMode,
        groupTimeSlots: slots,
        dateOnlyPeriodRange: disableSchedulePeriodTime,
      })
      updateProgramRegistrationOverlayKey<string[]>(scheduleLinesKey, prev =>
        mergeUniqueEducationScheduleLines(prev ?? [], newLines)
      )
      setSingleDate(null)
      setPeriodDate(null)
    },
    [
      autoFillFromScheduleGroupTimes,
      disableSchedulePeriodTime,
      groupTimesByDetail,
      scheduleLinesKey,
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
  const groupTimeSlotsKey = JSON.stringify(
    resolveEducationScheduleGroupTimeSlots({
      overlay: { [GENERAL_REGISTRATION_OVERLAY_GROUP_TIMES_KEY]: groupTimesByDetail },
    })
  )
  const previewScheduleLines = useMemo(
    () =>
      scheduleMode === 'period'
        ? scheduleLines.map(normalizeEducationSchedulePeriodLineDateOnly).filter(Boolean)
        : scheduleLines,
    [scheduleLines, scheduleMode]
  )

  useEffect(() => {
    if (scheduleMode !== 'period') return
    const next = scheduleLines.map(normalizeEducationSchedulePeriodLineDateOnly).filter(Boolean)
    if (educationScheduleLinesEqual(scheduleLines, next)) return
    updateProgramRegistrationOverlayKey<string[]>(scheduleLinesKey, prev =>
      educationScheduleLinesEqual(prev ?? [], next) ? prev ?? [] : next
    )
  }, [scheduleLines, scheduleLinesKey, scheduleMode])

  useEffect(() => {
    if (!autoFillDatePicker) return
    const slots = resolveEducationScheduleGroupTimeSlots({
      overlay: { [GENERAL_REGISTRATION_OVERLAY_GROUP_TIMES_KEY]: groupTimesByDetail },
    })
    if (slots.length === 0) return
    updateProgramRegistrationOverlayKey<string[]>(scheduleLinesKey, prev => {
      const current = prev ?? []
      if (current.length === 0) return current
      const next = rebuildEducationScheduleLinesFromGroupTimes(current, slots)
      return educationScheduleLinesEqual(current, next) ? current : next
    })
  }, [autoFillDatePicker, groupTimeSlotsKey, groupTimesByDetail, scheduleLinesKey])

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
                size="medium"
                value={
                  isTemplateManagementScreen && !scheduleModeTouched && scheduleMode === 'date'
                    ? ''
                    : lockDateMode
                      ? 'date'
                      : scheduleMode
                }
                onChange={e => {
                  setScheduleModeTouched(true)
                  const next = e.target.value as ProgramRegistrationEducationScheduleMode
                  if ((lockDateMode || disablePeriodMode) && next === 'period') return
                  applyEducationScheduleModeLineSwap({
                    overlayKeyPrefix,
                    currentMode: scheduleMode,
                    nextMode: next,
                  })
                  onEducationScheduleModeChange(next)
                }}
              >
                <CmsRadio size="medium" value="date">날짜 지정</CmsRadio>
                <CmsRadio size="medium" value="period" disabled={lockDateMode || disablePeriodMode}>
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
            <ParagraphDatePicker inputSize="small"
              mode="single"
              customizable={false}
              showPeriodToggle={false}
              showTimeToggle={false}
              {...scheduleSelectionPickerProps}
              suppressAutoTodayWhenEmpty
              placeholder={SCHEDULE_SELECTION_PLACEHOLDER[scheduleMode]}
              value={scheduleMode === 'date' ? singleDate : periodDate}
              onChange={scheduleMode === 'date' ? handleDateApply : setPeriodDate}
              onRangeChange={handleScheduleRangeApply}
              width={scheduleMode === 'date' || isTemplateManagementScreen ? 240 : 360}
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
              <EducationSchedulePreviewLines
                lines={previewScheduleLines}
                onRemove={removeLine}
                lockStartedLines={false}
                placeholder={
                  scheduleMode === 'period'
                    ? SCHEDULE_PREVIEW_PERIOD_PLACEHOLDER
                    : EDUCATION_SCHEDULE_PREVIEW_PLACEHOLDER
                }
              />
            </div>
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
