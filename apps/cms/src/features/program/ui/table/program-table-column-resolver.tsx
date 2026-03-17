import { STATUS_DROPDOWN_CELL_CLASSNAME } from '@/shared/components/status-dropdown-cell'
import { ProgramLifecycleStatusBadge } from '@/shared/components/program-lifecycle-status-badge'
import { optionalColumns } from '../constants/program-list-columns'
import { categoryOptions } from '../constants/program-list-constants'
import type { Program, ProgramCategory } from '@/types/domain'

export function resolveEducationColumns({
  studentRecruitmentTable,
  instructorRecruitmentTable,
  studentRecruitmentTableColumns,
  instructorRecruitmentTableColumns,
  isEconomyPage,
  readOnlyLifecycleStatus,
  capacityTableColumnsEconomy,
  capacityTableColumnsEducation,
}: any) {
  if (studentRecruitmentTable) return studentRecruitmentTableColumns

  if (instructorRecruitmentTable) return instructorRecruitmentTableColumns

  const capacityColumn = isEconomyPage ? capacityTableColumnsEconomy : capacityTableColumnsEducation
  // prevent undefined columns
  const capacityColumns = Array.isArray(capacityColumn)
    ? capacityColumn
    : capacityColumn
      ? [capacityColumn]
      : []

  const hiddenKeysOnEconomy = new Set([
    'businessArea',
    'type',
    'operationPeriod',
    'sponsorId',
    'owner',
  ])

  const filteredOptionalColumns = isEconomyPage
    ? optionalColumns.filter(col => !hiddenKeysOnEconomy.has(col.key))
    : optionalColumns

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
      width: 140,
      align: 'center' as const,
      className: readOnlyLifecycleStatus ? undefined : STATUS_DROPDOWN_CELL_CLASSNAME,
      render: (_: unknown, record: Program) =>
        record.lifecycleStatus ? (
          <ProgramLifecycleStatusBadge status={record.lifecycleStatus} />
        ) : (
          '-'
        ),
    },

    // safe spread
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

    ...filteredOptionalColumns,
  ]

  return baseColumns
}
