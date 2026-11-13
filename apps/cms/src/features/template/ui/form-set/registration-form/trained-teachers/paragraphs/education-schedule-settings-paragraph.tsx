import { useCallback, useEffect } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { ProgramRegistrationEducationScheduleMode } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { formatEducationScheduleLineFromRange } from '@/features/template/lib/format-education-schedule-line'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { EducationSchedulePreviewLines } from '@/features/template/ui/shared/education-schedule-preview-lines'
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
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

const EMPTY_SCHEDULE_LINES: string[] = []

type TrainedTeachersRegistrationEducationScheduleSettingsParagraphProps = {
  /** 신규 등록 위저드는 항상 `period` (편집기 상태에서 고정). 브리지 동기화에만 쓴다 */
  educationScheduleMode: ProgramRegistrationEducationScheduleMode
  /** 날짜/기간 선택 UI를 없앴으므로 호출하지 않는다(호출부 호환용) */
  onEducationScheduleModeChange?: (value: ProgramRegistrationEducationScheduleMode) => void
  /** Overlay key prefix (default: 'trainedTeachersRegistration.educationScheduleSettings') */
  overlayKeyPrefix?: string
}

export function TrainedTeachersRegistrationEducationScheduleSettingsParagraph({
  educationScheduleMode,
  overlayKeyPrefix = 'trainedTeachersRegistration.educationScheduleSettings',
}: TrainedTeachersRegistrationEducationScheduleSettingsParagraphProps) {
  // 템플릿 관리 시안(5767:196354) 캘린더 칸 ≈240 — 등록 위저드·상세는 기존 360 유지
  const pickerWidth = useIsTemplateManagementScreen() ? 240 : 360
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
      {/*
       * 신규 등록 — 기간 지정 한 줄만(시안 9899:221372, CMS-FUNC-0591·0277).
       * 날짜 지정으로 저장된 기존 프로그램은 상세 공통 정보 수정 화면(common-info-view)에서 기존 방식으로 수정한다.
       */}
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="교육 진행 일정 선택"
          fullRow
          validationKey={[
            'educationScheduleSettings.singleDateIso',
            'educationScheduleSettings.periodDateIso',
          ]}
          edit={
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
              width={pickerWidth}
              placeholder="진행 기간을 선택해 주세요"
              disabledDate={disableOutsideOperation}
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>
      {/* 선택한 기간 확인·삭제용 — 선택 전(시안 빈 상태)에는 행을 그리지 않는다 */}
      {scheduleLines.length > 0 ? (
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
      ) : null}
    </DetailInfoForm>
  )
}
