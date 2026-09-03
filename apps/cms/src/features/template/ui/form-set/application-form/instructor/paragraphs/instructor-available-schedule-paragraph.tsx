import '@/features/template/ui/form-set/application-form/instructor/program-application-form-instructor.css'
import { Fragment, useEffect, useMemo, useRef } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { InstructorAvailableScheduleSlot } from '@/features/program/general/lib/instructor-application-available-schedule'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import '@/shared/components/calendar/styles/calendar.css'
import {
  ProgramApplicationScheduleSummaryHintText,
  ProgramApplicationScheduleTemplateHintParagraph,
} from '@/features/template/ui/form-set/application-form/shared/paragraphs/program-application-schedule-template-hint-paragraph'
import { useProgramRegistrationScheduleTopCalendarHeightSync } from '@/features/template/hooks/use-program-registration-schedule-top-calendar-height-sync'
import { extractClockTimeRangeForScheduleSummary } from '@/features/template/lib/extract-clock-time-range-for-schedule-summary'
import { ParagraphCalendarMini } from '@/features/template/ui/shared/paragraph-calendar-mini'
import { ParagraphChip } from '@/features/template/ui/shared/paragraph-chip'
import {
  useGeneralApplicationOverlayKv,
  updateGeneralApplicationOverlayKey,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'

const EMPTY_SCHEDULE_SLOTS: readonly InstructorAvailableScheduleSlot[] = []

function getScheduleSlotsSyncKey(slots: readonly InstructorAvailableScheduleSlot[]): string {
  if (slots.length === 0) return ''
  return slots
    .map(
      slot =>
        `${slot.id}|${slot.dateKey}|${slot.school}|${slot.region}|${slot.sessionLabel}|${slot.timeRange}`
    )
    .sort()
    .join('\n')
}

function resolveScheduleAnchorDate(slots: readonly InstructorAvailableScheduleSlot[]): Dayjs {
  if (slots.length === 0) return dayjs()
  const sorted = [...slots].sort((a, b) => a.dateKey.localeCompare(b.dateKey))
  return dayjs(sorted[0]!.dateKey)
}

/** overlay는 JSON 왕복 시 Dayjs → ISO string이 되므로 저장도 ISO로 통일 */
function coerceOverlayDayjs(value: Dayjs | string | null | undefined, fallback: Dayjs): Dayjs {
  if (value == null) return fallback
  if (dayjs.isDayjs(value)) return value.isValid() ? value : fallback
  const parsed = dayjs(value)
  return parsed.isValid() ? parsed : fallback
}

const WEEKDAY_KO = ['일', '월', '화', '수', '목', '금', '토'] as const

function formatIndividualSlotDateLabel(dateKey: string): string {
  const d = dayjs(dateKey)
  const yShort = d.year() % 100
  const weekday = WEEKDAY_KO[d.day()] ?? ''
  return `${yShort}년 ${d.month() + 1}월 ${d.date()}일(${weekday})`
}

function formatIndividualSummarySegment(slot: InstructorAvailableScheduleSlot): string {
  const d = dayjs(slot.dateKey)
  const yShort = d.year() % 100
  const datePart = `${yShort}년 ${d.month() + 1}월 ${d.date()}일`
  return `${slot.sessionLabel} : ${datePart} (${extractClockTimeRangeForScheduleSummary(slot.timeRange)})`
}

/** 스크린: `강서초등학교 : 26년 3월 9일 (9:20 ~ 12:00)` — 교시 없이 시각만 */
function slotDisplaySegment(slot: InstructorAvailableScheduleSlot): string {
  const d = dayjs(slot.dateKey)
  const yShort = d.year() % 100
  const datePart = `${yShort}년 ${d.month() + 1}월 ${d.date()}일`
  return `${slot.school} : ${datePart} (${extractClockTimeRangeForScheduleSummary(slot.timeRange)})`
}

export type InstructorAvailableScheduleParagraphProps = {
  scheduleSlots?: readonly InstructorAvailableScheduleSlot[]
  isTemplateAuthoringMode?: boolean
  readOnlyPreview?: boolean
  summaryFieldLabel?: string
  /** overlay KV prefix — 기본 `application.instructor` */
  overlayKeyPrefix?: string
  /** true: 개인 프로그램 등 캘린더 미니뷰 없이 슬롯 카드만 노출 */
  hideCalendar?: boolean
  /** 선택 요약 한 줄 포맷 — 미지정 시 기관명 포함 기본 포맷 */
  formatSummarySegment?: (slot: InstructorAvailableScheduleSlot) => string
}

/** 강의 진행 가능 일정 — 상단: 캘린더 + 세션 카드(복수 선택) / 하단: 선택 요약 */
export function InstructorAvailableScheduleParagraph({
  scheduleSlots: scheduleSlotsProp,
  isTemplateAuthoringMode = false,
  readOnlyPreview = false,
  summaryFieldLabel = '강의 진행 가능일',
  overlayKeyPrefix = 'application.instructor',
  hideCalendar = false,
  formatSummarySegment,
}: InstructorAvailableScheduleParagraphProps) {
  const scheduleSlots = scheduleSlotsProp ?? EMPTY_SCHEDULE_SLOTS
  const isIndividualSlotMode =
    hideCalendar || scheduleSlots.some(slot => slot.isIndividualProgram === true)
  const resolveSummarySegment =
    formatSummarySegment ??
    (isIndividualSlotMode ? formatIndividualSummarySegment : slotDisplaySegment)
  const scheduleSlotsSyncKey = getScheduleSlotsSyncKey(scheduleSlots)
  const scheduleAnchor = resolveScheduleAnchorDate(scheduleSlots)
  const currentMonthKey = `${overlayKeyPrefix}.currentMonth`
  const selectedDateKey = `${overlayKeyPrefix}.selectedDate`
  const selectedSlotIdsKey = `${overlayKeyPrefix}.selectedSlotIds`

  const [currentMonthIso, setCurrentMonthIso] = useGeneralApplicationOverlayKv<string>(
    currentMonthKey,
    scheduleAnchor.startOf('month').toISOString()
  )
  const [selectedDateIso, setSelectedDateIso] = useGeneralApplicationOverlayKv<string>(
    selectedDateKey,
    scheduleAnchor.toISOString()
  )
  const currentMonth = coerceOverlayDayjs(currentMonthIso, scheduleAnchor.startOf('month'))
  const selectedDate = coerceOverlayDayjs(selectedDateIso, scheduleAnchor)
  const [selectedSlotIds] = useGeneralApplicationOverlayKv<string[]>(selectedSlotIdsKey, [])

  useEffect(() => {
    const anchor = resolveScheduleAnchorDate(scheduleSlots)
    setCurrentMonthIso(anchor.startOf('month').toISOString())
    setSelectedDateIso(anchor.toISOString())
    updateGeneralApplicationOverlayKey<string[]>(selectedSlotIdsKey, () => [])
  }, [scheduleSlotsSyncKey, setCurrentMonthIso, setSelectedDateIso, selectedSlotIdsKey])

  const scheduleTopRef = useRef<HTMLDivElement>(null)
  const calendarWrapRef = useRef<HTMLDivElement>(null)
  useProgramRegistrationScheduleTopCalendarHeightSync(scheduleTopRef, calendarWrapRef)

  const programDates = useMemo(
    () => new Set(scheduleSlots.map(s => s.dateKey)),
    [scheduleSlotsSyncKey]
  )

  const slotsForSelectedCalendarDay = useMemo(() => {
    const key = selectedDate.format('YYYY-MM-DD')
    return scheduleSlots.filter(s => s.dateKey === key)
  }, [scheduleSlots, selectedDate])

  const selectedSlotsOrdered = useMemo(
    () => scheduleSlots.filter(s => selectedSlotIds.includes(s.id)),
    [scheduleSlots, selectedSlotIds]
  )

  const scheduleSummaryBlock =
    selectedSlotsOrdered.length === 0 ? (
      <div className="program-application-form-instructor__field-summary-wrap">
        <ProgramApplicationScheduleSummaryHintText />
      </div>
    ) : (
      <div className="program-application-form-instructor__field-summary-wrap">
        {selectedSlotsOrdered.map((s, i) => (
          <Fragment key={s.id}>
            {i > 0 ? <DetailInfoForm.TdDivider /> : null}
            <span className="program-application-form-instructor__summary-inline-text">
              {resolveSummarySegment(s)}
            </span>
          </Fragment>
        ))}
      </div>
    )

  const toggleSlot = (slotId: string, dateKey: string) => {
    if (readOnlyPreview) return
    updateGeneralApplicationOverlayKey<string[]>(selectedSlotIdsKey, prev => {
      const next = [...(prev ?? [])]
      const idx = next.indexOf(slotId)
      if (idx >= 0) next.splice(idx, 1)
      else next.push(slotId)
      return next
    })
    setSelectedDateIso(dayjs(dateKey).toISOString())
  }

  return (
    <div
      className={[
        'program-application-form-instructor__available-schedule',
        readOnlyPreview && 'program-application-form-instructor__available-schedule--readonly-preview',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div
        ref={scheduleTopRef}
        className={[
          'program-application-form-instructor__available-schedule-top',
          hideCalendar && 'program-application-form-instructor__available-schedule-top--no-calendar',
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {hideCalendar ? null : (
          <div ref={calendarWrapRef} className="program-application-form-instructor__calendar-wrap">
            <ParagraphCalendarMini
              currentMonth={currentMonth}
              selectedDate={selectedDate}
              onMonthChange={date => setCurrentMonthIso(date.toISOString())}
              onSelectDate={date => setSelectedDateIso(date.toISOString())}
              programDates={programDates}
            />
          </div>
        )}
        <div className="program-application-form-instructor__schedule-side">
          {isTemplateAuthoringMode ? (
            <ProgramApplicationScheduleTemplateHintParagraph fillScheduleSide />
          ) : (
            <div className="program-application-form-instructor__session-grid" role="list">
              {(hideCalendar ? scheduleSlots : slotsForSelectedCalendarDay).length === 0 ? (
                <div
                  className="program-application-form-instructor__session-grid-empty"
                  role="status"
                >
                  <span className="form-editor-template-field-hint-text">
                    이 날짜에 표시할 일정이 없습니다.
                  </span>
                </div>
              ) : (
                (hideCalendar ? scheduleSlots : slotsForSelectedCalendarDay).map(slot => {
                  const active = selectedSlotIds.includes(slot.id)
                  return (
                    <ParagraphChip
                      key={slot.id}
                      role="listitem"
                      aria-pressed={active}
                      className="program-application-form-instructor__session-chip"
                      selected={active}
                      onClick={() => toggleSlot(slot.id, slot.dateKey)}
                    >
                      <span className="program-application-form-instructor__session-card-line program-application-form-instructor__session-card-line--primary">
                        {slot.isIndividualProgram
                          ? formatIndividualSlotDateLabel(slot.dateKey)
                          : `${slot.school} | ${slot.region}`}
                      </span>
                      <span className="program-application-form-instructor__session-card-line program-application-form-instructor__session-card-line--secondary">
                        {`${slot.sessionLabel} | ${slot.timeRange}`}
                      </span>
                    </ParagraphChip>
                  )
                })
              )}
            </div>
          )}
        </div>
      </div>

      <DetailInfoForm title="" hideHeader mode="edit">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label={summaryFieldLabel}
            edit={scheduleSummaryBlock}
            view={scheduleSummaryBlock}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}
