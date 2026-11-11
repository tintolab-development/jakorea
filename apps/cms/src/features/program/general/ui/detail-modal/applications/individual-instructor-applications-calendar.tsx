/**
 * 일반 개인형 강사 신청 목록 — 캘린더 뷰 (시안 03-1/01-2, 9899:148010)
 *
 * 기관형은 기관 신청 일정에 강사를 묶지만 개인형은 기관이 없다. 강사 1명 × 신청 일정 1건 = 이벤트 1개.
 * - 일정: 강사 신청 목록 `availableScheduleIds` × `GET /admin/programs/{id}/schedules`
 * - 셀 「이름 | 자택 지역」, 팝오버 「지역 | 일정 라벨(시간)」, 우측 카드 「이름 | 승인 상태 / 일정 라벨(시간) / 거리·출강·장거리」
 *   일정 라벨은 교육 구조별 SSOT(`resolveEducationScheduleSessionLeadLabel`) — 회차·차시·세부 일정명·사전교육
 * - 우측 상단 기관 multi select 없음
 * - `availableScheduleIds: []`(신청 일정 없음)인 신청도 빠지지 않게: 날짜 셀에는 그리지 않고
 *   우측 목록 날짜 카드 아래에 선택일과 무관하게 「신청 일정 없음」 카드로 항상 보여 준다
 * - 목록 `activityWithdrawn` true → 카드 승인 상태 옆 「활동 포기」 뱃지
 */

import { useCallback, useMemo, type Key } from 'react'
import { useQuery } from '@tanstack/react-query'
import type { Program } from '@/types/domain'
import type { ApplicantInstructorRow } from '@/features/program/shared/model/applicant-instructor'
import type { ApprovalStatusKey } from '@/shared/components/approval-status-badge'
import { generalProgramQueryKeys } from '@/features/program/general/api/general-program-query-keys'
import { fetchAdminProgramSchedulesRemote } from '@/features/program/general/api/program-schedules-api-client'
import {
  buildScheduleIdsPersonCalendarSessions,
  formatPersonCalendarSessionLabel,
} from '@/features/program/general/lib/person-calendar-schedule-sessions'
import { formatParticipatingInstructorHomeAddress } from '@/features/program/general/lib/participating-instructors-table-display'
import {
  buildApplicationProcessedSelectionAlert,
  isApplicationApprovalPendingForBulkSelect,
} from '@/features/program/general/lib/application-processed-selection-alert'
import {
  getInstructorScheduleDispatchStats,
  isInstructorNearDistanceKm,
} from '@/features/program/shared/ui/program-detail/applicant-list/applicant-instructor-schedule-meta'
import { formatApiDistanceKmDisplay } from '@/shared/lib/format-api-distance-km'
import { cmsAlertModal } from '@/shared/ui/cms-alert-modal-api'
import {
  IndividualPersonCalendarView,
  type IndividualPersonCalendarAccessors,
  type IndividualPersonCalendarListItemRenderer,
  type IndividualPersonCalendarUnscheduledListItemRenderer,
} from '../program-status/individual-person-calendar-view'
import {
  IndividualInstructorCalendarCard,
  type IndividualInstructorCalendarCardRow,
} from './individual-instructor-calendar-card'

const EMPTY_SCHEDULES_DESCRIPTION = '신청한 교육 일정이 없습니다.'
/** 일정 없는 신청 카드 2행 */
const UNSCHEDULED_SESSION_LABEL = '신청 일정 없음'

function toCalendarApprovalStatus(status: string | undefined): ApprovalStatusKey {
  if (status === 'approved' || status === 'rejected' || status === 'pending') return status
  return 'pending'
}

/** 일정별 편도 거리(`scheduleDistances`) → 없으면 신청 단위 `distanceKm` */
function resolveScheduleDistance(
  instructor: ApplicantInstructorRow,
  scheduleId: number | null | undefined
): { distanceKm: number | null; longDistance: boolean } {
  const hit =
    scheduleId != null
      ? instructor.scheduleDistances?.find(item => item.scheduleId === scheduleId)
      : undefined
  if (hit) {
    const km = hit.distanceKm
    return {
      distanceKm: typeof km === 'number' && Number.isFinite(km) ? km : null,
      longDistance: hit.longDistance === true,
    }
  }
  const km = instructor.distanceKm
  return {
    distanceKm: typeof km === 'number' && Number.isFinite(km) ? km : null,
    longDistance: instructor.longDistanceYn === true,
  }
}

/** 우측 카드 행 — 일정 카드·일정 없는 카드 공통 */
function buildCardRow(
  instructor: ApplicantInstructorRow,
  personName: string,
  options: { sessionLabel: string; scheduleId?: number | null }
): IndividualInstructorCalendarCardRow {
  const { distanceKm, longDistance } = resolveScheduleDistance(instructor, options.scheduleId)
  const { dispatchCount, longDistanceCount } = getInstructorScheduleDispatchStats({
    programDispatchCount: instructor.programDispatchCount,
    programLongDistanceDispatchCount: instructor.programLongDistanceDispatchCount,
  })
  return {
    instructorName: personName,
    approvalStatus: toCalendarApprovalStatus(instructor.approvalStatus),
    sessionLabel: options.sessionLabel,
    distanceDisplay: formatApiDistanceKmDisplay(distanceKm, { longDistance }),
    isNearDistance: distanceKm != null ? isInstructorNearDistanceKm(distanceKm) : false,
    dispatchCount,
    longDistanceCount,
    activityWithdrawn: instructor.activityWithdrawn === true,
  }
}

