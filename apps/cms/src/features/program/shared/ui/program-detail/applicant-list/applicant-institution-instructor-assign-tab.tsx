/**
 * 신청자 목록 > 신청 기관 상세 — 강사 배정 현황 탭 (API only, mock 없음)
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { InstructorSettlementStatusText } from '@/shared/ui/instructor-settlement-status-text'
import type { SettlementStatusKey } from '@/features/program/general/model/participating-instructors'
import { WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS } from '@/features/program/general/lib/waiting-instructor-assignment'
import { INSTRUCTOR_ROLE_LABELS, type InstructorRoleKey } from '@/features/program/general/model/school-detail-types'
import { shouldUseCompanySchoolApplicationsRemoteApi } from '@/features/program/1c-1s/api/capabilities'
import { companySchoolQueryKeys } from '@/features/program/1c-1s/api/query-keys'
import { fetchCompanySchoolAssignmentBoard } from '@/features/program/1c-1s/api/instructor-assignment-conflict-service'
import {
  buildCompanySchoolAssignedInstructorRows,
  buildCompanySchoolWaitingInstructorRows,
  type CompanySchoolAssignedInstructorRow,
  type CompanySchoolWaitingInstructorRow,
} from '@/features/program/1c-1s/lib/build-company-school-assignment-rows'
import { fetchOrganizationApplicationRequestedSchedulesRemote } from '@/features/program/general/api/applications-api-client'
import { mapRequestedSchedulesToSessions } from '@/features/program/1c-1s/lib/map-requested-schedules'
import '@/features/program/general/ui/detail-modal/program-status/instructor-assignment-role-tag.css'
import '@/features/program/general/ui/detail-modal/program-status/instructor-assignment-status-text.css'
import '@/features/program/general/ui/detail-modal/program-status/school-detail-fullpage-view.css'

function TdDivider() {
  return <span className="school-detail-fullpage-view__td-divider" aria-hidden />
}

export interface ApplicantInstitutionInstructorAssignTabProps {
  programId: string
  organizationApplicationId: string
  schoolName: string
}

export function ApplicantInstitutionInstructorAssignTab({
  programId,
  organizationApplicationId,
  schoolName,
}: ApplicantInstitutionInstructorAssignTabProps) {
  const remoteEnabled = shouldUseCompanySchoolApplicationsRemoteApi()

  const boardQuery = useQuery({
    queryKey: companySchoolQueryKeys.instructorAssignmentConflicts(programId),
    queryFn: () => fetchCompanySchoolAssignmentBoard(programId),
    enabled: remoteEnabled && Boolean(programId),
    staleTime: 30_000,
  })

  const schedulesQuery = useQuery({
    queryKey: [...companySchoolQueryKeys.all, 'org-requested-schedules', organizationApplicationId],
    queryFn: () => fetchOrganizationApplicationRequestedSchedulesRemote(organizationApplicationId),
    enabled: remoteEnabled && Boolean(organizationApplicationId),
    staleTime: 30_000,
  })

  const sessions = useMemo(
    () => mapRequestedSchedulesToSessions(schedulesQuery.data) ?? [],
    [schedulesQuery.data]
  )

  const assignedRows = useMemo(() => {
    if (!boardQuery.data || !organizationApplicationId) return []
    return buildCompanySchoolAssignedInstructorRows({
      assignments: boardQuery.data.assignments,
      organizationApplicationId,
      instructorNameByMemberId: boardQuery.data.instructorNameByMemberId,
      scheduleLabelById: boardQuery.data.scheduleLabelById,
    })
  }, [boardQuery.data, organizationApplicationId])

  const waitingRows = useMemo(() => {
    if (!boardQuery.data) return []
    const assignedMemberIds = new Set<string>()
    for (const a of boardQuery.data.assignments) {
      if (
        a.organizationApplicationId != null &&
        String(a.organizationApplicationId) === organizationApplicationId &&
        a.instructorMemberId != null
      ) {
        assignedMemberIds.add(String(a.instructorMemberId))
      }
    }
    return buildCompanySchoolWaitingInstructorRows({
      schoolName,
      sessions,
      approvedInstructors: boardQuery.data.approvedInstructorApplications,
      assignedInstructorMemberIds: assignedMemberIds,
      occupiedLectureDatesByInstructorId: boardQuery.data.occupiedLectureDatesByInstructorId,
    })
  }, [boardQuery.data, organizationApplicationId, schoolName, sessions])

  const assignedColumns: ColumnsType<CompanySchoolAssignedInstructorRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      {
        title: '역할',
        dataIndex: 'role',
        key: 'role',
        width: 100,
        align: 'center',
        render: (role: InstructorRoleKey) => (
          <span
            className={
              role === 'lead'
                ? 'school-detail-fullpage-view__role-tag school-detail-fullpage-view__role-tag--lead'
                : 'school-detail-fullpage-view__role-tag school-detail-fullpage-view__role-tag--assistant'
            }
          >
            {INSTRUCTOR_ROLE_LABELS[role]}
          </span>
        ),
      },
      { title: '강사명', dataIndex: 'instructorName', key: 'instructorName', width: 100 },
      {
        title: '자택 주소',
        dataIndex: 'homeAddress',
        key: 'homeAddress',
        width: 160,
        render: (v: string | undefined) => v ?? '-',
      },
      {
        title: '기관과의 거리',
        dataIndex: 'distanceToSchool',
        key: 'distanceToSchool',
        width: 100,
        align: 'center',
        render: (v: string | undefined) => v ?? '-',
      },
      {
        title: '교육 담당 날짜',
        dataIndex: 'assignedDate',
        key: 'assignedDate',
        width: 140,
        align: 'center',
        render: (v: string | undefined) => v ?? '-',
      },
      {
        title: '교육 담당 수업 시간',
        dataIndex: 'assignedTime',
        key: 'assignedTime',
        width: 180,
        render: (v: string | undefined) => v ?? '-',
      },
      {
        title: '교육 담당 차시',
        dataIndex: 'assignedSession',
        key: 'assignedSession',
        width: 100,
        align: 'center',
        render: (v: string | undefined) => v ?? '-',
      },
      {
        title: '정산 현황',
        key: 'settlementStatus',
        width: 120,
        align: 'center',
        render: () => <InstructorSettlementStatusText status={'none' as SettlementStatusKey} />,
      },
    ],
    []
  )

  const waitingColumns: ColumnsType<CompanySchoolWaitingInstructorRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 80, align: 'center' },
      { title: '강사명', dataIndex: 'instructorName', key: 'instructorName', width: 100 },
      {
        title: '기관과의 거리',
        dataIndex: 'distanceToSchool',
        key: 'distanceToSchool',
        width: 100,
        align: 'center',
        render: (v: string | undefined) => v ?? '-',
      },
      {
        title: '배정 현황',
        dataIndex: 'assignmentStatus',
        key: 'assignmentStatus',
        width: 100,
        align: 'center',
        render: (status: CompanySchoolWaitingInstructorRow['assignmentStatus']) =>
          WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS[status],
      },
      {
        title: '희망 일정',
        key: 'hope',
        render: (_: unknown, record: CompanySchoolWaitingInstructorRow) => {
          const parts = [record.hopeDate, record.hopeTime, record.hopeSession].filter(Boolean)
          if (parts.length === 0) return '-'
          return (
            <span>
              {parts.map((part, i) => (
                <span key={`${record.id}-${i}`}>
                  {i > 0 ? <TdDivider /> : null}
                  {part}
                </span>
              ))}
            </span>
          )
        },
      },
    ],
    []
  )

  if (!remoteEnabled) {
    return (
      <div className="extra-tab-content school-detail-fullpage-view__instructor-tab applicant-institution-assign-tab">
        <p role="status">
          1사1교 강사 배정은 API만 사용합니다. `VITE_COMPANY_SCHOOL_PROGRAMS_REMOTE_ENABLED=true`와
          applications·programProgress 모듈, API 로그인을 확인해 주세요.
        </p>
      </div>
    )
  }

  return (
    <div className="extra-tab-content school-detail-fullpage-view__instructor-tab applicant-institution-assign-tab">
      <h4 className="school-detail-fullpage-view__section-title">배정된 강사</h4>
      <Table
        rowKey="id"
        size="small"
        pagination={false}
        loading={boardQuery.isFetching}
        columns={assignedColumns}
        dataSource={assignedRows}
        locale={{ emptyText: '배정된 강사가 없습니다.' }}
      />
      <h4 className="school-detail-fullpage-view__section-title">배정 대기 강사</h4>
      <Table
        rowKey="id"
        size="small"
        pagination={false}
        loading={boardQuery.isFetching || schedulesQuery.isFetching}
        columns={waitingColumns}
        dataSource={waitingRows}
        rowClassName={record =>
          record.assignmentStatus === 'unavailable'
            ? 'school-detail-fullpage-view__waiting-row--unavailable'
            : ''
        }
        locale={{ emptyText: '배정 대기 중인 강사가 없습니다.' }}
      />
    </div>
  )
}
