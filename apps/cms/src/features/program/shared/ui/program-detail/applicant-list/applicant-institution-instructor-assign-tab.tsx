import { getProgramAssignmentRowClass } from '@/features/program/general/lib/assignment-status-presentation'
import { ProgramAssignmentStatusText } from '@/features/program/shared/ui/program-assignment-status-text'
/**
 * 신청자 목록 > 신청 기관 상세 — 강사 배정 현황 탭 (API only, mock 없음)
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CmsDataTable } from '@/shared/ui/cms-data-table'
import type { ColumnsType } from 'antd/es/table'
import { InstructorSettlementStatusText } from '@/shared/ui/instructor-settlement-status-text'
import type { SettlementStatusKey } from '@/features/program/general/model/participating-instructors'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import type { InstructorRoleKey } from '@/features/program/general/model/school-detail-types'
import { shouldUseCompanySchoolApplicationsRemoteApi } from '@/features/program/1c-1s/api/capabilities'
import { companySchoolQueryKeys } from '@/features/program/1c-1s/api/query-keys'
import { fetchCompanySchoolAssignmentBoard } from '@/features/program/1c-1s/api/instructor-assignment-conflict-service'
import {
  buildCompanySchoolAssignedInstructorRows,
  buildCompanySchoolWaitingInstructorRows,
  omitCompanySchoolScheduleRoundLabels,
  type CompanySchoolAssignedInstructorRow,
  type CompanySchoolWaitingInstructorRow,
} from '@/features/program/1c-1s/lib/build-company-school-assignment-rows'
import { organizationRequestedSchedulesQueryOptions } from '@/features/program/general/api/organization-requested-schedules-query'
import { mapRequestedSchedulesToSessions } from '@/features/program/1c-1s/lib/map-requested-schedules'
import { StatusTag } from '@/shared/components/status-tag'
import { getInstructorRoleTag } from '@/shared/lib/status-tag-specs'
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
    ...organizationRequestedSchedulesQueryOptions(organizationApplicationId),
    enabled: remoteEnabled && Boolean(organizationApplicationId),
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
      // 1사1교는 회차가 없다 — sessionNo 「N회차」를 배정 일정에 붙이지 않는다
      scheduleLabelById: omitCompanySchoolScheduleRoundLabels(boardQuery.data.scheduleLabelById),
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
      // 1사1교 희망 일정 번호는 지망 순위다 — 「N회차」가 아니라 「N지망」
      hopeSessionLabel: 'preference-only',
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
        render: (role: InstructorRoleKey) => <StatusTag {...getInstructorRoleTag(role)} />,
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
        render: (status: CompanySchoolWaitingInstructorRow['assignmentStatus']) => (
          <ProgramAssignmentStatusText status={status} context="company-school-applicant" />
        ),
      },
      {
        title: '희망 일정',
        key: 'hope',
        render: (_: unknown, record: CompanySchoolWaitingInstructorRow) => {
          const parts = [
            record.hopeDate ? formatCmsScheduleDisplayLabel(record.hopeDate) : '',
            record.hopeTime,
            record.hopeSession,
          ].filter(Boolean)
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
      <CmsDataTable
        rowKey="id"
        size="small"
        pagination={false}
        loading={boardQuery.isFetching}
        columns={assignedColumns}
        dataSource={assignedRows}
        locale={{ emptyText: '배정된 강사가 없습니다.' }}
      />
      <h4 className="school-detail-fullpage-view__section-title">배정 대기 강사</h4>
      <CmsDataTable
        rowKey="id"
        size="small"
        pagination={false}
        loading={boardQuery.isFetching || schedulesQuery.isFetching}
        columns={waitingColumns}
        dataSource={waitingRows}
        rowClassName={record => getProgramAssignmentRowClass(record.assignmentStatus, "company-school-applicant")}
        locale={{ emptyText: '배정 대기 중인 강사가 없습니다.' }}
      />
    </div>
  )
}
