/**
 * UJAT — 상·하반기 교육 일정 (등록 양식 단락)
 */
import type { UjatHalfSemesterKey } from '@/features/program/ujat/lib/ujat-half-education-schedule-types'
import { UjatHalfEducationScheduleSection } from '@/features/program/ujat/ui/detail-modal/info/ujat-half-education-schedule-section'
import { resolveUjatHalfEducationScheduleDisplay } from '@/features/program/ujat/lib/ujat-half-education-schedule-display'

export function UjatHalfEducationScheduleParagraph({ half }: { half: UjatHalfSemesterKey }) {
  const display = resolveUjatHalfEducationScheduleDisplay(half)
  return <UjatHalfEducationScheduleSection half={half} mode="edit" display={display} />
}

/** @deprecated `UjatHalfEducationScheduleParagraph` 사용 */
export function UjatFirstHalfEducationScheduleParagraph() {
  return <UjatHalfEducationScheduleParagraph half="h1" />
}
