/**
 * 일반 프로그램 상세 공통정보 수정 — 등록 단락을 그대로 마운트 (등록 양식 변경 없음).
 */
import { useEffect, useState } from 'react'
import type { Program } from '@/types/domain'
import {
  extrasFromGeneralProgram,
  setGeneralRegistrationDetailEditExtras,
} from '@/features/program/general/lib/registration-overlay-sync'
import type { GeneralRegistrationEditorExtras } from '@/features/program/general/lib/registration-overlay-to-program'
import type { ProgramRegistrationParticipantState } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
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
import { PROGRAM_REGISTRATION_GENERAL_SECTION_META } from '@/features/template/ui/form-set/registration-form/general/program-registration-general-section-meta'
import {
  resolveProgramRegistrationCurriculumEditDescription,
  resolveProgramRegistrationScheduleCurriculumEditDescription,
} from '@/features/template/lib/program-registration-curriculum-description'
import {
  ProgramCommonInfoEditRegistrationAuditForm,
  ProgramCommonInfoEditSection,
  ProgramCommonInfoEditSections,
} from '@/features/program/shared/ui/program-detail/common-info-edit-section'

function participantFromProgram(program: Program): ProgramRegistrationParticipantState {
  const types = program.generalParticipantTypes ?? []
  return {
    individual:
      program.generalProgramAudience === 'individual' || types.includes('individual'),
    organization:
      program.generalProgramAudience === 'organization' || types.includes('school_institution'),
    teacherInstructor: types.includes('teacher_instructor'),
    volunteer: types.includes('volunteer'),
  }
}

