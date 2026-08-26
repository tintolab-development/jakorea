import type { MenuProps } from 'antd'
import { Dropdown } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Application } from '@/types/domain'
import { CmsButton } from '@/shared/ui'
import { StatusBadge } from '@/shared/components/status-badge'
import { lectureAttendanceHasAtLeastOne } from '@/shared/utils'
import { resolveApplicationEnrollmentDisplayStatus, resolveMemberProgramTitle } from '@/features/user/detail/lib/member-program-history-display'
import {
  PROGRAM_ENROLLMENT_DISPLAY_STATUS_ORDER,
  type ProgramEnrollmentDisplayStatus,
} from '@/shared/constants/status'

export interface CreateProgramHistoryColumnsParams {
  onProgressStatusChange: (app: Application, displayStatus: ProgramEnrollmentDisplayStatus) => void
  onOpenLectureAttendance: (record: Application) => void
  onOpenAssignmentSubmission: (record: Application) => void
  progressStatusReadOnly?: boolean
}

export function createProgramHistoryColumns({
  onProgressStatusChange,
  onOpenLectureAttendance,
  onOpenAssignmentSubmission,
  progressStatusReadOnly = false,
}: CreateProgramHistoryColumnsParams): ColumnsType<Application> {
  return [
    {
      title: 'No.',
      key: 'no',
      width: 72,
      align: 'center',
      render: (_: unknown, __: Application, index: number) => index + 1,
    },
    {
      title: '프로그램명',
      dataIndex: 'programId',
      key: 'programId',
      align: 'center',
      render: (programId: string, record: Application) =>
        resolveMemberProgramTitle(programId, record),
    },
    {
      title: '모집 신청 현황',
      key: 'progressDisplay',
      align: 'center',
      render: (_: unknown, record: Application) => {
        const displayStatus = resolveApplicationEnrollmentDisplayStatus(record)
        const menuItems: MenuProps['items'] = progressStatusReadOnly
          ? undefined
          : PROGRAM_ENROLLMENT_DISPLAY_STATUS_ORDER.map(key => ({
              key,
              label: <StatusBadge domain="programEnrollment" status={key} variant="badge" />,
              onClick: () => onProgressStatusChange(record, key),
            }))
        return (
          <span className="user-detail-modal__progress-cell" onClick={e => e.stopPropagation()}>
            {progressStatusReadOnly ? (
              <StatusBadge domain="programEnrollment" status={displayStatus} variant="badge" />
            ) : (
              <Dropdown menu={{ items: menuItems }} trigger={['click']}>
                <span className="user-detail-modal__progress-dropdown-trigger">
                  <StatusBadge domain="programEnrollment" status={displayStatus} variant="badge" />
                </span>
              </Dropdown>
            )}
          </span>
        )
      },
    },
    {
      title: '강의 출석 내역',
      dataIndex: 'lectureAttendance',
      key: 'lectureAttendance',
      align: 'center',
      render: (v: string | undefined, record: Application) => {
        const label = v ?? '0/0'
        if (!lectureAttendanceHasAtLeastOne(v)) {
          return label
        }
        return (
          <button
            type="button"
            className="user-detail-modal__attendance-link"
            onClick={e => {
              e.stopPropagation()
              onOpenLectureAttendance(record)
            }}
          >
            {label}
          </button>
        )
      },
    },
    {
      title: '과제 제출 내역',
      key: 'assignment',
      align: 'center',
      render: (_: unknown, record: Application) => (
        <span className="user-detail-modal__assignment-cell" onClick={e => e.stopPropagation()}>
          <CmsButton
            variant="default"
            size="small"
            disabled={!record.hasAssignmentSubmission}
            onClick={() => onOpenAssignmentSubmission(record)}
          >
            내역 보기
          </CmsButton>
        </span>
      ),
    },
    {
      title: '담당자',
      dataIndex: 'managerName',
      key: 'managerName',
      align: 'center',
      render: (v: string | undefined) => v ?? '-',
    },
  ]
}
