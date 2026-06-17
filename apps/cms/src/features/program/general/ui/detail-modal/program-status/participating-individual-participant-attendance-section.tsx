import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { FilterTableLayout } from '@/shared/components/filter-table-layout'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { CMS_DATA_TABLE_ROW_DISABLED_CLASS } from '@/shared/constants/table'
import { FEATURE_COMING_SOON_ALERT_MESSAGE } from '@/shared/constants'
import { useCmsAlert } from '@/shared/ui'
import type { ParticipatingIndividualParticipantRow } from '@/data/mock/participating-individual-participants'
import type { Program } from '@/types/domain'
import {
  getParticipatingIndividualParticipantAttendanceBundle,
  sortParticipatingIndividualParticipantAttendanceRows,
  buildParticipatingIndividualParticipantAttendanceSummary,
} from '@/features/program/general/lib/participating-individual-participant-attendance-mock'
import {
  formatParticipatingIndividualParticipantAttendanceShortDateLabel,
} from '@/features/program/general/lib/participating-individual-participant-attendance-display'
import { PARTICIPATING_INDIVIDUAL_PARTICIPANT_ATTENDANCE_EXCEL_COLUMNS } from '@/features/program/general/lib/participating-individual-participant-attendance-export'
import type {
  ParticipatingIndividualParticipantAbsenceReason,
  ParticipatingIndividualParticipantAttendanceRow,
} from '@/features/program/general/lib/participating-individual-participant-attendance-types'
import {
  isParticipatingIndividualParticipantAttendanceRowWithdrawn,
  PARTICIPATING_INDIVIDUAL_PARTICIPANT_ATTENDANCE_STATUS_LABELS,
  PARTICIPATING_INDIVIDUAL_PARTICIPANT_SESSION_PROGRESS_LABELS,
} from '@/features/program/general/lib/participating-individual-participant-attendance-types'
import { ProgramAttendanceAbsenceReasons } from '@/features/program/shared/ui/program-attendance-absence-reasons'
import { ProgramAttendanceRateValue } from '@/features/program/shared/ui/program-attendance-rate-value'
import {
  ProgramAttendanceStatusText,
  type ProgramAttendanceStatusTextKind,
} from '@/features/program/shared/ui/program-attendance-status-text'
import {
  ParticipatingIndividualParticipantAttendanceCorrectionModal,
  type ParticipatingIndividualParticipantAttendanceCorrectionConfirmPayload,
} from './participating-individual-participant-attendance-correction-modal'

export type ParticipatingIndividualParticipantAttendanceSectionHandle = {
  openAttendanceCorrectionModal: () => void
  exportExcel: () => void
}

function toAttendanceStatusTextKind(
  status: ParticipatingIndividualParticipantAttendanceRow['attendanceStatus']
): ProgramAttendanceStatusTextKind {
  if (status === 'pending') return 'pending'
  if (status === 'withdrawn') return 'withdrawn'
  return status
}

function mapCorrectionPayloadToAttendanceStatus(
  payload: ParticipatingIndividualParticipantAttendanceCorrectionConfirmPayload,
  existingRow: ParticipatingIndividualParticipantAttendanceRow
): Pick<ParticipatingIndividualParticipantAttendanceRow, 'attendanceStatus' | 'lateTime' | 'remark'> {
  if (payload.status === 'late') {
    return {
      attendanceStatus: 'late',
      lateTime: existingRow.lateTime ?? '9:00',
      remark: undefined,
    }
  }
  if (payload.status === 'excused_absence') {
    return {
      attendanceStatus: 'excused_absence',
      lateTime: undefined,
      remark: payload.reason.trim(),
    }
  }
  if (payload.status === 'absence') {
    return {
      attendanceStatus: 'pending',
      lateTime: undefined,
      remark: undefined,
    }
  }
  return {
    attendanceStatus: 'present',
    lateTime: undefined,
    remark: undefined,
  }
}

