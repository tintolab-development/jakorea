/**
 * 신청자 목록 > 신청 기관 상세 — 강사 배정 현황 탭 (읽기 전용, 참여 기관 풀페이지와 동일 목 데이터)
 */

import { useMemo } from 'react'
import { Table } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  MOCK_PARTICIPATING_INSTRUCTORS,
  type SettlementStatusKey,
} from '@/data/mock/participating-instructors'
import { MOCK_PARTICIPATING_SCHOOLS } from '@/data/mock/participating-schools'
import { InstructorSettlementStatusText } from '@/shared/ui/instructor-settlement-status-text'
import {
  getAssignedInstructorDisplayRows,
  getInstructorRowsForSchool,
  getWaitingInstructorRows,
  type AssignedInstructorDisplayRowMock,
} from '@/features/program/general/lib/school-detail-mock'
import { WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS } from '@/features/program/general/lib/waiting-instructor-assignment'
import { INSTRUCTOR_ROLE_LABELS, type InstructorRoleKey } from '@/features/program/general/model/school-detail-types'
import '@/features/program/general/ui/detail-modal/program-status/instructor-assignment-role-tag.css'
import '@/features/program/general/ui/detail-modal/program-status/instructor-assignment-status-text.css'
import '@/features/program/general/ui/detail-modal/program-status/school-detail-fullpage-view.css'

const MOCK_REQUIRED_INSTRUCTORS = 4

type WaitingRow = ReturnType<typeof getWaitingInstructorRows>[number]

function TdDivider() {
  return <span className="school-detail-fullpage-view__td-divider" aria-hidden />
}

export interface ApplicantInstitutionInstructorAssignTabProps {
  schoolName: string
}

export function ApplicantInstitutionInstructorAssignTab({
  schoolName,
}: ApplicantInstitutionInstructorAssignTabProps) {
  const assignedRows = useMemo(() => {
    const rows = getInstructorRowsForSchool(schoolName, MOCK_PARTICIPATING_INSTRUCTORS)
    return getAssignedInstructorDisplayRows(rows)
  }, [schoolName])

  const waitingRows = useMemo(
    () => getWaitingInstructorRows(schoolName, MOCK_PARTICIPATING_INSTRUCTORS, MOCK_PARTICIPATING_SCHOOLS),
    [schoolName]
  )

  const assignedColumns: ColumnsType<AssignedInstructorDisplayRowMock> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 64, align: 'center' },
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
        dataIndex: 'settlementStatus',
        key: 'settlementStatus',
        width: 120,
        align: 'center',
        render: (status: SettlementStatusKey) => (
          <InstructorSettlementStatusText status={status} />
        ),
      },
    ],
    []
  )

  const waitingColumns: ColumnsType<WaitingRow> = useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 64, align: 'center' },
      { title: '강사명', dataIndex: 'instructorName', key: 'instructorName', width: 100 },
      {
        title: '자택 주소지',
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
        title: '교육 진행 희망 일정',
        dataIndex: 'hopeDate',
        key: 'hopeDate',
        width: 300,
        align: 'center',
        render: (v: string | undefined, record: WaitingRow) => {
          const date = v ?? '-'
          const time = record.hopeTime ?? '-'
          const session = record.hopeSession
          if (date === '-' && time === '-') return '-'
          const dateTime =
            date !== '-' && time !== '-'
              ? `${date} ${time}`
              : date !== '-'
                ? date
                : time
          if (!session) return dateTime
          return (
            <span className="school-detail-fullpage-view__assigned-datetime-cell">
              <span>{dateTime}</span>
              <TdDivider />
              <span>{session}</span>
            </span>
          )
        },
      },
      {
        title: '배정 현황',
        dataIndex: 'assignmentStatus',
        key: 'assignmentStatus',
        width: 100,
        align: 'center',
        render: (status: WaitingRow['assignmentStatus']) => (
          <span
            className={`school-detail-fullpage-view__assignment-status school-detail-fullpage-view__assignment-status--${status}`}
          >
            {WAITING_INSTRUCTOR_ASSIGNMENT_STATUS_LABELS[status]}
          </span>
        ),
      },
    ],
    []
  )

  return (
    <div className="extra-tab-content school-detail-fullpage-view__instructor-tab applicant-institution-assign-tab">
      <div className="school-detail-fullpage-view__instructor-section">
        <div className="table-header-actions">
          <div className="table-header-title--wrapper">
            <span className="table-title">
              배정된 강사 목록
            </span>
            <span className="table-description">
              {assignedRows.length} / {MOCK_REQUIRED_INSTRUCTORS}명
            </span>
          </div>
        </div>
        <div className="participating-institutions-section__table-wrap">
          {assignedRows.length === 0 ? (
            <div
              className="school-detail-fullpage-view__instructor-list-empty"
              role="status"
              aria-label="배정된 강사 없음"
            >
              배정된 강사가 없습니다.
            </div>
          ) : (
            <Table<AssignedInstructorDisplayRowMock>
              className="participating-institutions-section__table cms-data-table"
              rowKey="id"
              size="middle"
              pagination={false}
              scroll={{ x: 1100 }}
              columns={assignedColumns}
              dataSource={assignedRows}
            />
          )}
        </div>
      </div>

      <div className="school-detail-fullpage-view__instructor-section school-detail-fullpage-view__instructor-section--waiting">
        <div className="table-header-actions">
          <div className="table-header-title--wrapper">
            <span className="table-title">
              배정 대기 강사 목록
            </span>
            <span className="table-description">
              {waitingRows.length}건
            </span>
          </div>
        </div>
        <div className="participating-institutions-section__table-wrap">
          {waitingRows.length === 0 ? (
            <div
              className="school-detail-fullpage-view__instructor-list-empty"
              role="status"
              aria-label="배정 대기 강사 없음"
            >
              배정 대기 중인 강사가 없습니다.
            </div>
          ) : (
            <Table<WaitingRow>
              className="participating-institutions-section__table cms-data-table"
              rowKey="id"
              size="middle"
              pagination={false}
              scroll={{ x: 1000 }}
              columns={waitingColumns}
              dataSource={waitingRows}
              rowClassName={record =>
                record.assignmentStatus === 'unavailable'
                  ? 'school-detail-fullpage-view__waiting-row--unavailable'
                  : ''
              }
            />
          )}
        </div>
      </div>
    </div>
  )
}
