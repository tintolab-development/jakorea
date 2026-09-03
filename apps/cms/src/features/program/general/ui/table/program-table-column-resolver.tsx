import type { ColumnsType } from 'antd/es/table'
import { STATUS_DROPDOWN_CELL_CLASSNAME } from '@/shared/components/status-dropdown-cell'
import { ProgramLifecycleStatusTableCell } from '@/shared/components/program-lifecycle-status-table-cell'
import { ProgramListOverviewProgressCell } from '@/shared/components/program-list-overview-progress-cell'
import { formatDateRange } from '../../hooks/use-format-date'
import { getCapacity } from '../../lib/program-helpers'
import { resolveGeneralProgramListTitle } from '../../lib/detail-common-info-display'
import {
  optionalColumns,
  studentRecruitmentTableColumns,
  instructorRecruitmentTableColumns,
  capacityTableColumnsEducation,
} from '../constants/program-list-columns'
import { categoryOptions, getProgramListTargetLevelLabel, getProgramListAudienceFilterLabel, resolveProgramListAudienceFilterValue, resolveProgramListParticipantTypeFilterValue } from '../constants/program-list-constants'
import type { Program, ProgramCategory, TargetLevel } from '@/types/domain'
import type { ProgramListProgramMode } from '../../model/program-list-program-mode'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'

/** ProgramStatusWidget 4탭 기준 목록 뷰 */
export type ProgramListView = 'ALL' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'

/** 위젯 미선택 등 비정상 상태 */
export type ProgramListTableView = ProgramListView | 'FALLBACK'
export type ProgramListColumnPreset = 'default' | 'trainedTeachers'

export interface ResolveEducationColumnsParams {
  studentRecruitmentTable?: boolean
  instructorRecruitmentTable?: boolean
  isOverviewListPage?: boolean
  programMode?: ProgramListProgramMode
  listView?: ProgramListTableView
  columnPreset?: ProgramListColumnPreset
}

function removeInstructorRecruitmentColumn(columns: ColumnsType<Program>): ColumnsType<Program> {
  return columns.filter(column => column.key !== 'instructorRecruitment')
}

const WIDTH_NO = TABLE_COLUMN_WIDTHS.index
const WIDTH_PROGRAM_TITLE = 690
const WIDTH_RECRUITMENT_COUNT = 160
const WIDTH_TARGET_LEVEL = 160
const WIDTH_OPERATION_PERIOD = 320
const WIDTH_PARTICIPATION_COUNT = 160

function participantCountRender(_: unknown, record: Program) {
  const cap = getCapacity(record)
  const approved = record.approvedStudentCount ?? 0
  if (cap !== undefined) return `${approved} / ${cap}`
  return `${approved}`
}

function instructorRecruitRender(_: unknown, record: Program) {
  const cap = record.instructorCapacity
  const current = record.instructors ?? 0
  if (cap == null && current === 0 && !hasInstructorParticipantType(record)) return '-'
  if (cap !== undefined) return `${current} / ${cap}`
  return `${current}`
}

function volunteerRecruitRender(_: unknown, record: Program) {
  const current = record.generalVolunteers ?? 0
  const cap = record.generalCommonInfo?.kpi?.volunteerCount
  if (cap == null && current === 0 && !hasVolunteerParticipantType(record)) return '-'
  if (cap !== undefined) return `${current} / ${cap}`
  return `${current}`
}

function hasInstructorParticipantType(record: Program): boolean {
  return (
    record.category === 'instructor' ||
    (record.generalParticipantTypes ?? []).includes('teacher_instructor')
  )
}

function hasVolunteerParticipantType(record: Program): boolean {
  return (
    record.category === 'volunteer' ||
    (record.generalParticipantTypes ?? []).includes('volunteer')
  )
}

