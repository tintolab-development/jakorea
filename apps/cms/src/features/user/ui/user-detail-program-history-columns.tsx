import type { MenuProps } from 'antd'
import { Dropdown } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Application } from '@/types/domain'
import { AppButton } from '@/shared/ui/app-button'
import { ProgramEnrollmentStatusBadge } from '@/shared/components/program-enrollment-status-badge'
import { lectureAttendanceHasAtLeastOne } from '@/shared/utils'
import { programService } from '@/entities/program/api/program-service'
import {
  getEffectiveEnrollmentDisplayStatus,
  type ProgramEnrollmentDisplayStatus,
} from '@/shared/constants/status'

export interface CreateProgramHistoryColumnsParams {
  onProgressStatusChange: (app: Application, displayStatus: ProgramEnrollmentDisplayStatus) => void
  onOpenLectureAttendance: (record: Application) => void
  onOpenAssignmentSubmission: (record: Application) => void
}

export function createProgramHistoryColumns({
  onProgressStatusChange,
  onOpenLectureAttendance,
  onOpenAssignmentSubmission,
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
      render: (programId: string) => {
        const program = programService.getByIdSync(programId)
        return program ? program.title : programId
      },
    },
    {
      title: '모집 신청 현황',
      key: 'progressDisplay',
      align: 'center',
      render: (_: unknown, record: Application) => {
        const program = programService.getByIdSync(record.programId)
        const displayStatus = getEffectiveEnrollmentDisplayStatus(
          record.status,
          record.progressStatus,
          program?.lifecycleStatus
        )
        const menuItems: MenuProps['items'] = (
          [
            'WAITING_RESULT',
            'REJECTED',
            'EDUCATION_SCHEDULED',
            'EDUCATION_IN_PROGRESS',
            'PROGRAM_ENDED',
          ] as const
        ).map(key => ({
          key,
          label: <ProgramEnrollmentStatusBadge status={key} />,
          onClick: () => onProgressStatusChange(record, key),
        }))
        return (
          <span className="user-detail-modal__progress-cell" onClick={e => e.stopPropagation()}>
            <Dropdown menu={{ items: menuItems }} trigger={['click']}>
              <span className="user-detail-modal__progress-dropdown-trigger">
                <ProgramEnrollmentStatusBadge status={displayStatus} />
              </span>
            </Dropdown>
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
          <AppButton
            variant="viewDetails"
            size="small"
            disabled={!record.hasAssignmentSubmission}
            onClick={() => onOpenAssignmentSubmission(record)}
          >
            내역 보기
          </AppButton>
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
