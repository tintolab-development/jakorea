import { useCallback, useEffect, useMemo, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { ContentModal, CmsButton, CmsInput, useCmsAlert } from '@/shared/ui'
import { CmsSelect } from '@/shared/ui/cms-select'
import { ParagraphTimePicker } from '@/features/template/ui/shared/paragraph-time-picker'
import { applyAttendanceCorrection, parseSessionStartTime } from './attendance-display'
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
  educationDateLabel: string
  volunteers: ReadonlyArray<UjatAttendanceVolunteerRow>
  onCancel: () => void
  onConfirm: (payload: UjatAttendanceCorrectionPayload) => void
}

function parseCheckInDayjs(value: string | undefined, fallback: string): Dayjs {
  const raw = value ?? fallback
  const match = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (!match) return dayjs().hour(8).minute(30).second(0).millisecond(0)
  return dayjs().hour(Number(match[1])).minute(Number(match[2])).second(0).millisecond(0)
}

function formatCheckInTime(value: Dayjs | null): string {
  if (!value) return '8:00'
  return value.format('H:mm')
}

function parseUjatAttendanceStatus(value: unknown): UjatAttendanceStatus | undefined {
  if (
    value === 'present' ||
    value === 'late' ||
    value === 'absent' ||
    value === 'excused_absence'
  ) {
    return value
  }
  return undefined
}

function isTimeFieldVisible(status: UjatAttendanceStatus | undefined): boolean {
  return status == null || status === 'present' || status === 'late'
}

function isReasonFieldVisible(status: UjatAttendanceStatus | undefined): boolean {
  return status === 'excused_absence'
}

export function UjatAttendanceCorrectionModal({
  open,
  timeRange,
  educationDateLabel,
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
  const [status, setStatus] = useState<UjatAttendanceStatus | undefined>(undefined)
  const [checkInTime, setCheckInTime] = useState<Dayjs>(() =>
    parseCheckInDayjs(undefined, sessionStartTime)
  )
  const [excusedReason, setExcusedReason] = useState('')

  useEffect(() => {
    if (!open) return
    setVolunteerId(undefined)
    setStatus(undefined)
    setCheckInTime(parseCheckInDayjs(undefined, sessionStartTime))
    setExcusedReason('')
  }, [open, sessionStartTime])

  useEffect(() => {
    if (isReasonFieldVisible(status)) return
    setExcusedReason('')
  }, [status])

  useEffect(() => {
    if (status !== 'present' && status !== 'late') return
    setCheckInTime(parseCheckInDayjs(undefined, sessionStartTime))
  }, [sessionStartTime, status])

  const canConfirm = useMemo(() => {
    if (!volunteerId || !status) return false
    return volunteers.some(row => row.id === volunteerId)
  }, [status, volunteerId, volunteers])

  const handleCancel = useCallback(() => {
    setVolunteerId(undefined)
    onCancel()
  }, [onCancel])

  const handleConfirm = useCallback(() => {
    if (!canConfirm || !volunteerId || !status) return
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
      checkInTime: status === 'present' || status === 'late' ? formatCheckInTime(checkInTime) : undefined,
      excusedReason: isReasonFieldVisible(status) ? excusedReason.trim() : undefined,
    })
    setVolunteerId(undefined)
  }, [canConfirm, checkInTime, excusedReason, onConfirm, showAlert, status, volunteerId])

  const displayDateLabel = educationDateLabel.trim() || '교육'
  const statusUnset = status == null

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
      description={`봉사자를 선택 후 **${displayDateLabel}** 교육의 출결 상태를 정정해 주세요.`}
    >
      <div className="ujat-attendance-correction-modal__form">
        <div className="ujat-attendance-correction-modal__field">
          <span className="ujat-attendance-correction-modal__label">
            봉사자{' '}
            <span className="ujat-attendance-correction-modal__required" aria-hidden>
              *
            </span>
          </span>
          <CmsSelect
            inputSize="large"
            width="100%"
            withAllOption={false}
            placeholder="봉사자를 선택해 주세요"
            value={volunteerId}
            onChange={value => setVolunteerId(value == null || value === '' ? undefined : String(value))}
            options={volunteerOptions}
            aria-label="봉사자"
          />
        </div>

        <div className="ujat-attendance-correction-modal__field">
          <span className="ujat-attendance-correction-modal__label">
            출결 정정{' '}
            <span className="ujat-attendance-correction-modal__required" aria-hidden>
              *
            </span>
          </span>
          <div className="ujat-attendance-correction-modal__status-row">
            <CmsSelect
              inputSize="large"
              className="ujat-attendance-correction-modal__status-select"
              width={170}
              value={status ?? ''}
              onChange={value => setStatus(parseUjatAttendanceStatus(value))}
              options={UJAT_ATTENDANCE_STATUS_ORDER.map(value => ({
                value,
                label: UJAT_ATTENDANCE_STATUS_LABEL[value],
              }))}
              aria-label="출결 현황"
            />
            {isTimeFieldVisible(status) ? (
              <div className="ujat-attendance-correction-modal__time-field">
                <ParagraphTimePicker
                  value={statusUnset ? null : checkInTime}
                  onChange={next =>
                    setCheckInTime(next ?? parseCheckInDayjs(undefined, sessionStartTime))
                  }
                  placeholder={statusUnset ? '출결 상태를 먼저 선택해 주세요' : '시간 선택'}
                  disabled={statusUnset}
                  width="100%"
                  inputSize="large"
                  zIndex={MODAL_Z_INDEX + DATE_TIME_PICKER_Z_OFFSET}
                  showEndTimeToggle={false}
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