function participantTypeColumnRender(_: unknown, record: Program) {
  return getProgramListAudienceFilterLabel(
    resolveProgramListParticipantTypeFilterValue(record)
  )
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
      className: `program-list-table__col-no ${CMS_TABLE_NO_COL_CLASS}`,
      render: (_: unknown, __: Program, index: number) => index + 1,
    },
    {
      title: '프로그램명',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      minWidth: WIDTH_PROGRAM_TITLE,
      align: 'center' as const,
      className: 'program-list-table__col-title',
      render: (_: unknown, record: Program) => resolveGeneralProgramListTitle(record),
    },
    {
      title: '프로그램 진행 현황',
      key: 'lifecycleProgress',
      align: 'center' as const,
      className: 'program-list-table__col-progress',
      render: (_: unknown, record: Program) =>
        record.lifecycleStatus ? (
          <ProgramListOverviewProgressCell status={record.lifecycleStatus} />
        ) : (
          '-'
        ),
    },
    {
      title: '참여자 모집 인원',
      key: 'participantCapacity',
      minWidth: WIDTH_RECRUITMENT_COUNT,
      align: 'center' as const,
      className: 'program-list-table__col-recruitment',
      render: participantCountRender,
    },
    {
      title: '참여자 유형',
      key: 'participantType',
      minWidth: WIDTH_TARGET_LEVEL,
      align: 'center' as const,
      className: 'program-list-table__col-participant-type',
      render: (_: unknown, record: Program) =>
        getProgramListAudienceFilterLabel(resolveProgramListAudienceFilterValue(record)),
    },
    {
      title: '교육 대상',
      dataIndex: 'targetLevel',
      key: 'targetLevel',
      minWidth: WIDTH_TARGET_LEVEL,
      align: 'center' as const,
      className: 'program-list-table__col-target',
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
      className: `program-list-table__col-no ${CMS_TABLE_NO_COL_CLASS}`,
      render: (_: unknown, __: Program, index: number) => index + 1,
    },
    {
      title: '프로그램명',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      // 컨테이너 폭에 맞춤 — 고정 minWidth(690)는 가로 스크롤을 유발함
      align: 'center' as const,
      className: 'program-list-table__col-title',
      render: (_: unknown, record: Program) => resolveGeneralProgramListTitle(record),
    },
    {
      title: '참여자 모집 인원',
      key: 'participantCapacity',
      width: WIDTH_RECRUITMENT_COUNT,
      align: 'center' as const,
      className: 'program-list-table__col-recruitment',
      render: participantCountRender,
    },
    {
      title: '참여자 유형',
      key: 'participantType',
      width: WIDTH_TARGET_LEVEL,
      align: 'center' as const,
      className: 'program-list-table__col-participant-type',
      render: participantTypeColumnRender,
    },
    {
      title: '교육 대상',
      dataIndex: 'targetLevel',
      key: 'targetLevel',
      width: WIDTH_TARGET_LEVEL,
      align: 'center' as const,
      className: 'program-list-table__col-target',
      render: (value: TargetLevel | undefined) => getProgramListTargetLevelLabel(value),
    },
    {
      title: '사업 운영 기간',
      key: 'operationPeriod',
      width: WIDTH_OPERATION_PERIOD,
      align: 'center' as const,
      className: 'program-list-table__col-period',
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
      className: `program-list-table__col-no ${CMS_TABLE_NO_COL_CLASS}`,
      render: (_: unknown, __: Program, index: number) => index + 1,
    },
    {
      title: '프로그램명',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true,
      minWidth: WIDTH_PROGRAM_TITLE,
      align: 'center' as const,
      className: 'program-list-table__col-title',
      render: (_: unknown, record: Program) => resolveGeneralProgramListTitle(record),
    },
    {
      title: '참여자 모집 인원',
      key: 'participantCapacity',
      minWidth: WIDTH_RECRUITMENT_COUNT,
      align: 'center' as const,
      className: 'program-list-table__col-recruitment',
      render: participantCountRender,
    },
    {
      title: '강사 모집 인원',
      key: 'instructorRecruitment',
      minWidth: WIDTH_RECRUITMENT_COUNT,
      align: 'center' as const,
      className: 'program-list-table__col-instructor-recruit',
      render: instructorRecruitRender,
    },
    {
      title: '봉사자 모집 인원',
      key: 'volunteerRecruitment',
      minWidth: WIDTH_RECRUITMENT_COUNT,
      align: 'center' as const,
      className: 'program-list-table__col-volunteer-recruit',
      render: volunteerRecruitRender,
    },
    {
      title: '총 참여 학교 수',
      key: 'participatingSchoolCount',
      minWidth: WIDTH_PARTICIPATION_COUNT,
      align: 'center' as const,
      className: 'program-list-table__col-school-count',
      render: (_: unknown, record: Program) =>
        record.participatingSchoolCount != null
          ? `${record.participatingSchoolCount}개`
          : '-',
    },
    {
      title: '총 참여 학생 수',
      key: 'participatingStudentCount',
      minWidth: WIDTH_PARTICIPATION_COUNT,
      align: 'center' as const,
      className: 'program-list-table__col-student-count',
      render: (_: unknown, record: Program) =>
        record.participatingStudentCount != null
          ? `${record.participatingStudentCount}명`
          : '-',
    },
    {
      title: '참여자 유형',
      key: 'participantType',
      minWidth: WIDTH_TARGET_LEVEL,
      align: 'center' as const,
      className: 'program-list-table__col-participant-type',
      render: participantTypeColumnRender,
    },
    {
      title: '교육 대상',
      dataIndex: 'targetLevel',
      key: 'targetLevel',
      minWidth: WIDTH_TARGET_LEVEL,
      align: 'center' as const,
      className: 'program-list-table__col-target',
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
          <ProgramListOverviewProgressCell status={record.lifecycleStatus} />
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
      title: '강사 모집 인원',
      key: 'instructorRecruitment',
      align: 'center' as const,
      render: instructorRecruitRender,
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
      width: TABLE_COLUMN_WIDTHS.index,
      align: 'center' as const,
      className: CMS_TABLE_NO_COL_CLASS,
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
    columnPreset = 'default',
    ...rest
  } = params

  if (studentRecruitmentTable) return studentRecruitmentTableColumns

  if (instructorRecruitmentTable) return instructorRecruitmentTableColumns

  if (isOverviewListPage) {
    const resolveColumns = () => {
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

    const columns = resolveColumns() as ColumnsType<Program>
    if (columnPreset === 'trainedTeachers') {
      return removeInstructorRecruitmentColumn(columns)
    }
    return columns
  }

  return createGeneralColumns(rest)
}
