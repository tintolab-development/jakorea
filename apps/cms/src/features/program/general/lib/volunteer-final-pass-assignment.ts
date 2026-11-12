/**
 * 일반(기관형) 봉사자 — 면접 합격 시 기관 배정 (BE A1)
 * - 후보: GET /api/admin/programs/{programId}/volunteer-assignments/candidates
 * - 저장: POST /api/admin/volunteer-applications/{id}/final-result 의 `assignments`
 * 시안: 04-2 봉사자 신청 상세 / 16-2 봉사자 배정 안내 팝업(4968:105398) — 「기관 배정 안내」
 */

import type { FinalPassAssignment } from '@/shared/api/generated/dashboard/schemas/finalPassAssignment'
import type { VolunteerAssignmentCandidateResponse } from '@/shared/api/generated/dashboard/schemas/volunteerAssignmentCandidateResponse'
import { extractApiErrorCode, extractApiErrorMessage } from '@/shared/lib/extract-api-error-message'

export type VolunteerFinalPassAssignmentSlot = {
  /** `${scheduleId}:${organizationApplicationId}` */
  key: string
  scheduleId: number
  organizationApplicationId: number
  /** 서울 달력일 YYYY-MM-DD */
  dateKey: string
  organizationName: string
  /** 「시/도 시/군/구」 — 둘 다 없으면 `-` */
  region: string
  /** 「N회차」 — sessionNo 없으면 빈 문자열 */
  sessionLabel: string
  /** 「HH:mm ~ HH:mm」 (서울 시간) */
  timeRange: string
  /** 이 기관·회차에 배정된 봉사자 수 */
  assignedCount: number
  /** 배정 태그 — 「2026.03.19(목) 제이초등학교」 */
  tagLabel: string
}

const SEOUL_TZ = 'Asia/Seoul'

function seoulParts(iso: string): { dateKey: string; time: string; weekday: string } | null {
  const stamp = new Date(iso)
  if (Number.isNaN(stamp.getTime())) return null
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SEOUL_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(stamp)
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find(p => p.type === type)?.value ?? ''
  const weekday = new Intl.DateTimeFormat('ko-KR', { timeZone: SEOUL_TZ, weekday: 'short' })
    .format(stamp)
    .replace('요일', '')
  return {
    dateKey: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
    weekday,
  }
}

function formatRegion(sido?: string | null, sigungu?: string | null): string {
  const text = [sido?.trim(), sigungu?.trim()].filter(Boolean).join(' ')
  return text || '-'
}

/** 후보 응답 → 화면 슬롯. 필수 값(scheduleId·organizationApplicationId·시작 시각)이 없는 행은 버린다. */
export function mapVolunteerAssignmentCandidatesToSlots(
  rows: readonly VolunteerAssignmentCandidateResponse[]
): VolunteerFinalPassAssignmentSlot[] {
  const slots: VolunteerFinalPassAssignmentSlot[] = []
  for (const row of rows) {
    const scheduleId = row.scheduleId
    const organizationApplicationId = row.organizationApplicationId
    if (scheduleId == null || organizationApplicationId == null || !row.scheduleStartAt) continue
    const start = seoulParts(row.scheduleStartAt)
    if (!start) continue
    const end = row.scheduleEndAt ? seoulParts(row.scheduleEndAt) : null
    const organizationName = row.organizationName?.trim() || '-'
    const [y, m, d] = start.dateKey.split('-')
    slots.push({
      key: `${scheduleId}:${organizationApplicationId}`,
      scheduleId,
      organizationApplicationId,
      dateKey: start.dateKey,
      organizationName,
      region: formatRegion(row.regionSido, row.regionSigungu),
      sessionLabel: row.sessionNo != null ? `${row.sessionNo}회차` : '',
      timeRange: end ? `${start.time} ~ ${end.time}` : start.time,
      assignedCount: row.assignedVolunteerCount ?? 0,
      tagLabel: `${y}.${m}.${d}(${start.weekday}) ${organizationName}`,
    })
  }
  return slots
}

export function groupVolunteerAssignmentSlotDateKeys(
  slots: readonly VolunteerFinalPassAssignmentSlot[]
): Set<string> {
  return new Set(slots.map(slot => slot.dateKey))
}

/**
 * 「일정은 하루에 1개의 기관에만 배정 가능」 — 같은 날 이미 다른 기관을 골랐으면 그 기관 슬롯은 고를 수 없다.
 * (서버도 409 VOLUNTEER_ASSIGNMENT_SCHEDULE_CONFLICT 로 거절 — 화면에서 미리 막는다)
 */
export function isVolunteerAssignmentSlotBlocked(
  slot: VolunteerFinalPassAssignmentSlot,
  selected: readonly VolunteerFinalPassAssignmentSlot[]
): boolean {
  return selected.some(
    item =>
      item.key !== slot.key &&
      item.dateKey === slot.dateKey &&
      item.organizationApplicationId !== slot.organizationApplicationId
  )
}

/** 슬롯 선택 토글 — 이미 고른 슬롯이면 해제, 막힌 슬롯이면 그대로. 결과는 날짜·시작 시각 순. */
export function toggleVolunteerAssignmentSlot(
  selected: readonly VolunteerFinalPassAssignmentSlot[],
  slot: VolunteerFinalPassAssignmentSlot
): VolunteerFinalPassAssignmentSlot[] {
  if (selected.some(item => item.key === slot.key)) {
    return selected.filter(item => item.key !== slot.key)
  }
  if (isVolunteerAssignmentSlotBlocked(slot, selected)) return [...selected]
  return [...selected, slot].sort(
    (a, b) =>
      a.dateKey.localeCompare(b.dateKey) ||
      a.timeRange.localeCompare(b.timeRange) ||
      a.organizationName.localeCompare(b.organizationName, 'ko')
  )
}

/** final-result `assignments` — 선택이 없으면 undefined(필드 생략 = 합격만 처리) */
export function toVolunteerFinalPassAssignments(
  selected: readonly VolunteerFinalPassAssignmentSlot[]
): FinalPassAssignment[] | undefined {
  if (selected.length === 0) return undefined
  return selected.map(slot => ({
    scheduleId: slot.scheduleId,
    organizationApplicationId: slot.organizationApplicationId,
  }))
}

const ASSIGNMENT_ERROR_CODE_PREFIXES = [
  'VOLUNTEER_ASSIGNMENT_',
  'VOLUNTEER_FINAL_RESULT_ASSIGNMENT',
  'GENERAL_ORGANIZATION_VOLUNTEER_ASSIGNMENT_',
] as const

/**
 * 합격+배정 한 트랜잭션 실패 — 배정 관련 코드면 「기관 배정 실패」 안내(서버 message 그대로 + 합격 미처리 안내).
 * 배정과 무관한 오류는 null → 기존 합격 실패 안내를 쓴다.
 */
export function readVolunteerFinalPassAssignmentErrorAlert(
  error: unknown
): { title: string; content: string } | null {
  const data = (error as { response?: { data?: unknown } } | null)?.response?.data
  const code = extractApiErrorCode(data)
  if (!code || !ASSIGNMENT_ERROR_CODE_PREFIXES.some(prefix => code.startsWith(prefix))) return null
  const message = extractApiErrorMessage(data, {
    fallback: '선택한 기관·일정으로 배정할 수 없습니다.',
  })
  return {
    title: '기관 배정 실패',
    content: `${message}\n기관 배정에 실패해 합격도 처리되지 않았습니다. 기관·일정을 다시 선택해 주세요.`,
  }
}
