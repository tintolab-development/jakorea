import { useEffect, useMemo, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import {
  ContentModal,
  CmsButton,
  CmsInput,
  CmsSelect,
  FileSelectField,
  useCmsAlert,
} from '@/shared/ui'
import { ParagraphTimePicker } from '@/features/template/ui/shared/paragraph-time-picker'
import {
  PROGRAM_ATTENDANCE_CORRECTION_STATUS_OPTIONS,
  type ProgramAttendanceCorrectionConfirmPayload,
  type ProgramAttendanceCorrectionInitialValue,
  type ProgramAttendanceCorrectionStatus,
  type ProgramAttendanceCorrectionStatusOption,
} from '@/features/program/shared/lib/attendance-correction-types'
import './attendance-correction-modal.css'

function toStatus(
  attendance: ProgramAttendanceCorrectionInitialValue
): ProgramAttendanceCorrectionStatus {
  if (attendance.kind === 'late') return 'late'
  if (attendance.kind === 'excused_absence') return 'excused_absence'
  if (attendance.kind === 'absence') return 'absence'
  return 'present'
}

function toInitialTime(attendance: ProgramAttendanceCorrectionInitialValue): Dayjs | null {
  if (attendance.kind === 'late') return dayjs(attendance.time, 'H:mm')
  return dayjs('8:30', 'H:mm')
}

export type ProgramAttendanceCorrectionModalProps = {
  open: boolean
  /** 정정 대상 이름 (참여자·봉사자 등) */
  subjectName: string
  scheduleDateLabel: string
  initialAttendance: ProgramAttendanceCorrectionInitialValue
  /** 모달 설명 문구 역할 명사 — 기본 봉사자, 개인 참여자 상세는 참여자 */
  subjectRoleNoun?: string
  /** 출결 상태 셀렉트 옵션 — 미지정 시 사유 불참 라벨 기본 */
  statusOptions?: ReadonlyArray<ProgramAttendanceCorrectionStatusOption>
  onCancel: () => void
  onConfirm: (payload: ProgramAttendanceCorrectionConfirmPayload) => void
}

export function ProgramAttendanceCorrectionModal({
  open,
  subjectName,
  scheduleDateLabel,
  initialAttendance,
  subjectRoleNoun = '봉사자',
  statusOptions = PROGRAM_ATTENDANCE_CORRECTION_STATUS_OPTIONS,
  onCancel,
  onConfirm,
}: ProgramAttendanceCorrectionModalProps) {
  const { showAlert } = useCmsAlert()
  const [status, setStatus] = useState<ProgramAttendanceCorrectionStatus>('present')
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
      className="program-attendance-correction-modal"
      description={`**[${subjectName}]** ${subjectRoleNoun}의 **[${scheduleDateLabel}]** 출석 현황을 정정하시겠습니까?`}
      footer={
        <div className="program-attendance-correction-modal__footer">
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
      <div className="program-attendance-correction-modal__content">
        <div className="program-attendance-correction-modal__field">
          <span className="program-attendance-correction-modal__label">교육 출결 현황</span>
          <div className="program-attendance-correction-modal__status-row">
            <CmsSelect
              inputSize="large"
              width={170}
              withAllOption={false}
              value={status}
              options={[...statusOptions]}
              onChange={value =>
                setStatus((value as ProgramAttendanceCorrectionStatus) ?? 'present')
              }
              aria-label="교육 출결 현황"
            />
            <ParagraphTimePicker
              className="program-attendance-correction-modal__time-picker"
              value={attendanceTime}
              onChange={setAttendanceTime}
              disabled={!isTimeEnabled}
              placeholder="8:30"
              width="100%"
              inputSize="large"
              zIndex={2600}
              showEndTimeToggle={false}
            />
          </div>
        </div>

        {showReasonTable ? (
          <div className="program-attendance-correction-modal__reason-table-wrap">
            <table className="program-attendance-correction-modal__reason-table">
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
                      onFilesChange={files =>
                        setEvidenceFileNames(prev => [
                          ...prev,
                          ...files.map(file => file.name),
                        ])
                      }
                      onRemoveFile={index =>
                        setEvidenceFileNames(prev =>
                          prev.filter((_, currentIndex) => currentIndex !== index)
                        )
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

export type { ProgramAttendanceCorrectionConfirmPayload } from '@/features/program/shared/lib/attendance-correction-types'
