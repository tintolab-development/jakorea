import { useCallback, useMemo } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import {
  EMPTY_UJAT_HALF_EVENT_RANGE_SEAL,
  type UjatHalfEventRangeSeal,
  type UjatHalfSemesterKey,
  ujatHalfScheduleOverlayKeys,
} from '@/features/program/ujat/lib/ujat-half-education-schedule-types'
import type { UjatEducationScheduleSettingsSemesterDisplay } from '@/features/program/ujat/lib/ujat-education-schedule-settings-display'
import { formatUjatEventRangeLabel } from '@/features/program/ujat/lib/ujat-education-schedule-settings-display'
import {
  UJAT_EDUCATION_SCHEDULE_SETTINGS_SEMESTER_LABEL,
  ujatEducationScheduleSettingsOverlayKeys,
  type UjatEducationScheduleSettingsExclusionOverlay,
} from '@/features/program/ujat/lib/ujat-education-schedule-settings-types'
import { UjatInlineDividedSegments } from '@/features/program/ujat/ui/detail-modal/shared/ujat-inline-divided-segments'
import { UnavailableDatesBulkExclusionsRow } from '@/features/template/ui/form-set/shared/unavailable-dates-bulk-exclusions-row'
import { buildRecurringUnavailableLabel } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'
import { useUjatProgramRegistrationOverlayKv } from '@/features/template/ui/form-set/registration-form/UJAT/ujat-program-registration-overlay-sync'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import '@/features/template/ui/form-set/registration-form/UJAT/paragraphs/ujat-education-schedule-settings-paragraph.css'

const FRIDAY_DAY = 5
const disableNonFriday = (date: Dayjs) => date.day() !== FRIDAY_DAY

function formatIsoDateLabel(iso: string): string {
  const d = dayjs(iso)
  if (!d.isValid()) return ''
  const yy = String(d.year()).slice(-2)
  const weekdays = ['일', '월', '화', '수', '목', '금', '토']
  return `${yy}년 ${d.month() + 1}월 ${d.date()}일(${weekdays[d.day()]})`
}

function UnavailableDatesView({
  exclusion,
  unavailableDates,
}: {
  exclusion: UjatEducationScheduleSettingsExclusionOverlay
  unavailableDates: string[]
}) {
  if (exclusion.excludeNone) {
    return <span>진행 불가일 없음</span>
  }

  const dateText = unavailableDates.map(formatIsoDateLabel).filter(Boolean).join(', ')
  const recurring = buildRecurringUnavailableLabel(exclusion)
  const segments = [dateText, recurring].filter(Boolean)

  if (segments.length === 0) return <>-</>
  return <UjatInlineDividedSegments segments={segments} />
}

function SemesterScheduleTableBlock({
  half,
  mode,
  display,
}: {
  half: UjatHalfSemesterKey
  mode: 'view' | 'edit'
  display: UjatEducationScheduleSettingsSemesterDisplay
}) {
  const eventRangeKey = ujatHalfScheduleOverlayKeys(half).eventRange
  const settingsKeys = ujatEducationScheduleSettingsOverlayKeys(half)

  const [eventSeal] = useUjatProgramRegistrationOverlayKv<UjatHalfEventRangeSeal>(
    eventRangeKey,
    display.eventRange ?? EMPTY_UJAT_HALF_EVENT_RANGE_SEAL
  )
  const [unavailableDates, setUnavailableDates] = useUjatProgramRegistrationOverlayKv<string[]>(
    settingsKeys.unavailableDates,
    display.unavailableDates
  )
  const [exclusion, setExclusion] = useUjatProgramRegistrationOverlayKv<
    UjatEducationScheduleSettingsExclusionOverlay
  >(settingsKeys.exclusion, display.exclusion)

  const range: [Dayjs | null, Dayjs | null] = useMemo(
    () => [eventSeal.start ? dayjs(eventSeal.start) : null, eventSeal.end ? dayjs(eventSeal.end) : null],
    [eventSeal.end, eventSeal.start]
  )
  const [rangeStart, rangeEnd] = range
  const educationScheduleRangeComplete = rangeStart != null && rangeEnd != null

  const disableUnavailableDate = useCallback(
    (date: Dayjs) => {
      if (rangeStart == null || rangeEnd == null) return true
      const start = rangeStart.isBefore(rangeEnd, 'day') ? rangeStart : rangeEnd
      const end = rangeStart.isBefore(rangeEnd, 'day') ? rangeEnd : rangeStart
      return disableNonFriday(date) || date.isBefore(start, 'day') || date.isAfter(end, 'day')
    },
    [rangeStart, rangeEnd]
  )

  const handleDirectUnavailableModalBlocked = useCallback(() => {
    cmsAlertModal.show({
      title: '진행 불가일 추가 불가',
      content: '교육 진행 일정을 먼저 선택해주세요.',
    })
  }, [])

  return (
    <div className="ujat-education-schedule-settings__block">
      <div className="ujat-education-schedule-settings__subheading">
        {UJAT_EDUCATION_SCHEDULE_SETTINGS_SEMESTER_LABEL[half]}
      </div>
      <DetailInfoForm
        title={display.semesterLabel}
        hideHeader
        mode={mode}
        className="program-registration-paragraph"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육 진행 일정"
            view={formatUjatEventRangeLabel(eventSeal)}
            edit={
              mode === 'edit' ? (
                <ParagraphDatePicker
                  mode="range"
                  value={range}
                  onChange={() => undefined}
                  placeholder={['시작일', '종료일']}
                  disabled
                  disabledDate={disableNonFriday}
                  className="ujat-education-schedule-settings__range-picker"
                />
              ) : undefined
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육 진행 불가일"
            fullRow
            view={<UnavailableDatesView exclusion={exclusion} unavailableDates={unavailableDates} />}
            edit={
              mode === 'edit' ? (
                <UnavailableDatesBulkExclusionsRow
                  disabledDate={disableUnavailableDate}
                  initialCalendarDate={rangeStart ?? rangeEnd}
                  appliedDates={unavailableDates}
                  onApplyDatesChange={setUnavailableDates}
                  exclusionState={exclusion}
                  onExclusionChange={setExclusion}
                  modalUnavailableDescriptionLead="교육 진행 불가한 날짜를 모두 선택해 주세요."
                  modalUnavailableDescriptionSecond="선택된 날짜는 교육 진행 일정으로 신청할 수 없습니다."
                  canOpenDirectUnavailableModal={educationScheduleRangeComplete}
                  onDirectUnavailableModalBlocked={handleDirectUnavailableModalBlocked}
                />
              ) : undefined
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}

export function UjatEducationScheduleSettingsSection({
  mode,
  h1Display,
  h2Display,
}: {
  mode: 'view' | 'edit'
  h1Display: UjatEducationScheduleSettingsSemesterDisplay
  h2Display: UjatEducationScheduleSettingsSemesterDisplay
}) {
  return (
    <div className="ujat-education-schedule-settings">
      <SemesterScheduleTableBlock half="h1" mode={mode} display={h1Display} />
      <SemesterScheduleTableBlock half="h2" mode={mode} display={h2Display} />
    </div>
  )
}
