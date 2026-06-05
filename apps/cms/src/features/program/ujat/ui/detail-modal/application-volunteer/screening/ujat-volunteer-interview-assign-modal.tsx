import { useEffect, useMemo, useRef, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import type { UjatVolunteerApplicantRow } from '@/data/mock/ujat-volunteer-applicants-mock'
import { useProgramRegistrationScheduleTopCalendarHeightSync } from '@/features/template/hooks/use-program-registration-schedule-top-calendar-height-sync'
import { UjatVolunteerInterviewAssignCalendarMini } from './ujat-volunteer-interview-assign-calendar-mini'
import { ParagraphChip } from '@/features/template/ui/shared/paragraph-chip'
import '@/shared/components/calendar/styles/calendar.css'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { DateTimePickerPopover } from '@/shared/components/date-time-picker-modal'
import { alertUjatVolunteerInterviewAssignSlotRequired } from './ujat-volunteer-applicant-guard-actions'
import { ContentModal } from '@/shared/ui/content-modal'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsRadio } from '@/shared/ui/cms-radio'
import {
  countSlotAssignments,
  formatInterviewSummary,
  formatStoredInterviewDateLabel,
  getApplicantAssignedSlotKey,
  getApplicantInterviewAvailabilityDateKeys,
  getAssignedInterviewDateKeys,
  getSlotsForDate,
  parseInterviewScheduleMock,
  resolveInterviewAssignModalCalendarState,
  type InterviewAssignSlot,
  type ParsedInterviewSchedule,
} from './ujat-interview-assign-schedule-utils'
import './ujat-volunteer-interview-assign-modal.css'

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
  /** 프로그램 유형별 스케줄 주입 (미전달 시 programId mock 사용) */
  schedule?: ParsedInterviewSchedule
  onCancel: () => void
  onConfirm: (payload: UjatInterviewAssignConfirmPayload) => void
}

function nowManualNotifyAt(): Dayjs {
  return dayjs().second(0).millisecond(0)
}

