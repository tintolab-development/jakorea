/**
 * 1사1교 상세 공통정보 수정 — 등록 단락을 그대로 마운트 (등록 양식 변경 없음).
 * 섹션 타이틀·간격은 조회 화면(ProjectInfo 공통정보)과 동일하게 유지한다.
 * 교육 진행 일정은 단락의 「교육 진행 일정 선택」 기간 선택으로만 바꾼다(시안 4175:99725 — 「일정 변경」 버튼 없음).
 * 섹션 설명은 시안 4175:99725 문구(등록 폼 카드 설명과 동일)를 쓴다.
 */
import type { Program } from '@/types/domain'
import {
  OneCOneSRegistrationBasicInfoParagraph,
  OneCOneSRegistrationBusinessKpiParagraph,
  OneCOneSRegistrationEducationCurriculumParagraph,
  OneCOneSRegistrationEducationScheduleSettingsParagraph,
  OneCOneSRegistrationWageInfoParagraph,
} from '@/features/template/ui/form-set/registration-form/1c-1s'
import {
  ProgramCommonInfoEditRegistrationAuditForm,
  ProgramCommonInfoEditSection,
  ProgramCommonInfoEditSections,
} from '@/features/program/shared/ui/program-detail/common-info-edit-section'
import { PROGRAM_REGISTRATION_IDS } from '@/features/template/model/program-registration-draft'
import { PROGRAM_REGISTRATION_GENERAL_SECTION_META } from '@/features/template/ui/form-set/registration-form/general/program-registration-general-section-meta'

const FIXED_PARTICIPANT = {
  individual: false,
  organization: true,
  teacherInstructor: true,
} as const

function noop() {}

export function CompanySchoolCommonInfoRegistrationEdit({ program }: { program: Program }) {
  return (
    <ProgramCommonInfoEditSections>
      <ProgramCommonInfoEditSection
        title="기본 정보"
        description={PROGRAM_REGISTRATION_GENERAL_SECTION_META.basicInfo.registrationDescription}
        required
        highlightParagraphId={PROGRAM_REGISTRATION_IDS.basicInfo}
        bodyClassName="program-common-info-edit__section-body--stacked"
      >
        <ProgramCommonInfoEditRegistrationAuditForm program={program} />
        <OneCOneSRegistrationBasicInfoParagraph
          participant={FIXED_PARTICIPANT}
          onIndividualChange={noop}
          onOrganizationChange={noop}
          onTeacherInstructorChange={noop}
        />
      </ProgramCommonInfoEditSection>
      <ProgramCommonInfoEditSection
        title="사업 KPI 목표"
        required
        highlightParagraphId={PROGRAM_REGISTRATION_IDS.businessKpi}
      >
        <OneCOneSRegistrationBusinessKpiParagraph />
      </ProgramCommonInfoEditSection>
      <ProgramCommonInfoEditSection
        title="임금 정보"
        description={PROGRAM_REGISTRATION_GENERAL_SECTION_META.wageInfo.editDescription}
        required
        highlightParagraphId={PROGRAM_REGISTRATION_IDS.wageInfo}
      >
        <OneCOneSRegistrationWageInfoParagraph />
      </ProgramCommonInfoEditSection>
      <ProgramCommonInfoEditSection
        title="교육 진행 (커리큘럼)"
        description={PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationCurriculum.registrationDescription}
        required
        highlightParagraphId={PROGRAM_REGISTRATION_IDS.educationCurriculum}
      >
        <OneCOneSRegistrationEducationCurriculumParagraph />
      </ProgramCommonInfoEditSection>
      <ProgramCommonInfoEditSection
        title={PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationScheduleSettings.title}
        description={PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationScheduleSettings.registrationDescription}
        required
        highlightParagraphId={PROGRAM_REGISTRATION_IDS.educationScheduleSettings}
      >
        <OneCOneSRegistrationEducationScheduleSettingsParagraph
          educationScheduleMode="period"
          onEducationScheduleModeChange={noop}
        />
      </ProgramCommonInfoEditSection>
    </ProgramCommonInfoEditSections>
  )
}
