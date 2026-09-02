import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { useGeneralApplicationOverlayKv } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { CmsInput } from '@/shared/ui/cms-input'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

/** Gemini 찾아가는 연수 참여 기관 신청 — 담당 교사 정보 */
export function GeminiVisitingTrainingContactPersonParagraph() {
  const [jobTitle, setJobTitle] = useGeneralApplicationOverlayKv<string>(
    'application.gemini.inst.contactJobTitle',
    ''
  )
  const [subject, setSubject] = useGeneralApplicationOverlayKv<string>(
    'application.gemini.inst.contactSubject',
    ''
  )

  return (
    <div className="program-registration-paragraph">
      <DetailInfoForm title="담당 교사 정보" hideHeader mode="edit">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="직급"
            edit={
              <CmsInput
                inputSize="medium"
                width="100%"
                placeholder="직급을 입력해 주세요"
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
              />
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="담당 과목"
            edit={
              <CmsInput
                inputSize="medium"
                width="100%"
                placeholder="담당 과목을 입력해 주세요"
                value={subject}
                onChange={e => setSubject(e.target.value)}
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}
