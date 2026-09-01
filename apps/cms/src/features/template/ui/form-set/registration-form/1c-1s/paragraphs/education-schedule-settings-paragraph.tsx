/**
 * 1사 1교 프로그램 등록 폼 — 교육 진행 일정 설정
 * 기간만 선택(기간/시간 토글 비노출) · 항목 1개 · 선택값은 캘린더 필드에 표시
 */
import { useMemo } from 'react'
import type { ProgramRegistrationEducationScheduleMode } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { patchInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { useProgramRegistrationOverlayKv } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

function isValidDayjs(d: Dayjs | null | undefined): d is Dayjs {
  return d != null && d.isValid()
}

type OneCOneSEducationScheduleSettingsProps = {
  educationScheduleMode: ProgramRegistrationEducationScheduleMode
  onEducationScheduleModeChange: (value: ProgramRegistrationEducationScheduleMode) => void
  /** Overlay key prefix (default: 'economyRegistration.educationScheduleSettings') */
  overlayKeyPrefix?: string
}

export function OneCOneSRegistrationEducationScheduleSettingsParagraph({
  educationScheduleMode: _educationScheduleMode,
  onEducationScheduleModeChange: _onEducationScheduleModeChange,
  overlayKeyPrefix = 'economyRegistration.educationScheduleSettings',
}: OneCOneSEducationScheduleSettingsProps) {
  const [dateRangeSeal, setDateRangeSeal] = useProgramRegistrationOverlayKv<
    { start: string; end: string } | null
  >(`${overlayKeyPrefix}.dateRangeSeal`, null)

  const appliedRange = useMemo((): [Dayjs, Dayjs] | null => {
    if (dateRangeSeal == null) return null
    const start = dayjs(dateRangeSeal.start)
    const end = dayjs(dateRangeSeal.end)
    if (!isValidDayjs(start) || !isValidDayjs(end)) return null
    return [start.startOf('day'), end.startOf('day')]
  }, [dateRangeSeal])

  const persistRange = (next: [Dayjs, Dayjs] | null) => {
    if (next == null) {
      setDateRangeSeal(null)
      patchInstitutionApplicationProgramBridge({
        educationScheduleRange: undefined,
      })
      return
    }
    const start = next[0].startOf('day')
    const end = next[1].startOf('day')
    setDateRangeSeal({ start: start.toISOString(), end: end.toISOString() })
    patchInstitutionApplicationProgramBridge({
      educationScheduleRange: { start: start.toISOString(), end: end.toISOString() },
    })
  }

  return (
    <DetailInfoForm
      title="교육 진행 일정 설정"
      hideHeader
      mode="edit"
      className="program-registration-paragraph"
    >
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="교육 진행 일정 선택"
          fullRow
          edit={
            <div className="detail-info-form-inputs-wrapper-no-gap">
              <ParagraphDatePicker
                mode="single"
                presetMode="period"
                customizable={false}
                showTimeToggle={false}
                suppressAutoTodayWhenEmpty
                value={appliedRange?.[0] ?? null}
                appliedSurfaceRange={appliedRange}
                appliedSurfaceWithTime={false}
                width="100%"
                placeholder="진행 기간을 선택하세요"
                onRangeChange={range => persistRange(range)}
                onChange={next => {
                  if (next == null) persistRange(null)
                }}
              />
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
