import type { ColumnDef } from '@tanstack/react-table'
import type { ColumnsType } from 'antd/es/table'
import type { Application, UserHistory } from '@/types/domain'
import {
  resolveApplicationEnrollmentDisplayStatus,
  resolveMemberProgramTitle,
  resolveMemberProgramYear,
  resolveVolunteerHistoryDisplayStatus,
} from '@/features/user/detail/lib/member-program-history-display'
import {
  PROGRAM_ENROLLMENT_DISPLAY_STATUS_ORDER,
  programEnrollmentEconomyListLabels,
} from '@/shared/constants/status'
import type { TablePageConfig } from '@/shared/components/table-system/types/table-page-config'
import type { TableSearchParamRule } from '@/shared/hooks/use-table-search'
const ALL = ''

export type MemberProgramHistoryMode =
  | 'instructorLecture'
  | 'studentEnrollment'
  | 'volunteerProgram'
  /** 학교 회원 — 프로그램명·진행년도·진행현황·교육분야·교육 학년·담당자 (출석/과제/수료증 열 없음) */
  | 'schoolProgramParticipation'

export type MemberProgramLecturePendingFilters = {
  title: string
  year: string
  enrollmentStatus: string
  managerName: string
}

export type MemberProgramLectureTableContext = {
  mode: MemberProgramHistoryMode
}

function modeSlug(mode: MemberProgramHistoryMode): string {
  switch (mode) {
    case 'instructorLecture':
      return 'il'
    case 'studentEnrollment':
      return 'se'
    case 'volunteerProgram':
      return 'vp'
    case 'schoolProgramParticipation':
      return 'sp'
    default:
      return 'il'
  }
}

function pfx(ctx: MemberProgramLectureTableContext): string {
  return `mplh${modeSlug(ctx.mode)}`
}

function filterApplications(
  applications: Application[],
  searchParams: URLSearchParams,
  ctx: MemberProgramLectureTableContext
): Application[] {
  const pr = pfx(ctx)
  const title = (searchParams.get(`${pr}_title`) ?? '').trim()
  const year = searchParams.get(`${pr}_year`) ?? ''
  const enrollmentStatus = searchParams.get(`${pr}_est`) ?? ''
  const managerName = (searchParams.get(`${pr}_mgr`) ?? '').trim()
  const isSchoolMode = ctx.mode === 'schoolProgramParticipation'

  return applications.filter(app => {
    const t = isSchoolMode
      ? resolveMemberProgramTitle(app.programId, app)
      : resolveMemberProgramTitle(app.programId)
    if (title && !t.includes(title)) return false
    const y = isSchoolMode
      ? resolveMemberProgramYear(app.programId, app)
      : resolveMemberProgramYear(app.programId)
    if (year && (y == null || String(y) !== year)) return false
    const displayStatus = resolveApplicationEnrollmentDisplayStatus(app)
    if (enrollmentStatus && displayStatus !== enrollmentStatus) return false
    const mgr = (app.managerName ?? '').trim()
    if (managerName && !mgr.includes(managerName)) return false
    return true
  })
}

function filterVolunteerHistories(
  rows: UserHistory[],
  searchParams: URLSearchParams,
  ctx: MemberProgramLectureTableContext
): UserHistory[] {
  const pr = pfx(ctx)
  const title = (searchParams.get(`${pr}_title`) ?? '').trim()
  const year = searchParams.get(`${pr}_year`) ?? ''
  const enrollmentStatus = searchParams.get(`${pr}_est`) ?? ''
  const managerName = (searchParams.get(`${pr}_mgr`) ?? '').trim()

  return rows.filter(h => {
    const t = resolveMemberProgramTitle(h.programId, h)
    if (title && !t.includes(title)) return false
    const y = resolveMemberProgramYear(h.programId, h)
    if (year && (y == null || String(y) !== year)) return false
    const displayStatus = resolveVolunteerHistoryDisplayStatus(h)
    if (enrollmentStatus && displayStatus !== enrollmentStatus) return false
    const mgr = (h.managerName ?? '').trim()
    if (managerName && !mgr.includes(managerName)) return false
    return true
  })
}

