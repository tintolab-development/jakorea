import { useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { getProgramRegistrationEducationFormOptions } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-form-options'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

function CurriculumRow({ index }: { index: number }) {
  return (
    <DetailInfoForm.Row type="double">
      <DetailInfoForm.Field
        label={`${index}차시 단원명`}
        edit={<CmsInput inputSize="medium" placeholder="단원명을 입력하세요" width="100%" />}
        view="-"
      />
      <DetailInfoForm.Field
        label={`${index}차시 교육 내용`}
        edit={<CmsInput inputSize="medium" placeholder="교육 내용을 작성하세요" width="100%" />}
        view="-"
      />
    </DetailInfoForm.Row>
  )
}

export function OneCOneSRegistrationEducationCurriculumParagraph() {
  const [educationForm, setEducationForm] = useState('offline')
  const educationFormOptions = getProgramRegistrationEducationFormOptions(true)

  return (
    <DetailInfoForm
      title="교육 진행 (커리큘럼)"
      hideHeader
      mode="edit"
      className="program-registration-paragraph"
    >
      <CurriculumRow index={1} />
      <CurriculumRow index={2} />
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="교육 형태"
          fullRow
          edit={
            <CmsRadioGroup
              size="large"
              value={educationForm}
              onChange={event => setEducationForm(String(event.target.value))}
            >
              {educationFormOptions.map(option => (
                <CmsRadio key={option.value} value={option.value}>
                  {option.label}
                </CmsRadio>
              ))}
            </CmsRadioGroup>
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
