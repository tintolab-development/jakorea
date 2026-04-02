/**
 * 과제·설문 제출 내역 모달
 * 학교 상세 > 학생 명단, 회원 상세 등에서 "내역 보기" 시 노출
 * ContentModal + Ant Table(체크박스·7열), 일괄 다운로드 푸터
 */

import { useCallback, useMemo, useState, type Key } from 'react'
import { Table, message } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { DownloadOutlined } from '@ant-design/icons'
import { ContentModal } from '@/shared/ui/content-modal'
import { AppButton } from '@/shared/ui/app-button'
import {
  StatusDropdownCell,
  STATUS_DROPDOWN_CELL_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_132_CLASSNAME,
  STATUS_DROPDOWN_CELL_TAG_132_HEADER_CLASSNAME,
} from '@/shared/components'
import { AssignmentPreviewModal } from './assignment-preview-modal'
import type { Application } from '@/types/domain'
import type { SchoolDetailStudentRow } from '../model/school-detail-types'
import {
  ASSIGNMENT_SUBMISSION_ROW_STATUS_LABELS,
  ASSIGNMENT_TEAM_ROLE_LABELS,
  ASSIGNMENT_TEAM_ROLE_OPTIONS,
  LECTURE_PROGRESS_DISPLAY_LABELS,
  type AssignmentSubmissionDetail,
  type AssignmentSubmissionRowStatusKey,
  type AssignmentSubmissionTableRow,
  type AssignmentTeamRoleKey,
  type LectureProgressDisplayKey,
} from '../model/school-detail-types'
import {
  getAssignmentSubmissionDetail,
  getAssignmentSubmissionDetailForApplication,
  updateAssignmentSubmissionTeamRole,
} from '../lib/school-detail-mock'
import { TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import './assignment-submission-modal.css'

export interface AssignmentSubmissionModalProps {
  open: boolean
  onCancel: () => void
  programTitle?: string
  student?: SchoolDetailStudentRow | null
  schoolId?: string
  application?: Application | null
  userName?: string
}

const DEFAULT_PROGRAM_TITLE = '프로그램'

function assignmentTeamRoleTagClassName(role: AssignmentTeamRoleKey): string {
  const base = 'assignment-submission-modal__team-role-tag'
  if (role === 'leader') return `${base} assignment-submission-modal__team-role-tag--leader`
  if (role === 'individual') return `${base} assignment-submission-modal__team-role-tag--individual`
  return `${base} assignment-submission-modal__team-role-tag--member`
}

type StatusTextKind = 'scheduled' | 'completed' | 'undone'

function statusTextClassNames(kind: StatusTextKind): string {
  return `assignment-submission-modal__status-text assignment-submission-modal__status-text--${kind}`
}

function lectureProgressClass(key: LectureProgressDisplayKey): string {
  return key === 'scheduled' ? statusTextClassNames('scheduled') : statusTextClassNames('completed')
}

/** not_submitted → undone, 그 외(구 neutral 포함) → scheduled */
function submissionStatusClass(key: AssignmentSubmissionRowStatusKey): string {
  if (key === 'not_submitted') return statusTextClassNames('undone')
  return statusTextClassNames('scheduled')
}

export function AssignmentSubmissionModal({
  open,
  onCancel,
  programTitle = DEFAULT_PROGRAM_TITLE,
  student = null,
  schoolId = '',
  application = null,
  userName = '',
}: AssignmentSubmissionModalProps) {
  const [assignmentRoleRevision, setAssignmentRoleRevision] = useState(0)
  const detail: AssignmentSubmissionDetail | null = useMemo(() => {
    void assignmentRoleRevision
    if (!open) return null
    const title = programTitle.trim() || DEFAULT_PROGRAM_TITLE
    if (application && userName) {
      return getAssignmentSubmissionDetailForApplication(application, userName, title)
    }
    if (student && schoolId) {
      return getAssignmentSubmissionDetail(student, schoolId, title)
    }
    return null
  }, [open, student, schoolId, application, userName, programTitle, assignmentRoleRevision])

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewRound, setPreviewRound] = useState<number>(1)
  const [selectedRowKeys, setSelectedRowKeys] = useState<Key[]>([])
  const [openTeamRoleDropdownRowId, setOpenTeamRoleDropdownRowId] = useState<string | null>(null)

  const handleModalCancel = useCallback(() => {
    setSelectedRowKeys([])
    setOpenTeamRoleDropdownRowId(null)
    onCancel()
  }, [onCancel])

  const openPreview = useCallback((roundNumber: number) => {
    setPreviewRound(roundNumber)
    setPreviewOpen(true)
  }, [])

  const handleAssignmentTeamRoleChange = useCallback(
    (rowId: string, newRole: AssignmentTeamRoleKey) => {
      updateAssignmentSubmissionTeamRole(rowId, newRole)
      setAssignmentRoleRevision(n => n + 1)
      message.success('역할이 변경되었습니다.')
    },
    []
  )

  const columns: ColumnsType<AssignmentSubmissionTableRow> = useMemo(
    () => [
      {
        title: '역할',
        key: 'role',
        align: 'center',
        width: 150,
        onHeaderCell: () => ({ className: STATUS_DROPDOWN_CELL_TAG_132_HEADER_CLASSNAME }),
        onCell: () => ({
          className: `${STATUS_DROPDOWN_CELL_CLASSNAME} ${STATUS_DROPDOWN_CELL_TAG_132_CLASSNAME}`,
        }),
        render: (_: unknown, record: AssignmentSubmissionTableRow) => (
          <StatusDropdownCell<AssignmentTeamRoleKey>
            status={record.teamRole}
            statusOptions={ASSIGNMENT_TEAM_ROLE_OPTIONS}
            renderBadge={r => (
              <span className={assignmentTeamRoleTagClassName(r)}>
                {ASSIGNMENT_TEAM_ROLE_LABELS[r]}
              </span>
            )}
            isItemDisabled={(cur, opt) => cur === opt}
            onChange={newRole => handleAssignmentTeamRoleChange(record.id, newRole)}
            isOpen={openTeamRoleDropdownRowId === record.id}
            onOpenChange={open => setOpenTeamRoleDropdownRowId(open ? record.id : null)}
            emptyPlaceholder="-"
            tagLayout="tag132"
          />
        ),
      },
      {
        title: '교육 진행 일자 및 교육 차시',
        dataIndex: 'educationDateLabel',
        key: 'educationDateLabel',
        minWidth: 300,
      },
      {
        title: '과제 제출 기간',
        dataIndex: 'assignmentPeriodLabel',
        key: 'assignmentPeriodLabel',
        align: 'center',
        minWidth: 300,
        render: (v: string) => (v?.trim() ? v : '-'),
      },
      {
        title: '강의 진행 여부',
        key: 'lectureProgress',
        align: 'center',
        width: 120,
        render: (_: unknown, record: AssignmentSubmissionTableRow) => (
          <span className={lectureProgressClass(record.lectureProgress)}>
            {LECTURE_PROGRESS_DISPLAY_LABELS[record.lectureProgress]}
          </span>
        ),
      },
      {
        title: '제출 현황',
        key: 'submissionStatus',
        align: 'center',
        width: 120,
        render: (_: unknown, record: AssignmentSubmissionTableRow) => {
          const key = record.submissionStatus
          const label = ASSIGNMENT_SUBMISSION_ROW_STATUS_LABELS[key]
          return <span className={submissionStatusClass(key)}>{label}</span>
        },
      },
      {
        title: '제출 파일',
        key: 'file',
        align: 'center',
        minWidth: 180,
        render: (_: unknown, record: AssignmentSubmissionTableRow) => (
          <AppButton
            variant="viewDetails"
            size="large"
            disabled={!record.canViewAssignment}
            onClick={() => record.canViewAssignment && openPreview(record.roundNumber)}
          >
            과제 보기
          </AppButton>
        ),
      },
    ],
    [openPreview, openTeamRoleDropdownRowId, handleAssignmentTeamRoleChange]
  )

  const footer = (
    <>
      <AppButton variant="cancel" size="filter" onClick={handleModalCancel}>
        닫기
      </AppButton>
      <AppButton
        variant="primary"
        size="filter-wide"
        icon={<DownloadOutlined />}
        onClick={() => {
          if (selectedRowKeys.length === 0) return
          message.info('과제 일괄 다운로드는 추후 연결됩니다.')
        }}
      >
        과제 일괄 다운로드
      </AppButton>
    </>
  )

  const headerDescription =
    detail != null ? (
      <>
        <span className="assignment-submission-modal__description-program">
          [{detail.programTitle}]
        </span>
        <span className="assignment-submission-modal__description-rest">
          {' '}
          프로그램의 과제 및 설문 제출 내역입니다.
        </span>
      </>
    ) : undefined

  return (
    <>
      <ContentModal
        open={open}
        onCancel={handleModalCancel}
        title="과제 및 설문 제출 내역"
        description={headerDescription}
        footer={footer}
        size="large"
        className="assignment-submission-modal"
      >
        <div className="assignment-submission-modal__body">
          {detail ? (
            <>
              <div className="assignment-submission-modal__list-head">
                <span className="assignment-submission-modal__list-title">
                  과제 및 설문 제출 목록
                </span>
                <span className="assignment-submission-modal__list-count">
                  {detail.rows.length}건
                </span>
              </div>
              <div className="assignment-submission-modal__table-outer">
                <Table<AssignmentSubmissionTableRow>
                  className="cms-data-table cms-data-table--fluid"
                  rowKey="id"
                  columns={columns}
                  dataSource={detail.rows}
                  pagination={false}
                  rowSelection={{
                    columnWidth: TABLE_COLUMN_WIDTHS.checkbox,
                    selectedRowKeys,
                    onChange: keys => setSelectedRowKeys(keys),
                  }}
                />
              </div>
            </>
          ) : null}
        </div>
      </ContentModal>
      {detail && (
        <AssignmentPreviewModal
          open={previewOpen}
          onCancel={() => setPreviewOpen(false)}
          studentName={detail.studentName}
          roundNumber={previewRound}
        />
      )}
    </>
  )
}
