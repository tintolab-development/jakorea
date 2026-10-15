import { useEffect, useMemo, useRef, useState } from 'react'
import { CloseOutlined } from '@ant-design/icons'
import type { Dayjs } from 'dayjs'
import type { UjatVolunteerApplicantRow } from '@/features/program/ujat/model/ujat-volunteer-applicant'
import { useProgramRegistrationScheduleTopCalendarHeightSync } from '@/features/template/hooks/use-program-registration-schedule-top-calendar-height-sync'
import { UjatVolunteerInterviewAssignCalendarMini } from './calendar-mini'
import { ParagraphChip } from '@/features/template/ui/shared/paragraph-chip'
import '@/shared/components/calendar/styles/calendar.css'
import '@/shared/components/permission-modal.css'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { DateTimePickerPopover } from '@/shared/components/date-time-picker-modal'
import {
  getDefaultManualNotifyAt,
  isFutureNotificationTime,
} from '@/shared/lib/notification-schedule'
import { alertUjatVolunteerInterviewAssignSlotRequired } from '../applicant/guard-actions'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsRadio } from '@/shared/ui/cms-radio'
import { useProgramDetail } from '@/features/program/ujat/api/queries'
import { useKoreanPublicHolidayDateKeys } from '@/features/program/ujat/api/korean-public-holidays'
import { resolveUjatVolunteerInterviewScheduleDisplay } from '@/features/program/ujat/lib/ujat-volunteer-interview-schedule-display'
import {
  countSlotAssignments,
  formatInterviewAssignScheduledSummary,
  formatStoredInterviewDateLabel,
  normalizeTimeRangeKey,
  getApplicantAssignedSlotKey,
  getAssignedInterviewDateKeys,
  buildProgramInterviewUnavailableDateKeys,
  getSlotsForDate,
  parseInterviewScheduleFromDisplay,
  resolveInterviewAssignModalCalendarState,
  type InterviewAssignSlot,
  type ParsedInterviewSchedule,
} from './schedule-utils'
import './modal.css'

const MODAL_Z_INDEX = 2500
const DATE_TIME_PICKER_Z_OFFSET = 100

export type UjatInterviewAssignNotifyTiming = 'immediate' | 'manual'

export type UjatInterviewAssignConfirmPayload = {
  dateLabel: string
  timeRange: string
  notifyTiming: UjatInterviewAssignNotifyTiming
  manualNotifyAt?: Dayjs
}

export type UjatVolunteerInterviewAssignModalProps = {
  open: boolean
  applicant: UjatVolunteerApplicantRow
  programId: string
  allApplicants: UjatVolunteerApplicantRow[]
  mode: 'assign' | 'reassign'
  /** 프로그램 유형별 스케줄 주입. 없으면 프로그램 상세의 면접 일정만 사용 */
  schedule?: ParsedInterviewSchedule
  /** 본문 호칭 — 기본 `봉사자`, 참여자 신청 목록에서는 `참여자` */
  subjectNoun?: string
  onCancel: () => void
  onConfirm: (payload: UjatInterviewAssignConfirmPayload) => void
}

