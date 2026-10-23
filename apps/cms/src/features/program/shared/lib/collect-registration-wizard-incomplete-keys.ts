import type { ProgramRegistrationFormVariant } from '@/features/template/model/program-registration-draft'
import type { ProgramRegistrationParticipantSelection } from '@/features/template/lib/program-registration-editor-state'
import type {
  ProgramRegistrationEducationScheduleMode,
  ProgramRegistrationSessionRoundType,
  ProgramRegistrationType,
} from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import type { Program } from '@/types/domain'
import { listIncompleteGeneralProgramRegistrationRequiredFields } from '@/features/program/general/lib/registration-required-fields'
import { listIncompleteGeneralProgramRecruitmentRequiredFields } from '@/features/program/general/lib/registration-recruitment-required-fields'
import {
  listIncompleteEconomyProgramRegistrationRequiredFields,
  listIncompleteEconomyProgramRecruitmentRequiredFields,
} from '@/features/program/general/lib/economy-program-registration-required-fields'
import { listIncompleteTrainedTeachersProgramRegistrationRequiredFieldReasons } from '@/features/program/trained-teachers/lib/trained-teachers-program-registration-required-fields'
import { peekTrainedTeachersRegistrationRhf } from '@/features/program/trained-teachers/lib/registration-rhf-api'
import { listIncompleteTrainedTeachersRecruitmentRequiredFields } from '@/features/program/trained-teachers/lib/trained-teachers-recruitment-required-fields'
import type { TrainedTeachersRegistrationRequiredFieldContext } from '@/features/program/trained-teachers/lib/trained-teachers-program-registration-required-fields'
import {
  listIncompleteUjatProgramRegistrationRequiredFields,
  listIncompleteUjatProgramRecruitmentRequiredFields,
} from '@/features/program/ujat/lib/ujat-program-registration-required-fields'
import { listIncompleteApplicationFormThirdPartyRecipientFieldKeys } from '@/features/program/general/lib/application-form-third-party-recipient-required'
import type { ApplicationFormDraftSnapshot } from '@/features/program/general/lib/application-form-third-party-recipient-required'
import { getProgramRegistrationOverlayRecord } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'

export type CollectRegistrationWizardProgramIncompleteContext = {
  variant: ProgramRegistrationFormVariant
  overlay: Record<string, unknown>
  participant: ProgramRegistrationParticipantSelection
  programType: ProgramRegistrationType
  sessionRoundType: ProgramRegistrationSessionRoundType
  educationScheduleMode: ProgramRegistrationEducationScheduleMode
  volunteerExceptionScheduleCount: number
  trainedTeachersCtx?: TrainedTeachersRegistrationRequiredFieldContext
}

export function collectRegistrationWizardProgramPhaseIncompleteKeys(
  ctx: CollectRegistrationWizardProgramIncompleteContext
): string[] {
  if (ctx.variant === 'economy') {
    return listIncompleteEconomyProgramRegistrationRequiredFields(ctx.overlay, ctx.participant)
  }
  if (ctx.variant === 'trainedTeachers' && ctx.trainedTeachersCtx != null) {
    return listIncompleteTrainedTeachersProgramRegistrationRequiredFieldReasons(
      ctx.overlay,
      ctx.trainedTeachersCtx
    )
  }
  if (ctx.variant === 'general') {
    return listIncompleteGeneralProgramRegistrationRequiredFields(ctx.overlay, {
      participant: ctx.participant,
      programType: ctx.programType,
      sessionRoundType: ctx.sessionRoundType,
      educationFormScheduleDetail: 'common',
      participationScheduleDetail: 'common',
      ipsScheduleDetail: 'common',
      curriculumSessionCount: 1,
      curriculumChartSessionCount: 1,
      scheduleCurriculumDetailCount: 1,
      scheduleCurriculumGroupCount: 1,
      scheduleCurriculumPreEducation: false,
      educationScheduleMode: ctx.educationScheduleMode,
      sponsorId: '',
      sponsorContactId: '',
      programTitleKo: '',
    })
  }
  return []
}

export function collectRegistrationWizardRecruitmentPhaseIncompleteKeys(args: {
  variant: ProgramRegistrationFormVariant
  participant: ProgramRegistrationParticipantSelection
  programType: ProgramRegistrationType
  sessionRoundType: ProgramRegistrationSessionRoundType
  educationScheduleMode: ProgramRegistrationEducationScheduleMode
  volunteerExceptionScheduleCount: number
}): string[] {
  if (args.variant === 'economy') {
    return listIncompleteEconomyProgramRecruitmentRequiredFields(args.participant)
  }
  if (args.variant === 'trainedTeachers') {
    const rhf = peekTrainedTeachersRegistrationRhf()
    return rhf != null ? listIncompleteTrainedTeachersRecruitmentRequiredFields(rhf.getValues()) : []
  }
  return listIncompleteGeneralProgramRecruitmentRequiredFields({
    participant: args.participant,
    programType: args.programType,
    sessionRoundType: args.sessionRoundType,
    educationScheduleMode: args.educationScheduleMode,
    volunteerExceptionScheduleCount: args.volunteerExceptionScheduleCount,
    registrationProgramType: 'GENERAL',
  })
}

export function collectRegistrationWizardUjatProgramPhaseIncompleteKeys(): string[] {
  return listIncompleteUjatProgramRegistrationRequiredFields()
}

export function collectRegistrationWizardUjatRecruitmentPhaseIncompleteKeys(): string[] {
  return listIncompleteUjatProgramRecruitmentRequiredFields()
}

export function collectRegistrationWizardApplicationPhaseIncompleteKeys(args: {
  program: Program
  current?: ApplicationFormDraftSnapshot
}): string[] {
  return listIncompleteApplicationFormThirdPartyRecipientFieldKeys(args)
}

/** 일반 위저드 — 현재 overlay 스냅샷 (프로그램 단계) */
export function readGeneralRegistrationOverlaySnapshot(): Record<string, unknown> {
  return getProgramRegistrationOverlayRecord()
}
