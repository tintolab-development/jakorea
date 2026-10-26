/**
 * 봉사자 모집 정보(`recruit.volunteer.<필드>`) — RHF 필드 폼. 면접 여부·방법·기간 키 포함.
 *
 * Part3 5단계: 일반 모집 overlay 스토어에서 봉사자 모집 평면 키를 RHF로 옮겼다.
 * - 제외(스토어 유지): 면접 슬롯·예외 블록(`recruit.volunteer.interview.*`), UJAT 반기 키(`recruit.volunteer.h1.*`·`h2.*`).
 * - 상세정보(`recruitVolunteer.detailInfo.*`)는 공용 상세정보 RHF 폼이 소유한다.
 * - 일반 모집 스토어(`general-recruit-overlay-sync`)는 이 폼을 합성해서 기존 읽기·collect 결과를 그대로 만든다.
 */
import dayjs from 'dayjs'
import { createScopedRhfFieldForm } from '@/features/template/ui/form-set/shared/scoped-rhf-field-form'
import {
  useGeneralRecruitField,
  writeGeneralRecruitFields,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-field-binding'

const VOLUNTEER_RECRUIT_KEY_PREFIX = 'recruit.volunteer.'

/** `recruit.volunteer.<한 단계>` 만(더 깊은 키 = 면접 슬롯·반기 키는 제외) */
export function isVolunteerRecruitFieldKey(key: string): boolean {
  if (!key.startsWith(VOLUNTEER_RECRUIT_KEY_PREFIX)) return false
  const rest = key.slice(VOLUNTEER_RECRUIT_KEY_PREFIX.length)
  return rest.length > 0 && !rest.includes('.')
}

export const volunteerRecruitFieldForm = createScopedRhfFieldForm({
  ownsKey: isVolunteerRecruitFieldKey,
})

export const VOLUNTEER_INTERVIEW_RANGE_SEAL_KEY = 'recruit.volunteer.interviewRangeSeal'

/** 봉사자 모집 「2차 면접 기간」→ 진행 불가일 달력 범위 overlay (예전 interview-schedule-overlay-sync 에서 이동) */
export function syncVolunteerInterviewRangeSealOverlay(
  start: string | Date | undefined,
  end: string | Date | undefined
): void {
  const startDay = start == null ? null : dayjs(start)
  const endDay = end == null ? null : dayjs(end)
  if (startDay == null || endDay == null || !startDay.isValid() || !endDay.isValid()) return
  const [from, to] = startDay.isBefore(endDay, 'day') ? [startDay, endDay] : [endDay, startDay]
  patchVolunteerRecruitFields({
    [VOLUNTEER_INTERVIEW_RANGE_SEAL_KEY]: {
      start: from.startOf('day').toISOString(),
      end: to.startOf('day').toISOString(),
    },
  })
}

/** 봉사자 모집 단락 입력 바인딩 */
export function useVolunteerRecruitField<T>(key: string, defaultValue: T): [T, (next: T) => void] {
  return useGeneralRecruitField(volunteerRecruitFieldForm, key, defaultValue)
}

export function patchVolunteerRecruitFields(partial: Record<string, unknown>): void {
  writeGeneralRecruitFields(volunteerRecruitFieldForm, partial)
}
