import type { ColumnDef } from '@tanstack/react-table'
import dayjs, { type Dayjs } from 'dayjs'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import { programLifecycleStatusConfig } from '@/shared/constants/status'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'
import {
  economyProgramListAfterApplyParams,
  economyProgramListParamConfig,
  economyProgramListTableConfig,
  educationProgramListParamConfig,
  educationProgramListTableConfig,
  type ProgramListPendingFilters,
} from '../model/program-list-search-sync'
import type { ProgramListProgramMode } from '../model/program-list-program-mode'
import { getRecruitmentStatus } from './constants/program-list-constants'
import { resolveEducationColumns, type EconomyView } from './table/program-table-column-resolver'

dayjs.extend(isSameOrBefore)
dayjs.extend(isSameOrAfter)

const economyFilterLifecycleStatuses = new Set<ProgramLifecycleStatus>(
  programLifecycleStatusConfig.order
)
const participantRecruitmentFilterValues = new Set(['scheduled', 'recruiting', 'closed'])

export type ProgramTableContext = {
  mode: ProgramListProgramMode
  view: EconomyView
  tableType?: 'student' | 'instructor'
  effectiveLifecycleStatus?: ProgramLifecycleStatus | null
}

const tanstackColumns: ColumnDef<Program>[] = [
  { accessorKey: 'title', header: '프로그램명' },
  { accessorKey: 'sponsorId', header: '스폰서' },
  { accessorKey: 'type', header: '유형' },
  { accessorKey: 'format', header: '형태' },
  { accessorKey: 'status', header: '상태' },
  { accessorKey: 'lifecycleStatus', header: '진행 상태' },
  { accessorKey: 'category', header: '수강 대상' },
  { accessorKey: 'businessArea', header: '교육 분야' },
  { accessorKey: 'targetLevel', header: '교육 대상' },
  { accessorKey: 'institutionType', header: '기관 구분' },
]

const filterKeys = [
  'title',
  'sponsorId',
  'type',
  'category',
  'businessArea',
  'targetLevel',
  'institutionType',
] as const

function parseDateRange(
  searchParams: URLSearchParams,
  startKey: string,
  endKey: string
): [Dayjs | null, Dayjs | null] | null {
  const start = searchParams.get(startKey)
  const end = searchParams.get(endKey)
  if (!start || !end) return null
  const startDate = dayjs(start)
  const endDate = dayjs(end)
  if (!startDate.isValid() || !endDate.isValid()) return null
  return [startDate, endDate]
}

function filterByOperationAndApplicationPeriods(
  data: Program[],
  operationPeriodRange: [Dayjs | null, Dayjs | null] | null,
  applicationPeriodRange: [Dayjs | null, Dayjs | null] | null
): Program[] {
  let filtered = data

  if (operationPeriodRange?.[0] && operationPeriodRange?.[1]) {
    const rangeStart = operationPeriodRange[0].startOf('day')
    const rangeEnd = operationPeriodRange[1].endOf('day')
    filtered = filtered.filter(program => {
      if (!program.startDate || !program.endDate) {
        return false
      }
      const startDate = dayjs(program.startDate)
      const endDate = dayjs(program.endDate)
      if (!startDate.isValid() || !endDate.isValid()) {
        return false
      }
      return startDate.isSameOrBefore(rangeEnd) && endDate.isSameOrAfter(rangeStart)
    })
  }

  if (applicationPeriodRange?.[0] && applicationPeriodRange?.[1]) {
    const rangeStart = applicationPeriodRange[0].startOf('day')
    const rangeEnd = applicationPeriodRange[1].endOf('day')
    filtered = filtered.filter(program => {
      if (program.applicationStartDate && program.applicationEndDate) {
        const appStart = dayjs(program.applicationStartDate)
        const appEnd = dayjs(program.applicationEndDate)
        if (!appStart.isValid() || !appEnd.isValid()) {
          return false
        }
        return appStart.isSameOrBefore(rangeEnd) && appEnd.isSameOrAfter(rangeStart)
      }
      return false
    })
  }

  return filtered
}