type Row = Application | UserHistory

const tanstackColumns: ColumnDef<Row>[] = [{ accessorKey: 'id', header: 'id' }]

function paramRules(
  ctx: MemberProgramLectureTableContext
): readonly TableSearchParamRule<MemberProgramLecturePendingFilters>[] {
  const pr = pfx(ctx)
  return [
    {
      kind: 'param',
      filterKey: 'title',
      paramKey: `${pr}_title`,
      condition: f => f.title.trim().length > 0,
      transform: v => String(v).trim(),
    },
    {
      kind: 'param',
      filterKey: 'year',
      paramKey: `${pr}_year`,
      condition: f => Boolean(f.year),
      transform: v => String(v),
    },
    {
      kind: 'param',
      filterKey: 'enrollmentStatus',
      paramKey: `${pr}_est`,
      condition: f => Boolean(f.enrollmentStatus),
      transform: v => String(v),
    },
    {
      kind: 'param',
      filterKey: 'managerName',
      paramKey: `${pr}_mgr`,
      condition: f => f.managerName.trim().length > 0,
      transform: v => String(v).trim(),
    },
  ]
}

export function createMemberProgramLectureTablePageConfig(
  mode: MemberProgramHistoryMode
): TablePageConfig<Row, MemberProgramLecturePendingFilters, MemberProgramLectureTableContext> {
  const ctx: MemberProgramLectureTableContext = { mode }
  return {
    columns: {
      tanstack: tanstackColumns,
      filterKeys: [],
      resolveAntdColumns: (): ColumnsType<Row> => [],
    },
    filters: {
      initialPending: {
        title: '',
        year: ALL,
        enrollmentStatus: ALL,
        managerName: '',
      },
      syncPendingFromUrl: ({ searchParams, setPendingFilters, table: _t, columnFilters: _c, context }) => {
        const pr = pfx(context)
        setPendingFilters(prev => {
          const next: MemberProgramLecturePendingFilters = {
            title: searchParams.get(`${pr}_title`) ?? '',
            year: searchParams.get(`${pr}_year`) ?? ALL,
            enrollmentStatus: searchParams.get(`${pr}_est`) ?? ALL,
            managerName: searchParams.get(`${pr}_mgr`) ?? '',
          }
          if (
            prev.title === next.title &&
            prev.year === next.year &&
            prev.enrollmentStatus === next.enrollmentStatus &&
            prev.managerName === next.managerName
          ) {
            return prev
          }
          return next
        })
      },
      hasActiveFilters: ({ searchParams, context }) => {
        const pr = pfx(context)
        return Boolean(
          (searchParams.get(`${pr}_title`) ?? '').trim() ||
            searchParams.get(`${pr}_year`) ||
            searchParams.get(`${pr}_est`) ||
            (searchParams.get(`${pr}_mgr`) ?? '').trim()
        )
      },
      getBaseCount: ({ filteredData }) => filteredData.length,
      onFilterChange: ({ prev, key, value }) => ({
        ...prev,
        [key]: value === undefined || value === null ? ALL : (value as string),
      }),
    },
    filterFn: ({ context, data, searchParams }) => {
      if (context.mode === 'volunteerProgram') {
        const filtered = filterVolunteerHistories(data as UserHistory[], searchParams, context)
        return { dataForTable: filtered as Row[], filteredData: filtered as Row[] }
      }
      const filtered = filterApplications(data as Application[], searchParams, context)
      return { dataForTable: filtered as Row[], filteredData: filtered as Row[] }
    },
    getSearchSync: () => ({
      paramConfig: paramRules(ctx),
      tableConfig: {},
    }),
  }
}

/** enrollmentStatus select 옵션(라벨) — 필터 카드와 동기 */
export function memberProgramEnrollmentStatusFieldOptions() {
  return [
    { label: '전체', value: ALL },
    ...PROGRAM_ENROLLMENT_DISPLAY_STATUS_ORDER.map(value => ({
      label: programEnrollmentEconomyListLabels[value],
      value,
    })),
  ]
}
