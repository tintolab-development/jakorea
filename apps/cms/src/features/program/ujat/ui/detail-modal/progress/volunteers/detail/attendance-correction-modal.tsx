import { useEffect, useMemo, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { ContentModal, CmsButton, CmsInput, CmsSelect, FileSelectField, useCmsAlert } from '@/shared/ui'
import { ParagraphTimePicker } from '@/features/template/ui/shared/paragraph-time-picker'
import { UJAT_ATTENDANCE_STATUS_LABEL } from '../../attendance/types'
import type { UjatVolunteerAttendanceDisplay } from './assignment-types'
import './attendance-correction-modal.css'

type AttendanceStatusOption = 'present' | 'late' | 'absence' | 'excused_absence'

const ATTENDANCE_STATUS_OPTIONS: Array<{ value: AttendanceStatusOption; label: string }> = [
  { value: 'present', label: '출석' },
  { value: 'late', label: '지각' },
  { value: 'absence', label: '결석' },
  { value: 'excused_absence', label: UJAT_ATTENDANCE_STATUS_LABEL.excused_absence },
]

function toStatus(attendance: UjatVolunteerAttendanceDisplay): AttendanceStatusOption {
  if (attendance.kind === 'late') return 'late'
  if (attendance.kind === 'excused_absence') return 'excused_absence'
  if (attendance.kind === 'absence') return 'absence'
  return 'present'
}

function toInitialTime(attendance: UjatVolunteerAttendanceDisplay): Dayjs | null {
  if (attendance.kind === 'late') return dayjs(attendance.time, 'H:mm')
  return dayjs('8:30', 'H:mm')
}

export type AttendanceCorrectionConfirmPayload = {
  status: AttendanceStatusOption
  attendanceTime: string | null
  reason: string
  evidenceFileName: string | null
}

export function UjatVolunteerAttendanceCorrectionModal({
  open,
  volunteerName,
  scheduleDateLabel,
  initialAttendance,
  onCancel,
  onConfirm,
}: {
  open: boolean
  volunteerName: string
  scheduleDateLabel: string
  initialAttendance: UjatVolunteerAttendanceDisplay
  onCancel: () => void
  onConfirm: (payload: AttendanceCorrectionConfirmPayload) => void
}) {
  const { showAlert } = useCmsAlert()
  const [status, setStatus] = useState<AttendanceStatusOption>('present')
  const [attendanceTime, setAttendanceTime] = useState<Dayjs | null>(dayjs('8:30', 'H:mm'))
  const [reason, setReason] = useState('')
  const [evidenceFileNames, setEvidenceFileNames] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    setStatus(toStatus(initialAttendance))
    setAttendanceTime(toInitialTime(initialAttendance))
    setReason('')
    setEvidenceFileNames([])
  }, [initialAttendance, open])

  const isTimeEnabled = status === 'present' || status === 'late'
  const showReasonTable = status === 'excused_absence'

  useEffect(() => {
    if (isTimeEnabled && attendanceTime == null) {
      setAttendanceTime(dayjs('8:30', 'H:mm'))
      return
    }
    if (!isTimeEnabled) {
      setAttendanceTime(null)
    }
  }, [attendanceTime, isTimeEnabled])

  useEffect(() => {
    if (showReasonTable) return
    setReason('')
    setEvidenceFileNames([])
  }, [showReasonTable])

  const canConfirm = useMemo(() => {
    if (isTimeEnabled && attendanceTime == null) return false
    return true
  }, [attendanceTime, isTimeEnabled])

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="출결 정정"
      width={600}
      className="ujat-attendance-correction-modal"
      wrapClassName="ujat-attendance-correction-modal-wrap"
      description={`**[${volunteerName}]** 봉사자의 **[${scheduleDateLabel}]** 출석 현황을 정정하시겠습니까?`}
      footer={
        <div className="ujat-attendance-correction-modal__footer">
          <CmsButton variant="secondary" size="large" type="button" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large"
            type="button"
            disabled={!canConfirm}
            onClick={() => {
              if (showReasonTable && reason.trim().length === 0) {
                showAlert({
                  title: '안내',
                  content: '사유를 입력해 주세요.',
                })
                return
              }

              onConfirm({
                status,
                attendanceTime: attendanceTime ? attendanceTime.format('H:mm') : null,
                reason: reason.trim(),
                evidenceFileName: evidenceFileNames[0] ?? null,
              })
            }}
          >
            출결 정정
          </CmsButton>
        </div>
      }
    >
      <div className="ujat-attendance-correction-modal__content">
        <div className="ujat-attendance-correction-modal__field">
          <span className="ujat-attendance-correction-modal__label">교육 출결 현황</span>
          <div className="ujat-attendance-correction-modal__status-row">
            <CmsSelect
              inputSize="large"
              width={170}
              withAllOption={false}
              value={status}
              options={ATTENDANCE_STATUS_OPTIONS}
              onChange={value => setStatus((value as AttendanceStatusOption) ?? 'present')}
              aria-label="교육 출결 현황"
            />
            <ParagraphTimePicker
              className="ujat-attendance-correction-modal__time-picker"
              value={attendanceTime}
              onChange={setAttendanceTime}
              disabled={!isTimeEnabled}
              placeholder="8:30"
              width="100%"
              zIndex={2600}
              showEndTimeToggle={false}
            />
          </div>
        </div>

        {showReasonTable ? (
          <div className="ujat-attendance-correction-modal__reason-table-wrap">
            <table className="ujat-attendance-correction-modal__reason-table">
              <colgroup>
                <col style={{ width: '165px' }} />
                <col />
              </colgroup>
              <tbody>
                <tr>
                  <th scope="row">사유</th>
                  <td>
                    <CmsInput
                      inputSize="large"
                      width="100%"
                      value={reason}
                      onChange={event => setReason(event.target.value)}
                      placeholder="사유를 입력해 주세요"
                    />
                  </td>
                </tr>
                <tr>
                  <th scope="row">증빙 서류</th>
                  <td>
                    <FileSelectField
                      accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
                      fileNames={evidenceFileNames}
                      onFilesChange={files => setEvidenceFileNames(files.slice(0, 1).map(file => file.name))}
                      onRemoveFile={index =>
                        setEvidenceFileNames(prev => prev.filter((_, currentIndex) => currentIndex !== index))
                      }
                      buttonLabel="파일 선택"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        ) : null}
      </div>
    </ContentModal>
  )
}
