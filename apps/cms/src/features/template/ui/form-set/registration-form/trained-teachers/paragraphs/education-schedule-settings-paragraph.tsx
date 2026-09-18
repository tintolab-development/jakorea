import { useCallback, useEffect } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { ProgramRegistrationEducationScheduleMode } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import {
  formatEducationScheduleLineFromRange,
  parseEducationScheduleLineToRange,
} from '@/features/template/lib/format-education-schedule-line'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { EducationSchedulePreviewLines } from '@/features/template/ui/shared/education-schedule-preview-lines'
import { patchInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import {
  updateProgramRegistrationOverlayKey,
  useProgramRegistrationOverlayKv,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

const EMPTY_SCHEDULE_LINES: string[] = []

type TrainedTeachersRegistrationEducationScheduleSettingsParagraphProps = {
  educationScheduleMode: ProgramRegistrationEducationScheduleMode
  onEducationScheduleModeChange: (value: ProgramRegistrationEducationScheduleMode) => void
  /** Overlay key prefix (default: 'trainedTeachersRegistration.educationScheduleSettings') */
  overlayKeyPrefix?: string
}

function resolvePeriodRangeFromLines(
  lines: readonly string[]
): { start: string; end: string } | undefined {
  for (let i = lines.length - 1; i >= 0; i -= 1) {
    const range = parseEducationScheduleLineToRange(lines[i])
    if (!range) continue
    const [start, end] = range
    if (!start.isSame(end, 'day')) {
      return {
        start: start.startOf('day').toISOString(),
        end: end.endOf('day').toISOString(),
      }
    }
  }
  return undefined
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
    EMPTY_SCHEDULE_LINES
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

  const syncBridgeFromLines = useCallback(
    (lines: string[], mode: ProgramRegistrationEducationScheduleMode) => {
      const trimmedLines = lines.map(line => line.trim()).filter(Boolean)
      patchInstitutionApplicationProgramBridge({
        educationScheduleMode: mode,
        educationScheduleLines: trimmedLines,
        educationScheduleRange:
          mode === 'period' ? resolvePeriodRangeFromLines(trimmedLines) : undefined,
      })
    },
    []
  )

  const handleScheduleRangeApply = useCallback(
    (range: [Dayjs, Dayjs]) => {
      appendLineIfNew(formatEducationScheduleLineFromRange(range))
      setSingleDate(null)
      setPeriodDate(null)
      if (educationScheduleMode === 'period') {
        patchInstitutionApplicationProgramBridge({
          educationScheduleMode: 'period',
          educationScheduleRange: {
            start: range[0].startOf('day').toISOString(),
            end: range[1].endOf('day').toISOString(),
          },
        })
      }
    },
    [appendLineIfNew, educationScheduleMode]
  )

  const removeLine = useCallback(
    (index: number) => {
      updateProgramRegistrationOverlayKey<string[]>(scheduleLinesKey, prev => {
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
                showPeriodToggle={false}
                lockTimeToggleOn
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
                showTimeToggle={false}
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
