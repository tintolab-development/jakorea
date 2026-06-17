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
import {
  ParticipatingIndividualProgressAttendanceCorrectionModal,
  type ParticipatingIndividualProgressAttendanceCorrectionConfirmPayload,
} from './participating-individual-progress-attendance-correction-modal'
import { ParticipatingIndividualProgressAttendanceTable } from './participating-individual-progress-attendance-table'

function mapCorrectionPayloadToAttendancePatch(
  payload: ParticipatingIndividualProgressAttendanceCorrectionConfirmPayload
): {
  attendanceStatus: ParticipatingIndividualProgressAttendanceStatus
  lateTime?: string
  remark?: string
} {
  if (payload.status === 'late') {
    return { attendanceStatus: 'late', lateTime: '9:05' }
  }
  if (payload.status === 'excused_absence') {
    return { attendanceStatus: 'excused_absence', remark: payload.reason.trim() }
  }
  if (payload.status === 'absence') {
    return { attendanceStatus: 'absent' }
  }
  return { attendanceStatus: 'present' }
}

export function ParticipatingIndividualProgressAttendanceSessionPanel({
  session,
  appliedFilters,
  getSessionParticipants,
  onSaveParticipant,
}: {
  session: ParticipatingIndividualProgressAttendanceSessionGroup
  appliedFilters: ParticipatingIndividualProgressAttendanceFilters
  getSessionParticipants: (sessionId: string) => ParticipatingIndividualProgressAttendanceParticipantRow[]
  onSaveParticipant: (
    sessionId: string,
    participantRowId: string,
    patch: {
      attendanceStatus: ParticipatingIndividualProgressAttendanceStatus
      lateTime?: string
      remark?: string
    }
  ) => void
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
          no: participants.length - index,
          contact: maskProgressAttendanceContact(row.contact),
          email: maskProgressAttendanceEmail(row.email),
        }))
      ),
    [participants, session.headerPrefix]
  )

  const { exportExcel, isExporting } = useTableExcelExport({
    columns: PARTICIPATING_INDIVIDUAL_PROGRESS_ATTENDANCE_EXCEL_COLUMNS,
    data: excelRows,
    filename: resolveProgressAttendanceSessionExcelFilename(session.headerTitle),
  })

  const handleOpenCorrectionModal = useCallback(() => {
    if (participantCorrectionOptions.length === 0) {
      showAlert({
        title: '안내',
        content: '출결 정정할 참여자가 없습니다.',
      })
      return
    }
    setCorrectionModalOpen(true)
  }, [participantCorrectionOptions.length, showAlert])

  const handleConfirmCorrection = useCallback(
    (payload: ParticipatingIndividualProgressAttendanceCorrectionConfirmPayload) => {
      onSaveParticipant(session.id, payload.participantRowId, mapCorrectionPayloadToAttendancePatch(payload))
      setCorrectionModalOpen(false)
      showAlert({
        title: '안내',
        content: '출결이 정정되었습니다.',
      })
    },
    [onSaveParticipant, session.id, showAlert]
  )

  return (
    <section className="school-detail-attendance-session">
      <div className="table-header-actions">
        <div className="table-header-title--wrapper school-detail-attendance-session__title-row">
          <span className="table-title">{session.headerTitle}</span>
          <div className="school-detail-attendance-session__header-meta">
            <span>{session.headerScheduleSummary}</span>
            <span className="detail-info-form-inputs-separator" aria-hidden />
            <span>{session.headerPeriodRangeLabel}</span>
          </div>
          <span className="table-description">총 {participants.length}건</span>
        </div>
        <div className="info-section-buttons--wrapper">
          <CmsButton
            type="button"
            variant="secondary"
            size="large"
            width={120}
            onClick={handleOpenCorrectionModal}
          >
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
        sessionLabel={session.headerTitle}
        participantOptions={participantCorrectionOptions}
        onCancel={() => setCorrectionModalOpen(false)}
        onConfirm={handleConfirmCorrection}
      />
    </section>
  )
}
