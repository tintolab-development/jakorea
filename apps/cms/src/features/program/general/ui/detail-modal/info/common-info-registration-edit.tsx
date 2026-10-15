/**
 * 일반 프로그램 상세 공통정보 수정 — 등록 단락을 그대로 마운트 (등록 양식 변경 없음).
 */
import { useEffect, useMemo, useState } from 'react'
import type { Program } from '@/types/domain'
import {
  extrasFromGeneralProgram,
  setGeneralRegistrationDetailEditExtras,
  seedGeneralRegistrationOverlayFromProgram,
} from '@/features/program/general/lib/registration-overlay-sync'
import type { GeneralRegistrationEditorExtras } from '@/features/program/general/lib/registration-overlay-to-program'
import {
  applyGeneralParticipantAudienceSelection,
  participantFlagsFromGeneralProgram,
  resolveGeneralRegistrationKpiFieldAvailability,
  shouldResetParticipationScheduleDetailForAudience,
  type GeneralParticipantRegistrationFlags,
} from '@/features/program/general/lib/participant-audience-selection'
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
import { PROGRAM_REGISTRATION_IDS } from '@/features/template/model/program-registration-draft'
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
import { EducationScheduleChangeTitleAction } from '@/features/program/shared/ui/education-schedule-change-title-action'
import { ProgramRegistrationCurriculumTitleActions } from '@/features/program/shared/ui/program-registration-curriculum-title-actions'
import { GENERAL_PROGRAM_CURRICULUM_MAX_SESSION_COUNT } from '@/features/program/general/lib/curriculum-progress-session-options'
import { PROGRAM_REGISTRATION_SCHEDULE_CURRICULUM_MAX_GROUP_COUNT } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { patchInstitutionApplicationProgramBridge } from '@/features/program/general/lib/institution-application-program-bridge'
import { resolveInstitutionApplicationScheduleMetaForRegistrationWizard } from '@/features/program/general/lib/institution-application-schedule-meta'
import {
  getProgramRegistrationOverlayRecord,
  readGeneralRegistrationOverlayScheduleLines,
  subscribeProgramRegistrationOverlayKeys,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'

function extrasWithParticipant(
  extras: GeneralRegistrationEditorExtras,
  participant: GeneralParticipantRegistrationFlags
): GeneralRegistrationEditorExtras {
  return {
    ...extras,
    participantOrganization: participant.organization,
    participantIndividual: participant.individual,
    participantTeacherInstructor: participant.teacherInstructor,
    participantVolunteer: participant.volunteer,
  }
}

export function GeneralProgramCommonInfoRegistrationEdit({ program }: { program: Program }) {
  const [extras, setExtras] = useState<GeneralRegistrationEditorExtras>(() =>
    extrasFromGeneralProgram(program)
  )
  const [participant, setParticipant] = useState(() =>
    participantFlagsFromGeneralProgram(program)
  )
  const participantTypesKey = useMemo(
    () => (program.generalParticipantTypes ?? []).join(','),
    [program.generalParticipantTypes]
  )
  const educationProgressSyncKey = useMemo(() => {
    const common = program.generalCommonInfo
    const sessionLabels = (common?.curriculumSessions ?? [])
      .map(session => session.sessionLabel)
      .join('|')
    const detailLabels = (common?.scheduleDetails ?? [])
      .map(detail => detail.scheduleLabel)
      .join('|')
    const lines = (common?.educationScheduleLines ?? []).join('|')
    return `${sessionLabels}::${detailLabels}::${lines}::${String(common?.scheduleCurriculumPreEducation)}`
  }, [program.generalCommonInfo])

  useEffect(() => {
    const nextExtras = extrasFromGeneralProgram(program)
    const nextParticipant = participantFlagsFromGeneralProgram(program)
    setExtras(nextExtras)
    setParticipant(nextParticipant)
    seedGeneralRegistrationOverlayFromProgram(program)
    // program 객체 참조가 바뀌어도 참여자 유형이 같으면 수정 중 체크를 덮지 않는다.
  }, [
    program.id,
    program.updatedAt,
    program.generalProgramAudience,
    program.category,
    participantTypesKey,
    educationProgressSyncKey,
  ])

  const commitExtras = (next: GeneralRegistrationEditorExtras) => {
    setExtras(next)
    setGeneralRegistrationDetailEditExtras(next)
  }

  const commitParticipant = (
    next: GeneralParticipantRegistrationFlags,
    extrasPatch?: Partial<GeneralRegistrationEditorExtras>
  ) => {
    setParticipant(next)
    commitExtras(extrasWithParticipant({ ...extras, ...extrasPatch }, next))
  }

  const kpiAvailability = resolveGeneralRegistrationKpiFieldAvailability(participant)

  const hideScheduleSettings =
    extras.programType === 'schedule' && extras.sessionRoundType === 'multi'

  const scheduleCurriculumGroupCount = extras.scheduleCurriculumGroupCount ?? 1

  useEffect(() => {
    if (!participant.organization) return
    const syncBridgeFromOverlay = () => {
      const scheduleMeta = resolveInstitutionApplicationScheduleMetaForRegistrationWizard({
        sessionRound: extras.sessionRoundType,
        curriculumSessionCount: extras.curriculumSessionCount,
        curriculumChartSessionCount: extras.curriculumChartSessionCount,
        overlay: getProgramRegistrationOverlayRecord(),
      })
      patchInstitutionApplicationProgramBridge({
        educationStructure: extras.programType,
        sessionRound: extras.sessionRoundType,
        educationScheduleMode: extras.educationScheduleMode ?? 'date',
        educationScheduleLines: readGeneralRegistrationOverlayScheduleLines(),
        educationRoundCount: scheduleMeta.educationRoundCount,
        sessionsPerRound: scheduleMeta.sessionsPerRound,
        curriculumChartSessionCount: extras.curriculumChartSessionCount,
      })
    }
    syncBridgeFromOverlay()
    return subscribeProgramRegistrationOverlayKeys(
      [
        'generalRegistration.educationScheduleSettings.scheduleLines',
        'generalRegistration.educationCurriculum.progressSessionByRound',
      ],
      syncBridgeFromOverlay
    )
  }, [
    participant.organization,
    extras.programType,
    extras.sessionRoundType,
    extras.educationScheduleMode,
    extras.curriculumSessionCount,
  ])

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
      <ProgramCommonInfoEditSection
        title="기본 정보"
        required
        highlightParagraphId={PROGRAM_REGISTRATION_IDS.basicInfo}
        bodyClassName="program-common-info-edit__section-body--stacked"
      >
        <ProgramCommonInfoEditRegistrationAuditForm program={program} />
        <ProgramRegistrationBasicInfoParagraph
          lockParticipantTypes
          participant={participant}
          onIndividualChange={checked => {
            const nextAudience = applyGeneralParticipantAudienceSelection('individual', checked)
            const extrasPatch = shouldResetParticipationScheduleDetailForAudience(nextAudience)
              ? { participationScheduleDetail: 'common' as const }
              : undefined
            commitParticipant({ ...participant, ...nextAudience }, extrasPatch)
          }}
          onOrganizationChange={checked => {
            const nextAudience = applyGeneralParticipantAudienceSelection('organization', checked)
            const extrasPatch = shouldResetParticipationScheduleDetailForAudience(nextAudience)
              ? { participationScheduleDetail: 'common' as const }
              : undefined
            commitParticipant({ ...participant, ...nextAudience }, extrasPatch)
          }}
          onTeacherInstructorChange={checked =>
            commitParticipant({ ...participant, teacherInstructor: checked })
          }
          onVolunteerChange={checked =>
            commitParticipant({ ...participant, volunteer: checked })
          }
          programType={extras.programType}
        />
      </ProgramCommonInfoEditSection>
      <ProgramCommonInfoEditSection
        title="사업 KPI 목표"
        required
        highlightParagraphId={PROGRAM_REGISTRATION_IDS.businessKpi}
      >
        <ProgramRegistrationBusinessKpiParagraph
          instructorDisabled={kpiAvailability.instructorDisabled}
          instructorPlaceholder={
            kpiAvailability.instructorDisabled ? '해당 없음' : '목표값 입력'
          }
          volunteerDisabled={kpiAvailability.volunteerDisabled}
          volunteerPlaceholder={kpiAvailability.volunteerDisabled ? '해당 없음' : '목표값 입력'}
          dispatchedSchoolDisabled={kpiAvailability.dispatchedSchoolDisabled}
          dispatchedSchoolPlaceholder={
            kpiAvailability.dispatchedSchoolDisabled ? '해당 없음' : '목표값 입력'
          }
          dispatchedClassDisabled={kpiAvailability.dispatchedClassDisabled}
          dispatchedClassPlaceholder={
            kpiAvailability.dispatchedClassDisabled ? '해당 없음' : '목표값 입력'
          }
        />
      </ProgramCommonInfoEditSection>
      <ProgramCommonInfoEditSection
        title={PROGRAM_REGISTRATION_GENERAL_SECTION_META.wageInfo.title}
        description={PROGRAM_REGISTRATION_GENERAL_SECTION_META.wageInfo.editDescription}
        required
        highlightParagraphId={PROGRAM_REGISTRATION_IDS.wageInfo}
      >
        <ProgramRegistrationWageInfoParagraph />
      </ProgramCommonInfoEditSection>
      <ProgramCommonInfoEditSection
        title={PROGRAM_REGISTRATION_GENERAL_SECTION_META.typeSettings.title}
        description={PROGRAM_REGISTRATION_GENERAL_SECTION_META.typeSettings.editDescription}
        required
        highlightParagraphId={PROGRAM_REGISTRATION_IDS.typeSettings}
        bodyClassName="program-common-info-edit__section-body--stacked"
      >
        <ProgramRegistrationTypeSettingsParagraph
          programType={extras.programType}
          onProgramTypeChange={value => commitExtras({ ...extras, programType: value })}
          participantOrganization={participant.organization}
          sessionRoundType={extras.sessionRoundType}
          onSessionRoundTypeChange={value => {
            const nextCount = Math.max(
              extras.curriculumSessionCount ?? 1,
              extras.curriculumChartSessionCount ?? 1
            )
            commitExtras({
              ...extras,
              sessionRoundType: value,
              curriculumSessionCount: nextCount,
              curriculumChartSessionCount: nextCount,
            })
          }}
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
        highlightParagraphId={PROGRAM_REGISTRATION_IDS.educationCurriculum}
        bodyClassName={
          isScheduleStructure ? 'program-common-info-edit__section-body--stacked' : undefined
        }
        titleTrailing={
          <ProgramRegistrationCurriculumTitleActions
            programType={extras.programType}
            sessionRoundType={extras.sessionRoundType}
            participantOrganization={participant.organization}
            educationFormScheduleDetail={extras.educationFormScheduleDetail ?? 'common'}
            participationScheduleDetail={extras.participationScheduleDetail ?? 'common'}
            ipsScheduleDetail={extras.ipsScheduleDetail ?? 'common'}
            educationScheduleMode={extras.educationScheduleMode ?? 'date'}
            scheduleCurriculumPreEducation={extras.scheduleCurriculumPreEducation === true}
            onScheduleCurriculumPreEducationChange={checked =>
              commitExtras({ ...extras, scheduleCurriculumPreEducation: checked })
            }
            curriculumChartSessionCount={extras.curriculumChartSessionCount ?? 1}
            onAddCurriculumSession={() =>
              commitExtras({
                ...extras,
                curriculumSessionCount: (extras.curriculumSessionCount ?? 1) + 1,
              })
            }
            onAddCurriculumChartSession={() =>
              commitExtras({
                ...extras,
                curriculumChartSessionCount: Math.min(
                  GENERAL_PROGRAM_CURRICULUM_MAX_SESSION_COUNT,
                  (extras.curriculumChartSessionCount ?? 1) + 1
                ),
              })
            }
            onAddScheduleCurriculumDetail={() =>
              commitExtras({
                ...extras,
                scheduleCurriculumDetailCount: (extras.scheduleCurriculumDetailCount ?? 1) + 1,
              })
            }
            onAddScheduleCurriculumGroup={() =>
              commitExtras({
                ...extras,
                scheduleCurriculumGroupCount: Math.min(
                  PROGRAM_REGISTRATION_SCHEDULE_CURRICULUM_MAX_GROUP_COUNT,
                  (extras.scheduleCurriculumGroupCount ?? 1) + 1
                ),
              })
            }
            scheduleCurriculumGroupCount={scheduleCurriculumGroupCount}
          />
        }
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
            scheduleGroupCount={scheduleCurriculumGroupCount}
            onDeleteScheduleCurriculumGroup={() =>
              commitExtras({
                ...extras,
                scheduleCurriculumGroupCount: Math.max(
                  1,
                  (extras.scheduleCurriculumGroupCount ?? 1) - 1
                ),
              })
            }
            ipsPerSchedule={extras.ipsScheduleDetail === 'perSchedule'}
            sessionRoundType={extras.sessionRoundType}
            participantIndividual={participant.individual}
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
            participantIndividual={participant.individual}
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
          highlightParagraphId={PROGRAM_REGISTRATION_IDS.educationScheduleSettings}
          titleTrailing={
            <EducationScheduleChangeTitleAction
              programId={program.id}
              overlayKeyPrefix="generalRegistration.educationScheduleSettings"
              educationScheduleMode={extras.educationScheduleMode ?? 'date'}
              autoFillFromScheduleGroupTimes={
                extras.programType === 'schedule' &&
                extras.sessionRoundType === 'single' &&
                !participant.organization
              }
              lockCalendarTogglesToScheduleMode={shouldLockEducationScheduleCalendarToggles({
                participantOrganization: participant.organization,
                educationStructure: extras.programType,
              })}
              operationStart={program.startDate}
              operationEnd={program.endDate}
            />
        }
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
        />
        </ProgramCommonInfoEditSection>
      )}
    </ProgramCommonInfoEditSections>
  )
}
