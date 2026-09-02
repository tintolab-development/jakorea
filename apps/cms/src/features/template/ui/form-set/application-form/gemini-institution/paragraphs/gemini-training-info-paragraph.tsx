import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { useGeneralApplicationOverlayKv } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

/** Gemini 찾아가는 연수 참여 기관 신청 — 연수 정보 */
export function GeminiVisitingTrainingTrainingInfoParagraph() {
  const [headcount, setHeadcount] = useGeneralApplicationOverlayKv<string>(
    'application.gemini.inst.headcount',
    ''
  )

  return (
    <div className="program-registration-paragraph">
      <DetailInfoForm title="연수 정보" hideHeader mode="edit">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="수강 인원"
            fullRow
            edit={
              <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
                <span>총</span>
                <CmsNumericInput
                  inputSize="medium"
                  width={120}
                  mode="integer"
                  value={headcount}
                  onValueChange={setHeadcount}
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
