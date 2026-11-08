import { useCallback } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { UseFormReturn } from 'react-hook-form'
import { useWatch } from 'react-hook-form'
import { formatShortYearMdWithKoreanWeekday } from '@/shared/lib/format-date-korean-weekday'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import {
  type UjatHalfSemesterKey,
} from '@/features/program/ujat/lib/ujat-half-education-schedule-types'
import type { UjatEducationScheduleSettingsSemesterDisplay } from '@/features/program/ujat/lib/ujat-education-schedule-settings-display'
import { formatUjatEventRangeLabel } from '@/features/program/ujat/lib/ujat-education-schedule-settings-display'
import {
  UJAT_EDUCATION_SCHEDULE_SETTINGS_SEMESTER_LABEL,
  type UjatEducationScheduleSettingsExclusionOverlay,
} from '@/features/program/ujat/lib/ujat-education-schedule-settings-types'
import { UjatInlineDividedSegments } from '@/features/program/ujat/ui/detail-modal/shared/ujat-inline-divided-segments'
import { UnavailableDatesBulkExclusionsRow } from '@/features/template/ui/form-set/shared/unavailable-dates-bulk-exclusions-row'
import { buildRecurringUnavailableLabel } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { useKoreanPublicHolidayDateKeys } from '@/features/program/ujat/api/korean-public-holidays'
import type {
  UjatTypedDetail,
  UjatTypedEducationStagePlan,
  UjatTypedScheduleRow,
} from '@/features/program/ujat/api/typed-detail-client'
import { holidayExcludedFromTyped } from '@/features/program/ujat/lib/ujat-typed-detail'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import '@/features/template/ui/form-set/registration-form/UJAT/paragraphs/ujat-education-schedule-settings-paragraph.css'

