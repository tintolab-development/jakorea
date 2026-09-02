import {
  shouldShowInstitutionApplicationScheduleParagraph,
  useInstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'
import { ProgramApplicationFormInstitutionFixedScheduleParagraph } from '@/features/template/ui/form-set/application-form/institution/paragraphs/institution-fixed-schedule-paragraph'
import { ProgramApplicationScheduleTemplateHintParagraph } from '@/features/template/ui/form-set/application-form/shared/paragraphs/program-application-schedule-template-hint-paragraph'

/** 프로그램 참여자 신청(개인) — 진행 희망 교육 일정 (기관과 동일 연동 규칙, 기간 지정 케이스 없음) */
export function ProgramApplicationFormIndividualScheduleParagraph({
  readOnlyPreview = false,
  isTemplateAuthoringMode = false,
}: {
  readOnlyPreview?: boolean
  /** true: 템플릿 편집 — 설정값 안내 힌트. false: 프로그램 연동 본문 */
  isTemplateAuthoringMode?: boolean
}) {
  const bridge = useInstitutionApplicationProgramBridge()
  if (!shouldShowInstitutionApplicationScheduleParagraph(bridge)) {
    return null
  }
  if (isTemplateAuthoringMode) {
    return <ProgramApplicationScheduleTemplateHintParagraph />
  }
  return <ProgramApplicationFormInstitutionFixedScheduleParagraph readOnlyPreview={readOnlyPreview} />
}
