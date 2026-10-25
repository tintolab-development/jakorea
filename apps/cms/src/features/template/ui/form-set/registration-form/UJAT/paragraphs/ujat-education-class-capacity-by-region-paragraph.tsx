/**
 * UJAT — 지역 별 교육 진행 가능 학급 및 봉사단 수 (등록 양식 단락)
 */
import type { UseFormReturn } from 'react-hook-form'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { EMPTY_UJAT_REGION_CAPACITY_BY_SEMESTER } from '@/features/program/ujat/lib/ujat-region-capacity-types'
import { UjatRegionCapacitySection } from '@/features/program/ujat/ui/detail-modal/info/ujat-region-capacity-section'

export function UjatEducationClassCapacityByRegionParagraph({
  infoForm,
}: {
  infoForm?: UseFormReturn<ProgramDetailEditFormValues>
}) {
  const capacity = infoForm?.watch('ujatRegionCapacity') ?? EMPTY_UJAT_REGION_CAPACITY_BY_SEMESTER
  return (
    <UjatRegionCapacitySection
      mode="edit"
      h1Values={capacity.h1 ?? {}}
      h2Values={capacity.h2 ?? {}}
      form={infoForm}
    />
  )
}