export function UjatVolunteerInterviewAssignModal({
  open,
  applicant,
  programId,
  allApplicants,
  mode,
  schedule: scheduleOverride,
  onCancel,
  onConfirm,
}: UjatVolunteerInterviewAssignModalProps) {
  const scheduleFromProgramId = useMemo(() => parseInterviewScheduleMock(programId), [programId])
  const schedule = scheduleOverride ?? scheduleFromProgramId

  const assignedDateKeys = useMemo(
    () => getAssignedInterviewDateKeys(allApplicants),
    [allApplicants]
  )

  const applicantAssignedSlotKey = useMemo(
    () => getApplicantAssignedSlotKey(applicant),
    [applicant]
  )

  /** 봉사자 신청 시 선택한 면접 가능일 — 연한 민트 배경 */
  const volunteerAvailabilityDateKeys = useMemo(
    () => getApplicantInterviewAvailabilityDateKeys(applicant),
    [applicant]
  )

  const [currentMonth, setCurrentMonth] = useState<Dayjs>(() => schedule.scheduleMonth)
  const [selectedDate, setSelectedDate] = useState<Dayjs>(() => schedule.scheduleMonth)
  const [selectedSlotKey, setSelectedSlotKey] = useState<string | null>(null)
  const [notifyTiming, setNotifyTiming] = useState<UjatInterviewAssignNotifyTiming>('immediate')
  const [manualNotifyAt, setManualNotifyAt] = useState<Dayjs | null>(null)
  const [dateTimePickerOpen, setDateTimePickerOpen] = useState(false)
  const [notifyError, setNotifyError] = useState('')

  const scheduleTopRef = useRef<HTMLDivElement>(null)
  const calendarWrapRef = useRef<HTMLDivElement>(null)
  const modalContentRef = useRef<HTMLDivElement>(null)
  const manualRadioAnchorRef = useRef<HTMLSpanElement>(null)

  useProgramRegistrationScheduleTopCalendarHeightSync(scheduleTopRef, calendarWrapRef)

  useEffect(() => {
    if (!open) return

    const { scheduleMonth, selectedDate: initialSelectedDate, selectedSlotKey: initialSlotKey } =
      resolveInterviewAssignModalCalendarState(schedule, applicant)

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
    if (schedule.disabledDate(date)) return
    setSelectedDate(date)
    setSelectedSlotKey(null)
  }

  const handleSelectSlot = (slot: InterviewAssignSlot) => {
    setSelectedSlotKey(slot.key)
  }

  const handleNotifyTimingChange = (next: UjatInterviewAssignNotifyTiming) => {
    setNotifyTiming(next)
    setNotifyError('')
    if (next === 'manual') {
      setManualNotifyAt(nowManualNotifyAt())
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
    setNotifyError('')
    onConfirm({
      dateLabel: storedDateLabel,
      timeRange: selectedSlot.timeRange,
      notifyTiming,
      manualNotifyAt: notifyTiming === 'manual' ? manualNotifyAt ?? undefined : undefined,
    })
  }

  const summaryBlock = selectedSlot ? (
    <span className="ujat-volunteer-interview-assign-modal__summary-value">
      {formatInterviewSummary(selectedDate, selectedSlot.timeRange)}
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
        modalStyles={{
          content: {
            height: 809,
            maxHeight: 809,
          },
          body: {
            maxHeight: 'calc(809px - 50px)',
            overflowY: 'auto',
          },
        }}
        description={`**[${applicant.name}]** 봉사자의 면접을 진행할 일정을 선택해 주세요.\n면접은 한 명 당 한 차례만 진행 가능합니다.`}
        footer={
          <div className="ujat-volunteer-interview-assign-modal__footer">
            <CmsButton variant="secondary" size="medium" type="button" onClick={onCancel}>
              취소
            </CmsButton>
            <CmsButton
              variant="primary"
              size="medium"
              type="button"
              onClick={handleConfirm}
            >
              {confirmLabel}
            </CmsButton>
          </div>
        }
      >
        <div ref={modalContentRef}>
          <div
            ref={scheduleTopRef}
            className="ujat-volunteer-interview-assign-modal__schedule-top"
          >
            <div
              ref={calendarWrapRef}
              className="ujat-volunteer-interview-assign-modal__calendar-panel"
            >
              <UjatVolunteerInterviewAssignCalendarMini
                currentMonth={currentMonth}
                selectedDate={selectedDate}
                onMonthChange={setCurrentMonth}
                onSelectDate={handleSelectDate}
                programDates={volunteerAvailabilityDateKeys}
                clickableDates={schedule.clickableDateKeys}
                holidayDateKeys={schedule.holidayDateKeys}
                assignedDateKeys={assignedDateKeys}
                disabledDate={schedule.disabledDate}
              />
            </div>
            <div className="ujat-volunteer-interview-assign-modal__slots-panel">
              <div className="ujat-volunteer-interview-assign-modal__slots-list">
                {slotsForDay.length === 0 ? (
                  <div
                    className="ujat-volunteer-interview-assign-modal__slots-empty"
                    role="status"
                  >
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
                    const isApplicantAssignedSlot = applicantAssignedSlotKey === slot.key
                    return (
                      <ParagraphChip
                        key={slot.key}
                        aria-pressed={isSelected}
                        className={[
                          'ujat-volunteer-interview-assign-modal__slot-chip',
                          isApplicantAssignedSlot
                            ? 'ujat-volunteer-interview-assign-modal__slot-chip--assignment-complete'
                            : '',
                        ]
                          .filter(Boolean)
                          .join(' ')}
                        selected={isSelected}
                        onClick={() => handleSelectSlot(slot)}
                      >
                        <span className="ujat-volunteer-interview-assign-modal__slot-time">
                          {slot.displayTimeRange}
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
                <DetailInfoForm.Field label="면접 진행일" edit={summaryBlock} view={summaryBlock} />
              </DetailInfoForm.Row>
            </DetailInfoForm>
          </div>

          <div className="ujat-volunteer-interview-assign-modal__notify-field">
            <span className="ujat-volunteer-interview-assign-modal__notify-label">알림 발송</span>
            <CmsRadio.Group
              size="large"
              value={notifyTiming}
              onChange={e =>
                handleNotifyTimingChange(e.target.value as UjatInterviewAssignNotifyTiming)
              }
            >
              <CmsRadio value="immediate">즉시</CmsRadio>
              <span ref={manualRadioAnchorRef} className="permission-modal__manual-anchor">
                <CmsRadio
                  value="manual"
                  onClick={() => {
                    if (notifyTiming === 'manual') {
                      setManualNotifyAt(prev => prev ?? nowManualNotifyAt())
                      setDateTimePickerOpen(true)
                    }
                  }}
                >
                  직접 설정
                  {notifyTiming === 'manual' && manualNotifyAt != null ? (
                    <span className="ujat-volunteer-interview-assign-modal__manual-summary">
                      {' '}
                      ({manualNotifyAt.format('YYYY. MM. DD HH:mm')})
                    </span>
                  ) : null}
                </CmsRadio>
              </span>
            </CmsRadio.Group>
            {notifyError ? (
              <span
                className="ujat-volunteer-interview-assign-modal__notify-error"
                role="alert"
              >
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
        value={manualNotifyAt ?? nowManualNotifyAt()}
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
