import type { UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import type { UjatRegionCapacitySemesterValues } from '@/features/program/ujat/lib/ujat-region-capacity-types'
import {
  resolveUjatRegionCapacitySemesterValues,
} from '@/features/program/ujat/lib/ujat-region-capacity-display'
import { UjatRegionCapacitySection } from '@/features/program/ujat/ui/detail-modal/info/ujat-region-capacity-section'
import { UJAT_PROGRAM_REGISTRATION_IDS } from '@/features/template/model/ujat-program-registration-draft'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import { UJAT_REGISTRATION_SECTION_META } from '@/features/template/ui/form-set/registration-form/UJAT/ujat-section-meta'
import '@/features/template/ui/form-set/registration-form/UJAT/paragraphs/ujat-education-class-capacity-by-region-paragraph.css'

export function UjatRegionCapacityProgramView({
  program,
  isEdit = false,
  h1Values: h1ValuesInput,
  h2Values: h2ValuesInput,
  form,
}: {
  program: Program
  isEdit?: boolean
  h1Values?: UjatRegionCapacitySemesterValues
  h2Values?: UjatRegionCapacitySemesterValues
  form?: UseFormReturn<ProgramDetailEditFormValues>
}) {
  const canonical = program.ujatRegionCapacity
  const h1Values =
    h1ValuesInput ??
    canonical?.h1 ??
    resolveUjatRegionCapacitySemesterValues('h1', program.ujatRegistrationOverlay ?? {})
  const h2Values =
    h2ValuesInput ??
    canonical?.h2 ??
    resolveUjatRegionCapacitySemesterValues('h2', program.ujatRegistrationOverlay ?? {})
  const mode = isEdit && form != null ? 'edit' : 'view'

  return (
    <section className="ujat-region-capacity-program-view program-detail-fullpage-modal__info-tab-block">
      {isEdit ? (
        <FormParagraphSectionHeader
          title={UJAT_REGISTRATION_SECTION_META.educationClassCapacityByRegion.title}
          description={UJAT_REGISTRATION_SECTION_META.educationClassCapacityByRegion.description}
          surface="responseEntry"
          titleAligned
          required
          highlightParagraphId={UJAT_PROGRAM_REGISTRATION_IDS[6]}
        />
      ) : (
        <div className="ujat-region-capacity-program-view__header">
          <h3 className="ujat-region-capacity-program-view__title">
            지역 별 교육 진행 가능 학급 및 봉사단 수
          </h3>
        </div>
      )}
      <UjatRegionCapacitySection mode={mode} h1Values={h1Values} h2Values={h2Values} form={form} />
    </section>
  )
}
