import { useCallback, useEffect, useMemo, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { ContentModal, CmsButton, CmsInput, useCmsAlert } from '@/shared/ui'
import { CmsSelect } from '@/shared/ui/cms-select'
import { ParagraphTimePicker } from '@/features/template/ui/shared/paragraph-time-picker'
import {
  applyAttendanceCorrection,
  parseSessionStartTime,
} from './attendance-display'
import {
  UJAT_ATTENDANCE_STATUS_LABEL,
  UJAT_ATTENDANCE_STATUS_ORDER,
  type UjatAttendanceStatus,
  type UjatAttendanceVolunteerRow,
} from './types'
import './attendance-correction-modal.css'

const MODAL_Z_INDEX = 1100
const DATE_TIME_PICKER_Z_OFFSET = 100

export type UjatAttendanceCorrectionPayload = {
  volunteerId: string
  status: UjatAttendanceStatus
  checkInTime?: string
  excusedReason?: string
}

export type UjatAttendanceCorrectionModalProps = {
  open: boolean
  timeRange: string
  volunteers: ReadonlyArray<UjatAttendanceVolunteerRow>
  onCancel: () => void
  onConfirm: (payload: UjatAttendanceCorrectionPayload) => void
}

function parseCheckInDayjs(value: string | undefined, fallback: string): Dayjs {
  const raw = value ?? fallback
  const match = raw.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return dayjs().hour(8).minute(30).second(0).millisecond(0)
  return dayjs()
    .hour(Number(match[1]))
    .minute(Number(match[2]))
    .second(0)
    .millisecond(0)
}

function formatCheckInTime(value: Dayjs | null): string {
  if (!value) return '8:00'
  return value.format('H:mm')
}

function isTimeFieldVisible(status: UjatAttendanceStatus): boolean {
  return status === 'present' || status === 'late'
}

function isReasonFieldVisible(status: UjatAttendanceStatus): boolean {
  return status === 'excused_absence'
}

export function UjatAttendanceCorrectionModal({
  open,
  timeRange,
  volunteers,
  onCancel,
  onConfirm,
}: UjatAttendanceCorrectionModalProps) {
  const { showAlert } = useCmsAlert()
  const sessionStartTime = useMemo(() => parseSessionStartTime(timeRange), [timeRange])

  const volunteerOptions = useMemo(
    () => volunteers.map(row => ({ value: row.id, label: row.name })),
    [volunteers]
  )

  const [volunteerId, setVolunteerId] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<UjatAttendanceStatus>('present')
  const [checkInTime, setCheckInTime] = useState<Dayjs>(() =>
    parseCheckInDayjs(undefined, sessionStartTime)
  )
  const [excusedReason, setExcusedReason] = useState('')

  const selectedVolunteer = useMemo(
    () => volunteers.find(row => row.id === volunteerId),
    [volunteerId, volunteers]
  )

  useEffect(() => {
    if (!open) return
    setVolunteerId(undefined)
    setStatus('present')
    setCheckInTime(parseCheckInDayjs(undefined, sessionStartTime))
    setExcusedReason('')
  }, [open, sessionStartTime])

  useEffect(() => {
    if (!selectedVolunteer) return
    setStatus(selectedVolunteer.status)
    const defaultTime =
      selectedVolunteer.checkInTime ??
      (selectedVolunteer.status === 'late' ? '9:10' : sessionStartTime)
    setCheckInTime(parseCheckInDayjs(defaultTime, sessionStartTime))
    setExcusedReason(
      selectedVolunteer.status === 'excused_absence'
        ? (selectedVolunteer.excusedReason ?? '')
        : ''
    )
  }, [selectedVolunteer, sessionStartTime])

  useEffect(() => {
    if (isReasonFieldVisible(status)) return
    setExcusedReason('')
  }, [status])

  const canConfirm = useMemo(() => {
    if (!volunteerId) return false
    return volunteers.some(row => row.id === volunteerId)
  }, [volunteerId, volunteers])

  const handleCancel = useCallback(() => {
    setVolunteerId(undefined)
    onCancel()
  }, [onCancel])

  const handleConfirm = useCallback(() => {
    if (!canConfirm || !volunteerId) return
    if (isReasonFieldVisible(status) && excusedReason.trim().length === 0) {
      showAlert({
        title: '안내',
        content: '사유를 입력해 주세요.',
      })
      return
    }
    onConfirm({
      volunteerId,
      status,
      checkInTime: isTimeFieldVisible(status)
        ? formatCheckInTime(checkInTime)
        : undefined,
      excusedReason: isReasonFieldVisible(status) ? excusedReason.trim() : undefined,
    })
    setVolunteerId(undefined)
  }, [canConfirm, checkInTime, excusedReason, onConfirm, showAlert, status, volunteerId])

  const footer = (
    <div className="ujat-attendance-correction-modal__footer">
      <CmsButton variant="secondary" size="large" type="button" onClick={handleCancel}>
        취소
      </CmsButton>
      <CmsButton
        variant="primary"
        size="large"
        type="button"
        disabled={!canConfirm}
        onClick={handleConfirm}
      >
        출결 정정
      </CmsButton>
    </div>
  )

  return (
    <ContentModal
      open={open}
      onCancel={handleCancel}
      title="출결 정정"
      width={600}
      zIndex={MODAL_Z_INDEX}
      className="ujat-attendance-correction-modal"
      wrapClassName="ujat-attendance-correction-modal-wrap"
      footer={footer}
      description="출결 정정할 봉사자를 및 정정 내용을 선택해 주세요"
    >
      <div className="ujat-attendance-correction-modal__form">
        <div className="ujat-attendance-correction-modal__field">
          <span className="ujat-attendance-correction-modal__label">봉사자명</span>
          <CmsSelect
            inputSize="large"
            width="100%"
            withAllOption={false}
            placeholder="봉사자명을 선택해 주세요"
            value={volunteerId}
            onChange={value => setVolunteerId(value == null ? undefined : String(value))}
            options={volunteerOptions}
            aria-label="봉사자명"
          />
        </div>

        <div className="ujat-attendance-correction-modal__field">
          <span className="ujat-attendance-correction-modal__label">교육 출결 현황</span>
          <div className="ujat-attendance-correction-modal__status-row">
            <CmsSelect
              inputSize="large"
              className="ujat-attendance-correction-modal__status-select"
              withAllOption={false}
              value={status}
              onChange={value =>
                setStatus((value ?? 'present') as UjatAttendanceStatus)
              }
              options={UJAT_ATTENDANCE_STATUS_ORDER.map(value => ({
                value,
                label: UJAT_ATTENDANCE_STATUS_LABEL[value],
              }))}
              aria-label="교육 출결 현황"
            />
            {isTimeFieldVisible(status) ? (
              <div className="ujat-attendance-correction-modal__time-field">
                <ParagraphTimePicker
                  value={checkInTime}
                  onChange={next => setCheckInTime(next ?? parseCheckInDayjs(undefined, sessionStartTime))}
                  placeholder="시간 선택"
                  width="100%"
                  zIndex={MODAL_Z_INDEX + DATE_TIME_PICKER_Z_OFFSET}
                />
              </div>
            ) : isReasonFieldVisible(status) ? (
              <div className="ujat-attendance-correction-modal__reason-field">
                <CmsInput
                  inputSize="large"
                  width="100%"
                  value={excusedReason}
                  onChange={event => setExcusedReason(event.target.value)}
                  placeholder="사유를 입력해 주세요"
                  aria-label="불참 사유"
                />
              </div>
            ) : (
              <div className="ujat-attendance-correction-modal__time-field ujat-attendance-correction-modal__time-field--hidden" />
            )}
          </div>
        </div>
      </div>
    </ContentModal>
  )
}

export function buildCorrectedVolunteerRow(
  row: UjatAttendanceVolunteerRow,
  payload: UjatAttendanceCorrectionPayload,
  sessionStartTime: string
): UjatAttendanceVolunteerRow {
  return applyAttendanceCorrection(row, payload.status, {
    checkInTime: payload.checkInTime,
    sessionStartTime,
    excusedReason: payload.excusedReason,
  })
}
