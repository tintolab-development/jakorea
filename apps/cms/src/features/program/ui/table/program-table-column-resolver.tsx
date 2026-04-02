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

/**
 * 경제 교육 목록 데이터 컬럼(체크박스 제외) 설계 너비 — 순서: No, 프로그램명, 진행/기간, 모집, 유형, 대상
 * 상위 위젯·예정 프로그램 등 동일 비율. 화면별 최소는 각 minWidth(px), 좁으면 가로 스크롤.
 */
const ECONOMY_COL_NO_PX = 80
const ECONOMY_COL_TITLE_PX = 590
/** 프로그램 진행 현황 열 — 반응형 최소 너비 */
const ECONOMY_COL_PROGRESS_PX = 180
/** 사업 운영 기간 열 */
const ECONOMY_COL_PERIOD_PX = 320
const ECONOMY_COL_TAIL_PX = 160

const ECONOMY_DATA_COLUMNS_TOTAL_PX_PROGRESS =
  ECONOMY_COL_NO_PX +
  ECONOMY_COL_TITLE_PX +
  ECONOMY_COL_PROGRESS_PX +
  ECONOMY_COL_TAIL_PX * 3

const ECONOMY_DATA_COLUMNS_TOTAL_PX_PERIOD =
  ECONOMY_COL_NO_PX +
  ECONOMY_COL_TITLE_PX +
  ECONOMY_COL_PERIOD_PX +
  ECONOMY_COL_TAIL_PX * 3

/** 「전체 프로그램」·진행 현황 열 포함 시 데이터 열 합 */
export const ECONOMY_EDUCATION_TABLE_SCROLL_X_PROGRESS = ECONOMY_DATA_COLUMNS_TOTAL_PX_PROGRESS

/** 예정/진행중/완료 위젯 — 사업 운영 기간 열 포함 시 데이터 열 합 */
export const ECONOMY_EDUCATION_TABLE_SCROLL_X_PERIOD = ECONOMY_DATA_COLUMNS_TOTAL_PX_PERIOD

/** 행 선택 열 80px + 데이터 열 합 */
export const ECONOMY_EDUCATION_TABLE_SCROLL_X_WITH_SELECTION_PROGRESS =
  80 + ECONOMY_DATA_COLUMNS_TOTAL_PX_PROGRESS

export const ECONOMY_EDUCATION_TABLE_SCROLL_X_WITH_SELECTION_PERIOD =
  80 + ECONOMY_DATA_COLUMNS_TOTAL_PX_PERIOD

/** 프로그램 목록(일반 교육) — 모집 신청 현황 / 진행 현황 계열 열 최소 너비 */
const PROGRAM_LIFECYCLE_STATUS_COL_MIN_PX = 180

/** 진행 중·완료 프로그램 공통 데이터 열 합 1412px — 8열(학교 수 옆 학생 수) */
const ECONOMY_WIDE_COL_NO = 80
const ECONOMY_WIDE_COL_TITLE = 420
const ECONOMY_WIDE_COL_RECRUIT = 168
const ECONOMY_WIDE_COL_SCHOOL = 150
const ECONOMY_WIDE_COL_STUDENT = 150
const ECONOMY_WIDE_COL_TAIL = 138

const ECONOMY_IN_PROGRESS_DATA_COLUMNS_TOTAL_PX =
  ECONOMY_WIDE_COL_NO +
  ECONOMY_WIDE_COL_TITLE +
  ECONOMY_WIDE_COL_RECRUIT * 2 +
  ECONOMY_WIDE_COL_SCHOOL +
  ECONOMY_WIDE_COL_STUDENT +
  ECONOMY_WIDE_COL_TAIL * 2

export const ECONOMY_IN_PROGRESS_TABLE_SCROLL_X = ECONOMY_IN_PROGRESS_DATA_COLUMNS_TOTAL_PX

export const ECONOMY_IN_PROGRESS_TABLE_SCROLL_X_WITH_SELECTION =
  80 + ECONOMY_IN_PROGRESS_DATA_COLUMNS_TOTAL_PX

function economyColumnWidthPercent(px: number, totalPx: number): string {
  return `${((px / totalPx) * 100).toFixed(4)}%`
}

export interface ResolveEducationColumnsParams {
  studentRecruitmentTable?: boolean
  instructorRecruitmentTable?: boolean
  isEconomyPage?: boolean
  readOnlyLifecycleStatus?: boolean
  /** 경제 교육: URL `status` 없이 「전체 프로그램」 위젯만 선택된 목록 */
  economyAllProgramsActive?: boolean
  /** 경제 교육: 「진행 중인 프로그램」 위젯 — 고정 px 컬럼 세트 */
  economyInProgressActive?: boolean
  /** 경제 교육: 「완료 프로그램」 위젯 — 진행 중과 동일 8열·동일 너비 */
  economyCompletedActive?: boolean
}

