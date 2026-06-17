import { useEffect, useMemo, useState } from 'react'
import { ContentModal, CmsButton, CmsInput, CmsSelect, FileSelectField, useCmsAlert } from '@/shared/ui'
import {
  PROGRAM_ATTENDANCE_CORRECTION_STATUS_OPTIONS,
  type ProgramAttendanceCorrectionStatus,
} from '@/features/program/shared/lib/attendance-correction-types'
import type { ParticipatingIndividualParticipantAttendanceRow } from '@/features/program/general/lib/participating-individual-participant-attendance-types'
import './participating-individual-participant-attendance-correction-modal.css'

export type ParticipatingIndividualParticipantAttendanceCorrectionScheduleOption = {
  value: string
  label: string
  row: ParticipatingIndividualParticipantAttendanceRow
}

export type ParticipatingIndividualParticipantAttendanceCorrectionConfirmPayload = {
  scheduleRowId: string
  status: ProgramAttendanceCorrectionStatus
  reason: string
  evidenceFileName: string | null
}

function toCorrectionStatus(
  row: ParticipatingIndividualParticipantAttendanceRow
): ProgramAttendanceCorrectionStatus {
  if (row.attendanceStatus === 'late') return 'late'
  if (row.attendanceStatus === 'excused_absence') return 'excused_absence'
  if (row.attendanceStatus === 'present') return 'present'
  return 'present'
}

export type ParticipatingIndividualParticipantAttendanceCorrectionModalProps = {
  open: boolean
  scheduleOptions: ReadonlyArray<ParticipatingIndividualParticipantAttendanceCorrectionScheduleOption>
  onCancel: () => void
  onConfirm: (payload: ParticipatingIndividualParticipantAttendanceCorrectionConfirmPayload) => void
}

export function ParticipatingIndividualParticipantAttendanceCorrectionModal({
  open,
  scheduleOptions,
  onCancel,
  onConfirm,
}: ParticipatingIndividualParticipantAttendanceCorrectionModalProps) {
  const { showAlert } = useCmsAlert()
  const [scheduleRowId, setScheduleRowId] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<ProgramAttendanceCorrectionStatus>('present')
  const [reason, setReason] = useState('')
  const [evidenceFileNames, setEvidenceFileNames] = useState<string[]>([])

  const selectedOption = useMemo(
    () => scheduleOptions.find(option => option.value === scheduleRowId) ?? null,
    [scheduleOptions, scheduleRowId]
  )

  useEffect(() => {
    if (!open) return
    setScheduleRowId(undefined)
    setStatus('present')
    setReason('')
    setEvidenceFileNames([])
  }, [open, scheduleOptions])

  useEffect(() => {
    if (!selectedOption) return
    setStatus(toCorrectionStatus(selectedOption.row))
    setReason(selectedOption.row.remark?.trim() ?? '')
    setEvidenceFileNames([])
  }, [selectedOption])

  const showReasonTable = status === 'excused_absence'

  useEffect(() => {
    if (showReasonTable) return
    setReason('')
    setEvidenceFileNames([])
  }, [showReasonTable])

  const canConfirm = Boolean(scheduleRowId && selectedOption)

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="출결 정정"
      width={600}
      className="participating-individual-attendance-correction-modal"
      footer={
        <div className="participating-individual-attendance-correction-modal__footer">
          <CmsButton variant="secondary" size="large" type="button" onClick={onCancel}>
            취소
          </CmsButton>
          <CmsButton
            variant="primary"
            size="large"
            type="button"
            disabled={!canConfirm}
            onClick={() => {
              if (!scheduleRowId || !selectedOption) return
              if (status === 'excused_absence' && reason.trim().length === 0) {
                showAlert({
                  title: '안내',
                  content: '사유를 입력해 주세요.',
                })
                return
              }

              onConfirm({
                scheduleRowId,
                status,
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
      <div className="participating-individual-attendance-correction-modal__content">
        <div className="participating-individual-attendance-correction-modal__field">
          <span className="participating-individual-attendance-correction-modal__label">출결 정정</span>
          <div className="participating-individual-attendance-correction-modal__select-row">
            <CmsSelect
              inputSize="large"
              width="100%"
              withAllOption={false}
              placeholder="정정할 일정을 선택해 주세요"
              value={scheduleRowId}
              options={scheduleOptions.map(option => ({
                value: option.value,
                label: option.label,
              }))}
              onChange={value => setScheduleRowId(value == null ? undefined : String(value))}
              aria-label="정정할 일정"
            />
            <CmsSelect
              inputSize="large"
              width={170}
              withAllOption={false}
              value={status}
              options={[...PROGRAM_ATTENDANCE_CORRECTION_STATUS_OPTIONS]}
              onChange={value => setStatus((value as ProgramAttendanceCorrectionStatus) ?? 'present')}
              aria-label="출결 현황"
              disabled={!selectedOption}
            />
          </div>
        </div>

        {showReasonTable ? (
          <div className="participating-individual-attendance-correction-modal__reason-table-wrap">
            <table className="participating-individual-attendance-correction-modal__reason-table">
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
                        setEvidenceFileNames(files.slice(0, 1).map(file => file.name))
                      }
                      onRemoveFile={index =>
                        setEvidenceFileNames(prev =>
                          prev.filter((_, currentIndex) => currentIndex !== index)
                        )
                      }
                      buttonLabel="파일 추가"
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
