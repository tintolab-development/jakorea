import '@/features/template/ui/form-set/application-form/instructor/program-application-form-instructor.css'
import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import type { InstructorAvailableScheduleSlot } from '@/features/program/general/lib/instructor-application-available-schedule'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CalendarMini } from '@/shared/components/calendar'
import '@/shared/components/calendar/styles/calendar.css'
import { ProgramApplicationScheduleTemplateHintParagraph } from '@/features/template/ui/form-set/application-form/shared/paragraphs/program-application-schedule-template-hint-paragraph'
import { useProgramRegistrationScheduleTopCalendarHeightSync } from '@/features/template/hooks/use-program-registration-schedule-top-calendar-height-sync'
import { extractClockTimeRangeForScheduleSummary } from '@/features/template/lib/extract-clock-time-range-for-schedule-summary'
import { ParagraphChip } from '@/features/template/ui/shared/paragraph-chip'

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

/** 스크린: `강서초등학교 : 26년 3월 9일 (9:20 ~ 12:00)` — 교시 없이 시각만 */
function slotDisplaySegment(slot: InstructorAvailableScheduleSlot): string {
  const d = dayjs(slot.dateKey)
  const yShort = d.year() % 100
  const datePart = `${yShort}년 ${d.month() + 1}월 ${d.date()}일`
  return `${slot.school} : ${datePart} (${extractClockTimeRangeForScheduleSummary(slot.timeRange)})`
}

/** 강의 진행 가능 일정 — 상단: 캘린더 + 세션 카드(복수 선택) / 하단: 선택 요약 */
export function InstructorAvailableScheduleParagraph({
  scheduleSlots: scheduleSlotsProp,
  isTemplateAuthoringMode = false,
  readOnlyPreview = false,
  summaryFieldLabel = '강의 진행 가능일',
}: {
  scheduleSlots?: readonly InstructorAvailableScheduleSlot[]
  isTemplateAuthoringMode?: boolean
  readOnlyPreview?: boolean
  summaryFieldLabel?: string
}) {
  const scheduleSlots = scheduleSlotsProp ?? EMPTY_SCHEDULE_SLOTS
  const scheduleSlotsSyncKey = getScheduleSlotsSyncKey(scheduleSlots)
  const [currentMonth, setCurrentMonth] = useState(() =>
    resolveScheduleAnchorDate(scheduleSlots).startOf('month')
  )
  const [selectedDate, setSelectedDate] = useState(() => resolveScheduleAnchorDate(scheduleSlots))
  const [selectedSlotIds, setSelectedSlotIds] = useState<Set<string>>(() => new Set())

  useEffect(() => {
    const anchor = resolveScheduleAnchorDate(scheduleSlots)
    setCurrentMonth(anchor.startOf('month'))
    setSelectedDate(anchor)
    setSelectedSlotIds(new Set())
  }, [scheduleSlotsSyncKey])

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
    () => scheduleSlots.filter(s => selectedSlotIds.has(s.id)),
    [scheduleSlots, selectedSlotIds]
  )

  const summaryPlaceholder = '일정을 선택해 주세요.'

  const scheduleSummaryBlock =
    selectedSlotsOrdered.length === 0 ? (
      <div className="program-application-form-instructor__field-summary-wrap">
        <span className="program-application-form-instructor__summary-text program-application-form-instructor__summary-text--placeholder">
          {summaryPlaceholder}
        </span>
      </div>
    ) : (
      <div className="program-application-form-instructor__field-summary-wrap">
        {selectedSlotsOrdered.map((s, i) => (
          <Fragment key={s.id}>
            {i > 0 ? <DetailInfoForm.TdDivider /> : null}
            <span className="program-application-form-instructor__summary-inline-text">
              {slotDisplaySegment(s)}
            </span>
          </Fragment>
        ))}
      </div>
    )

  const toggleSlot = (slotId: string, dateKey: string) => {
    if (readOnlyPreview) return
    setSelectedSlotIds(prev => {
      const next = new Set(prev)
      if (next.has(slotId)) next.delete(slotId)
      else next.add(slotId)
      return next
    })
    setSelectedDate(dayjs(dateKey))
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
        className="program-application-form-instructor__available-schedule-top"
      >
        <div ref={calendarWrapRef} className="program-application-form-instructor__calendar-wrap">
          <CalendarMini
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            onMonthChange={setCurrentMonth}
            onSelectDate={date => {
              setSelectedDate(date)
            }}
            programDates={programDates}
          />
        </div>
        <div className="program-application-form-instructor__schedule-side">
          {isTemplateAuthoringMode ? (
            <ProgramApplicationScheduleTemplateHintParagraph fillScheduleSide />
          ) : (
            <div className="program-application-form-instructor__session-grid" role="list">
              {slotsForSelectedCalendarDay.length === 0 ? (
                <div
                  className="program-application-form-instructor__session-grid-empty"
                  role="status"
                >
                  <span className="form-editor-template-field-hint-text">
                    이 날짜에 표시할 일정이 없습니다.
                  </span>
                </div>
              ) : (
                slotsForSelectedCalendarDay.map(slot => {
                  const active = selectedSlotIds.has(slot.id)
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
                        {`${slot.school} | ${slot.region}`}
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
