/**
 * 1사 1교 프로그램 등록 폼 — 교육 진행 (커리큘럼)
 * 과제 설정 없음 · 2차시 고정 · 단원명 | 교육 내용 표 (차시 헤딩 없음)
 */
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { useProgramRegistrationOverlayKv } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

const FIXED_SESSION_COUNT = 2

function CurriculumSessionRow({ sessionIndex }: { sessionIndex: number }) {
  const [title, setTitle] = useProgramRegistrationOverlayKv(
    `economyRegistration.educationCurriculum.session${sessionIndex}.title`,
    ''
  )
  const [description, setDescription] = useProgramRegistrationOverlayKv(
    `economyRegistration.educationCurriculum.session${sessionIndex}.description`,
    ''
  )

  return (
    <DetailInfoForm.Row type="double">
      <DetailInfoForm.Field
        label={`${sessionIndex}차시 단원명`}
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
        label={`${sessionIndex}차시 교육 내용`}
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
  )
}

export function OneCOneSRegistrationEducationCurriculumParagraph() {
  return (
    <DetailInfoForm
      title="교육 진행 (커리큘럼)"
      hideHeader
      mode="edit"
      className="program-registration-paragraph"
    >
      {Array.from({ length: FIXED_SESSION_COUNT }, (_, index) => (
        <CurriculumSessionRow key={index + 1} sessionIndex={index + 1} />
      ))}
    </DetailInfoForm>
  )
}
