import type { HorizontalTableParagraph } from '@/features/template/model/writing-form-draft.schema'
import {
  PROGRAM_REGISTRATION_IDS,
  type ProgramRegistrationFormVariant,
} from '@/features/template/model/program-registration-draft'
import {
  OneCOneSRegistrationBasicInfoParagraph,
  OneCOneSRegistrationBusinessKpiParagraph,
  OneCOneSRegistrationEducationCurriculumParagraph,
  OneCOneSRegistrationEducationScheduleSettingsParagraph,
  OneCOneSRegistrationWageInfoParagraph,
} from '@/features/template/ui/form-set/registration-form/1c-1s'
import {
  TrainedTeachersRegistrationBasicInfoParagraph,
  TrainedTeachersRegistrationBusinessKpiParagraph,
  TrainedTeachersRegistrationEducationCurriculumParagraph,
  TrainedTeachersRegistrationEducationScheduleSettingsParagraph,
  TrainedTeachersRegistrationTypeSettingsParagraph,
} from '@/features/template/ui/form-set/registration-form/trained-teachers'
import { ProgramRegistrationBasicInfoParagraph } from '@/features/template/ui/form-set/registration-form/general/paragraphs/basic-info-paragraph'
import { ProgramRegistrationBusinessKpiParagraph } from '@/features/template/ui/form-set/registration-form/general/paragraphs/business-kpi-paragraph'
import { ProgramRegistrationEducationCurriculumParagraph } from '@/features/template/ui/form-set/registration-form/general/paragraphs/education-curriculum-paragraph'
import { ProgramRegistrationEducationScheduleCurriculumParagraph } from '@/features/template/ui/form-set/registration-form/general/paragraphs/education-schedule-curriculum-paragraph'
import { ProgramRegistrationEducationScheduleSettingsParagraph } from '@/features/template/ui/form-set/registration-form/general/paragraphs/education-schedule-settings-paragraph'
import { ProgramRegistrationTypeSettingsParagraph } from '@/features/template/ui/form-set/registration-form/general/paragraphs/type-settings-paragraph'
import { ProgramRegistrationWageInfoParagraph } from '@/features/template/ui/form-set/registration-form/general/paragraphs/wage-info-paragraph'
import {
  shouldDisableEducationSchedulePeriodMode,
  shouldLockEducationScheduleCalendarToggles,
} from '@/features/program/general/lib/schedule-detail-form'

export type ProgramRegistrationType = 'curriculum' | 'schedule'

/** 수업 회차 유형 — 단일/복수 */
export type ProgramRegistrationSessionRoundType = 'single' | 'multi'

/** 교육 진행 일정 유형 — `period` = 기획 「날짜 선택(기간)」 */
export type ProgramRegistrationEducationScheduleMode = 'date' | 'period'

/** 복수 회차 시 교육 형태·참여 방식·IPS: 일정 공통 vs 차시별 입력 */
export type ProgramRegistrationScheduleDetailKind = 'common' | 'perSchedule'

export const PROGRAM_REGISTRATION_SCHEDULE_CURRICULUM_MAX_GROUP_COUNT = 4

export interface ProgramRegistrationParticipantState {
  individual: boolean
  organization: boolean
  teacherInstructor?: boolean
  volunteer?: boolean
}

export interface ProgramRegistrationParagraphBodyOptions {
  participant: ProgramRegistrationParticipantState
  programType: ProgramRegistrationType
  onProgramTypeChange: (value: ProgramRegistrationType) => void
  onIndividualChange: (checked: boolean) => void
  onOrganizationChange: (checked: boolean) => void
  onTeacherInstructorChange: (checked: boolean) => void
  onVolunteerChange: (checked: boolean) => void
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
  onDeleteCurriculumSession: (roundIndex: number) => void
  /** 단일 회차 + IPS 일정 별 상이 — 커리큘럼 차시 블록 개수·추가 */
  curriculumChartSessionCount: number
  onAddCurriculumChartSession: () => void
  onDeleteCurriculumChartSession: (chartIndex: number) => void
  /**
   * true면 템플릿 `/templates` 편집 등: 커리큘럼형「강의 진행 차시/회차 추가」비활성, 차시·회차 블록 1개만 노출.
   * 프로그램 관리 등 실제 등록 폼에서는 false(또는 생략).
   */
  restrictCurriculumSessionStructure?: boolean
  /** `economy`: 1사 1교 — `form-set/registration-form/1c-1s` 단락 컴포넌트로 렌더 */
  programRegistrationFormVariant?: ProgramRegistrationFormVariant
  /** 교육 진행 구조 일정형 — 세부 일정 블록 수·추가 */
  scheduleCurriculumDetailCount: number
  onAddScheduleCurriculumDetail: () => void
  onDeleteScheduleCurriculumDetail: (detailIndex: number) => void
  /** 일정형 — 진행 그룹(A,B,…) 수·추가 */
  scheduleCurriculumGroupCount: number
  onAddScheduleCurriculumGroup: () => void
  onDeleteScheduleCurriculumGroup: (groupIndex: number) => void
  /** 카드 헤더 — 사전 교육 토글 (일정형·커리큘럼형) */
  scheduleCurriculumPreEducation: boolean
  onScheduleCurriculumPreEducationChange: (checked: boolean) => void
  /** 교육받은 교사 — 카드 헤더 교육 연수 토글 */
  trainedTeachersTeacherTrainingEnabled: boolean
  onTrainedTeachersTeacherTrainingEnabledChange: (checked: boolean) => void
  educationScheduleMode: ProgramRegistrationEducationScheduleMode
  onEducationScheduleModeChange: (value: ProgramRegistrationEducationScheduleMode) => void
  /** 일반 등록만 — 후원사 선택 (1사1교·교육받은 교사 미사용) */
  sponsorId?: string
  onSponsorIdChange?: (sponsorId: string) => void
  sponsorContactId?: string
  onSponsorContactIdChange?: (contactId: string) => void
  /** 일반 등록 — 대표 프로그램명(국문) → 생성·목록 title */
  programTitleKo?: string
  onProgramTitleKoChange?: (title: string) => void
}