function formatHomeRegion(instructor: ApplicantInstructorRow): string {
  const region = formatParticipatingInstructorHomeAddress(instructor.address)
  return region === '-' ? '' : region
}

export interface IndividualInstructorApplicationsCalendarProps {
  program: Program
  instructors: readonly ApplicantInstructorRow[]
  remoteEnabled: boolean
  loading?: boolean
  selectedRowKeys: Key[]
  onSelectionChange: (keys: Key[]) => void
  onInstructorClick: (instructor: ApplicantInstructorRow) => void
  calendarGranularity?: 'month' | 'week'
  onCalendarGranularityChange?: (mode: 'month' | 'week') => void
}

export function IndividualInstructorApplicationsCalendar({
  program,
  instructors,
  remoteEnabled,
  loading = false,
  selectedRowKeys,
  onSelectionChange,
  onInstructorClick,
  calendarGranularity,
  onCalendarGranularityChange,
}: IndividualInstructorApplicationsCalendarProps) {
  const programId = program.id
  const schedulesQuery = useQuery({
    queryKey: generalProgramQueryKeys.schedules(programId),
    queryFn: () => fetchAdminProgramSchedulesRemote(programId),
    enabled: remoteEnabled && Boolean(programId),
    // 다른 일반 상세 화면(서류 합격자·면접)과 같은 프로그램 일정 캐시 정책
    staleTime: 60_000,
  })
  const schedules = schedulesQuery.data

  const sessionsByInstructorId = useMemo(() => {
    const map = new Map<string, ReturnType<typeof buildScheduleIdsPersonCalendarSessions>>()
    for (const instructor of instructors) {
      map.set(
        instructor.id,
        buildScheduleIdsPersonCalendarSessions(instructor.availableScheduleIds, schedules ?? [])
      )
    }
    return map
  }, [instructors, schedules])

  const accessors = useMemo(
    (): IndividualPersonCalendarAccessors<ApplicantInstructorRow> => ({
      getId: instructor => instructor.id,
      getName: instructor => instructor.instructorName?.trim() || '강사',
      getSessions: instructor => sessionsByInstructorId.get(instructor.id),
      getMetaLabels: instructor => {
        const region = formatHomeRegion(instructor)
        return region ? [region] : []
      },
      getCellRightLabel: event => formatHomeRegion(event.originalItem.person) || undefined,
      // 팝오버 「지역 | 일정 라벨 (시간)」
      getPopoverMetaLabels: event => {
        const region = formatHomeRegion(event.originalItem.person)
        const sessionLabel = formatPersonCalendarSessionLabel(event.originalItem.session, program)
        return [region, sessionLabel].filter((label): label is string => Boolean(label))
      },
    }),
    [program, sessionsByInstructorId]
  )

  const instructorById = useMemo(
    () => new Map(instructors.map(instructor => [instructor.id, instructor])),
    [instructors]
  )

  /** 우측 카드 체크 — 기관형 강사 신청 캘린더와 같이 승인 대기만 선택(처리된 건은 안내) */
  const handleSelectionChange = useCallback(
    (ids: string[]) => {
      const current = new Set(selectedRowKeys.map(String))
      const added = ids.filter(id => !current.has(id))
      const blocked = added.some(
        id => !isApplicationApprovalPendingForBulkSelect(instructorById.get(id)?.approvalStatus)
      )
      if (blocked) {
        cmsAlertModal.show(buildApplicationProcessedSelectionAlert('instructor'))
        return
      }
      onSelectionChange(ids)
    },
    [instructorById, onSelectionChange, selectedRowKeys]
  )

  const renderListItem: IndividualPersonCalendarListItemRenderer<ApplicantInstructorRow> =
    useCallback(
      ({ event, checked, onToggle }) => {
        const { person, personId, personName, session } = event.originalItem
        return (
          <IndividualInstructorCalendarCard
            row={buildCardRow(person, personName, {
              sessionLabel: formatPersonCalendarSessionLabel(session, program) ?? '-',
              scheduleId: session.resolvedScheduleId,
            })}
            checked={checked}
            onToggle={next => onToggle(personId, next)}
          />
        )
      },
      [program]
    )

  const renderUnscheduledListItem: IndividualPersonCalendarUnscheduledListItemRenderer<ApplicantInstructorRow> =
    useCallback(
      ({ person, personId, personName, checked, onToggle }) => (
        <IndividualInstructorCalendarCard
          row={buildCardRow(person, personName, { sessionLabel: UNSCHEDULED_SESSION_LABEL })}
          checked={checked}
          onToggle={next => onToggle(personId, next)}
        />
      ),
      []
    )

  const selectedIds = useMemo(() => selectedRowKeys.map(String), [selectedRowKeys])

  return (
    <IndividualPersonCalendarView<ApplicantInstructorRow>
      people={instructors}
      accessors={accessors}
      selectedRowKeys={selectedIds}
      onSelectionChange={handleSelectionChange}
      onPersonClick={onInstructorClick}
      calendarGranularity={calendarGranularity}
      onCalendarGranularityChange={onCalendarGranularityChange}
      renderListItem={renderListItem}
      renderUnscheduledListItem={renderUnscheduledListItem}
      emptyDescription={EMPTY_SCHEDULES_DESCRIPTION}
      loading={loading || (schedulesQuery.isPending && schedulesQuery.fetchStatus !== 'idle')}
    />
  )
}
