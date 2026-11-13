import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { useGeneralApplicationOverlayKv } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'
import './gemini-training-info-paragraph.css'

/** Gemini 찾아가는 연수 참여 기관 신청 — 연수 정보 */
export function GeminiVisitingTrainingTrainingInfoParagraph() {
  /** 템플릿 관리 시안(12875:515810) — 「총 [학생 수] 명」 간격 6, 「총」 왼쪽 4 */
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
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
              <div
                className={[
                  'detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap',
                  isTemplateManagementScreen && 'gemini-training-info-paragraph__headcount--spec',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                <span className="gemini-training-info-paragraph__headcount-prefix">총</span>
                <CmsNumericInput
                  inputSize="small"
                  width={120}
                  mode="integer"
                  placeholder="학생 수"
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
