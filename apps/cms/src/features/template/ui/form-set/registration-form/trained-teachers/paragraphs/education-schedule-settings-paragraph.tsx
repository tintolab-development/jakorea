import { useCallback, useEffect } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { ProgramRegistrationEducationScheduleMode } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { formatEducationScheduleLineFromRange } from '@/features/template/lib/format-education-schedule-line'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { EducationSchedulePreviewLines } from '@/features/template/ui/shared/education-schedule-preview-lines'
import { applyEducationScheduleModeLineSwap } from '@/features/program/shared/lib/education-schedule-mode-lines'
import {
  educationOperationRangeSealKeyFromSchedulePrefix,
  isEducationScheduleSelectionDateDisabled,
  toEducationOperationDayjs,
  type EducationOperationRangeSeal,
} from '@/features/program/shared/lib/education-schedule-change'
import { getInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { syncInstitutionApplicationBridgeForRegistrationWizard } from '@/features/program/general/lib/registration-institution-bridge-sync'
import {
  updateTrainedTeachersRegistrationField,
  useTrainedTeachersRegistrationField,
} from '@/features/template/ui/form-set/registration-form/trained-teachers/trained-teachers-registration-form-rhf'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

const EMPTY_SCHEDULE_LINES: string[] = []

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
  const [singleDateIso, setSingleDateIso] = useTrainedTeachersRegistrationField<string | null>(
    `${overlayKeyPrefix}.singleDateIso`,
    null
  )
  const [periodDateIso, setPeriodDateIso] = useTrainedTeachersRegistrationField<string | null>(
    `${overlayKeyPrefix}.periodDateIso`,
    null
  )
  const [scheduleLines] = useTrainedTeachersRegistrationField<string[]>(
    `${overlayKeyPrefix}.scheduleLines`,
    EMPTY_SCHEDULE_LINES
  )
  const [operationRangeSeal] = useTrainedTeachersRegistrationField<EducationOperationRangeSeal>(
    educationOperationRangeSealKeyFromSchedulePrefix(overlayKeyPrefix),
    null
  )
  // 사업 운영 기간 밖 + 오늘 이전 비활성
  const disableOutsideOperation = (date: Dayjs) =>
    isEducationScheduleSelectionDateDisabled(
      date,
      toEducationOperationDayjs(operationRangeSeal?.start),
      toEducationOperationDayjs(operationRangeSeal?.end)
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
      updateTrainedTeachersRegistrationField<string[]>(scheduleLinesKey, prev => {
        const current = prev ?? []
        return current.includes(trimmed) ? current : [...current, trimmed]
      })
    },
    [scheduleLinesKey]
  )

  const syncBridgeFromLines = useCallback(
    (_lines: string[], mode: ProgramRegistrationEducationScheduleMode) => {
      const bridge = getInstitutionApplicationProgramBridge()
      syncInstitutionApplicationBridgeForRegistrationWizard({
        registrationFormVariant: 'trainedTeachers',
        programType: bridge.educationStructure ?? 'curriculum',
        sessionRound: bridge.sessionRound ?? 'single',
        educationScheduleMode: mode,
        recruitTemplateCode: 'recruitment-trained-teachers',
      })
    },
    []
  )

  const handleScheduleRangeApply = useCallback(
    (range: [Dayjs, Dayjs]) => {
      const line = formatEducationScheduleLineFromRange(range).trim()
      appendLineIfNew(line)
      setSingleDate(null)
      setPeriodDate(null)
      const nextLines =
        line && !scheduleLines.includes(line) ? [...scheduleLines, line] : scheduleLines
      syncBridgeFromLines(nextLines, educationScheduleMode)
    },
    [appendLineIfNew, educationScheduleMode, scheduleLines, syncBridgeFromLines]
  )

  const removeLine = useCallback(
    (index: number) => {
      updateTrainedTeachersRegistrationField<string[]>(scheduleLinesKey, prev => {
        const next = (prev ?? []).filter((_, i) => i !== index)
        syncBridgeFromLines(next, educationScheduleMode)
        return next
      })
    },
    [educationScheduleMode, scheduleLinesKey, syncBridgeFromLines]
  )

  useEffect(() => {
    if (educationScheduleMode !== 'date') return
    if (periodDateIso == null) return
    setPeriodDateIso(null)
  }, [educationScheduleMode, periodDateIso, setPeriodDateIso])

  useEffect(() => {
    if (educationScheduleMode !== 'period') return
    if (singleDateIso == null) return
    setSingleDateIso(null)
  }, [educationScheduleMode, singleDateIso, setSingleDateIso])

  useEffect(() => {
    syncBridgeFromLines(scheduleLines, educationScheduleMode)
  }, [educationScheduleMode, scheduleLines, syncBridgeFromLines])

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
              size="medium"
              value={educationScheduleMode}
              onChange={e => {
                const next = e.target.value as ProgramRegistrationEducationScheduleMode
                applyEducationScheduleModeLineSwap({
                  overlayKeyPrefix,
                  currentMode: educationScheduleMode,
                  nextMode: next,
                })
                onEducationScheduleModeChange(next)
              }}
            >
              <CmsRadio size="medium" value="date">
                날짜 지정
              </CmsRadio>
              <CmsRadio size="medium" value="period">
                기간 지정
              </CmsRadio>
            </CmsRadioGroup>
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
            educationScheduleMode === 'date' ? (
              <ParagraphDatePicker
                inputSize="small"
                mode="single"
                presetMode="schedule"
                customizable={false}
                showPeriodToggle={false}
                showTimeToggle={false}
                lockTimeToggleOn
                lockPeriodToggleOn
                suppressAutoTodayWhenEmpty
                value={singleDate}
                onChange={setSingleDate}
                onRangeChange={handleScheduleRangeApply}
                width={240}
                placeholder="날짜를 선택해 주세요"
                disabledDate={disableOutsideOperation}
              />
            ) : (
              <ParagraphDatePicker
                inputSize="small"
                mode="single"
                presetMode="period"
                customizable={false}
                showTimeToggle={false}
                suppressAutoTodayWhenEmpty
                value={periodDate}
                onChange={setPeriodDate}
                onRangeChange={handleScheduleRangeApply}
                width={360}
                placeholder="기간을 선택해 주세요"
                disabledDate={disableOutsideOperation}
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
              lines={scheduleLines}
              onRemove={removeLine}
              lockStartedLines={false}
            />
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
