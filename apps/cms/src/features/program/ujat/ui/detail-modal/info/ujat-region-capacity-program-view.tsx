import type { Program } from '@/types/domain'
import type { UjatRegionCapacitySemesterValues } from '@/features/program/ujat/lib/ujat-region-capacity-types'
import {
  resolveUjatRegionCapacitySemesterValues,
} from '@/features/program/ujat/lib/ujat-region-capacity-display'
import { UjatRegionCapacitySection } from '@/features/program/ujat/ui/detail-modal/info/ujat-region-capacity-section'
import '@/features/template/ui/form-set/registration-form/UJAT/paragraphs/ujat-education-class-capacity-by-region-paragraph.css'

export function UjatRegionCapacityProgramView({
  isEdit = false,
  h1Values: h1ValuesInput,
  h2Values: h2ValuesInput,
}: {
  program: Program
  isEdit?: boolean
  h1Values?: UjatRegionCapacitySemesterValues
  h2Values?: UjatRegionCapacitySemesterValues
}) {
  const h1Values = h1ValuesInput ?? resolveUjatRegionCapacitySemesterValues('h1')
  const h2Values = h2ValuesInput ?? resolveUjatRegionCapacitySemesterValues('h2')
  const mode = isEdit ? 'edit' : 'view'

  return (
    <section className="ujat-region-capacity-program-view program-detail-fullpage-modal__info-tab-block">
      <div className="ujat-region-capacity-program-view__header">
        <h3 className="ujat-region-capacity-program-view__title">
          지역 별 교육 진행 가능 학급 및 봉사단 수
        </h3>
      </div>
      <UjatRegionCapacitySection mode={mode} h1Values={h1Values} h2Values={h2Values} />
    </section>
  )
}
