import {
  shouldShowInstitutionApplicationPreferredScheduleParagraph,
  useInstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'
import { ProgramApplicationScheduleTemplateHintParagraph } from '@/features/template/ui/form-set/application-form/shared/paragraphs/program-application-schedule-template-hint-paragraph'
import { ProgramApplicationFormInstitutionPreferredScheduleParagraph } from '@/features/template/ui/form-set/application-form/institution/paragraphs/institution-preferred-schedule-paragraph'

/** 프로그램 참여자 신청(학교) — 진행 희망 교육 일정 (유형·모집 상한 연동) */
export function ProgramApplicationFormInstitutionScheduleParagraph() {
  const bridge = useInstitutionApplicationProgramBridge()
  if (shouldShowInstitutionApplicationPreferredScheduleParagraph(bridge)) {
    return <ProgramApplicationFormInstitutionPreferredScheduleParagraph />
  }
  return <ProgramApplicationScheduleTemplateHintParagraph />
}
