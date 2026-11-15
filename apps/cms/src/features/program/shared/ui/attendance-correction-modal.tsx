import { useEffect, useMemo, useState } from 'react'
import dayjs, { type Dayjs } from 'dayjs'
import {
  ContentModal,
  CmsButton,
  CmsSelect,
  useCmsAlert,
} from '@/shared/ui'
import {
  AttendanceCorrectionReasonForm,
  type AttendanceCorrectionReasonFormProps,
} from '@/features/program/shared/ui/attendance-correction-reason-form'
import {
  ABSENCE_EVIDENCE_ACCEPT,
  ABSENCE_EVIDENCE_GUIDE_LINE,
  ABSENCE_EVIDENCE_MAX_FILES,
  ABSENCE_EVIDENCE_MESSAGES,
  ABSENCE_EVIDENCE_REASON_MAX_LENGTH,
  resolveAbsenceEvidenceSaveErrorMessage,
  screenAbsenceEvidenceFiles,
} from '@/features/program/shared/lib/absence-evidence-policy'
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

/**
 * - `default` — 기존 동작(셀렉트 170, 시간 placeholder `HH:mm`, 사유 `*`, 증빙 최대 5개·FileSelectField 기본 accept·용량).
 * - `ujat` — UJAT 참여 봉사자 상세 출결 정정 Figma 4082:109940(16324:632039) + 결석 증빙 계약(2026-11-16):
 *   셀렉트 120, 시간 placeholder 「출석 시간을 선택해 주세요」, 사유 `*` 없음·2000자,
 *   증빙은 `absence-evidence-policy`(10개·파일당 20MiB·합계 100MiB·PDF/JPG/PNG),
 *   저장 실패 시 결석 증빙 오류 코드는 서버 error.message를 팝업 인라인 오류로.
 */
export type ProgramAttendanceCorrectionModalVariant = 'default' | 'ujat'

type AttendanceCorrectionVariantConfig = {
  statusSelectWidth: number
  timePlaceholder: string
  reasonRequiredMark: boolean
  /** true — `absence-evidence-policy` 검증·안내·인라인 저장 오류 사용 */
  usesAbsenceEvidencePolicy: boolean
}

/** `default` 변형 전용 기존 클라이언트 제한(이번 변경 대상 아님) */
const LEGACY_DEFAULT_MAX_EVIDENCE_FILES = 5

const ATTENDANCE_CORRECTION_VARIANT_CONFIG: Record<
  ProgramAttendanceCorrectionModalVariant,
  AttendanceCorrectionVariantConfig
> = {
  default: {
    statusSelectWidth: 170,
    timePlaceholder: 'HH:mm',
    reasonRequiredMark: true,
    usesAbsenceEvidencePolicy: false,
  },
  ujat: {
    statusSelectWidth: 120,
    timePlaceholder: '출석 시간을 선택해 주세요',
    reasonRequiredMark: false,
    usesAbsenceEvidencePolicy: true,
  },
}

