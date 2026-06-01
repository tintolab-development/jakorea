import { STATUS_DROPDOWN_CELL_CLASSNAME } from '@/shared/components/status-dropdown-cell'
import { ProgramLifecycleStatusTableCell } from '@/shared/components/program-lifecycle-status-table-cell'
import { ProgramLifecycleStatusBadge } from '@/shared/components/program-lifecycle-status-badge'
import { formatDateRange } from '../../hooks/use-format-date'
import { getCapacity } from '../../lib/program-helpers'
import { resolveGeneralProgramListTitle } from '../../lib/general-program-detail-common-info-display'
import {
  optionalColumns,
  studentRecruitmentTableColumns,
  instructorRecruitmentTableColumns,
  capacityTableColumnsEducation,
} from '../constants/program-list-columns'
import {
  categoryOptions,
  getProgramParticipantTypeLabel,
  getProgramListTargetLevelLabel,
} from '../constants/program-list-constants'
import type { Program, ProgramCategory, TargetLevel } from '@/types/domain'
import type { ProgramListProgramMode } from '../../model/program-list-program-mode'

/** ProgramStatusWidget 4탭 기준 목록 뷰 */
export type ProgramListView = 'ALL' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'

/** 위젯 미선택 등 비정상 상태 */
export type ProgramListTableView = ProgramListView | 'FALLBACK'

export interface ResolveEducationColumnsParams {
  studentRecruitmentTable?: boolean
  instructorRecruitmentTable?: boolean
  isOverviewListPage?: boolean
  programMode?: ProgramListProgramMode
  listView?: ProgramListTableView
}

const WIDTH_NO = 64
const WIDTH_PROGRAM_TITLE = 600

function participantCountRender(_: unknown, record: Program) {
  const cap = getCapacity(record)
  const approved = record.approvedStudentCount ?? 0
  if (cap !== undefined) return `${approved} / ${cap}`
  return `${approved}`
}

function instructorRecruitRender(_: unknown, record: Program) {
  const cap = record.instructorCapacity
  const current = record.instructors ?? 0
  if (cap !== undefined) return `${current} / ${cap}`
  return `${current}`
}

function volunteerRecruitRender(_: unknown, record: Program) {
  const current =
    (record.generalVolunteers ?? 0) +
    (record.staffVolunteers ?? 0) +
    (record.returningVolunteers ?? 0)
  return current > 0 ? String(current) : '-'
}

export function resolveProgramListTableView(params: {
  allProgramsActive?: boolean
  scheduledActive?: boolean
  inProgressActive?: boolean
  completedActive?: boolean
}): ProgramListTableView {
  const {
    allProgramsActive = false,
    scheduledActive = false,
    inProgressActive = false,
    completedActive = false,
  } = params
  if (scheduledActive) return 'SCHEDULED'
  if (inProgressActive) return 'IN_PROGRESS'
  if (allProgramsActive) return 'ALL'
  if (completedActive) return 'COMPLETED'
  return 'FALLBACK'
}

/** 「전체 프로그램」「완료 프로그램」 */
function createProgramListAllColumns() {
  return [
    {
      title: 'No.',
      key: 'no',
      width: WIDTH_NO,
      align: 'center' as const,
      className: 'program-list-table__col-no',
      render: (_: unknown, __: Program, index: number) => index + 1,
    },
    {
      title: '프로그램명',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: WIDTH_PROGRAM_TITLE,
      align: 'center' as const,
      className: 'program-list-table__col-title',
      render: (_: unknown, record: Program) => resolveGeneralProgramListTitle(record),
    },
    {
      title: '프로그램 진행 현황',
      key: 'lifecycleProgress',
      align: 'center' as const,
      render: (_: unknown, record: Program) =>
        record.lifecycleStatus ? (
          <ProgramLifecycleStatusBadge status={record.lifecycleStatus} variant="table" />
        ) : (
          '-'
        ),
    },
    {
      title: '참여자 모집 인원',
      key: 'participantCapacity',
      align: 'center' as const,
      render: participantCountRender,
    },
    {
      title: '참여자 유형',
      dataIndex: 'category',
      key: 'category',
      align: 'center' as const,
      render: (value: ProgramCategory | undefined) => getProgramParticipantTypeLabel(value),
    },
    {
      title: '교육 대상',
      dataIndex: 'targetLevel',
      key: 'targetLevel',
      align: 'center' as const,
      render: (value: TargetLevel | undefined) => getProgramListTargetLevelLabel(value),
    },
  ]
}

/** 「예정 프로그램」 */
function createProgramListScheduledColumns() {
  return [
    {
      title: 'No.',
      key: 'no',
      width: WIDTH_NO,
      align: 'center' as const,
      className: 'program-list-table__col-no',
      render: (_: unknown, __: Program, index: number) => index + 1,
    },
    {
      title: '프로그램명',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: WIDTH_PROGRAM_TITLE,
      align: 'center' as const,
      className: 'program-list-table__col-title',
      render: (_: unknown, record: Program) => resolveGeneralProgramListTitle(record),
    },
    {
      title: '참여자 모집 인원',
      key: 'participantCapacity',
      align: 'center' as const,
      render: participantCountRender,
    },
    {
      title: '참여자 유형',
      dataIndex: 'category',
      key: 'category',
      align: 'center' as const,
      render: (value: ProgramCategory | undefined) => getProgramParticipantTypeLabel(value),
    },
    {
      title: '교육 대상',
      dataIndex: 'targetLevel',
      key: 'targetLevel',
      align: 'center' as const,
      render: (value: TargetLevel | undefined) => getProgramListTargetLevelLabel(value),
    },
    {
      title: '사업 운영 기간',
      key: 'operationPeriod',
      align: 'center' as const,
      render: (_: unknown, record: Program) => formatDateRange(record.startDate, record.endDate),
    },
  ]
}