export function GeneralProgramCommonInfoRegistrationEdit({ program }: { program: Program }) {
  const [extras, setExtras] = useState<GeneralRegistrationEditorExtras>(() =>
    extrasFromGeneralProgram(program)
  )
  const [participant, setParticipant] = useState(() => participantFromProgram(program))

  useEffect(() => {
    setGeneralRegistrationDetailEditExtras(extrasFromGeneralProgram(program))
  }, [program.id])

  const commitExtras = (next: GeneralRegistrationEditorExtras) => {
    setExtras(next)
    setGeneralRegistrationDetailEditExtras(next)
  }

  const hideScheduleSettings =
    extras.programType === 'schedule' && extras.sessionRoundType === 'multi'

  const isScheduleStructure = extras.programType === 'schedule'
  const curriculumTitle = isScheduleStructure
    ? PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationScheduleCurriculum.title
    : PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationCurriculum.title
  const curriculumDescription = isScheduleStructure
    ? resolveProgramRegistrationScheduleCurriculumEditDescription({
        sessionRoundType: extras.sessionRoundType,
        participantOrganization: participant.organization,
        educationFormScheduleDetail: extras.educationFormScheduleDetail ?? 'common',
        participationScheduleDetail: extras.participationScheduleDetail ?? 'common',
        ipsScheduleDetail: extras.ipsScheduleDetail ?? 'common',
      })
    : resolveProgramRegistrationCurriculumEditDescription(extras.sessionRoundType)

  return (
    <ProgramCommonInfoEditSections>
      <ProgramCommonInfoEditSection title="기본 정보" required>
        <ProgramCommonInfoEditRegistrationAuditForm program={program} />
        <ProgramRegistrationBasicInfoParagraph
          lockParticipantTypes
          participant={participant}
          onIndividualChange={checked =>
            setParticipant(prev => ({ ...prev, individual: checked }))
          }
          onOrganizationChange={checked => {
            setParticipant(prev => ({ ...prev, organization: checked }))
            commitExtras({ ...extras, participantOrganization: checked })
          }}
          onTeacherInstructorChange={checked =>
            setParticipant(prev => ({ ...prev, teacherInstructor: checked }))
          }
          onVolunteerChange={checked =>
            setParticipant(prev => ({ ...prev, volunteer: checked }))
          }
          programType={extras.programType}
        />
      </ProgramCommonInfoEditSection>
      <ProgramCommonInfoEditSection title="사업 KPI 목표" required>
        <ProgramRegistrationBusinessKpiParagraph
          instructorDisabled={participant.teacherInstructor !== true}
          instructorPlaceholder={
            participant.teacherInstructor === true ? '목표값 입력' : '해당 없음'
          }
          volunteerDisabled={participant.volunteer !== true}
          volunteerPlaceholder={participant.volunteer === true ? '목표값 입력' : '해당 없음'}
          dispatchedSchoolDisabled={participant.individual === true}
          dispatchedSchoolPlaceholder={
            participant.individual === true ? '해당 없음' : '목표값 입력'
          }
          dispatchedClassDisabled={participant.individual === true}
          dispatchedClassPlaceholder={
            participant.individual === true ? '해당 없음' : '목표값 입력'
          }
        />
      </ProgramCommonInfoEditSection>
      <ProgramCommonInfoEditSection
        title={PROGRAM_REGISTRATION_GENERAL_SECTION_META.wageInfo.title}
        description={PROGRAM_REGISTRATION_GENERAL_SECTION_META.wageInfo.editDescription}
        required
      >
        <ProgramRegistrationWageInfoParagraph />
      </ProgramCommonInfoEditSection>
      <ProgramCommonInfoEditSection
        title={PROGRAM_REGISTRATION_GENERAL_SECTION_META.typeSettings.title}
        description={PROGRAM_REGISTRATION_GENERAL_SECTION_META.typeSettings.editDescription}
        required
      >
        <ProgramRegistrationTypeSettingsParagraph
          programType={extras.programType}
          onProgramTypeChange={value => commitExtras({ ...extras, programType: value })}
          participantOrganization={participant.organization}
          sessionRoundType={extras.sessionRoundType}
          onSessionRoundTypeChange={value =>
            commitExtras({ ...extras, sessionRoundType: value })
          }
          educationFormScheduleDetail={extras.educationFormScheduleDetail ?? 'common'}
          onEducationFormScheduleDetailChange={value =>
            commitExtras({ ...extras, educationFormScheduleDetail: value })
          }
          participationScheduleDetail={extras.participationScheduleDetail ?? 'common'}
          onParticipationScheduleDetailChange={value =>
            commitExtras({ ...extras, participationScheduleDetail: value })
          }
          ipsScheduleDetail={extras.ipsScheduleDetail ?? 'common'}
          onIpsScheduleDetailChange={value =>
            commitExtras({ ...extras, ipsScheduleDetail: value })
          }
        />
      </ProgramCommonInfoEditSection>
      <ProgramCommonInfoEditSection
        title={curriculumTitle}
        description={curriculumDescription}
        required
      >
        {isScheduleStructure ? (
          <ProgramRegistrationEducationScheduleCurriculumParagraph
            key={`pr-schedule-curriculum-${extras.sessionRoundType}-${extras.educationFormScheduleDetail}-${extras.participationScheduleDetail}-${extras.ipsScheduleDetail}-${participant.organization ? 'org' : 'ind'}`}
            scheduleDetailCount={extras.scheduleCurriculumDetailCount ?? 1}
            onDeleteScheduleCurriculumDetail={() =>
              commitExtras({
                ...extras,
                scheduleCurriculumDetailCount: Math.max(
                  1,
                  (extras.scheduleCurriculumDetailCount ?? 1) - 1
                ),
              })
            }
            scheduleGroupCount={1}
            onDeleteScheduleCurriculumGroup={() => undefined}
            ipsPerSchedule={extras.ipsScheduleDetail === 'perSchedule'}
            sessionRoundType={extras.sessionRoundType}
            participantOrganization={participant.organization}
            educationFormScheduleDetail={extras.educationFormScheduleDetail ?? 'common'}
            participationScheduleDetail={extras.participationScheduleDetail ?? 'common'}
            ipsScheduleDetail={extras.ipsScheduleDetail ?? 'common'}
            scheduleCurriculumPreEducation={extras.scheduleCurriculumPreEducation === true}
          />
        ) : (
          <ProgramRegistrationEducationCurriculumParagraph
            key={`pr-curriculum-${extras.sessionRoundType}-${extras.educationFormScheduleDetail}-${extras.participationScheduleDetail}-${extras.ipsScheduleDetail}-${participant.organization ? 'org' : 'ind'}`}
            sessionRoundType={extras.sessionRoundType}
            participantOrganization={participant.organization}
            curriculumSessionCount={extras.curriculumSessionCount ?? 1}
            onDeleteCurriculumSession={() =>
              commitExtras({
                ...extras,
                curriculumSessionCount: Math.max(1, (extras.curriculumSessionCount ?? 1) - 1),
              })
            }
            curriculumChartSessionCount={extras.curriculumChartSessionCount ?? 1}
            onDeleteCurriculumChartSession={() =>
              commitExtras({
                ...extras,
                curriculumChartSessionCount: Math.max(
                  1,
                  (extras.curriculumChartSessionCount ?? 1) - 1
                ),
              })
            }
            educationFormScheduleDetail={extras.educationFormScheduleDetail ?? 'common'}
            participationScheduleDetail={extras.participationScheduleDetail ?? 'common'}
            ipsScheduleDetail={extras.ipsScheduleDetail ?? 'common'}
            scheduleCurriculumPreEducation={extras.scheduleCurriculumPreEducation === true}
          />
        )}
      </ProgramCommonInfoEditSection>
      {hideScheduleSettings ? null : (
        <ProgramCommonInfoEditSection
          title={PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationScheduleSettings.title}
          description={
            PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationScheduleSettings.editDescription
          }
          required
        >
          <ProgramRegistrationEducationScheduleSettingsParagraph
            educationScheduleMode={extras.educationScheduleMode ?? 'date'}
            onEducationScheduleModeChange={value =>
              commitExtras({ ...extras, educationScheduleMode: value })
            }
            autoFillFromScheduleGroupTimes={
              extras.programType === 'schedule' &&
              extras.sessionRoundType === 'single' &&
              !participant.organization
            }
            disablePeriodMode={shouldDisableEducationSchedulePeriodMode({
              participantOrganization: participant.organization,
              sessionRound: extras.sessionRoundType,
            })}
            lockCalendarTogglesToScheduleMode={shouldLockEducationScheduleCalendarToggles({
              participantOrganization: participant.organization,
              educationStructure: extras.programType,
            })}
          />
        </ProgramCommonInfoEditSection>
      )}
    </ProgramCommonInfoEditSections>
  )
}
