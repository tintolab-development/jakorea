import { useEffect, useMemo, useRef, useState } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { VolunteerInterviewScheduleEditSeed } from '@/features/program/shared/lib/volunteer-interview-schedule-edit-seed'
import { createDefaultUnavailableDatesExclusionState } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'
import type { UnavailableDatesExclusionState } from '@/features/template/ui/form-set/shared/unavailable-dates-exclusion'
import { VolunteerInterviewApplicantScheduleParagraph } from '@/features/template/ui/form-set/application-form/volunteer/paragraphs/volunteer-interview-applicant-schedule-paragraph'
import { ParagraphChip } from '@/features/template/ui/shared/paragraph-chip'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { ParagraphTimePicker } from '@/features/template/ui/shared/paragraph-time-picker'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { UnavailableDatesBulkExclusionsRow } from '@/features/template/ui/form-set/shared/unavailable-dates-bulk-exclusions-row'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import {
  updateVolunteerInterviewOverlayKey,
  useVolunteerInterviewOverlayKv,
  type VolunteerInterviewOverlayStore,
} from '@/features/template/ui/form-set/application-form/volunteer/lib/interview-schedule-overlay-sync'
import './volunteer-interview-available-schedule-paragraph.css'

type InterviewTimeUnit = '15' | '30' | '60'

type InterviewTimeSlot = {
  key: string
  label: string
}

function buildInterviewTimeSlots(
  range: [Dayjs, Dayjs] | null,
  unit: InterviewTimeUnit
): InterviewTimeSlot[] {
  if (range == null) return []

  const [start, end] = range
  const minutes = Number(unit)
  const slots: InterviewTimeSlot[] = []
  let cursor = start

  while (slots.length < 96) {
    const next = cursor.add(minutes, 'minute')
    if (next.isAfter(end)) break

    slots.push({
      key: `${cursor.valueOf()}-${next.valueOf()}`,
      label: `${cursor.format('HH:mm')} ~ ${next.format('HH:mm')}`,
    })
    cursor = next
  }

  return slots
}

function buildDayjsTimeRange(
  range: VolunteerInterviewScheduleEditSeed['interviewTimeRange']
): [Dayjs, Dayjs] {
  const base = dayjs().startOf('day')
  const start = base.hour(range.startHour).minute(range.startMinute).second(0)
  const end = base.hour(range.endHour).minute(range.endMinute).second(0)
  return [start, end]
}

