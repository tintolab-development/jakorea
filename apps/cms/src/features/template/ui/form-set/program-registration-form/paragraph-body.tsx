import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import { PROGRAM_REGISTRATION_IDS } from '@/features/template/model/program-registration-draft'
import { ProgramRegistrationBasicInfoParagraph } from '@/features/template/ui/form-set/program-registration-form/paragraphs/basic-info-paragraph'
import { ProgramRegistrationBusinessKpiParagraph } from '@/features/template/ui/form-set/program-registration-form/paragraphs/business-kpi-paragraph'
import { ProgramRegistrationEducationCurriculumParagraph } from '@/features/template/ui/form-set/program-registration-form/paragraphs/education-curriculum-paragraph'
import { ProgramRegistrationEducationScheduleCurriculumParagraph } from '@/features/template/ui/form-set/program-registration-form/paragraphs/education-schedule-curriculum-paragraph'
import { ProgramRegistrationEducationScheduleSettingsParagraph } from '@/features/template/ui/form-set/program-registration-form/paragraphs/education-schedule-settings-paragraph'
import { ProgramRegistrationTypeSettingsParagraph } from '@/features/template/ui/form-set/program-registration-form/paragraphs/type-settings-paragraph'
import { ProgramRegistrationWageInfoParagraph } from '@/features/template/ui/form-set/program-registration-form/paragraphs/wage-info-paragraph'

export type ProgramRegistrationType = 'curriculum' | 'schedule'

/** 수업 회차 유형 — 단일/복수 */
export type ProgramRegistrationSessionRoundType = 'single' | 'multi'

/** 복수 회차 시 교육 형태·참여 방식·IPS: 일정 공통 vs 차시별 입력 */
export type ProgramRegistrationScheduleDetailKind = 'common' | 'perSchedule'

export interface ProgramRegistrationParticipantState {
  individual: boolean
  organization: boolean
}

export interface ProgramRegistrationParagraphBodyOptions {
  participant: ProgramRegistrationParticipantState
  programType: ProgramRegistrationType
  onProgramTypeChange: (value: ProgramRegistrationType) => void
  onIndividualChange: (checked: boolean) => void
  onOrganizationChange: (checked: boolean) => void
  sessionRoundType: ProgramRegistrationSessionRoundType
  onSessionRoundTypeChange: (value: ProgramRegistrationSessionRoundType) => void
  educationFormScheduleDetail: ProgramRegistrationScheduleDetailKind
  onEducationFormScheduleDetailChange: (value: ProgramRegistrationScheduleDetailKind) => void
  participationScheduleDetail: ProgramRegistrationScheduleDetailKind
  onParticipationScheduleDetailChange: (value: ProgramRegistrationScheduleDetailKind) => void
  ipsScheduleDetail: ProgramRegistrationScheduleDetailKind
  onIpsScheduleDetailChange: (value: ProgramRegistrationScheduleDetailKind) => void
  curriculumSessionCount: number
  onAddCurriculumSession: () => void
  /** 단일 회차 + IPS 일정 별 상이 — 커리큘럼 차시 블록 개수·추가 */
  curriculumChartSessionCount: number
  onAddCurriculumChartSession: () => void
  /**
   * true면 템플릿 `/templates` 편집 등: 커리큘럼형「강의 진행 차시/회차 추가」비활성, 차시·회차 블록 1개만 노출.
   * 프로그램 관리 등 실제 등록 폼에서는 false(또는 생략).
   */
  restrictCurriculumSessionStructure?: boolean
  /** 교육 진행 구조 일정형 — 세부 일정 블록 수·추가 */
  scheduleCurriculumDetailCount: number
  onAddScheduleCurriculumDetail: () => void
  /** 일정형 — 진행 그룹(A,B,…) 수·추가 */
  scheduleCurriculumGroupCount: number
  onAddScheduleCurriculumGroup: () => void
  /** 일정형(복수·일정 별 상이 조합) 카드 헤더 — 사전 교육 토글 */
  scheduleCurriculumPreEducation: boolean
  onScheduleCurriculumPreEducationChange: (checked: boolean) => void
}

