import type { UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { resolveUjatWageInfoDisplay } from '@/features/program/ujat/lib/ujat-wage-info-display'
import { UjatWageInfoFields } from '@/features/program/ujat/ui/detail-modal/info/ujat-wage-info-fields'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { UJAT_PROGRAM_REGISTRATION_IDS } from '@/features/template/model/ujat-program-registration-draft'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

/** UJAT 임금 정보 — 봉사시간 지급(강사비 없음), 등록 양식과 동일 */
export function UjatWageInfoProgramView({
  program,
  isEdit = false,
  form,
}: {
  program: Program
  isEdit?: boolean
  form?: UseFormReturn<ProgramDetailEditFormValues>
}) {
  const display = resolveUjatWageInfoDisplay(program)
  const mode = isEdit && form != null ? 'edit' : 'view'

  return (
    <section className="program-detail-fullpage-modal__info-tab-block">
      {isEdit ? (
        <FormParagraphSectionHeader
          title="임금 정보"
          surface="responseEntry"
          titleAligned
          required
          highlightParagraphId={UJAT_PROGRAM_REGISTRATION_IDS[2]}
        />
      ) : null}
      <DetailInfoForm
        title="임금 정보"
        hideHeader={isEdit}
        mode={mode}
        className="program-registration-paragraph"
      >
        <UjatWageInfoFields mode={mode} viewDisplay={display} form={form} />
      </DetailInfoForm>
    </section>
  )
}
