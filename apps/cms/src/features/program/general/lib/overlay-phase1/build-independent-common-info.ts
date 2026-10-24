/**
 * Phase 1-B 공통정보 독립 Snapshot Builder.
 *
 * 입력: formValues + editorExtras + sidecars + baseline + mode
 * 출력: Program draft + persist overlay
 *
 * overlay store / 기존 overlay 전용 apply·resync·seed /
 * RHF / React 를 호출하지 않는다. 기존 API Mapper는 호출부가 재사용한다.
 */
import type { Program } from '@/types/domain'
import type { ProgramRegistrationIpsCategory } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import {
  PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS,
  PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import type {
  CommonInfoFormValues,
  IndependentCommonInfoBuildInput,
  IndependentCommonInfoBuildResult,
} from './common-info-form-values'
import {
  audienceFromParticipantFlags,
  buildCurriculumSessionsFromMaps,
  buildIpsTypeSummaryFull,
  buildScheduleDetailsFromMaps,
  buildWageGradePricing,
  businessAreaToProgramValue,
  courseDeliveredToProgramValue,
  educationFormLabelFromValue,
  educationProcessToProgramValue,
  generalParticipantTypesFromFlags,
  ipOwnedToProgramValue,
  isSponsorContactUnselected,
  lockDetailedProgramToSchedule,
  mergeResyncPersistOverlay,
  normalizeSponsorManagerContactIds,
  omitMirroredDetailedProgramMasterIdFromCommonInfo,
  participantFlagsFromCompleteExtras,
  programDatesFromOperationRange,
  programPaymentItemLabelsFromIds,
  PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL,
  readOptionalNumber,
  readOptionalText,
  resolveCommonEducationForm,
  resolveCommonParticipation,
  resolveProgramWageDeductionLabel,
  resolveScheduleTypeDetailedProgramNameFromDetails,
  serializeCreatePersistOverlay,
  serializeIndependentCommonInfoOverlayFromProgram,
  surveyKeysFromItems,
  deriveIndependentEditorExtrasFromProgram,
  emptyCurriculumMaps,
  emptyScheduleMaps,
  TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE,
  TRAINED_TEACHERS_REGISTRATION_ALL_VALUE,
  WAGE_GRADE_LABELS,
} from './common-info-domain'
import { pickCurriculumForDraft, pickScheduleForDraft } from './independent-session-authoring'

function withExtrasColumns(program: Program, extras: IndependentCommonInfoBuildInput['editorExtras']): Program {
  return {
    ...program,
    generalProgramEducationStructure: extras.programType,
    generalProgramSessionRound: extras.sessionRoundType,
  }
}

function applyFormValuesToProgram(
  program: Program,
  values: CommonInfoFormValues,
  extras: IndependentCommonInfoBuildInput['editorExtras'],
  authoring?: IndependentCommonInfoBuildInput['sessionAuthoring']
): Program {
  const titleKo =
    readOptionalText(values.programTitleKo) || program.mainTitle || program.title
  const titleEn = readOptionalText(values.programTitleEn) || program.titleEn
  const announcementTitle = values.publicProgramTitle.present
    ? readOptionalText(values.publicProgramTitle)
    : program.generalCommonInfo?.announcementTitle

  const seal = values.operationRangeSeal.present ? values.operationRangeSeal.value : null
  const sealDates = programDatesFromOperationRange(seal)
  const startDate = sealDates?.startDate ?? program.startDate
  const endDate = sealDates?.endDate ?? program.endDate
  const hasSeal = sealDates != null

  const businessField = readOptionalText(values.businessField)
  const businessArea = businessAreaToProgramValue(businessField) || program.businessArea

  const partnerRaw = readOptionalText(values.partnerInvolvement)
  const partnerInvolvement = values.partnerInvolvement.present
    ? partnerRaw !== 'no'
    : (program.partnerInvolvement ?? true)

  const rawVenueKind = readOptionalText(values.educationVenueKind)
  const venueKind =
    rawVenueKind === 'outside' || rawVenueKind === 'other' || rawVenueKind === 'inside'
      ? rawVenueKind
      : 'inside'
  const venueDetail = readOptionalText(values.educationVenueDetail)
  const institutionType =
    venueKind === 'inside'
      ? ('inside_school' as const)
      : venueKind === 'outside'
        ? ('outside_school' as const)
        : undefined
  const venue = venueKind === 'other' ? venueDetail || program.venue : undefined

  const educationProcess =
    educationProcessToProgramValue(readOptionalText(values.educationCourse)) ?? program.educationProcess
  const ipOwned = ipOwnedToProgramValue(readOptionalText(values.ipOwned)) ?? program.ipOwned
  const courseDeliveredBy =
    courseDeliveredToProgramValue(readOptionalText(values.courseDeliveredBy)) ?? program.courseDeliveredBy

  const sponsorManagementIds = values.sponsorIds.present
    ? values.sponsorIds.value.map(s => s.trim()).filter(Boolean)
    : (() => {
        const one = readOptionalText(values.sponsorId)
        return one ? [one] : program.generalCommonInfo?.sponsorManagementIds
      })()
  const sponsorId =
    sponsorManagementIds?.[0] || readOptionalText(values.sponsorId) || program.sponsorId

  const contactRefs = normalizeSponsorManagerContactIds({
    ids: values.managerContactIds.present ? values.managerContactIds.value : undefined,
    id: readOptionalText(values.managerContactId) || undefined,
  }).filter(
    ref => ref !== TRAINED_TEACHERS_REGISTRATION_ALL_VALUE && !isSponsorContactUnselected(ref)
  )
  const contactRef = contactRefs[0] ?? ''
  const sponsorManagerLine =
    readOptionalText(values.sponsorManagerLine) ||
    (contactRef.includes('::') ? '' : contactRef) ||
    program.generalCommonInfo?.sponsorManagerLine

  const prevKpi = program.generalCommonInfo?.kpi
  const kpiNumber = (
    field: CommonInfoFormValues['kpiParticipantCount'],
    fallback: number | undefined
  ) => {
    if (!field.present) return fallback ?? 0
    return readOptionalNumber(field) ?? 0
  }
  const kpi = {
    finalParticipants: kpiNumber(
      values.kpiParticipantCount,
      prevKpi?.finalParticipants ?? program.approvedStudentCount
    ),
    instructorCount: kpiNumber(
      values.kpiInstructor,
      prevKpi?.instructorCount ?? program.instructors
    ),
    volunteerCount: kpiNumber(
      values.kpiVolunteer,
      prevKpi?.volunteerCount ?? program.generalVolunteers
    ),
    finalSchools: kpiNumber(
      values.kpiDispatchedSchool,
      prevKpi?.finalSchools ?? program.participatingSchoolCount
    ),
    finalClasses: kpiNumber(values.kpiDispatchedClass, prevKpi?.finalClasses),
  }

  const gradeFees = [
    readOptionalNumber(values.wageGrade1Fee),
    readOptionalNumber(values.wageGrade2Fee),
    readOptionalNumber(values.wageGrade3Fee),
  ]
  const wageGradeRows = WAGE_GRADE_LABELS.map((grade, index) => ({
    grade,
    pricing: buildWageGradePricing(gradeFees[index]),
  }))
  const paymentItemIds = values.paymentItemValues.present
    ? values.paymentItemValues.value.map(String)
    : undefined
  const paymentItemLabelsOverlay = readOptionalText(values.paymentItemLabels)
  const paymentItemsFromIds = programPaymentItemLabelsFromIds(paymentItemIds)
  const paymentItems =
    paymentItemLabelsOverlay || paymentItemsFromIds || PROGRAM_WAGE_PAYMENT_ITEM_NONE_LABEL
  const deductionItems = resolveProgramWageDeductionLabel(paymentItemIds)

  const ipsType = values.ipsType.present
    ? values.ipsType.value
    : { category: '' as const, detail: '' }
  const ipsCategory = (ipsType.category || '') as ProgramRegistrationIpsCategory | ''
  const ipsCapitalized =
    ipsCategory === 'inspire'
      ? ('Inspire' as const)
      : ipsCategory === 'prepare'
        ? ('Prepare' as const)
        : ipsCategory === 'succeed'
          ? ('Succeed' as const)
          : program.ips
  const programCategory =
    ipsCategory === 'succeed'
      ? (PROGRAM_REGISTRATION_IPS_SUCCEED_PROGRAM_KIND_OPTIONS.find(o => o.value === ipsType.detail)
          ?.label ?? program.programCategory)
      : program.programCategory
  const programChannel =
    ipsCategory === 'inspire'
      ? (PROGRAM_REGISTRATION_IPS_INSPIRE_PROGRAM_CHANNEL_OPTIONS.find(
          o => o.value === ipsType.detail
        )?.label ?? program.programChannel)
      : program.programChannel

  const eduDetail = extras.educationFormScheduleDetail ?? 'common'
  const partDetail = extras.participationScheduleDetail ?? 'common'
  const ipsDetailKind = extras.ipsScheduleDetail ?? 'common'

  const commonEducationForm =
    resolveCommonEducationForm(values) || readOptionalText(values.legacyEducationForm) || 'online'
  const participantFlags = participantFlagsFromCompleteExtras(extras)
  const hideParticipation = extras.participantOrganization === true
  const commonParticipation = hideParticipation
    ? undefined
    : (resolveCommonParticipation(values) as 'individual' | 'team')

  const programTypeFromForm =
    commonEducationForm === 'online'
      ? ('online' as const)
      : commonEducationForm === 'offline'
        ? ('offline' as const)
        : commonEducationForm === 'hybrid'
          ? ('hybrid' as const)
          : program.type

  const builtCurriculum = buildCurriculumSessionsFromMaps(values.curriculum, extras, {
    baseline: program,
    authoring: authoring?.curriculum,
  })
  const builtSchedule = buildScheduleDetailsFromMaps(values.schedule, extras, {
    baseline: program,
    authoring: authoring?.schedule,
  })
  const curriculumSessions = pickCurriculumForDraft({
    extras,
    authoring,
    builtFromMaps: builtCurriculum,
    baseline: program,
  })
  const scheduleDetails = pickScheduleForDraft({
    extras,
    authoring,
    builtFromMaps: builtSchedule,
    baseline: program,
  })

  const lockToSchedule = lockDetailedProgramToSchedule(extras)
  const detailedProgramId = readOptionalText(values.detailedProgramId)
  const detailedProgramNameFromOverlay = readOptionalText(values.detailedProgramName)
  const detailedProgramName = lockToSchedule
    ? resolveScheduleTypeDetailedProgramNameFromDetails(scheduleDetails) ?? '해당없음'
    : detailedProgramNameFromOverlay ||
      (detailedProgramId === TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE ? '해당없음' : undefined)

  const overlayScheduleLines = values.scheduleLines.present
    ? values.scheduleLines.value
        .filter((line): line is string => typeof line === 'string')
        .map(s => s.trim())
        .filter(Boolean)
    : []
  const educationScheduleLines =
    overlayScheduleLines.length > 0
      ? overlayScheduleLines
      : program.generalCommonInfo?.educationScheduleLines

  const rounds =
    hasSeal && program.rounds?.length
      ? program.rounds.map((round, index) =>
          index === 0
            ? {
                ...round,
                startDate,
                endDate,
                curriculum: `${titleKo} 커리큘럼`,
              }
            : round
        )
      : program.rounds

  return {
    ...program,
    title: titleKo,
    mainTitle: titleKo,
    titleEn: titleEn || undefined,
    description: titleKo,
    startDate,
    endDate,
    businessArea,
    partnerInvolvement,
    institutionType: institutionType ?? program.institutionType,
    venue,
    educationProcess,
    ipOwned,
    courseDeliveredBy,
    sponsorId,
    type: programTypeFromForm,
    ips: ipsCapitalized,
    programCategory,
    programChannel,
    detailedProgramId:
      lockToSchedule ||
      !detailedProgramId ||
      detailedProgramId === TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE
        ? undefined
        : detailedProgramId,
    approvedStudentCount: kpi.finalParticipants,
    instructors: kpi.instructorCount,
    instructorCapacity: kpi.instructorCount,
    generalVolunteers: kpi.volunteerCount,
    participatingSchoolCount: kpi.finalSchools,
    generalSurveyMenuKeys: values.surveyItems.present
      ? surveyKeysFromItems(values.surveyItems.value)
      : [],
    ...(participantFlags
      ? {
          generalParticipantTypes: generalParticipantTypesFromFlags(participantFlags),
          generalProgramAudience: audienceFromParticipantFlags(participantFlags),
        }
      : {}),
    rounds,
    generalCommonInfo: {
      ...(lockToSchedule
        ? omitMirroredDetailedProgramMasterIdFromCommonInfo(program.generalCommonInfo)
        : program.generalCommonInfo),
      announcementTitle,
      detailedProgramName,
      venueKind,
      venueDetail: venueDetail || program.generalCommonInfo?.venueDetail,
      sponsorManagementId: sponsorManagementIds?.[0] ?? program.generalCommonInfo?.sponsorManagementId,
      sponsorManagementIds: sponsorManagementIds ?? program.generalCommonInfo?.sponsorManagementIds,
      sponsorManagerContactIds:
        contactRefs.length > 0
          ? contactRefs
          : program.generalCommonInfo?.sponsorManagerContactIds,
      sponsorManagerContactId:
        contactRefs[0] ?? program.generalCommonInfo?.sponsorManagerContactId,
      sponsorManagerLine: sponsorManagerLine || undefined,
      educationScheduleMode:
        extras.educationScheduleMode ?? program.generalCommonInfo?.educationScheduleMode ?? 'date',
      educationScheduleLines,
      educationFormScheduleDetail: eduDetail,
      participationScheduleDetail: partDetail,
      ipsScheduleDetail: ipsDetailKind,
      educationFormLabel:
        eduDetail === 'common' ? educationFormLabelFromValue(commonEducationForm) : undefined,
      participationMethod:
        hideParticipation || partDetail !== 'common' ? undefined : commonParticipation,
      ipsTypeSummary: buildIpsTypeSummaryFull(ipsDetailKind, ipsCategory, ipsType.detail),
      scheduleCurriculumPreEducation: extras.scheduleCurriculumPreEducation ?? false,
      ...(typeof extras.teacherTrainingEnabled === 'boolean'
        ? { teacherTrainingEnabled: extras.teacherTrainingEnabled }
        : {}),
      curriculumSessions,
      scheduleDetails,
      wageGradeRows,
      paymentItems,
      deductionItems,
      kpi,
    },
  }
}

export function buildIndependentCommonInfo(
  input: IndependentCommonInfoBuildInput
): IndependentCommonInfoBuildResult {
  const applied = applyFormValuesToProgram(
    input.baseline,
    input.formValues,
    input.editorExtras,
    input.sessionAuthoring
  )
  const programDraft = withExtrasColumns(applied, input.editorExtras)
  const unowned = input.sidecars?.unownedOverlay ?? {}
  const keyOrder = input.sidecars?.overlayKeyOrder

  if (input.mode === 'create') {
    return {
      applied,
      programDraft,
      persistOverlay: serializeCreatePersistOverlay(input.formValues, unowned, keyOrder),
    }
  }

  const fromNested = serializeIndependentCommonInfoOverlayFromProgram(
    programDraft,
    input.editorExtras,
    input.formValues
  )
  const editOverlay = serializeCreatePersistOverlay(input.formValues, unowned, keyOrder)
  return {
    applied,
    programDraft,
    persistOverlay: mergeResyncPersistOverlay(fromNested, editOverlay, input.formValues, keyOrder),
  }
}

function absentFormValues(): CommonInfoFormValues {
  return {
    programTitleKo: { present: false },
    programTitleEn: { present: false },
    publicProgramTitle: { present: false },
    detailedProgramId: { present: false },
    detailedProgramName: { present: false },
    businessField: { present: false },
    partnerInvolvement: { present: false },
    educationVenueKind: { present: false },
    educationVenueDetail: { present: false },
    educationCourse: { present: false },
    ipOwned: { present: false },
    courseDeliveredBy: { present: false },
    operationRangeSeal: { present: false },
    surveyItems: { present: false },
    sponsorIds: { present: false },
    sponsorId: { present: false },
    managerContactIds: { present: false },
    managerContactId: { present: false },
    sponsorManagerLine: { present: false },
    kpiParticipantCount: { present: false },
    kpiInstructor: { present: false },
    kpiVolunteer: { present: false },
    kpiDispatchedSchool: { present: false },
    kpiDispatchedClass: { present: false },
    wageGrade1Fee: { present: false },
    wageGrade2Fee: { present: false },
    wageGrade3Fee: { present: false },
    paymentItemValues: { present: false },
    paymentItemLabels: { present: false },
    singleEducationForm: { present: false },
    multiCommonEducationForm: { present: false },
    legacyEducationForm: { present: false },
    singleParticipation: { present: false },
    multiCommonParticipation: { present: false },
    ipsType: { present: false },
    scheduleLines: { present: false },
    curriculum: emptyCurriculumMaps(),
    schedule: emptyScheduleMaps(),
  }
}

export function seedIndependentCommonInfoOverlayFromProgram(program: Program): Record<string, unknown> {
  return serializeIndependentCommonInfoOverlayFromProgram(
    program,
    deriveIndependentEditorExtrasFromProgram(program),
    absentFormValues()
  )
}
