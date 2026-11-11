import type {
  ApplicantPreferredScheduleBlock,
  ApplicantPreferredScheduleSessionTime,
} from '@/features/program/shared/model/applicant-institution'
import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'

/**
 * 교육받은 교사(TT) 희망 교육 일정 표기 SSOT.
 * - 차시 = 그날 진행하는 수업 개수. 차시 수만큼 교시·시간 줄(`sessionTimes[]`)이 있다.
 * - 교시 = 각 차시의 학교 시간표 번호(`sessionTimes[].classPeriod`).
 * 시안: `2026.04.27(월) ㅣ 2차시` / `1차시: 1교시 ㅣ 09:00 ~ 09:40 / 2차시: 2교시 ㅣ 09:50 ~ 10:30`
 * (CMS-FUNC-0072 — 2차시 신청은 교육 일정 두 건을 한 줄로).
 */

/** 시안 구분자(한글 모음 ㅣ) — 문자열 한 줄 표기용. 표 셀은 디바이더 컴포넌트를 쓴다 */
export const TRAINED_TEACHER_SCHEDULE_SEPARATOR = ' ㅣ '
/** 차시와 차시 사이 */
export const TRAINED_TEACHER_SESSION_JOINER = ' / '

/**
 * 블록의 차시 수.
 * 시간 줄(`sessionTimes`)이 있으면 그 줄 수를 쓴다 — 차시 수만큼 줄이 있고, 기존 플랫폼 신청은
 * `sessionCount`에 교시 번호를 보낸 데이터가 있어(예: 3교시 1차시 → sessionCount 3) 그 값을 믿을 수 없다.
 * 줄이 없을 때만 `sessionCount`. 둘 다 없으면 null(지어내지 않는다).
 */
export function resolveTrainedTeacherBlockSessionCount(
  block: Pick<ApplicantPreferredScheduleBlock, 'sessionCount' | 'sessionTimes'>
): number | null {
  const lines = Array.isArray(block.sessionTimes) ? block.sessionTimes.length : 0
  if (lines > 0) return lines
  const count = block.sessionCount
  return typeof count === 'number' && Number.isInteger(count) && count > 0 ? count : null
}

/** 교시 라벨 — 숫자만 오면 `N교시`, 그 외 원문. 비어 있으면 빈 문자열 */
export function formatTrainedTeacherClassPeriod(classPeriod: string | null | undefined): string {
  const trimmed = classPeriod?.trim() ?? ''
  if (/^\d+$/u.test(trimmed)) return `${Number(trimmed)}교시`
  return trimmed
}

/** `2026.04.20(월)` */
export function formatTrainedTeacherPreferredDateLabel(
  block: Pick<ApplicantPreferredScheduleBlock, 'date' | 'dayOfWeek'>
): string {
  const date = block.date.trim()
  if (!date) return ''
  if (/^\d{4}-\d{2}-\d{2}$/u.test(date)) return formatCmsScheduleDisplayLabel(date)
  const weekday = block.dayOfWeek.trim()
  return formatCmsScheduleDisplayLabel(weekday ? `${date}(${weekday})` : date)
}

/** 「희망 교육일 및 차시」 조각 — `[날짜, N차시]` */
export function formatTrainedTeacherPreferredDateSegments(
  block: Pick<ApplicantPreferredScheduleBlock, 'date' | 'dayOfWeek' | 'sessionCount' | 'sessionTimes'>
): string[] {
  const count = resolveTrainedTeacherBlockSessionCount(block)
  return [formatTrainedTeacherPreferredDateLabel(block), count != null ? `${count}차시` : ''].filter(
    Boolean
  )
}

/**
 * 「차시별 희망 교육 시간」 — 차시마다 `[N차시: 교시, 시간]` 조각.
 * N = 그날 차시 순서(줄 순서, 1부터). 교시가 없으면 `N차시: 시간`.
 */
export function formatTrainedTeacherSessionTimeSegments(
  sessionTimes: readonly ApplicantPreferredScheduleSessionTime[] | null | undefined
): string[][] {
  return (sessionTimes ?? []).map((session, index) => {
    const order = `${index + 1}차시`
    const period = formatTrainedTeacherClassPeriod(session.classPeriod)
    const time = session.timeRange?.trim() ?? ''
    if (period) return [`${order}: ${period}`, time].filter(Boolean)
    return [time ? `${order}: ${time}` : order]
  })
}

/**
 * TT 기관 신청 목록 「진행 희망 교육 일정」 — 지망(블록) 1건 = 한 줄.
 * `2026.04.27(월) ㅣ 2차시 ㅣ 1차시: 1교시 ㅣ 09:00 ~ 09:40 / 2차시: 2교시 ㅣ 09:50 ~ 10:30`
 * 시각·교시를 프로그램 일정에서 추정하지 않는다.
 */
export function formatTrainedTeacherPreferredScheduleLines(
  block: Pick<ApplicantPreferredScheduleBlock, 'date' | 'dayOfWeek' | 'sessionCount' | 'sessionTimes'>
): string[] {
  const head = formatTrainedTeacherPreferredDateSegments(block).join(TRAINED_TEACHER_SCHEDULE_SEPARATOR)
  const times = formatTrainedTeacherSessionTimeSegments(block.sessionTimes)
    .map(parts => parts.join(TRAINED_TEACHER_SCHEDULE_SEPARATOR))
    .filter(Boolean)
    .join(TRAINED_TEACHER_SESSION_JOINER)
  const line = [head, times].filter(Boolean).join(TRAINED_TEACHER_SCHEDULE_SEPARATOR)
  return line ? [line] : []
}

export function trainedTeacherPreferredScheduleLineKey(
  block: Pick<ApplicantPreferredScheduleBlock, 'preferenceRank' | 'date' | 'scheduleId' | 'sessionTimes'>,
  sessionIndex: number
): string {
  const scheduleKey =
    typeof block.scheduleId === 'number' && Number.isFinite(block.scheduleId)
      ? String(block.scheduleId)
      : 'none'
  const sessionOrder = block.sessionTimes[sessionIndex]?.sessionIndex ?? sessionIndex + 1
  return `${block.preferenceRank}-${block.date}-${scheduleKey}-${sessionOrder}`
}
