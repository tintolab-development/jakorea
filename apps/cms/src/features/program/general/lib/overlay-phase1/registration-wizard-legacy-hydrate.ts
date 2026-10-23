/**
 * 구버전 overlay + editorState draft → RHF UI 값. 최초 hydrate 1회용.
 */
import type { ProgramRegistrationEditorState } from '@/features/template/lib/program-registration-editor-state'
import { overlayKvToCommonInfoFormValues } from './overlay-kv-to-common-info-form-values'
import { isFieldPresent } from './common-info-form-values'
import {
  REGISTRATION_WIZARD_FOOTER_IPS_KEY,
  REGISTRATION_WIZARD_OPERATION_ANCHOR_KEY,
  REGISTRATION_WIZARD_PERIOD_DATE_ISO_KEY,
  REGISTRATION_WIZARD_SINGLE_DATE_ISO_KEY,
} from './registration-wizard-overlay-path-map'
import {
  createDefaultRegistrationWizardUiValues,
  REGISTRATION_WIZARD_RHF_SETTINGS_KEY,
  type RegistrationWizardUiValues,
} from './registration-wizard-ui-values'
import { overlayKvToRecruitmentFormValues } from './overlay-kv-to-recruitment-form-values'
import { pickRecruitOwnedOverlay, writeRecruitmentKvPartial } from './registration-wizard-recruitment-rhf'
import {
  canonicalizeWizardApplicationKv,
  pickApplicationOwnedOverlay,
} from './registration-wizard-application-rhf'
import type { CommonInfoIpsValue } from './common-info-form-values'

function isPresentTextField(field: unknown): field is { present: true; value: unknown } {
  return (
    field != null &&
    typeof field === 'object' &&
    'present' in field &&
    (field as { present: unknown }).present === true &&
    'value' in field
  )
}

function readPresentText(field: unknown, fallback: string): string {
  if (!isPresentTextField(field)) return fallback
  return typeof field.value === 'string' ? field.value : fallback
}

export function parseRegistrationWizardRhfSettings(
  settingsJson: Record<string, unknown> | undefined
): RegistrationWizardUiValues | null {
  const raw = settingsJson?.[REGISTRATION_WIZARD_RHF_SETTINGS_KEY]
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null
  const candidate = raw as RegistrationWizardUiValues
  if (candidate.extras == null || typeof candidate.extras !== 'object') return null
  const defaults = createDefaultRegistrationWizardUiValues()
  return {
    ...defaults,
    ...candidate,
    curriculum: {
      ...defaults.curriculum,
      ...candidate.curriculum,
    },
    schedule: {
      ...defaults.schedule,
      ...candidate.schedule,
    },
    extras: {
      ...defaults.extras,
      ...candidate.extras,
      participant: {
        ...defaults.extras.participant,
        ...candidate.extras.participant,
      },
    },
    recruitment: {
      ...defaults.recruitment,
      ...candidate.recruitment,
    },
    recruitmentKv: {
      ...defaults.recruitmentKv,
      ...(candidate.recruitmentKv ?? {}),
    },
    applicationKv: canonicalizeWizardApplicationKv(
      {
        ...defaults.applicationKv,
        ...(candidate.applicationKv ?? {}),
      },
      {
        ...defaults.extras.participant,
        ...candidate.extras.participant,
      }
    ),
  }
}

