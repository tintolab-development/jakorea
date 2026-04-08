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

export interface ResolveEducationColumnsParams {
  studentRecruitmentTable?: boolean
  instructorRecruitmentTable?: boolean
  isEconomyPage?: boolean
  readOnlyLifecycleStatus?: boolean
  /** 경제 교육: 「전체 프로그램」위젯 */
  economyAllProgramsActive?: boolean
  /** 경제 교육: 「예정 프로그램」위젯 */
  economyScheduledActive?: boolean
  /** 경제 교육: 「진행 중인 프로그램」위젯 */
  economyInProgressActive?: boolean
  /** 경제 교육: 「완료 프로그램」위젯 (전체와 동일 컬럼) */
  economyCompletedActive?: boolean
}

export function resolveEducationColumns({
  studentRecruitmentTable,
  instructorRecruitmentTable,
  isEconomyPage,
  readOnlyLifecycleStatus = false,
  economyAllProgramsActive = false,
  economyScheduledActive = false,
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

    const volunteerRecruitRender = (_: unknown, record: Program) => {
      const current =
        (record.generalVolunteers ?? 0) +
        (record.staffVolunteers ?? 0) +
        (record.returningVolunteers ?? 0)
      return current > 0 ? String(current) : '-'
    }

    const WIDTH_NO = 64
    const WIDTH_PROGRAM_TITLE = 600

    /** 「전체 프로그램」「완료 프로그램」— No. + 프로그램명·진행 현황·모집·유형·대상 */
    if (economyAllProgramsActive || economyCompletedActive) {
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
          render: participantCountRender,
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
    if (economyScheduledActive) {
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
          render: (_: unknown, record: Program) =>
            formatDateRange(record.startDate, record.endDate),
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
    if (economyInProgressActive) {
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
            record.participatingStudentCount != null
              ? String(record.participatingStudentCount)
              : '-',
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

    /** 비정상 상태: 전체 프로그램 컬럼과 동일 */
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
        render: participantCountRender,
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
      width: 180,
      minWidth: 180,
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
