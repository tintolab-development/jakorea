import { useCallback, useEffect, useMemo, useState } from 'react'
import { CmsButton, useCmsAlert } from '@/shared/ui'
import {
  attendanceFullRowsEqual,
  cloneAttendanceVolunteerRows,
  filterVisibleAttendanceVolunteers,
  parseSessionStartTime,
} from './attendance-display'
import {
  buildCorrectedVolunteerRow,
  UjatAttendanceCorrectionModal,
  type UjatAttendanceCorrectionPayload,
} from './attendance-correction-modal'
import { filterAttendanceVolunteersForDisplay } from './use-list'
import { UjatAttendanceTable } from './attendance-table'
import type { UjatAttendanceFilters } from './types'
import type { UjatAttendanceSessionGroup, UjatAttendanceVolunteerRow } from './types'

export function UjatAttendanceSessionGroupPanel({
  session,
  appliedFilters,
  getSessionVolunteers,
  onSave,
}: {
  session: UjatAttendanceSessionGroup
  appliedFilters: UjatAttendanceFilters
  getSessionVolunteers: (sessionId: string) => UjatAttendanceVolunteerRow[]
  onSave: (sessionId: string, volunteers: UjatAttendanceVolunteerRow[]) => void
}) {
  const { showAlert } = useCmsAlert()
  const [correctionModalOpen, setCorrectionModalOpen] = useState(false)
  const [savedRows, setSavedRows] = useState<UjatAttendanceVolunteerRow[]>(() =>
    cloneAttendanceVolunteerRows(getSessionVolunteers(session.id))
  )
  const [workingRows, setWorkingRows] = useState<UjatAttendanceVolunteerRow[]>(() =>
    cloneAttendanceVolunteerRows(getSessionVolunteers(session.id))
  )

  const sessionStartTime = useMemo(() => parseSessionStartTime(session.timeRange), [session.timeRange])

  const correctionVolunteers = useMemo(
    () => filterVisibleAttendanceVolunteers(workingRows),
    [workingRows]
  )

  const displayRows = useMemo(
    () => filterAttendanceVolunteersForDisplay(workingRows, appliedFilters),
    [appliedFilters, workingRows]
  )

  useEffect(() => {
    const rows = cloneAttendanceVolunteerRows(getSessionVolunteers(session.id))
    setSavedRows(rows)
    setWorkingRows(rows)
    setCorrectionModalOpen(false)
  }, [getSessionVolunteers, session.id])

  const hasChanges = useMemo(
    () => !attendanceFullRowsEqual(workingRows, savedRows),
    [savedRows, workingRows]
  )

  const handleSave = useCallback(() => {
    if (!hasChanges) return
    onSave(session.id, workingRows)
    setSavedRows(cloneAttendanceVolunteerRows(workingRows))
    showAlert({ title: '안내', content: '출결 정보가 저장되었습니다.' })
  }, [hasChanges, onSave, session.id, showAlert, workingRows])

  const handleCorrectionConfirm = useCallback(
    (payload: UjatAttendanceCorrectionPayload) => {
      setWorkingRows(prev =>
        prev.map(row =>
          row.id === payload.volunteerId
            ? buildCorrectedVolunteerRow(row, payload, sessionStartTime)
            : row
        )
      )
      setCorrectionModalOpen(false)
    },
    [sessionStartTime]
  )

  const headerText = `${session.dateLabel} ${session.institutionName} | ${session.district} | ${session.timeRange} 총 ${displayRows.length}건`

  return (
    <section className="ujat-attendance-session-group">
      <div className="ujat-attendance-session-group__header">
        <h3 className="ujat-attendance-session-group__title">{headerText}</h3>
        <div className="ujat-attendance-session-group__actions">
          <CmsButton
            type="button"
            variant="secondary"
            size="large"
            width={120}
            onClick={() => setCorrectionModalOpen(true)}
          >
            출결 정정
          </CmsButton>
          <CmsButton
            type="button"
            variant="primary"
            size="large"
            width={100}
            disabled={!hasChanges}
            onClick={handleSave}
          >
            저장
          </CmsButton>
        </div>
      </div>
      <div className="ujat-attendance-session-group__table-wrap">
        <UjatAttendanceTable rows={displayRows} />
      </div>

      <UjatAttendanceCorrectionModal
        open={correctionModalOpen}
        timeRange={session.timeRange}
        volunteers={correctionVolunteers}
        onCancel={() => setCorrectionModalOpen(false)}
        onConfirm={handleCorrectionConfirm}
      />
    </section>
  )
}
