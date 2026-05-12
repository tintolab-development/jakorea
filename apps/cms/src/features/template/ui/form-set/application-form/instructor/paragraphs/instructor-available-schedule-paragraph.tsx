import { Fragment, useMemo, useState } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CalendarMini } from '@/shared/components/calendar'
import '@/shared/components/calendar/styles/calendar.css'
import { ProgramApplicationScheduleTemplateHintParagraph } from '@/features/template/ui/form-set/application-form/shared/paragraphs/program-application-schedule-template-hint-paragraph'

type ScheduleSlot = {
  id: string
  dateKey: string
  school: string
  region: string
  sessionLabel: string
  timeRange: string
}

const PROGRAM_SCHEDULE_SLOTS: ScheduleSlot[] = []

/** `9:20 - 10:00` → `9:20 ~ 10:00` (표시용) */
function formatTimeRangeForDisplay(timeRange: string): string {
  return timeRange.trim().replace(/\s*-\s*/, ' ~ ')
}

/** 스크린: `강서초등학교 : 26년 3월 9일 (9:20 ~ 12:00)` */
function slotDisplaySegment(slot: ScheduleSlot): string {
  const d = dayjs(slot.dateKey)
  const yShort = d.year() % 100
  const datePart = `${yShort}년 ${d.month() + 1}월 ${d.date()}일`
  return `${slot.school} : ${datePart} (${formatTimeRangeForDisplay(slot.timeRange)})`
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

  const programDates = useMemo(() => new Set(PROGRAM_SCHEDULE_SLOTS.map(s => s.dateKey)), [])

  const slotsForMonth = useMemo(
    () => PROGRAM_SCHEDULE_SLOTS.filter(s => dayjs(s.dateKey).isSame(currentMonth, 'month')),
    [currentMonth]
  )

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
      <div className="program-application-form-instructor__available-schedule-top">
        <div className="program-application-form-instructor__calendar-wrap">
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
        {isTemplateAuthoringMode ? (
          <ProgramApplicationScheduleTemplateHintParagraph />
        ) : (
          <div className="program-application-form-instructor__session-grid" role="list">
            {slotsForMonth.map(slot => {
              const active = selectedSlotIds.has(slot.id)
              return (
                <button
                  key={slot.id}
                  type="button"
                  role="listitem"
                  aria-pressed={active}
                  className={[
                    'program-application-form-instructor__session-card',
                    active ? 'program-application-form-instructor__session-card--selected' : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => toggleSlot(slot.id, slot.dateKey)}
                >
                  <span className="program-application-form-instructor__session-card-line program-application-form-instructor__session-card-line--primary">
                    {`${slot.school} | ${slot.region}`}
                  </span>
                  <span className="program-application-form-instructor__session-card-line program-application-form-instructor__session-card-line--secondary">
                    {`${slot.sessionLabel} | ${slot.timeRange}`}
                  </span>
                </button>
              )
            })}
          </div>
        )}
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