export function hydrateRegistrationWizardUiValuesFromLegacy(args: {
  overlay: Record<string, unknown>
  editorState?: ProgramRegistrationEditorState
}): RegistrationWizardUiValues {
  const defaults = createDefaultRegistrationWizardUiValues()
  const formValues = overlayKvToCommonInfoFormValues(args.overlay)
  const extras = args.editorState
  const overlay = args.overlay

  const operationAnchor = overlay[REGISTRATION_WIZARD_OPERATION_ANCHOR_KEY]
  const singleDateIso = overlay[REGISTRATION_WIZARD_SINGLE_DATE_ISO_KEY]
  const periodDateIso = overlay[REGISTRATION_WIZARD_PERIOD_DATE_ISO_KEY]
  const footerIps = overlay[REGISTRATION_WIZARD_FOOTER_IPS_KEY]

  return {
    ...defaults,
    programTitleKo: extras?.programTitleKo?.trim()
      ? extras.programTitleKo
      : readPresentText(formValues.programTitleKo, defaults.programTitleKo),
    programTitleEn: readPresentText(formValues.programTitleEn, defaults.programTitleEn),
    publicProgramTitle: readPresentText(formValues.publicProgramTitle, defaults.publicProgramTitle),
    detailedProgramId: readPresentText(formValues.detailedProgramId, defaults.detailedProgramId),
    detailedProgramName: readPresentText(
      formValues.detailedProgramName,
      defaults.detailedProgramName
    ),
    businessField: readPresentText(formValues.businessField, defaults.businessField),
    partnerInvolvement: readPresentText(formValues.partnerInvolvement, defaults.partnerInvolvement),
    educationVenueKind: readPresentText(formValues.educationVenueKind, defaults.educationVenueKind),
    educationVenueDetail: readPresentText(
      formValues.educationVenueDetail,
      defaults.educationVenueDetail
    ),
    educationCourse: readPresentText(formValues.educationCourse, defaults.educationCourse),
    ipOwned: readPresentText(formValues.ipOwned, defaults.ipOwned),
    courseDeliveredBy: readPresentText(formValues.courseDeliveredBy, defaults.courseDeliveredBy),
    operationRangeSeal: isFieldPresent(formValues.operationRangeSeal)
      ? formValues.operationRangeSeal.value
      : defaults.operationRangeSeal,
    operationAnchorIso: typeof operationAnchor === 'string' ? operationAnchor : defaults.operationAnchorIso,
    surveyItems: isFieldPresent(formValues.surveyItems)
      ? formValues.surveyItems.value
      : defaults.surveyItems,
    sponsorIds: isFieldPresent(formValues.sponsorIds)
      ? formValues.sponsorIds.value
      : extras?.sponsorId
        ? [extras.sponsorId]
        : defaults.sponsorIds,
    sponsorId:
      extras?.sponsorId?.trim() ||
      readPresentText(formValues.sponsorId, defaults.sponsorId),
    managerContactIds: isFieldPresent(formValues.managerContactIds)
      ? formValues.managerContactIds.value
      : extras?.sponsorContactId
        ? [extras.sponsorContactId]
        : defaults.managerContactIds,
    managerContactId:
      extras?.sponsorContactId?.trim() ||
      readPresentText(formValues.managerContactId, defaults.managerContactId),
    sponsorManagerLine: readPresentText(formValues.sponsorManagerLine, defaults.sponsorManagerLine),
    kpiParticipantCount: isFieldPresent(formValues.kpiParticipantCount)
      ? formValues.kpiParticipantCount.value
      : defaults.kpiParticipantCount,
    kpiInstructor: isFieldPresent(formValues.kpiInstructor)
      ? formValues.kpiInstructor.value
      : defaults.kpiInstructor,
    kpiVolunteer: isFieldPresent(formValues.kpiVolunteer)
      ? formValues.kpiVolunteer.value
      : defaults.kpiVolunteer,
    kpiDispatchedSchool: isFieldPresent(formValues.kpiDispatchedSchool)
      ? formValues.kpiDispatchedSchool.value
      : defaults.kpiDispatchedSchool,
    kpiDispatchedClass: isFieldPresent(formValues.kpiDispatchedClass)
      ? formValues.kpiDispatchedClass.value
      : defaults.kpiDispatchedClass,
    wageGrade1Fee: isFieldPresent(formValues.wageGrade1Fee)
      ? formValues.wageGrade1Fee.value
      : defaults.wageGrade1Fee,
    wageGrade2Fee: isFieldPresent(formValues.wageGrade2Fee)
      ? formValues.wageGrade2Fee.value
      : defaults.wageGrade2Fee,
    wageGrade3Fee: isFieldPresent(formValues.wageGrade3Fee)
      ? formValues.wageGrade3Fee.value
      : defaults.wageGrade3Fee,
    paymentItemValues: isFieldPresent(formValues.paymentItemValues)
      ? formValues.paymentItemValues.value
      : defaults.paymentItemValues,
    paymentItemLabels: readPresentText(formValues.paymentItemLabels, defaults.paymentItemLabels),
    singleEducationForm: readPresentText(
      formValues.singleEducationForm,
      defaults.singleEducationForm
    ),
    multiCommonEducationForm: readPresentText(
      formValues.multiCommonEducationForm,
      defaults.multiCommonEducationForm
    ),
    legacyEducationForm: readPresentText(
      formValues.legacyEducationForm,
      defaults.legacyEducationForm
    ),
    singleParticipation: readPresentText(
      formValues.singleParticipation,
      defaults.singleParticipation
    ),
    multiCommonParticipation: readPresentText(
      formValues.multiCommonParticipation,
      defaults.multiCommonParticipation
    ),
    ipsType: isFieldPresent(formValues.ipsType) ? formValues.ipsType.value : defaults.ipsType,
    scheduleLines: isFieldPresent(formValues.scheduleLines)
      ? formValues.scheduleLines.value
      : defaults.scheduleLines,
    singleDateIso: typeof singleDateIso === 'string' ? singleDateIso : defaults.singleDateIso,
    periodDateIso: typeof periodDateIso === 'string' ? periodDateIso : defaults.periodDateIso,
    footerIpsType:
      footerIps != null && typeof footerIps === 'object' && !Array.isArray(footerIps)
        ? (footerIps as CommonInfoIpsValue)
        : defaults.footerIpsType,
    curriculum: formValues.curriculum,
    schedule: formValues.schedule,
    extras: {
      ...defaults.extras,
      programType: extras?.programType ?? defaults.extras.programType,
      sessionRoundType: extras?.sessionRoundType ?? defaults.extras.sessionRoundType,
      educationScheduleMode: extras?.educationScheduleMode ?? defaults.extras.educationScheduleMode,
      educationFormScheduleDetail:
        extras?.educationFormScheduleDetail ?? defaults.extras.educationFormScheduleDetail,
      participationScheduleDetail:
        extras?.participationScheduleDetail ?? defaults.extras.participationScheduleDetail,
      ipsScheduleDetail: extras?.ipsScheduleDetail ?? defaults.extras.ipsScheduleDetail,
      curriculumSessionCount:
        extras?.curriculumSessionCount ?? defaults.extras.curriculumSessionCount,
      curriculumChartSessionCount:
        extras?.curriculumChartSessionCount ?? defaults.extras.curriculumChartSessionCount,
      scheduleCurriculumDetailCount:
        extras?.scheduleCurriculumDetailCount ?? defaults.extras.scheduleCurriculumDetailCount,
      scheduleCurriculumGroupCount:
        extras?.scheduleCurriculumGroupCount ?? defaults.extras.scheduleCurriculumGroupCount,
      scheduleCurriculumPreEducation:
        extras?.scheduleCurriculumPreEducation ?? defaults.extras.scheduleCurriculumPreEducation,
      participant: extras?.participant ?? defaults.extras.participant,
    },
    recruitment: overlayKvToRecruitmentFormValues(overlay),
    recruitmentKv: pickRecruitOwnedOverlay(overlay),
    applicationKv: canonicalizeWizardApplicationKv(
      pickApplicationOwnedOverlay(overlay),
      extras?.participant ?? defaults.extras.participant
    ),
  }
}

