import {
  shouldShowInstitutionApplicationPreferredScheduleParagraph,
  shouldShowInstitutionApplicationScheduleParagraph,
  useInstitutionApplicationProgramBridge,
  type InstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'
import { ProgramApplicationFormInstitutionFixedScheduleParagraph } from '@/features/template/ui/form-set/application-form/institution/paragraphs/institution-fixed-schedule-paragraph'
import { ProgramApplicationFormInstitutionPreferredScheduleParagraph } from '@/features/template/ui/form-set/application-form/institution/paragraphs/institution-preferred-schedule-paragraph'
import {
  PROGRAM_APPLICATION_SCHEDULE_STRUCTURE_HINT,
  ProgramApplicationScheduleTemplateHintParagraph,
} from '@/features/template/ui/form-set/application-form/shared/paragraphs/program-application-schedule-template-hint-paragraph'

function hasInstitutionProgramScheduleContext(
  bridge: InstitutionApplicationProgramBridge
): boolean {
  return (
    bridge.educationStructure != null ||
    bridge.sessionRound != null ||
    (bridge.educationScheduleLines != null && bridge.educationScheduleLines.length > 0) ||
    bridge.educationScheduleRange != null ||
    bridge.maxScheduleCount != null
  )
}

/** 프로그램 참여자 신청(학교) — 진행 희망 교육 일정 (유형·모집 상한 연동) */
export function ProgramApplicationFormInstitutionScheduleParagraph({
  readOnlyPreview = false,
  isTemplateAuthoringMode = false,
}: {
  readOnlyPreview?: boolean
  /** true: 템플릿 편집 — 설정값 안내 힌트. false: 프로그램 연동 본문 */
  isTemplateAuthoringMode?: boolean
}) {
  const bridge = useInstitutionApplicationProgramBridge()
  if (isTemplateAuthoringMode || !hasInstitutionProgramScheduleContext(bridge)) {
    return (
      <ProgramApplicationScheduleTemplateHintParagraph
        hintText={PROGRAM_APPLICATION_SCHEDULE_STRUCTURE_HINT}
      />
    )
  }
  if (!shouldShowInstitutionApplicationScheduleParagraph(bridge)) {
    return null
  }
  if (shouldShowInstitutionApplicationPreferredScheduleParagraph(bridge)) {
    return (
      <ProgramApplicationFormInstitutionPreferredScheduleParagraph
        readOnlyPreview={readOnlyPreview}
      />
    )
  }
  return <ProgramApplicationFormInstitutionFixedScheduleParagraph readOnlyPreview={readOnlyPreview} />
}