export function UjatVolunteerInterviewAssignModal({
  open,
  applicant,
  programId,
  allApplicants,
  mode,
  schedule: scheduleOverride,
  subjectNoun: _subjectNoun = '봉사자',
  onCancel,
  onConfirm,
}: UjatVolunteerInterviewAssignModalProps) {
  const programDetail = useProgramDetail(open ? programId : undefined)
  const publicHolidayDateKeys = useKoreanPublicHolidayDateKeys({
    from: programDetail.data?.interviewStartDate,
    to: programDetail.data?.interviewEndDate,
    enabled: open && !scheduleOverride,
  })
  const scheduleFromProgram = useMemo(() => {
    const program = programDetail.data
    if (!program) {
      return parseInterviewScheduleFromDisplay({
        common: {
          recurringUnavailable: '-',
          specificUnavailableDates: '-',
          availableTimeSlots: '-',
        },
        exceptions: [],
      })
    }
    return parseInterviewScheduleFromDisplay(
      resolveUjatVolunteerInterviewScheduleDisplay(program, undefined, {
        allowMockFallback: false,
      }),
      {
        startIso: program.interviewStartDate,
        endIso: program.interviewEndDate,
      },
      publicHolidayDateKeys
    )
  }, [programDetail.data, publicHolidayDateKeys])
  const schedule = scheduleOverride ?? scheduleFromProgram

  const assignedDateKeys = useMemo(
    () => getAssignedInterviewDateKeys(allApplicants),
    [allApplicants]
  )

  const applicantAssignedSlotKey = useMemo(
    () => getApplicantAssignedSlotKey(applicant),
    [applicant]
  )

  const [currentMonth, setCurrentMonth] = useState<Dayjs>(() => schedule.scheduleMonth)
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => schedule.scheduleMonth)
  const [selectedSlotKey, setSelectedSlotKey] = useState<string | null>(null)
  const [notifyTiming, setNotifyTiming] = useState<UjatInterviewAssignNotifyTiming>('immediate')
  const [manualNotifyAt, setManualNotifyAt] = useState<Dayjs | null>(null)
  const [dateTimePickerOpen, setDateTimePickerOpen] = useState(false)
  const [notifyError, setNotifyError] = useState('')

  const programUnavailableDateKeys = useMemo(
    () => buildProgramInterviewUnavailableDateKeys(schedule),
    [schedule]
  )

  /** 캘린더·시간대 SSOT = 프로그램 면접 일정 */
  const disabledDate = useMemo(
    () => (date: Dayjs) => {
      const key = date.format('YYYY-MM-DD')
      if (!schedule.clickableDateKeys.has(key)) return true
      /** 시간대 선택 후 다른 날짜 비활성 — 선택 해제 시 다시 변경 가능 */
      if (selectedSlotKey != null && !date.isSame(selectedDate, 'day')) return true
      return false
    },
    [schedule.clickableDateKeys, selectedDate, selectedSlotKey]
  )

  const scheduleTopRef = useRef<HTMLDivElement>(null)
  const calendarWrapRef = useRef<HTMLDivElement>(null)
  const modalContentRef = useRef<HTMLDivElement>(null)
  const manualRadioAnchorRef = useRef<HTMLSpanElement>(null)

  useProgramRegistrationScheduleTopCalendarHeightSync(scheduleTopRef, calendarWrapRef)

  useEffect(() => {
    if (!open) return

    const {
      scheduleMonth,
      selectedDate: initialSelectedDate,
      selectedSlotKey: initialSlotKey,
    } = resolveInterviewAssignModalCalendarState(schedule, applicant)

    setCurrentMonth(scheduleMonth)
    setSelectedDate(initialSelectedDate)
    setSelectedSlotKey(initialSlotKey)
    setNotifyTiming('immediate')
    setManualNotifyAt(null)
    setDateTimePickerOpen(false)
    setNotifyError('')
  }, [open, applicant, schedule])

  const selectedDateKey = selectedDate.format('YYYY-MM-DD')
  const slotsForDay = useMemo(
    () => getSlotsForDate(schedule, selectedDateKey, applicant),
    [schedule, selectedDateKey, applicant]
  )

  const selectedSlot = useMemo(
    () => slotsForDay.find(slot => slot.key === selectedSlotKey) ?? null,
    [slotsForDay, selectedSlotKey]
  )

  const storedDateLabel = useMemo(
    () => formatStoredInterviewDateLabel(selectedDate),
    [selectedDate]
  )

  const handleSelectDate = (date: Dayjs) => {
    if (disabledDate(date)) return
    setSelectedDate(date)
    setSelectedSlotKey(null)
  }

  const handleSelectSlot = (slot: InterviewAssignSlot) => {
    setSelectedSlotKey(prev => (prev === slot.key ? null : slot.key))
  }

  const handleClearSelectedSchedule = () => {
    setSelectedSlotKey(null)
  }

  const handleNotifyTimingChange = (next: UjatInterviewAssignNotifyTiming) => {
    setNotifyTiming(next)
    setNotifyError('')
    if (next === 'manual') {
      setManualNotifyAt(getDefaultManualNotifyAt())
      setDateTimePickerOpen(true)
    } else {
      setDateTimePickerOpen(false)
    }
  }

  const handleConfirm = () => {
    if (!selectedSlot) {
      alertUjatVolunteerInterviewAssignSlotRequired()
      return
    }
    if (notifyTiming === 'manual' && !manualNotifyAt) {
      setNotifyError('알림 발송 일시를 설정해 주세요.')
      return
    }
    if (notifyTiming === 'manual' && !isFutureNotificationTime(manualNotifyAt)) {
      setNotifyError('알림 발송 일시는 현재 시각 이후로 설정해 주세요.')
      return
    }
    setNotifyError('')
    onConfirm({
      dateLabel: storedDateLabel,
      timeRange: selectedSlot.timeRange,
      notifyTiming,
      manualNotifyAt: notifyTiming === 'manual' ? (manualNotifyAt ?? undefined) : undefined,
    })
  }

  const summaryBlock = selectedSlot ? (
    <span className="ujat-volunteer-interview-assign-modal__summary-selected">
      <span className="ujat-volunteer-interview-assign-modal__summary-value">
        {formatInterviewAssignScheduledSummary(selectedDate, selectedSlot.timeRange)}
      </span>
      <button
        type="button"
        className="ujat-volunteer-interview-assign-modal__summary-clear"
        aria-label="선택한 면접 일정 지우기"
        onClick={handleClearSelectedSchedule}
      >
        <CloseOutlined aria-hidden />
      </button>
    </span>
  ) : (
    <span className="ujat-volunteer-interview-assign-modal__summary-placeholder">
      면접 일정을 선택해 주세요.
    </span>
  )

  const confirmLabel = mode === 'reassign' ? '면접일 재배정' : '면접일 배정'

  return (
    <>
      <ContentModal
        open={open}
        onCancel={onCancel}
        title="면접일 배정 안내"
        width={800}
        className="ujat-volunteer-interview-assign-modal"
        zIndex={MODAL_Z_INDEX}
        description={`**[${applicant.name}]** 님의 면접을 진행할 일정을 선택해 주세요.\n면접은 한 차례만 진행할 수 있습니다.`}
        footer={
          <div className="ujat-volunteer-interview-assign-modal__footer">
            <CmsButton variant="secondary" size="medium" type="button" onClick={onCancel}>
              취소
            </CmsButton>
            <CmsButton variant="primary" size="medium" type="button" onClick={handleConfirm}>
              {confirmLabel}
            </CmsButton>
          </div>
        }
      >
        <div ref={modalContentRef}>
          <div ref={scheduleTopRef} className="ujat-volunteer-interview-assign-modal__schedule-top">
            <div
              ref={calendarWrapRef}
              className="ujat-volunteer-interview-assign-modal__calendar-panel"
            >
              <UjatVolunteerInterviewAssignCalendarMini
                currentMonth={currentMonth}
                selectedDate={selectedDate}
                onMonthChange={setCurrentMonth}
                onSelectDate={handleSelectDate}
                programDates={schedule.clickableDateKeys}
                programUnavailableDateKeys={programUnavailableDateKeys}
                holidayDateKeys={schedule.holidayDateKeys}
                assignedDateKeys={assignedDateKeys}
                disabledDate={disabledDate}
              />
            </div>
            <div className="ujat-volunteer-interview-assign-modal__slots-panel">
              <div className="ujat-volunteer-interview-assign-modal__slots-list">
                {slotsForDay.length === 0 ? (
                  <div className="ujat-volunteer-interview-assign-modal__slots-empty" role="status">
                    이 날짜에 배정 가능한 시간대가 없습니다.
                  </div>
                ) : (
                  slotsForDay.map(slot => {
                    const assignedCount = countSlotAssignments(
                      allApplicants,
                      storedDateLabel,
                      slot.timeRange,
                      applicant.id
                    )
                    const isSelected = selectedSlotKey === slot.key
                    /** 시간대 선택 시 나머지 항목 비활성화(재클릭으로 선택 해제) */
                    const isDisabledBySiblingSelection = selectedSlotKey != null && !isSelected
                    const isApplicantAssignedSlot = applicantAssignedSlotKey === slot.key
                    return (
                      <ParagraphChip
                        key={slot.key}
                        aria-pressed={isSelected}
                        disabled={isDisabledBySiblingSelection}
                        className={[
                          'ujat-volunteer-interview-assign-modal__slot-chip',
                          isApplicantAssignedSlot
                            ? 'ujat-volunteer-interview-assign-modal__slot-chip--assignment-complete'
                            : '',
                          isDisabledBySiblingSelection
                            ? 'ujat-volunteer-interview-assign-modal__slot-chip--disabled'
                            : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        selected={isSelected}
                        onClick={() => handleSelectSlot(slot)}
                      >
                        <span className="ujat-volunteer-interview-assign-modal__slot-time">
                          {normalizeTimeRangeKey(slot.timeRange)}
                        </span>
                        <span className="ujat-volunteer-interview-assign-modal__slot-count">
                          {assignedCount}명
                        </span>
                      </ParagraphChip>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          <div className="ujat-volunteer-interview-assign-modal__summary-section">
            <DetailInfoForm title="" hideHeader mode="edit">
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field label="배정된 일정" edit={summaryBlock} view={summaryBlock} />
              </DetailInfoForm.Row>
            </DetailInfoForm>
          </div>

          <div className="ujat-volunteer-interview-assign-modal__notify-field permission-modal__field">
            <CmsRadio.Group
              label="알림 발송"
              required
              size="medium"
              value={notifyTiming}
              onChange={e =>
                handleNotifyTimingChange(e.target.value as UjatInterviewAssignNotifyTiming)
              }
            >
              <CmsRadio value="immediate" size="medium">
                즉시
              </CmsRadio>
              <span ref={manualRadioAnchorRef} className="permission-modal__manual-anchor">
                <CmsRadio
                  value="manual"
                  size="medium"
                  onClick={() => {
                    if (notifyTiming === 'manual') {
                      setManualNotifyAt(prev => prev ?? getDefaultManualNotifyAt())
                      setDateTimePickerOpen(true)
                    }
                  }}
                >
                  직접 설정
                  {notifyTiming === 'manual' && manualNotifyAt != null ? (
                    <span className="permission-modal__manual-summary">
                      {' '}
                      ({manualNotifyAt.format('YYYY. MM. DD HH:mm')})
                    </span>
                  ) : null}
                </CmsRadio>
              </span>
            </CmsRadio.Group>
            {notifyError ? (
              <span className="permission-modal__field-error" role="alert">
                {notifyError}
              </span>
            ) : null}
          </div>
        </div>
      </ContentModal>

      <DateTimePickerPopover
        open={open && notifyTiming === 'manual' && dateTimePickerOpen}
        onClose={() => setDateTimePickerOpen(false)}
        anchorRef={manualRadioAnchorRef}
        dismissExcludeRef={modalContentRef}
        value={manualNotifyAt ?? getDefaultManualNotifyAt()}
        onChange={setManualNotifyAt}
        onApply={value => {
          setManualNotifyAt(value)
          setDateTimePickerOpen(false)
          setNotifyError('')
        }}
        zIndex={MODAL_Z_INDEX + DATE_TIME_PICKER_Z_OFFSET}
      />
    </>
  )
}
