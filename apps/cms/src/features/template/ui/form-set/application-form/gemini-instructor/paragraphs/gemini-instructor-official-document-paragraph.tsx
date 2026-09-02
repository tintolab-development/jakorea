import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { useGeneralApplicationOverlayKv } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsTextArea } from '@/shared/ui/cms-textarea'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

type OfficialNeed = 'needed' | 'not_needed'

/** Gemini 찾아가는 연수 강사 신청 — 연수 공문 */
export function GeminiInstructorOfficialDocumentParagraph() {
  const [need, setNeed] = useGeneralApplicationOverlayKv<OfficialNeed>(
    'application.gemini.instructor.officialNeed',
    'needed'
  )
  const [detail, setDetail] = useGeneralApplicationOverlayKv<string>(
    'application.gemini.instructor.officialDetail',
    ''
  )

  return (
    <div className="program-registration-paragraph">
      <DetailInfoForm title="연수 공문" hideHeader mode="edit">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="공문 필요 여부"
            edit={
              <CmsRadioGroup
                size="large"
                value={need}
                onChange={e => setNeed(e.target.value as OfficialNeed)}
              >
                <CmsRadio value="needed">필요</CmsRadio>
                <CmsRadio value="not_needed">필요 없음</CmsRadio>
              </CmsRadioGroup>
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="공문 필요 정보"
            fullRow
            edit={
              <CmsTextArea
                inputSize="medium"
                rows={1}
                expandableFromSingleRow
                placeholder="공문에 필요한 정보를 작성해 주세요."
                width="100%"
                value={detail}
                onChange={e => setDetail(e.target.value)}
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <div className="detail-info-form--text" style={{ marginTop: 16 }}>
        개인정보를 제외한 필요한 정보 리스트를 작성해주세요.
        <br />
        (O) 이름, 소속(학교), 연수예정일시, 연수인원 / (X) 홍길동, 한국초등학교, 2024-8-15, 15명
      </div>
    </div>
  )
}
