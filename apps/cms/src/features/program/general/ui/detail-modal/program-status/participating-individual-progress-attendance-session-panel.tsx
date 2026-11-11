import { useCallback, useMemo, useState } from 'react'
import { CmsButton, ExcelButton, useCmsAlert } from '@/shared/ui'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import {
  PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_EXCEL_COLUMNS,
  buildProgressAttendanceSessionExcelRows,
  resolveProgressAttendanceSessionExcelFilename,
} from '@/features/program/general/lib/participating-individual-progress-attendance-export'
import {
  cloneProgressAttendanceParticipantRows,
  filterProgressAttendanceParticipantsForDisplay,
  maskProgressAttendanceContact,
  maskProgressAttendanceEmail,
} from '@/features/program/general/lib/participating-individual-progress-attendance-display'
import type {
  ParticipatingIndividualProgressAttendanceFilters,
  ParticipatingIndividualProgressAttendanceParticipantRow,
  ParticipatingIndividualProgressAttendanceSessionGroup,
  ParticipatingIndividualProgressAttendanceStatus,
} from '@/features/program/general/lib/participating-individual-progress-attendance-types'
import { formatMonthDayWithWeekday } from '@/shared/utils/date'
import {
  ATTENDANCE_CORRECTION_NOT_OPEN_ALERT,
  isAttendanceRecordingNotOpenError,
} from '@/features/program/general/lib/attendance-recording-not-open'
import {
  ATTENDANCE_ARRIVAL_TIME_FORMAT_ERROR_MESSAGE,
  isInvalidAttendanceArrivalTimeError,
} from '@/shared/lib/attendance-arrival-time'
import { getApiErrorCode, readApiErrorAlertMessage } from '@/shared/lib/extract-api-error-message'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import { isGlobalApiErrorAlertShown } from '@/shared/lib/show-global-api-error-alert'
import {
  ParticipatingIndividualProgressAttendanceCorrectionModal,
  type ParticipatingIndividualProgressAttendanceCorrectionConfirmPayload,
} from './participating-individual-progress-attendance-correction-modal'
import { ParticipatingIndividualProgressAttendanceTable } from './participating-individual-progress-attendance-table'

function resolveEducationDateLabel(
  session: ParticipatingIndividualProgressAttendanceSessionGroup
): string {
  const source =
    session.headerDateLabel.trim() ||
    session.headerPeriodRangeLabel.split('~')[0]?.trim() ||
    ''
  const formatted = formatMonthDayWithWeekday(source)
  if (formatted !== '-') return formatted
  return source || session.headerTitle
}

function mapCorrectionPayloadToAttendancePatch(
  payload: ParticipatingIndividualProgressAttendanceCorrectionConfirmPayload
): {
  attendanceStatus: ParticipatingIndividualProgressAttendanceStatus
  lateTime?: string
  remark?: string
  evidenceFileObjectIds?: number[]
} {
  if (payload.status === 'late') {
    return { attendanceStatus: 'late', lateTime: payload.lateTime }
  }
  if (payload.status === 'excused_absence') {
    return {
      attendanceStatus: 'excused_absence',
      remark: payload.reason.trim(),
      evidenceFileObjectIds: payload.evidenceFileObjectIds ?? [],
    }
  }
  if (payload.status === 'absence') {
    return { attendanceStatus: 'absent', evidenceFileObjectIds: [] }
  }
  return { attendanceStatus: 'present' }
}

