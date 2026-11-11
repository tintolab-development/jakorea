import { useEffect, useMemo, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import { ContentModal, CmsButton, CmsSelect, useCmsAlert } from '@/shared/ui'
import { AttendanceCorrectionReasonForm } from '@/features/program/shared/ui/attendance-correction-reason-form'
import { ParagraphTimePicker } from '@/features/template/ui/shared/paragraph-time-picker'
import {
  PROGRAM_ATTENDANCE_CORRECTION_STATUS_OPTIONS,
  parseAttendanceScheduleOwnerId,
  parseProgramAttendanceCorrectionStatus,
  type ProgramAttendanceCorrectionStatus,
} from '@/features/program/shared/lib/attendance-correction-types'
import {
  ADMIN_FILE_OWNER,
  ADMIN_FILE_PURPOSE,
  buildAdminFileOwner,
  uploadAdminFileMaybeMock,
} from '@/shared/lib/admin-file-upload'
import type { ParticipatingIndividualProgressAttendanceParticipantRow } from '@/features/program/general/lib/participating-individual-progress-attendance-types'
import './participating-individual-participant-attendance-correction-modal.css'

const TIME_PICKER_Z_INDEX = 2600

/** 참여자 상세 출결 정정 팝업과 동일 — 「H:mm」 문자열을 시간 선택 초기값으로 */
function parseLateTime(value: string | undefined): Dayjs | null {
  const match = value?.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (!match) return null
  return dayjs().hour(Number(match[1])).minute(Number(match[2])).second(0).millisecond(0)
}

export type ParticipatingIndividualProgressAttendanceCorrectionParticipantOption = {
  value: string
  label: string
  row: ParticipatingIndividualProgressAttendanceParticipantRow
}

export type ParticipatingIndividualProgressAttendanceCorrectionConfirmPayload = {
  participantRowId: string
  status: ProgramAttendanceCorrectionStatus
  /** 지각일 때만 — 「H:mm」 */
  lateTime?: string
  reason: string
  evidenceFileName: string | null
  evidenceFileObjectIds?: number[]
}

export type ParticipatingIndividualProgressAttendanceCorrectionModalProps = {
  open: boolean
  educationDateLabel: string
  /** program-schedules 숫자 PK. 증빙 ownerId */
  scheduleId: string
  participantOptions: ReadonlyArray<ParticipatingIndividualProgressAttendanceCorrectionParticipantOption>
  onCancel: () => void
  /** 저장 완료(성공·실패)까지 기다릴 수 있도록 Promise 반환 허용 */
  onConfirm: (
    payload: ParticipatingIndividualProgressAttendanceCorrectionConfirmPayload
  ) => void | Promise<void>
  /** 저장 중 — 「정정」 버튼 로딩·중복 클릭 방지 */
  confirming?: boolean
}

export function ParticipatingIndividualProgressAttendanceCorrectionModal({
  open,
  educationDateLabel,
  scheduleId,
  participantOptions,
  onCancel,
  onConfirm,
  confirming = false,
}: ParticipatingIndividualProgressAttendanceCorrectionModalProps) {
  const { showAlert } = useCmsAlert()
  const [participantRowId, setParticipantRowId] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<ProgramAttendanceCorrectionStatus | undefined>(undefined)
  const [lateTime, setLateTime] = useState<Dayjs | null>(null)
  const [reason, setReason] = useState('')
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
  const [uploadingEvidence, setUploadingEvidence] = useState(false)

  const selectedOption = useMemo(
    () => participantOptions.find(option => option.value === participantRowId) ?? null,
    [participantOptions, participantRowId]
  )

  useEffect(() => {
    if (!open) return
    setParticipantRowId(undefined)
    setStatus(undefined)
    setLateTime(null)
    setReason('')
    setEvidenceFiles([])
  }, [open, participantOptions, educationDateLabel])

  const showLateTimePicker = status === 'late'
  const showReasonTable = status === 'excused_absence'

  useEffect(() => {
    if (!showLateTimePicker) {
      setLateTime(null)
      return
    }
    setLateTime(parseLateTime(selectedOption?.row.lateTime) ?? dayjs().hour(9).minute(0).second(0))
  }, [showLateTimePicker, selectedOption?.row.lateTime])

  useEffect(() => {
    if (showReasonTable) return
    setReason('')
    setEvidenceFiles([])
  }, [showReasonTable])

  const evidenceFileNames = evidenceFiles.map(file => file.name)

  const canConfirm = Boolean(
    participantRowId &&
      selectedOption &&
      status &&
      !uploadingEvidence &&
      !confirming &&
      (status !== 'late' || lateTime != null)
  )
  const displayDateLabel = educationDateLabel.trim() || '교육'

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="출결 정정"
      width={600}
      className="participating-individual-attendance-correction-modal"
      description={`참여자를 선택 후 **${displayDateLabel}** 교육의 출결 상태를 정정해 주세요.`}
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
            loading={confirming || uploadingEvidence}
            onClick={() => {
              if (!participantRowId || !selectedOption || !status) return
              if (status === 'late' && lateTime == null) {
                showAlert({
                  title: '안내',
                  content: '지각 시간을 선택해 주세요.',
                })
                return
              }
              if (status === 'excused_absence' && reason.trim().length === 0) {
                showAlert({
                  title: '안내',
                  content: '사유를 입력해 주세요.',
                })
                return
              }

              void (async () => {
                let evidenceFileObjectIds: number[] | undefined
                if (status === 'excused_absence' && evidenceFiles.length > 5) {
                  showAlert({
                    title: '안내',
                    content: '증빙 서류는 최대 5개까지 첨부할 수 있습니다.',
                  })
                  return
                }
                if (status === 'excused_absence' && evidenceFiles.length > 0) {
                  const scheduleOwnerId = parseAttendanceScheduleOwnerId(scheduleId)
                  if (scheduleOwnerId == null) {
                    showAlert({
                      title: '안내',
                      content: '일정 번호가 없어 증빙 서류를 첨부할 수 없습니다.',
                    })
                    return
                  }
                  setUploadingEvidence(true)
                  try {
                    const owner = buildAdminFileOwner(
                      ADMIN_FILE_OWNER.ATTENDANCE,
                      scheduleOwnerId,
                      ADMIN_FILE_PURPOSE.ABSENCE_EVIDENCE
                    )
                    evidenceFileObjectIds = []
                    for (const file of evidenceFiles) {
                      const uploaded = await uploadAdminFileMaybeMock({ file, owner })
                      evidenceFileObjectIds.push(uploaded.fileObjectId)
                    }
                  } catch {
                    showAlert({
                      title: '안내',
                      content: '증빙 서류 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.',
                    })
                    return
                  } finally {
                    setUploadingEvidence(false)
                  }
                }

                await onConfirm({
                  participantRowId,
                  status,
                  lateTime: status === 'late' && lateTime != null ? lateTime.format('H:mm') : undefined,
                  reason: reason.trim(),
                  evidenceFileName: evidenceFiles[0]?.name ?? null,
                  evidenceFileObjectIds,
                })
              })()
            }} >
            정정
          </CmsButton>
        </div>
      }
    >
      <div className="participating-individual-attendance-correction-modal__content">
        <div className="participating-individual-attendance-correction-modal__field">
          <span className="participating-individual-attendance-correction-modal__label">
            출결 정정{' '}
            <span
              className="participating-individual-attendance-correction-modal__required"
              aria-hidden
            >
              *
            </span>
          </span>
          <div className="participating-individual-attendance-correction-modal__select-row">
            <CmsSelect
              inputSize="large"
              width="100%"
              withAllOption={false}
              placeholder="참여자를 선택해 주세요"
              value={participantRowId}
              options={participantOptions.map(option => ({
                value: option.value,
                label: option.label,
              }))}
              onChange={value =>
                setParticipantRowId(value == null || value === '' ? undefined : String(value))
              }
              aria-label="참여자"
            />
            <CmsSelect
              inputSize="large"
              width={170}
              value={status ?? ''}
              options={[...PROGRAM_ATTENDANCE_CORRECTION_STATUS_OPTIONS]}
              onChange={value => setStatus(parseProgramAttendanceCorrectionStatus(value))}
              aria-label="출결 현황"
            />
          </div>
        </div>

        {showLateTimePicker ? (
          <div className="participating-individual-attendance-correction-modal__late-time">
            <ParagraphTimePicker
              value={lateTime}
              onChange={setLateTime}
              placeholder="지각 시간을 선택해 주세요"
              width="100%"
              inputSize="large"
              zIndex={TIME_PICKER_Z_INDEX}
              showEndTimeToggle={false}
            />
          </div>
        ) : null}

        {showReasonTable ? (
          <AttendanceCorrectionReasonForm
            reason={reason}
            onReasonChange={setReason}
            evidenceFileNames={evidenceFileNames}
            onFilesChange={files => setEvidenceFiles(prev => [...prev, ...files])}
            onRemoveFile={index =>
              setEvidenceFiles(prev => prev.filter((_, currentIndex) => currentIndex !== index))
            }
          />
        ) : null}
      </div>
    </ContentModal>
  )
}