export function renderProgramRegistrationParagraphBody(
  paragraph: HorizontalTableParagraph,
  options?: ProgramRegistrationParagraphBodyOptions
) {
  switch (paragraph.id) {
    case PROGRAM_REGISTRATION_IDS.basicInfo:
      return options == null ? null : (
        <ProgramRegistrationBasicInfoParagraph
          participant={options.participant}
          onIndividualChange={options.onIndividualChange}
          onOrganizationChange={options.onOrganizationChange}
        />
      )
    case PROGRAM_REGISTRATION_IDS.businessKpi:
      return (
        <ProgramRegistrationBusinessKpiParagraph
          participantOrganization={options?.participant.organization ?? false}
        />
      )
    case PROGRAM_REGISTRATION_IDS.wageInfo:
      return <ProgramRegistrationWageInfoParagraph />
    case PROGRAM_REGISTRATION_IDS.typeSettings:
      return options == null ? null : (
        <ProgramRegistrationTypeSettingsParagraph
          programType={options.programType}
          onProgramTypeChange={options.onProgramTypeChange}
          participantOrganization={options.participant.organization}
          sessionRoundType={options.sessionRoundType}
          onSessionRoundTypeChange={options.onSessionRoundTypeChange}
          educationFormScheduleDetail={options.educationFormScheduleDetail}
          onEducationFormScheduleDetailChange={options.onEducationFormScheduleDetailChange}
          participationScheduleDetail={options.participationScheduleDetail}
          onParticipationScheduleDetailChange={options.onParticipationScheduleDetailChange}
          ipsScheduleDetail={options.ipsScheduleDetail}
          onIpsScheduleDetailChange={options.onIpsScheduleDetailChange}
        />
      )
    case PROGRAM_REGISTRATION_IDS.educationCurriculum:
      return options == null ? null : options.programType === 'schedule' ? (
        <ProgramRegistrationEducationScheduleCurriculumParagraph
          key={`pr-schedule-curriculum-${options.scheduleCurriculumDetailCount}-${options.scheduleCurriculumGroupCount}-${options.sessionRoundType}-${options.educationFormScheduleDetail}-${options.participationScheduleDetail}-${options.ipsScheduleDetail}-${options.participant.organization ? 'org' : 'ind'}`}
          scheduleDetailCount={options.scheduleCurriculumDetailCount}
          scheduleGroupCount={options.scheduleCurriculumGroupCount}
          ipsPerSchedule={options.ipsScheduleDetail === 'perSchedule'}
          sessionRoundType={options.sessionRoundType}
          participantOrganization={options.participant.organization}
          educationFormScheduleDetail={options.educationFormScheduleDetail}
          participationScheduleDetail={options.participationScheduleDetail}
          ipsScheduleDetail={options.ipsScheduleDetail}
          scheduleCurriculumPreEducation={options.scheduleCurriculumPreEducation}
        />
      ) : (
        <ProgramRegistrationEducationCurriculumParagraph
          key={`pr-curriculum-${options.sessionRoundType}-${options.educationFormScheduleDetail}-${options.participationScheduleDetail}-${options.ipsScheduleDetail}-${options.participant.organization ? 'org' : 'ind'}`}
          sessionRoundType={options.sessionRoundType}
          participantOrganization={options.participant.organization}
          curriculumSessionCount={options.curriculumSessionCount}
          curriculumChartSessionCount={options.curriculumChartSessionCount}
          educationFormScheduleDetail={options.educationFormScheduleDetail}
          participationScheduleDetail={options.participationScheduleDetail}
          ipsScheduleDetail={options.ipsScheduleDetail}
        />
      )
    case PROGRAM_REGISTRATION_IDS.educationScheduleSettings:
      return <ProgramRegistrationEducationScheduleSettingsParagraph />
    default:
      return null
  }
}
