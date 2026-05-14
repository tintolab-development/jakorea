import { useMemo, useRef, useState } from 'react'
import type { Dayjs } from 'dayjs'
import dayjs from 'dayjs'
import '@/shared/components/calendar/styles/calendar.css'
import '@/features/template/ui/form-set/application-form/instructor/program-application-form-instructor.css'
import { ParagraphCalendarMini } from '@/features/template/ui/shared/paragraph-calendar-mini'
import { useProgramRegistrationScheduleTopCalendarHeightSync } from '@/features/template/hooks/use-program-registration-schedule-top-calendar-height-sync'
import { ScheduleSettingBlocked } from '@/features/template/ui/shared/schedule-setting-blocked'
import { DetailInfoForm } from '@/shared/components/detail-info-form'

/** 우측 타임 슬롯 영역 — 관리자 설정 일정 연동 전 플레이스홀더 (디자인 스펙) */
const TIME_SLOT_AREA_PLACEHOLDER = '봉사자 모집 폼에서 관리자가 설정한 일정 및 시간대가 노출됩니다.'

/** 선택한 일정 필드 — 관리자 진행 가능일 연동 전 안내 */
const SELECTED_SCHEDULE_PLACEHOLDER = '신청자가 선택한 진행 가능일이 노출됩니다.'

/** UJAT 프로그램 봉사자 신청 폼 — 면접 진행 가능 일정 */
export function UjatProgramApplicationVolunteerInterviewScheduleParagraph() {
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(() => dayjs().startOf('month'))
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => dayjs().startOf('month'))

  const scheduleTopRef = useRef<HTMLDivElement>(null)
  const calendarWrapRef = useRef<HTMLDivElement>(null)
  useProgramRegistrationScheduleTopCalendarHeightSync(scheduleTopRef, calendarWrapRef)

  /** 추후 API — 관리자가 지정한 면접 가능일 */
  const adminAvailableDates = useMemo(() => new Set<string>(), [])
  /** 추후 API — 사용자 선택 일정에 따른 강조 날짜 */
  const userSelectedDates = useMemo(() => new Set<string>(), [])

  const summaryBlock = (
    <span className="form-editor-template-field-hint-text">{SELECTED_SCHEDULE_PLACEHOLDER}</span>
  )

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
            programDates={userSelectedDates}
            clickableDates={adminAvailableDates}
          />
        </div>
        <div className="program-application-form-instructor__schedule-side">
          <ScheduleSettingBlocked text={TIME_SLOT_AREA_PLACEHOLDER} />
        </div>
      </div>

      <DetailInfoForm title="" hideHeader mode="edit">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field label="선택한 일정" edit={summaryBlock} view={summaryBlock} />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}
