/**
 * 위저드 UI 값 → Independent CommonInfoFormValues. 유일한 제품 adapter.
 */
import { presentField, type CommonInfoFormValues } from './common-info-form-values'
import type { RegistrationWizardUiValues } from './registration-wizard-ui-values'

export function uiValuesToCommonInfoFormValues(
  values: RegistrationWizardUiValues
): CommonInfoFormValues {
  return {
    programTitleKo: presentField(values.programTitleKo),
    programTitleEn: presentField(values.programTitleEn),
    publicProgramTitle: presentField(values.publicProgramTitle),
    detailedProgramId: presentField(values.detailedProgramId),
    detailedProgramName: presentField(values.detailedProgramName),
    businessField: presentField(values.businessField),
    partnerInvolvement: presentField(values.partnerInvolvement),
    educationVenueKind: presentField(values.educationVenueKind),
    educationVenueDetail: presentField(values.educationVenueDetail),
    educationCourse: presentField(values.educationCourse),
    ipOwned: presentField(values.ipOwned),
    courseDeliveredBy: presentField(values.courseDeliveredBy),
    operationRangeSeal: presentField(values.operationRangeSeal),
    surveyItems: presentField(values.surveyItems),
    sponsorIds: presentField(values.sponsorIds),
    sponsorId: presentField(values.sponsorId),
    managerContactIds: presentField(values.managerContactIds),
    managerContactId: presentField(values.managerContactId),
    sponsorManagerLine: presentField(values.sponsorManagerLine),
    kpiParticipantCount: presentField(values.kpiParticipantCount),
    kpiInstructor: presentField(values.kpiInstructor),
    kpiVolunteer: presentField(values.kpiVolunteer),
    kpiDispatchedSchool: presentField(values.kpiDispatchedSchool),
    kpiDispatchedClass: presentField(values.kpiDispatchedClass),
    wageGrade1Fee: presentField(values.wageGrade1Fee),
    wageGrade2Fee: presentField(values.wageGrade2Fee),
    wageGrade3Fee: presentField(values.wageGrade3Fee),
    paymentItemValues: presentField(values.paymentItemValues),
    paymentItemLabels: presentField(values.paymentItemLabels),
    singleEducationForm: presentField(values.singleEducationForm),
    multiCommonEducationForm: presentField(values.multiCommonEducationForm),
    legacyEducationForm: presentField(values.legacyEducationForm),
    singleParticipation: presentField(values.singleParticipation),
    multiCommonParticipation: presentField(values.multiCommonParticipation),
    ipsType: presentField(values.ipsType),
    scheduleLines: presentField(values.scheduleLines),
    curriculum: values.curriculum,
    schedule: values.schedule,
  }
}

export function stripApplicationKeysFromOverlay(
  overlay: Record<string, unknown>
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(overlay).filter(([key]) => !key.startsWith('application.'))
  )
}