function renderAttendanceStatus(row: ParticipatingIndividualParticipantAttendanceRow) {
  return (
    <ProgramAttendanceStatusText
      kind={toAttendanceStatusTextKind(row.attendanceStatus)}
      label={PARTICIPATING_INDIVIDUAL_PARTICIPANT_ATTENDANCE_STATUS_LABELS[row.attendanceStatus]}
      lateTime={row.lateTime}
    />
  )
}

export interface ParticipatingIndividualParticipantAttendanceSectionProps {
  program: Program
  participant: ParticipatingIndividualParticipantRow
}

export const ParticipatingIndividualParticipantAttendanceSection = forwardRef<
  ParticipatingIndividualParticipantAttendanceSectionHandle,
  ParticipatingIndividualParticipantAttendanceSectionProps
>(function ParticipatingIndividualParticipantAttendanceSection(
  { program, participant },
  ref
) {
  const { showAlert } = useCmsAlert()
  const bundle = useMemo(
    () => getParticipatingIndividualParticipantAttendanceBundle(participant, program),
    [participant, program]
  )

  const [rows, setRows] = useState(() => sortParticipatingIndividualParticipantAttendanceRows(bundle.rows))
  const [absenceReasons, setAbsenceReasons] = useState<ParticipatingIndividualParticipantAbsenceReason[]>(
    () => bundle.absenceReasons
  )
  const [attendanceCorrectionModalOpen, setAttendanceCorrectionModalOpen] = useState(false)

  const correctableScheduleOptions = useMemo(
    () =>
      rows
        .filter(row => !isParticipatingIndividualParticipantAttendanceRowWithdrawn(row))
        .map(row => ({
          value: row.id,
          label: row.scheduleLabel,
          row,
        })),
    [rows]
  )

  useEffect(() => {
    setRows(sortParticipatingIndividualParticipantAttendanceRows(bundle.rows))
    setAbsenceReasons(bundle.absenceReasons)
    setAttendanceCorrectionModalOpen(false)
  }, [bundle.absenceReasons, bundle.rows, participant.id])

  const tableData = useMemo(
    () =>
      rows.map((row, index) => ({
        ...row,
        no: rows.length - index,
      })),
    [rows]
  )

  const summary = useMemo(
    () => buildParticipatingIndividualParticipantAttendanceSummary(rows, participant, program),
    [participant, program, rows]
  )

  const { exportExcel } = useTableExcelExport({
    columns: PARTICIPATING_INDIVIDUAL_PARTICIPANT_ATTENDANCE_EXCEL_COLUMNS,
    data: tableData,
    filename: `참여자_출석내역_${participant.applicantName}`,
  })

  const handleOpenAttendanceCorrectionModal = useCallback(() => {
    if (correctableScheduleOptions.length === 0) {
      showAlert({
        title: '안내',
        content: '출결 정정할 수 있는 교육 일정이 없습니다.',
      })
      return
    }

    setAttendanceCorrectionModalOpen(true)
  }, [correctableScheduleOptions.length, showAlert])

  useImperativeHandle(
    ref,
    () => ({
      openAttendanceCorrectionModal: handleOpenAttendanceCorrectionModal,
      exportExcel,
    }),
    [exportExcel, handleOpenAttendanceCorrectionModal]
  )

  const handleAttendanceCorrectionConfirm = useCallback(
    (payload: ParticipatingIndividualParticipantAttendanceCorrectionConfirmPayload) => {
      const targetRow = rows.find(row => row.id === payload.scheduleRowId)
      if (!targetRow) return

      const patch = mapCorrectionPayloadToAttendanceStatus(payload, targetRow)
      setRows(prev =>
        sortParticipatingIndividualParticipantAttendanceRows(
          prev.map(row => (row.id === targetRow.id ? { ...row, ...patch } : row))
        )
      )

      setAbsenceReasons(prev => {
        const nextWithoutCurrent = prev.filter(
          item =>
            item.scheduleRowId !== targetRow.id && item.id !== `abs-${targetRow.id}`
        )

        if (patch.attendanceStatus !== 'excused_absence' || !patch.remark?.trim()) {
          return nextWithoutCurrent
        }

        return [
          ...nextWithoutCurrent,
          {
            id: `abs-${targetRow.id}`,
            scheduleRowId: targetRow.id,
            dateLabel: formatParticipatingIndividualParticipantAttendanceShortDateLabel(
              targetRow.scheduleLabel
            ),
            reason: patch.remark.trim(),
            fileName: payload.evidenceFileName,
          },
        ]
      })

      setAttendanceCorrectionModalOpen(false)
      showAlert({
        title: '안내',
        content: '출결이 정정되었습니다.',
      })
    },
    [rows, showAlert]
  )

  const showComingSoon = useCallback(() => {
    showAlert({ title: '안내', content: FEATURE_COMING_SOON_ALERT_MESSAGE })
  }, [showAlert])

  const columns: ColumnsType<
    ParticipatingIndividualParticipantAttendanceRow & { no: number }
  > = useMemo(
    () => [
      {
        title: 'No.',
        dataIndex: 'no',
        key: 'no',
        width: 64,
        align: 'center',
      },
      {
        title: '교육 진행 일정',
        dataIndex: 'scheduleLabel',
        key: 'scheduleLabel',
        align: 'center',
      },
      {
        title: '출결 현황',
        key: 'attendanceStatus',
        width: 140,
        align: 'center',
        render: (_value, record) => renderAttendanceStatus(record),
      },
      {
        title: '교육 진행 현황',
        dataIndex: 'educationProgress',
        key: 'educationProgress',
        width: 120,
        align: 'center',
        render: (value: ParticipatingIndividualParticipantAttendanceRow['educationProgress']) =>
          PARTICIPATING_INDIVIDUAL_PARTICIPANT_SESSION_PROGRESS_LABELS[value],
      },
      {
        title: '비고',
        key: 'remark',
        width: 220,
        align: 'center',
        render: (_value, record) => record.remark?.trim() || '-',
      },
    ],
    []
  )

  return (
    <div className="program-attendance-detail">
      <FilterTableLayout
        bordered={false}
        showFilter={false}
        fields={[]}
        filters={{}}
        onFilterChange={() => {}}
        onSearch={() => {}}
        title="출석 내역"
        description={`${rows.length}건`}
        hideExcelDownload
      >
        <Table<ParticipatingIndividualParticipantAttendanceRow & { no: number }>
          rowKey="id"
          className="cms-data-table"
          columns={columns}
          dataSource={tableData}
          pagination={false}
          tableLayout="fixed"
          scroll={{ x: 960 }}
          onRow={record => ({
            className: isParticipatingIndividualParticipantAttendanceRowWithdrawn(record)
              ? CMS_DATA_TABLE_ROW_DISABLED_CLASS
              : undefined,
          })}
        />
      </FilterTableLayout>

      <section className="program-detail-fullpage-modal__info-tab-block">
        <h3 className="program-detail-info-tab__section-title">출결 현황</h3>
        <div className="program-detail-info-tab__table-wrapper program-detail-info-tab__table-wrapper--top">
          <table className="program-detail-info-tab__table program-detail-info-tab__table--basic">
            <colgroup>
              <col style={{ width: '200px' }} />
              <col />
              <col style={{ width: '200px' }} />
              <col />
            </colgroup>
            <tbody>
              <tr>
                <th scope="row">수료 여부</th>
                <td>{summary.completionStatusLabel}</td>
                <th scope="row">지각 횟수</th>
                <td>{summary.lateCountLabel}</td>
              </tr>
              <tr>
                <th scope="row">출석률</th>
                <td colSpan={3}>
                  <ProgramAttendanceRateValue countLabel={summary.attendanceRateCountLabel} />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <ProgramAttendanceAbsenceReasons
        reasons={absenceReasons}
        onFileDownload={showComingSoon}
      />

      <ParticipatingIndividualParticipantAttendanceCorrectionModal
        open={attendanceCorrectionModalOpen}
        scheduleOptions={correctableScheduleOptions}
        onCancel={() => setAttendanceCorrectionModalOpen(false)}
        onConfirm={handleAttendanceCorrectionConfirm}
      />
    </div>
  )
})
