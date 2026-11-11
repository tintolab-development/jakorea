import { ProgramAssignmentStatusText } from '@/features/program/shared/ui/program-assignment-status-text'
/**
 * 참여 봉사자 상세 — 봉사 배정 현황 탭
 */

import { useCallback, useEffect, useMemo, useRef, useState, type Key } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import type { ColumnsType } from 'antd/es/table'
import type { Program } from '@/types/domain'
import type { ParticipatingVolunteerRow } from '@/features/program/general/model/participating-volunteers'
import type { ParticipatingSchoolRow } from '@/features/program/general/model/participating-schools'
import {
  fetchGeneralParticipantEducationScope,
  fetchGeneralVolunteerAssignments,
  saveGeneralVolunteerAssignedOrganizations,
} from '@/features/program/general/api/admin-program-progress-service'
import type { VolunteerAssignmentNotificationTiming } from '@/features/program/general/api/program-progress-api-client'
import {
  buildVolunteerAssignmentNotificationByOrganization,
  resolveVolunteerUnassignNotificationSent,
  toVolunteerAssignmentNotificationTiming,
} from '@/features/program/general/lib/volunteer-assignment-notification'
import { getNotificationTimingApiErrorMessage } from '@/shared/lib/notification-schedule'
import { formatWaitingOrganizationDistance } from '@/features/program/general/lib/assignment-waiting-distance'
import { generalProgramProgressQueryKeys } from '@/features/program/general/api/general-applications-query-keys'
import { getGeneralProgramApiErrorMessage } from '@/features/program/general/api/get-general-program-api-error'
import { useProgramProgressRemoteEnabledForSurface } from '@/features/program/1c-1s/lib/use-company-school-surface-remote'
import { notifyProgramApiUnavailable } from '@/features/program/shared/lib/program-api-unavailable'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import {
} from '@/shared/constants/messages'
import { CmsButton, ExcelButton, useCmsAlert } from '@/shared/ui'
import { useTableExcelExport } from '@/shared/hooks/use-table-excel-export'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import { ScheduleLinesCell } from '@/features/program/shared/ui/schedule-lines-cell'
import type { PermissionModalPayload } from '@/shared/components/permission-modal'
import {
  buildInitialVolunteerAssignedRows,
  buildVolunteerWaitingInstitutionRows,
  renumberVolunteerAssignedRows,
  renumberVolunteerWaitingRows,
  resolveVolunteerAssignedOrganizationApplicationIds,
  schoolRowToVolunteerAssignedRow,
  type VolunteerAssignedInstitutionRow,
  type VolunteerWaitingInstitutionRow,
  type VolunteerWaitingAssignmentStatus,
} from '@/features/program/general/lib/participating-volunteer-institution-assignment'
import { WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS } from '@/features/program/general/lib/waiting-instructor-assignment'
import { participatingScheduleTableColumnLayout } from '@/features/program/general/lib/participating-institutions-table'
import { buildVolunteerInstitutionAddAssignOptions } from '@/features/program/general/lib/general-add-assign-session-chips'
import { GeneralParticipantAddAssignModal } from './general-participant-add-assign-modal'
import { ParticipatingVolunteerUnassignConfirmModal } from './participating-volunteer-unassign-confirm-modal'
import { VolunteerInstitutionUnassignConfirmModal } from './volunteer-institution-unassign-confirm-modal'
import {
  ASSIGNED_INSTITUTIONS_EMPTY_COPY,
  AssignmentListEmpty,
  WAITING_INSTITUTIONS_EMPTY_COPY,
} from './assignment-list-empty'
import { ParticipatingVolunteerUnassignCompleteModal } from './participating-volunteer-unassign-complete-modal'
import { InstitutionSelectAssignConfirmModal } from './institution-select-assign-confirm-modal'
import { InstitutionAssignCompleteModal } from './institution-assign-complete-modal'
import { useIsInstitutionProgramSurface } from '@/features/program/general/hooks/use-institution-program-surface'
import './participating-institutions-section.css'
import './participating-volunteer-assignment-section.css'
import { NO_SELECTION_ALERT } from '@/shared/constants/no-selection-alert'

function renderVolunteerScheduleLines(lines: string[]) {
  return (
    <ScheduleLinesCell
      lines={lines.map(line => formatCmsScheduleDisplayLabel(line))}
      moreUnit="봉사 일정"
    />
  )
}

