import type { Program } from '@/types/domain'
import { resolveUjatWageInfoDisplay } from '@/features/program/ujat/lib/ujat-wage-info-display'
import { UjatWageInfoFields } from '@/features/program/ujat/ui/detail-modal/info/ujat-wage-info-fields'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

/** UJAT 임금 정보 — 봉사시간 지급(강사비 없음), 등록 양식과 동일 */
export function UjatWageInfoProgramView({
  program,
  isEdit = false,
}: {
  program: Program
  isEdit?: boolean
}) {
  const display = resolveUjatWageInfoDisplay(program)
  const mode = isEdit ? 'edit' : 'view'

  return (
    <section className="program-detail-fullpage-modal__info-tab-block">
      {isEdit ? (
        <FormParagraphSectionHeader
          title="임금 정보"
          surface="responseEntry"
          titleAligned
          required
        />
      ) : null}
      <DetailInfoForm
        title="임금 정보"
        hideHeader={isEdit}
        mode={mode}
        className="program-registration-paragraph"
      >
        <UjatWageInfoFields mode={mode} viewDisplay={display} />
      </DetailInfoForm>
    </section>
  )
}
