/** @vitest-environment jsdom */
import { afterEach, describe, expect, it } from 'vitest'
import dayjs from 'dayjs'
import type { Program } from '@/types/domain'
import {
  buildGeneralProgramListRowFromRegistrationSnapshot,
  registrationPendingSnapshotId,
} from '@/features/program/general/lib/registration-local-save'
import { mapGeneralProgramToCreateRequest } from '@/features/program/general/api/adapters/general-program-adapters'
import {
  GENERAL_REGISTRATION_DEV_AUTOFILL_CASE_IDS,
  resolveGeneralRegistrationDevAutofillPreset,
} from '@/features/program/general/lib/registration-dev-autofill-cases'
import { hasIncompleteApplicationFormThirdPartyRecipientForProgram } from '@/features/program/general/lib/application-form-third-party-recipient-required'
import {
  hasIncompleteGeneralProgramRecruitmentRequiredFields,
  type GeneralProgramRecruitmentRequiredFieldContext,
} from '@/features/program/general/lib/registration-recruitment-required-fields'
import {
  describeIncompleteGeneralProgramRegistrationRequiredFields,
  hasIncompleteGeneralProgramRegistrationRequiredFields,
  type GeneralProgramRegistrationRequiredFieldContext,
} from '@/features/program/general/lib/registration-required-fields'
import {
  previewGeneralRegistrationDevAutofillForCase,
} from '@/features/program/shared/lib/apply-dev-program-registration-autofill'
import { TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE } from '@/features/template/lib/template-form-select-options'
import {
  GENERAL_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_IDS_KEY,
  GENERAL_REGISTRATION_OVERLAY_SPONSOR_IDS_KEY,
  getProgramRegistrationOverlayRecord,
  resetProgramRegistrationOverlay,
} from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { APPLICANT_RECRUIT_INSTITUTION_OVERLAY_KEYS as RK } from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-keys'
import {
  peekApplicantRecruitInstitutionOverlayRecord,
  resetApplicantRecruitInstitutionOverlayStoreForTests,
} from '@/features/template/ui/form-set/recruit-form/institution/applicant-recruit-institution-overlay-sync'
import {
  peekGeneralRecruitOverlayRecord,
  resetGeneralRecruitOverlayStoreForTests,
} from '@/features/template/ui/form-set/recruit-form/shared/general-recruit-overlay-sync'
import { listDevAutofillRecruitOverlayTargets } from '@/features/program/shared/lib/dev-autofill-recruit-overlay'
import { clearRegistrationWizardSessionDrafts } from '@/features/program/general/lib/registration-wizard-session-drafts'

const RESOLVED_CURRICULUM = {
  sponsorId: 'sponsor-dev-1',
  contactId: 'sponsor-dev-1::contact-1',
  detailedProgramId: '163001',
  detailedProgramName: '테스트 세부 프로그램',
  paymentItemValues: ['instructor_fee'],
  paymentItemLabels: '강사비',
}

const RESOLVED_SCHEDULE = {
  ...RESOLVED_CURRICULUM,
  detailedProgramId: TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE,
  detailedProgramName: '해당없음',
}

afterEach(() => {
  resetProgramRegistrationOverlay()
  resetApplicantRecruitInstitutionOverlayStoreForTests()
  resetGeneralRecruitOverlayStoreForTests()
  clearRegistrationWizardSessionDrafts()
})

function registrationCtx(
  preview: ReturnType<typeof previewGeneralRegistrationDevAutofillForCase>
): GeneralProgramRegistrationRequiredFieldContext {
  const { layout, typeSettings, participantFlags, programTitleKo } = preview
  return {
    participant: participantFlags,
    programType: typeSettings.programType,
    sessionRoundType: typeSettings.sessionRoundType,
    educationFormScheduleDetail: typeSettings.educationFormScheduleDetail,
    participationScheduleDetail: typeSettings.participationScheduleDetail,
    ipsScheduleDetail: typeSettings.ipsScheduleDetail,
    curriculumSessionCount: layout.curriculumSessionCount,
    curriculumChartSessionCount: layout.curriculumChartSessionCount,
    scheduleCurriculumDetailCount: layout.scheduleCurriculumDetailCount,
    scheduleCurriculumGroupCount: layout.scheduleCurriculumGroupCount,
    scheduleCurriculumPreEducation: false,
    educationScheduleMode: typeSettings.educationScheduleMode,
    sponsorId: RESOLVED_CURRICULUM.sponsorId,
    sponsorContactId: RESOLVED_CURRICULUM.contactId,
    programTitleKo,
  }
}