export function renderProgramRegistrationParagraphBody(
  paragraph: HorizontalTableParagraph,
  options?: ProgramRegistrationParagraphBodyOptions
) {
  switch (paragraph.id) {
    case PROGRAM_REGISTRATION_IDS.basicInfo:
      return options == null ? null : options.programRegistrationFormVariant ===
        'trainedTeachers' ? (
        <TrainedTeachersRegistrationBasicInfoParagraph
          participant={options.participant}
          onIndividualChange={options.onIndividualChange}
          onOrganizationChange={options.onOrganizationChange}
          onTeacherInstructorChange={options.onTeacherInstructorChange}
          onVolunteerChange={options.onVolunteerChange}
        />
      ) : options.programRegistrationFormVariant === 'economy' ? (
        <OneCOneSRegistrationBasicInfoParagraph
          participant={options.participant}
          onIndividualChange={options.onIndividualChange}
          onOrganizationChange={options.onOrganizationChange}
          onTeacherInstructorChange={options.onTeacherInstructorChange}
        />
      ) : (
        <ProgramRegistrationBasicInfoParagraph
          participant={options.participant}
          onIndividualChange={options.onIndividualChange}
          onOrganizationChange={options.onOrganizationChange}
          onTeacherInstructorChange={options.onTeacherInstructorChange}
          onVolunteerChange={options.onVolunteerChange}
          sponsorId={options.sponsorId}
          onSponsorIdChange={options.onSponsorIdChange}
          sponsorContactId={options.sponsorContactId}
          onSponsorContactIdChange={options.onSponsorContactIdChange}
          programTitleKo={options.programTitleKo}
          onProgramTitleKoChange={options.onProgramTitleKoChange}
        />
      )
    case PROGRAM_REGISTRATION_IDS.businessKpi:
      return options?.programRegistrationFormVariant === 'trainedTeachers' ? (
        <TrainedTeachersRegistrationBusinessKpiParagraph />
      ) : options?.programRegistrationFormVariant === 'economy' ? (
        <OneCOneSRegistrationBusinessKpiParagraph />
      ) : (
        <ProgramRegistrationBusinessKpiParagraph
          instructorDisabled={options?.participant.teacherInstructor !== true}
          instructorPlaceholder={
            options?.participant.teacherInstructor === true ? '목표값 입력' : '해당 없음'
          }
          volunteerDisabled={options?.participant.volunteer !== true}
          volunteerPlaceholder={
            options?.participant.volunteer === true ? '목표값 입력' : '해당 없음'
          }
          dispatchedSchoolDisabled={options?.participant.individual === true}
          dispatchedSchoolPlaceholder={
            options?.participant.individual === true ? '해당 없음' : '목표값 입력'
          }
          dispatchedClassDisabled={options?.participant.individual === true}
          dispatchedClassPlaceholder={
            options?.participant.individual === true ? '해당 없음' : '목표값 입력'
          }
        />
      )
    case PROGRAM_REGISTRATION_IDS.wageInfo:
      if (options?.programRegistrationFormVariant === 'trainedTeachers') return null
      return options?.programRegistrationFormVariant === 'economy' ? (
        <OneCOneSRegistrationWageInfoParagraph />
      ) : (
        <ProgramRegistrationWageInfoParagraph />
      )
    case PROGRAM_REGISTRATION_IDS.typeSettings:
      return options == null ? null : options.programRegistrationFormVariant ===
        'trainedTeachers' ? (
        <TrainedTeachersRegistrationTypeSettingsParagraph
          programType={options.programType}
          onProgramTypeChange={options.onProgramTypeChange}
          sessionRoundType={options.sessionRoundType}
          onSessionRoundTypeChange={options.onSessionRoundTypeChange}
          educationFormScheduleDetail={options.educationFormScheduleDetail}
          onEducationFormScheduleDetailChange={options.onEducationFormScheduleDetailChange}
          ipsScheduleDetail={options.ipsScheduleDetail}
          onIpsScheduleDetailChange={options.onIpsScheduleDetailChange}
        />
      ) : (
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
      return options == null ? null : options.programRegistrationFormVariant ===
        'trainedTeachers' ? (
        options.programType === 'schedule' ? (
          <ProgramRegistrationEducationScheduleCurriculumParagraph
            key={`tt-schedule-curriculum-${options.sessionRoundType}-${options.educationFormScheduleDetail}-${options.ipsScheduleDetail}`}
            scheduleDetailCount={options.scheduleCurriculumDetailCount}
            onDeleteScheduleCurriculumDetail={options.onDeleteScheduleCurriculumDetail}
            scheduleGroupCount={options.scheduleCurriculumGroupCount}
            onDeleteScheduleCurriculumGroup={options.onDeleteScheduleCurriculumGroup}
            ipsPerSchedule={options.ipsScheduleDetail === 'perSchedule'}
            sessionRoundType={options.sessionRoundType}
            participantOrganization={options.participant.organization}
            educationFormScheduleDetail={options.educationFormScheduleDetail}
            participationScheduleDetail={options.participationScheduleDetail}
            ipsScheduleDetail={options.ipsScheduleDetail}
            scheduleCurriculumPreEducation={options.trainedTeachersTeacherTrainingEnabled}
            preEducationBlockLabel="교육 연수"
          />
        ) : (
          <TrainedTeachersRegistrationEducationCurriculumParagraph
            teacherTrainingEnabled={options.trainedTeachersTeacherTrainingEnabled}
            curriculumSessionCount={options.curriculumChartSessionCount}
            onDeleteCurriculumSession={options.onDeleteCurriculumChartSession}
          />
        )
      ) : options.programRegistrationFormVariant === 'economy' ? (
        <OneCOneSRegistrationEducationCurriculumParagraph />
      ) : options.programType === 'schedule' ? (
        <ProgramRegistrationEducationScheduleCurriculumParagraph
          key={`pr-schedule-curriculum-${options.sessionRoundType}-${options.educationFormScheduleDetail}-${options.participationScheduleDetail}-${options.ipsScheduleDetail}-${options.participant.organization ? 'org' : 'ind'}`}
          scheduleDetailCount={options.scheduleCurriculumDetailCount}
          onDeleteScheduleCurriculumDetail={options.onDeleteScheduleCurriculumDetail}
          scheduleGroupCount={options.scheduleCurriculumGroupCount}
          onDeleteScheduleCurriculumGroup={options.onDeleteScheduleCurriculumGroup}
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
          onDeleteCurriculumSession={options.onDeleteCurriculumSession}
          curriculumChartSessionCount={options.curriculumChartSessionCount}
          onDeleteCurriculumChartSession={options.onDeleteCurriculumChartSession}
          educationFormScheduleDetail={options.educationFormScheduleDetail}
          participationScheduleDetail={options.participationScheduleDetail}
          ipsScheduleDetail={options.ipsScheduleDetail}
          scheduleCurriculumPreEducation={options.scheduleCurriculumPreEducation}
        />
      )
    case PROGRAM_REGISTRATION_IDS.educationScheduleSettings:
      if (options == null) return null
      /** 일반 일정형 + 복수 회차 — 등록·상세와 동일하게 비노출 */
      if (options.programRegistrationFormVariant === 'general') {
        if (options.programType === 'schedule' && options.sessionRoundType === 'multi') {
          return null
        }
        return (
          <ProgramRegistrationEducationScheduleSettingsParagraph
            educationScheduleMode={options.educationScheduleMode}
            onEducationScheduleModeChange={options.onEducationScheduleModeChange}
            autoFillFromScheduleGroupTimes={
              options.programType === 'schedule' &&
              options.sessionRoundType === 'single' &&
              !options.participant.organization
            }
            disablePeriodMode={shouldDisableEducationSchedulePeriodMode({
              participantOrganization: options.participant.organization,
              sessionRound: options.sessionRoundType,
            })}
            lockCalendarTogglesToScheduleMode={shouldLockEducationScheduleCalendarToggles({
              participantOrganization: options.participant.organization,
              educationStructure: options.programType,
            })}
          />
        )
      }
      return options.programRegistrationFormVariant === 'trainedTeachers' ? (
        options.programType === 'schedule' && options.sessionRoundType === 'multi' ? null : (
          <TrainedTeachersRegistrationEducationScheduleSettingsParagraph
            educationScheduleMode={options.educationScheduleMode}
            onEducationScheduleModeChange={options.onEducationScheduleModeChange}
          />
        )
      ) : options.programRegistrationFormVariant === 'economy' ? (
        <OneCOneSRegistrationEducationScheduleSettingsParagraph
          educationScheduleMode={options.educationScheduleMode}
          onEducationScheduleModeChange={options.onEducationScheduleModeChange}
        />
      ) : null
    default:
      return null
  }
}