export function getProgramTablePageConfig(
  _context: ProgramTableContext
): TablePageConfig<Program, ProgramListPendingFilters, ProgramTableContext> {
  return {
    columns: {
      tanstack: tanstackColumns,
      filterKeys: [...filterKeys],
      resolveAntdColumns: ctx => {
        return resolveEducationColumns({
          studentRecruitmentTable: ctx.tableType === 'student',
          instructorRecruitmentTable: ctx.tableType === 'instructor',
          isEconomyPage: ctx.mode === 'economy',
          programMode: ctx.mode,
          economyView: ctx.mode === 'economy' ? ctx.view : undefined,
        })
      },
    },

    filters: {
      initialPending: {
        title: '',
        lifecycleStatus: undefined,
        category: undefined,
        businessArea: undefined,
        targetLevel: undefined,
        type: undefined,
        participantRecruitment: undefined,
        applicationStartDate: null,
        applicationEndDate: null,
        operationStartDate: null,
        operationEndDate: null,
      },

      syncPendingFromUrl: ({ context: ctx, searchParams, table, columnFilters, setPendingFilters }) => {
        if (ctx.mode === 'economy') {
          const titleFromUrl = searchParams.get('title') || ''
          const lifecycleRaw = searchParams.get('lifecycleStatus') || ''
          const lifecycleFromUrl =
            lifecycleRaw &&
            economyFilterLifecycleStatuses.has(lifecycleRaw as ProgramLifecycleStatus)
              ? (lifecycleRaw as ProgramLifecycleStatus)
              : undefined
          const categoryFilter = searchParams.get('category') || undefined
          const targetLevelFilter = searchParams.get('targetLevel') || undefined
          const participantRaw = searchParams.get('participantRecruitment') || ''
          const participantFromUrl = participantRecruitmentFilterValues.has(participantRaw)
            ? participantRaw
            : undefined
          const operationStartDateStr = searchParams.get('operationStartDate')
          const operationEndDateStr = searchParams.get('operationEndDate')

          setPendingFilters(prev => {
            const hasChanges =
              prev.title !== titleFromUrl ||
              prev.lifecycleStatus !== lifecycleFromUrl ||
              prev.category !== categoryFilter ||
              prev.targetLevel !== targetLevelFilter ||
              prev.participantRecruitment !== participantFromUrl ||
              prev.operationStartDate?.format('YYYY-MM-DD') !== operationStartDateStr ||
              prev.operationEndDate?.format('YYYY-MM-DD') !== operationEndDateStr

            if (!hasChanges) return prev

            return {
              ...prev,
              title: titleFromUrl,
              lifecycleStatus: lifecycleFromUrl,
              category: categoryFilter,
              targetLevel: targetLevelFilter,
              participantRecruitment: participantFromUrl,
              operationStartDate: operationStartDateStr
                ? dayjs(operationStartDateStr).isValid()
                  ? dayjs(operationStartDateStr)
                  : null
                : null,
              operationEndDate: operationEndDateStr
                ? dayjs(operationEndDateStr).isValid()
                  ? dayjs(operationEndDateStr)
                  : null
                : null,
            }
          })
        } else {
          const titleFromUrl = searchParams.get('title') || ''
          const titleFilter = columnFilters.find(f => f.id === 'title')?.value as
            | string
            | undefined
          const currentTitle = titleFromUrl || titleFilter || ''

          if (currentTitle !== ((table.getColumn('title')?.getFilterValue() as string) || '')) {
            table.getColumn('title')?.setFilterValue(currentTitle || null)
          }

          const categoryFilter = columnFilters.find(f => f.id === 'category')?.value as
            | string
            | undefined
          const businessAreaFilter = columnFilters.find(f => f.id === 'businessArea')?.value as
            | string
            | undefined
          const targetLevelFilter = columnFilters.find(f => f.id === 'targetLevel')?.value as
            | string
            | undefined

          const statusFromUrl = searchParams.get('status') as ProgramLifecycleStatus | null
          const statusFilter = statusFromUrl ?? ctx.effectiveLifecycleStatus ?? null
          const typeFilter = searchParams.get('type') || null

          const operationStartDateStr = searchParams.get('operationStartDate')
          const operationEndDateStr = searchParams.get('operationEndDate')

          setPendingFilters(prev => {
            const hasChanges =
              prev.title !== currentTitle ||
              prev.lifecycleStatus !== (statusFilter || undefined) ||
              prev.type !== (typeFilter || undefined) ||
              prev.category !== categoryFilter ||
              prev.businessArea !== businessAreaFilter ||
              prev.targetLevel !== targetLevelFilter ||
              prev.operationStartDate?.format('YYYY-MM-DD') !== operationStartDateStr ||
              prev.operationEndDate?.format('YYYY-MM-DD') !== operationEndDateStr

            if (!hasChanges) return prev

            return {
              ...prev,
              title: currentTitle,
              lifecycleStatus: statusFilter || undefined,
              category: categoryFilter,
              businessArea: businessAreaFilter,
              targetLevel: targetLevelFilter,
              type: typeFilter || undefined,
              applicationStartDate: null,
              applicationEndDate: null,
              operationStartDate: operationStartDateStr
                ? dayjs(operationStartDateStr).isValid()
                  ? dayjs(operationStartDateStr)
                  : null
                : null,
              operationEndDate: operationEndDateStr
                ? dayjs(operationEndDateStr).isValid()
                  ? dayjs(operationEndDateStr)
                  : null
                : null,
            }
          })
        }
      },

      hasActiveFilters: ({ context: ctx, searchParams, columnFilters }) => {
        if (ctx.mode === 'economy') {
          const isScheduled = ctx.view === 'SCHEDULED'
          const isInProgress = ctx.view === 'IN_PROGRESS'
          const title = searchParams.get('title') || ''
          const lifecycleRaw = searchParams.get('lifecycleStatus') || ''
          const hasLifecycleFilter =
            !isScheduled &&
            !isInProgress &&
            lifecycleRaw !== '' &&
            economyFilterLifecycleStatuses.has(lifecycleRaw as ProgramLifecycleStatus)
          const hasOperationPeriod = Boolean(
            searchParams.get('operationStartDate') && searchParams.get('operationEndDate')
          )
          const participantRaw = searchParams.get('participantRecruitment') || ''
          const hasParticipantRecruitmentFilter =
            !isInProgress && participantRecruitmentFilterValues.has(participantRaw)
          const hasColumnFilter = columnFilters.some(
            f => f.value != null && String(f.value).trim() !== ''
          )
          return Boolean(
            hasColumnFilter ||
              title.trim() !== '' ||
              hasLifecycleFilter ||
              hasOperationPeriod ||
              hasParticipantRecruitmentFilter
          )
        }

        const operationPeriodRange = parseDateRange(
          searchParams,
          'operationStartDate',
          'operationEndDate'
        )
        const applicationPeriodRange = parseDateRange(
          searchParams,
          'applicationStartDate',
          'applicationEndDate'
        )

        const hasColumnFilter = columnFilters.some(
          f => f.value != null && String(f.value).trim() !== ''
        )
        return Boolean(
          hasColumnFilter ||
            (operationPeriodRange?.[0] && operationPeriodRange?.[1]) ||
            (applicationPeriodRange?.[0] && applicationPeriodRange?.[1])
        )
      },

      getBaseCount: ({ filteredData }) => filteredData.length,
    },

    filterFn: ({ context: ctx, data, searchParams }) => {
      const operationPeriodRange = parseDateRange(
        searchParams,
        'operationStartDate',
        'operationEndDate'
      )
      const applicationPeriodRange = parseDateRange(
        searchParams,
        'applicationStartDate',
        'applicationEndDate'
      )

      const filteredData = filterByOperationAndApplicationPeriods(
        data,
        operationPeriodRange,
        applicationPeriodRange
      )

      if (ctx.mode !== 'economy') {
        return { dataForTable: filteredData, filteredData }
      }

      /** 전체·완료 탭에서만「프로그램 진행 현황」필터 사용 */
      const applyLifecycleFromUrl = ctx.view !== 'SCHEDULED' && ctx.view !== 'IN_PROGRESS'
      /** 진행 중 탭에는「참여자 모집」필터 없음 — URL 잔존 값 무시 */
      const applyParticipantRecruitmentFromUrl = ctx.view !== 'IN_PROGRESS'

      const title = searchParams.get('title') || ''
      const lifecycleRaw = searchParams.get('lifecycleStatus') || ''
      const lifecycleFilter =
        lifecycleRaw && economyFilterLifecycleStatuses.has(lifecycleRaw as ProgramLifecycleStatus)
          ? (lifecycleRaw as ProgramLifecycleStatus)
          : null
      const categoryFilter = searchParams.get('category') || ''
      const targetLevelFilter = searchParams.get('targetLevel') || ''
      const participantRaw = searchParams.get('participantRecruitment') || ''
      const participantFilter = participantRecruitmentFilterValues.has(participantRaw)
        ? participantRaw
        : null

      let result = filteredData
      if (title.trim()) {
        const q = title.trim().toLowerCase()
        result = result.filter(p => p.title?.toLowerCase().includes(q))
      }
      if (lifecycleFilter && applyLifecycleFromUrl) {
        result = result.filter(p => p.lifecycleStatus === lifecycleFilter)
      }
      if (categoryFilter) {
        result = result.filter(p => p.category === categoryFilter)
      }
      if (targetLevelFilter) {
        result = result.filter(p => p.targetLevel === targetLevelFilter)
      }
      if (participantFilter && applyParticipantRecruitmentFromUrl) {
        result = result.filter(p => getRecruitmentStatus(p) === participantFilter)
      }

      return { dataForTable: result, filteredData }
    },

    getSearchSync: ctx => {
      if (ctx.mode === 'economy') {
        return {
          paramConfig: economyProgramListParamConfig,
          tableConfig: economyProgramListTableConfig,
          afterApplyParams: (nextParams: URLSearchParams, _filters: ProgramListPendingFilters) => {
            economyProgramListAfterApplyParams(nextParams)
          },
        }
      }
      return {
        paramConfig: educationProgramListParamConfig,
        tableConfig: educationProgramListTableConfig,
        afterApplyParams: undefined,
      }
    },
  }
}