function renderHopeScheduleLine(line: string) {
  return <ScheduleLinesCell lines={[formatCmsScheduleDisplayLabel(line)]} />
}

/**
 * 배정 완료 인원 줄 — 배정 직전 「배정 봉사자 수」 라벨(`3/4명`·`3명`)에 이번 배정 1명을 더한다.
 * 라벨을 해석할 수 없으면 줄을 숨긴다.
 */
export function buildVolunteerAssignCompleteCountLine(
  countLabelBeforeAssign: string | null | undefined
): string | null {
  const raw = countLabelBeforeAssign?.trim() ?? ''
  const ratio = /^(\d+)\s*\/\s*(\d+)\s*명$/.exec(raw)
  if (ratio) return `(현재 배정 인원 : ${Number(ratio[1]) + 1}/${ratio[2]}명)`
  const single = /^(\d+)\s*명$/.exec(raw)
  if (single) return `(현재 배정 인원 : ${Number(single[1]) + 1}명)`
  return null
}

/** 추가 배정 — Figma CMS 9760:8214 ‘기관 추가 배정 안내’ (C: 기관형 참여 봉사자) */
const ADD_ASSIGN_MODAL_TITLE = '기관 추가 배정 안내'

/** 시안 기준 체크박스 열 60px — 두 테이블 합계 1546px */
const ASSIGNMENT_CHECKBOX_COLUMN_WIDTH = 60
const ASSIGNMENT_TABLE_SCROLL_X = 1546

export interface ParticipatingVolunteerAssignmentSectionProps {
  program: Program
  volunteer: ParticipatingVolunteerRow
  schoolRows?: ParticipatingSchoolRow[]
  volunteerList?: ParticipatingVolunteerRow[]
}

