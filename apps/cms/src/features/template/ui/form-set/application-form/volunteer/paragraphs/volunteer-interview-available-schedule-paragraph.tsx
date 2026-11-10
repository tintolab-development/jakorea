import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
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
  listVolunteerInterviewExceptionBlockIds,
  persistMissingVolunteerInterviewOverlayDefaults,
  reconcileVolunteerInterviewExceptionBlockKeys,
  removeVolunteerInterviewExceptionBlock,
  updateVolunteerInterviewOverlayKey,
  readVolunteerInterviewLiveRecord,
  useVolunteerInterviewOverlayKv,
  type VolunteerInterviewOverlayStore,
} from '@/features/template/ui/form-set/application-form/volunteer/lib/interview-schedule-overlay-sync'
import { useGeneralRecruitOverlayKv } from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { useCmsAlert } from '@/shared/ui'
import { useIsGeneralRegistrationWizard } from '@/features/template/context/general-registration-wizard-context'
import {
  isOutsideInclusiveLocalDayRange,
  normalizeRangeSealToLocalDayBounds,
} from '@/features/template/ui/form-set/shared/unavailable-dates-calendar-range'
import './volunteer-interview-available-schedule-paragraph.css'

type InterviewTimeUnit = '15' | '30' | '60'

type InterviewTimeSlot = {
  key: string
  label: string
}

type RecruitInterviewRangeSeal = { start: string; end: string } | null

function slotLabelFromKey(key: string): string | null {
  const match = /^(\d+)-(\d+)$/.exec(key.trim())
  if (!match) return null
  const start = dayjs(Number(match[1]))
  const end = dayjs(Number(match[2]))
  if (!start.isValid() || !end.isValid()) return null
  return `${start.format('HH:mm')} ~ ${end.format('HH:mm')}`
}

function remapSelectedSlotKeys(prev: string[], slots: InterviewTimeSlot[]): string[] {
  if (slots.length === 0) return prev
  const byKey = new Set(slots.map(slot => slot.key))
  const byLabel = new Map(slots.map(slot => [slot.label, slot.key]))
  const next: string[] = []
  const seen = new Set<string>()
  for (const key of prev) {
    const remapped = byKey.has(key) ? key : byLabel.get(slotLabelFromKey(key) ?? '')
    if (!remapped || seen.has(remapped)) continue
    seen.add(remapped)
    next.push(remapped)
  }
  return next
}

