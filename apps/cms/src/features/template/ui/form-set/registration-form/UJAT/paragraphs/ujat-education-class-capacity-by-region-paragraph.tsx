/**
 * UJAT — 지역 별 교육 진행 가능 학급 및 봉사단 수 (등록 양식 단락)
 */
import {
  resolveUjatRegionCapacitySemesterValues,
} from '@/features/program/ujat/lib/ujat-region-capacity-display'
import { UjatRegionCapacitySection } from '@/features/program/ujat/ui/detail-modal/info/ujat-region-capacity-section'

export function UjatEducationClassCapacityByRegionParagraph() {
  const h1Values = resolveUjatRegionCapacitySemesterValues('h1')
  const h2Values = resolveUjatRegionCapacitySemesterValues('h2')
  return <UjatRegionCapacitySection mode="edit" h1Values={h1Values} h2Values={h2Values} />
}
