/**
 * 1사 1교 프로그램 등록 폼 — 교육 진행 (커리큘럼)
 * 과제 설정 없음 · 차시 타이틀 + 단원명 | 교육 내용 · 2차시 고정
 */
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { useProgramRegistrationOverlayKv } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

const FIXED_SESSION_COUNT = 2

function CurriculumSessionBlock({ sessionIndex }: { sessionIndex: number }) {
  const [title, setTitle] = useProgramRegistrationOverlayKv(
    `economyRegistration.educationCurriculum.session${sessionIndex}.title`,
    ''
  )
  const [description, setDescription] = useProgramRegistrationOverlayKv(
    `economyRegistration.educationCurriculum.session${sessionIndex}.description`,
    ''
  )

  return (
    <div className="program-registration-curriculum__session-block">
      <div className="program-registration-curriculum__session-heading">■ {sessionIndex}차시</div>
      <div className="program-registration-curriculum__session-row">
        <DetailInfoForm
          title={`${sessionIndex}차시 커리큘럼`}
          hideHeader
          mode="edit"
          className="program-registration-paragraph"
        >
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="단원명"
              edit={
                <CmsInput
                  inputSize="medium"
                  placeholder="단원명을 입력하세요"
                  width="100%"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              }
              view="-"
            />
            <DetailInfoForm.Field
              label="교육 내용"
              edit={
                <CmsInput
                  inputSize="medium"
                  placeholder="교육 내용을 작성하세요"
                  width="100%"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              }
              view="-"
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>
    </div>
  )
}

export function OneCOneSRegistrationEducationCurriculumParagraph() {
  return (
    <div className="program-registration-curriculum__sessions">
      {Array.from({ length: FIXED_SESSION_COUNT }, (_, index) => (
        <CurriculumSessionBlock key={index + 1} sessionIndex={index + 1} />
      ))}
    </div>
  )
}
