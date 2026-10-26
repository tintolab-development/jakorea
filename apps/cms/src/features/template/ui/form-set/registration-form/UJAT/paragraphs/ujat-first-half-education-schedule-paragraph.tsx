/**
 * UJAT — 상·하반기 교육 일정 (등록 양식 단락)
 */
import type { UjatHalfSemesterKey } from '@/features/program/ujat/lib/ujat-half-education-schedule-types'
import type { UseFormReturn } from 'react-hook-form'
import { EMPTY_UJAT_TYPED_DETAIL, type UjatTypedDetail } from '@/features/program/ujat/api/typed-detail-client'
import { HalfEducationScheduleSection } from '@/features/program/shared/ui/half-education-schedule-section'
import {
  resolveUjatHalfEducationScheduleDisplayFromTypedDetail,
} from '@/features/program/ujat/lib/ujat-half-education-schedule-display'

export function UjatHalfEducationScheduleParagraph({
  half,
  scheduleForm,
}: {
  half: UjatHalfSemesterKey
  scheduleForm?: UseFormReturn<UjatTypedDetail>
}) {
  const display = resolveUjatHalfEducationScheduleDisplayFromTypedDetail(
    scheduleForm?.getValues() ?? EMPTY_UJAT_TYPED_DETAIL,
    half
  )
  return <HalfEducationScheduleSection half={half} mode="edit" display={display} scheduleForm={scheduleForm} />
}

/** @deprecated `UjatHalfEducationScheduleParagraph` 사용 */
export function UjatFirstHalfEducationScheduleParagraph() {
  return <UjatHalfEducationScheduleParagraph half="h1" />
}
