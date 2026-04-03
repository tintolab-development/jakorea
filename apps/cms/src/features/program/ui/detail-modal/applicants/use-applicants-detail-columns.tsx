import { useMemo } from 'react'
import type { ColumnsType } from 'antd/es/table'
import {
  ApprovalStatusBadge,
  type ApprovalStatusKey,
} from '@/shared/components/approval-status-badge'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
} from '@/shared/components/status-dropdown-cell'
import type { ApplicantInstructorRow } from '@/data/mock/applicant-instructors'
import type { ApplicantSchoolRow } from '@/data/mock/applicant-institutions'
import type { ApplicantSessionLineInput } from './applicants-detail-session-format'

export function useInstitutionApplicantColumns(params: {
  setSelectedItem: (record: ApplicantSchoolRow) => void
  approvalStatusKeys: ApprovalStatusKey[]
  getSessionLineParts: (s: ApplicantSessionLineInput) => {
    datePart: string
    durationPart: string
    periodPart: string
  }
  handleInstitutionApprovalStatusChange: (recordId: string, status: ApprovalStatusKey) => void
  openApprovalDropdownId: string | null
  setOpenApprovalDropdownId: (id: string | null) => void
}): ColumnsType<ApplicantSchoolRow> {
  const {
    setSelectedItem,
    approvalStatusKeys,
    getSessionLineParts,
    handleInstitutionApprovalStatusChange,
    openApprovalDropdownId,
    setOpenApprovalDropdownId,
  } = params

  return useMemo(
    () => [
      /* 화면 너비 대비 비율 분배(합 100%). 가로 스크롤은 scroll.x = max(최소, 래퍼 너비)로 처리 */
      { title: 'No.', dataIndex: 'no', key: 'no', width: '4%', align: 'center' },
      {
        title: '참여 기관명',
        dataIndex: 'schoolName',
        key: 'schoolName',
        width: '11%',
        align: 'center',
        ellipsis: true,
        render: (text: string, record) => (
          <a
            onClick={() => setSelectedItem(record)}
            style={{ color: 'var(--color-primary)', fontWeight: 500 }}
          >
            {text}
          </a>
        ),
      },
      {
        title: '기관 지역',
        dataIndex: 'region',
        key: 'region',
        width: '11%',
        align: 'center',
        ellipsis: true,
      },
      {
        title: '프로그램 승인 현황',
        dataIndex: 'approvalStatus',
        key: 'approvalStatus',
        width: '8%',
        align: 'center',
        onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
        render: (status: ApprovalStatusKey, record: ApplicantSchoolRow) => (
          <div onClick={e => e.stopPropagation()} style={{ display: 'inline-block' }}>
            <StatusDropdownCell<ApprovalStatusKey>
              status={status ?? null}
              statusOptions={approvalStatusKeys}
              renderBadge={s => <ApprovalStatusBadge status={s} />}
              isItemDisabled={(cur, opt) => cur === opt}
              onChange={newStatus => handleInstitutionApprovalStatusChange(record.id, newStatus)}
              isOpen={openApprovalDropdownId === record.id}
              onOpenChange={open => setOpenApprovalDropdownId(open ? record.id : null)}
              emptyPlaceholder="-"
            />
          </div>
        ),
      },
      {
        title: '강의 회차 별 희망 교육 날짜 및 시간',
        key: 'sessions',
        width: '28%',
        onCell: () => ({ className: 'applicant-details__td-sessions' }),
        render: (_: unknown, record: ApplicantSchoolRow) => {
          const sessions = record.sessions ?? []
          const total = sessions.length
          const showCount = total <= 3 ? total : 2
          const displaySessions = sessions.slice(0, showCount)
          const restCount = total - showCount
          return (
            <div className="applicant-details__sessions-cell">
              {displaySessions.map(s => {
                const { datePart, durationPart, periodPart } = getSessionLineParts(s)
                return (
                  <div key={s.round} className="applicant-details__session-line">
                    {datePart}
                    <span className="applicant-details__session-divider" aria-hidden />
                    {durationPart}
                    <span className="applicant-details__session-divider" aria-hidden />
                    {periodPart}
                  </div>
                )
              })}
              {restCount > 0 && (
                <div className="applicant-details__session-more">외 {restCount}개의 교육 일정</div>
              )}
            </div>
          )
        },
      },
      {
        title: '대상 학년',
        dataIndex: 'educationGrade',
        key: 'educationGrade',
        width: '6%',
        align: 'center',
      },
      {
        title: '대상 학급 수',
        dataIndex: 'classCount',
        key: 'classCount',
        width: '6%',
        align: 'center',
        render: (v: number) => (v != null ? `${v}개` : '-'),
      },
      {
        title: '총 학생 수',
        dataIndex: 'studentCount',
        key: 'studentCount',
        width: '6%',
        align: 'center',
        render: (v: number) => (v != null ? `${v}명` : '-'),
      },
      {
        title: '담당 교사명',
        dataIndex: 'teacherName',
        key: 'teacherName',
        width: '8%',
        align: 'center',
      },
      {
        title: '담당 강사',
        dataIndex: 'assignedInstructorNames',
        key: 'assignedInstructorNames',
        width: '12%',
        align: 'center',
        ellipsis: true,
        render: (v: string | undefined) => v ?? '-',
      },
    ],
    [
      approvalStatusKeys,
      getSessionLineParts,
      handleInstitutionApprovalStatusChange,
      openApprovalDropdownId,
      setSelectedItem,
    ]
  )
}