function recruitmentCtx(
  preview: ReturnType<typeof previewGeneralRegistrationDevAutofillForCase>
): GeneralProgramRecruitmentRequiredFieldContext {
  const { typeSettings, participantFlags } = preview
  return {
    participant: participantFlags,
    programType: typeSettings.programType,
    sessionRoundType: typeSettings.sessionRoundType,
    educationScheduleMode: typeSettings.educationScheduleMode,
    volunteerExceptionScheduleCount: 0,
  }
}

function resolvedForPreset(preset: ReturnType<typeof resolveGeneralRegistrationDevAutofillPreset>) {
  return preset.typeSettings.programType === 'schedule' ? RESOLVED_SCHEDULE : RESOLVED_CURRICULUM
}

function buildCreateProgramFromDevAutofillCase(
  caseId: (typeof GENERAL_REGISTRATION_DEV_AUTOFILL_CASE_IDS)[number]
) {
  const preset = resolveGeneralRegistrationDevAutofillPreset(caseId)
  const resolved = resolvedForPreset(preset)
  const preview = previewGeneralRegistrationDevAutofillForCase(caseId, resolved)
  const { layout, typeSettings, participantFlags } = preview
  const program = buildGeneralProgramListRowFromRegistrationSnapshot({
    id: registrationPendingSnapshotId('general'),
    participant: participantFlags,
    programType: typeSettings.programType,
    variant: 'general',
    title: preview.programTitleKo,
    sponsorId: resolved.sponsorId,
    sessionRoundType: typeSettings.sessionRoundType,
    educationScheduleMode: typeSettings.educationScheduleMode,
    scheduleCurriculumDetailCount: layout.scheduleCurriculumDetailCount,
    editorExtras: {
      educationFormScheduleDetail: typeSettings.educationFormScheduleDetail,
      participationScheduleDetail: typeSettings.participationScheduleDetail,
      ipsScheduleDetail: typeSettings.ipsScheduleDetail,
      curriculumSessionCount: layout.curriculumSessionCount,
      curriculumChartSessionCount: layout.curriculumChartSessionCount,
      scheduleCurriculumGroupCount: layout.scheduleCurriculumGroupCount,
      participantOrganization: participantFlags.organization,
      participantIndividual: participantFlags.individual,
      participantTeacherInstructor: false,
      participantVolunteer: false,
    },
  })
  return { preset, preview, program, create: mapGeneralProgramToCreateRequest(program) }
}

function programForPreview(
  preview: ReturnType<typeof previewGeneralRegistrationDevAutofillForCase>
): Program {
  const types = preview.participantFlags.organization
    ? ['school_institution' as const]
    : ['individual' as const]
  return {
    id: registrationPendingSnapshotId('general'),
    generalParticipantTypes: [...types],
  } as Program
}