function VolunteerInterviewScheduleBlock({
  title,
  type,
  commonScheduleSeed,
  onCommonExclusionChange,
  overlayStore = 'application',
}: {
  /** 예외 일정이 있을 때만 공통 블록에 전달 */
  title?: string
  type: 'common' | 'exception'
  commonScheduleSeed?: VolunteerInterviewScheduleEditSeed
  onCommonExclusionChange?: (state: UnavailableDatesExclusionState) => void
  overlayStore?: VolunteerInterviewOverlayStore
}) {
  const seed = type === 'common' ? commonScheduleSeed : undefined
  const initialTimeRange = useMemo(
    () => (seed ? buildDayjsTimeRange(seed.interviewTimeRange) : null),
    [seed]
  )
  const [exceptionDate, setExceptionDate] = useVolunteerInterviewOverlayKv<Dayjs | null>(
    overlayStore,
    'exceptionDate',
    null
  )
  const [interviewTime, setInterviewTime] = useVolunteerInterviewOverlayKv<Dayjs | null>(
    overlayStore,
    'interviewTime',
    initialTimeRange?.[0] ?? null
  )
  const [interviewTimeRange, setInterviewTimeRange] = useVolunteerInterviewOverlayKv<[Dayjs, Dayjs] | null>(
    overlayStore,
    'interviewTimeRange',
    initialTimeRange
  )
  const [timeUnit, setTimeUnit] = useVolunteerInterviewOverlayKv<InterviewTimeUnit>(
    overlayStore,
    'timeUnit',
    seed?.timeUnit ?? '30'
  )
  const [selectedSlotKeys] = useVolunteerInterviewOverlayKv<string[]>(
    overlayStore,
    'selectedSlotKeys',
    []
  )
  const [appliedUnavailableDates, setAppliedUnavailableDates] = useVolunteerInterviewOverlayKv<string[]>(
    overlayStore,
    'appliedUnavailableDates',
    seed?.appliedUnavailableDates ?? []
  )
  const [exclusionState, setExclusionState] = useVolunteerInterviewOverlayKv<UnavailableDatesExclusionState>(
    overlayStore,
    'exclusionState',
    seed
      ? {
          excludeNone: seed.excludeNone,
          excludeSaturday: seed.excludeSaturday,
          excludeSunday: seed.excludeSunday,
          excludeHoliday: seed.excludeHoliday,
        }
      : createDefaultUnavailableDatesExclusionState()
  )
  const seedSlotsAppliedRef = useRef(false)
  const interviewTimeSlots = useMemo(
    () => buildInterviewTimeSlots(interviewTimeRange, timeUnit),
    [interviewTimeRange, timeUnit]
  )

  useEffect(() => {
    updateVolunteerInterviewOverlayKey<string[]>(overlayStore, 'selectedSlotKeys', prev => {
        const availableKeys = new Set(interviewTimeSlots.map(slot => slot.key))
        const currentSlots = prev ?? []
        const filtered = currentSlots.filter(key => availableKeys.has(key))

        let next: string[]
        if (filtered.length > 0 || interviewTimeSlots.length === 0) {
          next = filtered
        } else if (seed && !seedSlotsAppliedRef.current) {
          const labelSet = new Set(seed.selectedTimeSlotLabels)
          const keys = interviewTimeSlots
            .filter(slot => labelSet.has(slot.label))
            .map(slot => slot.key)
          if (keys.length > 0) {
            seedSlotsAppliedRef.current = true
            next = keys
          } else {
            next = []
          }
        } else if (!seed) {
          next = [interviewTimeSlots[0]?.key ?? '']
        } else {
          next = []
        }

        if (
          prev != null &&
          prev.length === next.length &&
          prev.every((key, index) => key === next[index])
        ) {
          return prev
        }
        return next
      })
  }, [interviewTimeSlots, overlayStore, seed])

  const handleExclusionChange = (state: UnavailableDatesExclusionState) => {
    setExclusionState(state)
    if (type === 'common') {
      onCommonExclusionChange?.(state)
    }
  }

  useEffect(() => {
    if (type !== 'common') return
    onCommonExclusionChange?.(exclusionState)
  }, [exclusionState, onCommonExclusionChange, type])

  const toggleTimeSlot = (slotKey: string) => {
    updateVolunteerInterviewOverlayKey<string[]>(overlayStore, 'selectedSlotKeys', prev =>
      (prev ?? []).includes(slotKey) ? (prev ?? []).filter(key => key !== slotKey) : [...(prev ?? []), slotKey]
    )
  }

  return (
    <div className="volunteer-interview-available-schedule__schedule-block">
      {title ? (
        <div className="detail-info-form--text-bold volunteer-interview-available-schedule__block-title">
          {title}
        </div>
      ) : null}

      <DetailInfoForm title="면접 진행 가능 일정" hideHeader mode="edit">
        {type === 'common' ? (
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="면접 진행 불가일"
              fullRow
              edit={
                <UnavailableDatesBulkExclusionsRow
                  modalUnavailableDescriptionLead="면접 진행 불가한 날짜를 모두 선택해 주세요."
                  modalUnavailableDescriptionSecond="선택된 날짜는 면접 일정으로 신청할 수 없습니다."
                  appliedDates={appliedUnavailableDates}
                  onApplyDatesChange={setAppliedUnavailableDates}
                  exclusionState={exclusionState}
                  onExclusionChange={handleExclusionChange}
                  defaultExcludeSaturday={seed?.excludeSaturday}
                  defaultExcludeSunday={seed?.excludeSunday}
                  defaultExcludeHoliday={seed?.excludeHoliday}
                  defaultExcludeNone={seed?.excludeNone}
                />
              }
              view="-"
            />
          </DetailInfoForm.Row>
        ) : (
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="예외 진행 일정"
              fullRow
              edit={
                <ParagraphDatePicker
                  mode="single"
                  presetMode="date"
                  value={exceptionDate}
                  onChange={setExceptionDate}
                  width={240}
                  placeholder="날짜를 선택하세요"
                  suppressAutoTodayWhenEmpty
                />
              }
              view="-"
            />
          </DetailInfoForm.Row>
        )}

        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="면접 진행 가능 시간"
            fullRow
            edit={
              <div className="detail-info-form-inputs-wrapper">
                <ParagraphTimePicker
                  value={interviewTime}
                  onChange={setInterviewTime}
                  onTimeRangeChange={setInterviewTimeRange}
                  initialTimeRange={initialTimeRange}
                  width={240}
                  placeholder="시간을 선택해 주세요"
                  endTimeAlwaysOn
                />
                <DetailInfoForm.InputsSeparator />
                <CmsRadioGroup
                  value={timeUnit}
                  onChange={event => setTimeUnit(String(event.target.value) as InterviewTimeUnit)}
                >
                  <CmsRadio value="15">15분 단위</CmsRadio>
                  <CmsRadio value="30">30분 단위</CmsRadio>
                  <CmsRadio value="60">1시간 단위</CmsRadio>
                </CmsRadioGroup>
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <div className="volunteer-interview-available-schedule__summary">
        <span className="volunteer-interview-available-schedule__summary-hint">
          진행 가능한 시간대를 선택해 주세요. 미선택 된 시간은 사용자가 신청 불가합니다.
        </span>
        {interviewTimeSlots.length > 0 ? (
          <div className="volunteer-interview-available-schedule__time-slots">
            {interviewTimeSlots.map(slot => (
              <ParagraphChip
                key={slot.key}
                className="volunteer-interview-available-schedule__time-slot"
                selected={selectedSlotKeys.includes(slot.key)}
                onClick={() => toggleTimeSlot(slot.key)}
              >
                {slot.label}
              </ParagraphChip>
            ))}
          </div>
        ) : (
          <div className="volunteer-interview-available-schedule__empty">
            설정된 면접 시간이 없습니다. 면접 시간을 설정해 주세요.
          </div>
        )}
      </div>
    </div>
  )
}

function VolunteerInterviewScheduleTemplateUi({
  exceptionScheduleCount = 0,
  exceptionBlockKeys,
  onRemoveExceptionBlock,
  commonScheduleSeed,
  onCommonExclusionChange,
  overlayStore = 'application',
}: {
  exceptionScheduleCount?: number
  exceptionBlockKeys?: number[]
  onRemoveExceptionBlock?: (key: number) => void
  commonScheduleSeed?: VolunteerInterviewScheduleEditSeed
  onCommonExclusionChange?: (state: UnavailableDatesExclusionState) => void
  overlayStore?: VolunteerInterviewOverlayStore
}) {
  const [internalBlockKeys, setInternalBlockKeys] = useState<number[]>([])

  useEffect(() => {
    if (exceptionBlockKeys != null) return
    setInternalBlockKeys(prev => {
      if (exceptionScheduleCount > prev.length) {
        const next = [...prev]
        for (let i = prev.length; i < exceptionScheduleCount; i += 1) {
          next.push(Date.now() + i)
        }
        return next
      }
      if (exceptionScheduleCount < prev.length) {
        return prev.slice(0, exceptionScheduleCount)
      }
      return prev
    })
  }, [exceptionScheduleCount, exceptionBlockKeys])

  const blockKeys = exceptionBlockKeys ?? internalBlockKeys
  const hasExceptionSchedules = blockKeys.length > 0

  const handleRemoveException = (key: number) => {
    if (onRemoveExceptionBlock) {
      onRemoveExceptionBlock(key)
      return
    }
    setInternalBlockKeys(prev => prev.filter(blockKey => blockKey !== key))
  }

  return (
    <div className="volunteer-interview-available-schedule">
      <VolunteerInterviewScheduleBlock
        title={hasExceptionSchedules ? '■ 공통 진행 일정' : undefined}
        type="common"
        commonScheduleSeed={commonScheduleSeed}
        onCommonExclusionChange={onCommonExclusionChange}
        overlayStore={overlayStore}
      />
      {blockKeys.map((key, index) => (
        <div key={key} className="volunteer-interview-available-schedule__exception-row">
          <VolunteerInterviewScheduleBlock
            title={`■ 예외 일정 ${String(index + 1).padStart(2, '0')}`}
            type="exception"
            overlayStore={overlayStore}
          />
          <div className="volunteer-interview-available-schedule__exception-delete-cell">
            <ItemDeleteButton
              className="item-delete-button"
              aria-label={`예외 일정 ${String(index + 1).padStart(2, '0')} 삭제`}
              onClick={event => {
                event.stopPropagation()
                handleRemoveException(key)
              }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

/** 봉사자 신청 폼 — 면접 진행 가능 일정 */
export function VolunteerInterviewAvailableScheduleParagraph({
  isTemplateAuthoringMode = false,
  readOnlyPreview = false,
  exceptionScheduleCount = 0,
  exceptionBlockKeys,
  onRemoveExceptionBlock,
  commonScheduleSeed,
  onCommonExclusionChange,
  overlayStore = 'application',
}: {
  isTemplateAuthoringMode?: boolean
  readOnlyPreview?: boolean
  exceptionScheduleCount?: number
  exceptionBlockKeys?: number[]
  onRemoveExceptionBlock?: (key: number) => void
  commonScheduleSeed?: VolunteerInterviewScheduleEditSeed
  onCommonExclusionChange?: (state: UnavailableDatesExclusionState) => void
  overlayStore?: VolunteerInterviewOverlayStore
}) {
  if (isTemplateAuthoringMode && !readOnlyPreview) {
    return (
      <VolunteerInterviewScheduleTemplateUi
        exceptionScheduleCount={exceptionScheduleCount}
        exceptionBlockKeys={exceptionBlockKeys}
        onRemoveExceptionBlock={onRemoveExceptionBlock}
        commonScheduleSeed={commonScheduleSeed}
        onCommonExclusionChange={onCommonExclusionChange}
        overlayStore={overlayStore}
      />
    )
  }

  return (
    <VolunteerInterviewApplicantScheduleParagraph
      commonScheduleSeed={commonScheduleSeed}
      readOnlyPreview={readOnlyPreview}
    />
  )
}