/** 「진행 중인 프로그램」「완료 프로그램」 */
function createProgramListInProgressColumns() {
  return [
    {
      title: 'No.',
      key: 'no',
      width: WIDTH_NO,
      align: 'center' as const,
      render: (_: unknown, __: Program, index: number) => index + 1,
    },
    {
      title: '프로그램명',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: WIDTH_PROGRAM_TITLE,
      align: 'center' as const,
      render: (_: unknown, record: Program) => resolveGeneralProgramListTitle(record),
    },
    {
      title: '참여자 모집 인원',
      key: 'participantCapacity',
      align: 'center' as const,
      render: participantCountRender,
    },
    {
      title: '강사 모집 인원',
      key: 'instructorRecruitment',
      align: 'center' as const,
      render: instructorRecruitRender,
    },
    {
      title: '봉사자 모집 인원',
      key: 'volunteerRecruitment',
      align: 'center' as const,
      render: volunteerRecruitRender,
    },
    {
      title: '총 참여 학교 수',
      key: 'participatingSchoolCount',
      align: 'center' as const,
      render: (_: unknown, record: Program) =>
        record.participatingSchoolCount != null ? String(record.participatingSchoolCount) : '-',
    },
    {
      title: '총 참여 학생 수',
      key: 'participatingStudentCount',
      align: 'center' as const,
      render: (_: unknown, record: Program) =>
        record.participatingStudentCount != null ? String(record.participatingStudentCount) : '-',
    },
    {
      title: '참여자 유형',
      dataIndex: 'category',
      key: 'category',
      align: 'center' as const,
      render: (value: ProgramCategory | undefined) => getProgramParticipantTypeLabel(value),
    },
    {
      title: '교육 대상',
      dataIndex: 'targetLevel',
      key: 'targetLevel',
      align: 'center' as const,
      render: (value: TargetLevel | undefined) => getProgramListTargetLevelLabel(value),
    },
  ]
}

function createProgramListFallbackColumns() {
  return [
    {
      title: '프로그램명',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      align: 'center' as const,
      render: (_: unknown, record: Program) => resolveGeneralProgramListTitle(record),
    },
    {
      title: '프로그램 진행 현황',
      key: 'lifecycleProgress',
      align: 'center' as const,
      render: (_: unknown, record: Program) =>
        record.lifecycleStatus ? (
          <ProgramLifecycleStatusBadge status={record.lifecycleStatus} variant="table" />
        ) : (
          '-'
        ),
    },
    {
      title: '참여자 모집 인원',
      key: 'participantCapacity',
      align: 'center' as const,
      render: participantCountRender,
    },
    {
      title: '참여자 유형',
      dataIndex: 'category',
      key: 'category',
      align: 'center' as const,
      render: (value: ProgramCategory | undefined) => getProgramParticipantTypeLabel(value),
    },
    {
      title: '교육 대상',
      dataIndex: 'targetLevel',
      key: 'targetLevel',
      align: 'center' as const,
      render: (value: TargetLevel | undefined) => getProgramListTargetLevelLabel(value),
    },
  ]
}

function createGeneralColumns(params: Pick<ResolveEducationColumnsParams, 'programMode'>) {
  const { programMode = 'general' } = params

  const capacityColumns = Array.isArray(capacityTableColumnsEducation)
    ? capacityTableColumnsEducation
    : []

  return [
    {
      title: 'No.',
      key: 'no',
      width: 64,
      align: 'center' as const,
      render: (_: unknown, __: Program, index: number) => index + 1,
    },
    {
      title: '프로그램명',
      dataIndex: 'title',
      key: 'title',
      width: 260,
      ellipsis: true,
      align: 'center' as const,
      render: (_: unknown, record: Program) => resolveGeneralProgramListTitle(record),
    },
    {
      title: '모집 신청 현황',
      key: 'lifecycleStatus',
      width: 180,
      minWidth: 180,
      align: 'center' as const,
      className: programMode === 'overview' ? undefined : STATUS_DROPDOWN_CELL_CLASSNAME,
      render: (_: unknown, record: Program) => (
        <ProgramLifecycleStatusTableCell status={record.lifecycleStatus} />
      ),
    },

    ...capacityColumns,

    {
      title: '수강자 유형',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      align: 'center' as const,
      render: (value: ProgramCategory | undefined) =>
        value ? (categoryOptions.find(o => o.value === value)?.label ?? value) : '-',
    },

    ...optionalColumns,
  ]
}

export function resolveEducationColumns(params: ResolveEducationColumnsParams) {
  const {
    studentRecruitmentTable,
    instructorRecruitmentTable,
    isOverviewListPage,
    listView = 'ALL',
    ...rest
  } = params

  if (studentRecruitmentTable) return studentRecruitmentTableColumns

  if (instructorRecruitmentTable) return instructorRecruitmentTableColumns

  if (isOverviewListPage) {
    switch (listView) {
      case 'ALL':
        return createProgramListAllColumns()

      case 'SCHEDULED':
        return createProgramListScheduledColumns()

      case 'IN_PROGRESS':
      case 'COMPLETED':
        return createProgramListInProgressColumns()

      default:
        return createProgramListFallbackColumns()
    }
  }

  return createGeneralColumns(rest)
}
