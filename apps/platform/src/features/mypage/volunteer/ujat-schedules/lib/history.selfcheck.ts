import assert from 'node:assert/strict'
import { isWithdrawnBeforeEducation } from '../../../education/applications/lib/display-status.ts'
import { platformQueryKeys } from '../../../../../shared/api/query-keys.ts'
import type { EducationScheduleItem } from '../../../education/schedules/model/types.ts'
import { resolveVolunteerSchedulePanelKind } from '../../lib/schedule-panel-kind.ts'
import { mapPortalScheduleAttendanceDetail } from './map-attendance.ts'
import {
  canCheckInUjatSchedule,
  canViewUjatScheduleAttendance,
  hasQueryableUjatEducationHistory,
  isUjatVolunteerOwnScheduleRecord,
  resolveScheduleAttendanceQueryErrorMessage,
  resolveUjatVolunteerWithdrawnDetailView,
} from './history.ts'

function item(
  overrides: Partial<EducationScheduleItem> & Pick<EducationScheduleItem, 'id'>,
): EducationScheduleItem {
  return {
    sessionNumber: 1,
    heldAt: '2026-04-04T10:00:00+09:00',
    title: '교육',
    attendanceStatus: null,
    ...overrides,
  }
}

function schedulesQuery(
  overrides: Partial<{
    enabled: boolean
    isLoading: boolean
    isError: boolean
    items: EducationScheduleItem[]
  }>,
) {
  return {
    enabled: true,
    isLoading: false,
    isError: false,
    items: [],
    ...overrides,
  }
}

const withdrawnBase = {
  isUjatVolunteer: true as const,
  displayStatus: 'withdrawn' as const,
}

// WD-FE-01
assert.equal(
  resolveUjatVolunteerWithdrawnDetailView({
    ...withdrawnBase,
    schedulesQuery: schedulesQuery({ items: [] }),
  }),
  'applied',
)
assert.equal(
  resolveUjatVolunteerWithdrawnDetailView({
    ...withdrawnBase,
    schedulesQuery: schedulesQuery({
      items: [
        item({
          id: 'program-only',
          assignmentStatus: null,
          availableActions: [],
        }),
      ],
    }),
  }),
  'applied',
)

// 일반 봉사는 공용 기본값(교육 전 포기)을 유지한다.
assert.equal(
  isWithdrawnBeforeEducation({ displayStatus: 'withdrawn' }),
  true,
)
assert.equal(
  resolveUjatVolunteerWithdrawnDetailView({
    isUjatVolunteer: false,
    displayStatus: 'withdrawn',
    schedulesQuery: schedulesQuery({ items: [] }),
  }),
  null,
)

// WD-FE-02 시작 전 배정 취소는 본인 참여 이력으로 보지 않는다.
const cancelledBeforeStart = item({
  id: 'cancelled-before',
  assignmentStatus: 'CANCELLED',
  attendanceStatus: null,
})
assert.equal(isUjatVolunteerOwnScheduleRecord(cancelledBeforeStart), false)
assert.equal(hasQueryableUjatEducationHistory(cancelledBeforeStart), false)
assert.equal(
  resolveUjatVolunteerWithdrawnDetailView({
    ...withdrawnBase,
    schedulesQuery: schedulesQuery({ items: [cancelledBeforeStart] }),
  }),
  'applied',
)

// WD-FE-03 PRESENT
const present = item({
  id: 'present-1',
  attendanceStatus: 'present',
  assignmentStatus: 'ASSIGNED',
  scheduleId: 11,
})
assert.equal(hasQueryableUjatEducationHistory(present), true)
assert.equal(isUjatVolunteerOwnScheduleRecord(present), true)
assert.equal(
  resolveUjatVolunteerWithdrawnDetailView({
    ...withdrawnBase,
    schedulesQuery: schedulesQuery({ items: [present] }),
  }),
  'history',
)

// WD-FE-04 과거 출석 + 이후 취소. 취소만 있는 일정은 제외.
const laterCancelled = item({
  id: 'later-cancelled',
  assignmentStatus: 'CANCELLED',
  attendanceStatus: null,
  scheduleId: 12,
})
assert.equal(isUjatVolunteerOwnScheduleRecord(present, { includeAssignedWithoutAttendance: false }), true)
assert.equal(isUjatVolunteerOwnScheduleRecord(laterCancelled), false)

// WD-FE-05 ABSENT만 — 조회는 유지, 참여 완료로 단정하지 않음
const absentOnly = item({
  id: 'absent-1',
  attendanceStatus: 'absent',
  scheduleId: 13,
})
assert.equal(hasQueryableUjatEducationHistory(absentOnly), true)
assert.equal(absentOnly.attendanceStatus === 'present', false)
assert.equal(
  resolveUjatVolunteerWithdrawnDetailView({
    ...withdrawnBase,
    schedulesQuery: schedulesQuery({ items: [absentOnly] }),
  }),
  'history',
)

// WD-FE-06 LATE / EXCUSED
const late = item({ id: 'late-1', attendanceStatus: 'late', scheduleId: 14 })
const excused = item({ id: 'excused-1', attendanceStatus: 'excused', scheduleId: 15 })
assert.equal(late.attendanceStatus, 'late')
assert.equal(excused.attendanceStatus, 'excused')
assert.equal(hasQueryableUjatEducationHistory(late), true)
assert.equal(hasQueryableUjatEducationHistory(excused), true)

