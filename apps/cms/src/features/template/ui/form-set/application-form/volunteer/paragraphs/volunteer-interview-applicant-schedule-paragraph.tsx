import { Fragment, useEffect, useMemo, useRef } from 'react'
import dayjs from 'dayjs'
import type { VolunteerInterviewScheduleEditSeed } from '@/features/program/shared/lib/volunteer-interview-schedule-edit-seed'
import {
  parseVolunteerInterviewApplicantScheduleFromSeed,
  resolveVolunteerInterviewApplicantScheduleSeed,
} from '@/features/program/shared/lib/volunteer-interview-applicant-schedule'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import '@/shared/components/calendar/styles/calendar.css'
import '@/features/template/ui/form-set/application-form/instructor/program-application-form-instructor.css'
import { ProgramApplicationScheduleSummaryHintText } from '@/features/template/ui/form-set/application-form/shared/paragraphs/program-application-schedule-template-hint-paragraph'
import { useProgramRegistrationScheduleTopCalendarHeightSync } from '@/features/template/hooks/use-program-registration-schedule-top-calendar-height-sync'
import { ParagraphCalendarMini } from '@/features/template/ui/shared/paragraph-calendar-mini'
import { ParagraphChip } from '@/features/template/ui/shared/paragraph-chip'
import {
  useGeneralApplicationOverlayKv,
  updateGeneralApplicationOverlayKey,
} from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import './volunteer-interview-applicant-schedule-paragraph.css'

type SelectedSlot = {
  dateKey: string
  slotKey: string
  label: string
}

function formatTimeSlotChipLabel(label: string): string {
  return label.replace(/\s*~\s*/g, ' - ')
}

function extractSlotStartTime(label: string): string {
  const match = label.match(/^(\d{2}:\d{2})/)
  return match?.[1] ?? label
}

function formatDateSummaryLabel(dateKey: string): string {
  const d = dayjs(dateKey)
  const yShort = d.year() % 100
  return `${yShort}년 ${d.month() + 1}월 ${d.date()}일`
}

function buildGroupedSummaryEntries(
  selectedSlots: SelectedSlot[]
): Array<{ dateKey: string; text: string }> {
  const grouped = new Map<string, string[]>()

  for (const slot of [...selectedSlots].sort(
    (a, b) => a.dateKey.localeCompare(b.dateKey) || a.label.localeCompare(b.label)
  )) {
    const times = grouped.get(slot.dateKey) ?? []
    times.push(extractSlotStartTime(slot.label))
    grouped.set(slot.dateKey, times)
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, times]) => ({
      dateKey,
      text: `${formatDateSummaryLabel(dateKey)} ${times.join(', ')}`,
    }))
}

