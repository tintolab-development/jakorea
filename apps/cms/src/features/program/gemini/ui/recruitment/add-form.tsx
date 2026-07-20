import { ParagraphCard } from '@/features/template/ui/paragraph/shared/paragraph-card'
import '@/features/template/ui/shared/paragraph-input.css'
import type { useGeminiRecruitmentAddForm } from '../../hooks/use-gemini-recruitment-add-form'
import {
  GEMINI_RECRUITMENT_DETAIL_SECTION_ID,
  GeminiRecruitmentAddDetailInfoSection,
} from './add-detail-info-section'
import {
  GEMINI_RECRUITMENT_INSTITUTION_SECTION_ID,
  GeminiRecruitmentAddInstitutionSection,
} from './add-institution-section'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import '@/features/template/ui/paragraph/shared/paragraph-card.css'
import './add-form.css'

const DETAIL_SECTION_DESCRIPTION_PLACEHOLDER =
  '공란인 경우, 홈페이지 모집 상세에서 항목 미노출 됩니다.'

export type GeminiRecruitmentAddFormProps = {
  form: ReturnType<typeof useGeminiRecruitmentAddForm>
}

export function GeminiRecruitmentAddForm({ form }: GeminiRecruitmentAddFormProps) {
  if (!form.hydrated) {
    return <div className="gemini-recruitment-add-form" aria-hidden />
  }

  return (
    <div className="gemini-recruitment-add-form">
      <div id={GEMINI_RECRUITMENT_INSTITUTION_SECTION_ID}>
        <ParagraphCard
          className="gemini-recruitment-add-form__card gemini-recruitment-add-form__card--institution"
          editableHeading={{
            isEditMode: false,
            titleIsEditMode: false,
            descriptionIsEditMode: true,
            titleValue: '참여 기관 모집 정보',
            titleRequired: true,
            onTitleChange: () => undefined,
            descriptionValue: form.institutionSectionDescription,
            onDescriptionChange: form.setInstitutionSectionDescription,
            descriptionPlaceholder: '설명 입력',
            showDescription: true,
          }}
        >
          <GeminiRecruitmentAddInstitutionSection form={form} />
        </ParagraphCard>
      </div>

      <div id={GEMINI_RECRUITMENT_DETAIL_SECTION_ID}>
        <ParagraphCard
          className="gemini-recruitment-add-form__card gemini-recruitment-add-form__card--detail"
          editableHeading={{
            isEditMode: false,
            titleIsEditMode: false,
            descriptionIsEditMode: true,
            titleValue: '상세 정보',
            titleRequired: true,
            onTitleChange: () => undefined,
            descriptionValue: form.detailSectionDescription,
            onDescriptionChange: form.setDetailSectionDescription,
            descriptionPlaceholder: DETAIL_SECTION_DESCRIPTION_PLACEHOLDER,
            showDescription: true,
          }}
        >
          <GeminiRecruitmentAddDetailInfoSection form={form} />
        </ParagraphCard>
      </div>
    </div>
  )
}
