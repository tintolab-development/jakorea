import { useEffect, useMemo, useRef, useState } from 'react'
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
import type { ProgramAbsenceReasonItem } from '@/features/program/general/api/absence-reasons'
import { resolveAttendanceCorrectionAutoReason } from '@/features/program/general/lib/attendance-correction-submitted-reason'
import type { ParticipatingIndividualParticipantAttendanceRow } from '@/features/program/general/lib/participating-individual-participant-attendance-types'
import './participating-individual-participant-attendance-correction-modal.css'

const TIME_PICKER_Z_INDEX = 2600

function parseLateTime(value: string | undefined): Dayjs | null {
  const match = value?.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)
  if (!match) return null
  return dayjs().hour(Number(match[1])).minute(Number(match[2])).second(0).millisecond(0)
}

export type ParticipatingIndividualParticipantAttendanceCorrectionScheduleOption = {
  value: string
  label: string
  row: ParticipatingIndividualParticipantAttendanceRow
}

export type ParticipatingIndividualParticipantAttendanceCorrectionConfirmPayload = {
  scheduleRowId: string
  status: ProgramAttendanceCorrectionStatus
  lateTime?: string
  reason: string
  evidenceFileName: string | null
  evidenceFileObjectIds?: number[]
  evidenceOriginalFileNames?: string[]
}

export type ParticipatingIndividualParticipantAttendanceCorrectionModalProps = {
  open: boolean
  participantName: string
  programId?: string | number | null
  participantId?: string | number | null
  submittedAbsenceReasons?: readonly ProgramAbsenceReasonItem[] | null
  scheduleOptions: ReadonlyArray<ParticipatingIndividualParticipantAttendanceCorrectionScheduleOption>
  onCancel: () => void
  onConfirm: (payload: ParticipatingIndividualParticipantAttendanceCorrectionConfirmPayload) => void
}

export function ParticipatingIndividualParticipantAttendanceCorrectionModal({
  open,
  participantName,
  programId,
  participantId,
  submittedAbsenceReasons,
  scheduleOptions,
  onCancel,
  onConfirm,
}: ParticipatingIndividualParticipantAttendanceCorrectionModalProps) {
  const { showAlert } = useCmsAlert()
  const [scheduleRowId, setScheduleRowId] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<ProgramAttendanceCorrectionStatus | undefined>(undefined)
  const [lateTime, setLateTime] = useState<Dayjs | null>(null)
  const [reason, setReason] = useState('')
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
  const [uploadingEvidence, setUploadingEvidence] = useState(false)
  const appliedReasonSeedKeyRef = useRef<string | null>(null)
  const lastSeededReasonRef = useRef('')

  const selectedOption = useMemo(
    () => scheduleOptions.find(option => option.value === scheduleRowId) ?? null,
    [scheduleOptions, scheduleRowId]
  )

  useEffect(() => {
    if (!open) return
    setScheduleRowId(undefined)
    setStatus('present')
    setLateTime(null)
    setReason('')
    setEvidenceFiles([])
    appliedReasonSeedKeyRef.current = null
    lastSeededReasonRef.current = ''
  }, [open, scheduleOptions])

  const showLateTimePicker = status === 'late'
  const showReasonTable = status === 'excused_absence'

  const autoReason = useMemo(
    () =>
      resolveAttendanceCorrectionAutoReason({
        items: submittedAbsenceReasons,
        programId,
        participantId,
        scheduleId: selectedOption?.row.scheduleId,
        confirmedExcusedAbsence: selectedOption?.row.attendanceStatus === 'excused_absence',
        confirmedReason: selectedOption?.row.remark,
      }),
    [
      participantId,
      programId,
      selectedOption?.row.attendanceStatus,
      selectedOption?.row.remark,
      selectedOption?.row.scheduleId,
      submittedAbsenceReasons,
    ]
  )

  useEffect(() => {
    if (!showLateTimePicker) {
      setLateTime(null)
      return
    }
    setLateTime(parseLateTime(selectedOption?.row.lateTime) ?? dayjs().hour(9).minute(0).second(0))
  }, [showLateTimePicker, selectedOption?.row.lateTime])

  useEffect(() => {
    if (!showReasonTable) {
      setReason('')
      setEvidenceFiles([])
      appliedReasonSeedKeyRef.current = null
      lastSeededReasonRef.current = ''
      return
    }
    const seedKey = `${scheduleRowId ?? ''}::excused_absence`
    if (appliedReasonSeedKeyRef.current !== seedKey) {
      appliedReasonSeedKeyRef.current = seedKey
      lastSeededReasonRef.current = autoReason
      setReason(autoReason)
      setEvidenceFiles([])
      return
    }
    if (reason === lastSeededReasonRef.current && reason !== autoReason) {
      lastSeededReasonRef.current = autoReason
      setReason(autoReason)
    }
  }, [autoReason, reason, scheduleRowId, showReasonTable])

  const evidenceFileNames = evidenceFiles.map(file => file.name)

  const canConfirm = Boolean(
    scheduleRowId &&
      selectedOption &&
      status &&
      !uploadingEvidence &&
      (status !== 'late' || lateTime != null)
  )
  const displayName = participantName.trim() || '참여자'

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="출결 정정"
      width={600}
      className="participating-individual-attendance-correction-modal"
      description={`교육 일정을 선택 후 **[${displayName}]** 님의 출결 상태를 정정해 주세요.`}
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
              if (!scheduleRowId || !selectedOption || !status) return
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
                  const scheduleOwnerId = parseAttendanceScheduleOwnerId(
                    selectedOption.row.scheduleId
                  )
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

                onConfirm({
                  scheduleRowId,
                  status,
                  lateTime: status === 'late' && lateTime != null ? lateTime.format('H:mm') : undefined,
                  reason: reason.trim(),
                  evidenceFileName: evidenceFiles[0]?.name ?? null,
                  evidenceFileObjectIds,
                  evidenceOriginalFileNames: evidenceFiles.map(file => file.name),
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
              placeholder="교육 일정을 선택해 주세요"
              value={scheduleRowId}
              options={scheduleOptions.map(option => ({
                value: option.value,
                label: option.label,
              }))}
              onChange={value => setScheduleRowId(value == null || value === '' ? undefined : String(value))}
              aria-label="교육 일정"
            />
            <CmsSelect
              inputSize="large"
              width={170}
              withAllOption={false}
              value={status ?? 'present'}
              options={[...PROGRAM_ATTENDANCE_CORRECTION_STATUS_OPTIONS]}
              onChange={value =>
                setStatus(parseProgramAttendanceCorrectionStatus(value) ?? 'present')
              }
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
