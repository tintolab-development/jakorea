import '@/features/template/ui/form-set/application-form/instructor/program-application-form-instructor.css'
import { useMemo, useRef, useState } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import '@/shared/components/calendar/styles/calendar.css'
import { ParagraphCalendarMini } from '@/features/template/ui/shared/paragraph-calendar-mini'
import {
  ProgramApplicationScheduleSummaryHintText,
  ProgramApplicationScheduleTemplateHintParagraph,
} from '@/features/template/ui/form-set/application-form/shared/paragraphs/program-application-schedule-template-hint-paragraph'
import { useProgramRegistrationScheduleTopCalendarHeightSync } from '@/features/template/hooks/use-program-registration-schedule-top-calendar-height-sync'

const scheduleSummaryBlock = (
  <div className="program-application-form-instructor__field-summary-wrap">
    <ProgramApplicationScheduleSummaryHintText />
  </div>
)

/** Gemini 찾아가는 연수 강사 신청 — 강의 진행 가능 일정(캘린더 + 프로그램 연동 전 안내) */
export function GeminiInstructorAvailableScheduleParagraph() {
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(() => dayjs('2026-03-01'))
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => dayjs('2026-03-09'))

  const scheduleTopRef = useRef<HTMLDivElement>(null)
  const calendarWrapRef = useRef<HTMLDivElement>(null)
  useProgramRegistrationScheduleTopCalendarHeightSync(scheduleTopRef, calendarWrapRef)

  const programDates = useMemo(() => new Set<string>(), [])

  return (
    <div className="program-application-form-instructor__available-schedule">
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
            programDates={programDates}
          />
        </div>
        <div className="program-application-form-instructor__schedule-side">
          <ProgramApplicationScheduleTemplateHintParagraph fillScheduleSide />
        </div>
      </div>

      <DetailInfoForm title="" hideHeader mode="edit">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="강의 진행 가능일"
            edit={scheduleSummaryBlock}
            view={scheduleSummaryBlock}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}