function formatIsoDateLabel(iso: string): string {
  const d = dayjs(iso)
  if (!d.isValid()) return ''
  return formatShortYearMdWithKoreanWeekday(d)
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

type TypedScheduleForm = UseFormReturn<UjatTypedDetail>

function typedSemester(half: UjatHalfSemesterKey): 'FIRST_HALF' | 'SECOND_HALF' {
  return half === 'h1' ? 'FIRST_HALF' : 'SECOND_HALF'
}

function typedEventRow(detail: UjatTypedDetail | undefined, half: UjatHalfSemesterKey) {
  return detail?.halfPlans
    ?.find(item => item.semesterType === typedSemester(half))
    ?.stages?.find(item => item.stage === 'MAIN_EDUCATION')?.rows?.[0]
}

export function updateUjatTypedEventRow(
  form: TypedScheduleForm,
  half: UjatHalfSemesterKey,
  update: (row: UjatTypedScheduleRow) => UjatTypedScheduleRow
) {
  const current = form.getValues()
  const semesterType = typedSemester(half)
  const halfPlans = [...(current.halfPlans ?? [])]
  const halfIndex = halfPlans.findIndex(item => item.semesterType === semesterType)
  const halfPlan = halfIndex >= 0 ? { ...(halfPlans[halfIndex] ?? {}) } : { semesterType, stages: [] }
  const stages = [...(halfPlan.stages ?? [])]
  const stageIndex = stages.findIndex(item => item.stage === 'MAIN_EDUCATION')
  const stage: UjatTypedEducationStagePlan = stageIndex >= 0
    ? { ...(stages[stageIndex] ?? {}), stage: 'MAIN_EDUCATION' }
    : { stage: 'MAIN_EDUCATION', rows: [] }
  const currentRow = stage.rows?.[0] ?? {
    rowId: `ujat-${half}-main-1`,
    displayOrder: 1,
    educationName: '교육 진행',
    educationMethod: 'offline',
    regionCode: null,
    startDate: null,
    endDate: null,
    dates: [],
    scheduleIds: [],
    excludedDates: [],
    exclusion: null,
  }
  stage.rows = [update(currentRow), ...(stage.rows ?? []).slice(1)]
  if (stageIndex >= 0) stages[stageIndex] = stage
  else stages.push(stage)
  halfPlan.stages = stages
  if (halfIndex >= 0) halfPlans[halfIndex] = halfPlan
  else halfPlans.push(halfPlan)
  form.setValue('halfPlans', halfPlans, { shouldDirty: true, shouldTouch: true })
}

function typedExclusionToUi(row: UjatTypedScheduleRow | undefined): UjatEducationScheduleSettingsExclusionOverlay {
  return {
    excludeNone: row?.exclusion?.excludeNone === true,
    excludeSaturday: row?.exclusion?.excludeSaturday === true,
    excludeSunday: row?.exclusion?.excludeSunday === true,
    excludeHoliday: holidayExcludedFromTyped(row?.exclusion),
  }
}

function uiExclusionToTyped(
  state: UjatEducationScheduleSettingsExclusionOverlay
): NonNullable<UjatTypedScheduleRow['exclusion']> {
  return {
    excludeNone: state.excludeNone,
    excludeSaturday: state.excludeSaturday,
    excludeSunday: state.excludeSunday,
    excludeHoliday: state.excludeHoliday,
  }
}

function TypedSemesterScheduleTableBlock({
  half,
  mode,
  form,
}: {
  half: UjatHalfSemesterKey
  mode: 'view' | 'edit'
  form: TypedScheduleForm
}) {
  const detail = useWatch({ control: form.control }) as UjatTypedDetail | undefined
  const row = typedEventRow(detail, half)
  const range: [Dayjs | null, Dayjs | null] = [
    row?.startDate ? dayjs(row.startDate) : null,
    row?.endDate ? dayjs(row.endDate) : null,
  ]
  const [rangeStart, rangeEnd] = range
  const educationScheduleRangeComplete = rangeStart != null && rangeEnd != null
  const unavailableDates = row?.excludedDates ?? []
  const exclusion = typedExclusionToUi(row)

  useKoreanPublicHolidayDateKeys({
    from: rangeStart?.toISOString() ?? null,
    to: rangeEnd?.toISOString() ?? null,
    enabled: mode === 'edit' && educationScheduleRangeComplete,
  })

  const isNonFriday = (date: Dayjs) => date.day() !== 5

  const disableEducationScheduleDate = (date: Dayjs) => isNonFriday(date)

  const disableUnavailableDate = (date: Dayjs) => {
    if (isNonFriday(date)) return true
    if (rangeStart == null || rangeEnd == null) return true
    const start = rangeStart.isBefore(rangeEnd, 'day') ? rangeStart : rangeEnd
    const end = rangeStart.isBefore(rangeEnd, 'day') ? rangeEnd : rangeStart
    return date.isBefore(start, 'day') || date.isAfter(end, 'day')
  }

  const handleDirectUnavailableModalBlocked = useCallback(() => {
    cmsAlertModal.show({
      title: '진행 불가일 추가 불가',
      content: '교육 진행 일정을 먼저 선택해주세요.',
    })
  }, [])

  const updateRange = (next: [Dayjs | null, Dayjs | null]) => {
    const startDate = next[0]?.format('YYYY-MM-DD') ?? null
    const endDate = next[1]?.format('YYYY-MM-DD') ?? null
    updateUjatTypedEventRow(form, half, current => ({
      ...current,
      startDate,
      endDate,
      dates: startDate ? [startDate] : [],
    }))
  }

  return (
    <div className="ujat-education-schedule-settings__block">
      <div className="ujat-education-schedule-settings__subheading">
        {UJAT_EDUCATION_SCHEDULE_SETTINGS_SEMESTER_LABEL[half]}
      </div>
      <DetailInfoForm
        title={UJAT_EDUCATION_SCHEDULE_SETTINGS_SEMESTER_LABEL[half]}
        hideHeader
        mode={mode}
        className="program-registration-paragraph"
      >
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육 진행 일정"
            validationKey={`${half}.event.range`}
            view={formatUjatEventRangeLabel({
              start: row?.startDate ?? null,
              end: row?.endDate ?? null,
            })}
            edit={
              mode === 'edit' ? (
                <ParagraphDatePicker
                  inputSize="small"
                  mode="range"
                  value={range}
                  onChange={updateRange}
                  disabledDate={disableEducationScheduleDate}
                  placeholder={['일정을 선택해 주세요', '일정을 선택해 주세요']}
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
            view={
              <UnavailableDatesView exclusion={exclusion} unavailableDates={unavailableDates} />
            }
            edit={
              mode === 'edit' ? (
                <UnavailableDatesBulkExclusionsRow
                  disabledDate={disableUnavailableDate}
                  initialCalendarDate={rangeStart ?? rangeEnd}
                  appliedDates={unavailableDates}
                  onApplyDatesChange={dates =>
                    updateUjatTypedEventRow(form, half, current => ({ ...current, excludedDates: dates }))
                  }
                  exclusionState={exclusion}
                  onExclusionChange={next =>
                    updateUjatTypedEventRow(form, half, current => ({
                      ...current,
                      exclusion: uiExclusionToTyped(next),
                    }))
                  }
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

function TypedSemesterScheduleReadonlyBlock({
  half,
  display,
}: {
  half: UjatHalfSemesterKey
  display: UjatEducationScheduleSettingsSemesterDisplay
}) {
  return (
    <div className="ujat-education-schedule-settings__block">
      <div className="ujat-education-schedule-settings__subheading">
        {UJAT_EDUCATION_SCHEDULE_SETTINGS_SEMESTER_LABEL[half]}
      </div>
      <DetailInfoForm title={display.semesterLabel} hideHeader mode="view" className="program-registration-paragraph">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육 진행 일정"
            validationKey={`${half}.event.range`}
            view={formatUjatEventRangeLabel(display.eventRange)}
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육 진행 불가일"
            fullRow
            view={<UnavailableDatesView exclusion={display.exclusion} unavailableDates={display.unavailableDates} />}
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
  scheduleForm,
}: {
  mode: 'view' | 'edit'
  h1Display: UjatEducationScheduleSettingsSemesterDisplay
  h2Display: UjatEducationScheduleSettingsSemesterDisplay
  scheduleForm?: TypedScheduleForm
}) {
  if (scheduleForm) {
    return (
      <div className="ujat-education-schedule-settings">
        <TypedSemesterScheduleTableBlock half="h1" mode={mode} form={scheduleForm} />
        <TypedSemesterScheduleTableBlock half="h2" mode={mode} form={scheduleForm} />
      </div>
    )
  }
  return (
    <div className="ujat-education-schedule-settings">
      <TypedSemesterScheduleReadonlyBlock half="h1" display={h1Display} />
      <TypedSemesterScheduleReadonlyBlock half="h2" display={h2Display} />
    </div>
  )
}