describe('previewGeneralRegistrationDevAutofillForCase', () => {
  for (const caseId of GENERAL_REGISTRATION_DEV_AUTOFILL_CASE_IDS) {
    it(`케이스 ${caseId} — 공통·모집·신청(제3자) 필수를 채운다`, () => {
      const preset = resolveGeneralRegistrationDevAutofillPreset(caseId)
      const preview = previewGeneralRegistrationDevAutofillForCase(
        caseId,
        resolvedForPreset(preset)
      )
      const overlay = getProgramRegistrationOverlayRecord()

      expect(overlay[GENERAL_REGISTRATION_OVERLAY_PROGRAM_TITLE_KO_KEY]).toBe(
        preset.programTitleKo
      )
      expect(overlay['generalRegistration.basicInfo.publicProgramTitle']).toBe(
        preset.publicProgramTitle
      )
      expect(overlay[GENERAL_REGISTRATION_OVERLAY_SPONSOR_IDS_KEY]).toEqual([
        RESOLVED_CURRICULUM.sponsorId,
      ])
      expect(overlay[GENERAL_REGISTRATION_OVERLAY_SPONSOR_CONTACT_IDS_KEY]).toEqual([
        RESOLVED_CURRICULUM.contactId,
      ])
      expect(overlay['generalRegistration.basicInfo.detailedProgramId']).toBe(
        preset.typeSettings.programType === 'schedule'
          ? TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE
          : RESOLVED_CURRICULUM.detailedProgramId
      )
      expect(overlay['generalRegistration.basicInfo.detailedProgramName']).toBe(
        preset.typeSettings.programType === 'schedule'
          ? '해당없음'
          : RESOLVED_CURRICULUM.detailedProgramName
      )
      expect(
        describeIncompleteGeneralProgramRegistrationRequiredFields(
          overlay,
          registrationCtx(preview)
        )
      ).toBeNull()
      expect(
        hasIncompleteGeneralProgramRegistrationRequiredFields(overlay, registrationCtx(preview))
      ).toBe(false)
      expect(hasIncompleteGeneralProgramRecruitmentRequiredFields(recruitmentCtx(preview))).toBe(
        false
      )
      expect(
        hasIncompleteApplicationFormThirdPartyRecipientForProgram({
          program: programForPreview(preview),
        })
      ).toBe(false)
    })
  }

  it('모집·프로그램 기간은 사업(오픈) 기간 안에 둔다', () => {
    const caseId = GENERAL_REGISTRATION_DEV_AUTOFILL_CASE_IDS[0]!
    const preset = resolveGeneralRegistrationDevAutofillPreset(caseId)
    previewGeneralRegistrationDevAutofillForCase(caseId, resolvedForPreset(preset))
    const overlay = getProgramRegistrationOverlayRecord()
    const targets = listDevAutofillRecruitOverlayTargets('general', preset.participantFlags)
    const institutionCode = targets.institutionRecruit[0]
    const generalCode = targets.generalRecruit[0]
    const recruit =
      institutionCode != null
        ? peekApplicantRecruitInstitutionOverlayRecord(institutionCode)
        : generalCode != null
          ? peekGeneralRecruitOverlayRecord(generalCode)
          : {}
    const business = overlay['generalRegistration.basicInfo.operationRangeSeal'] as {
      start?: string
      end?: string
    }
    const program = (recruit[RK.programRangeSeal] ??
      recruit['recruit.individual.programRangeSeal']) as { start?: string; end?: string }
    const recruitRange = (recruit[RK.recruitRangeSeal] ??
      recruit['recruit.individual.recruitRangeSeal']) as { start?: string; end?: string }
    const bizStart = dayjs(business.start)
    const bizEnd = dayjs(business.end)
    const inside = (start?: string, end?: string) => {
      expect(start).toBeTruthy()
      expect(end).toBeTruthy()
      expect(!dayjs(start).isBefore(bizStart, 'day')).toBe(true)
      expect(!dayjs(end).isAfter(bizEnd, 'day')).toBe(true)
    }
    inside(business.start, business.end)
    inside(program.start, program.end)
    inside(recruitRange.start, recruitRange.end)
  })
})

describe('DEV 자동입력 → 등록 POST 스냅샷', () => {
  for (const caseId of GENERAL_REGISTRATION_DEV_AUTOFILL_CASE_IDS) {
    it(`케이스 ${caseId} — Program·CreateRequest에 대표·공고용명·핵심 필드가 누락되지 않는다`, () => {
      const { preset, program, create } = buildCreateProgramFromDevAutofillCase(caseId)

      expect(program.title).toBe(preset.programTitleKo)
      expect(program.mainTitle).toBe(preset.programTitleKo)
      expect(program.generalCommonInfo?.announcementTitle).toBe(preset.publicProgramTitle)
      expect(create.title).toBe(preset.programTitleKo)
      expect(create.mainTitle).toBe(preset.programTitleKo)
      expect(create.sponsorId).toBeTruthy()
      expect(create.businessStartDate).toBeTruthy()
      expect(create.businessEndDate).toBeTruthy()
      expect(create.programType).toBe(
        preset.participantFlags.organization ? 'GENERAL_ORGANIZATION' : 'GENERAL_INDIVIDUAL'
      )

      if (preset.typeSettings.programType === 'curriculum') {
        expect(program.generalCommonInfo?.curriculumSessions?.length ?? 0).toBeGreaterThan(0)
      } else {
        expect(program.generalCommonInfo?.scheduleDetails?.length ?? 0).toBeGreaterThanOrEqual(
          preset.layout.scheduleCurriculumDetailCount
        )
      }

      if (
        preset.typeSettings.programType === 'schedule' &&
        preset.typeSettings.sessionRoundType === 'multi'
      ) {
        const overlay = getProgramRegistrationOverlayRecord()
        const dates = overlay['generalRegistration.educationScheduleCurriculum.scheduleDateByDetailIso']
        expect(dates).toBeTruthy()
        expect(typeof dates).toBe('object')
        const dateKeys = Object.keys(dates as Record<string, unknown>)
        expect(dateKeys.length).toBeGreaterThanOrEqual(preset.layout.scheduleCurriculumDetailCount)
      }

      expect(create.serviceDetailJson).toBeTruthy()
      const detail = JSON.parse(create.serviceDetailJson ?? '{}') as {
        generalCommonInfo?: { announcementTitle?: string }
      }
      expect(detail.generalCommonInfo?.announcementTitle).toBe(preset.publicProgramTitle)
    })
  }
})
