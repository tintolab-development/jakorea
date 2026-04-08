import { STATUS_DROPDOWN_CELL_CLASSNAME } from '@/shared/components/status-dropdown-cell'
import { ProgramLifecycleStatusTableCell } from '@/shared/components/program-lifecycle-status-table-cell'
import { ProgramLifecycleStatusBadge } from '@/shared/components/program-lifecycle-status-badge'
import { formatDateRange } from '../../hooks/use-format-date'
import { getCapacity } from '../../lib/program-helpers'
import {
  optionalColumns,
  studentRecruitmentTableColumns,
  instructorRecruitmentTableColumns,
  capacityTableColumnsEducation,
} from '../constants/program-list-columns'
import {
  categoryOptions,
  getEconomyParticipantTypeLabel,
  getEconomyTargetLevelLabel,
} from '../constants/program-list-constants'
import type { Program, ProgramCategory, TargetLevel } from '@/types/domain'
import type { ProgramListProgramMode } from '../../model/program-list-program-mode'

export type EconomyView = 'ALL' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'

/** 위젯 미선택 등 비정상 상태 */
export type EconomyTableView = EconomyView | 'FALLBACK'

export interface ResolveEducationColumnsParams {
  studentRecruitmentTable?: boolean
  instructorRecruitmentTable?: boolean
  isEconomyPage?: boolean
  programMode?: ProgramListProgramMode
  economyView?: EconomyTableView
}

const WIDTH_NO = 64
const WIDTH_PROGRAM_TITLE = 600

function economyParticipantCountRender(_: unknown, record: Program) {
  const cap = getCapacity(record)
  const approved = record.approvedStudentCount ?? 0
  if (cap !== undefined) return `${approved} / ${cap}`
  return `${approved}`
}

function economyInstructorRecruitRender(_: unknown, record: Program) {
  const cap = record.instructorCapacity
  const current = record.instructors ?? 0
  if (cap !== undefined) return `${current} / ${cap}`
  return `${current}`
}

function economyVolunteerRecruitRender(_: unknown, record: Program) {
  const current =
    (record.generalVolunteers ?? 0) +
    (record.staffVolunteers ?? 0) +
    (record.returningVolunteers ?? 0)
  return current > 0 ? String(current) : '-'
}

export function resolveEconomyTableView(params: {
  economyAllProgramsActive?: boolean
  economyScheduledActive?: boolean
  economyInProgressActive?: boolean
  economyCompletedActive?: boolean
}): EconomyTableView {
  const {
    economyAllProgramsActive = false,
    economyScheduledActive = false,
    economyInProgressActive = false,
    economyCompletedActive = false,
  } = params
  if (economyScheduledActive) return 'SCHEDULED'
  if (economyInProgressActive) return 'IN_PROGRESS'
  if (economyAllProgramsActive) return 'ALL'
  if (economyCompletedActive) return 'COMPLETED'
  return 'FALLBACK'
}

/** 「전체 프로그램」「완료 프로그램」— No. + 프로그램명·진행 현황·모집·유형·대상 */
function createEconomyAllColumns() {
  return [
    {
      title: 'No.',
      key: 'no',
      width: WIDTH_NO,
      align: 'center' as const,
      className: 'economy-program-table__col-no',
      render: (_: unknown, __: Program, index: number) => index + 1,
    },
    {
      title: '프로그램명',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      width: WIDTH_PROGRAM_TITLE,
      align: 'center' as const,
      className: 'economy-program-table__col-title',
      render: (text: string) => text ?? '-',
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
      render: economyParticipantCountRender,
    },
    {
      title: '참여자 유형',
      dataIndex: 'category',
      key: 'category',
      align: 'center' as const,
      render: (value: ProgramCategory | undefined) => getEconomyParticipantTypeLabel(value),
    },
    {
      title: '교육 대상',
      dataIndex: 'targetLevel',
      key: 'targetLevel',
      align: 'center' as const,
      render: (value: TargetLevel | undefined) => getEconomyTargetLevelLabel(value),
    },
  ]
}

