import { useState } from 'react'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import './gemini-training-info-paragraph.css'

/** Gemini 찾아가는 연수 참여 기관 신청 — 연수 정보(수강 인원) */
export function GeminiVisitingTrainingTrainingInfoParagraph() {
  const [headcount, setHeadcount] = useState('')

  return (
    <div className="program-registration-paragraph">
      <DetailInfoForm title="연수 정보" hideHeader mode="edit">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="수강 인원"
            edit={
              <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap gemini-training-info-paragraph__headcount">
                <div className="gemini-training-info-paragraph__headcount-value">
                  <span className="gemini-training-info-paragraph__headcount-prefix">총</span>
                  <CmsInput
                    className="gemini-training-info-paragraph__headcount-input"
                    inputSize="medium"
                    width={120}
                    type="number"
                    placeholder="학생 수"
                    value={headcount}
                    onChange={e => setHeadcount(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
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
