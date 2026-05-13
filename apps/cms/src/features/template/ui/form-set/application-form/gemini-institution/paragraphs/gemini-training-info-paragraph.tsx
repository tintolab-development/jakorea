import { useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

/** Gemini 찾아가는 연수 학교 신청 — 연수 정보(수강 인원) */
export function GeminiVisitingTrainingTrainingInfoParagraph() {
  const [headcount, setHeadcount] = useState('')

  return (
    <div className="program-registration-paragraph">
      <DetailInfoForm title="연수 정보" hideHeader mode="edit">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="수강 인원"
            edit={
              <div
                className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap"
                style={{ alignItems: 'center', flexWrap: 'wrap', gap: 8 }}
              >
                <span>총</span>
                <CmsInput
                  inputSize="medium"
                  width={120}
                  type="number"
                  placeholder="총 학생 수"
                  value={headcount}
                  onChange={e => setHeadcount(e.target.value.replace(/\D/g, ''))}
                />
                <span>명</span>
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}
