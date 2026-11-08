/**
 * 일반 프로그램 참여 기관·강사·봉사자「추가 배정」모달 공통 — 일정 칩 선택·옵션 변환 (UI 없음)
 * Figma CMS 9760:8214 (강사 추가 배정 안내 / 기관 추가 배정 안내 / 추가 배정 안내)
 */

import { formatCmsScheduleDisplayLabel } from '@/features/program/general/lib/organization-preferred-schedule-label'
import type { InstructorAssignSessionOption } from '@/features/program/general/lib/instructor-assign-session-options'

/** 기존 배정 정책 그대로: 기관 상세·기관형 강사(복수 회차) = multiple, 대기 행 1건 배정 경로 = single */
export type AddAssignSelectionMode = 'single' | 'multiple'

export function toggleAddAssignSessionSelection(
  prev: readonly string[],
  id: string,
  mode: AddAssignSelectionMode
): string[] {
  const selected = prev.includes(id)
  if (mode === 'single') return selected ? [] : [id]
  return selected ? prev.filter(item => item !== id) : [...prev, id]
}

/** 기관·강사 변경 등으로 옵션이 바뀌면 사라졌거나 선택 불가가 된 일정은 선택에서 뺀다 */
export function pruneAddAssignSessionSelection(
  value: readonly string[],
  options: readonly InstructorAssignSessionOption[]
): string[] {
  const enabled = new Set(options.filter(option => !option.disabled).map(option => option.id))
  return value.filter(id => enabled.has(id))
}

/** `2026.04.20(월) 09:30 ~ 12:20 | 2차시` → 칩의 일정 / 차시 영역 */
export function splitAddAssignScheduleLabel(label: string): {
  scheduleLabel: string
  sessionRoundLabel: string
} {
  const formatted = formatCmsScheduleDisplayLabel(label.trim())
  const parts = formatted
    .split('|')
    .map(part => part.trim())
    .filter(Boolean)
  return {
    scheduleLabel: parts[0] ?? '-',
    sessionRoundLabel: parts.slice(1).join(' · '),
  }
}

export interface AddAssignWaitingScheduleLike {
  id: string
  scheduleLabel: string
  /** 'waiting'만 선택 가능 (대기 테이블 체크박스 정책과 동일) */
  assignmentStatus: string
  countLabel: string
  /** 같은 일정 라벨이 여러 건일 때만 구분용으로 붙인다 (예: 출강지) */
  locationLabel?: string
  /** 추가로 선택 불가 처리할 조건 (예: scheduleId 없음) */
  disabled?: boolean
}

/** 배정 대기 일정 행 → 추가 배정 일정 칩 (개인형 강사·봉사자, 기관형 봉사자 공통) */
export function buildAddAssignWaitingScheduleChipOptions(
  rows: readonly AddAssignWaitingScheduleLike[]
): InstructorAssignSessionOption[] {
  const split = rows.map(row => splitAddAssignScheduleLabel(row.scheduleLabel))
  const labelCounts = new Map<string, number>()
  split.forEach(({ scheduleLabel, sessionRoundLabel }) => {
    const key = `${scheduleLabel}|${sessionRoundLabel}`
    labelCounts.set(key, (labelCounts.get(key) ?? 0) + 1)
  })
  return rows.map((row, index) => {
    const { scheduleLabel, sessionRoundLabel } = split[index]!
    const duplicated = (labelCounts.get(`${scheduleLabel}|${sessionRoundLabel}`) ?? 0) > 1
    const location = row.locationLabel?.trim()
    const roundLabel =
      duplicated && location && location !== '-'
        ? [sessionRoundLabel, location].filter(Boolean).join(' · ')
        : sessionRoundLabel
    return {
      id: row.id,
      scheduleLabel,
      sessionRoundLabel: roundLabel,
      capacityLabel: row.countLabel,
      disabled: row.assignmentStatus !== 'waiting' || row.disabled === true,
    }
  })
}

export interface VolunteerInstitutionWaitingLike {
  id: string
  schoolId: string
  schoolName: string
  hopeScheduleLine: string
  assignmentStatus: string
  assignedVolunteerCountLabel: string
}

/**
 * 기관형 봉사자 — 배정 대기(기관+일정) 행 → 기관명 옵션 + 기관별 봉사 일정 칩.
 * 기관 옵션은 선택 가능한 일정이 1건 이상인 기관만 (기존 추가 배정 Select와 같은 범위).
 */
export function buildVolunteerInstitutionAddAssignOptions(
  rows: readonly VolunteerInstitutionWaitingLike[]
): {
  institutionOptions: { value: string; label: string }[]
  sessionOptionsBySchoolId: Map<string, InstructorAssignSessionOption[]>
} {
  const bySchool = new Map<string, VolunteerInstitutionWaitingLike[]>()
  for (const row of rows) {
    const list = bySchool.get(row.schoolId) ?? []
    list.push(row)
    bySchool.set(row.schoolId, list)
  }
  const institutionOptions: { value: string; label: string }[] = []
  const sessionOptionsBySchoolId = new Map<string, InstructorAssignSessionOption[]>()
  for (const [schoolId, list] of bySchool) {
    if (!list.some(row => row.assignmentStatus === 'waiting')) continue
    institutionOptions.push({ value: schoolId, label: list[0]!.schoolName })
    sessionOptionsBySchoolId.set(
      schoolId,
      buildAddAssignWaitingScheduleChipOptions(
        list.map(row => ({
          id: row.id,
          scheduleLabel: row.hopeScheduleLine,
          assignmentStatus: row.assignmentStatus,
          countLabel: row.assignedVolunteerCountLabel,
        }))
      )
    )
  }
  return { institutionOptions, sessionOptionsBySchoolId }
}
