/**
 * 1사1교 상세 공통정보 수정 — 등록 단락을 그대로 마운트 (등록 양식 변경 없음).
 * 섹션 타이틀·간격은 조회 화면(ProjectInfo 공통정보)과 동일하게 유지한다.
 */
import dayjs from 'dayjs'
import type { Program } from '@/types/domain'
import { useProgramRegistrationOverlayKv } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import {
  formatEducationScheduleLineFromRange,
  parseEducationScheduleLineToRange,
} from '@/features/template/lib/format-education-schedule-line'
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
import { EducationScheduleChangeTitleAction } from '@/features/program/shared/ui/education-schedule-change-title-action'
import { patchInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'

const FIXED_PARTICIPANT = {
  individual: false,
  organization: true,
  teacherInstructor: true,
} as const

const ECONOMY_SCHEDULE_SETTINGS_PREFIX = 'economyRegistration.educationScheduleSettings'

function noop() {}

function CompanySchoolEducationScheduleChangeAction({ program }: { program: Program }) {
  const [dateRangeSeal, setDateRangeSeal] = useProgramRegistrationOverlayKv<
    { start: string; end: string } | null
  >(`${ECONOMY_SCHEDULE_SETTINGS_PREFIX}.dateRangeSeal`, null)

  const start = dateRangeSeal?.start ? dayjs(dateRangeSeal.start) : null
  const end = dateRangeSeal?.end ? dayjs(dateRangeSeal.end) : null
  const scheduleLines =
    start?.isValid() && end?.isValid()
      ? [formatEducationScheduleLineFromRange([start.startOf('day'), end.startOf('day')])]
      : []

  return (
    <EducationScheduleChangeTitleAction
      programId={program.id}
      scheduleLines={scheduleLines}
      educationScheduleMode="period"
      operationStart={program.startDate}
      operationEnd={program.endDate}
      onApply={nextLines => {
        const range = parseEducationScheduleLineToRange(nextLines[0])
        if (!range) return
        const next = {
          start: range[0].startOf('day').toISOString(),
          end: range[1].startOf('day').toISOString(),
        }
        setDateRangeSeal(next)
        patchInstitutionApplicationProgramBridge({
          educationScheduleRange: next,
        })
      }}
    />
  )
}

export function CompanySchoolCommonInfoRegistrationEdit({ program }: { program: Program }) {
  return (
    <ProgramCommonInfoEditSections>
      <ProgramCommonInfoEditSection
        title="기본 정보"
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
        required
        highlightParagraphId={PROGRAM_REGISTRATION_IDS.wageInfo}
      >
        <OneCOneSRegistrationWageInfoParagraph />
      </ProgramCommonInfoEditSection>
      <ProgramCommonInfoEditSection
        title="교육 진행 (커리큘럼)"
        required
        highlightParagraphId={PROGRAM_REGISTRATION_IDS.educationCurriculum}
      >
        <OneCOneSRegistrationEducationCurriculumParagraph />
      </ProgramCommonInfoEditSection>
      <ProgramCommonInfoEditSection
        title={PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationScheduleSettings.title}
        description={PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationScheduleSettings.editDescription}
        required
        highlightParagraphId={PROGRAM_REGISTRATION_IDS.educationScheduleSettings}
        titleTrailing={<CompanySchoolEducationScheduleChangeAction program={program} />}
      >
        <OneCOneSRegistrationEducationScheduleSettingsParagraph
          educationScheduleMode="period"
          onEducationScheduleModeChange={noop}
        />
      </ProgramCommonInfoEditSection>
    </ProgramCommonInfoEditSections>
  )
}
