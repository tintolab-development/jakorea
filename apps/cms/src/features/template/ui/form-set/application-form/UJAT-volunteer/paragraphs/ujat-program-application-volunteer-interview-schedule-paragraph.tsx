import { VolunteerInterviewApplicantScheduleParagraph } from '@/features/template/ui/form-set/application-form/volunteer/paragraphs/volunteer-interview-applicant-schedule-paragraph'

/** UJAT 프로그램 봉사자 신청 폼 — 면접 진행 가능 일정 */
export function UjatProgramApplicationVolunteerInterviewScheduleParagraph({
  isTemplateAuthoringMode = true,
}: {
  /** 템플릿 작성·시드 없음: mock 대신 안내 UI */
  isTemplateAuthoringMode?: boolean
}) {
  return (
    <VolunteerInterviewApplicantScheduleParagraph
      isTemplateAuthoringMode={isTemplateAuthoringMode}
    />
  )
}
