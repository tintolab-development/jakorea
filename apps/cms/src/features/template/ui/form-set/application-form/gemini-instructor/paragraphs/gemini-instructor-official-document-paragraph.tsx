import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { useGeneralApplicationOverlayKv } from '@/features/template/ui/form-set/application-form/shared/general-application-overlay-sync'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import { useIsTemplateManagementScreen } from '@/features/template/ui/template-management/detail-view-mode-context'

type OfficialNeed = 'needed' | 'not_needed'

/** Gemini 찾아가는 연수 강사 신청 — 연수 공문 */
export function GeminiInstructorOfficialDocumentParagraph() {
  /** 템플릿 관리 시안(12875:515880) — 공문 필요 여부 미선택, 하단 안내 16px·좌우 8 */
  const isTemplateManagementScreen = useIsTemplateManagementScreen()
  const [need, setNeed] = useGeneralApplicationOverlayKv<OfficialNeed | ''>(
    'application.gemini.instructor.officialNeed',
    isTemplateManagementScreen ? '' : 'needed'
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
                size="medium"
                value={need === '' ? undefined : need}
                onChange={e => setNeed(e.target.value as OfficialNeed)}
              >
                <CmsRadio size="medium" value="needed">필요</CmsRadio>
                <CmsRadio size="medium" value="not_needed">필요 없음</CmsRadio>
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
              <CmsInput
                inputSize="small"
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

      <div
        className="detail-info-form--text"
        style={
          isTemplateManagementScreen
            ? { marginTop: 16, paddingInline: 8, fontSize: 16 }
            : { marginTop: 16 }
        }
      >
        개인정보를 제외한 필요한 정보 리스트를 작성해 주세요.
        <br />
        (O) 이름, 소속(학교), 연수예정일시, 연수인원 / (X) 김제이, 제이초등학교, 2026.08.15, 15명
      </div>
    </div>
  )
}
