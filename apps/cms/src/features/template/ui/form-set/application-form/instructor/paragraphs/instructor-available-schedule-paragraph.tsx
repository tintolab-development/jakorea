import { Fragment, useMemo, useRef, useState } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CalendarMini } from '@/shared/components/calendar'
import '@/shared/components/calendar/styles/calendar.css'
import { ProgramApplicationScheduleTemplateHintParagraph } from '@/features/template/ui/form-set/application-form/shared/paragraphs/program-application-schedule-template-hint-paragraph'
import { useProgramRegistrationScheduleTopCalendarHeightSync } from '@/features/template/hooks/use-program-registration-schedule-top-calendar-height-sync'
import { extractClockTimeRangeForScheduleSummary } from '@/features/template/lib/extract-clock-time-range-for-schedule-summary'
import { ParagraphChip } from '@/features/template/ui/shared/paragraph-chip'

type ScheduleSlot = {
  id: string
  dateKey: string
  school: string
  region: string
  sessionLabel: string
  timeRange: string
}

const PROGRAM_SCHEDULE_SLOTS: ScheduleSlot[] = []

/** 스크린: `강서초등학교 : 26년 3월 9일 (9:20 ~ 12:00)` — 교시 없이 시각만 */
function slotDisplaySegment(slot: ScheduleSlot): string {
  const d = dayjs(slot.dateKey)
  const yShort = d.year() % 100
  const datePart = `${yShort}년 ${d.month() + 1}월 ${d.date()}일`
  return `${slot.school} : ${datePart} (${extractClockTimeRangeForScheduleSummary(slot.timeRange)})`
}


/** 강의 진행 가능 일정 — 상단: 캘린더 + 세션 카드(복수 선택) / 하단: 선택 요약 */
export function InstructorAvailableScheduleParagraph({
  isTemplateAuthoringMode = false,
  summaryFieldLabel = '강의 진행 가능일',
}: {
  isTemplateAuthoringMode?: boolean
  summaryFieldLabel?: string
}) {
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(() => dayjs('2026-03-01'))
  /** 캘린더에서 강조할 날짜(포커스) — 복수 선택과 별개 */
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => dayjs('2026-03-18'))
  const [selectedSlotIds, setSelectedSlotIds] = useState<Set<string>>(() => new Set())

  const scheduleTopRef = useRef<HTMLDivElement>(null)
  const calendarWrapRef = useRef<HTMLDivElement>(null)
  useProgramRegistrationScheduleTopCalendarHeightSync(scheduleTopRef, calendarWrapRef)

  const programDates = useMemo(() => new Set(PROGRAM_SCHEDULE_SLOTS.map(s => s.dateKey)), [])

  const slotsForSelectedCalendarDay = useMemo(() => {
    const key = selectedDate.format('YYYY-MM-DD')
    return PROGRAM_SCHEDULE_SLOTS.filter(s => s.dateKey === key)
  }, [selectedDate])

  const selectedSlotsOrdered = useMemo(
    () => PROGRAM_SCHEDULE_SLOTS.filter(s => selectedSlotIds.has(s.id)),
    [selectedSlotIds]
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
    setSelectedSlotIds(prev => {
      const next = new Set(prev)
      if (next.has(slotId)) next.delete(slotId)
      else next.add(slotId)
      return next
    })
    setSelectedDate(dayjs(dateKey))
  }

  return (
    <div className="program-application-form-instructor__available-schedule">
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