export function ParticipatingIndividualProgressAttendanceSessionPanel({
  session,
  appliedFilters,
  getSessionParticipants,
  onSaveParticipant,
  saving = false,
}: {
  session: ParticipatingIndividualProgressAttendanceSessionGroup
  appliedFilters: ParticipatingIndividualProgressAttendanceFilters
  getSessionParticipants: (
    sessionId: string
  ) => ParticipatingIndividualProgressAttendanceParticipantRow[]
  onSaveParticipant: (
    sessionId: string,
    participantRowId: string,
    patch: {
      attendanceStatus: ParticipatingIndividualProgressAttendanceStatus
      lateTime?: string
      remark?: string
      evidenceFileObjectIds?: number[]
    }
  ) => Promise<void>
  /** 저장 진행 중 — 정정 팝업 「정정」 버튼 로딩 */
  saving?: boolean
}) {
  const { showAlert } = useCmsAlert()
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false)

  const participants = useMemo(() => {
    const rows = cloneProgressAttendanceParticipantRows(getSessionParticipants(session.id))
    return filterProgressAttendanceParticipantsForDisplay(rows, appliedFilters)
  }, [appliedFilters, getSessionParticipants, session.id])

  const participantCorrectionOptions = useMemo(
    () =>
      participants.map(row => ({
        value: row.id,
        label: row.name,
        row,
      })),
    [participants]
  )

  const excelRows = useMemo(
    () =>
      buildProgressAttendanceSessionExcelRows(
        session.headerPrefix,
        participants.map((row, index) => ({
          ...row,
          no: index + 1,
          contact: maskProgressAttendanceContact(row.contact),
          email: maskProgressAttendanceEmail(row.email),
        }))
      ),
    [participants, session.headerPrefix]
  )

  const { exportExcel, isExporting } = useTableExcelExport({
    accessLog: { downloadKind: 'PROGRAM_ATTENDANCE_EXPORT', containedPiiTypes: ['NAME'] },
    columns: PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_EXCEL_COLUMNS,
    data: excelRows,
    filename: resolveProgressAttendanceSessionExcelFilename(session.headerTitle),
  })

  const handleOpenCorrectionModal = useCallback(() => {
    if (!session.attendanceRecordingOpen) {
      showAlert(ATTENDANCE_CORRECTION_NOT_OPEN_ALERT)
      return
    }
    if (participantCorrectionOptions.length === 0) {
      showAlert({
        title: '안내',
        content: '출결 정정할 참여자가 없습니다.',
      })
      return
    }
    setCorrectionModalOpen(true)
  }, [participantCorrectionOptions.length, session.attendanceRecordingOpen, showAlert])

  const handleConfirmCorrection = useCallback(
    async (payload: ParticipatingIndividualProgressAttendanceCorrectionConfirmPayload) => {
      try {
        await onSaveParticipant(
          session.id,
          payload.participantRowId,
          mapCorrectionPayloadToAttendancePatch(payload)
        )
      } catch (error) {
        // 참여자 상세 출결 정정과 같은 오류 안내 순서
        if (isAttendanceRecordingNotOpenError(error)) {
          showAlert(ATTENDANCE_CORRECTION_NOT_OPEN_ALERT)
          return
        }
        if (isGlobalApiErrorAlertShown(error)) return
        if (isInvalidAttendanceArrivalTimeError(error)) {
          showAlert({ title: '안내', content: ATTENDANCE_ARRIVAL_TIME_FORMAT_ERROR_MESSAGE })
          return
        }
        if (getApiErrorCode(error) === 'ATTENDANCE_AFTER_GIVE_UP') {
          showAlert({
            title: '안내',
            content: getGeneralProgramApiErrorMessage(
              error,
              '활동 포기 이후 회차에는 출결을 저장할 수 없습니다.'
            ),
          })
          return
        }
        showAlert({
          title: '안내',
          content: readApiErrorAlertMessage(error, '요청 처리에 실패했습니다.'),
        })
        return
      }
      setCorrectionModalOpen(false)
      // 시안 02-3 — 출결 정정 완료 팝업
      showAlert({
        title: '정정 완료',
        content: '정정되었습니다.',
      })
    },
    [onSaveParticipant, session.id, showAlert]
  )

  // ⑤ 일정형·단일·날짜: 제목에 이미 시간이 들어가므로 옆 표기에서는 시간만 뺀다(값은 유지).
  const headerMetaPeriodLabel =
    session.headerPeriodRangeLabel && !session.headerTitle.includes(session.headerPeriodRangeLabel)
      ? session.headerPeriodRangeLabel
      : ''

  return (
    <section className="school-detail-attendance-session">
      <div className="table-header-actions">
        <div className="table-header-title--wrapper school-detail-attendance-session__title-row">
          <span className="table-title">{session.headerTitle}</span>
          {session.headerScheduleSummary || headerMetaPeriodLabel ? (
            <div className="school-detail-attendance-session__header-meta">
              {session.headerScheduleSummary ? <span>{session.headerScheduleSummary}</span> : null}
              {session.headerScheduleSummary && headerMetaPeriodLabel ? (
                <span className="detail-info-form-inputs-separator" aria-hidden />
              ) : null}
              {headerMetaPeriodLabel ? <span>{headerMetaPeriodLabel}</span> : null}
            </div>
          ) : null}
          <span className="table-description">총 {participants.length}건</span>
        </div>
        <div className="info-section-buttons--wrapper">
          <CmsButton
            type="button"
            variant="secondary"
            size="h40"
            onClick={handleOpenCorrectionModal} >
            출결 정정
          </CmsButton>
          <ExcelButton loading={isExporting} onClick={exportExcel} />
        </div>
      </div>
      <div className="school-detail-attendance-session__table-wrap">
        <ParticipatingIndividualProgressAttendanceTable rows={participants} />
      </div>
      <ParticipatingIndividualProgressAttendanceCorrectionModal
        open={correctionModalOpen}
        educationDateLabel={resolveEducationDateLabel(session)}
        scheduleId={session.id}
        participantOptions={participantCorrectionOptions}
        onCancel={() => setCorrectionModalOpen(false)}
        onConfirm={handleConfirmCorrection}
        confirming={saving}
      />
    </section>
  )
}
