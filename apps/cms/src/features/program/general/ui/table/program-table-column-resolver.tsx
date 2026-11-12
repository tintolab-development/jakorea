import type { ColumnsType } from 'antd/es/table'
import { STATUS_DROPDOWN_CELL_CLASSNAME } from '@/shared/components/status-dropdown-cell'
import { ProgramLifecycleStatusTableCell } from '@/shared/components/program-lifecycle-status-table-cell'
import { ProgramListOverviewProgressCell } from '@/shared/components/program-list-overview-progress-cell'
import { formatDateRange } from '../../hooks/use-format-date'
import { formatRecruitmentHeadcount } from '@/features/program/shared/lib/format-recruitment-headcount'
import { resolveGeneralProgramListTitle } from '../../lib/detail-common-info-display'
import {
  optionalColumns,
  studentRecruitmentTableColumns,
  instructorRecruitmentTableColumns,
  capacityTableColumnsEducation,
} from '../constants/program-list-columns'
import { categoryOptions, getProgramListAudienceFilterLabel, resolveProgramListAudienceFilterValue, resolveProgramListParticipantTypeFilterValue } from '../constants/program-list-constants'
import {
  formatTargetLevelsLabel,
  resolveProgramTargetLevels,
} from '@/features/program/shared/lib/program-detail-info-constants'
import type { Program, ProgramCategory } from '@/types/domain'
import type { ProgramListProgramMode } from '../../model/program-list-program-mode'
import { CMS_TABLE_NO_COL_CLASS, TABLE_COLUMN_WIDTHS } from '@/shared/constants/table'
import { formatDateRangeDotWithWeekday } from '@/shared/utils/date'

/** ProgramStatusWidget 4탭 기준 목록 뷰 */
export type ProgramListView = 'ALL' | 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED'

/** 위젯 미선택 등 비정상 상태 */
export type ProgramListTableView = ProgramListView | 'FALLBACK'
/**
 * - `default`: 1사1교 등 기존 overview 목록
 * - `general`: 일반 프로그램 목록 — 예정 탭 사업 운영 기간에 요일 표기(시안)
 * - `trainedTeachers`: 교육 받은 교사 목록
 * - `companySchool`: 1사1교 목록 — 봉사자·참여자 유형 열 제외, 전 탭 강사 모집 인원, 예정 탭 기간 요일 표기(시안)
 */
export type ProgramListColumnPreset = 'default' | 'general' | 'trainedTeachers' | 'companySchool'

export interface ResolveEducationColumnsParams {
  studentRecruitmentTable?: boolean
  instructorRecruitmentTable?: boolean
  isOverviewListPage?: boolean
  programMode?: ProgramListProgramMode
  listView?: ProgramListTableView
  columnPreset?: ProgramListColumnPreset
}

const TRAINED_TEACHERS_OMITTED_COLUMN_KEYS = new Set([
  'participantType',
  'instructorRecruitment',
  'volunteerRecruitment',
])

function omitTrainedTeachersColumns(columns: ColumnsType<Program>): ColumnsType<Program> {
  return columns.filter(column => !TRAINED_TEACHERS_OMITTED_COLUMN_KEYS.has(String(column.key)))
}

/** 1사1교 시안(4175:65554 외)에 없는 열 — 봉사자 없음·참여자 유형 고정 */
const COMPANY_SCHOOL_OMITTED_COLUMN_KEYS = new Set(['participantType', 'volunteerRecruitment'])

/**
 * 1사1교 목록 열 — 시안 4개 탭 모두「참여자 모집 인원」다음에「강사 모집 인원」.
 * 진행 중·완료 탭은 이미 있으므로 전체·예정 탭에만 끼운다.
 */
function withCompanySchoolColumns(columns: ColumnsType<Program>): ColumnsType<Program> {
  const kept = columns.filter(column => !COMPANY_SCHOOL_OMITTED_COLUMN_KEYS.has(String(column.key)))
  if (kept.some(column => column.key === 'instructorRecruitment')) return kept
  const participantIndex = kept.findIndex(column => column.key === 'participantCapacity')
  if (participantIndex < 0) return kept
  return [
    ...kept.slice(0, participantIndex + 1),
    createInstructorRecruitmentColumn(),
    ...kept.slice(participantIndex + 1),
  ]
}

/** 사업 운영 기간 요일 표기 — `2026.12.08(월) ~ 2026.12.30(수)` (교육 받은 교사·일반 프로그램 피그마) */
function withOperationPeriodWeekday(columns: ColumnsType<Program>): ColumnsType<Program> {
  return columns.map(column =>
    column.key === 'operationPeriod'
      ? {
          ...column,
          render: (_: unknown, record: Program) =>
            formatDateRangeDotWithWeekday(record.startDate, record.endDate),
        }
      : column
  )
}

const WIDTH_NO = TABLE_COLUMN_WIDTHS.index
const WIDTH_PROGRAM_TITLE = 640
const WIDTH_RECRUITMENT_COUNT = 160
const WIDTH_TARGET_LEVEL = 220
const WIDTH_OPERATION_PERIOD = 320
const WIDTH_PARTICIPATION_COUNT = 160
const WIDTH_PROGRESS = 180

/** 전 유형 공통. 회차 합·학생 수·봉사 수로 다시 세지 않는다. */
function participantCountRender(_: unknown, record: Program) {
  return formatRecruitmentHeadcount(record.participantApprovedCount, record.participantCapacity)
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

function createInstructorRecruitmentColumn() {
  return {
    title: '강사 모집 인원',
    key: 'instructorRecruitment',
    minWidth: WIDTH_RECRUITMENT_COUNT,
    align: 'center' as const,
    className: 'program-list-table__col-instructor-recruit',
    render: instructorRecruitRender,
  }
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

/** 목록「교육 대상」— `targetLevels` 전체. 없을 때만 `targetLevel`. */
function educationTargetColumnRender(_: unknown, record: Program) {
  return formatTargetLevelsLabel(resolveProgramTargetLevels(record))
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
      minWidth: WIDTH_PROGRESS,
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
      ellipsis: true,
      minWidth: WIDTH_TARGET_LEVEL,
      align: 'center' as const,
      className: 'program-list-table__col-target',
      render: educationTargetColumnRender,
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
      ellipsis: true,
      minWidth: WIDTH_TARGET_LEVEL,
      align: 'center' as const,
      className: 'program-list-table__col-target',
      render: educationTargetColumnRender,
    },
    {
      title: '사업 운영 기간',
      key: 'operationPeriod',
      minWidth: WIDTH_OPERATION_PERIOD,
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
    createInstructorRecruitmentColumn(),
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
      ellipsis: true,
      minWidth: WIDTH_TARGET_LEVEL,
      align: 'center' as const,
      className: 'program-list-table__col-target',
      render: educationTargetColumnRender,
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
      render: educationTargetColumnRender,
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
      return withOperationPeriodWeekday(omitTrainedTeachersColumns(columns))
    }
    if (columnPreset === 'companySchool') {
      // 1사1교 예정 탭 사업 운영 기간 — `2026.12.08(화) ~ 2026.12.30(수)` (시안 4175:65963)
      return withOperationPeriodWeekday(withCompanySchoolColumns(columns))
    }
    if (columnPreset === 'general') {
      // 일반 프로그램 예정 탭 사업 운영 기간 — `2026.12.08(월) ~ 2026.12.30(수)` (시안)
      return withOperationPeriodWeekday(columns)
    }
    return columns
  }

  return createGeneralColumns(rest)
}
