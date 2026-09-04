/**
 * 참여 봉사자 상세 — 봉사 배정 현황 탭
 */

import { useCallback, useEffect, useMemo, useState, type Key } from 'react'
import { Table, Select } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Program } from '@/types/domain'
import type { ParticipatingVolunteerRow } from '@/data/mock/participating-volunteers'
import { MOCK_PARTICIPATING_VOLUNTEERS } from '@/data/mock/participating-volunteers'
import type { ParticipatingSchoolRow } from '@/data/mock/participating-schools'
import { MOCK_PARTICIPATING_SCHOOLS } from '@/data/mock/participating-schools'
import {
  VOLUNTEER_ASSIGN_SELECT_SCHOOL_ALERT_MESSAGE,
  VOLUNTEER_ASSIGN_UNASSIGN_SELECT_SCHOOL_ALERT_MESSAGE,
} from '@/shared/constants/messages'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { CmsButton, ExcelButton, useCmsAlert } from '@/shared/ui'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { ContentModal } from '@/shared/ui/content-modal'
import { renderProgramDetailPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
import { PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH } from '@/features/program/general/lib/participating-institutions-table'
import {
  buildInitialVolunteerAssignedRows,
  buildVolunteerWaitingInstitutionRows,
  renumberVolunteerAssignedRows,
  renumberVolunteerWaitingRows,
  schoolRowToVolunteerAssignedRow,
  type VolunteerAssignedInstitutionRow,
  type VolunteerWaitingInstitutionRow,
  type VolunteerWaitingAssignmentStatus,
} from '@/features/program/general/lib/participating-volunteer-institution-assignment-mock'
import { WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS } from '@/features/program/general/lib/waiting-instructor-assignment'
import { ParticipatingVolunteerUnassignConfirmModal } from './participating-volunteer-unassign-confirm-modal'
import { ParticipatingVolunteerUnassignCompleteModal } from './participating-volunteer-unassign-complete-modal'
import './instructor-assignment-status-text.css'
import './participating-volunteer-assignment-section.css'

function renderVolunteerScheduleLines(lines: string[]) {
  if (lines.length === 0) return <>-</>
  const total = lines.length
  const showCount = total <= 3 ? total : 2
  const displayLines = lines.slice(0, showCount)
  const restCount = total - showCount
  return (
    <div className="participating-institutions-section__sessions-cell">
      {displayLines.map((line, index) => (
        <div key={`${line}-${index}`} className="participating-institutions-section__session-line">
          {line}
        </div>
      ))}
      {restCount > 0 ? (
        <div className="participating-institutions-section__session-more">
          외 {restCount}개의 봉사 일정
        </div>
      ) : null}
    </div>
  )
}

function renderHopeScheduleLine(line: string) {
  return (
    <div className="participating-institutions-section__sessions-cell">
      <div className="participating-institutions-section__session-line">
        {renderProgramDetailPipeSeparated(line)}
      </div>
    </div>
  )
}

export interface ParticipatingVolunteerAssignmentSectionProps {
  program: Program
  volunteer: ParticipatingVolunteerRow
  schoolRows?: ParticipatingSchoolRow[]
  volunteerList?: ParticipatingVolunteerRow[]
}

export function ParticipatingVolunteerAssignmentSection({
  program,
  volunteer,
  schoolRows = MOCK_PARTICIPATING_SCHOOLS,
  volunteerList = MOCK_PARTICIPATING_VOLUNTEERS,
}: ParticipatingVolunteerAssignmentSectionProps) {
  const { showAlert } = useCmsAlert()
  const [assignedInstitutions, setAssignedInstitutions] = useState<VolunteerAssignedInstitutionRow[]>(
    []
  )
  const [waitingInstitutions, setWaitingInstitutions] = useState<VolunteerWaitingInstitutionRow[]>(
    []
  )
  const [selectedAssignedKeys, setSelectedAssignedKeys] = useState<Key[]>([])
  const [selectedWaitingKeys, setSelectedWaitingKeys] = useState<Key[]>([])
  const [unassignConfirmOpen, setUnassignConfirmOpen] = useState(false)
  const [unassignCompleteModal, setUnassignCompleteModal] = useState<{
    volunteerNames: string[]
    targetNames: string[]
    reason: string
  } | null>(null)
  const [selectAssignConfirmOpen, setSelectAssignConfirmOpen] = useState(false)
  const [addAssignModalOpen, setAddAssignModalOpen] = useState(false)
  const [addAssignWaitingRowId, setAddAssignWaitingRowId] = useState<string | null>(null)

  useEffect(() => {
    const assigned = buildInitialVolunteerAssignedRows(volunteer, schoolRows, program)
    setAssignedInstitutions(assigned)
    setWaitingInstitutions(
      buildVolunteerWaitingInstitutionRows(
        volunteer,
        schoolRows,
        volunteerList,
        new Set(assigned.map(r => r.id)),
        program
      )
    )
    setSelectedAssignedKeys([])
    setSelectedWaitingKeys([])
  }, [volunteer.id, schoolRows, volunteerList, program])

  const assignedColumns: ColumnsType<VolunteerAssignedInstitutionRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      { title: '기관명', dataIndex: 'schoolName', key: 'schoolName', width: 140 },
      {
        title: '담당 학년',
        dataIndex: 'educationGrade',
        key: 'educationGrade',
        width: 96,
        align: 'center',
      },
      { title: '기관 소재지', dataIndex: 'region', key: 'region', width: 200 },
      {
        title: '자택과의 거리',
        dataIndex: 'distanceFromHome',
        key: 'distanceFromHome',
        width: 110,
        align: 'center',
      },
      {
        title: '담당 봉사 진행 일정',
        key: 'volunteerScheduleLines',
        width: PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH,
        minWidth: PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH,
        className: 'participating-institutions-section__th-sessions',
        onHeaderCell: () => ({
          className: 'participating-institutions-section__th-sessions',
        }),
        onCell: () => ({ className: 'participating-institutions-section__td-sessions' }),
        render: (_: unknown, record) => renderVolunteerScheduleLines(record.volunteerScheduleLines),
      },
    ],
    []
  )

  const waitingColumns: ColumnsType<VolunteerWaitingInstitutionRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      { title: '기관명', dataIndex: 'schoolName', key: 'schoolName', width: 140 },
      {
        title: '희망 학년',
        dataIndex: 'desiredGrade',
        key: 'desiredGrade',
        width: 96,
        align: 'center',
      },
      { title: '기관 소재지', dataIndex: 'region', key: 'region', width: 200 },
      {
        title: '자택과의 거리',
        dataIndex: 'distanceFromHome',
        key: 'distanceFromHome',
        width: 110,
        align: 'center',
      },
      {
        title: '봉사 진행 희망 일정',
        key: 'hopeScheduleLine',
        width: PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH,
        minWidth: PARTICIPATING_INSTITUTIONS_SESSIONS_COLUMN_WIDTH,
        className: 'participating-institutions-section__th-sessions',
        onHeaderCell: () => ({
          className: 'participating-institutions-section__th-sessions',
        }),
        onCell: () => ({ className: 'participating-institutions-section__td-sessions' }),
        render: (_: unknown, record) => renderHopeScheduleLine(record.hopeScheduleLine),
      },
      {
        title: '배정 현황',
        dataIndex: 'assignmentStatus',
        key: 'assignmentStatus',
        width: 100,
        align: 'center',
        render: (status: VolunteerWaitingAssignmentStatus) => (
          <span
            className={`school-detail-fullpage-view__assignment-status school-detail-fullpage-view__assignment-status--${status === 'unavailable' ? 'cancelled' : status}`}
          >
            {WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS[status]}
          </span>
        ),
      },
      {
        title: '배정 봉사자 수',
        dataIndex: 'assignedVolunteerCountLabel',
        key: 'assignedVolunteerCountLabel',
        width: 110,
        align: 'center',
      },
    ],
    []
  )

  const assignedExportColumns: ColumnsType<{
    no: number
    schoolName: string
    educationGrade: string
    region: string
    distanceFromHome: string
    volunteerSchedule: string
  }> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no' },
      { title: '기관명', dataIndex: 'schoolName', key: 'schoolName' },
      { title: '담당 학년', dataIndex: 'educationGrade', key: 'educationGrade' },
      { title: '기관 소재지', dataIndex: 'region', key: 'region' },
      { title: '자택과의 거리', dataIndex: 'distanceFromHome', key: 'distanceFromHome' },
      { title: '담당 봉사 진행 일정', dataIndex: 'volunteerSchedule', key: 'volunteerSchedule' },
    ],
    []
  )

  const waitingExportColumns: ColumnsType<{
    no: number
    schoolName: string
    desiredGrade: string
    region: string
    distanceFromHome: string
    hopeSchedule: string
    assignmentStatus: string
    assignedVolunteerCountLabel: string
  }> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no' },
      { title: '기관명', dataIndex: 'schoolName', key: 'schoolName' },
      { title: '희망 학년', dataIndex: 'desiredGrade', key: 'desiredGrade' },
      { title: '기관 소재지', dataIndex: 'region', key: 'region' },
      { title: '자택과의 거리', dataIndex: 'distanceFromHome', key: 'distanceFromHome' },
      { title: '봉사 진행 희망 일정', dataIndex: 'hopeSchedule', key: 'hopeSchedule' },
      { title: '배정 현황', dataIndex: 'assignmentStatus', key: 'assignmentStatus' },
      {
        title: '배정 봉사자 수',
        dataIndex: 'assignedVolunteerCountLabel',
        key: 'assignedVolunteerCountLabel',
      },
    ],
    []
  )

  const assignedExportRows = useMemo(
    () =>
      assignedInstitutions.map(row => ({
        no: row.no,
        schoolName: row.schoolName,
        educationGrade: row.educationGrade,
        region: row.region,
        distanceFromHome: row.distanceFromHome,
        volunteerSchedule: row.volunteerScheduleLines.join('\n'),
      })),
    [assignedInstitutions]
  )

  const waitingExportRows = useMemo(
    () =>
      waitingInstitutions.map(row => ({
        no: row.no,
        schoolName: row.schoolName,
        desiredGrade: row.desiredGrade,
        region: row.region,
        distanceFromHome: row.distanceFromHome,
        hopeSchedule: row.hopeScheduleLine,
        assignmentStatus: WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS[row.assignmentStatus],
        assignedVolunteerCountLabel: row.assignedVolunteerCountLabel,
      })),
    [waitingInstitutions]
  )

  const { exportExcel: exportAssignedExcel, isExporting: isAssignedExcelExporting } =
    useTableExcelExport({
      columns: assignedExportColumns,
      data: assignedExportRows,
      filename: '배정된 기관 목록',
    })

  const { exportExcel: exportWaitingExcel, isExporting: isWaitingExcelExporting } =
    useTableExcelExport({
      columns: waitingExportColumns,
      data: waitingExportRows,
      filename: '배정 대기 기관 목록',
    })

  const handleUnassignClick = useCallback(() => {
    if (assignedInstitutions.length === 0) return
    if (selectedAssignedKeys.length === 0) {
      showAlert({ title: '안내', content: VOLUNTEER_ASSIGN_UNASSIGN_SELECT_SCHOOL_ALERT_MESSAGE })
      return
    }
    setUnassignConfirmOpen(true)
  }, [assignedInstitutions.length, selectedAssignedKeys.length, showAlert])

  const handleSelectAssignClick = useCallback(() => {
    if (selectedWaitingKeys.length === 0) {
      showAlert({ title: '안내', content: VOLUNTEER_ASSIGN_SELECT_SCHOOL_ALERT_MESSAGE })
      return
    }
    const movable = waitingInstitutions.some(
      w => selectedWaitingKeys.includes(w.id) && w.assignmentStatus === 'waiting'
    )
    if (!movable) return
    setSelectAssignConfirmOpen(true)
  }, [selectedWaitingKeys, waitingInstitutions, showAlert])

  const handleUnassignConfirm = useCallback(
    (payload: PermissionModalPayload) => {
      if (selectedAssignedKeys.length === 0) return
      const removedRows = assignedInstitutions.filter(r => selectedAssignedKeys.includes(r.id))
      const removedSchoolNames = removedRows.map(r => r.schoolName)
      const removedSchoolIds = new Set(
        removedRows.map(r => r.id.split('__assigned')[0] ?? r.id)
      )
      const toRemove = new Set(selectedAssignedKeys.map(String))
      setAssignedInstitutions(prev =>
        renumberVolunteerAssignedRows(prev.filter(r => !toRemove.has(r.id)))
      )
      setWaitingInstitutions(prev =>
        renumberVolunteerWaitingRows(prev.filter(w => !removedSchoolIds.has(w.schoolId)))
      )
      setUnassignConfirmOpen(false)
      setSelectedAssignedKeys([])
      setUnassignCompleteModal({
        volunteerNames: [volunteer.volunteerName],
        targetNames: removedSchoolNames,
        reason: payload.reason,
      })
    },
    [selectedAssignedKeys, assignedInstitutions, volunteer.volunteerName]
  )

  const handleSelectAssignConfirm = useCallback(() => {
    const selectedRows = waitingInstitutions.filter(
      w => selectedWaitingKeys.includes(w.id) && w.assignmentStatus === 'waiting'
    )
    if (selectedRows.length === 0) return

    const ids = new Set(selectedRows.map(r => r.id))
    setWaitingInstitutions(prev => renumberVolunteerWaitingRows(prev.filter(w => !ids.has(w.id))))

    setAssignedInstitutions(prev => {
      const next = [...prev]
      let idx = next.length
      const addedSchoolIds = new Set(next.map(r => r.id.split('__assigned')[0]))

      for (const w of selectedRows) {
        if (addedSchoolIds.has(w.schoolId)) continue
        const school = schoolRows.find(s => s.id === w.schoolId)
        if (!school) continue
        next.push(schoolRowToVolunteerAssignedRow(school, volunteer, 0, idx, program))
        addedSchoolIds.add(w.schoolId)
        idx += 1
      }
      return renumberVolunteerAssignedRows(next)
    })

    setSelectAssignConfirmOpen(false)
    setSelectedWaitingKeys([])
  }, [selectedWaitingKeys, waitingInstitutions, schoolRows, volunteer, program])

  const handleAddAssignConfirm = useCallback(() => {
    if (!addAssignWaitingRowId) return
    const waitingRow = waitingInstitutions.find(w => w.id === addAssignWaitingRowId)
    if (!waitingRow || waitingRow.assignmentStatus !== 'waiting') return

    const school = schoolRows.find(s => s.id === waitingRow.schoolId)
    if (!school) return

    setWaitingInstitutions(prev =>
      renumberVolunteerWaitingRows(prev.filter(w => w.id !== addAssignWaitingRowId))
    )
    setAssignedInstitutions(prev => {
      const alreadyAssigned = prev.some(r => r.id.startsWith(`${school.id}__assigned`))
      if (alreadyAssigned) return prev
      const next = [
        ...prev,
        schoolRowToVolunteerAssignedRow(school, volunteer, 0, prev.length, program),
      ]
      return renumberVolunteerAssignedRows(next)
    })
    setAddAssignModalOpen(false)
    setAddAssignWaitingRowId(null)
  }, [addAssignWaitingRowId, waitingInstitutions, schoolRows, volunteer, program])

  const addAssignOptions = useMemo(
    () =>
      waitingInstitutions
        .filter(w => w.assignmentStatus === 'waiting')
        .map(w => ({
          value: w.id,
          label: `${w.schoolName} · ${w.hopeScheduleLine}`,
        })),
    [waitingInstitutions]
  )

  const unassignSchoolNames = useMemo(
    () =>
      assignedInstitutions
        .filter(r => selectedAssignedKeys.includes(r.id))
        .map(r => r.schoolName),
    [assignedInstitutions, selectedAssignedKeys]
  )

  const selectAssignLabels = useMemo(
    () =>
      waitingInstitutions
        .filter(w => selectedWaitingKeys.includes(w.id) && w.assignmentStatus === 'waiting')
        .map(w => `${w.schoolName} (${w.hopeScheduleLine})`),
    [waitingInstitutions, selectedWaitingKeys]
  )

  return (
    <div className="participating-volunteer-assignment-section school-detail-fullpage-view__instructor-tab">
      <div className="school-detail-fullpage-view__instructor-section">
        <div className="table-header-actions">
          <div className="table-header-title--wrapper">
            <span className="table-title">배정된 기관 목록</span>
            <span className="table-description">{assignedInstitutions.length}건</span>
          </div>
          <div className="info-section-buttons--wrapper">
            <CmsButton
              variant="delete"
              size="large"
              disabled={assignedInstitutions.length === 0}
              onClick={handleUnassignClick}
            >
              배정 취소
            </CmsButton>
            <CmsButton
              variant="secondary"
              size="large"
              disabled={addAssignOptions.length === 0}
              onClick={() => {
                if (addAssignOptions.length === 0) return
                setAddAssignWaitingRowId(addAssignOptions[0]?.value ?? null)
                setAddAssignModalOpen(true)
              }}
            >
              추가 배정
            </CmsButton>
            <ExcelButton onClick={exportAssignedExcel} loading={isAssignedExcelExporting} />
          </div>
        </div>
        <div className="participating-institutions-section__table-wrap participating-volunteer-assignment-section__table-scroll">
          {assignedInstitutions.length === 0 ? (
            <div
              className="school-detail-fullpage-view__instructor-list-empty"
              role="status"
              aria-label="배정된 기관 없음"
            >
              배정된 기관이 없습니다.
            </div>
          ) : (
            <Table<VolunteerAssignedInstitutionRow>
              className="participating-institutions-section__table cms-data-table"
              rowKey="id"
              size="middle"
              pagination={false}
              scroll={{ x: 1100 }}
              rowSelection={{
                columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                selectedRowKeys: selectedAssignedKeys,
                onChange: keys => setSelectedAssignedKeys(keys),
              }}
              columns={assignedColumns}
              dataSource={assignedInstitutions}
            />
          )}
        </div>
      </div>

      <div className="school-detail-fullpage-view__instructor-section school-detail-fullpage-view__instructor-section--waiting">
        <div className="table-header-actions">
          <div className="table-header-title--wrapper">
            <span className="table-title">배정 대기 기관 목록</span>
            <span className="table-description">{waitingInstitutions.length}건</span>
          </div>
          <div className="info-section-buttons--wrapper">
            <CmsButton variant="secondary" size="large" onClick={handleSelectAssignClick}>
              선택 배정
            </CmsButton>
            <ExcelButton onClick={exportWaitingExcel} loading={isWaitingExcelExporting} />
          </div>
        </div>
        <div className="participating-institutions-section__table-wrap participating-volunteer-assignment-section__table-scroll">
          {waitingInstitutions.length === 0 ? (
            <div
              className="school-detail-fullpage-view__instructor-list-empty"
              role="status"
              aria-label="배정 대기 기관 없음"
            >
              배정 대기 중인 기관이 없습니다.
            </div>
          ) : (
            <Table<VolunteerWaitingInstitutionRow>
              className="participating-institutions-section__table cms-data-table"
              rowKey="id"
              size="middle"
              pagination={false}
              scroll={{ x: 1300 }}
              rowSelection={{
                columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                selectedRowKeys: selectedWaitingKeys,
                onChange: keys => setSelectedWaitingKeys(keys),
                getCheckboxProps: record => ({
                  disabled: record.assignmentStatus !== 'waiting',
                }),
              }}
              columns={waitingColumns}
              dataSource={waitingInstitutions}
              rowClassName={record =>
                record.assignmentStatus === 'unavailable'
                  ? 'school-detail-fullpage-view__waiting-row--unavailable'
                  : ''
              }
            />
          )}
        </div>
      </div>

      <ParticipatingVolunteerUnassignConfirmModal
        open={unassignConfirmOpen}
        onCancel={() => setUnassignConfirmOpen(false)}
        volunteerNames={[volunteer.volunteerName]}
        targetNames={unassignSchoolNames}
        onConfirm={handleUnassignConfirm}
      />
      <ParticipatingVolunteerUnassignCompleteModal
        open={unassignCompleteModal != null}
        onClose={() => setUnassignCompleteModal(null)}
        volunteerNames={unassignCompleteModal?.volunteerNames ?? []}
        targetNames={unassignCompleteModal?.targetNames ?? []}
        reason={unassignCompleteModal?.reason ?? ''}
      />

      <ContentModal
        open={selectAssignConfirmOpen}
        onCancel={() => setSelectAssignConfirmOpen(false)}
        title="기관 배정 안내"
        width={600}
        footer={
          <>
            <CmsButton
              variant="secondary"
              size="large"
              onClick={() => setSelectAssignConfirmOpen(false)}
            >
              취소
            </CmsButton>
            <CmsButton variant="primary" size="large" onClick={handleSelectAssignConfirm}>
              배정
            </CmsButton>
          </>
        }
      >
        <p>
          [<strong>{volunteer.volunteerName}</strong>] 봉사자님을 다음 기관에 배정하시겠습니까?{' '}
          {selectAssignLabels.map((label, i) => (
            <span key={`${label}-${i}`}>
              [<strong>{label}</strong>]{i < selectAssignLabels.length - 1 ? ', ' : ''}
            </span>
          ))}
        </p>
      </ContentModal>

      <ContentModal
        open={addAssignModalOpen}
        onCancel={() => {
          setAddAssignModalOpen(false)
          setAddAssignWaitingRowId(null)
        }}
        title="추가 배정"
        width={600}
        footer={
          <>
            <CmsButton
              variant="secondary"
              size="large"
              onClick={() => {
                setAddAssignModalOpen(false)
                setAddAssignWaitingRowId(null)
              }}
            >
              취소
            </CmsButton>
            <CmsButton variant="primary" size="large" onClick={handleAddAssignConfirm}>
              배정
            </CmsButton>
          </>
        }
      >
        <div style={{ marginBottom: 16 }}>
          <span style={{ display: 'block', marginBottom: 8 }}>기관 · 일정 선택</span>
          <Select
            style={{ width: '100%' }}
            placeholder="배정할 기관과 일정을 선택하세요"
            options={addAssignOptions}
            value={addAssignWaitingRowId ?? undefined}
            onChange={v => setAddAssignWaitingRowId(v)}
            allowClear
            getPopupContainer={() => document.body}
          />
        </div>
      </ContentModal>
    </div>
  )
}
