/**
 * 참여 봉사자 상세 — 봉사 배정 현황 탭 (일반 프로그램 · 개인)
 */

import { useCallback, useEffect, useMemo, useRef, useState, type Key } from 'react'
import { Spin } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Program } from '@/types/domain'
import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
} from '@/shared/constants/messages'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { CmsButton, ExcelButton, useCmsAlert } from '@/shared/ui'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import { ScheduleLinesCell } from '@/features/program/shared/ui/schedule-lines-cell'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
import {
  PARTICIPATING_INDIVIDUAL_VOLUNTEER_ASSIGNED_SCHEDULE_EXCEL_COLUMNS,
  PARTICIPATING_INDIVIDUAL_VOLUNTEER_WAITING_SCHEDULE_EXCEL_COLUMNS,
} from '@/features/program/general/lib/participating-individual-volunteer-assignment-export'
import {
  collectAssignedPreEducationScheduleIds,
  mergeEducationScopeScheduleIdsPreservingPreEducation,
  resolveVolunteerAssignmentDistanceCellLabel,
  VOLUNTEER_ASSIGNMENT_DISTANCE_UNAVAILABLE_TOOLTIP,
} from '@/features/program/general/lib/participating-individual-volunteer-assignment'
import { useParticipatingIndividualVolunteerAssignment } from '@/features/program/general/hooks/use-participating-individual-volunteer-assignment'
import type {
  ParticipatingIndividualVolunteerAssignedScheduleRow,
  ParticipatingIndividualVolunteerWaitingScheduleRow,
} from '@/features/program/general/lib/participating-individual-volunteer-assignment-types'
import { WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS } from '@/features/program/general/lib/waiting-instructor-assignment'
import { participatingScheduleTableColumnLayout } from '@/features/program/general/lib/participating-institutions-table'
import { ParticipatingVolunteerUnassignConfirmModal } from './participating-volunteer-unassign-confirm-modal'
import { ParticipatingVolunteerUnassignCompleteModal } from './participating-volunteer-unassign-complete-modal'
import {
  fetchGeneralParticipantEducationScope,
  saveGeneralParticipantEducationScope,
} from '@/features/program/general/api/admin-program-progress-service'
import { notifyProgramApiUnavailable } from '@/features/program/shared/lib/program-api-unavailable'
import {
  EDUCATION_SCOPE_PUT_PRE_EDUCATION_MERGE_PENDING_MESSAGE,
  isEducationScopeRevisionConflict,
} from '@/features/program/general/lib/individual-approval-education-scope'
import { getApiErrorCode } from '@/shared/lib/extract-api-error-message'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import { buildAddAssignWaitingScheduleChipOptions } from '@/features/program/general/lib/general-add-assign-session-chips'
import { GeneralParticipantAddAssignModal } from './general-participant-add-assign-modal'
import { InstitutionSelectAssignConfirmModal } from './institution-select-assign-confirm-modal'
import './instructor-assignment-status-text.css'
import './participating-institutions-section.css'
import { NO_SELECTION_ALERT } from '@/shared/constants/no-selection-alert'

/** 추가 배정 — Figma CMS 9760:8214 ‘추가 배정 안내’ (E: 개인형 참여 봉사자, 대표 강사 필드 없음) */
const ADD_ASSIGN_MODAL_TITLE = '추가 배정 안내'

function renderDistanceFromHomeCell(value: string, educationScopeFetching: boolean) {
  const label = resolveVolunteerAssignmentDistanceCellLabel(value, educationScopeFetching)
  if (label === '-') {
    return <span title={VOLUNTEER_ASSIGNMENT_DISTANCE_UNAVAILABLE_TOOLTIP}>{label}</span>
  }
  return label
}

const ASSIGNED_EMPTY_TEXT = '배정된 봉사 일정이 없습니다.'
const WAITING_EMPTY_TEXT = '배정 대기 중인 봉사 일정이 없습니다.'

function renderScheduleCell(label: string) {
  return <ScheduleLinesCell lines={[formatCmsScheduleDisplayLabel(label)]} />
}

export interface ParticipatingIndividualVolunteerAssignmentSectionProps {
  program: Program
  volunteer: ParticipatingVolunteerRow
}