/** 「예정 프로그램」 */
function createEconomyScheduledColumns() {
  return [
    {
      title: 'No.',
      key: 'no',
      width: WIDTH_NO,
      align: 'center' as const,
      className: 'economy-program-table__col-no',
      render: (_: unknown, __: Program, index: number) => index + 1,
    },
    {
      title: '프로그램명',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      minWidth: WIDTH_PROGRAM_TITLE,
      align: 'center' as const,
      render: (text: string) => text ?? '-',
    },
    {
      title: '사업 운영 기간',
      key: 'operationPeriod',
      align: 'center' as const,
      render: (_: unknown, record: Program) => formatDateRange(record.startDate, record.endDate),
    },
    {
      title: '참여자 모집 인원',
      key: 'participantCapacity',
      align: 'center' as const,
      render: economyParticipantCountRender,
    },
    {
      title: '참여자 유형',
      dataIndex: 'category',
      key: 'category',
      align: 'center' as const,
      render: (value: ProgramCategory | undefined) => getEconomyParticipantTypeLabel(value),
    },
    {
      title: '교육 대상',
      dataIndex: 'targetLevel',
      key: 'targetLevel',
      align: 'center' as const,
      render: (value: TargetLevel | undefined) => getEconomyTargetLevelLabel(value),
    },
  ]
}

/** 「진행 중인 프로그램」 */
function createEconomyInProgressColumns() {
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
      render: (text: string) => text ?? '-',
    },
    {
      title: '참여자 모집 인원',
      key: 'participantCapacity',
      align: 'center' as const,
      render: economyParticipantCountRender,
    },
    {
      title: '강사 모집 인원',
      key: 'instructorRecruitment',
      align: 'center' as const,
      render: economyInstructorRecruitRender,
    },
    {
      title: '봉사자 모집 인원',
      key: 'volunteerRecruitment',
      align: 'center' as const,
      render: economyVolunteerRecruitRender,
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
      render: (value: ProgramCategory | undefined) => getEconomyParticipantTypeLabel(value),
    },
    {
      title: '교육 대상',
      dataIndex: 'targetLevel',
      key: 'targetLevel',
      align: 'center' as const,
      render: (value: TargetLevel | undefined) => getEconomyTargetLevelLabel(value),
    },
  ]
}

/** 비정상 상태: 전체 프로그램 컬럼과 유사(No. 없음) */
function createEconomyFallbackColumns() {
  return [
    {
      title: '프로그램명',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      align: 'center' as const,
      render: (text: string) => text ?? '-',
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
      render: economyParticipantCountRender,
    },
    {
      title: '참여자 유형',
      dataIndex: 'category',
      key: 'category',
      align: 'center' as const,
      render: (value: ProgramCategory | undefined) => getEconomyParticipantTypeLabel(value),
    },
    {
      title: '교육 대상',
      dataIndex: 'targetLevel',
      key: 'targetLevel',
      align: 'center' as const,
      render: (value: TargetLevel | undefined) => getEconomyTargetLevelLabel(value),
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
      render: (text: string) => text ?? '-',
    },
    {
      title: '모집 신청 현황',
      key: 'lifecycleStatus',
      width: 180,
      minWidth: 180,
      align: 'center' as const,
      className: programMode === 'economy' ? undefined : STATUS_DROPDOWN_CELL_CLASSNAME,
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
    isEconomyPage,
    economyView = 'ALL',
    ...rest
  } = params

  if (studentRecruitmentTable) return studentRecruitmentTableColumns

  if (instructorRecruitmentTable) return instructorRecruitmentTableColumns

  if (isEconomyPage) {
    switch (economyView) {
      case 'ALL':
      case 'COMPLETED':
        return createEconomyAllColumns()

      case 'SCHEDULED':
        return createEconomyScheduledColumns()

      case 'IN_PROGRESS':
        return createEconomyInProgressColumns()

      default:
        return createEconomyFallbackColumns()
    }
  }

  return createGeneralColumns(rest)
}