export function useInstructorApplicantColumns(params: {
  setSelectedItem: (record: ApplicantInstructorRow) => void
  approvalStatusKeys: ApprovalStatusKey[]
  handleInstructorApprovalStatusChange: (recordId: string, status: ApprovalStatusKey) => void
  openApprovalDropdownId: string | null
  setOpenApprovalDropdownId: (id: string | null) => void
}): ColumnsType<ApplicantInstructorRow> {
  const {
    setSelectedItem,
    approvalStatusKeys,
    handleInstructorApprovalStatusChange,
    openApprovalDropdownId,
    setOpenApprovalDropdownId,
  } = params

  return useMemo(
    () => [
      { title: 'No.', dataIndex: 'no', key: 'no', width: 72, align: 'center' },
      {
        title: '강사명',
        dataIndex: 'instructorName',
        key: 'instructorName',
        width: 110,
        align: 'center',
        render: (text: string, record) => (
          <a
            onClick={() => setSelectedItem(record)}
            style={{ color: 'var(--color-primary)', fontWeight: 500 }}
          >
            {text}
          </a>
        ),
      },
      {
        title: '거주 지역',
        dataIndex: 'address',
        key: 'address',
        width: 150,
        align: 'center',
        ellipsis: true,
      },
      {
        title: 'JA 강의 경력',
        dataIndex: 'teachingExperience',
        key: 'teachingExperience',
        width: 120,
        align: 'center',
      },
      {
        title: 'JA 평가 등급',
        dataIndex: 'evaluationGrade',
        key: 'evaluationGrade',
        width: 110,
        align: 'center',
        render: (v: string) => (v ? `${v}등급` : '-'),
      },
      {
        title: '연락처',
        dataIndex: 'contact',
        key: 'contact',
        width: 130,
        align: 'center',
      },
      {
        title: '이메일',
        dataIndex: 'email',
        key: 'email',
        width: 160,
        align: 'center',
        ellipsis: true,
      },
      {
        title: '프로그램 승인 현황',
        dataIndex: 'approvalStatus',
        key: 'approvalStatus',
        width: 136,
        align: 'center',
        onCell: () => ({ className: STATUS_DROPDOWN_CELL_CLASSNAME }),
        render: (status: ApprovalStatusKey, record: ApplicantInstructorRow) => (
          <div onClick={e => e.stopPropagation()} style={{ display: 'inline-block' }}>
            <StatusDropdownCell<ApprovalStatusKey>
              status={status ?? null}
              statusOptions={approvalStatusKeys}
              renderBadge={s => <ApprovalStatusBadge status={s} />}
              isItemDisabled={(cur, opt) => cur === opt}
              onChange={newStatus => handleInstructorApprovalStatusChange(record.id, newStatus)}
              isOpen={openApprovalDropdownId === record.id}
              onOpenChange={open => setOpenApprovalDropdownId(open ? record.id : null)}
              emptyPlaceholder="-"
            />
          </div>
        ),
      },
    ],
    [approvalStatusKeys, handleInstructorApprovalStatusChange, openApprovalDropdownId]
  )
}