function buildInterviewTimeSlots(
  range: [Dayjs, Dayjs] | null,
  unit: InterviewTimeUnit
): InterviewTimeSlot[] {
  if (range == null) return []

  const start = dayjs(range[0])
  const end = dayjs(range[1])
  if (!start.isValid() || !end.isValid()) return []

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

function coerceDayjs(value: unknown): Dayjs | null {
  if (value == null) return null
  if (dayjs.isDayjs(value)) return value.isValid() ? value : null
  const parsed = dayjs(value as string | number | Date)
  return parsed.isValid() ? parsed : null
}

function coerceDayjsRange(value: unknown): [Dayjs, Dayjs] | null {
  if (!Array.isArray(value) || value.length < 2) return null
  const start = coerceDayjs(value[0])
  const end = coerceDayjs(value[1])
  if (start == null || end == null) return null
  return [start, end]
}

function exceptionInterviewOverlayNamespace(
  overlayStore: VolunteerInterviewOverlayStore,
  overlayNamespace: string | undefined,
  blockKey: number
): string {
  const base =
    overlayNamespace?.trim() ||
    (overlayStore === 'recruit' ? 'recruit.volunteer.interview' : 'application.volunteer.interview')
  return `${base}.exception.${blockKey}`
}

function VolunteerInterviewScheduleBlock({
  title,
  type,
  commonScheduleSeed,
  onCommonExclusionChange,
  overlayStore = 'application',
  overlayNamespace,
  interviewRangeSealKey = 'recruit.volunteer.interviewRangeSeal',
  freezeUnavailableCalendar = false,
  typedTemplateAuthoring = false,
  interviewPeriodRange: interviewPeriodFromParent,
}: {
  /** 예외 일정이 있을 때만 공통 블록에 전달 */
  title?: string
  type: 'common' | 'exception'
  commonScheduleSeed?: VolunteerInterviewScheduleEditSeed
  onCommonExclusionChange?: (state: UnavailableDatesExclusionState) => void
  overlayStore?: VolunteerInterviewOverlayStore
  overlayNamespace?: string
  interviewRangeSealKey?: string
  /** 템플릿 편집 — 진행 불가일 모달 달력 월 이동·선택 고정 */
  freezeUnavailableCalendar?: boolean
  typedTemplateAuthoring?: boolean
  interviewPeriodRange?: [Dayjs, Dayjs] | null
}) {
  const { showAlert } = useCmsAlert()
  const seed = type === 'common' ? commonScheduleSeed : undefined
  const initialTimeRange = useMemo(
    () => (seed ? buildDayjsTimeRange(seed.interviewTimeRange) : null),
    [seed]
  )

  /** 봉사자 모집 정보「2차 면접 기간」— 진행 불가일·예외 일정 선택 가능 범위 */
  const [interviewRangeSeal] = useGeneralRecruitOverlayKv<RecruitInterviewRangeSeal>(
    interviewRangeSealKey,
    null,
    { typedTemplateAuthoring }
  )
  const applyInterviewPeriodConstraint = overlayStore === 'recruit' && !freezeUnavailableCalendar
  const interviewPeriodRange = useMemo((): [Dayjs, Dayjs] | null => {
    if (!applyInterviewPeriodConstraint) return null
    if (interviewPeriodFromParent != null) {
      const [a, b] = interviewPeriodFromParent
      const start = a.startOf('day')
      const end = b.startOf('day')
      return start.isAfter(end, 'day') ? [end, start] : [start, end]
    }
    return normalizeRangeSealToLocalDayBounds(interviewRangeSeal)
  }, [applyInterviewPeriodConstraint, interviewPeriodFromParent, interviewRangeSeal])
  const interviewPeriodComplete = interviewPeriodRange != null
  const disableOutsideInterviewPeriod = useCallback(
    (date: Dayjs) => {
      if (!applyInterviewPeriodConstraint) return false
      // 기간 미정일 때 isOutsideInclusiveLocalDayRange(null)은 전일 차단 — 모달 오픈은 canOpen으로 막고 달력은 막지 않음
      if (interviewPeriodRange == null) return false
      return isOutsideInclusiveLocalDayRange(date, interviewPeriodRange)
    },
    [applyInterviewPeriodConstraint, interviewPeriodRange]
  )
  const handleDirectUnavailableModalBlocked = useCallback(() => {
    showAlert({
      title: '진행 불가일 추가 불가',
      content: '봉사자 모집 정보의 2차 면접 기간을 먼저 선택해 주세요.',
    })
  }, [showAlert])

  const ujatInterviewHalf = overlayNamespace?.includes('.h1.')
    ? 'h1'
    : overlayNamespace?.includes('.h2.')
      ? 'h2'
      : null
  const interviewTimeValidationKey = ujatInterviewHalf
    ? `recruit.volunteer.${ujatInterviewHalf}.interviewSchedule`
    : overlayStore === 'recruit'
      ? [
          'recruit.volunteer.interview.interviewTimeRange',
          'recruit.volunteer.interview.timeUnit',
          'recruit.volunteer.interview.selectedSlotKeys',
        ]
      : undefined
  const exceptionDateValidationKey = ujatInterviewHalf
    ? `recruit.volunteer.${ujatInterviewHalf}.interviewSchedule`
    : overlayStore === 'recruit'
      ? 'recruit.volunteer.interview.exceptionDate'
      : undefined

  const [exceptionDate, setExceptionDate] = useVolunteerInterviewOverlayKv<Dayjs | null>(
    overlayStore,
    'exceptionDate',
    null,
    overlayNamespace
  )
  const [interviewTime, setInterviewTime] = useVolunteerInterviewOverlayKv<Dayjs | null>(
    overlayStore,
    'interviewTime',
    initialTimeRange?.[0] ?? null,
    overlayNamespace
  )
  const [interviewTimeRange, setInterviewTimeRange] = useVolunteerInterviewOverlayKv<
    [Dayjs, Dayjs] | null
  >(overlayStore, 'interviewTimeRange', initialTimeRange, overlayNamespace)
  const [timeUnit, setTimeUnit] = useVolunteerInterviewOverlayKv<InterviewTimeUnit>(
    overlayStore,
    'timeUnit',
    seed?.timeUnit ?? '30',
    overlayNamespace
  )
  const [selectedSlotKeys] = useVolunteerInterviewOverlayKv<string[]>(
    overlayStore,
    'selectedSlotKeys',
    [],
    overlayNamespace
  )
  const [appliedUnavailableDates, setAppliedUnavailableDates] = useVolunteerInterviewOverlayKv<
    string[]
  >(overlayStore, 'appliedUnavailableDates', seed?.appliedUnavailableDates ?? [], overlayNamespace)
  const [exclusionState, setExclusionState] =
    useVolunteerInterviewOverlayKv<UnavailableDatesExclusionState>(
      overlayStore,
      'exclusionState',
      seed
        ? {
            excludeNone: seed.excludeNone,
            excludeSaturday: seed.excludeSaturday,
            excludeSunday: seed.excludeSunday,
            excludeHoliday: seed.excludeHoliday,
          }
        : createDefaultUnavailableDatesExclusionState(),
      overlayNamespace
    )
  const seedSlotsAppliedRef = useRef(false)
  const normalizedInterviewTime = useMemo(() => coerceDayjs(interviewTime), [interviewTime])
  const normalizedExceptionDate = useMemo(() => coerceDayjs(exceptionDate), [exceptionDate])
  const normalizedInterviewTimeRange = useMemo(
    () => coerceDayjsRange(interviewTimeRange) ?? initialTimeRange,
    [interviewTimeRange, initialTimeRange]
  )

  useEffect(() => {
    persistMissingVolunteerInterviewOverlayDefaults({
      store: overlayStore,
      namespace: overlayNamespace,
      typedTemplateAuthoring,
      values: {
        timeUnit,
        exclusionState,
        interviewTime: normalizedInterviewTime,
        interviewTimeRange: normalizedInterviewTimeRange,
        appliedUnavailableDates,
      },
    })
  }, [
    appliedUnavailableDates,
    exclusionState,
    normalizedInterviewTime,
    normalizedInterviewTimeRange,
    overlayNamespace,
    overlayStore,
    timeUnit,
    typedTemplateAuthoring,
  ])
  // 일반 프로그램 등록 위저드만 시안 문구(진행 불가일 선택 팝업) — UJAT·신청 폼·템플릿 관리는 기존 유지
  const isGeneralWizard = useIsGeneralRegistrationWizard()
  const interviewTimeSlots = useMemo(
    () => buildInterviewTimeSlots(normalizedInterviewTimeRange, timeUnit),
    [normalizedInterviewTimeRange, timeUnit]
  )

  useEffect(() => {
    updateVolunteerInterviewOverlayKey<string[]>(
      overlayStore,
      'selectedSlotKeys',
      prev => {
        const currentSlots = prev ?? []
        const filtered = remapSelectedSlotKeys(currentSlots, interviewTimeSlots)

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
        } else {
          next = filtered
        }

        if (
          prev != null &&
          prev.length === next.length &&
          prev.every((key, index) => key === next[index])
        ) {
          return prev
        }
        return next
      },
      overlayNamespace
    )
  }, [interviewTimeSlots, overlayNamespace, overlayStore, seed])

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
    updateVolunteerInterviewOverlayKey<string[]>(
      overlayStore,
      'selectedSlotKeys',
      prev =>
        (prev ?? []).includes(slotKey)
          ? (prev ?? []).filter(key => key !== slotKey)
          : [...(prev ?? []), slotKey],
      overlayNamespace
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
                  modalUnavailableDescriptionLead={
                    isGeneralWizard
                      ? '면접 진행이 불가한 날짜를 모두 선택해 주세요'
                      : '면접 진행 불가한 날짜를 모두 선택해 주세요.'
                  }
                  modalUnavailableDescriptionSecond={
                    isGeneralWizard
                      ? '선택된 날짜는 사용자가 신청 불가합니다.'
                      : applyInterviewPeriodConstraint
                        ? '2차 면접 기간(봉사자 모집 정보) 안의 날짜만 선택할 수 있습니다. 선택된 날짜는 면접 일정으로 신청할 수 없습니다. 오른쪽 칩(토·일·공휴일 제외)은 요일·공휴일 전체 제외이며, 달력에서 해당 날짜는 클릭할 수 없습니다.'
                        : '선택된 날짜는 면접 일정으로 신청할 수 없습니다.'
                  }
                  appliedDates={appliedUnavailableDates}
                  onApplyDatesChange={setAppliedUnavailableDates}
                  exclusionState={exclusionState}
                  onExclusionChange={handleExclusionChange}
                  defaultExcludeSaturday={seed?.excludeSaturday}
                  defaultExcludeSunday={seed?.excludeSunday}
                  defaultExcludeHoliday={seed?.excludeHoliday}
                  defaultExcludeNone={seed?.excludeNone}
                  freezeCalendarInteraction={freezeUnavailableCalendar}
                  disabledDate={
                    applyInterviewPeriodConstraint ? disableOutsideInterviewPeriod : undefined
                  }
                  initialCalendarDate={
                    applyInterviewPeriodConstraint ? (interviewPeriodRange?.[0] ?? null) : undefined
                  }
                  canOpenDirectUnavailableModal={
                    applyInterviewPeriodConstraint ? interviewPeriodComplete : undefined
                  }
                  onDirectUnavailableModalBlocked={
                    applyInterviewPeriodConstraint ? handleDirectUnavailableModalBlocked : undefined
                  }
                />
              }
              view="-"
            />
          </DetailInfoForm.Row>
        ) : (
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="예외 진행 일정"
              validationKey={exceptionDateValidationKey}
              fullRow
              edit={
                <ParagraphDatePicker
                  inputSize="small"
                  mode="single"
                  presetMode="date"
                  value={normalizedExceptionDate}
                  onChange={setExceptionDate}
                  width={240}
                  placeholder="날짜를 선택해 주세요"
                  suppressAutoTodayWhenEmpty
                  disabledDate={
                    applyInterviewPeriodConstraint ? disableOutsideInterviewPeriod : undefined
                  }
                />
              }
              view="-"
            />
          </DetailInfoForm.Row>
        )}

        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="면접 진행 가능 시간"
            validationKey={
              type === 'exception' && overlayStore === 'recruit' && ujatInterviewHalf == null
                ? [
                    'recruit.volunteer.interview.interviewTime',
                    'recruit.volunteer.interview.interviewTimeRange',
                    'recruit.volunteer.interview.selectedSlotKeys',
                  ]
                : interviewTimeValidationKey
            }
            fullRow
            edit={
              <div className="detail-info-form-inputs-wrapper">
                <ParagraphTimePicker
                  inputSize="small"
                  value={normalizedInterviewTime}
                  onChange={setInterviewTime}
                  onTimeRangeChange={setInterviewTimeRange}
                  initialTimeRange={normalizedInterviewTimeRange ?? initialTimeRange}
                  width={240}
                  placeholder="시간을 선택해 주세요"
                  endTimeAlwaysOn
                />
                <DetailInfoForm.InputsSeparator />
                <CmsRadioGroup
                  size="medium"
                  value={timeUnit}
                  onChange={event => setTimeUnit(String(event.target.value) as InterviewTimeUnit)}
                >
                  <CmsRadio size="medium" value="15">
                    15분 단위
                  </CmsRadio>
                  <CmsRadio size="medium" value="30">
                    30분 단위
                  </CmsRadio>
                  <CmsRadio size="medium" value="60">
                    1시간 단위
                  </CmsRadio>
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
  overlayNamespace,
  interviewRangeSealKey,
  freezeUnavailableCalendar = false,
  typedTemplateAuthoring = false,
  interviewPeriodRange,
}: {
  exceptionScheduleCount?: number
  exceptionBlockKeys?: number[]
  onRemoveExceptionBlock?: (key: number) => void
  commonScheduleSeed?: VolunteerInterviewScheduleEditSeed
  onCommonExclusionChange?: (state: UnavailableDatesExclusionState) => void
  overlayStore?: VolunteerInterviewOverlayStore
  overlayNamespace?: string
  interviewRangeSealKey?: string
  freezeUnavailableCalendar?: boolean
  typedTemplateAuthoring?: boolean
  interviewPeriodRange?: [Dayjs, Dayjs] | null
}) {
  const [internalBlockKeys, setInternalBlockKeys] = useState<number[]>(() => {
    if (exceptionBlockKeys != null) return []
    const record = readVolunteerInterviewLiveRecord(overlayStore)
    return listVolunteerInterviewExceptionBlockIds(record, overlayStore, overlayNamespace)
  })

  useEffect(() => {
    if (exceptionBlockKeys != null) return
    const record = readVolunteerInterviewLiveRecord(overlayStore)
    const saved = listVolunteerInterviewExceptionBlockIds(record, overlayStore, overlayNamespace)
    setInternalBlockKeys(prev => {
      const next = reconcileVolunteerInterviewExceptionBlockKeys({
        previous: prev,
        saved,
        count: exceptionScheduleCount,
      })
      if (next.length === prev.length && next.every((id, index) => id === prev[index])) return prev
      return next
    })
  }, [exceptionScheduleCount, exceptionBlockKeys, overlayNamespace, overlayStore])

  const blockKeys = exceptionBlockKeys ?? internalBlockKeys
  const hasExceptionSchedules = blockKeys.length > 0

  const handleRemoveException = (key: number) => {
    removeVolunteerInterviewExceptionBlock({
      store: overlayStore,
      namespace: overlayNamespace,
      blockKey: key,
    })
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
        overlayNamespace={overlayNamespace}
        interviewRangeSealKey={interviewRangeSealKey}
        freezeUnavailableCalendar={freezeUnavailableCalendar}
        typedTemplateAuthoring={typedTemplateAuthoring}
        interviewPeriodRange={interviewPeriodRange}
      />
      {blockKeys.map((key, index) => (
        <div key={key} className="volunteer-interview-available-schedule__exception-row">
          <VolunteerInterviewScheduleBlock
            title={`■ 예외 일정 ${String(index + 1).padStart(2, '0')}`}
            type="exception"
            overlayStore={overlayStore}
            overlayNamespace={exceptionInterviewOverlayNamespace(
              overlayStore,
              overlayNamespace,
              key
            )}
            interviewRangeSealKey={interviewRangeSealKey}
            typedTemplateAuthoring={typedTemplateAuthoring}
            interviewPeriodRange={interviewPeriodRange}
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
  overlayNamespace,
  interviewRangeSealKey,
  freezeUnavailableCalendar = false,
  typedTemplateAuthoring = false,
  interviewPeriodRange,
}: {
  isTemplateAuthoringMode?: boolean
  readOnlyPreview?: boolean
  exceptionScheduleCount?: number
  exceptionBlockKeys?: number[]
  onRemoveExceptionBlock?: (key: number) => void
  commonScheduleSeed?: VolunteerInterviewScheduleEditSeed
  onCommonExclusionChange?: (state: UnavailableDatesExclusionState) => void
  overlayStore?: VolunteerInterviewOverlayStore
  overlayNamespace?: string
  interviewRangeSealKey?: string
  /** 템플릿 관리 화면 — 진행 불가일 모달 달력 샘플 고정 */
  freezeUnavailableCalendar?: boolean
  typedTemplateAuthoring?: boolean
  interviewPeriodRange?: [Dayjs, Dayjs] | null
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
        overlayNamespace={overlayNamespace}
        interviewRangeSealKey={interviewRangeSealKey}
        freezeUnavailableCalendar={freezeUnavailableCalendar}
        typedTemplateAuthoring={typedTemplateAuthoring}
        interviewPeriodRange={interviewPeriodRange}
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