const ABSENCE_EVIDENCE_FILE_FIELD_PROPS: AttendanceCorrectionReasonFormProps['evidenceFileFieldProps'] =
  {
    accept: ABSENCE_EVIDENCE_ACCEPT,
    guideLines: [ABSENCE_EVIDENCE_GUIDE_LINE],
    // 용량·개수·형식은 onFilesChange에서 absence-evidence-policy로 한 번에 검사(FileSelectField 기본 15MB 검사 끔)
    maxTotalBytes: 0,
  }

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
  /** 유형별 시안 차이 — 생략 시 `default`(기존 동작) */
  variant?: ProgramAttendanceCorrectionModalVariant
  onCancel: () => void
  /** Promise를 돌려주면 실패 시 결석 증빙 오류 코드를 팝업 인라인 오류로 보여 준다(`ujat`) */
  onConfirm: (payload: ProgramAttendanceCorrectionConfirmPayload) => void | Promise<void>
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
  variant = 'default',
  onCancel,
  onConfirm,
}: ProgramAttendanceCorrectionModalProps) {
  const variantConfig = ATTENDANCE_CORRECTION_VARIANT_CONFIG[variant]
  const usesAbsenceEvidencePolicy = variantConfig.usesAbsenceEvidencePolicy
  const { showAlert } = useCmsAlert()
  const [status, setStatus] = useState<ProgramAttendanceCorrectionStatus>('present')
  const [attendanceTime, setAttendanceTime] = useState<Dayjs | null>(null)
  const [reason, setReason] = useState('')
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([])
  const [uploadingEvidence, setUploadingEvidence] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  /** 저장 실패 — 서버 error.message 그대로(결석 증빙 코드만) */
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setStatus(toStatus(initialAttendance))
    setAttendanceTime(toInitialTime(initialAttendance))
    setReason('')
    setEvidenceFiles([])
    setSaveError(null)
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

  const handleEvidenceFilesChange = (files: File[]) => {
    if (!usesAbsenceEvidencePolicy) {
      setEvidenceFiles(prev => [...prev, ...files])
      return
    }
    // 선택·드롭·붙여넣기 모두 FileSelectField → onFilesChange 하나로 들어온다
    const { accepted, rejectionMessages } = screenAbsenceEvidenceFiles(evidenceFiles, files)
    if (rejectionMessages.length > 0) {
      showAlert({ title: '안내', content: rejectionMessages.join('\n') })
    }
    if (accepted.length > 0) {
      setSaveError(null)
      setEvidenceFiles(prev => [...prev, ...accepted])
    }
  }

  const canConfirm = useMemo(() => {
    if (uploadingEvidence || submitting) return false
    if (isTimeEnabled && attendanceTime == null) return false
    return true
  }, [attendanceTime, isTimeEnabled, submitting, uploadingEvidence])

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
              setSaveError(null)
              if (showReasonTable && reason.trim().length === 0) {
                showAlert({
                  title: '안내',
                  content: '사유를 입력해 주세요.',
                })
                return
              }

              void (async () => {
                // ujat: 출석·지각·결석은 [] (기존 파일 유지로 해석하지 않음), 사유 불참은 업로드 끝난 ID(없으면 [])
                let evidenceFileObjectIds: number[] | undefined = usesAbsenceEvidencePolicy
                  ? []
                  : undefined
                const maxEvidenceFiles = usesAbsenceEvidencePolicy
                  ? ABSENCE_EVIDENCE_MAX_FILES
                  : LEGACY_DEFAULT_MAX_EVIDENCE_FILES
                if (showReasonTable && evidenceFiles.length > maxEvidenceFiles) {
                  showAlert({
                    title: '안내',
                    content: usesAbsenceEvidencePolicy
                      ? ABSENCE_EVIDENCE_MESSAGES.tooMany
                      : `증빙 서류는 최대 ${maxEvidenceFiles}개까지 첨부할 수 있습니다.`,
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
                      // 기본 waitUntilAvailable=true — CLEAN+AVAILABLE 이후에만 ID를 받는다
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

                setSubmitting(true)
                try {
                  await onConfirm({
                    status,
                    attendanceTime: attendanceTime ? attendanceTime.format('H:mm') : null,
                    reason: reason.trim(),
                    evidenceFileName: evidenceFiles[0]?.name ?? null,
                    evidenceFileObjectIds,
                  })
                } catch (error) {
                  // 결석 증빙 코드만 인라인. 그 외 오류는 호출부(mutation onError)가 안내한다.
                  if (usesAbsenceEvidencePolicy) {
                    setSaveError(resolveAbsenceEvidenceSaveErrorMessage(error))
                  }
                } finally {
                  setSubmitting(false)
                }
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
          <div
            className={[
              'program-attendance-correction-modal__status-row',
              variant === 'ujat' ? 'program-attendance-correction-modal__status-row--ujat' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <CmsSelect
              inputSize="large"
              width={variantConfig.statusSelectWidth}
              withAllOption={false}
              value={status}
              options={[...statusOptions]}
              onChange={value => {
                setSaveError(null)
                setStatus((value as ProgramAttendanceCorrectionStatus) ?? 'present')
              }}
              aria-label={fieldLabel}
            />
            <ParagraphTimePicker
              className="program-attendance-correction-modal__time-picker"
              value={attendanceTime}
              onChange={setAttendanceTime}
              disabled={!isTimeEnabled}
              placeholder={variantConfig.timePlaceholder}
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
            onReasonChange={value => {
              setSaveError(null)
              setReason(value)
            }}
            evidenceFileNames={evidenceFileNames}
            onFilesChange={handleEvidenceFilesChange}
            onRemoveFile={index => {
              setSaveError(null)
              setEvidenceFiles(prev => prev.filter((_, currentIndex) => currentIndex !== index))
            }}
            reasonRequiredMark={variantConfig.reasonRequiredMark}
            reasonMaxLength={
              usesAbsenceEvidencePolicy ? ABSENCE_EVIDENCE_REASON_MAX_LENGTH : undefined
            }
            evidenceFileFieldProps={
              usesAbsenceEvidencePolicy ? ABSENCE_EVIDENCE_FILE_FIELD_PROPS : undefined
            }
          />
        ) : null}

        {saveError ? (
          <p className="program-attendance-correction-modal__error" role="alert">
            {saveError}
          </p>
        ) : null}
      </div>
    </ContentModal>
  )
}

export type { ProgramAttendanceCorrectionConfirmPayload } from '@/features/program/shared/lib/attendance-correction-types'
