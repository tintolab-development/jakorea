/**
 * 1사1교 상세 공통정보 수정 — 등록 단락을 그대로 마운트 (등록 양식 변경 없음).
 * 섹션 타이틀·간격은 조회 화면(ProjectInfo 공통정보)과 동일하게 유지한다.
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

const FIXED_PARTICIPANT = {
  individual: false,
  organization: true,
  teacherInstructor: true,
} as const

function noop() {}

export function CompanySchoolCommonInfoRegistrationEdit({ program }: { program: Program }) {
  return (
    <ProgramCommonInfoEditSections>
      <ProgramCommonInfoEditSection title="기본 정보">
        <ProgramCommonInfoEditRegistrationAuditForm program={program} />
        <OneCOneSRegistrationBasicInfoParagraph
          participant={FIXED_PARTICIPANT}
          onIndividualChange={noop}
          onOrganizationChange={noop}
          onTeacherInstructorChange={noop}
        />
      </ProgramCommonInfoEditSection>
      <ProgramCommonInfoEditSection title="사업 KPI 목표">
        <OneCOneSRegistrationBusinessKpiParagraph />
      </ProgramCommonInfoEditSection>
      <ProgramCommonInfoEditSection title="임금 정보">
        <OneCOneSRegistrationWageInfoParagraph />
      </ProgramCommonInfoEditSection>
      <ProgramCommonInfoEditSection title="교육 진행 (커리큘럼)">
        <OneCOneSRegistrationEducationCurriculumParagraph />
      </ProgramCommonInfoEditSection>
      <ProgramCommonInfoEditSection title="교육 진행 일정 설정">
        <OneCOneSRegistrationEducationScheduleSettingsParagraph
          educationScheduleMode="period"
          onEducationScheduleModeChange={noop}
        />
      </ProgramCommonInfoEditSection>
    </ProgramCommonInfoEditSections>
  )
}