export function ParticipatingVolunteerAssignmentSection({
  program,
  volunteer,
  schoolRows = [],
  volunteerList = [],
}: ParticipatingVolunteerAssignmentSectionProps) {
  const { showAlert } = useCmsAlert()
  const queryClient = useQueryClient()
  const remoteEnabled = useProgramProgressRemoteEnabledForSurface(program.id)
  const [assignedInstitutions, setAssignedInstitutions] = useState<
    VolunteerAssignedInstitutionRow[]
  >([])
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
  const [addAssignSchoolId, setAddAssignSchoolId] = useState<string | null>(null)
  const [addAssignSubmitting, setAddAssignSubmitting] = useState(false)
  const addAssignInFlightRef = useRef(false)
  /** 기관형 — Figma 07-2/04-2·05-2 「배정 완료」 (1사1교 등 다른 표면은 기존처럼 완료 팝업 없음) */
  const isInstitutionSurface = useIsInstitutionProgramSurface(program)
  const [assignCompleteModal, setAssignCompleteModal] = useState<{
    institutionName: string
    extraTargetCount: number
    countLine: string | null
  } | null>(null)

  /**
   * 「자택과의 거리」 — education-scope `organizations[]`(기관별 편도 거리)를 기관 신청 id로 찾는다.
   * 서버가 값을 주지 않으면 '-'. FE는 거리를 계산하지 않는다.
   */
  const educationScopeQuery = useQuery({
    queryKey: generalProgramProgressQueryKeys.educationScope(program.id, volunteer.id),
    queryFn: () => fetchGeneralParticipantEducationScope(program.id, volunteer.id),
    enabled: remoteEnabled && Boolean(volunteer.id),
    staleTime: 15_000,
    retry: false,
  })
  const organizationDistances = educationScopeQuery.data?.organizations
  const resolveDistanceLabel = useCallback(
    (organizationApplicationId: string | undefined): string =>
      organizationApplicationId
        ? formatWaitingOrganizationDistance(organizationDistances, { organizationApplicationId })
        : '-',
    [organizationDistances]
  )
  /**
   * 기관형 배정 취소 팝업 분기 — GET …/volunteer-assignments 의 기관별 배정 알림 상태
   * (assignmentNotificationStatus). 조회 실패·구버전 응답(필드 없음)이면 판단 불가 → 기존 발송 후 시안.
   */
  const volunteerAssignmentsQuery = useQuery({
    queryKey: generalProgramProgressQueryKeys.volunteerAssignments(program.id, volunteer.id),
    queryFn: ({ signal }) => fetchGeneralVolunteerAssignments(program.id, volunteer.id, signal),
    enabled: remoteEnabled && isInstitutionSurface && Boolean(volunteer.id),
    staleTime: 15_000,
    retry: false,
  })
  const notificationByOrganization = useMemo(
    () =>
      volunteerAssignmentsQuery.data
        ? buildVolunteerAssignmentNotificationByOrganization(volunteerAssignmentsQuery.data)
        : null,
    [volunteerAssignmentsQuery.data]
  )
  /** 선택한(빠지는) 기관 중 배정 알림이 발송(SENT)된 기관이 있는지 — true 발송 후 / false 발송 전 / undefined 판단 불가 */
  const unassignNotificationSent = useMemo(
    () =>
      resolveVolunteerUnassignNotificationSent(
        assignedInstitutions
          .filter(row => selectedAssignedKeys.includes(row.id))
          .map(row => row.organizationApplicationId),
        notificationByOrganization
      ),
    [assignedInstitutions, notificationByOrganization, selectedAssignedKeys]
  )

  /** 표 셀 — 응답 전에는 비워 둔다('-'는 미산출 뜻이라 로딩 중에 보이면 값이 깜빡인다) */
  const distanceLoading = educationScopeQuery.isLoading
  const renderDistanceCell = useCallback(
    (organizationApplicationId: string | undefined): string =>
      distanceLoading ? '' : resolveDistanceLabel(organizationApplicationId),
    [distanceLoading, resolveDistanceLabel]
  )

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
      {
        title: '기관명',
        dataIndex: 'schoolName',
        key: 'schoolName',
        width: 200,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '담당 학년',
        dataIndex: 'educationGrade',
        key: 'educationGrade',
        width: 100,
        align: 'center',
      },
      {
        title: '기관 소재지',
        dataIndex: 'region',
        key: 'region',
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
        render: (_: unknown, record) => renderDistanceCell(record.organizationApplicationId),
      },
      {
        title: '담당 봉사 진행 일정',
        key: 'volunteerScheduleLines',
        width: 600,
        ...participatingScheduleTableColumnLayout(),
        render: (_: unknown, record) => renderVolunteerScheduleLines(record.volunteerScheduleLines),
      },
    ],
    [renderDistanceCell]
  )

  const waitingColumns: ColumnsType<VolunteerWaitingInstitutionRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      {
        title: '기관명',
        dataIndex: 'schoolName',
        key: 'schoolName',
        width: 180,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '희망 학년',
        dataIndex: 'desiredGrade',
        key: 'desiredGrade',
        width: 100,
        align: 'center',
      },
      {
        title: '기관 소재지',
        dataIndex: 'region',
        key: 'region',
        width: 180,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '자택과의 거리',
        dataIndex: 'distanceFromHome',
        key: 'distanceFromHome',
        width: 120,
        align: 'center',
        render: (_: unknown, record) => renderDistanceCell(record.organizationApplicationId),
      },
      {
        title: '봉사 진행 희망 일정',
        key: 'hopeScheduleLine',
        width: 560,
        ...participatingScheduleTableColumnLayout(),
        render: (_: unknown, record) => renderHopeScheduleLine(record.hopeScheduleLine),
      },
      {
        title: '배정 현황',
        dataIndex: 'assignmentStatus',
        key: 'assignmentStatus',
        width: 120,
        align: 'center',
        render: (status: VolunteerWaitingAssignmentStatus) => (
          <ProgramAssignmentStatusText status={status} context="institution-volunteer" />
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
    [renderDistanceCell]
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
        id: row.id,
        no: row.no,
        schoolName: row.schoolName,
        educationGrade: row.educationGrade,
        region: row.region,
        distanceFromHome: resolveDistanceLabel(row.organizationApplicationId),
        volunteerSchedule: row.volunteerScheduleLines.join('\n'),
      })),
    [assignedInstitutions, resolveDistanceLabel]
  )

  const waitingExportRows = useMemo(
    () =>
      waitingInstitutions.map(row => ({
        id: row.id,
        no: row.no,
        schoolName: row.schoolName,
        desiredGrade: row.desiredGrade,
        region: row.region,
        distanceFromHome: resolveDistanceLabel(row.organizationApplicationId),
        hopeSchedule: row.hopeScheduleLine,
        assignmentStatus: WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS[row.assignmentStatus],
        assignedVolunteerCountLabel: row.assignedVolunteerCountLabel,
      })),
    [waitingInstitutions, resolveDistanceLabel]
  )

  const { exportExcel: exportAssignedExcel, isExporting: isAssignedExcelExporting } =
    useTableExcelExport({
      accessLog: { downloadKind: 'PROGRAM_PERSON_ASSIGNMENT_EXPORT', containedPiiTypes: [] },
      columns: assignedExportColumns,
      data: assignedExportRows,
      filename: '배정된 기관 목록',
      selectedRowKeys: selectedAssignedKeys,
    })

  const { exportExcel: exportWaitingExcel, isExporting: isWaitingExcelExporting } =
    useTableExcelExport({
      accessLog: { downloadKind: 'PROGRAM_PERSON_ASSIGNMENT_EXPORT', containedPiiTypes: [] },
      columns: waitingExportColumns,
      data: waitingExportRows,
      filename: '배정 대기 기관 목록',
      selectedRowKeys: selectedWaitingKeys,
    })

  const handleUnassignClick = useCallback(() => {
    if (assignedInstitutions.length === 0) return
    if (selectedAssignedKeys.length === 0) {
      showAlert(NO_SELECTION_ALERT)
      return
    }
    setUnassignConfirmOpen(true)
  }, [assignedInstitutions.length, selectedAssignedKeys.length, showAlert])

  const handleSelectAssignClick = useCallback(() => {
    if (selectedWaitingKeys.length === 0) {
      showAlert(NO_SELECTION_ALERT)
      return
    }
    const movable = waitingInstitutions.some(
      w => selectedWaitingKeys.includes(w.id) && w.assignmentStatus === 'waiting'
    )
    if (!movable) return
    setSelectAssignConfirmOpen(true)
  }, [selectedWaitingKeys, waitingInstitutions, showAlert])

  const persistAssignedOrganizations = useCallback(
    async (
      nextAssigned: VolunteerAssignedInstitutionRow[],
      reason: string,
      notification?: VolunteerAssignmentNotificationTiming
    ): Promise<boolean> => {
      if (!remoteEnabled) {
        notifyProgramApiUnavailable(
          'general-progress-volunteer-assigned-organizations',
          '참여 봉사자 · 기관 배정'
        )
        return false
      }
      const organizationApplicationIds = resolveVolunteerAssignedOrganizationApplicationIds(
        nextAssigned,
        schoolRows
      )
      if (organizationApplicationIds.length !== nextAssigned.length) {
        showAlert({
          title: '배정 실패',
          content: '기관 신청 ID가 없어 봉사 배정을 저장할 수 없습니다.',
        })
        return false
      }
      try {
        await saveGeneralVolunteerAssignedOrganizations(program.id, volunteer.id, {
          organizationApplicationIds,
          expectedRevision: assignedInstitutions.length,
          reason: reason.trim() || '봉사 배정',
          ...(notification ? { notification } : {}),
        })
        await queryClient.invalidateQueries({
          queryKey: generalProgramProgressQueryKeys.volunteers(program.id),
        })
        await queryClient.invalidateQueries({
          queryKey: generalProgramProgressQueryKeys.institutions(program.id),
        })
        await queryClient.invalidateQueries({
          queryKey: generalProgramProgressQueryKeys.volunteerAssignments(program.id, volunteer.id),
        })
        return true
      } catch (error) {
        showAlert({
          title: '배정 실패',
          content:
            // 400 INVALID_NOTIFICATION_SCHEDULE(예약 시각 오류) — 최소 허용 시각 안내
            getNotificationTimingApiErrorMessage(error) ??
            getGeneralProgramApiErrorMessage(
              error,
              '봉사 배정을 저장하지 못했습니다. 다시 시도해 주세요.'
            ),
        })
        return false
      }
    },
    [
      assignedInstitutions.length,
      program.id,
      queryClient,
      remoteEnabled,
      schoolRows,
      showAlert,
      volunteer.id,
    ]
  )

  const handleUnassignConfirm = useCallback(
    (payload: PermissionModalPayload) => {
      if (selectedAssignedKeys.length === 0) return
      const removedRows = assignedInstitutions.filter(r => selectedAssignedKeys.includes(r.id))
      const removedSchoolNames = removedRows.map(r => r.schoolName)
      const removedSchoolIds = new Set(removedRows.map(r => r.id.split('__assigned')[0] ?? r.id))
      const toRemove = new Set(selectedAssignedKeys.map(String))
      const nextAssigned = renumberVolunteerAssignedRows(
        assignedInstitutions.filter(r => !toRemove.has(r.id))
      )
      // 빠지는 기관 알림이 발송 후(또는 판단 불가 — 팝업에 시점 입력이 보인 경우)만 notification을 보낸다.
      // 발송 전이면 생략 — BE가 예약 알림만 중단하고 취소 알림은 보내지 않는다.
      const notification =
        isInstitutionSurface && unassignNotificationSent !== false
          ? toVolunteerAssignmentNotificationTiming(payload.notifyTiming, payload.manualNotifyAt)
          : undefined
      void (async () => {
        const saved = await persistAssignedOrganizations(nextAssigned, payload.reason, notification)
        if (!saved) return
        setAssignedInstitutions(nextAssigned)
        setWaitingInstitutions(prev =>
          renumberVolunteerWaitingRows(prev.filter(w => !removedSchoolIds.has(w.schoolId)))
        )
        setUnassignConfirmOpen(false)
        setSelectedAssignedKeys([])
        if (isInstitutionSurface) {
          // Figma 07-2/06-3 「취소 완료」
          showAlert({ title: '취소 완료', content: '취소되었습니다.' })
          return
        }
        setUnassignCompleteModal({
          volunteerNames: [volunteer.volunteerName],
          targetNames: removedSchoolNames,
          reason: payload.reason,
        })
      })()
    },
    [
      isInstitutionSurface,
      showAlert,
      assignedInstitutions,
      persistAssignedOrganizations,
      selectedAssignedKeys,
      unassignNotificationSent,
      volunteer.volunteerName,
    ]
  )

  const handleSelectAssignConfirm = useCallback(() => {
    const selectedRows = waitingInstitutions.filter(
      w => selectedWaitingKeys.includes(w.id) && w.assignmentStatus === 'waiting'
    )
    if (selectedRows.length === 0) return

    const ids = new Set(selectedRows.map(r => r.id))
    const nextAssigned = (() => {
      const next = [...assignedInstitutions]
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
    })()

    const first = selectedRows[0]
    const completeInfo = first
      ? {
          institutionName: first.schoolName,
          extraTargetCount: Math.max(0, selectedRows.length - 1),
          countLine: buildVolunteerAssignCompleteCountLine(first.assignedVolunteerCountLabel),
        }
      : null

    void (async () => {
      const saved = await persistAssignedOrganizations(nextAssigned, '봉사 배정')
      if (!saved) return
      setWaitingInstitutions(prev => renumberVolunteerWaitingRows(prev.filter(w => !ids.has(w.id))))
      setAssignedInstitutions(nextAssigned)
      setSelectAssignConfirmOpen(false)
      setSelectedWaitingKeys([])
      if (isInstitutionSurface && completeInfo) setAssignCompleteModal(completeInfo)
    })()
  }, [
    isInstitutionSurface,
    assignedInstitutions,
    persistAssignedOrganizations,
    program,
    schoolRows,
    selectedWaitingKeys,
    volunteer,
    waitingInstitutions,
  ])

  const closeAddAssignModal = useCallback(() => {
    if (addAssignInFlightRef.current) return
    setAddAssignModalOpen(false)
    setAddAssignSchoolId(null)
    setAddAssignWaitingRowId(null)
  }, [])

  const handleAddAssignConfirm = useCallback(() => {
    if (addAssignInFlightRef.current) return
    if (!addAssignSchoolId) {
      showAlert(NO_SELECTION_ALERT)
      return
    }
    if (!addAssignWaitingRowId) {
      showAlert({ title: ADD_ASSIGN_MODAL_TITLE, content: '봉사 배정일을 선택해 주세요.' })
      return
    }
    const waitingRow = waitingInstitutions.find(w => w.id === addAssignWaitingRowId)
    if (
      !waitingRow ||
      waitingRow.assignmentStatus !== 'waiting' ||
      waitingRow.schoolId !== addAssignSchoolId
    ) {
      return
    }

    const school = schoolRows.find(s => s.id === waitingRow.schoolId)
    if (!school) return

    const alreadyAssigned = assignedInstitutions.some(r =>
      r.id.startsWith(`${school.id}__assigned`)
    )
    const nextAssigned = alreadyAssigned
      ? assignedInstitutions
      : renumberVolunteerAssignedRows([
          ...assignedInstitutions,
          schoolRowToVolunteerAssignedRow(
            school,
            volunteer,
            0,
            assignedInstitutions.length,
            program
          ),
        ])

    addAssignInFlightRef.current = true
    setAddAssignSubmitting(true)
    void (async () => {
      try {
        const saved = await persistAssignedOrganizations(nextAssigned, '봉사 배정')
        if (!saved) return
        setWaitingInstitutions(prev =>
          renumberVolunteerWaitingRows(prev.filter(w => w.id !== addAssignWaitingRowId))
        )
        setAssignedInstitutions(nextAssigned)
        setAddAssignModalOpen(false)
        setAddAssignSchoolId(null)
        setAddAssignWaitingRowId(null)
        if (isInstitutionSurface) {
          setAssignCompleteModal({
            institutionName: waitingRow.schoolName,
            extraTargetCount: 0,
            countLine: buildVolunteerAssignCompleteCountLine(waitingRow.assignedVolunteerCountLabel),
          })
        }
      } finally {
        addAssignInFlightRef.current = false
        setAddAssignSubmitting(false)
      }
    })()
  }, [
    addAssignSchoolId,
    addAssignWaitingRowId,
    assignedInstitutions,
    isInstitutionSurface,
    persistAssignedOrganizations,
    program,
    schoolRows,
    showAlert,
    volunteer,
    waitingInstitutions,
  ])

  /** 추가 배정 모달(기관 추가 배정 안내) — 기관명 옵션 + 기관별 봉사 일정 칩 */
  const addAssignInstitutionChoices = useMemo(
    () => buildVolunteerInstitutionAddAssignOptions(waitingInstitutions),
    [waitingInstitutions]
  )
  const addAssignSessionOptions = useMemo(
    () =>
      (addAssignSchoolId
        ? addAssignInstitutionChoices.sessionOptionsBySchoolId.get(addAssignSchoolId)
        : undefined) ?? [],
    [addAssignInstitutionChoices, addAssignSchoolId]
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
      assignedInstitutions.filter(r => selectedAssignedKeys.includes(r.id)).map(r => r.schoolName),
    [assignedInstitutions, selectedAssignedKeys]
  )

  /** 선택 배정 안내 — 첫 기관 + 외 N개 */
  const selectAssignTargets = useMemo(
    () =>
      waitingInstitutions.filter(
        w => selectedWaitingKeys.includes(w.id) && w.assignmentStatus === 'waiting'
      ),
    [waitingInstitutions, selectedWaitingKeys]
  )

  return (
    <div className="participating-volunteer-assignment-section school-detail-fullpage-view__instructor-tab">
      <div className="school-detail-fullpage-view__instructor-section">
        <div className="table-header-actions">
          <div className="table-header-title--wrapper">
            <span className="table-title">배정된 기관 목록</span>
            <span className="table-description">
              {isInstitutionSurface ? '총 ' : ''}
              {assignedInstitutions.length}건
            </span>
          </div>
          <div className="info-section-buttons--wrapper">
            <CmsButton
              variant="delete"
              size="h40"
              disabled={assignedInstitutions.length === 0}
              onClick={handleUnassignClick}
            >
              배정 취소
            </CmsButton>
            <CmsButton
              variant="secondary"
              size="h40"
              onClick={() => {
                if (addAssignOptions.length === 0) {
                  showAlert({ title: '추가 배정 안내', content: '배정 대기 기관이 없습니다.' })
                  return
                }
                const firstRowId = addAssignOptions[0]?.value ?? null
                setAddAssignWaitingRowId(firstRowId)
                setAddAssignSchoolId(
                  waitingInstitutions.find(w => w.id === firstRowId)?.schoolId ?? null
                )
                setAddAssignModalOpen(true)
              }}
            >
              추가 배정
            </CmsButton>
            <ExcelButton onClick={exportAssignedExcel} loading={isAssignedExcelExporting} />
          </div>
        </div>
        <div className="participating-institutions-section__table-wrap school-detail-fullpage-view__assignment-table-scroll">
          {assignedInstitutions.length === 0 && isInstitutionSurface ? (
            <AssignmentListEmpty {...ASSIGNED_INSTITUTIONS_EMPTY_COPY} />
          ) : assignedInstitutions.length === 0 ? (
            <div
              className="school-detail-fullpage-view__instructor-list-empty"
              role="status"
              aria-label="배정된 기관 없음"
            >
              배정된 기관이 없습니다.
            </div>
          ) : (
            <CmsDataTable<VolunteerAssignedInstitutionRow>
              className="participating-institutions-section__table cms-data-table"
              rowKey="id"
              size="middle"
              pagination={false}
              tableLayout="fixed"
              scroll={{ x: ASSIGNMENT_TABLE_SCROLL_X }}
              rowSelection={{
                columnWidth: ASSIGNMENT_CHECKBOX_COLUMN_WIDTH,
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
            <span className="table-description">
              {isInstitutionSurface ? '총 ' : ''}
              {waitingInstitutions.length}건
            </span>
          </div>
          <div className="info-section-buttons--wrapper">
            <CmsButton
              variant="secondary"
              size="h40"
              disabled={isInstitutionSurface && waitingInstitutions.length === 0}
              onClick={handleSelectAssignClick}
            >
              선택 배정
            </CmsButton>
            <ExcelButton onClick={exportWaitingExcel} loading={isWaitingExcelExporting} />
          </div>
        </div>
        <div className="participating-institutions-section__table-wrap school-detail-fullpage-view__waiting-table-scroll">
          {waitingInstitutions.length === 0 && isInstitutionSurface ? (
            <AssignmentListEmpty {...WAITING_INSTITUTIONS_EMPTY_COPY} />
          ) : waitingInstitutions.length === 0 ? (
            <div
              className="school-detail-fullpage-view__instructor-list-empty"
              role="status"
              aria-label="배정 대기 기관 없음"
            >
              배정 대기 중인 기관이 없습니다.
            </div>
          ) : (
            <CmsDataTable<VolunteerWaitingInstitutionRow>
              className="participating-institutions-section__table cms-data-table"
              rowKey="id"
              size="middle"
              pagination={false}
              tableLayout="fixed"
              scroll={{ x: ASSIGNMENT_TABLE_SCROLL_X }}
              rowSelection={{
                columnWidth: ASSIGNMENT_CHECKBOX_COLUMN_WIDTH,
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
                  ? 'participating-volunteer-assignment-section__row--unavailable'
                  : ''
              }
            />
          )}
        </div>
      </div>

      {isInstitutionSurface ? (
        <VolunteerInstitutionUnassignConfirmModal
          open={unassignConfirmOpen}
          onCancel={() => setUnassignConfirmOpen(false)}
          targetNames={unassignSchoolNames}
          notificationSent={unassignNotificationSent}
          onConfirm={handleUnassignConfirm}
        />
      ) : (
        <ParticipatingVolunteerUnassignConfirmModal
          open={unassignConfirmOpen}
          onCancel={() => setUnassignConfirmOpen(false)}
          volunteerNames={[volunteer.volunteerName]}
          targetNames={unassignSchoolNames}
          onConfirm={handleUnassignConfirm}
        />
      )}
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
        onConfirm={handleSelectAssignConfirm}
        targetNoun="기관"
        institutionName={selectAssignTargets[0]?.schoolName ?? ''}
        extraTargetCount={Math.max(0, selectAssignTargets.length - 1)}
        instructorName={volunteer.volunteerName}
        currentCount={null}
        requiredCount={null}
        countLabel={selectAssignTargets[0]?.assignedVolunteerCountLabel ?? null}
      />

      <InstitutionAssignCompleteModal
        open={assignCompleteModal != null}
        onClose={() => setAssignCompleteModal(null)}
        variant="result"
        institutionName={assignCompleteModal?.institutionName ?? ''}
        instructorName={volunteer.volunteerName}
        extraTargetCount={assignCompleteModal?.extraTargetCount ?? 0}
        countLine={assignCompleteModal?.countLine ?? null}
      />

      <GeneralParticipantAddAssignModal
        open={addAssignModalOpen}
        onCancel={closeAddAssignModal}
        title={ADD_ASSIGN_MODAL_TITLE}
        description={`**[${volunteer.volunteerName}]** 님을 추가 배정할 기관을 선택해 주세요.`}
        onConfirm={handleAddAssignConfirm}
        confirmLoading={addAssignSubmitting}
        target={{
          label: '기관명',
          placeholder: '배정할 기관을 선택해 주세요',
          options: addAssignInstitutionChoices.institutionOptions,
          value: addAssignSchoolId,
          onChange: setAddAssignSchoolId,
        }}
        sessions={{
          label: isInstitutionSurface ? '교육 배정일 선택' : '봉사 배정일 선택',
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