// WD-FE-07 / WD-FE-08 VIEW_ATTENDANCE
const viewAttendance = item({
  id: 'view-1',
  scheduleId: 16,
  availableActions: ['VIEW_ATTENDANCE'],
})
const noView = item({
  id: 'no-view',
  scheduleId: 17,
  attendanceStatus: 'present',
  availableActions: ['CHECK_IN'],
})
assert.equal(canViewUjatScheduleAttendance(viewAttendance), true)
assert.equal(canViewUjatScheduleAttendance(noView), false)
assert.equal(hasQueryableUjatEducationHistory(viewAttendance), true)

// WD-FE-09 GIVE_UP 후 CHECK_IN 없음
assert.equal(
  canCheckInUjatSchedule(
    item({ id: 'checkin', availableActions: ['CHECK_IN', 'VIEW_ATTENDANCE'] }),
    { withdrawn: true },
  ),
  false,
)
assert.equal(
  canCheckInUjatSchedule(
    item({ id: 'checkin-active', availableActions: ['CHECK_IN'] }),
    { withdrawn: false },
  ),
  true,
)

// WD-FE-10 출결 상세 401/403
assert.equal(
  resolveScheduleAttendanceQueryErrorMessage({ response: { status: 401 } }),
  '출결 상세를 조회할 권한이 없습니다.',
)
assert.equal(
  resolveScheduleAttendanceQueryErrorMessage({ response: { status: 403 } }),
  '출결 상세를 조회할 권한이 없습니다.',
)

// WD-FE-11 H1/H2 캐시 키 분리
const h1Schedules = platformQueryKeys.mypage.programApplications.schedules('VOLUNTEER', '101')
const h2Schedules = platformQueryKeys.mypage.programApplications.schedules('VOLUNTEER', '202')
const h1Attendance = platformQueryKeys.mypage.programApplications.scheduleAttendance(
  'VOLUNTEER',
  '101',
  16,
)
const h2Attendance = platformQueryKeys.mypage.programApplications.scheduleAttendance(
  'VOLUNTEER',
  '202',
  16,
)
assert.notDeepEqual(h1Schedules, h2Schedules)
assert.notDeepEqual(h1Attendance, h2Attendance)
assert.equal(h1Schedules.includes('101'), true)
assert.equal(h2Schedules.includes('202'), true)

// WD-FE-12 일반 봉사자 assignments
assert.equal(resolveVolunteerSchedulePanelKind('volunteer'), 'assignments')
assert.equal(resolveVolunteerSchedulePanelKind('general'), 'assignments')
assert.equal(resolveVolunteerSchedulePanelKind(undefined), 'assignments')

// WD-FE-13 일반 UJAT 진행중 schedules
assert.equal(resolveVolunteerSchedulePanelKind('ujat-volunteer'), 'ujat-schedules')
const assignedInProgress = item({
  id: 'assigned-open',
  assignmentStatus: 'ASSIGNED',
  attendanceStatus: null,
  scheduleId: 18,
})
assert.equal(
  isUjatVolunteerOwnScheduleRecord(assignedInProgress, {
    includeAssignedWithoutAttendance: true,
  }),
  true,
)
assert.equal(
  isUjatVolunteerOwnScheduleRecord(assignedInProgress, {
    includeAssignedWithoutAttendance: false,
  }),
  false,
)

// WD-FE-14 일정 API 오류를 교육 전 포기/이력 없음으로 보지 않는다.
assert.equal(
  resolveUjatVolunteerWithdrawnDetailView({
    ...withdrawnBase,
    schedulesQuery: schedulesQuery({ isError: true, items: [] }),
  }),
  'error',
)
assert.equal(
  resolveUjatVolunteerWithdrawnDetailView({
    ...withdrawnBase,
    schedulesQuery: schedulesQuery({ isLoading: true, items: [] }),
  }),
  'loading',
)

// WD-FE-15 같은 신청·같은 scheduleId 출결 키 유지
const again = platformQueryKeys.mypage.programApplications.scheduleAttendance(
  'VOLUNTEER',
  '101',
  16,
)
assert.deepEqual(h1Attendance, again)

const mappedActions = item({
  id: '44',
  scheduleId: 44,
  attendanceStatus: 'late',
  availableActions: ['VIEW_ATTENDANCE', 'CHECK_IN'],
  assignmentStatus: 'ASSIGNED',
  classLabel: '3학년 2반',
  locationName: '서울초등학교',
})
assert.equal(canViewUjatScheduleAttendance(mappedActions), true)

const attendanceDetail = mapPortalScheduleAttendanceDetail({
  attendanceStatus: 'PRESENT',
  classLabel: '2학년 1반',
  assignmentStatus: 'ASSIGNED',
  canCheckIn: false,
  absenceReason: null,
  locationName: '부산초등학교',
})
assert.equal(attendanceDetail.attendanceLabel, '출석')
assert.equal(attendanceDetail.classLabel, '2학년 1반')
assert.equal(attendanceDetail.canCheckIn, false)
assert.equal(attendanceDetail.absenceReason, '-')

console.log('ujat volunteer withdrawal history.selfcheck: ok')