export function ParticipatingIndividualVolunteerAssignmentSection({
  program,
  volunteer,
}: ParticipatingIndividualVolunteerAssignmentSectionProps) {
  const { showAlert } = useCmsAlert()
  const {
    remoteEnabled,
    isLoading,
    assignedSchedules: remoteAssignedSchedules,
    waitingSchedules: remoteWaitingSchedules,
    scopeQuery,
    schedulesQuery,
    invalidateScope,
  } = useParticipatingIndividualVolunteerAssignment({ program, volunteer })

  const [assignedSchedules, setAssignedSchedules] = useState<
    ParticipatingIndividualVolunteerAssignedScheduleRow[]
  >([])
  const [waitingSchedules, setWaitingSchedules] = useState<
    ParticipatingIndividualVolunteerWaitingScheduleRow[]
  >([])
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
  const [addAssignSubmitting, setAddAssignSubmitting] = useState(false)
  const addAssignInFlightRef = useRef(false)

  useEffect(() => {
    if (isLoading) return
    setAssignedSchedules(remoteAssignedSchedules)
    setWaitingSchedules(remoteWaitingSchedules)
    setSelectedAssignedKeys([])
    setSelectedWaitingKeys([])
  }, [isLoading, remoteAssignedSchedules, remoteWaitingSchedules, volunteer.id, program.id])

  const assignedColumns: ColumnsType<ParticipatingIndividualVolunteerAssignedScheduleRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      {
        title: '봉사 지역',
        dataIndex: 'serviceRegion',
        key: 'serviceRegion',
        width: 240,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '자택과의 거리',
        dataIndex: 'distanceFromHome',
        key: 'distanceFromHome',
        width: 140,
        align: 'center',
        render: (value: string) => renderDistanceFromHomeCell(value, scopeQuery.isFetching),
      },
      {
        title: '담당 봉사 진행 일정',
        dataIndex: 'scheduleLabel',
        key: 'scheduleLabel',
        width: 700,
        minWidth: 700,
        ...participatingScheduleTableColumnLayout(),
        render: (label: string) => renderScheduleCell(label),
      },
    ],
    [scopeQuery.isFetching]
  )

  const waitingColumns: ColumnsType<ParticipatingIndividualVolunteerWaitingScheduleRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      {
        title: '봉사 지역',
        dataIndex: 'serviceRegion',
        key: 'serviceRegion',
        width: 200,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '자택과의 거리',
        dataIndex: 'distanceFromHome',
        key: 'distanceFromHome',
        width: 120,
        align: 'center',
        render: (value: string) => renderDistanceFromHomeCell(value, scopeQuery.isFetching),
      },
      {
        title: '봉사 진행 희망 일정',
        dataIndex: 'scheduleLabel',
        key: 'scheduleLabel',
        width: 640,
        minWidth: 640,
        ...participatingScheduleTableColumnLayout(),
        render: (label: string) => renderScheduleCell(label),
      },
      {
        title: '배정 현황',
        dataIndex: 'assignmentStatus',
        key: 'assignmentStatus',
        width: 120,
        align: 'center',
        render: (
          status: ParticipatingIndividualVolunteerWaitingScheduleRow['assignmentStatus']
        ) => (
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
        width: 120,
        align: 'center',
      },
    ],
    [scopeQuery.isFetching]
  )

  const assignedExportRows = useMemo(
    () =>
      assignedSchedules.map(row => ({
        id: row.id,
        no: row.no,
        serviceRegion: row.serviceRegion,
        distanceFromHome: row.distanceFromHome,
        scheduleLabel: row.scheduleLabel,
      })),
    [assignedSchedules]
  )

  const waitingExportRows = useMemo(
    () =>
      waitingSchedules.map(row => ({
        id: row.id,
        no: row.no,
        serviceRegion: row.serviceRegion,
        distanceFromHome: row.distanceFromHome,
        scheduleLabel: row.scheduleLabel,
        assignmentStatus: WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS[row.assignmentStatus],
        assignedVolunteerCountLabel: row.assignedVolunteerCountLabel,
      })),
    [waitingSchedules]
  )

  const { exportExcel: exportAssignedExcel, isExporting: isAssignedExcelExporting } =
    useTableExcelExport({
      columns: PARTICIPATING_INDIVIDUAL_VOLUNTEER_ASSIGNED_SCHEDULE_EXCEL_COLUMNS,
      data: assignedExportRows,
      filename: '배정된 봉사 일정',
      selectedRowKeys: selectedAssignedKeys,
    })

  const { exportExcel: exportWaitingExcel, isExporting: isWaitingExcelExporting } =
    useTableExcelExport({
      columns: PARTICIPATING_INDIVIDUAL_VOLUNTEER_WAITING_SCHEDULE_EXCEL_COLUMNS,
      data: waitingExportRows,
      filename: '배정 대기 봉사 일정',
      selectedRowKeys: selectedWaitingKeys,
    })

  const persistAssignedScheduleIds = useCallback(
    async (nextIds: number[], reason: string) => {
      if (!remoteEnabled) {
        notifyProgramApiUnavailable(
          'general-individual-volunteer-education-scope-save',
          '참여 봉사자 상세 · 봉사 배정'
        )
        return false
      }
      try {
        // PUT PRE_ED merge는 BE 대기. GET 현재 scope의 PRE_ED id를 본교육 선택과 union한다.
        const latest = await fetchGeneralParticipantEducationScope(program.id, volunteer.id)
        const preEducationScheduleIds = collectAssignedPreEducationScheduleIds({
          currentScheduleIds: latest.scheduleIds ?? [],
          programSchedules: schedulesQuery.data?.schedules ?? [],
        })
        const scheduleIds = mergeEducationScopeScheduleIdsPreservingPreEducation({
          nextScheduleIds: nextIds,
          preEducationScheduleIds,
        })
        await saveGeneralParticipantEducationScope(program.id, volunteer.id, {
          scheduleIds,
          expectedRevision: latest.revision ?? 0,
          reason,
        })
        await invalidateScope()
        return true
      } catch (error) {
        const code = getApiErrorCode(error)
        if (isEducationScopeRevisionConflict(error)) {
          await invalidateScope()
          showAlert({
            title: '교육 일정 갱신',
            content:
              '다른 관리자가 배정을 변경했습니다. 최신 일정을 다시 불러왔습니다. 선택을 확인한 뒤 다시 저장해 주세요.',
          })
          return false
        }
        if (
          code === 'GENERAL_INDIVIDUAL_PRE_EDUCATION_SCOPE_MISMATCH' ||
          code === 'EDUCATION_SCOPE_SCHEDULE_NOT_AVAILABLE'
        ) {
          showAlert({
            title: '안내',
            content: EDUCATION_SCOPE_PUT_PRE_EDUCATION_MERGE_PENDING_MESSAGE,
          })
          return false
        }
        showAlert({
          title: '안내',
          content: getGeneralProgramApiErrorMessage(
            error,
            '봉사 배정 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.',
          ),
        })
        return false
      }
    },
    [
      invalidateScope,
      program.id,
      remoteEnabled,
      schedulesQuery.data?.schedules,
      showAlert,
      volunteer.id,
    ]
  )

  const handleUnassignClick = useCallback(() => {
    if (selectedAssignedKeys.length === 0) {
      showAlert(NO_SELECTION_ALERT)
      return
    }
    setUnassignConfirmOpen(true)
  }, [selectedAssignedKeys.length, showAlert])

  const handleSelectAssignClick = useCallback(() => {
    if (selectedWaitingKeys.length === 0) {
      showAlert(NO_SELECTION_ALERT)
      return
    }
    const movable = waitingSchedules.some(
      w => selectedWaitingKeys.includes(w.id) && w.assignmentStatus === 'waiting'
    )
    if (!movable) return
    setSelectAssignConfirmOpen(true)
  }, [selectedWaitingKeys, waitingSchedules, showAlert])

  const handleUnassignConfirm = useCallback(
    async (payload: PermissionModalPayload) => {
      if (selectedAssignedKeys.length === 0) return
      const removedRows = assignedSchedules.filter(
        r => selectedAssignedKeys.includes(r.id) && r.preEducation !== true
      )
      const nextIds = assignedSchedules
        .filter(
          r =>
            r.scheduleId != null &&
            (r.preEducation === true || !selectedAssignedKeys.includes(r.id))
        )
        .map(r => r.scheduleId as number)
      const ok = await persistAssignedScheduleIds(
        nextIds,
        payload.reason.trim() || '봉사 일정 배정 취소'
      )
      if (!ok) return
      setUnassignConfirmOpen(false)
      setSelectedAssignedKeys([])
      setUnassignCompleteModal({
        volunteerNames: [volunteer.volunteerName],
        targetNames: removedRows.map(r => r.scheduleLabel),
        reason: payload.reason,
      })
    },
    [assignedSchedules, persistAssignedScheduleIds, selectedAssignedKeys, volunteer.volunteerName]
  )

  const handleSelectAssignConfirm = useCallback(async () => {
    const selectedRows = waitingSchedules.filter(
      w => selectedWaitingKeys.includes(w.id) && w.assignmentStatus === 'waiting'
    )
    if (selectedRows.length === 0) return
    const nextIds = [
      ...assignedSchedules.map(r => r.scheduleId).filter((id): id is number => id != null),
      ...selectedRows.map(r => r.scheduleId).filter((id): id is number => id != null),
    ]
    const ok = await persistAssignedScheduleIds(Array.from(new Set(nextIds)), '봉사 일정 배정')
    if (!ok) return
    setSelectAssignConfirmOpen(false)
    setSelectedWaitingKeys([])
  }, [assignedSchedules, persistAssignedScheduleIds, selectedWaitingKeys, waitingSchedules])

  const handleAddAssignConfirm = useCallback(async () => {
    if (addAssignInFlightRef.current) return
    if (!addAssignWaitingRowId) {
      showAlert({ title: ADD_ASSIGN_MODAL_TITLE, content: '봉사 배정일을 선택해 주세요.' })
      return
    }
    const waitingRow = waitingSchedules.find(w => w.id === addAssignWaitingRowId)
    if (!waitingRow || waitingRow.assignmentStatus !== 'waiting' || waitingRow.scheduleId == null) {
      return
    }
    const nextIds = [
      ...assignedSchedules.map(r => r.scheduleId).filter((id): id is number => id != null),
      waitingRow.scheduleId,
    ]
    addAssignInFlightRef.current = true
    setAddAssignSubmitting(true)
    try {
      const ok = await persistAssignedScheduleIds(
        Array.from(new Set(nextIds)),
        '봉사 일정 추가 배정'
      )
      if (!ok) return
      setAddAssignModalOpen(false)
      setAddAssignWaitingRowId(null)
    } finally {
      addAssignInFlightRef.current = false
      setAddAssignSubmitting(false)
    }
  }, [
    addAssignWaitingRowId,
    assignedSchedules,
    persistAssignedScheduleIds,
    showAlert,
    waitingSchedules,
  ])

  /** 추가 배정 일정 칩 — 대기 테이블 전체(선택 불가·scheduleId 없는 행은 비활성 칩) */
  const addAssignSessionOptions = useMemo(
    () =>
      buildAddAssignWaitingScheduleChipOptions(
        waitingSchedules.map(w => ({
          id: w.id,
          scheduleLabel: w.scheduleLabel,
          assignmentStatus: w.assignmentStatus,
          countLabel: w.assignedVolunteerCountLabel,
          locationLabel: w.serviceRegion,
          disabled: w.scheduleId == null,
        }))
      ),
    [waitingSchedules]
  )
  const addAssignSelectedSessionIds = useMemo(
    () => (addAssignWaitingRowId ? [addAssignWaitingRowId] : []),
    [addAssignWaitingRowId]
  )
  const handleAddAssignSessionIdsChange = useCallback((ids: string[]) => {
    setAddAssignWaitingRowId(ids[0] ?? null)
  }, [])

  const addAssignOptions = useMemo(
    () =>
      waitingSchedules
        .filter(w => w.assignmentStatus === 'waiting')
        .map(w => ({
          value: w.id,
          label: w.scheduleLabel,
        })),
    [waitingSchedules]
  )

  const unassignScheduleLabels = useMemo(
    () =>
      assignedSchedules.filter(r => selectedAssignedKeys.includes(r.id)).map(r => r.scheduleLabel),
    [assignedSchedules, selectedAssignedKeys]
  )

  /** 선택 배정 안내 — 첫 일정 + 외 N개 */
  const selectAssignTargets = useMemo(
    () =>
      waitingSchedules.filter(
        w => selectedWaitingKeys.includes(w.id) && w.assignmentStatus === 'waiting'
      ),
    [waitingSchedules, selectedWaitingKeys]
  )

  if (isLoading) {
    return (
      <div className="detail-fullpage-modal__loading" role="status">
        <Spin size="large" />
      </div>
    )
  }

  return (
    <div className="school-detail-fullpage-view__instructor-tab">
      <div className="school-detail-fullpage-view__instructor-section">
        <div className="table-header-actions">
          <div className="table-header-title--wrapper">
            <span className="table-title">배정된 봉사 일정</span>
            <span className="table-description">{assignedSchedules.length}건</span>
          </div>
          <div className="info-section-buttons--wrapper">
            <CmsButton variant="delete" size="h40" onClick={handleUnassignClick}>
              배정 취소
            </CmsButton>
            <CmsButton
              variant="secondary"
              size="h40"
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
        <div className="participating-institutions-section__table-wrap">
          <CmsDataTable<ParticipatingIndividualVolunteerAssignedScheduleRow>
            className="participating-institutions-section__table cms-data-table"
            rowKey="id"
            size="middle"
            pagination={false}
            scroll={{ x: 720 }}
            rowSelection={{
              columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
              selectedRowKeys: selectedAssignedKeys,
              onChange: keys => setSelectedAssignedKeys(keys),
              getCheckboxProps: record => ({
                disabled: record.preEducation === true,
              }),
            }}
            columns={assignedColumns}
            dataSource={assignedSchedules}
            emptyTitle={ASSIGNED_EMPTY_TEXT}
            emptyDescription={null}
          />
        </div>
      </div>

      <div className="school-detail-fullpage-view__instructor-section school-detail-fullpage-view__instructor-section--waiting">
        <div className="table-header-actions">
          <div className="table-header-title--wrapper">
            <span className="table-title">배정 대기 봉사 일정</span>
            <span className="table-description">{waitingSchedules.length}건</span>
          </div>
          <div className="info-section-buttons--wrapper">
            <CmsButton variant="secondary" size="h40" onClick={handleSelectAssignClick}>
              선택 배정
            </CmsButton>
            <ExcelButton onClick={exportWaitingExcel} loading={isWaitingExcelExporting} />
          </div>
        </div>
        <div className="participating-institutions-section__table-wrap school-detail-fullpage-view__waiting-table-scroll">
          <CmsDataTable<ParticipatingIndividualVolunteerWaitingScheduleRow>
            className="participating-institutions-section__table cms-data-table"
            rowKey="id"
            size="middle"
            pagination={false}
            scroll={{ x: 900 }}
            rowSelection={{
              columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
              selectedRowKeys: selectedWaitingKeys,
              onChange: keys => setSelectedWaitingKeys(keys),
              getCheckboxProps: record => ({
                disabled: record.assignmentStatus !== 'waiting',
              }),
            }}
            columns={waitingColumns}
            dataSource={waitingSchedules}
            emptyTitle={WAITING_EMPTY_TEXT}
            emptyDescription={null}
            rowClassName={record =>
              record.assignmentStatus === 'unavailable'
                ? 'school-detail-fullpage-view__waiting-row--unavailable'
                : ''
            }
          />
        </div>
      </div>

      <ParticipatingVolunteerUnassignConfirmModal
        open={unassignConfirmOpen}
        onCancel={() => setUnassignConfirmOpen(false)}
        volunteerNames={[volunteer.volunteerName]}
        targetNames={unassignScheduleLabels}
        onConfirm={handleUnassignConfirm}
      />
      <ParticipatingVolunteerUnassignCompleteModal
        open={unassignCompleteModal != null}
        onClose={() => setUnassignCompleteModal(null)}
        volunteerNames={unassignCompleteModal?.volunteerNames ?? []}
        targetNames={unassignCompleteModal?.targetNames ?? []}
        reason={unassignCompleteModal?.reason ?? ''}
      />

      <InstitutionSelectAssignConfirmModal
        open={selectAssignConfirmOpen}
        onCancel={() => setSelectAssignConfirmOpen(false)}
        onConfirm={() => {
          void handleSelectAssignConfirm()
        }}
        targetNoun="일정"
        institutionName={
          selectAssignTargets[0]
            ? formatCmsScheduleDisplayLabel(selectAssignTargets[0].scheduleLabel)
            : ''
        }
        extraTargetCount={Math.max(0, selectAssignTargets.length - 1)}
        instructorName={volunteer.volunteerName}
        currentCount={null}
        requiredCount={null}
        countLabel={selectAssignTargets[0]?.assignedVolunteerCountLabel ?? null}
      />

      <GeneralParticipantAddAssignModal
        open={addAssignModalOpen}
        onCancel={() => {
          if (addAssignInFlightRef.current) return
          setAddAssignModalOpen(false)
          setAddAssignWaitingRowId(null)
        }}
        title={ADD_ASSIGN_MODAL_TITLE}
        description={`**[${volunteer.volunteerName}]** 님을 추가 배정할 일정을 선택해 주세요.`}
        onConfirm={() => {
          void handleAddAssignConfirm()
        }}
        confirmLoading={addAssignSubmitting}
        sessions={{
          label: '봉사 배정일 선택',
          options: addAssignSessionOptions,
          value: addAssignSelectedSessionIds,
          onChange: handleAddAssignSessionIdsChange,
          selectionMode: 'single',
          emptyText: '선택 가능한 봉사 일정이 없습니다.',
        }}
      />
    </div>
  )
}
