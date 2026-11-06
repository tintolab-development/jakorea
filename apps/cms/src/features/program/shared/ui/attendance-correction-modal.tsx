import { useEffect, useMemo, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import {
  ContentModal,
  CmsButton,
  CmsSelect,
  useCmsAlert,
} from '@/shared/ui'
import { AttendanceCorrectionReasonForm } from '@/features/program/shared/ui/attendance-correction-reason-form'
import { ParagraphTimePicker } from '@/features/template/ui/shared/paragraph-time-picker'
import {
  PROGRAM_ATTENDANCE_CORRECTION_STATUS_OPTIONS,
  type ProgramAttendanceCorrectionConfirmPayload,
  type ProgramAttendanceCorrectionInitialValue,
  parseAttendanceScheduleOwnerId,
  type ProgramAttendanceCorrectionStatus,
  type ProgramAttendanceCorrectionStatusOption,
} from '@/features/program/shared/lib/attendance-correction-types'
import {
  ADMIN_FILE_OWNER,
  ADMIN_FILE_PURPOSE,
  buildAdminFileOwner,
  uploadAdminFileMaybeMock,
} from '@/shared/lib/admin-file-upload'
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
  return null
}

export type ProgramAttendanceCorrectionModalProps = {
  open: boolean
  /** 정정 대상 이름 (참여자·봉사자 등) */
  subjectName: string
  scheduleDateLabel: string
  initialAttendance: ProgramAttendanceCorrectionInitialValue
  /** 모달 설명 문구 역할 명사 — 기본 봉사자, 개인 참여자 상세는 참여자 */
  subjectRoleNoun?: string
  /**
   * 설명 문장 오버라이드. 지정 시 subjectRoleNoun 기본 문장 대신 사용.
   * `\n` 개행, `**텍스트**` 굵게.
   */
  description?: string
  /** 필드 라벨 — 기본 `교육 출결 현황` */
  fieldLabel?: string
  /** 확인 버튼 라벨 — 기본 `출결 정정` */
  confirmLabel?: string
  /** 출결 상태 셀렉트 옵션 — 미지정 시 사유 불참 라벨 기본 */
  statusOptions?: ReadonlyArray<ProgramAttendanceCorrectionStatusOption>
  /** 증빙 ownerId. 프로그램 id 나 1 이 아니다 */
  evidenceScheduleId?: string | number | null
  onCancel: () => void
  onConfirm: (payload: ProgramAttendanceCorrectionConfirmPayload) => void
}

export function ProgramAttendanceCorrectionModal({
  open,
  subjectName,
  scheduleDateLabel,
  initialAttendance,
  subjectRoleNoun = '봉사자',
  description,
  fieldLabel = '교육 출결 현황',
  confirmLabel = '출결 정정',
  statusOptions = PROGRAM_ATTENDANCE_CORRECTION_STATUS_OPTIONS,
  evidenceScheduleId,
  onCancel,
  onConfirm,
}: ProgramAttendanceCorrectionModalProps) {
  const { showAlert } = useCmsAlert()
  const [status, setStatus] = useState<ProgramAttendanceCorrectionStatus>('present')
  const [attendanceTime, setAttendanceTime] = useState<Dayjs | null>(null)
  const [reason, setReason] = useState('')
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
  const [uploadingEvidence, setUploadingEvidence] = useState(false)

  useEffect(() => {
    if (!open) return
    setStatus(toStatus(initialAttendance))
    setAttendanceTime(toInitialTime(initialAttendance))
    setReason('')
    setEvidenceFiles([])
  }, [initialAttendance, open])

  const isTimeEnabled = status === 'present' || status === 'late'
  const showReasonTable = status === 'excused_absence'

  useEffect(() => {
    if (!isTimeEnabled) {
      setAttendanceTime(null)
    }
  }, [isTimeEnabled])

  useEffect(() => {
    if (showReasonTable) return
    setReason('')
    setEvidenceFiles([])
  }, [showReasonTable])

  const evidenceFileNames = evidenceFiles.map(f => f.name)

  const canConfirm = useMemo(() => {
    if (uploadingEvidence) return false
    if (isTimeEnabled && attendanceTime == null) return false
    return true
  }, [attendanceTime, isTimeEnabled, uploadingEvidence])

  return (
    <ContentModal
      open={open}
      onCancel={onCancel}
      title="출결 정정"
      width={600}
      className="program-attendance-correction-modal"
      description={
        description ??
        `**[${subjectName}]** ${subjectRoleNoun}의 **[${scheduleDateLabel}]** 출석 현황을 정정하시겠습니까?`
      }
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

              void (async () => {
                let evidenceFileObjectIds: number[] | undefined
                if (showReasonTable && evidenceFiles.length > 5) {
                  showAlert({
                    title: '안내',
                    content: '증빙 서류는 최대 5개까지 첨부할 수 있습니다.',
                  })
                  return
                }
                if (showReasonTable && evidenceFiles.length > 0) {
                  const scheduleOwnerId = parseAttendanceScheduleOwnerId(evidenceScheduleId)
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
                  status,
                  attendanceTime: attendanceTime ? attendanceTime.format('H:mm') : null,
                  reason: reason.trim(),
                  evidenceFileName: evidenceFiles[0]?.name ?? null,
                  evidenceFileObjectIds,
                })
              })()
            }} >
            {confirmLabel}
          </CmsButton>
        </div>
      }
    >
      <div className="program-attendance-correction-modal__content">
        <div className="program-attendance-correction-modal__field">
          <span className="program-attendance-correction-modal__label">
            {fieldLabel}
            <span className="program-attendance-correction-modal__required" aria-hidden>
              *
            </span>
          </span>
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
              aria-label={fieldLabel}
            />
            <ParagraphTimePicker
              className="program-attendance-correction-modal__time-picker"
              value={attendanceTime}
              onChange={setAttendanceTime}
              disabled={!isTimeEnabled}
              placeholder="HH:mm"
              width="100%"
              inputSize="large"
              zIndex={2600}
              showEndTimeToggle={false}
            />
          </div>
        </div>

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

export type { ProgramAttendanceCorrectionConfirmPayload } from '@/features/program/shared/lib/attendance-correction-types'