export function resolveEducationColumns({
  studentRecruitmentTable,
  instructorRecruitmentTable,
  isEconomyPage,
  readOnlyLifecycleStatus,
  economyAllProgramsActive = false,
  economyInProgressActive = false,
  economyCompletedActive = false,
}: ResolveEducationColumnsParams) {
  if (studentRecruitmentTable) return studentRecruitmentTableColumns

  if (instructorRecruitmentTable) return instructorRecruitmentTableColumns

  if (isEconomyPage) {
    const participantCountRender = (_: unknown, record: Program) => {
      const cap = getCapacity(record)
      const approved = record.approvedStudentCount ?? 0
      if (cap !== undefined) return `${approved} / ${cap}`
      return `${approved}`
    }

    const instructorRecruitRender = (_: unknown, record: Program) => {
      const cap = record.instructorCapacity
      const current = record.instructors ?? 0
      if (cap !== undefined) return `${current} / ${cap}`
      return `${current}`
    }

    if (economyInProgressActive || economyCompletedActive) {
      return [
        {
          title: 'No.',
          key: 'no',
          width: ECONOMY_WIDE_COL_NO,
          minWidth: ECONOMY_WIDE_COL_NO,
          align: 'center' as const,
          className: 'economy-program-table__col-no',
          render: (_: unknown, __: Program, index: number) => index + 1,
        },
        {
          title: '프로그램명',
          dataIndex: 'title',
          key: 'title',
          width: ECONOMY_WIDE_COL_TITLE,
          minWidth: ECONOMY_WIDE_COL_TITLE,
          ellipsis: true,
          align: 'center' as const,
          className: 'economy-program-table__col-title',
          render: (text: string) => text ?? '-',
        },
        {
          title: '참여자 모집 인원',
          key: 'participantCapacity',
          width: ECONOMY_WIDE_COL_RECRUIT,
          minWidth: ECONOMY_WIDE_COL_RECRUIT,
          align: 'center' as const,
          className: 'economy-program-table__col-recruitment',
          render: participantCountRender,
        },
        {
          title: '교육 진행자 모집 인원',
          key: 'instructorRecruitment',
          width: ECONOMY_WIDE_COL_RECRUIT,
          minWidth: ECONOMY_WIDE_COL_RECRUIT,
          align: 'center' as const,
          className: 'economy-program-table__col-instructor-recruit',
          render: instructorRecruitRender,
        },
        {
          title: '총 참여 학교 수',
          key: 'participatingSchoolCount',
          width: ECONOMY_WIDE_COL_SCHOOL,
          minWidth: ECONOMY_WIDE_COL_SCHOOL,
          align: 'center' as const,
          className: 'economy-program-table__col-school-count',
          render: (_: unknown, record: Program) =>
            record.participatingSchoolCount != null ? String(record.participatingSchoolCount) : '-',
        },
        {
          title: '총 참여 학생 수',
          key: 'participatingStudentCount',
          width: ECONOMY_WIDE_COL_STUDENT,
          minWidth: ECONOMY_WIDE_COL_STUDENT,
          align: 'center' as const,
          className: 'economy-program-table__col-student-count',
          render: (_: unknown, record: Program) =>
            record.participatingStudentCount != null
              ? String(record.participatingStudentCount)
              : '-',
        },
        {
          title: '참여자 유형',
          dataIndex: 'category',
          key: 'category',
          width: ECONOMY_WIDE_COL_TAIL,
          minWidth: ECONOMY_WIDE_COL_TAIL,
          align: 'center' as const,
          className: 'economy-program-table__col-category',
          render: (value: ProgramCategory | undefined) => getEconomyParticipantTypeLabel(value),
        },
        {
          title: '교육 대상',
          dataIndex: 'targetLevel',
          key: 'targetLevel',
          width: ECONOMY_WIDE_COL_TAIL,
          minWidth: ECONOMY_WIDE_COL_TAIL,
          align: 'center' as const,
          className: 'economy-program-table__col-target',
          render: (value: TargetLevel | undefined) => getEconomyTargetLevelLabel(value),
        },
      ]
    }

    if (economyAllProgramsActive) {
      const totalPx = ECONOMY_DATA_COLUMNS_TOTAL_PX_PROGRESS
      const w = (px: number) => economyColumnWidthPercent(px, totalPx)
      return [
        {
          title: 'No.',
          key: 'no',
          width: w(ECONOMY_COL_NO_PX),
          minWidth: ECONOMY_COL_NO_PX,
          align: 'center' as const,
          className: 'economy-program-table__col-no',
          render: (_: unknown, __: Program, index: number) => index + 1,
        },
        {
          title: '프로그램명',
          dataIndex: 'title',
          key: 'title',
          width: w(ECONOMY_COL_TITLE_PX),
          minWidth: ECONOMY_COL_TITLE_PX,
          ellipsis: true,
          align: 'center' as const,
          className: 'economy-program-table__col-title',
          render: (text: string) => text ?? '-',
        },
        {
          title: '프로그램 진행 현황',
          key: 'lifecycleProgress',
          width: w(ECONOMY_COL_PROGRESS_PX),
          minWidth: ECONOMY_COL_PROGRESS_PX,
          align: 'center' as const,
          className: 'economy-program-table__col-progress',
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
          width: w(ECONOMY_COL_TAIL_PX),
          minWidth: ECONOMY_COL_TAIL_PX,
          align: 'center' as const,
          className: 'economy-program-table__col-recruitment',
          render: participantCountRender,
        },
        {
          title: '참여자 유형',
          dataIndex: 'category',
          key: 'category',
          width: w(ECONOMY_COL_TAIL_PX),
          minWidth: ECONOMY_COL_TAIL_PX,
          align: 'center' as const,
          className: 'economy-program-table__col-category',
          render: (value: ProgramCategory | undefined) => getEconomyParticipantTypeLabel(value),
        },
        {
          title: '교육 대상',
          dataIndex: 'targetLevel',
          key: 'targetLevel',
          width: w(ECONOMY_COL_TAIL_PX),
          minWidth: ECONOMY_COL_TAIL_PX,
          align: 'center' as const,
          className: 'economy-program-table__col-target',
          render: (value: TargetLevel | undefined) => getEconomyTargetLevelLabel(value),
        },
      ]
    }

    const totalPx = ECONOMY_DATA_COLUMNS_TOTAL_PX_PERIOD
    const w = (px: number) => economyColumnWidthPercent(px, totalPx)
    return [
      {
        title: 'No.',
        key: 'no',
        width: w(ECONOMY_COL_NO_PX),
        minWidth: ECONOMY_COL_NO_PX,
        align: 'center' as const,
        className: 'economy-program-table__col-no',
        render: (_: unknown, __: Program, index: number) => index + 1,
      },
      {
        title: '프로그램명',
        dataIndex: 'title',
        key: 'title',
        width: w(ECONOMY_COL_TITLE_PX),
        minWidth: ECONOMY_COL_TITLE_PX,
        ellipsis: true,
        align: 'center' as const,
        className: 'economy-program-table__col-title',
        render: (text: string) => text ?? '-',
      },
      {
        title: '사업 운영 기간',
        key: 'operationPeriod',
        width: w(ECONOMY_COL_PERIOD_PX),
        minWidth: ECONOMY_COL_PERIOD_PX,
        align: 'center' as const,
        className: 'economy-program-table__col-period',
        render: (_: unknown, record: Program) => formatDateRange(record.startDate, record.endDate),
      },
      {
        title: '참여자 모집 현황',
        key: 'participantCapacity',
        width: w(ECONOMY_COL_TAIL_PX),
        minWidth: ECONOMY_COL_TAIL_PX,
        align: 'center' as const,
        className: 'economy-program-table__col-recruitment',
        render: participantCountRender,
      },
      {
        title: '참여자 유형',
        dataIndex: 'category',
        key: 'category',
        width: w(ECONOMY_COL_TAIL_PX),
        minWidth: ECONOMY_COL_TAIL_PX,
        align: 'center' as const,
        className: 'economy-program-table__col-category',
        render: (value: ProgramCategory | undefined) => getEconomyParticipantTypeLabel(value),
      },
      {
        title: '교육 대상',
        dataIndex: 'targetLevel',
        key: 'targetLevel',
        width: w(ECONOMY_COL_TAIL_PX),
        minWidth: ECONOMY_COL_TAIL_PX,
        align: 'center' as const,
        className: 'economy-program-table__col-target',
        render: (value: TargetLevel | undefined) => getEconomyTargetLevelLabel(value),
      },
    ]
  }

  const capacityColumns = Array.isArray(capacityTableColumnsEducation)
    ? capacityTableColumnsEducation
    : []

  const baseColumns = [
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
      width: PROGRAM_LIFECYCLE_STATUS_COL_MIN_PX,
      minWidth: PROGRAM_LIFECYCLE_STATUS_COL_MIN_PX,
      align: 'center' as const,
      className: readOnlyLifecycleStatus ? undefined : STATUS_DROPDOWN_CELL_CLASSNAME,
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

  return baseColumns
}