/** 봉사자 신청 폼 — 면접 진행 가능 일정(신청자 응답 · 모집 폼 관리자 설정 연동) */
export function VolunteerInterviewApplicantScheduleParagraph({
  commonScheduleSeed,
  readOnlyPreview = false,
}: {
  commonScheduleSeed?: VolunteerInterviewScheduleEditSeed
  readOnlyPreview?: boolean
}) {
  const seed = resolveVolunteerInterviewApplicantScheduleSeed(commonScheduleSeed)
  const parsedSchedule = useMemo(
    () => parseVolunteerInterviewApplicantScheduleFromSeed(seed),
    [seed]
  )

  const computeDefaultSelectedDate = () => {
    const first = [...parsedSchedule.clickableDateKeys].sort()[0]
    return first ? dayjs(first) : parsedSchedule.scheduleMonth
  }

  const [currentMonth, setCurrentMonth] = useGeneralApplicationOverlayKv(
    'application.volunteer.applicant.currentMonth',
    parsedSchedule.scheduleMonth
  )
  const [selectedDate, setSelectedDate] = useGeneralApplicationOverlayKv(
    'application.volunteer.applicant.selectedDate',
    computeDefaultSelectedDate()
  )
  const [selectedSlots] = useGeneralApplicationOverlayKv<SelectedSlot[]>(
    'application.volunteer.applicant.selectedSlots',
    []
  )

  const scheduleTopRef = useRef<HTMLDivElement>(null)
  const calendarWrapRef = useRef<HTMLDivElement>(null)
  useProgramRegistrationScheduleTopCalendarHeightSync(scheduleTopRef, calendarWrapRef)

  const adminAvailableDateKeys = parsedSchedule.clickableDateKeys
  const selectedDateKey = selectedDate.format('YYYY-MM-DD')
  const slotsForSelectedDay = parsedSchedule.slotsForDate(selectedDateKey)

  useEffect(() => {
    setCurrentMonth(parsedSchedule.scheduleMonth)
    const first = [...parsedSchedule.clickableDateKeys].sort()[0]
    setSelectedDate(first ? dayjs(first) : parsedSchedule.scheduleMonth)
    updateGeneralApplicationOverlayKey<SelectedSlot[]>('application.volunteer.applicant.selectedSlots', () => [])
  }, [seed, setCurrentMonth, setSelectedDate])

  const toggleSlot = (slotKey: string, label: string, enabled: boolean) => {
    if (readOnlyPreview || !enabled) return
    updateGeneralApplicationOverlayKey<SelectedSlot[]>('application.volunteer.applicant.selectedSlots', prev => {
      const current = prev ?? []
      const exists = current.some(
        (item: SelectedSlot) => item.dateKey === selectedDateKey && item.slotKey === slotKey
      )
      if (exists) {
        return current.filter(
          (item: SelectedSlot) => !(item.dateKey === selectedDateKey && item.slotKey === slotKey)
        )
      }
      return [...current, { dateKey: selectedDateKey, slotKey, label }]
    })
  }

  const summaryEntries = buildGroupedSummaryEntries(selectedSlots)
  const scheduleSummaryBlock =
    summaryEntries.length === 0 ? (
      <div className="program-application-form-instructor__field-summary-wrap">
        <ProgramApplicationScheduleSummaryHintText />
      </div>
    ) : (
      <div className="program-application-form-instructor__field-summary-wrap">
        {summaryEntries.map((entry, index) => (
          <Fragment key={entry.dateKey}>
            {index > 0 ? <DetailInfoForm.TdDivider /> : null}
            <span className="program-application-form-instructor__summary-inline-text">
              {entry.text}
            </span>
          </Fragment>
        ))}
      </div>
    )

  return (
    <div
      className={[
        'volunteer-interview-applicant-schedule',
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
          <ParagraphCalendarMini
            currentMonth={currentMonth}
            selectedDate={selectedDate}
            onMonthChange={setCurrentMonth}
            onSelectDate={setSelectedDate}
            programDates={adminAvailableDateKeys}
            disabledDate={parsedSchedule.disabledDate}
          />
        </div>
        <div className="program-application-form-instructor__schedule-side">
          {slotsForSelectedDay.length > 0 ? (
            <div
              className="volunteer-interview-applicant-schedule__time-slots"
              role="list"
            >
              {slotsForSelectedDay.map(slot => {
                const isSelected = selectedSlots.some(
                  item => item.dateKey === selectedDateKey && item.slotKey === slot.key
                )
                return (
                  <ParagraphChip
                    key={slot.key}
                    role="listitem"
                    size="compact"
                    className="volunteer-interview-applicant-schedule__time-slot"
                    selected={isSelected}
                    disabled={!slot.enabled || readOnlyPreview}
                    onClick={() => toggleSlot(slot.key, slot.label, slot.enabled)}
                  >
                    {formatTimeSlotChipLabel(slot.label)}
                  </ParagraphChip>
                )
              })}
            </div>
          ) : (
            <div className="volunteer-interview-applicant-schedule__empty" role="status">
              이 날짜에 표시할 일정이 없습니다.
            </div>
          )}
        </div>
      </div>

      <DetailInfoForm title="" hideHeader mode="edit">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="면접 진행 가능일"
            edit={scheduleSummaryBlock}
            view={scheduleSummaryBlock}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}