export function hydrateRegistrationWizardUiValues(args: {
  overlay: Record<string, unknown>
  editorState?: ProgramRegistrationEditorState
  settingsJson?: Record<string, unknown>
}): RegistrationWizardUiValues {
  const fromSettings = parseRegistrationWizardRhfSettings(args.settingsJson)
  if (fromSettings) {
    const hasRecruitmentKv = Object.keys(fromSettings.recruitmentKv).length > 0
    const hasApplicationKv = Object.keys(fromSettings.applicationKv).length > 0
    if (hasRecruitmentKv && hasApplicationKv) return fromSettings
    const withRecruit = hasRecruitmentKv
      ? fromSettings
      : writeRecruitmentKvPartial(fromSettings, pickRecruitOwnedOverlay(args.overlay))
    const applicationKv = hasApplicationKv
      ? withRecruit.applicationKv
      : canonicalizeWizardApplicationKv(
          pickApplicationOwnedOverlay(args.overlay),
          withRecruit.extras.participant
        )
    return {
      ...withRecruit,
      recruitment: overlayKvToRecruitmentFormValues(withRecruit.recruitmentKv),
      applicationKv,
    }
  }
  return hydrateRegistrationWizardUiValuesFromLegacy({
    overlay: args.overlay,
    editorState: args.editorState,
  })
}
