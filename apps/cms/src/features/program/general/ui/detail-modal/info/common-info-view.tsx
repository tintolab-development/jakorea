/**
 * 일반 프로그램 상세 — 공통 정보 (조회 / 정보 수정)
 * 프로그램 등록 양식 overlay(단락 title + DetailInfoForm hideHeader)와 동일 레이아웃
 */
// @refresh reset — 후원사 담당자 뷰 컴포넌트 교체 시 HMR이 import/JSX를 어긋나게 두는 경우 방지

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Controller, useFieldArray, type UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import { useSponsorSelectOptions } from '@/features/sponsor/hooks/use-sponsor-options-query'
import { useDetailedProgramSelectOptions } from '@/features/detailed-program/hooks/use-detailed-program-options-query'
import { useGeneralProgramSponsorEditContext } from '@/features/program/general/hooks/use-general-program-sponsor-edit-context'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import {
  programToDetailEditValues,
  resolveStoredEducationFormLabel,
} from '@/features/program/shared/model/program-detail-edit-schema'
import {
  BUSINESS_AREA_OPTIONS,
  COURSE_DELIVERED_BY_OPTIONS,
  EDUCATION_PROCESS_OPTIONS,
  formatDate,
  formatDateRange,
  IP_OWNED_OPTIONS,
  PARTNER_INVOLVEMENT_OPTIONS,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { ProgramProgressStatusText } from '@/shared/components/program-enrollment-status-text'
import { ProgramDetailSponsorLink } from '@/features/program/shared/ui/program-detail/program-detail-sponsor-link'
import {
  ProgramDetailTdSegmentWrap,
  renderDetailInfoPipeSeparated,
} from '@/features/program/shared/ui/program-detail-td-divider'
import { SponsorManagerContactsView } from '@/features/program/shared/ui/sponsor-manager-inline-view'
import { EducationScheduleChangeTitleAction } from '@/features/program/shared/ui/education-schedule-change-title-action'
import { useEducationScheduleModeLineStash } from '@/features/program/shared/lib/education-schedule-mode-lines'
import { resolveEffectiveGeneralProgramTypeFields } from '@/features/program/general/lib/curriculum-display'
import {
  applyCurriculumPreEducationBlock,
  applyCurriculumTypeSettingsDetailChangeToForm,
  applyEducationStructureChangeToForm,
  applySchedulePreEducationBlock,
  applyScheduleTypeSettingsDetailChangeToForm,
  applySessionRoundChangeToForm,
  coerceScheduleDetailsToEventLayout,
  createEmptyScheduleDetailBlock,
  curriculumSessionsPreEducationSyncEqual,
  inferScheduleDetailBlockKind,
  isGeneralProgramMultiRoundForTypeSettings,
  isPreEducationCurriculumSession,
  isPreEducationScheduleBlock,
  shouldUseScheduleEventBlockLayout,
  getScheduleDetailPerBlockLayoutPlan,
  getScheduleEventPerScheduleExtraPlan,
  isScheduleEducationAndIpsBothPerSchedule,
  padCurriculumSessionLabel,
  padEventScheduleLabel,
  scheduleDetailsPreEducationSyncEqual,
  shouldAllowScheduleProgressGroupAdd,
  getEducationScheduleSelectionDatePickerProps,
  shouldAutoFillEducationScheduleFromGroupTimes,
  shouldDisableEducationSchedulePeriodTimeInput,
  shouldLockEducationScheduleDateMode,
  shouldLockEducationScheduleCalendarToggles,
  PRE_EDUCATION_SCHEDULE_LABEL,
  type ScheduleEventPerScheduleExtraPlan,
} from '@/features/program/general/lib/schedule-detail-form'
import { getIndividualMultiRoundPerScheduleTableRows } from '@/features/program/general/lib/individual-per-schedule-table'
import {
  GENERAL_PROGRAM_CURRICULUM_MAX_SESSION_COUNT,
  GENERAL_PROGRAM_CURRICULUM_PROGRESS_SESSION_OPTIONS,
  formatGeneralProgramProgressSessionDisplay,
} from '@/features/program/general/lib/curriculum-progress-session-options'
import { CurriculumAssignmentSettingView } from '@/features/template/ui/shared/curriculum-assignment-setting-view'
import { IndividualPerScheduleExtraRows } from '@/features/template/ui/form-set/registration-form/general/paragraphs/individual-per-schedule-extra-rows'
import {
  formatGeneralParticipantTypesSummary,
  formatGeneralSurveyItemsSummary,
  resolveGeneralProgramCommonInfo,
  resolveGeneralProgramDetailedProgramNameDisplay,
  resolveGeneralProgramScheduleDetailsForView,
} from '@/features/program/general/lib/detail-common-info-display'
import { resolvePublicProgramTitleDisplay } from '@/features/program/shared/lib/public-program-title'
import { getGeneralParticipantTypes } from '@/features/program/general/lib/detail-meta'
import {
  applyGeneralParticipantAudienceToEditForm,
  savedGeneralParticipantTypeLocks,
} from '@/features/program/general/lib/participant-audience-selection'
import { isProgramStructureEditPeriodOpen } from '@/features/program/shared/lib/program-edit-window'
import { GeneralParticipantAudienceCheckboxGroup } from '@/features/program/general/ui/participant-audience-checkbox-group'
import { isGeneralIndividualParticipantTarget } from '@/features/program/general/lib/survey-audience'
import {
  normalizeProgramPaymentItemSelection,
  resolveProgramWageDeductionLabel,
  useNormalizeProgramPaymentItemValues,
  useProgramWagePaymentItemOptionsState,
  excludeCompanySchoolOnlyPaymentItemOptions,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import { paymentItemSelectPlaceholder } from '@/features/template/lib/template-registration-payment-item-options'
import { mapSettlementDeductionTypeToLabel } from '@/features/program/general/lib/settlement-policy-to-wage-rows'
import {
  parseWageGradeAmount,
  pricingByWageGrade,
  resolveWagePaymentItemIds,
  resolveWagePaymentItemsView,
  WAGE_GRADE_FIELDS,
} from '@/features/program/general/lib/wage-display'
import {
  isSponsorContactUnselected,
  isSponsorContactUnselectedLabel,
  normalizeSponsorContactUnselectedSelection,
  SPONSOR_CONTACT_UNSELECTED_VALUE,
} from '@/features/program/shared/lib/sponsor-contact-unselected-option'
import {
  GENERAL_PROGRAM_EDUCATION_STRUCTURE_LABELS,
  GENERAL_PROGRAM_SESSION_ROUND_LABELS,
} from '@/features/program/general/lib/variant'
import {
  formatGeneralProgramVenueViewLine,
  getGeneralSurveyEditFieldsForAudience,
  getGeneralDetailedProgramSelectOptions,
  isGeneralProgramScheduleType,
  padScheduleDetailLabel,
  relabelScheduleDetailFormRows,
  buildSessionIpsTypeSummary,
  resolveScheduleDetailIpsTypeSummaryForView,
  resolveScheduleDetailEducationFormLabelForView,
  resolveScheduleDetailProgressTimeSummaryForView,
  formatScheduleProgressTimeSummaryForView,
  overlayIpsIndexForScheduleDetail,
  resolveSponsorManagementIds,
  retainSponsorManagerContactIdsForSponsors,
  type GeneralProgramCommonInfoEditFormValues,
} from '@/features/program/general/model/common-info-edit-schema'
import {
  buildGeneralProgramSponsorManagerSelectOptions,
  mergeSponsorContactSelectOptions,
  mergeSponsorRegistrationSelectOptions,
  sponsorSelectIdListsEqual,
} from '@/features/program/general/lib/registration-sponsor-select-option-merge'
import {
  CURRICULUM_PRE_EDUCATION_LINE_VALIDATION_KEY,
  CURRICULUM_PRE_EDUCATION_NAME_VALIDATION_KEY,
  SCHEDULE_PRE_EDUCATION_DATE_VALIDATION_KEY,
  SCHEDULE_PRE_EDUCATION_NAME_VALIDATION_KEY,
  curriculumRegularSessionContentValidationKeys,
  curriculumRegularSessionIpsValidationKey,
  scheduleRegularDetailDateValidationKey,
  scheduleRegularDetailGroupTimesValidationKey,
  scheduleRegularDetailIpsValidationKey,
  scheduleRegularDetailNameValidationKey,
} from '@/features/program/general/lib/overlay-phase1/common-info-rhf-validation'
import { PROGRAM_REGISTRATION_SCHEDULE_CURRICULUM_MAX_GROUP_COUNT } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { CmsButton } from '@/shared/ui'
import { ProgramEditInfoActions } from '@/features/program/shared/ui/program-edit-info-actions'
import { BusinessPeriodExtendToolbar } from '@/features/program/shared/ui/business-period-extend-toolbar'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsToggle } from '@/shared/ui'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import { formatNumberDisplay } from '@/shared/utils'
import {
  TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE,
  TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS,
} from '@/features/template/lib/template-form-select-options'
import {
  PROGRAM_REGISTRATION_COURSE_DELIVERED_BY_OPTIONS,
  PROGRAM_REGISTRATION_EDUCATION_COURSE_OPTIONS,
  PROGRAM_REGISTRATION_IP_OWNED_OPTIONS,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import { ProgramRegistrationIpsTypeFields } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-type-fields'
import {
  applyEducationFormTypeSettingsModeChange,
  getProgramRegistrationEducationFormOptions,
  resolveEducationFormTypeSettingsMode,
  shouldShowEducationFormParticipantSelectionRadio,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-form-options'
import { EducationFormTypeSettingsRadioRow } from '@/features/template/ui/form-set/registration-form/general/paragraphs/type-settings-paragraph'
import {
  getProgramRegistrationCurriculumMultiSessionRowPlan,
  shouldHideCurriculumParticipationRowForCommonEduPartWithIpsPerSchedule,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/education-curriculum-paragraph'
import { PROGRAM_REGISTRATION_IDS } from '@/features/template/model/program-registration-draft'
import { PROGRAM_REGISTRATION_GENERAL_SECTION_META } from '@/features/template/ui/form-set/registration-form/general/program-registration-general-section-meta'
import { typeSettingsPerScheduleHint } from '@/features/template/ui/form-set/registration-form/shared/type-settings-copy'
import {
  canRemoveEducationSchedulePreviewLine,
  educationScheduleLinesFromSelectionRangeApply,
  educationScheduleLinesEqual,
  educationScheduleAppliedSurfaceRange,
  educationScheduleRangeHasClock,
  formatEducationScheduleLineFromRange,
  mergeUniqueEducationScheduleLines,
  normalizeEducationSchedulePeriodLineDateOnly,
  parseEducationScheduleLineToRange,
  rebuildEducationScheduleLinesFromGroupTimes,
} from '@/features/template/lib/format-education-schedule-line'
import { resolveEducationScheduleGroupTimeSlots } from '@/features/program/general/lib/education-schedule-lines-display'
import { getProgramRegistrationOverlayRecord } from '@/features/template/ui/form-set/registration-form/general/program-registration-overlay-sync'
import { EducationSchedulePreviewLines } from '@/features/template/ui/shared/education-schedule-preview-lines'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { EducationProgressScheduleDatePicker } from '@/features/template/ui/shared/education-progress-schedule-date-picker'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { dateRangeUsesClockTime } from '@/features/template/ui/shared/writing-form-period-date-picker-field'
import { ParagraphTimePicker } from '@/features/template/ui/shared/paragraph-time-picker'
import '@/features/template/ui/shared/paragraph-date-picker.css'
import '@/features/template/ui/shared/paragraph-time-picker.css'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import { ButtonAddIcon, ButtonClockIcon } from '@/shared/ui/icons/ButtonIcons'
import './common-info-view.css'

const PROGRAM_PROGRESS_STATIC_HINT = '일정에 따라 진행 현황이 자동으로 반영됩니다.'

const PARTICIPATION_METHOD_LABELS = {
  individual: '개인',
  team: '팀',
} as const

function ParticipationMethodRadioGroup({
  value,
  onChange,
  disabled = false,
}: {
  value: string | undefined
  onChange: (next: string) => void
  disabled?: boolean
}) {
  return (
    <CmsRadioGroup
      size="medium"
      value={value ?? 'individual'}
      disabled={disabled}
      onChange={e => onChange(e.target.value)}
    >
      <CmsRadio size="medium" value="individual">
        개인
      </CmsRadio>
      <CmsRadio size="medium" value="team">
        팀
      </CmsRadio>
    </CmsRadioGroup>
  )
}

const toDayjs = (d: string | Date | undefined) => (d ? dayjs(d) : null)
const toIso = (d: Dayjs | null) => (d ? d.toISOString() : '')

function scheduleTimeStringToDayjs(time: string | undefined): Dayjs | null {
  if (!time?.trim()) return null
  const [hourText, minuteText] = time.split(':')
  const hour = Number(hourText)
  const minute = Number(minuteText)
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null
  return dayjs().hour(hour).minute(minute).second(0).millisecond(0)
}

function scheduleGroupLetter(index: number): string {
  return String.fromCharCode('A'.charCodeAt(0) + index)
}

const PARTICIPANT_FORM_KEYS = {
  individual: 'participantIndividual',
  school_institution: 'participantOrganization',
  teacher_instructor: 'participantTeacherInstructor',
  volunteer: 'participantVolunteer',
} as const satisfies Record<
  (typeof TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS)[number]['value'],
  keyof GeneralProgramCommonInfoEditFormValues
>

const SECONDARY_PARTICIPANT_TYPE_OPTIONS = TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS.filter(
  option => option.value !== 'individual' && option.value !== 'school_institution'
)

function optionLabel<T extends { value: string; label: string }>(
  options: readonly T[],
  value: string | undefined | null
): string {
  if (value == null || value === '') return '-'
  return options.find(o => o.value === value)?.label ?? value
}

/** 등록 양식 단락 title + 본문(DetailInfoForm hideHeader) */
function ProgramRegistrationDetailSection({
  title,
  children,
  bodyClassName,
  editDescription,
  titleTrailing,
  isFormEdit = false,
  /** 수정 모드 + 블록 내 입력 항목이 모두 필수일 때 타이틀 `*` */
  required = false,
  highlightParagraphId,
}: {
  title: string
  children: ReactNode
  bodyClassName?: string
  /** 수정 모드에서만 타이틀 하단에 노출 */
  editDescription?: string
  titleTrailing?: ReactNode
  isFormEdit?: boolean
  required?: boolean
  highlightParagraphId?: string
}) {
  return (
    <section className="detail-common-info-view__section" aria-label={title}>
      <FormParagraphSectionHeader
        title={title}
        description={isFormEdit ? editDescription : undefined}
        titleTrailing={titleTrailing}
        surface="responseEntry"
        titleAligned
        required={isFormEdit && required}
        highlightParagraphId={highlightParagraphId}
      />
      <div
        className={['detail-common-info-view__section-body', bodyClassName]
          .filter(Boolean)
          .join(' ')}
      >
        {children}
      </div>
    </section>
  )
}

function PipeSeparatedInlineView({ text }: { text: string | undefined | null }) {
  return renderDetailInfoPipeSeparated(text)
}

function ProgramProgressView({ program }: { program: Program }) {
  if (!program.lifecycleStatus && !program.ujatProgressStatus) return <>-</>
  return <ProgramProgressStatusText program={program} />
}

function KpiBoldNumber({ value }: { value: number }) {
  return <span className="detail-common-info-view__kpi-number">{formatNumberDisplay(value)}</span>
}

/** 빈 값은 null — RHF Controller는 undefined면 defaultValues(이전 KPI)를 다시 보여 준다. */
function parseOptionalNonNegativeInt(raw: string): number | null {
  return raw === '' ? null : Number.parseInt(raw, 10)
}

function KpiNotApplicableInput() {
  return <CmsInput disabled inputSize="small" placeholder="해당 없음" width={120} value="" />
}

function BasicInfoSection({
  program,
  sponsorName,
  v,
  operationRange,
  commonInfo,
  isEditMode = false,
  form,
}: {
  program: Program
  sponsorName?: string
  v: ReturnType<typeof programToDetailEditValues>
  operationRange: string
  commonInfo: ReturnType<typeof resolveGeneralProgramCommonInfo>
  isEditMode?: boolean
  form?: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
}) {
  const isFormEdit = isEditMode && !!form
  // 등록 폼과 동일 — 저장된 program이 아니라 현재 교육 진행 구조로 세부 프로그램명 잠금
  const watchedEducationStructure = isFormEdit ? form.watch('educationStructure') : undefined
  const lockDetailedProgramToNone =
    watchedEducationStructure === 'schedule' ||
    (watchedEducationStructure == null && isGeneralProgramScheduleType(program))
  // 세부 프로그램 옵션은 조회 화면이 아니라 수정 컨트롤에서만 필요하다.
  const { options: remoteDetailedProgramOptions } = useDetailedProgramSelectOptions(isFormEdit)
  const detailedProgramOptions = useMemo(
    () =>
      getGeneralDetailedProgramSelectOptions(
        remoteDetailedProgramOptions.length > 0
          ? remoteDetailedProgramOptions.map(o => ({ id: o.value, name: o.label }))
          : undefined,
        { includeNone: lockDetailedProgramToNone }
      ),
    [lockDetailedProgramToNone, remoteDetailedProgramOptions]
  )
  const { options: sponsorOptions, data: sponsorRows = [] } = useSponsorSelectOptions(true)
  const viewSponsorContext = useMemo(
    () => ({
      sponsors: sponsorRows,
      contactsBySponsorId: {},
    }),
    [sponsorRows]
  )

  const announcementTitle = resolvePublicProgramTitleDisplay({
    ...program,
    generalCommonInfo: commonInfo,
  })
  const detailedName = resolveGeneralProgramDetailedProgramNameDisplay(program, commonInfo)
  const sponsorManagementIds = resolveSponsorManagementIds(program, viewSponsorContext)
  const sponsorDisplayEntries = sponsorManagementIds
    .map((sponsorManagementId, index) => {
      const sponsorRow = sponsorRows.find(row => row.id === sponsorManagementId) ?? null
      const name = sponsorRow?.name?.trim() || (index === 0 ? sponsorName?.trim() : '') || ''
      if (!name) return null
      return { sponsorManagementId, sponsorRow, name }
    })
    .filter(
      (
        entry
      ): entry is {
        sponsorManagementId: string
        sponsorRow: (typeof sponsorRows)[number] | null
        name: string
      } => entry != null
    )
  const sponsorDisplay =
    sponsorDisplayEntries.length > 0 ? (
      <>
        {sponsorDisplayEntries.map((entry, index) => (
          <span key={entry.sponsorManagementId}>
            {index > 0 ? ', ' : null}
            <ProgramDetailSponsorLink
              name={entry.name}
              homepageUrl={entry.sponsorRow?.homepageUrl}
              sponsorId={program.sponsorId}
              sponsorName={entry.name}
              sponsorManagementId={entry.sponsorManagementId}
            />
          </span>
        ))}
      </>
    ) : (
      '-'
    )

  const editForm =
    form ??
    ({
      control: undefined,
      formState: { errors: {} },
      watch: () => undefined,
      setValue: () => undefined,
    } as unknown as UseFormReturn<GeneralProgramCommonInfoEditFormValues>)

  const watchedSponsorIds = isFormEdit ? (editForm.watch('sponsorManagementIds') ?? []) : []
  const watchedContactIds = isFormEdit ? (editForm.watch('sponsorManagerContactIds') ?? []) : []
  const sponsorSelectOptions = useMemo(
    () =>
      mergeSponsorRegistrationSelectOptions({
        sponsorIds: isFormEdit ? watchedSponsorIds : sponsorManagementIds,
        apiOptions: sponsorOptions,
        sponsors: sponsorRows,
      }),
    [isFormEdit, sponsorManagementIds, sponsorOptions, sponsorRows, watchedSponsorIds]
  )
  const sponsorIdsForContacts =
    isFormEdit && watchedSponsorIds.length > 0 ? watchedSponsorIds : sponsorManagementIds
  // 후원사 상세·담당자 연락처는 수정 시 담당자 선택지를 만들 때만 필요하다.
  const sponsorEditContext = useGeneralProgramSponsorEditContext(
    sponsorIdsForContacts,
    sponsorIdsForContacts.length > 0
  )
  const selectedSponsors = useMemo(
    () =>
      sponsorIdsForContacts
        .map(id => sponsorEditContext.sponsors.find(s => s.id === id))
        .filter((sponsor): sponsor is SponsorManagementRow => sponsor != null),
    [sponsorIdsForContacts, sponsorEditContext.sponsors]
  )
  const managerOptions = useMemo(
    () =>
      buildGeneralProgramSponsorManagerSelectOptions({
        isFormEdit,
        selectedSponsorIds: watchedSponsorIds,
        sponsors: sponsorEditContext.sponsors,
        sponsorSelectOptions,
        contactsBySponsorId: sponsorEditContext.contactsBySponsorId,
      }),
    [
      isFormEdit,
      sponsorEditContext.contactsBySponsorId,
      sponsorEditContext.sponsors,
      sponsorSelectOptions,
      watchedSponsorIds,
    ]
  )
  const managerSelectOptions = useMemo(
    () =>
      mergeSponsorContactSelectOptions({
        selectedIds: watchedContactIds,
        apiOptions: managerOptions,
      }),
    [managerOptions, watchedContactIds]
  )

  useEffect(() => {
    if (!isFormEdit) return
    const currentIds = editForm.getValues('sponsorManagerContactIds') ?? []
    if (watchedSponsorIds.length === 0) {
      if (currentIds.length > 0) {
        editForm.setValue('sponsorManagerContactIds', [], {
          shouldValidate: false,
          shouldDirty: false,
        })
        editForm.setValue('sponsorManagerContactId', '', {
          shouldValidate: false,
          shouldDirty: false,
        })
      }
      return
    }
    if (currentIds.length === 0) {
      const storedLine = commonInfo.sponsorManagerLine?.trim() || program.managerName?.trim() || ''
      if (isSponsorContactUnselectedLabel(storedLine) || !storedLine) {
        editForm.setValue('sponsorManagerContactIds', [SPONSOR_CONTACT_UNSELECTED_VALUE], {
          shouldValidate: false,
          shouldDirty: false,
        })
        editForm.setValue('sponsorManagerContactId', SPONSOR_CONTACT_UNSELECTED_VALUE, {
          shouldValidate: false,
          shouldDirty: false,
        })
      }
      return
    }
    const retained = retainSponsorManagerContactIdsForSponsors(watchedSponsorIds, currentIds)
    if (sponsorSelectIdListsEqual(retained, currentIds)) return
    editForm.setValue('sponsorManagerContactIds', retained, {
      shouldValidate: false,
      shouldDirty: false,
    })
    editForm.setValue('sponsorManagerContactId', retained[0] ?? '', {
      shouldValidate: false,
      shouldDirty: false,
    })
  }, [commonInfo.sponsorManagerLine, editForm, isFormEdit, program.managerName, watchedSponsorIds])

  const participantTypeLocks = savedGeneralParticipantTypeLocks()
  const participantIndividual = isFormEdit ? editForm.watch('participantIndividual') : false
  const participantOrganization = isFormEdit ? editForm.watch('participantOrganization') : false
  const isIndividualTarget = isFormEdit
    ? isGeneralIndividualParticipantTarget(program, participantIndividual, participantOrganization)
    : isGeneralIndividualParticipantTarget(program)
  const surveyEditFields = getGeneralSurveyEditFieldsForAudience(isIndividualTarget, program)

  const handleParticipantIndividualChange = useCallback(
    (checked: boolean) => {
      applyGeneralParticipantAudienceToEditForm(editForm, 'individual', checked)
    },
    [editForm]
  )

  const handleParticipantOrganizationChange = useCallback(
    (checked: boolean) => {
      applyGeneralParticipantAudienceToEditForm(editForm, 'organization', checked)
    },
    [editForm]
  )

  const mainFormMode = isFormEdit ? 'edit' : 'view'
  const courseFormMode = isFormEdit ? 'edit' : 'view'

  return (
    <ProgramRegistrationDetailSection
      title="기본 정보"
      bodyClassName="detail-common-info-view__section-body--basic-info"
      isFormEdit={isFormEdit}
      editDescription={PROGRAM_REGISTRATION_GENERAL_SECTION_META.basicInfo.editDescription}
      highlightParagraphId={PROGRAM_REGISTRATION_IDS.basicInfo}
      required
    >
      <DetailInfoForm
        title="기본 정보 — 등록 이력"
        hideHeader
        mode="view"
        className="program-registration-paragraph detail-common-info-view__basic-info-dates-form"
      >
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="최초 등록일"
            view={
              <>
                {formatDate(program.createdAt)}
                {program.createdByName ? (
                  <>
                    <DetailInfoForm.InputsSeparator />
                    {program.createdByName}
                  </>
                ) : null}
              </>
            }
          />
          <DetailInfoForm.Field
            label="마지막 수정일"
            view={
              <>
                {formatDate(program.updatedAt)}
                {program.updatedByName ? (
                  <>
                    <DetailInfoForm.InputsSeparator />
                    {program.updatedByName}
                  </>
                ) : null}
              </>
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
      <DetailInfoForm
        title="기본 정보"
        hideHeader
        mode={mainFormMode}
        className="program-registration-paragraph detail-common-info-view__basic-info-main-form"
      >
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="대표 프로그램명 (국문)"
            validationKey="basicInfo.programTitleKo"
            view={v.mainTitle?.trim() || '-'}
            edit={
              <Controller
                name="mainTitle"
                control={editForm.control}
                render={({ field }) => (
                  <CmsInput
                    inputSize="small"
                    {...field}
                    value={field.value ?? ''}
                    placeholder="대표 프로그램명을 입력하세요"
                    width="100%"
                    status={editForm.formState.errors.mainTitle ? 'error' : undefined}
                  />
                )}
              />
            }
          />
          <DetailInfoForm.Field
            label="대표 프로그램명 (영문)"
            validationKey="basicInfo.programTitleEn"
            view={program.titleEn?.trim() || '-'}
            edit={
              <Controller
                name="titleEn"
                control={editForm.control}
                render={({ field }) => (
                  <CmsInput
                    inputSize="small"
                    {...field}
                    value={field.value ?? ''}
                    placeholder="대표 프로그램명(영문)을 입력하세요"
                    width="100%"
                  />
                )}
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="공고용 프로그램명"
            validationKey="basicInfo.publicProgramTitle"
            view={announcementTitle}
            edit={
              <Controller
                name="announcementTitle"
                control={editForm.control}
                render={({ field }) => (
                  <CmsInput
                    inputSize="small"
                    {...field}
                    value={field.value ?? ''}
                    placeholder="모집 시 노출될 프로그램명을 입력하세요"
                    width="100%"
                    status={editForm.formState.errors.announcementTitle ? 'error' : undefined}
                  />
                )}
              />
            }
          />
          <DetailInfoForm.Field
            label="세부 프로그램명"
            validationKey="basicInfo.detailedProgram"
            view={detailedName}
            edit={
              <Controller
                name="detailedProgramId"
                control={editForm.control}
                render={({ field }) => (
                  <div className="detail-info-form-inputs-wrapper-no-gap">
                    <CmsSelect
                      withAllOption={false}
                      inputSize="small"
                      placeholder="세부 프로그램명을 선택하세요"
                      width="100%"
                      options={detailedProgramOptions}
                      value={
                        lockDetailedProgramToNone
                          ? TEMPLATE_FORM_DETAILED_PROGRAM_NONE_VALUE
                          : field.value || undefined
                      }
                      onChange={v => field.onChange(String(v ?? ''))}
                      disabled={lockDetailedProgramToNone}
                    />
                  </div>
                )}
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="사업 운영 기간"
            validationKey="basicInfo.operationRangeSeal"
            view={operationRange}
            edit={
              <Controller
                name="startDate"
                control={editForm.control}
                render={({ field }) => {
                  const endDateValue = editForm.watch('endDate')
                  const start = toDayjs(field.value)
                  const end = toDayjs(endDateValue)
                  const operationRange = start && end ? ([start, end] as [Dayjs, Dayjs]) : null
                  const operationRangeWithTime =
                    operationRange == null
                      ? false
                      : dateRangeUsesClockTime(operationRange[0], operationRange[1])

                  return (
                    <div className="detail-info-form-inputs-wrapper-no-gap">
                      <ParagraphDatePicker
                        inputSize="small"
                        mode="single"
                        presetMode="period"
                        value={start ?? dayjs()}
                        width="100%"
                        placeholder="사업 운영 기간을 선택하세요"
                        preferPeriodModeInPopover
                        appliedSurfaceRange={operationRange}
                        appliedSurfaceWithTime={operationRangeWithTime}
                        onRangeChange={range => {
                          field.onChange(toIso(range[0]))
                          editForm.setValue('endDate', toIso(range[1]), {
                            shouldValidate: true,
                          })
                        }}
                        onChange={next => {
                          if (next == null) return
                          field.onChange(toIso(next))
                        }}
                      />
                    </div>
                  )
                }}
              />
            }
          />
          <DetailInfoForm.Field
            label="프로그램 진행 현황"
            readOnlyDisplay={isFormEdit}
            view={
              isFormEdit ? (
                <span className="form-editor-template-field-hint-text">
                  {PROGRAM_PROGRESS_STATIC_HINT}
                </span>
              ) : (
                <ProgramProgressView program={program} />
              )
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="참여자 유형"
            validationKey="basicInfo.audience"
            view={formatGeneralParticipantTypesSummary(program)}
            edit={
              <div className="detail-info-form-inputs-wrapper">
                <GeneralParticipantAudienceCheckboxGroup
                  individual={Boolean(participantIndividual)}
                  organization={Boolean(participantOrganization)}
                  individualDisabled={participantTypeLocks.individual}
                  organizationDisabled={participantTypeLocks.organization}
                  onIndividualChange={handleParticipantIndividualChange}
                  onOrganizationChange={handleParticipantOrganizationChange}
                />
                {SECONDARY_PARTICIPANT_TYPE_OPTIONS.map(option => {
                  const formKey =
                    PARTICIPANT_FORM_KEYS[option.value as keyof typeof PARTICIPANT_FORM_KEYS]
                  const typeLocked =
                    option.value === 'teacher_instructor'
                      ? participantTypeLocks.teacherInstructor
                      : participantTypeLocks.volunteer
                  return (
                    <Controller
                      key={option.value}
                      name={formKey}
                      control={editForm.control}
                      render={({ field }) => (
                        <CmsCheckbox
                          checkboxSize="medium"
                          checked={Boolean(field.value)}
                          disabled={typeLocked}
                          onChange={event => field.onChange(event.target.checked)}
                        >
                          {option.label}
                        </CmsCheckbox>
                      )}
                    />
                  )
                })}
              </div>
            }
          />
          <DetailInfoForm.Field
            label="사업 분야"
            validationKey="basicInfo.businessField"
            view={optionLabel(BUSINESS_AREA_OPTIONS, v.businessArea)}
            edit={
              <Controller
                name="businessArea"
                control={editForm.control}
                render={({ field, fieldState }) => {
                  const hasValue = Boolean(String(field.value ?? '').trim())
                  return (
                    <CmsSelect
                      inputSize="small"
                      withAllOption={false}
                      placeholder="사업 분야를 선택하세요"
                      width="100%"
                      options={[...BUSINESS_AREA_OPTIONS]}
                      value={field.value || undefined}
                      onChange={v => {
                        const next = String(v ?? '')
                        field.onChange(next)
                        if (next) editForm.clearErrors('businessArea')
                      }}
                      status={fieldState.error && !hasValue ? 'error' : undefined}
                    />
                  )
                }}
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="후원사"
            validationKey="basicInfo.sponsorId"
            view={sponsorDisplay}
            edit={
              <Controller
                name="sponsorManagementIds"
                control={editForm.control}
                render={({ field, fieldState }) => {
                  const hasValue = Array.isArray(field.value) && field.value.length > 0
                  return (
                    <CmsSelect
                      inputSize="small"
                      mode="multiple"
                      withAllOption={false}
                      placeholder="후원사를 선택하세요"
                      width="100%"
                      showSearch
                      optionFilterProp="label"
                      options={sponsorSelectOptions}
                      value={field.value ?? []}
                      onChange={v => {
                        const next = Array.isArray(v) ? v.map(String) : []
                        const previous = Array.isArray(field.value) ? field.value.map(String) : []
                        field.onChange(next)
                        if (next.length > 0) editForm.clearErrors('sponsorManagementIds')
                        if (sponsorSelectIdListsEqual(next, previous)) return
                        const retained = retainSponsorManagerContactIdsForSponsors(
                          next,
                          editForm.getValues('sponsorManagerContactIds') ?? []
                        )
                        editForm.setValue('sponsorManagerContactIds', retained, {
                          shouldDirty: true,
                        })
                        editForm.setValue('sponsorManagerContactId', retained[0] ?? '', {
                          shouldDirty: true,
                        })
                      }}
                      status={fieldState.error && !hasValue ? 'error' : undefined}
                    />
                  )
                }}
              />
            }
          />
          <DetailInfoForm.Field
            label="후원사 담당자"
            validationKey="basicInfo.sponsorContactId"
            view={
              <SponsorManagerContactsView
                program={program}
                sponsorRows={selectedSponsors}
                contactsBySponsorId={sponsorEditContext.contactsBySponsorId}
              />
            }
            edit={
              <Controller
                name="sponsorManagerContactIds"
                control={editForm.control}
                render={({ field, fieldState }) => {
                  const selected = Array.isArray(field.value) ? field.value : []
                  const optionValues = new Set(managerSelectOptions.map(option => option.value))
                  const hasValidSelection =
                    selected.length > 0 &&
                    selected.every(id => optionValues.has(id) || isSponsorContactUnselected(id))
                  return (
                    <CmsSelect
                      inputSize="small"
                      mode="multiple"
                      placeholder="후원사 담당자를 선택하세요"
                      width="100%"
                      showSearch
                      optionFilterProp="label"
                      options={managerSelectOptions}
                      value={selected}
                      disabled={watchedSponsorIds.length === 0}
                      onChange={v => {
                        const ids = normalizeSponsorContactUnselectedSelection(
                          Array.isArray(v) ? v.map(String) : [],
                          selected
                        )
                        field.onChange(ids)
                        editForm.setValue('sponsorManagerContactId', ids[0] ?? '', {
                          shouldDirty: true,
                        })
                        if (ids.length > 0) editForm.clearErrors('sponsorManagerContactIds')
                      }}
                      status={fieldState.error && !hasValidSelection ? 'error' : undefined}
                    />
                  )
                }}
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육 장소"
            validationKey="basicInfo.educationVenueDetail"
            fullRow
            view={
              <PipeSeparatedInlineView
                text={formatGeneralProgramVenueViewLine(program, commonInfo.venueDetail)}
              />
            }
            edit={
              <div className="detail-info-form-inputs-wrapper">
                <Controller
                  name="venueKind"
                  control={editForm.control}
                  render={({ field }) => (
                    <CmsRadioGroup
                      size="medium"
                      value={field.value}
                      onChange={e => field.onChange(e.target.value)}
                    >
                      <CmsRadio size="medium" value="inside">
                        기관 안
                      </CmsRadio>
                      <CmsRadio size="medium" value="outside">
                        기관 밖
                      </CmsRadio>
                      <CmsRadio size="medium" value="other">
                        기타(직접입력)
                      </CmsRadio>
                    </CmsRadioGroup>
                  )}
                />
                <DetailInfoForm.InputsSeparator />
                <Controller
                  name="venueDetail"
                  control={editForm.control}
                  render={({ field }) => (
                    <CmsInput
                      inputSize="small"
                      {...field}
                      value={field.value ?? ''}
                      placeholder="교육이 진행될 상세 장소를 입력해 주세요"
                      width="100%"
                      style={{ flex: '1 1 0', minWidth: 0 }}
                    />
                  )}
                />
              </div>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="설문 진행 항목"
            fullRow
            view={formatGeneralSurveyItemsSummary(program)}
            edit={
              <div className="detail-info-form-inputs-wrapper">
                {surveyEditFields.map(({ id, formKey, label }) => (
                  <Controller
                    key={id}
                    name={formKey}
                    control={editForm.control}
                    render={({ field }) => (
                      <CmsCheckbox
                        checkboxSize="medium"
                        checked={Boolean(field.value)}
                        onChange={e => field.onChange(e.target.checked)}
                      >
                        {label}
                      </CmsCheckbox>
                    )}
                  />
                ))}
              </div>
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
      <DetailInfoForm
        title="기본 정보 — 교육 과정"
        hideHeader
        mode={courseFormMode}
        className="program-registration-paragraph detail-common-info-view__basic-info-course-form"
      >
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="교육 과정"
            validationKey="basicInfo.educationCourse"
            view={optionLabel(
              EDUCATION_PROCESS_OPTIONS,
              v.educationProcess ?? program.educationProcess
            )}
            edit={
              <Controller
                name="educationProcess"
                control={editForm.control}
                render={({ field, fieldState }) => {
                  const hasValue = Boolean(String(field.value ?? '').trim())
                  return (
                    <CmsSelect
                      inputSize="small"
                      withAllOption={false}
                      placeholder="교육 과정을 선택하세요"
                      width="100%"
                      options={[...PROGRAM_REGISTRATION_EDUCATION_COURSE_OPTIONS]}
                      value={field.value || undefined}
                      onChange={v => {
                        const next = String(v ?? '')
                        field.onChange(next)
                        if (next) editForm.clearErrors('educationProcess')
                      }}
                      status={fieldState.error && !hasValue ? 'error' : undefined}
                    />
                  )
                }}
              />
            }
          />
          <DetailInfoForm.Field
            label="IP Owned"
            validationKey="basicInfo.ipOwned"
            view={optionLabel(IP_OWNED_OPTIONS, v.ipOwned)}
            edit={
              <Controller
                name="ipOwned"
                control={editForm.control}
                render={({ field, fieldState }) => {
                  const hasValue = Boolean(String(field.value ?? '').trim())
                  return (
                    <CmsSelect
                      inputSize="small"
                      withAllOption={false}
                      placeholder="IP Owned를 선택하세요"
                      width="100%"
                      options={[...PROGRAM_REGISTRATION_IP_OWNED_OPTIONS]}
                      value={field.value || undefined}
                      onChange={v => {
                        const next = String(v ?? '')
                        field.onChange(next)
                        if (next) editForm.clearErrors('ipOwned')
                      }}
                      status={fieldState.error && !hasValue ? 'error' : undefined}
                    />
                  )
                }}
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="Course Delivered By"
            validationKey="basicInfo.courseDeliveredBy"
            view={optionLabel(COURSE_DELIVERED_BY_OPTIONS, v.courseDeliveredBy ?? undefined)}
            edit={
              <Controller
                name="courseDeliveredBy"
                control={editForm.control}
                render={({ field, fieldState }) => {
                  const hasValue = Boolean(String(field.value ?? '').trim())
                  return (
                    <CmsSelect
                      inputSize="small"
                      withAllOption={false}
                      placeholder="Course Delivered By를 선택하세요"
                      width="100%"
                      options={[...PROGRAM_REGISTRATION_COURSE_DELIVERED_BY_OPTIONS]}
                      value={field.value || undefined}
                      onChange={v => {
                        const next = String(v ?? '')
                        field.onChange(next)
                        if (next) editForm.clearErrors('courseDeliveredBy')
                      }}
                      status={fieldState.error && !hasValue ? 'error' : undefined}
                    />
                  )
                }}
              />
            }
          />
          <DetailInfoForm.Field
            label="Partner Involvement"
            view={
              program.partnerInvolvement == null
                ? '-'
                : (PARTNER_INVOLVEMENT_OPTIONS.find(o => o.value === program.partnerInvolvement)
                    ?.label ?? '-')
            }
            edit={
              <Controller
                name="partnerInvolvement"
                control={editForm.control}
                render={({ field }) => (
                  <CmsRadioGroup
                    size="medium"
                    value={field.value}
                    onChange={e => field.onChange(e.target.value as 'yes' | 'no')}
                  >
                    <CmsRadio size="medium" value="yes">
                      Yes
                    </CmsRadio>
                    <CmsRadio size="medium" value="no">
                      No
                    </CmsRadio>
                  </CmsRadioGroup>
                )}
              />
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </ProgramRegistrationDetailSection>
  )
}

function KpiSection({
  commonInfo,
  program,
  isEditMode = false,
  form,
}: {
  commonInfo: ReturnType<typeof resolveGeneralProgramCommonInfo>
  program: Program
  isEditMode?: boolean
  form?: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
}) {
  const kpi = commonInfo.kpi
  const isFormEdit = isEditMode && !!form
  const editForm =
    form ??
    ({
      control: undefined,
      formState: { errors: {} },
      watch: () => undefined,
    } as unknown as UseFormReturn<GeneralProgramCommonInfoEditFormValues>)

  const hasInstructor = isFormEdit
    ? editForm.watch('participantTeacherInstructor')
    : getGeneralParticipantTypes(program).includes('teacher_instructor')
  const hasVolunteer = isFormEdit
    ? editForm.watch('participantVolunteer')
    : getGeneralParticipantTypes(program).includes('volunteer')
  useEffect(() => {
    if (!isFormEdit) return
    editForm.setValue('kpiFinalSchools', 0)
    editForm.setValue('kpiFinalClasses', 0)
  }, [editForm, isFormEdit])

  useEffect(() => {
    if (!isFormEdit || hasInstructor) return
    editForm.setValue('kpiInstructorCount', 0)
  }, [editForm, hasInstructor, isFormEdit])

  useEffect(() => {
    if (!isFormEdit || hasVolunteer) return
    editForm.setValue('kpiVolunteerCount', 0)
  }, [editForm, hasVolunteer, isFormEdit])

  if (!kpi && !isEditMode) return null

  const dispatchedSchoolClassView = <span className="detail-info-form--text">해당 없음</span>

  const formMode = isFormEdit ? 'edit' : 'view'

  return (
    <ProgramRegistrationDetailSection
      title="사업 KPI 목표"
      isFormEdit={isFormEdit}
      highlightParagraphId={PROGRAM_REGISTRATION_IDS.businessKpi}
      required
    >
      <DetailInfoForm
        title="사업 KPI 목표"
        hideHeader
        mode={formMode}
        className="program-registration-paragraph"
      >
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="참여자 최종 인원"
            validationKey="kpi.participantCount"
            view={<KpiBoldNumber value={kpi?.finalParticipants ?? 0} />}
            edit={
              <Controller
                name="kpiFinalParticipants"
                control={editForm.control}
                render={({ field }) => (
                  <CmsNumericInput
                    mode="integer"
                    min={0}
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    value={field.value == null ? '' : String(field.value)}
                    onValueChange={raw => field.onChange(parseOptionalNonNegativeInt(raw))}
                    inputSize="small"
                    placeholder="목표값 입력"
                    width={120}
                  />
                )}
              />
            }
          />
          <DetailInfoForm.Field
            label="교육진행자 최종 인원"
            validationKey={['kpi.instructor', 'kpi.volunteer']}
            view={
              <div className="detail-info-form-inputs-wrapper">
                <span className="detail-info-form--text">강사 :</span>
                {hasInstructor ? (
                  <KpiBoldNumber value={kpi?.instructorCount ?? 0} />
                ) : (
                  <span className="detail-info-form--text">해당 없음</span>
                )}
                <DetailInfoForm.InputsSeparator />
                <span className="detail-info-form--text">봉사자 :</span>
                {hasVolunteer ? (
                  <KpiBoldNumber value={kpi?.volunteerCount ?? 0} />
                ) : (
                  <span className="detail-info-form--text">해당 없음</span>
                )}
              </div>
            }
            edit={
              <div className="detail-info-form-inputs-wrapper">
                <span className="detail-info-form--text mr-6">강사</span>
                {hasInstructor ? (
                  <Controller
                    name="kpiInstructorCount"
                    control={editForm.control}
                    render={({ field }) => (
                      <CmsNumericInput
                        mode="integer"
                        min={0}
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={field.value == null ? '' : String(field.value)}
                        onValueChange={raw => field.onChange(parseOptionalNonNegativeInt(raw))}
                        inputSize="small"
                        placeholder="목표값 입력"
                        width={120}
                      />
                    )}
                  />
                ) : (
                  <KpiNotApplicableInput />
                )}
                <DetailInfoForm.InputsSeparator />
                <span className="detail-info-form--text mr-6">봉사자</span>
                {hasVolunteer ? (
                  <Controller
                    name="kpiVolunteerCount"
                    control={editForm.control}
                    render={({ field }) => (
                      <CmsNumericInput
                        mode="integer"
                        min={0}
                        name={field.name}
                        ref={field.ref}
                        onBlur={field.onBlur}
                        value={field.value == null ? '' : String(field.value)}
                        onValueChange={raw => field.onChange(parseOptionalNonNegativeInt(raw))}
                        inputSize="small"
                        placeholder="목표값 입력"
                        width={120}
                      />
                    )}
                  />
                ) : (
                  <KpiNotApplicableInput />
                )}
              </div>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="최종 파견 학교 수"
            validationKey="kpi.finalSchools"
            view={dispatchedSchoolClassView}
            edit={<KpiNotApplicableInput />}
          />
          <DetailInfoForm.Field
            label="최종 파견 학급 수"
            validationKey="kpi.finalClasses"
            view={dispatchedSchoolClassView}
            edit={<KpiNotApplicableInput />}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </ProgramRegistrationDetailSection>
  )
}

function WageGradeAmountView({
  pricing,
  maxHint,
}: {
  pricing: string | undefined
  maxHint: string
}) {
  const amount = parseWageGradeAmount(pricing)
  if (amount == null) return '-'
  return (
    <ProgramDetailTdSegmentWrap>
      1시간 당
      <DetailInfoForm.InputsSeparator />
      {formatNumberDisplay(amount)}원 (최대 {maxHint}원)
    </ProgramDetailTdSegmentWrap>
  )
}

function WageSection({
  commonInfo,
  isEditMode = false,
  form,
}: {
  commonInfo: ReturnType<typeof resolveGeneralProgramCommonInfo>
  isEditMode?: boolean
  form?: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
}) {
  const pricingByGrade = pricingByWageGrade(commonInfo.wageGradeRows)
  const paymentItemIds = resolveWagePaymentItemIds(commonInfo.paymentItems)
  const isFormEdit = isEditMode && !!form
  const formMode = isFormEdit ? 'edit' : 'view'
  const paymentCatalog = useProgramWagePaymentItemOptionsState()
  // R14: 일반 상세에서 1사1교 전용 지급 항목 제외(저장된 선택값은 유지)
  const paymentItemOptions = useMemo(
    () => excludeCompanySchoolOnlyPaymentItemOptions(paymentCatalog.options, paymentItemIds),
    [paymentCatalog.options, paymentItemIds]
  )

  const editForm =
    form ??
    ({
      control: undefined,
      formState: { errors: {} },
      watch: () => undefined,
    } as unknown as UseFormReturn<GeneralProgramCommonInfoEditFormValues>)

  const watchedPaymentItemIds = isFormEdit ? (editForm.watch('wagePaymentItemIds') ?? []) : []
  const setWagePaymentItemIds = useCallback(
    (ids: string[]) => form?.setValue('wagePaymentItemIds', ids, { shouldDirty: true }),
    [form]
  )
  useNormalizeProgramPaymentItemValues(
    isFormEdit ? watchedPaymentItemIds : undefined,
    setWagePaymentItemIds,
    paymentCatalog.ready
  )
  const deductionLabel = isFormEdit
    ? resolveProgramWageDeductionLabel(watchedPaymentItemIds)
    : (mapSettlementDeductionTypeToLabel(commonInfo.deductionItems) ??
      resolveProgramWageDeductionLabel(paymentItemIds))

  const wageFields = [
    {
      label: WAGE_GRADE_FIELDS[0].label,
      name: 'wageGrade1Amount' as const,
      max: 500_000,
      maxHint: WAGE_GRADE_FIELDS[0].maxHint,
      validationKey: 'wage.grade1Fee',
    },
    {
      label: WAGE_GRADE_FIELDS[1].label,
      name: 'wageGrade2Amount' as const,
      max: 400_000,
      maxHint: WAGE_GRADE_FIELDS[1].maxHint,
      validationKey: 'wage.grade2Fee',
    },
    {
      label: WAGE_GRADE_FIELDS[2].label,
      name: 'wageGrade3Amount' as const,
      max: 300_000,
      maxHint: WAGE_GRADE_FIELDS[2].maxHint,
      validationKey: 'wage.grade3Fee',
    },
  ]

  return (
    <ProgramRegistrationDetailSection
      title={PROGRAM_REGISTRATION_GENERAL_SECTION_META.wageInfo.title}
      isFormEdit={isFormEdit}
      editDescription={PROGRAM_REGISTRATION_GENERAL_SECTION_META.wageInfo.editDescription}
      highlightParagraphId={PROGRAM_REGISTRATION_IDS.wageInfo}
      required
    >
      <DetailInfoForm
        title="임금 정보"
        hideHeader
        mode={formMode}
        className="program-registration-paragraph"
      >
        {wageFields.map(({ label, name, max, maxHint, validationKey }) => (
          <DetailInfoForm.Row key={label} type="single">
            <DetailInfoForm.Field
              label={label}
              validationKey={validationKey}
              fullRow
              view={<WageGradeAmountView pricing={pricingByGrade[label]} maxHint={maxHint} />}
              edit={
                <div className="detail-info-form-inputs-wrapper">
                  <span className="detail-info-form--text">1시간 당</span>
                  <Controller
                    name={name}
                    control={editForm.control}
                    render={({ field }) => (
                      <CmsNumericInput
                        mode="currency"
                        min={0}
                        max={max}
                        allowNegative={false}
                        inputSize="small"
                        placeholder="직접 입력"
                        width={120}
                        value={field.value ?? ''}
                        onValueChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    )}
                  />
                  <span className="detail-info-form--text">원 (최대 {maxHint}원)</span>
                </div>
              }
            />
          </DetailInfoForm.Row>
        ))}
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="지급 항목"
            validationKey="wage.paymentItemValues"
            view={resolveWagePaymentItemsView(commonInfo.paymentItems)}
            edit={
              <Controller
                name="wagePaymentItemIds"
                control={editForm.control}
                render={({ field }) => (
                  <CmsSelect
                    inputSize="small"
                    mode="multiple"
                    withAllOption={false}
                    value={field.value ?? []}
                    onChange={next =>
                      field.onChange(
                        normalizeProgramPaymentItemSelection(next as string[], field.value ?? [])
                      )
                    }
                    options={paymentItemOptions}
                    disabled={!paymentCatalog.ready}
                    placeholder={paymentItemSelectPlaceholder(paymentCatalog)}
                    style={{ width: '100%', minWidth: 0 }}
                  />
                )}
              />
            }
          />
          <DetailInfoForm.Field label="공제 항목" view={deductionLabel} />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </ProgramRegistrationDetailSection>
  )
}

function TypeSettingsScheduleDetailRow({
  label,
  scheduleDetailName,
  scheduleDetailValue,
  editForm,
  formMode,
  commonDetailEdit,
  commonDetailView,
  validationKey,
  locked = false,
  perScheduleHint = typeSettingsPerScheduleHint({
    educationStructure: 'curriculum',
    sessionRound: 'single',
  }),
}: {
  label: string
  scheduleDetailName:
    | 'educationFormScheduleDetail'
    | 'participationScheduleDetail'
    | 'ipsScheduleDetail'
  scheduleDetailValue: 'common' | 'perSchedule'
  editForm: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
  formMode: 'view' | 'edit'
  commonDetailEdit?: ReactNode
  commonDetailView?: ReactNode
  validationKey?: string
  locked?: boolean
  perScheduleHint?: string
}) {
  const scheduleDetail =
    formMode === 'edit' ? (editForm.watch(scheduleDetailName) ?? 'common') : scheduleDetailValue

  if (formMode === 'view') {
    return (
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label={label}
          fullRow
          validationKey={validationKey}
          view={scheduleDetail === 'perSchedule' ? '일정 별 상이' : (commonDetailView ?? '-')}
        />
      </DetailInfoForm.Row>
    )
  }

  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label={label}
        fullRow
        validationKey={validationKey}
        edit={
          <div className="detail-info-form-inputs-wrapper program-registration-paragraph__schedule-detail-row">
            <Controller
              name={scheduleDetailName}
              control={editForm.control}
              render={({ field }) => (
                <CmsRadioGroup
                  size="medium"
                  value={field.value ?? 'common'}
                  disabled={locked}
                  onChange={e => {
                    field.onChange(e.target.value)
                    applyCurriculumTypeSettingsDetailChangeToForm(
                      editForm.setValue,
                      editForm.getValues
                    )
                  }}
                >
                  <CmsRadio size="medium" value="common">
                    일정 공통
                  </CmsRadio>
                  <CmsRadio size="medium" value="perSchedule">
                    일정 별 상이
                  </CmsRadio>
                </CmsRadioGroup>
              )}
            />
            {scheduleDetail === 'common' && commonDetailEdit != null ? (
              <>
                <DetailInfoForm.InputsSeparator />
                {commonDetailEdit}
              </>
            ) : null}
            {scheduleDetail === 'perSchedule' ? (
              <>
                <DetailInfoForm.InputsSeparator />
                <span className="program-registration-paragraph__schedule-hint">
                  {perScheduleHint}
                </span>
              </>
            ) : null}
          </div>
        }
        view="-"
      />
    </DetailInfoForm.Row>
  )
}

function TypeSettingsIpsRow({
  editForm,
  isFormEdit,
  perScheduleHint,
}: {
  editForm: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
  isFormEdit: boolean
  perScheduleHint: string
}) {
  const ipsScheduleDetail = isFormEdit ? editForm.watch('ipsScheduleDetail') : 'common'
  const ipsCategory = isFormEdit ? editForm.watch('ipsCategory') : ''
  const ipsDetail = isFormEdit ? editForm.watch('ipsDetail') : ''

  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label="IPS 유형"
        fullRow
        validationKey="typeSettings.ipsType"
        edit={
          <div className="detail-info-form-inputs-wrapper program-registration-paragraph__schedule-detail-row">
            <Controller
              name="ipsScheduleDetail"
              control={editForm.control}
              render={({ field }) => (
                <CmsRadioGroup
                  size="medium"
                  value={field.value}
                  onChange={e => {
                    field.onChange(e.target.value)
                    applyCurriculumTypeSettingsDetailChangeToForm(
                      editForm.setValue,
                      editForm.getValues
                    )
                  }}
                >
                  <CmsRadio size="medium" value="common">
                    일정 공통
                  </CmsRadio>
                  <CmsRadio size="medium" value="perSchedule">
                    일정 별 상이
                  </CmsRadio>
                </CmsRadioGroup>
              )}
            />
            {ipsScheduleDetail === 'common' ? (
              <>
                <DetailInfoForm.InputsSeparator />
                <ProgramRegistrationIpsTypeFields
                  value={{ category: ipsCategory, detail: ipsDetail ?? '' }}
                  onChange={next => {
                    editForm.setValue('ipsCategory', next.category)
                    editForm.setValue('ipsDetail', next.detail)
                  }}
                />
              </>
            ) : (
              <>
                <DetailInfoForm.InputsSeparator />
                <span className="program-registration-paragraph__schedule-hint">
                  {perScheduleHint}
                </span>
              </>
            )}
          </div>
        }
        view="-"
      />
    </DetailInfoForm.Row>
  )
}

function TypeSettingsSection({
  program,
  isEditMode = false,
  form,
}: {
  program: Program
  isEditMode?: boolean
  form?: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
}) {
  const commonInfo = resolveGeneralProgramCommonInfo(program)
  const educationFormLabelView = resolveStoredEducationFormLabel(commonInfo).trim() || '-'
  const effectiveTypeFields = resolveEffectiveGeneralProgramTypeFields({
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    curriculumSessions: commonInfo.curriculumSessions,
    registrationOverlay: program.registrationOverlay,
  })
  const isFormEdit = isEditMode && !!form
  const formMode = isFormEdit ? 'edit' : 'view'
  const typeSettingsLocked = !isProgramStructureEditPeriodOpen(program)

  const editForm =
    form ??
    ({
      control: undefined,
      formState: { errors: {} },
      watch: () => undefined,
      setValue: () => undefined,
    } as unknown as UseFormReturn<GeneralProgramCommonInfoEditFormValues>)

  const watchedStructure = isFormEdit
    ? editForm.watch('educationStructure')
    : effectiveTypeFields.educationStructure
  const watchedSessionRound = isFormEdit
    ? editForm.watch('sessionRound')
    : effectiveTypeFields.sessionRound
  const watchedCurriculumSessions = isFormEdit ? editForm.watch('curriculumSessions') : undefined
  const participantOrganization = isFormEdit
    ? editForm.watch('participantOrganization')
    : effectiveTypeFields.audience !== 'individual'

  const educationStructure =
    GENERAL_PROGRAM_EDUCATION_STRUCTURE_LABELS[
      watchedStructure ?? effectiveTypeFields.educationStructure
    ] ?? '-'
  const sessionRound =
    GENERAL_PROGRAM_SESSION_ROUND_LABELS[watchedSessionRound ?? effectiveTypeFields.sessionRound] ??
    '-'
  const isMultiRoundType = isGeneralProgramMultiRoundForTypeSettings({
    educationStructure: watchedStructure ?? effectiveTypeFields.educationStructure,
    sessionRound: watchedSessionRound ?? effectiveTypeFields.sessionRound,
    curriculumSessions: watchedCurriculumSessions ?? commonInfo.curriculumSessions,
  })
  const isScheduleStructure =
    (watchedStructure ?? effectiveTypeFields.educationStructure) === 'schedule'
  const schedulePerScheduleHint = typeSettingsPerScheduleHint({
    educationStructure: isScheduleStructure ? 'schedule' : 'curriculum',
    sessionRound: isMultiRoundType ? 'multi' : 'single',
  })
  const isSingle = !isMultiRoundType
  const isOrganization = participantOrganization
  const participationMethod = isFormEdit
    ? (editForm.watch('participationMethod') ?? 'individual')
    : (commonInfo.participationMethod ?? 'individual')
  const participationMethodLabel =
    PARTICIPATION_METHOD_LABELS[participationMethod as keyof typeof PARTICIPATION_METHOD_LABELS] ??
    PARTICIPATION_METHOD_LABELS.individual

  const educationFormOptions = getProgramRegistrationEducationFormOptions(
    Boolean(participantOrganization)
  )
  const educationFormScheduleDetail =
    (isFormEdit ? editForm.watch('educationFormScheduleDetail') : undefined) ??
    commonInfo.educationFormScheduleDetail ??
    'common'
  const educationFormValue = (isFormEdit ? editForm.watch('educationForm') : undefined) ?? ''
  const showEducationFormParticipantSelectionRadio =
    shouldShowEducationFormParticipantSelectionRadio({
      participantOrganization: Boolean(isOrganization),
      educationStructure: isScheduleStructure ? 'schedule' : 'curriculum',
      sessionRound: isMultiRoundType ? 'multi' : 'single',
    })
  const educationFormTypeSettingsSelectOptions = showEducationFormParticipantSelectionRadio
    ? getProgramRegistrationEducationFormOptions(false)
    : educationFormOptions
  const participationScheduleDetail =
    (isFormEdit ? editForm.watch('participationScheduleDetail') : undefined) ??
    commonInfo.participationScheduleDetail ??
    'common'
  const ipsScheduleDetail =
    (isFormEdit ? editForm.watch('ipsScheduleDetail') : undefined) ??
    commonInfo.ipsScheduleDetail ??
    (commonInfo.ipsTypeSummary?.includes('별') ? 'perSchedule' : 'common')
  const ipsCategory = isFormEdit ? editForm.watch('ipsCategory') : ''
  const ipsDetail = isFormEdit ? editForm.watch('ipsDetail') : ''

  const scheduleTypeSettingsKey = `${educationFormScheduleDetail}-${participationScheduleDetail}-${ipsScheduleDetail}`
  const prevScheduleTypeSettingsKeyRef = useRef(scheduleTypeSettingsKey)
  useEffect(() => {
    if (!isFormEdit) return
    if (prevScheduleTypeSettingsKeyRef.current === scheduleTypeSettingsKey) return
    prevScheduleTypeSettingsKeyRef.current = scheduleTypeSettingsKey
    if (isScheduleStructure && isMultiRoundType) {
      applyScheduleTypeSettingsDetailChangeToForm(editForm.setValue, editForm.getValues)
      return
    }
    if (!isScheduleStructure) {
      applyCurriculumTypeSettingsDetailChangeToForm(editForm.setValue, editForm.getValues)
    }
  }, [scheduleTypeSettingsKey, isFormEdit, isScheduleStructure, isMultiRoundType, editForm])

  return (
    <ProgramRegistrationDetailSection
      title={PROGRAM_REGISTRATION_GENERAL_SECTION_META.typeSettings.title}
      isFormEdit={isFormEdit}
      editDescription={PROGRAM_REGISTRATION_GENERAL_SECTION_META.typeSettings.editDescription}
      bodyClassName="detail-common-info-view__section-body--type-settings"
      highlightParagraphId={PROGRAM_REGISTRATION_IDS.typeSettings}
      required
    >
      <DetailInfoForm
        title="프로그램 유형 설정"
        hideHeader
        mode={formMode}
        className="program-registration-paragraph detail-common-info-view__type-settings-structure-form"
      >
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="교육 진행 구조"
            view={educationStructure}
            edit={
              <Controller
                name="educationStructure"
                control={editForm.control}
                render={({ field }) => (
                  <CmsRadioGroup
                    size="medium"
                    value={field.value}
                    onChange={e => {
                      const next = e.target.value as 'curriculum' | 'schedule'
                      field.onChange(next)
                      if (isFormEdit) {
                        applyEducationStructureChangeToForm(
                          editForm.setValue,
                          editForm.getValues,
                          next
                        )
                      }
                    }}
                  >
                    <CmsRadio size="medium" value="curriculum">
                      커리큘럼형
                    </CmsRadio>
                    <CmsRadio size="medium" value="schedule">
                      일정형
                    </CmsRadio>
                  </CmsRadioGroup>
                )}
              />
            }
          />
          <DetailInfoForm.Field
            label="수업 회차 유형"
            view={sessionRound}
            edit={
              <Controller
                name="sessionRound"
                control={editForm.control}
                render={({ field }) => (
                  <CmsRadioGroup
                    size="medium"
                    value={field.value}
                    onChange={e => {
                      const next = e.target.value as 'single' | 'multi'
                      field.onChange(next)
                      if (isFormEdit) {
                        applySessionRoundChangeToForm(editForm.setValue, editForm.getValues, next)
                      }
                    }}
                  >
                    <CmsRadio size="medium" value="single">
                      단일 회차
                    </CmsRadio>
                    <CmsRadio size="medium" value="multi">
                      복수 회차
                    </CmsRadio>
                  </CmsRadioGroup>
                )}
              />
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
      {isSingle ? (
        <DetailInfoForm
          title="교육 형태, IPS 유형 설정"
          hideHeader
          mode={formMode}
          className="program-registration-paragraph detail-common-info-view__type-settings-detail-form"
        >
          <DetailInfoForm.Row type={isOrganization ? 'single' : 'double'}>
            <DetailInfoForm.Field
              label="교육 형태"
              validationKey="typeSettings.multiCommonEducationForm"
              fullRow={isOrganization}
              view={educationFormLabelView}
              edit={
                <Controller
                  name="educationForm"
                  control={editForm.control}
                  render={({ field }) => (
                    <CmsRadioGroup
                      size="medium"
                      value={field.value ?? 'online'}
                      onChange={e => field.onChange(e.target.value)}
                    >
                      {educationFormOptions.map(opt => (
                        <CmsRadio size="medium" key={opt.value} value={opt.value}>
                          {opt.label}
                        </CmsRadio>
                      ))}
                    </CmsRadioGroup>
                  )}
                />
              }
            />
            {!isOrganization ? (
              <DetailInfoForm.Field
                label="참여 방식"
                validationKey="typeSettings.multiCommonParticipation"
                view={participationMethodLabel}
                edit={
                  <Controller
                    name="participationMethod"
                    control={editForm.control}
                    render={({ field }) => (
                      <CmsRadioGroup
                        size="medium"
                        value={field.value ?? 'individual'}
                        disabled={typeSettingsLocked}
                        onChange={e => field.onChange(e.target.value)}
                      >
                        <CmsRadio size="medium" value="individual">
                          개인
                        </CmsRadio>
                        <CmsRadio size="medium" value="team">
                          팀
                        </CmsRadio>
                      </CmsRadioGroup>
                    )}
                  />
                }
              />
            ) : null}
          </DetailInfoForm.Row>
          {isFormEdit ? (
            <TypeSettingsIpsRow
              editForm={editForm}
              isFormEdit={isFormEdit}
              perScheduleHint={schedulePerScheduleHint}
            />
          ) : (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="IPS 유형"
                validationKey="typeSettings.ipsType"
                fullRow
                view={<PipeSeparatedInlineView text={commonInfo.ipsTypeSummary} />}
              />
            </DetailInfoForm.Row>
          )}
        </DetailInfoForm>
      ) : (
        <DetailInfoForm
          title={
            isOrganization ? '교육 형태, IPS 유형 설정' : '교육 형태, 참여 방식, IPS 유형 설정'
          }
          hideHeader
          mode={formMode}
          className="program-registration-paragraph detail-common-info-view__type-settings-detail-form"
        >
          {showEducationFormParticipantSelectionRadio && formMode === 'edit' ? (
            <EducationFormTypeSettingsRadioRow
              mode={resolveEducationFormTypeSettingsMode({
                educationFormScheduleDetail,
                educationForm: educationFormValue,
              })}
              onModeChange={next => {
                const applied = applyEducationFormTypeSettingsModeChange({
                  next,
                  currentForm: editForm.getValues('educationForm') ?? '',
                })
                editForm.setValue(
                  'educationFormScheduleDetail',
                  applied.educationFormScheduleDetail,
                  {
                    shouldDirty: true,
                  }
                )
                editForm.setValue('educationForm', applied.educationForm, { shouldDirty: true })
                applyCurriculumTypeSettingsDetailChangeToForm(editForm.setValue, editForm.getValues)
              }}
              perScheduleHint={schedulePerScheduleHint}
              commonDetailEdit={
                <Controller
                  name="educationForm"
                  control={editForm.control}
                  render={({ field }) => (
                    <CmsSelect
                      inputSize="small"
                      withAllOption={false}
                      placeholder="교육 형태"
                      width={160}
                      options={educationFormTypeSettingsSelectOptions}
                      value={field.value || undefined}
                      onChange={v => field.onChange(String(v ?? ''))}
                    />
                  )}
                />
              }
            />
          ) : (
            <TypeSettingsScheduleDetailRow
              label="교육 형태"
              validationKey="typeSettings.multiCommonEducationForm"
              scheduleDetailName="educationFormScheduleDetail"
              scheduleDetailValue={educationFormScheduleDetail}
              editForm={editForm}
              formMode={formMode}
              perScheduleHint={schedulePerScheduleHint}
              commonDetailView={educationFormLabelView}
              commonDetailEdit={
                <Controller
                  name="educationForm"
                  control={editForm.control}
                  render={({ field }) => (
                    <CmsSelect
                      inputSize="small"
                      withAllOption={false}
                      placeholder="교육 형태"
                      width={160}
                      options={educationFormTypeSettingsSelectOptions}
                      value={field.value || undefined}
                      onChange={v => field.onChange(String(v ?? ''))}
                    />
                  )}
                />
              }
            />
          )}
          {!isOrganization ? (
            <TypeSettingsScheduleDetailRow
              label="참여 방식"
              validationKey="typeSettings.multiCommonParticipation"
              scheduleDetailName="participationScheduleDetail"
              scheduleDetailValue={participationScheduleDetail}
              editForm={editForm}
              formMode={formMode}
              locked={typeSettingsLocked}
              commonDetailView={participationMethodLabel}
              perScheduleHint={schedulePerScheduleHint}
              commonDetailEdit={
                <Controller
                  name="participationMethod"
                  control={editForm.control}
                  render={({ field }) => (
                    <CmsSelect
                      inputSize="small"
                      withAllOption={false}
                      placeholder="참여 방식"
                      width={160}
                      disabled={typeSettingsLocked}
                      options={[
                        { value: 'individual', label: '개인' },
                        { value: 'team', label: '팀' },
                      ]}
                      value={field.value || undefined}
                      onChange={v => field.onChange(String(v ?? ''))}
                    />
                  )}
                />
              }
            />
          ) : null}
          <TypeSettingsScheduleDetailRow
            label="IPS 유형"
            validationKey="typeSettings.ipsType"
            scheduleDetailName="ipsScheduleDetail"
            scheduleDetailValue={ipsScheduleDetail}
            editForm={editForm}
            formMode={formMode}
            commonDetailView={<PipeSeparatedInlineView text={commonInfo.ipsTypeSummary} />}
            commonDetailEdit={
              <ProgramRegistrationIpsTypeFields
                value={{ category: ipsCategory ?? '', detail: ipsDetail ?? '' }}
                onChange={next => {
                  editForm.setValue('ipsCategory', next.category)
                  editForm.setValue('ipsDetail', next.detail)
                }}
              />
            }
          />
        </DetailInfoForm>
      )}
    </ProgramRegistrationDetailSection>
  )
}

type CurriculumSessionViewModel = {
  sessionLabel: string
  title: string
  description: string
  assignmentEnabled?: boolean
  assignmentPeriod?: string
  educationFormLabel?: string
  participationMethodLabel?: string
  ipsTypeSummary?: string
  scheduleDateLabel?: string
}

function MultiRoundCurriculumSessionForm({
  index,
  session,
  formMode,
  editForm,
  isFormEdit,
  onRemove,
  showEducationPerRound,
  showIpsPerRoundWithEducation,
  showIpsOnlyPerRound,
  showAssignment = true,
  educationFormOptions,
  individualTableRows,
  isPreEducationBlock = false,
  canRemove = false,
  highlightSessionNo,
  participationMethodLocked = false,
}: {
  index: number
  session: CurriculumSessionViewModel
  formMode: 'view' | 'edit'
  editForm: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
  isFormEdit: boolean
  onRemove: () => void
  /** 교육 형태 일정 별 상이 — 회차별 교육 형태 */
  showEducationPerRound: boolean
  /** 교육·IPS 모두 일정 별 상이 — 회차별 교육 형태 + IPS를 같은 행에 */
  showIpsPerRoundWithEducation: boolean
  /** 교육·참여 공통 + IPS 일정 별 상이 — 회차별 IPS만 */
  showIpsOnlyPerRound: boolean
  /** 과제 설정 — 일반(개인)만 */
  showAssignment?: boolean
  educationFormOptions: ReturnType<typeof getProgramRegistrationEducationFormOptions>
  individualTableRows?: ReturnType<typeof getIndividualMultiRoundPerScheduleTableRows>
  isPreEducationBlock?: boolean
  canRemove?: boolean
  highlightSessionNo: number
  participationMethodLocked?: boolean
}) {
  const assignmentEnabled = editForm.watch(`curriculumSessions.${index}.assignmentEnabled`) ?? false
  const sessionIpsCategory = editForm.watch(`curriculumSessions.${index}.ipsCategory`) ?? ''
  const sessionIpsDetail = editForm.watch(`curriculumSessions.${index}.ipsDetail`) ?? ''
  const headingLabel = isPreEducationBlock ? PRE_EDUCATION_SCHEDULE_LABEL : session.sessionLabel
  const classFieldLabel = isPreEducationBlock
    ? '교육 내용'
    : isFormEdit
      ? `${session.sessionLabel.replace(/회차$/, '')}회차 수업`
      : '차시 및 교육 내용'

  const assignmentField = (fullRow: boolean) => (
    <DetailInfoForm.Field
      label="과제 설정"
      fullRow={fullRow}
      validationKey={`curriculum.assignment[${highlightSessionNo}]`}
      view={
        <CurriculumAssignmentSettingView
          assignmentEnabled={session.assignmentEnabled}
          assignmentPeriod={session.assignmentPeriod}
        />
      }
      edit={
        <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap program-registration-paragraph__assignment-row">
          <Controller
            name={`curriculumSessions.${index}.assignmentEnabled`}
            control={editForm.control}
            render={({ field }) => (
              <CmsRadioGroup
                size="medium"
                value={field.value ? 'yes' : 'no'}
                onChange={e => {
                  const enabled = e.target.value === 'yes'
                  field.onChange(enabled)
                  if (!enabled) {
                    editForm.setValue(`curriculumSessions.${index}.assignmentPeriod`, '')
                  }
                }}
              >
                <CmsRadio size="medium" value="yes">
                  있음
                </CmsRadio>
                <CmsRadio size="medium" value="no">
                  없음
                </CmsRadio>
              </CmsRadioGroup>
            )}
          />
          <DetailInfoForm.InputsSeparator />
          <Controller
            name={`curriculumSessions.${index}.assignmentPeriod`}
            control={editForm.control}
            render={({ field: periodField }) => {
              const appliedRange = parseEducationScheduleLineToRange(periodField.value)
              return (
                <ParagraphDatePicker
                  inputSize="small"
                  mode="single"
                  presetMode="period"
                  customizable={false}
                  suppressAutoTodayWhenEmpty
                  disabled={!assignmentEnabled}
                  value={appliedRange?.[0] ?? null}
                  onChange={() => {}}
                  appliedSurfaceRange={appliedRange}
                  onRangeChange={([start, end]) => {
                    periodField.onChange(formatEducationScheduleLineFromRange([start, end]))
                    if (!assignmentEnabled) {
                      editForm.setValue(`curriculumSessions.${index}.assignmentEnabled`, true)
                    }
                  }}
                  width={360}
                  placeholder="제출 기한을 설정해 주세요"
                />
              )
            }}
          />
        </div>
      }
    />
  )

  return (
    <div className="program-registration-curriculum__session-block">
      <div className="program-registration-curriculum__session-heading">■ {headingLabel}</div>
      <div className={isFormEdit ? 'program-registration-curriculum__session-row' : undefined}>
        <DetailInfoForm
          title={`${session.sessionLabel} 커리큘럼`}
          hideHeader
          mode={formMode}
          className="program-registration-paragraph"
        >
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label={classFieldLabel}
              fullRow
              validationKey={curriculumRegularSessionContentValidationKeys(highlightSessionNo)}
              view={
                <>
                  {formatGeneralProgramProgressSessionDisplay(session.title)}
                  <DetailInfoForm.InputsSeparator />
                  {session.description}
                </>
              }
              edit={
                <div className="detail-info-form-inputs-wrapper">
                  <Controller
                    name={`curriculumSessions.${index}.title`}
                    control={editForm.control}
                    render={({ field }) => (
                      <CmsSelect
                        inputSize="small"
                        withAllOption={false}
                        placeholder="진행 차시"
                        width={144}
                        options={GENERAL_PROGRAM_CURRICULUM_PROGRESS_SESSION_OPTIONS}
                        value={field.value || undefined}
                        onChange={v => field.onChange(String(v ?? ''))}
                      />
                    )}
                  />
                  <DetailInfoForm.InputsSeparator />
                  <Controller
                    name={`curriculumSessions.${index}.description`}
                    control={editForm.control}
                    render={({ field }) => (
                      <CmsInput
                        {...field}
                        value={field.value ?? ''}
                        inputSize="small"
                        placeholder="교육 내용을 작성하세요"
                        width="100%"
                        style={{ minWidth: 0, flex: '1 1 0' }}
                      />
                    )}
                  />
                </div>
              }
            />
          </DetailInfoForm.Row>
          {isPreEducationBlock || !showAssignment ? (
            <>
              {showEducationPerRound ? (
                showIpsPerRoundWithEducation ? (
                  <DetailInfoForm.Row type="double">
                    <DetailInfoForm.Field
                      label="교육 형태"
                      view={session.educationFormLabel ?? '-'}
                      edit={
                        <Controller
                          name={`curriculumSessions.${index}.educationForm`}
                          control={editForm.control}
                          render={({ field }) => (
                            <CmsRadioGroup
                              size="medium"
                              value={field.value ?? 'online'}
                              onChange={e => field.onChange(e.target.value)}
                            >
                              {educationFormOptions.map(opt => (
                                <CmsRadio size="medium" key={opt.value} value={opt.value}>
                                  {opt.label}
                                </CmsRadio>
                              ))}
                            </CmsRadioGroup>
                          )}
                        />
                      }
                    />
                    <DetailInfoForm.Field
                      label="IPS 유형"
                      validationKey={curriculumRegularSessionIpsValidationKey(highlightSessionNo)}
                      view={<PipeSeparatedInlineView text={session.ipsTypeSummary} />}
                      edit={
                        <ProgramRegistrationIpsTypeFields
                          layout="inline"
                          disabled={isPreEducationBlock}
                          value={
                            isPreEducationBlock
                              ? { category: 'prepare', detail: 'none' }
                              : {
                                  category: sessionIpsCategory,
                                  detail: sessionIpsDetail,
                                }
                          }
                          onChange={next => {
                            if (isPreEducationBlock) return
                            editForm.setValue(
                              `curriculumSessions.${index}.ipsCategory`,
                              next.category,
                              { shouldDirty: true }
                            )
                            editForm.setValue(
                              `curriculumSessions.${index}.ipsDetail`,
                              next.detail,
                              { shouldDirty: true }
                            )
                          }}
                        />
                      }
                    />
                  </DetailInfoForm.Row>
                ) : (
                  <DetailInfoForm.Row type="single">
                    <DetailInfoForm.Field
                      label="교육 형태"
                      fullRow
                      view={session.educationFormLabel ?? '-'}
                      edit={
                        <Controller
                          name={`curriculumSessions.${index}.educationForm`}
                          control={editForm.control}
                          render={({ field }) => (
                            <CmsRadioGroup
                              size="medium"
                              value={field.value ?? 'online'}
                              onChange={e => field.onChange(e.target.value)}
                            >
                              {educationFormOptions.map(opt => (
                                <CmsRadio size="medium" key={opt.value} value={opt.value}>
                                  {opt.label}
                                </CmsRadio>
                              ))}
                            </CmsRadioGroup>
                          )}
                        />
                      }
                    />
                  </DetailInfoForm.Row>
                )
              ) : null}
              {showIpsOnlyPerRound && !showIpsPerRoundWithEducation ? (
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field
                    label="IPS 유형"
                    fullRow
                    validationKey={curriculumRegularSessionIpsValidationKey(highlightSessionNo)}
                    view={<PipeSeparatedInlineView text={session.ipsTypeSummary} />}
                    edit={
                      <ProgramRegistrationIpsTypeFields
                        disabled={isPreEducationBlock}
                        value={
                          isPreEducationBlock
                            ? { category: 'prepare', detail: 'none' }
                            : {
                                category: sessionIpsCategory,
                                detail: sessionIpsDetail,
                              }
                        }
                        onChange={next => {
                          if (isPreEducationBlock) return
                          editForm.setValue(
                            `curriculumSessions.${index}.ipsCategory`,
                            next.category,
                            { shouldDirty: true }
                          )
                          editForm.setValue(`curriculumSessions.${index}.ipsDetail`, next.detail, {
                            shouldDirty: true,
                          })
                        }}
                      />
                    }
                  />
                </DetailInfoForm.Row>
              ) : null}
            </>
          ) : (
            <IndividualPerScheduleExtraRows
              rows={individualTableRows ?? [{ type: 'single', field: 'assignment' }]}
              renderField={(field, options) => {
                if (field === 'assignment') return assignmentField(options.fullRow)
                if (field === 'education') {
                  return (
                    <DetailInfoForm.Field
                      label="교육 형태"
                      fullRow={options.fullRow}
                      view={session.educationFormLabel ?? '-'}
                      edit={
                        <Controller
                          name={`curriculumSessions.${index}.educationForm`}
                          control={editForm.control}
                          render={({ field: radioField }) => (
                            <CmsRadioGroup
                              size="medium"
                              value={radioField.value ?? 'online'}
                              onChange={e => radioField.onChange(e.target.value)}
                            >
                              {educationFormOptions.map(opt => (
                                <CmsRadio size="medium" key={opt.value} value={opt.value}>
                                  {opt.label}
                                </CmsRadio>
                              ))}
                            </CmsRadioGroup>
                          )}
                        />
                      }
                    />
                  )
                }
                if (field === 'ips') {
                  return (
                    <DetailInfoForm.Field
                      label="IPS 유형"
                      fullRow={options.fullRow}
                      validationKey={curriculumRegularSessionIpsValidationKey(highlightSessionNo)}
                      view={<PipeSeparatedInlineView text={session.ipsTypeSummary} />}
                      edit={
                        <ProgramRegistrationIpsTypeFields
                          layout={options.layout}
                          disabled={isPreEducationBlock}
                          value={{
                            category: sessionIpsCategory,
                            detail: sessionIpsDetail,
                          }}
                          onChange={next => {
                            editForm.setValue(
                              `curriculumSessions.${index}.ipsCategory`,
                              next.category,
                              { shouldDirty: true }
                            )
                            editForm.setValue(
                              `curriculumSessions.${index}.ipsDetail`,
                              next.detail,
                              { shouldDirty: true }
                            )
                          }}
                        />
                      }
                    />
                  )
                }
                return (
                  <DetailInfoForm.Field
                    label="참여 방식"
                    fullRow={options.fullRow}
                    view={session.participationMethodLabel ?? '-'}
                    edit={
                      <Controller
                        name={`curriculumSessions.${index}.participationMethod`}
                        control={editForm.control}
                        render={({ field: radioField }) => (
                          <ParticipationMethodRadioGroup
                            value={radioField.value}
                            onChange={radioField.onChange}
                            disabled={participationMethodLocked}
                          />
                        )}
                      />
                    }
                  />
                )
              }}
            />
          )}
        </DetailInfoForm>
        {isFormEdit && canRemove ? (
          <ItemDeleteButton
            className="item-delete-button program-registration-curriculum__session-delete"
            aria-label={`${headingLabel} 삭제`}
            onClick={event => {
              event.stopPropagation()
              onRemove()
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

function SingleRoundCurriculumSessionForm({
  index,
  session,
  formMode,
  editForm,
  isFormEdit,
  onRemove,
  showIpsPerSession,
  isPreEducationBlock = false,
  canRemove = false,
  showHeading = true,
  highlightSessionNo,
}: {
  index: number
  session: CurriculumSessionViewModel
  formMode: 'view' | 'edit'
  editForm: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
  isFormEdit: boolean
  onRemove: () => void
  showIpsPerSession: boolean
  isPreEducationBlock?: boolean
  canRemove?: boolean
  showHeading?: boolean
  highlightSessionNo: number
}) {
  const sessionIpsCategory = editForm.watch(`curriculumSessions.${index}.ipsCategory`) ?? ''
  const sessionIpsDetail = editForm.watch(`curriculumSessions.${index}.ipsDetail`) ?? ''
  const headingLabel = isPreEducationBlock ? PRE_EDUCATION_SCHEDULE_LABEL : session.sessionLabel
  return (
    <div className="program-registration-curriculum__session-block">
      {showHeading ? (
        <div className="program-registration-curriculum__session-heading">■ {headingLabel}</div>
      ) : null}
      <div className={isFormEdit ? 'program-registration-curriculum__session-row' : undefined}>
        <DetailInfoForm
          title={`${session.sessionLabel} 커리큘럼`}
          hideHeader
          mode={formMode}
          className="program-registration-paragraph"
        >
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="단원명 및 교육 내용"
              fullRow
              validationKey={curriculumRegularSessionContentValidationKeys(highlightSessionNo)}
              view={
                session.title?.trim() || session.description?.trim() ? (
                  <>
                    {session.title?.trim() ? session.title : null}
                    {session.title?.trim() && session.description?.trim() ? (
                      <DetailInfoForm.InputsSeparator />
                    ) : null}
                    {session.description?.trim() ? session.description : null}
                  </>
                ) : (
                  '-'
                )
              }
              edit={
                <div className="detail-info-form-inputs-wrapper">
                  <Controller
                    name={`curriculumSessions.${index}.title`}
                    control={editForm.control}
                    render={({ field }) => (
                      <CmsInput
                        {...field}
                        value={field.value ?? ''}
                        inputSize="small"
                        placeholder="단원명을 입력하세요"
                        width="100%"
                        style={{ minWidth: 0, flex: '1 1 0' }}
                      />
                    )}
                  />
                  <DetailInfoForm.InputsSeparator />
                  <Controller
                    name={`curriculumSessions.${index}.description`}
                    control={editForm.control}
                    render={({ field }) => (
                      <CmsInput
                        {...field}
                        value={field.value ?? ''}
                        inputSize="small"
                        placeholder="교육 내용을 작성하세요"
                        width="100%"
                        style={{ minWidth: 0, flex: '1 1 0' }}
                      />
                    )}
                  />
                </div>
              }
            />
          </DetailInfoForm.Row>
          {showIpsPerSession ? (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="IPS 유형"
                fullRow
                validationKey={curriculumRegularSessionIpsValidationKey(highlightSessionNo)}
                view={<PipeSeparatedInlineView text={session.ipsTypeSummary} />}
                edit={
                  <ProgramRegistrationIpsTypeFields
                    value={
                      isPreEducationBlock
                        ? { category: 'prepare', detail: 'none' }
                        : {
                            category: sessionIpsCategory,
                            detail: sessionIpsDetail,
                          }
                    }
                    disabled={isPreEducationBlock}
                    onChange={next => {
                      if (isPreEducationBlock) return
                      editForm.setValue(`curriculumSessions.${index}.ipsCategory`, next.category, {
                        shouldDirty: true,
                      })
                      editForm.setValue(`curriculumSessions.${index}.ipsDetail`, next.detail, {
                        shouldDirty: true,
                      })
                    }}
                  />
                }
              />
            </DetailInfoForm.Row>
          ) : null}
        </DetailInfoForm>
        {isFormEdit && canRemove ? (
          <ItemDeleteButton
            className="item-delete-button program-registration-curriculum__session-delete"
            aria-label={`${headingLabel} 삭제`}
            onClick={event => {
              event.stopPropagation()
              onRemove()
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

function CurriculumPreEducationEventEditBlock({
  index,
  formMode,
  editForm,
}: {
  index: number
  formMode: 'view' | 'edit'
  editForm: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
}) {
  const participantIndividual = Boolean(editForm.watch('participantIndividual'))
  const participantOrganization = Boolean(editForm.watch('participantOrganization'))
  const sessionRound = editForm.watch('sessionRound') === 'multi' ? 'multi' : 'single'
  return (
    <div className="program-registration-schedule-curriculum__block">
      <div className="program-registration-schedule-curriculum__session-heading">
        ■ {PRE_EDUCATION_SCHEDULE_LABEL}
      </div>
      <div className="program-registration-curriculum__session-row">
        <div className="program-registration-schedule-curriculum__session-panel">
          <DetailInfoForm
            title="교육 진행 (일정형)"
            hideHeader
            mode={formMode}
            className="program-registration-paragraph"
          >
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="일정명"
                validationKey={CURRICULUM_PRE_EDUCATION_NAME_VALIDATION_KEY}
                edit={
                  <Controller
                    name={`curriculumSessions.${index}.title`}
                    control={editForm.control}
                    render={({ field }) => (
                      <CmsInput
                        {...field}
                        value={field.value ?? ''}
                        inputSize="small"
                        placeholder="행사 일정명을 작성하세요"
                        width="100%"
                        style={{ minWidth: 0, flex: '1 1 0' }}
                      />
                    )}
                  />
                }
                view={editForm.watch(`curriculumSessions.${index}.title`) || '-'}
              />
              <DetailInfoForm.Field
                label="진행 일정"
                validationKey={CURRICULUM_PRE_EDUCATION_LINE_VALIDATION_KEY}
                edit={
                  <div className="detail-info-form-inputs-wrapper-no-gap">
                    <Controller
                      name={`curriculumSessions.${index}.scheduleDate`}
                      control={editForm.control}
                      render={({ field }) => {
                        const appliedRange = parseEducationScheduleLineToRange(field.value)
                        const appliedWithTime = Boolean(
                          appliedRange && educationScheduleRangeHasClock(appliedRange)
                        )
                        return (
                          <EducationProgressScheduleDatePicker
                            participantIndividual={participantIndividual}
                            participantOrganization={participantOrganization}
                            programType="curriculum"
                            sessionRound={sessionRound}
                            value={appliedRange?.[0] ?? null}
                            onChange={() => {}}
                            onRangeChange={([start, end]) => {
                              field.onChange(formatEducationScheduleLineFromRange([start, end]))
                            }}
                            appliedSurfaceRange={educationScheduleAppliedSurfaceRange(appliedRange)}
                            appliedSurfaceWithTime={appliedWithTime}
                          />
                        )
                      }}
                    />
                  </div>
                }
                view="-"
              />
            </DetailInfoForm.Row>
            <ScheduleEventPerScheduleExtraEditRows
              index={index}
              editForm={editForm}
              isPreEducationBlock
              fieldArrayName="curriculumSessions"
            />
          </DetailInfoForm>
        </div>
      </div>
    </div>
  )
}

function CurriculumSection({
  program,
  commonInfo,
  isEditMode = false,
  form,
}: {
  program: Program
  commonInfo: ReturnType<typeof resolveGeneralProgramCommonInfo>
  isEditMode?: boolean
  form?: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
}) {
  const isFormEdit = isEditMode && !!form
  const participationMethodLocked = !isProgramStructureEditPeriodOpen(program)
  const editForm =
    form ??
    ({
      control: undefined,
      formState: { errors: {} },
      watch: () => undefined,
      setValue: () => undefined,
    } as unknown as UseFormReturn<GeneralProgramCommonInfoEditFormValues>)

  const effectiveTypeFields = resolveEffectiveGeneralProgramTypeFields({
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    curriculumSessions: commonInfo.curriculumSessions,
    registrationOverlay: program.registrationOverlay,
  })
  const watchedStructure = isFormEdit
    ? editForm.watch('educationStructure')
    : effectiveTypeFields.educationStructure
  const watchedSessionRound = isFormEdit
    ? editForm.watch('sessionRound')
    : effectiveTypeFields.sessionRound
  const watchedCurriculumSessions = isFormEdit ? editForm.watch('curriculumSessions') : undefined
  const isMultiRoundCurriculum = isGeneralProgramMultiRoundForTypeSettings({
    educationStructure: watchedStructure ?? effectiveTypeFields.educationStructure,
    sessionRound: watchedSessionRound ?? effectiveTypeFields.sessionRound,
    curriculumSessions: watchedCurriculumSessions ?? commonInfo.curriculumSessions ?? [],
  })

  const participantOrganization = isFormEdit
    ? editForm.watch('participantOrganization')
    : effectiveTypeFields.audience !== 'individual'
  const educationFormScheduleDetail =
    (isFormEdit ? editForm.watch('educationFormScheduleDetail') : undefined) ??
    commonInfo.educationFormScheduleDetail ??
    'common'
  const participationScheduleDetail =
    (isFormEdit ? editForm.watch('participationScheduleDetail') : undefined) ??
    commonInfo.participationScheduleDetail ??
    'common'
  const ipsScheduleDetail =
    (isFormEdit ? editForm.watch('ipsScheduleDetail') : undefined) ??
    commonInfo.ipsScheduleDetail ??
    'common'
  const multiCurriculumRowPlan = isMultiRoundCurriculum
    ? getProgramRegistrationCurriculumMultiSessionRowPlan(
        educationFormScheduleDetail,
        participationScheduleDetail,
        ipsScheduleDetail
      )
    : null
  const showEducationPerRound =
    isMultiRoundCurriculum && educationFormScheduleDetail === 'perSchedule'
  const showIpsPerRoundWithEducation = showEducationPerRound && ipsScheduleDetail === 'perSchedule'
  const showIpsOnlyPerRound =
    isMultiRoundCurriculum && multiCurriculumRowPlan === 'c_allCommon_piBothPer'
  const showIpsPerSession = !isMultiRoundCurriculum && ipsScheduleDetail === 'perSchedule'
  const individualCurriculumTableRows = participantOrganization
    ? undefined
    : getIndividualMultiRoundPerScheduleTableRows({
        educationFormScheduleDetail,
        participationScheduleDetail,
        ipsScheduleDetail,
      })
  const perScheduleEducationFormOptions = getProgramRegistrationEducationFormOptions(
    Boolean(participantOrganization),
    { context: 'perScheduleBlock' }
  )

  const { fields, append, remove } = useFieldArray({
    control: editForm.control,
    name: 'curriculumSessions',
  })

  const sessions: CurriculumSessionViewModel[] = isFormEdit
    ? fields.map((f, i) => {
        const educationForm = editForm.watch(`curriculumSessions.${i}.educationForm`) ?? 'online'
        const participationMethod =
          editForm.watch(`curriculumSessions.${i}.participationMethod`) ?? 'individual'
        const ipsCategory = editForm.watch(`curriculumSessions.${i}.ipsCategory`) ?? ''
        const ipsDetail = editForm.watch(`curriculumSessions.${i}.ipsDetail`) ?? ''
        const isPreEducation = isPreEducationCurriculumSession(f)
        return {
          sessionLabel: f.sessionLabel,
          title: editForm.watch(`curriculumSessions.${i}.title`) ?? '',
          description: editForm.watch(`curriculumSessions.${i}.description`) ?? '',
          assignmentEnabled: editForm.watch(`curriculumSessions.${i}.assignmentEnabled`) ?? false,
          assignmentPeriod: editForm.watch(`curriculumSessions.${i}.assignmentPeriod`) ?? '',
          educationFormLabel:
            isPreEducation || showEducationPerRound
              ? perScheduleEducationFormOptions.find(o => o.value === educationForm)?.label
              : undefined,
          participationMethodLabel: isPreEducation
            ? undefined
            : (PARTICIPATION_METHOD_LABELS[
                participationMethod as keyof typeof PARTICIPATION_METHOD_LABELS
              ] ?? PARTICIPATION_METHOD_LABELS.individual),
          ipsTypeSummary:
            (isPreEducation ||
              showIpsPerRoundWithEducation ||
              showIpsOnlyPerRound ||
              showIpsPerSession) &&
            ipsCategory
              ? buildSessionIpsTypeSummary(
                  ipsCategory as 'inspire' | 'prepare' | 'succeed',
                  ipsDetail
                )
              : undefined,
          scheduleDateLabel: editForm.watch(`curriculumSessions.${i}.scheduleDate`) ?? '',
        }
      })
    : (commonInfo.curriculumSessions ?? []).map(session => ({
        sessionLabel: session.sessionLabel,
        title: session.title,
        description: session.description,
        assignmentEnabled: session.assignmentEnabled ?? false,
        assignmentPeriod: session.assignmentPeriod ?? '',
        educationFormLabel: session.educationFormLabel,
        participationMethodLabel: session.participationMethodLabel,
        ipsTypeSummary: session.ipsTypeSummary,
        scheduleDateLabel: session.scheduleDateLabel,
      }))

  const curriculumPreEducation = isFormEdit
    ? (editForm.watch('scheduleCurriculumPreEducation') ?? false)
    : (commonInfo.scheduleCurriculumPreEducation ?? false)
  const sessionRoundKind: 'single' | 'multi' = isMultiRoundCurriculum ? 'multi' : 'single'

  useEffect(() => {
    if (!isFormEdit) return
    const current = editForm.getValues('curriculumSessions') ?? []
    if (current.length === 0) return
    const next = applyCurriculumPreEducationBlock(current, curriculumPreEducation, sessionRoundKind)
    if (curriculumSessionsPreEducationSyncEqual(current, next)) return
    editForm.setValue('curriculumSessions', next, { shouldDirty: true })
  }, [curriculumPreEducation, editForm, isFormEdit, sessionRoundKind, fields.length])

  if (watchedStructure === 'schedule') return null
  if (sessions.length === 0 && !isFormEdit) return null

  const formMode = isFormEdit ? 'edit' : 'view'

  const handleAddSession = () => {
    const current = editForm.getValues('curriculumSessions') ?? []
    const regularCount = current.filter(session => !isPreEducationCurriculumSession(session)).length
    if (isMultiRoundCurriculum) {
      append({
        sessionLabel: padCurriculumSessionLabel(regularCount, 'multi'),
        title: '1',
        description: '',
        assignmentEnabled: false,
        assignmentPeriod: '',
        educationForm: 'online',
        participationMethod: 'individual',
        ipsCategory: 'prepare',
        ipsDetail: 'none',
      })
      return
    }
    if (regularCount >= GENERAL_PROGRAM_CURRICULUM_MAX_SESSION_COUNT) return
    const values = editForm.getValues()
    const topIpsCategory = values.ipsCategory || 'prepare'
    const topIpsDetail = values.ipsDetail || (topIpsCategory === 'prepare' ? 'none' : '')
    append({
      sessionLabel: padCurriculumSessionLabel(regularCount, 'single'),
      title: '',
      description: '',
      assignmentEnabled: false,
      assignmentPeriod: '',
      educationForm: values.educationForm ?? 'online',
      ipsCategory: values.ipsScheduleDetail === 'perSchedule' ? topIpsCategory : '',
      ipsDetail: values.ipsScheduleDetail === 'perSchedule' ? topIpsDetail : '',
    })
  }

  const regularSessionCount = sessions.filter(
    session => !isPreEducationCurriculumSession(session)
  ).length
  const curriculumChartSessionAtMax =
    !isMultiRoundCurriculum && regularSessionCount >= GENERAL_PROGRAM_CURRICULUM_MAX_SESSION_COUNT

  const eventExtraPlan = getScheduleEventPerScheduleExtraPlan({
    educationFormScheduleDetail,
    participationScheduleDetail,
    ipsScheduleDetail,
    participantOrganization: Boolean(participantOrganization),
  })

  const regularSessionNos = sessions.reduce<number[]>((acc, session) => {
    const prev = acc.at(-1) ?? 0
    acc.push(isPreEducationCurriculumSession(session) ? prev : prev + 1)
    return acc
  }, [])
  const sessionBlocks = sessions.map((session, index) => {
    const isPreEducationBlock = isPreEducationCurriculumSession(session)
    const highlightSessionNo = regularSessionNos[index] ?? 0
    const canRemove =
      !isPreEducationBlock &&
      sessions.slice(0, index).some(earlier => !isPreEducationCurriculumSession(earlier))
    const blockKey = fields[index]?.id ?? session.sessionLabel ?? index
    if (isPreEducationBlock) {
      if (!isFormEdit) {
        return (
          <ScheduleEventDetailViewBlock
            key={blockKey}
            scheduleLabel={PRE_EDUCATION_SCHEDULE_LABEL}
            name={session.title || PRE_EDUCATION_SCHEDULE_LABEL}
            scheduleDateLabel={session.scheduleDateLabel}
            extraPlan={eventExtraPlan}
            educationFormLabel={session.educationFormLabel}
            ipsTypeSummary={session.ipsTypeSummary}
            isPreEducationBlock
            showHeading
          />
        )
      }
      return (
        <CurriculumPreEducationEventEditBlock
          key={blockKey}
          index={index}
          formMode={formMode}
          editForm={editForm}
        />
      )
    }
    return isMultiRoundCurriculum ? (
      <MultiRoundCurriculumSessionForm
        key={fields[index]?.id ?? session.sessionLabel ?? index}
        index={index}
        session={session}
        formMode={formMode}
        editForm={editForm}
        isFormEdit={isFormEdit}
        onRemove={() => remove(index)}
        showEducationPerRound={showEducationPerRound}
        showIpsPerRoundWithEducation={showIpsPerRoundWithEducation}
        showIpsOnlyPerRound={showIpsOnlyPerRound}
        showAssignment={!participantOrganization}
        educationFormOptions={perScheduleEducationFormOptions}
        individualTableRows={individualCurriculumTableRows}
        isPreEducationBlock={isPreEducationBlock}
        canRemove={canRemove}
        highlightSessionNo={highlightSessionNo}
        participationMethodLocked={participationMethodLocked}
      />
    ) : (
      <SingleRoundCurriculumSessionForm
        key={fields[index]?.id ?? session.sessionLabel ?? index}
        index={index}
        session={session}
        formMode={formMode}
        editForm={editForm}
        isFormEdit={isFormEdit}
        onRemove={() => remove(index)}
        showIpsPerSession={showIpsPerSession}
        isPreEducationBlock={isPreEducationBlock}
        canRemove={canRemove}
        highlightSessionNo={highlightSessionNo}
        showHeading={isPreEducationBlock || curriculumPreEducation || regularSessionCount > 1}
      />
    )
  })

  const curriculumMeta = PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationCurriculum

  return (
    <ProgramRegistrationDetailSection
      title={curriculumMeta.title}
      isFormEdit={isFormEdit}
      required
      highlightParagraphId={PROGRAM_REGISTRATION_IDS.educationCurriculum}
      editDescription={
        isMultiRoundCurriculum
          ? PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationCurriculum.editDescriptionMultiRound
          : curriculumMeta.editDescription
      }
      titleTrailing={
        isFormEdit ? (
          <div
            className="program-registration-paragraph__card-title-actions"
            onClick={e => e.stopPropagation()}
            onKeyDown={e => e.stopPropagation()}
            role="presentation"
          >
            <Controller
              name="scheduleCurriculumPreEducation"
              control={editForm.control}
              render={({ field }) => (
                <CmsToggle
                  label="사전 교육"
                  checked={field.value ?? false}
                  onChange={field.onChange}
                />
              )}
            />
            <CmsButton
              type="button"
              variant="secondary"
              size="medium"
              width={180}
              disabled={curriculumChartSessionAtMax}
              icon={<ButtonAddIcon aria-hidden />}
              onClick={handleAddSession}
            >
              {isMultiRoundCurriculum ? '강의 진행 회차 추가' : '강의 진행 차시 추가'}
            </CmsButton>
          </div>
        ) : undefined
      }
      bodyClassName="detail-common-info-view__section-body--curriculum"
    >
      {isFormEdit ? (
        <div className="program-registration-curriculum__sessions">{sessionBlocks}</div>
      ) : (
        sessionBlocks
      )}
    </ProgramRegistrationDetailSection>
  )
}

function ScheduleDetailViewBlock({
  scheduleLabel,
  name,
  progressTimeSummary,
  ipsPerSchedule = false,
  ipsTypeSummary,
}: {
  scheduleLabel: string
  name: string
  progressTimeSummary?: string
  ipsPerSchedule?: boolean
  ipsTypeSummary?: string
}) {
  return (
    <div className="program-registration-schedule-curriculum__block">
      <div className="program-registration-schedule-curriculum__session-heading">
        ■ {scheduleLabel}
      </div>
      <div className="program-registration-schedule-curriculum__session-panel">
        <DetailInfoForm
          title="교육 진행 (일정형)"
          hideHeader
          mode="view"
          className="program-registration-paragraph"
        >
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field label="일정명" fullRow view={name || '-'} />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="진행 시간"
              fullRow
              view={
                <PipeSeparatedInlineView
                  text={formatScheduleProgressTimeSummaryForView(progressTimeSummary)}
                />
              }
            />
          </DetailInfoForm.Row>
          {ipsPerSchedule ? (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="IPS 유형"
                fullRow
                view={<PipeSeparatedInlineView text={ipsTypeSummary} />}
              />
            </DetailInfoForm.Row>
          ) : null}
        </DetailInfoForm>
      </div>
    </div>
  )
}

function ScheduleEventPerScheduleExtraViewRows({
  extraPlan,
  educationFormLabel,
  participationMethodLabel,
  ipsTypeSummary,
  isPreEducationBlock = false,
  assignmentEnabled,
  assignmentPeriod,
}: {
  extraPlan: ScheduleEventPerScheduleExtraPlan
  educationFormLabel?: string
  participationMethodLabel?: string
  ipsTypeSummary?: string
  isPreEducationBlock?: boolean
  assignmentEnabled?: boolean
  assignmentPeriod?: string
}) {
  if (isPreEducationBlock) {
    return (
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field label="교육 형태" view={educationFormLabel?.trim() || '-'} />
        <DetailInfoForm.Field
          label="IPS 유형"
          view={<PipeSeparatedInlineView text={ipsTypeSummary || 'Prepare | 해당없음'} />}
        />
      </DetailInfoForm.Row>
    )
  }

  const assignmentField = (fullRow: boolean) => (
    <DetailInfoForm.Field
      label="과제 설정"
      fullRow={fullRow}
      view={
        <CurriculumAssignmentSettingView
          assignmentEnabled={assignmentEnabled}
          assignmentPeriod={assignmentPeriod}
        />
      }
    />
  )

  if (extraPlan.showAssignment) {
    return (
      <IndividualPerScheduleExtraRows
        rows={getIndividualMultiRoundPerScheduleTableRows({
          educationFormScheduleDetail: extraPlan.showEducation ? 'perSchedule' : 'common',
          participationScheduleDetail: extraPlan.showParticipation ? 'perSchedule' : 'common',
          ipsScheduleDetail: extraPlan.showIps ? 'perSchedule' : 'common',
        })}
        renderField={(field, options) => {
          if (field === 'assignment') return assignmentField(options.fullRow)
          if (field === 'education') {
            return (
              <DetailInfoForm.Field
                label="교육 형태"
                fullRow={options.fullRow}
                view={educationFormLabel?.trim() || '-'}
              />
            )
          }
          if (field === 'ips') {
            return (
              <DetailInfoForm.Field
                label="IPS 유형"
                fullRow={options.fullRow}
                view={<PipeSeparatedInlineView text={ipsTypeSummary} />}
              />
            )
          }
          return (
            <DetailInfoForm.Field
              label="참여 방식"
              fullRow={options.fullRow}
              view={participationMethodLabel?.trim() || '-'}
            />
          )
        }}
      />
    )
  }

  return (
    <>
      {extraPlan.showEducation && extraPlan.showIps ? (
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="교육 형태" view={educationFormLabel?.trim() || '-'} />
          <DetailInfoForm.Field
            label="IPS 유형"
            view={<PipeSeparatedInlineView text={ipsTypeSummary} />}
          />
        </DetailInfoForm.Row>
      ) : extraPlan.showEducation ? (
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육 형태"
            fullRow
            view={educationFormLabel?.trim() || '-'}
          />
        </DetailInfoForm.Row>
      ) : extraPlan.showIps ? (
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="IPS 유형"
            fullRow
            view={<PipeSeparatedInlineView text={ipsTypeSummary} />}
          />
        </DetailInfoForm.Row>
      ) : null}
    </>
  )
}

function ScheduleEventDetailViewBlock({
  scheduleLabel,
  name,
  scheduleDateLabel,
  assignmentEnabled,
  assignmentPeriod,
  extraPlan,
  educationFormLabel,
  participationMethodLabel,
  ipsTypeSummary,
  showHeading = true,
  isPreEducationBlock = false,
}: {
  scheduleLabel: string
  name: string
  scheduleDateLabel?: string
  assignmentEnabled?: boolean
  assignmentPeriod?: string
  extraPlan: ScheduleEventPerScheduleExtraPlan
  educationFormLabel?: string
  participationMethodLabel?: string
  ipsTypeSummary?: string
  showHeading?: boolean
  isPreEducationBlock?: boolean
}) {
  return (
    <div className="program-registration-schedule-curriculum__block">
      {showHeading ? (
        <div className="program-registration-schedule-curriculum__session-heading">
          ■ {isPreEducationBlock ? PRE_EDUCATION_SCHEDULE_LABEL : scheduleLabel}
        </div>
      ) : null}
      <div className="program-registration-schedule-curriculum__session-panel">
        <DetailInfoForm
          title="교육 진행 (일정형)"
          hideHeader
          mode="view"
          className="program-registration-paragraph"
        >
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field label="일정명" view={name || '-'} />
            <DetailInfoForm.Field label="진행 일정" view={scheduleDateLabel?.trim() || '-'} />
          </DetailInfoForm.Row>
          <ScheduleEventPerScheduleExtraViewRows
            extraPlan={extraPlan}
            educationFormLabel={educationFormLabel}
            participationMethodLabel={participationMethodLabel}
            ipsTypeSummary={ipsTypeSummary}
            isPreEducationBlock={isPreEducationBlock}
            assignmentEnabled={assignmentEnabled}
            assignmentPeriod={assignmentPeriod}
          />
        </DetailInfoForm>
      </div>
    </div>
  )
}

function ScheduleEventPerScheduleExtraEditRows({
  index,
  editForm,
  isPreEducationBlock,
  fieldArrayName = 'scheduleDetails',
  participationMethodLocked = false,
}: {
  index: number
  editForm: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
  isPreEducationBlock: boolean
  fieldArrayName?: 'scheduleDetails' | 'curriculumSessions'
  participationMethodLocked?: boolean
}) {
  const participantOrganization = editForm.watch('participantOrganization')
  const extraPlan = getScheduleEventPerScheduleExtraPlan({
    educationFormScheduleDetail: editForm.watch('educationFormScheduleDetail') ?? 'common',
    participationScheduleDetail: editForm.watch('participationScheduleDetail') ?? 'common',
    ipsScheduleDetail: editForm.watch('ipsScheduleDetail') ?? 'common',
    participantOrganization: Boolean(participantOrganization),
  })
  const perScheduleEducationFormOptions = getProgramRegistrationEducationFormOptions(
    Boolean(participantOrganization),
    { context: 'perScheduleBlock' }
  )
  const sessionIpsCategory = editForm.watch(`${fieldArrayName}.${index}.ipsCategory`) ?? ''
  const sessionIpsDetail = editForm.watch(`${fieldArrayName}.${index}.ipsDetail`) ?? ''
  const assignmentEnabled = editForm.watch(`scheduleDetails.${index}.assignmentEnabled`) ?? false

  const educationField = (fullRow?: boolean) => (
    <DetailInfoForm.Field
      label="교육 형태"
      fullRow={fullRow}
      edit={
        <Controller
          name={`${fieldArrayName}.${index}.educationForm`}
          control={editForm.control}
          render={({ field }) => (
            <CmsRadioGroup
              size="medium"
              value={field.value ?? 'online'}
              onChange={e => field.onChange(e.target.value)}
            >
              {perScheduleEducationFormOptions.map(opt => (
                <CmsRadio size="medium" key={opt.value} value={opt.value}>
                  {opt.label}
                </CmsRadio>
              ))}
            </CmsRadioGroup>
          )}
        />
      }
      view="-"
    />
  )

  const ipsField = (options?: { fullRow?: boolean; layout?: 'default' | 'inline' }) => (
    <DetailInfoForm.Field
      label="IPS 유형"
      fullRow={options?.fullRow}
      edit={
        <ProgramRegistrationIpsTypeFields
          layout={options?.layout}
          disabled={isPreEducationBlock}
          value={
            isPreEducationBlock
              ? { category: 'prepare', detail: 'none' }
              : { category: sessionIpsCategory, detail: sessionIpsDetail }
          }
          onChange={next => {
            if (isPreEducationBlock) return
            editForm.setValue(`${fieldArrayName}.${index}.ipsCategory`, next.category)
            editForm.setValue(`${fieldArrayName}.${index}.ipsDetail`, next.detail)
          }}
        />
      }
      view="-"
    />
  )

  if (isPreEducationBlock) {
    return (
      <DetailInfoForm.Row type="double">
        {educationField()}
        {ipsField({ layout: 'inline' })}
      </DetailInfoForm.Row>
    )
  }

  const assignmentField = (fullRow: boolean) => (
    <DetailInfoForm.Field
      label="과제 설정"
      fullRow={fullRow}
      view={
        <CurriculumAssignmentSettingView
          assignmentEnabled={assignmentEnabled}
          assignmentPeriod={editForm.watch(`scheduleDetails.${index}.assignmentPeriod`) ?? ''}
        />
      }
      edit={
        <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap program-registration-paragraph__assignment-row">
          <Controller
            name={`scheduleDetails.${index}.assignmentEnabled`}
            control={editForm.control}
            render={({ field }) => (
              <CmsRadioGroup
                size="medium"
                value={field.value ? 'yes' : 'no'}
                onChange={e => {
                  const enabled = e.target.value === 'yes'
                  field.onChange(enabled)
                  if (!enabled) {
                    editForm.setValue(`scheduleDetails.${index}.assignmentPeriod`, '')
                  }
                }}
              >
                <CmsRadio size="medium" value="yes">
                  있음
                </CmsRadio>
                <CmsRadio size="medium" value="no">
                  없음
                </CmsRadio>
              </CmsRadioGroup>
            )}
          />
          <DetailInfoForm.InputsSeparator />
          <Controller
            name={`scheduleDetails.${index}.assignmentPeriod`}
            control={editForm.control}
            render={({ field: periodField }) => {
              const appliedRange = parseEducationScheduleLineToRange(periodField.value)
              return (
                <ParagraphDatePicker
                  inputSize="small"
                  mode="single"
                  presetMode="period"
                  customizable={false}
                  suppressAutoTodayWhenEmpty
                  disabled={!assignmentEnabled}
                  value={appliedRange?.[0] ?? null}
                  onChange={() => {}}
                  appliedSurfaceRange={appliedRange}
                  onRangeChange={([start, end]) => {
                    periodField.onChange(formatEducationScheduleLineFromRange([start, end]))
                    if (!assignmentEnabled) {
                      editForm.setValue(`scheduleDetails.${index}.assignmentEnabled`, true)
                    }
                  }}
                  width={360}
                  placeholder="제출 기한을 설정해 주세요"
                />
              )
            }}
          />
        </div>
      }
    />
  )

  if (extraPlan.showAssignment) {
    return (
      <IndividualPerScheduleExtraRows
        rows={getIndividualMultiRoundPerScheduleTableRows({
          educationFormScheduleDetail: extraPlan.showEducation ? 'perSchedule' : 'common',
          participationScheduleDetail: extraPlan.showParticipation ? 'perSchedule' : 'common',
          ipsScheduleDetail: extraPlan.showIps ? 'perSchedule' : 'common',
        })}
        renderField={(field, options) => {
          if (field === 'assignment') return assignmentField(options.fullRow)
          if (field === 'education') return educationField(options.fullRow)
          if (field === 'ips') {
            return ipsField({ fullRow: options.fullRow, layout: options.layout })
          }
          return (
            <DetailInfoForm.Field
              label="참여 방식"
              fullRow={options.fullRow}
              edit={
                <Controller
                  name={`scheduleDetails.${index}.participationMethod`}
                  control={editForm.control}
                  render={({ field: radioField }) => (
                    <CmsRadioGroup
                      size="medium"
                      value={radioField.value ?? 'individual'}
                      disabled={participationMethodLocked}
                      onChange={e => radioField.onChange(e.target.value)}
                    >
                      <CmsRadio size="medium" value="individual">
                        개인
                      </CmsRadio>
                      <CmsRadio size="medium" value="team">
                        팀
                      </CmsRadio>
                    </CmsRadioGroup>
                  )}
                />
              }
              view="-"
            />
          )
        }}
      />
    )
  }

  return (
    <>
      {extraPlan.showEducation && extraPlan.showIps ? (
        <DetailInfoForm.Row type="double">
          {educationField()}
          {ipsField({ layout: 'inline' })}
        </DetailInfoForm.Row>
      ) : extraPlan.showEducation ? (
        <DetailInfoForm.Row type="single">{educationField(true)}</DetailInfoForm.Row>
      ) : extraPlan.showIps ? (
        <DetailInfoForm.Row type="single">{ipsField({ fullRow: true })}</DetailInfoForm.Row>
      ) : null}
    </>
  )
}

function ScheduleEventDetailEditBlock({
  index,
  scheduleLabel,
  formMode,
  editForm,
  onRemove,
  isPreEducationBlock = false,
  showHeading = true,
  canRemove = false,
  highlightScheduleNo,
  participationMethodLocked = false,
}: {
  index: number
  scheduleLabel: string
  formMode: 'view' | 'edit'
  editForm: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
  onRemove: () => void
  isPreEducationBlock?: boolean
  showHeading?: boolean
  canRemove?: boolean
  highlightScheduleNo: number
  participationMethodLocked?: boolean
}) {
  const headingLabel = isPreEducationBlock ? '사전 교육' : scheduleLabel
  const participantIndividual = Boolean(editForm.watch('participantIndividual'))
  const participantOrganization = Boolean(editForm.watch('participantOrganization'))
  const sessionRound = editForm.watch('sessionRound') === 'multi' ? 'multi' : 'single'

  return (
    <div className="program-registration-schedule-curriculum__block">
      {showHeading ? (
        <div className="program-registration-schedule-curriculum__session-heading">
          ■ {headingLabel}
        </div>
      ) : null}
      <div className="program-registration-curriculum__session-row">
        <div className="program-registration-schedule-curriculum__session-panel">
          <DetailInfoForm
            title="교육 진행 (일정형)"
            hideHeader
            mode={formMode}
            className="program-registration-paragraph"
          >
            <DetailInfoForm.Row type="double">
              <DetailInfoForm.Field
                label="일정명"
                validationKey={
                  isPreEducationBlock
                    ? SCHEDULE_PRE_EDUCATION_NAME_VALIDATION_KEY
                    : scheduleRegularDetailNameValidationKey(highlightScheduleNo)
                }
                edit={
                  <Controller
                    name={`scheduleDetails.${index}.name`}
                    control={editForm.control}
                    render={({ field }) => (
                      <CmsInput
                        {...field}
                        value={field.value ?? ''}
                        inputSize="small"
                        placeholder="행사 일정명을 작성하세요"
                        width="100%"
                        style={{ minWidth: 0, flex: '1 1 0' }}
                      />
                    )}
                  />
                }
                view="-"
              />
              <DetailInfoForm.Field
                label="진행 일정"
                validationKey={
                  isPreEducationBlock
                    ? SCHEDULE_PRE_EDUCATION_DATE_VALIDATION_KEY
                    : scheduleRegularDetailDateValidationKey(highlightScheduleNo)
                }
                edit={
                  <div className="detail-info-form-inputs-wrapper-no-gap">
                    <Controller
                      name={`scheduleDetails.${index}.scheduleDate`}
                      control={editForm.control}
                      render={({ field }) => {
                        const appliedRange = parseEducationScheduleLineToRange(field.value)
                        const appliedWithTime = Boolean(
                          appliedRange && educationScheduleRangeHasClock(appliedRange)
                        )
                        return (
                          <EducationProgressScheduleDatePicker
                            participantIndividual={participantIndividual}
                            participantOrganization={participantOrganization}
                            programType="schedule"
                            sessionRound={sessionRound}
                            value={appliedRange?.[0] ?? null}
                            onChange={() => {}}
                            onRangeChange={([start, end]) => {
                              field.onChange(formatEducationScheduleLineFromRange([start, end]))
                            }}
                            appliedSurfaceRange={educationScheduleAppliedSurfaceRange(appliedRange)}
                            appliedSurfaceWithTime={appliedWithTime}
                          />
                        )
                      }}
                    />
                  </div>
                }
                view="-"
              />
            </DetailInfoForm.Row>
            <ScheduleEventPerScheduleExtraEditRows
              index={index}
              editForm={editForm}
              isPreEducationBlock={isPreEducationBlock}
              participationMethodLocked={participationMethodLocked}
            />
          </DetailInfoForm>
        </div>
        {canRemove ? (
          <ItemDeleteButton
            className="item-delete-button program-registration-curriculum__session-delete"
            aria-label={`${scheduleLabel} 삭제`}
            onClick={event => {
              event.stopPropagation()
              onRemove()
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

function ScheduleDetailEditBlock({
  index,
  scheduleLabel,
  formMode,
  editForm,
  groupCount,
  sessionRound,
  ipsPerSchedule = false,
  isPreEducationBlock = false,
  onRemove,
  onRemoveGroup,
  highlightScheduleNo,
  participationMethodLocked = false,
}: {
  index: number
  scheduleLabel: string
  formMode: 'view' | 'edit'
  editForm: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
  groupCount: number
  sessionRound: 'single' | 'multi'
  ipsPerSchedule?: boolean
  isPreEducationBlock?: boolean
  onRemove: () => void
  onRemoveGroup: (groupIndex: number) => void
  highlightScheduleNo: number
  participationMethodLocked?: boolean
}) {
  const showGroupLabel = groupCount > 1
  const isSingleRound = sessionRound === 'single'
  const headingLabel = isPreEducationBlock ? '사전 교육' : scheduleLabel
  const participantOrganization = editForm.watch('participantOrganization')
  const perScheduleEducationFormOptions = getProgramRegistrationEducationFormOptions(
    Boolean(participantOrganization),
    { context: 'perScheduleBlock' }
  )
  const educationFormScheduleDetail = editForm.watch('educationFormScheduleDetail') ?? 'common'
  const participationScheduleDetail = editForm.watch('participationScheduleDetail') ?? 'common'
  const ipsScheduleDetail = editForm.watch('ipsScheduleDetail') ?? 'common'
  const multiRowPlan =
    sessionRound === 'multi'
      ? getProgramRegistrationCurriculumMultiSessionRowPlan(
          educationFormScheduleDetail,
          participationScheduleDetail,
          ipsScheduleDetail
        )
      : null
  const showEducationWithIpsPerBlock = isScheduleEducationAndIpsBothPerSchedule(
    educationFormScheduleDetail,
    ipsScheduleDetail
  )
  const perBlockLayoutPlan = getScheduleDetailPerBlockLayoutPlan(
    sessionRound,
    educationFormScheduleDetail,
    ipsScheduleDetail
  )
  const sessionIpsCategory = editForm.watch(`scheduleDetails.${index}.ipsCategory`) ?? ''
  const sessionIpsDetail = editForm.watch(`scheduleDetails.${index}.ipsDetail`) ?? ''
  const assignmentEnabled = editForm.watch(`scheduleDetails.${index}.assignmentEnabled`) ?? false
  const showParticipationMethod = !participantOrganization

  const renderGroupTimeField = () => (
    <div className="program-registration-schedule-curriculum__time-groups">
      {Array.from({ length: groupCount }, (_, groupIndex) => {
        const letter = scheduleGroupLetter(groupIndex)
        return (
          <Fragment key={`${index}-${letter}`}>
            {groupIndex > 0 ? <DetailInfoForm.InputsSeparator /> : null}
            <div className="program-registration-schedule-curriculum__time-group">
              {showGroupLabel ? `그룹 ${letter}` : null}
              <div className="program-registration-schedule-curriculum__time-group-control">
                <Controller
                  name={`scheduleDetails.${index}.groupTimes.${groupIndex}`}
                  control={editForm.control}
                  render={({ field }) => {
                    const start = scheduleTimeStringToDayjs(field.value?.startTime)
                    const end = scheduleTimeStringToDayjs(field.value?.endTime)
                    return (
                      <ParagraphTimePicker
                        inputSize="small"
                        endTimeAlwaysOn
                        placeholder="시간 선택"
                        width={200}
                        value={start}
                        initialTimeRange={start && end ? [start, end] : null}
                        onTimeRangeChange={range => {
                          field.onChange({
                            startTime: range[0].format('HH:mm'),
                            endTime: range[1].format('HH:mm'),
                          })
                        }}
                      />
                    )
                  }}
                />
                {groupIndex > 0 ? (
                  <ItemDeleteButton
                    className="item-delete-button"
                    aria-label={`그룹 ${letter} 삭제`}
                    onClick={event => {
                      event.stopPropagation()
                      onRemoveGroup(groupIndex)
                    }}
                  />
                ) : null}
              </div>
            </div>
          </Fragment>
        )
      })}
    </div>
  )

  const renderAssignmentFieldEdit = () => (
    <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap program-registration-paragraph__assignment-row">
      <Controller
        name={`scheduleDetails.${index}.assignmentEnabled`}
        control={editForm.control}
        render={({ field }) => (
          <CmsRadioGroup
            size="medium"
            value={field.value ? 'yes' : 'no'}
            onChange={e => {
              const enabled = e.target.value === 'yes'
              field.onChange(enabled)
              if (!enabled) {
                editForm.setValue(`scheduleDetails.${index}.assignmentPeriod`, '')
              }
            }}
          >
            <CmsRadio size="medium" value="yes">
              있음
            </CmsRadio>
            <CmsRadio size="medium" value="no">
              없음
            </CmsRadio>
          </CmsRadioGroup>
        )}
      />
      <DetailInfoForm.InputsSeparator />
      <Controller
        name={`scheduleDetails.${index}.assignmentPeriod`}
        control={editForm.control}
        render={({ field: periodField }) => {
          const appliedRange = parseEducationScheduleLineToRange(periodField.value)
          return (
            <ParagraphDatePicker
              inputSize="small"
              mode="single"
              presetMode="period"
              customizable={false}
              suppressAutoTodayWhenEmpty
              disabled={!assignmentEnabled}
              value={appliedRange?.[0] ?? null}
              onChange={() => {}}
              appliedSurfaceRange={appliedRange}
              onRangeChange={([start, end]) => {
                periodField.onChange(formatEducationScheduleLineFromRange([start, end]))
                if (!assignmentEnabled) {
                  editForm.setValue(`scheduleDetails.${index}.assignmentEnabled`, true)
                }
              }}
              width={360}
              placeholder="제출 기한을 설정해 주세요"
            />
          )
        }}
      />
    </div>
  )

  const renderEducationFormField = () => (
    <DetailInfoForm.Field
      label="교육 형태"
      edit={
        <Controller
          name={`scheduleDetails.${index}.educationForm`}
          control={editForm.control}
          render={({ field }) => (
            <CmsRadioGroup
              size="medium"
              value={field.value ?? 'online'}
              onChange={e => field.onChange(e.target.value)}
            >
              {perScheduleEducationFormOptions.map(opt => (
                <CmsRadio size="medium" key={opt.value} value={opt.value}>
                  {opt.label}
                </CmsRadio>
              ))}
            </CmsRadioGroup>
          )}
        />
      }
      view="-"
    />
  )

  const renderIpsFormField = (options?: {
    fullRow?: boolean
    layout?: 'default' | 'inline'
    disabled?: boolean
  }) => (
    <DetailInfoForm.Field
      label="IPS 유형"
      fullRow={options?.fullRow}
      validationKey={
        isPreEducationBlock ? undefined : scheduleRegularDetailIpsValidationKey(highlightScheduleNo)
      }
      edit={
        <ProgramRegistrationIpsTypeFields
          layout={options?.layout}
          disabled={options?.disabled || isPreEducationBlock}
          value={
            options?.disabled || isPreEducationBlock
              ? { category: 'prepare', detail: 'none' }
              : { category: sessionIpsCategory, detail: sessionIpsDetail }
          }
          onChange={next => {
            if (options?.disabled || isPreEducationBlock) return
            editForm.setValue(`scheduleDetails.${index}.ipsCategory`, next.category)
            editForm.setValue(`scheduleDetails.${index}.ipsDetail`, next.detail)
          }}
        />
      }
      view="-"
    />
  )

  const renderPerBlockLayoutRows = () => {
    if (perBlockLayoutPlan === 'none') return null
    const showAssignment = !participantOrganization

    if (perBlockLayoutPlan === 'assignment_education_then_ips') {
      if (!showAssignment) {
        return (
          <DetailInfoForm.Row type="double">
            {renderEducationFormField()}
            {renderIpsFormField({ layout: 'inline' })}
          </DetailInfoForm.Row>
        )
      }
      return (
        <>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field label="과제 설정" edit={renderAssignmentFieldEdit()} view="-" />
            {renderEducationFormField()}
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            {renderIpsFormField({ fullRow: true })}
          </DetailInfoForm.Row>
        </>
      )
    }

    if (perBlockLayoutPlan === 'assignment_with_education') {
      if (!showAssignment) {
        return <DetailInfoForm.Row type="single">{renderEducationFormField()}</DetailInfoForm.Row>
      }
      return (
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="과제 설정" edit={renderAssignmentFieldEdit()} view="-" />
          {renderEducationFormField()}
        </DetailInfoForm.Row>
      )
    }

    if (perBlockLayoutPlan === 'assignment_with_ips') {
      if (!showAssignment) {
        return (
          <DetailInfoForm.Row type="single">
            {renderIpsFormField({ fullRow: true })}
          </DetailInfoForm.Row>
        )
      }
      return (
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="과제 설정" edit={renderAssignmentFieldEdit()} view="-" />
          {renderIpsFormField({ layout: 'inline' })}
        </DetailInfoForm.Row>
      )
    }

    return null
  }

  const renderParticipationRows = () => {
    if (!isSingleRound && sessionRound === 'multi' && multiRowPlan != null) {
      if (multiRowPlan === 'c_allCommon_piBothPer') {
        if (
          !showParticipationMethod ||
          shouldHideCurriculumParticipationRowForCommonEduPartWithIpsPerSchedule(
            educationFormScheduleDetail,
            participationScheduleDetail,
            ipsScheduleDetail
          )
        ) {
          return null
        }
        return (
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="참여 방식"
              edit={
                <Controller
                  name={`scheduleDetails.${index}.participationMethod`}
                  control={editForm.control}
                  render={({ field }) => (
                    <CmsRadioGroup
                      size="medium"
                      value={field.value ?? 'individual'}
                      disabled={participationMethodLocked}
                      onChange={e => field.onChange(e.target.value)}
                    >
                      <CmsRadio size="medium" value="individual">
                        개인
                      </CmsRadio>
                      <CmsRadio size="medium" value="team">
                        팀
                      </CmsRadio>
                    </CmsRadioGroup>
                  )}
                />
              }
              view="-"
            />
          </DetailInfoForm.Row>
        )
      }

      if (showParticipationMethod && multiRowPlan === 'c_allCommon_piPartPerOnly') {
        return (
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="참여 방식"
              edit={
                <Controller
                  name={`scheduleDetails.${index}.participationMethod`}
                  control={editForm.control}
                  render={({ field }) => (
                    <CmsRadioGroup
                      size="medium"
                      value={field.value ?? 'individual'}
                      disabled={participationMethodLocked}
                      onChange={e => field.onChange(e.target.value)}
                    >
                      <CmsRadio size="medium" value="individual">
                        개인
                      </CmsRadio>
                      <CmsRadio size="medium" value="team">
                        팀
                      </CmsRadio>
                    </CmsRadioGroup>
                  )}
                />
              }
              view="-"
            />
          </DetailInfoForm.Row>
        )
      }

      if (
        multiRowPlan === 'p_eduPer_piAnyPer' &&
        participationScheduleDetail === 'perSchedule' &&
        showParticipationMethod
      ) {
        if (showEducationWithIpsPerBlock) {
          return (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="참여 방식"
                edit={
                  <Controller
                    name={`scheduleDetails.${index}.participationMethod`}
                    control={editForm.control}
                    render={({ field }) => (
                      <CmsRadioGroup
                        size="medium"
                        value={field.value ?? 'individual'}
                        disabled={participationMethodLocked}
                        onChange={e => field.onChange(e.target.value)}
                      >
                        <CmsRadio size="medium" value="individual">
                          개인
                        </CmsRadio>
                        <CmsRadio size="medium" value="team">
                          팀
                        </CmsRadio>
                      </CmsRadioGroup>
                    )}
                  />
                }
                view="-"
              />
            </DetailInfoForm.Row>
          )
        }

        if (educationFormScheduleDetail === 'perSchedule') {
          return (
            <DetailInfoForm.Row type="double">
              {renderEducationFormField()}
              <DetailInfoForm.Field
                label="참여 방식"
                edit={
                  <Controller
                    name={`scheduleDetails.${index}.participationMethod`}
                    control={editForm.control}
                    render={({ field }) => (
                      <CmsRadioGroup
                        size="medium"
                        value={field.value ?? 'individual'}
                        disabled={participationMethodLocked}
                        onChange={e => field.onChange(e.target.value)}
                      >
                        <CmsRadio size="medium" value="individual">
                          개인
                        </CmsRadio>
                        <CmsRadio size="medium" value="team">
                          팀
                        </CmsRadio>
                      </CmsRadioGroup>
                    )}
                  />
                }
                view="-"
              />
            </DetailInfoForm.Row>
          )
        }
      }
    }

    return null
  }

  return (
    <div className="program-registration-schedule-curriculum__block">
      <div className="program-registration-schedule-curriculum__session-heading">
        ■ {headingLabel}
      </div>
      <div className="program-registration-curriculum__session-row">
        <div className="program-registration-schedule-curriculum__session-panel">
          <DetailInfoForm
            title="교육 진행 (일정형)"
            hideHeader
            mode={formMode}
            className="program-registration-paragraph"
          >
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label={groupCount > 1 ? '일정명' : '일정 상세'}
                fullRow
                validationKey={
                  isPreEducationBlock
                    ? SCHEDULE_PRE_EDUCATION_NAME_VALIDATION_KEY
                    : scheduleRegularDetailNameValidationKey(highlightScheduleNo)
                }
                edit={
                  <Controller
                    name={`scheduleDetails.${index}.name`}
                    control={editForm.control}
                    render={({ field }) => (
                      <CmsInput
                        {...field}
                        value={field.value ?? ''}
                        inputSize="small"
                        placeholder={
                          groupCount > 1
                            ? '세부 일정명을 작성하세요'
                            : '일정 상세 내용을 작성하세요'
                        }
                        width="100%"
                        style={{ minWidth: 0, flex: '1 1 0' }}
                      />
                    )}
                  />
                }
                view="-"
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="진행 시간"
                fullRow
                validationKey={scheduleRegularDetailGroupTimesValidationKey(highlightScheduleNo)}
                edit={renderGroupTimeField()}
                view="-"
              />
            </DetailInfoForm.Row>
            {isSingleRound && ipsPerSchedule ? (
              <DetailInfoForm.Row type="single">
                {renderIpsFormField({ fullRow: true, disabled: isPreEducationBlock })}
              </DetailInfoForm.Row>
            ) : null}
            {!isSingleRound ? (
              <>
                {renderPerBlockLayoutRows()}
                {renderParticipationRows()}
              </>
            ) : null}
          </DetailInfoForm>
        </div>
        {index > 0 ? (
          <ItemDeleteButton
            className="item-delete-button program-registration-curriculum__session-delete"
            aria-label={`${scheduleLabel} 삭제`}
            onClick={event => {
              event.stopPropagation()
              onRemove()
            }}
          />
        ) : null}
      </div>
    </div>
  )
}

function ScheduleProgressEditSection({
  editForm,
  scheduleMeta,
  participationMethodLocked = false,
}: {
  editForm: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
  scheduleMeta: (typeof PROGRAM_REGISTRATION_GENERAL_SECTION_META)['educationScheduleCurriculum']
  participationMethodLocked?: boolean
}) {
  const formMode = 'edit' as const
  const sessionRound = editForm.watch('sessionRound') ?? 'single'
  const educationFormScheduleDetail = editForm.watch('educationFormScheduleDetail') ?? 'common'
  const participationScheduleDetail = editForm.watch('participationScheduleDetail') ?? 'common'
  const ipsScheduleDetail = editForm.watch('ipsScheduleDetail') ?? 'common'
  const isMultiRound = sessionRound === 'multi'
  const participantOrganization = editForm.watch('participantOrganization')
  const multiAllPer = shouldUseScheduleEventBlockLayout({
    sessionRound,
    participantOrganization,
    educationFormScheduleDetail,
    participationScheduleDetail,
    ipsScheduleDetail,
  })
  const blockKind: 'sub' | 'event' = multiAllPer ? 'event' : 'sub'
  const scheduleCurriculumPreEducation = editForm.watch('scheduleCurriculumPreEducation') ?? false
  const educationScheduleMode = editForm.watch('educationScheduleMode') ?? 'date'
  const allowProgressGroupAdd = shouldAllowScheduleProgressGroupAdd({
    sessionRound,
    educationScheduleMode,
  })

  const { fields, append, remove } = useFieldArray({
    control: editForm.control,
    name: 'scheduleDetails',
  })

  const scheduleGroupCount = Math.min(
    Math.max(1, editForm.watch('scheduleGroupCount') ?? 1),
    PROGRAM_REGISTRATION_SCHEDULE_CURRICULUM_MAX_GROUP_COUNT
  )
  const effectiveScheduleGroupCount = isMultiRound ? 1 : scheduleGroupCount

  useEffect(() => {
    const details = editForm.getValues('scheduleDetails') ?? []
    if (details.length === 0) return
    const next = applySchedulePreEducationBlock(details, scheduleCurriculumPreEducation, {
      groupCount: effectiveScheduleGroupCount,
    })
    if (scheduleDetailsPreEducationSyncEqual(details, next)) return
    editForm.setValue('scheduleDetails', next, { shouldDirty: true })
  }, [editForm, scheduleCurriculumPreEducation, fields.length, effectiveScheduleGroupCount])

  useEffect(() => {
    if (!multiAllPer) return
    const details = editForm.getValues('scheduleDetails') ?? []
    if (details.length === 0) return
    const next = coerceScheduleDetailsToEventLayout(details)
    const unchanged =
      details.length === next.length &&
      details.every(
        (detail, index) =>
          detail.blockKind === next[index]?.blockKind &&
          detail.scheduleLabel === next[index]?.scheduleLabel
      )
    if (unchanged) return
    editForm.setValue('scheduleDetails', next, { shouldDirty: true })
  }, [editForm, fields.length, multiAllPer])

  const handleAddGroup = useCallback(() => {
    if (
      isMultiRound ||
      multiAllPer ||
      !allowProgressGroupAdd ||
      scheduleGroupCount >= PROGRAM_REGISTRATION_SCHEDULE_CURRICULUM_MAX_GROUP_COUNT
    ) {
      return
    }
    const nextCount = scheduleGroupCount + 1
    editForm.setValue('scheduleGroupCount', nextCount, { shouldDirty: true })
    const details = editForm.getValues('scheduleDetails') ?? []
    editForm.setValue(
      'scheduleDetails',
      details.map(detail => ({
        ...detail,
        groupTimes: [...detail.groupTimes, { startTime: '', endTime: '' }],
      })),
      { shouldDirty: true }
    )
  }, [allowProgressGroupAdd, editForm, isMultiRound, multiAllPer, scheduleGroupCount])

  const handleRemoveGroup = useCallback(
    (groupIndex: number) => {
      if (isMultiRound || multiAllPer || groupIndex <= 0 || scheduleGroupCount <= 1) return
      const nextCount = scheduleGroupCount - 1
      editForm.setValue('scheduleGroupCount', nextCount, { shouldDirty: true })
      const details = editForm.getValues('scheduleDetails') ?? []
      editForm.setValue(
        'scheduleDetails',
        details.map(detail => ({
          ...detail,
          groupTimes: detail.groupTimes.filter((_, index) => index !== groupIndex),
        })),
        { shouldDirty: true }
      )
    },
    [editForm, isMultiRound, multiAllPer, scheduleGroupCount]
  )

  const handleAddDetail = useCallback(() => {
    const details = editForm.getValues('scheduleDetails') ?? []
    const eventCount = details.filter(d => !isPreEducationScheduleBlock(d)).length
    append(
      createEmptyScheduleDetailBlock(eventCount, {
        blockKind,
        groupCount: effectiveScheduleGroupCount,
      })
    )
  }, [append, blockKind, editForm, effectiveScheduleGroupCount])

  const handleRemoveDetail = useCallback(
    (index: number) => {
      remove(index)
      const details = editForm.getValues('scheduleDetails') ?? []
      editForm.setValue('scheduleDetails', relabelScheduleDetailFormRows(details), {
        shouldDirty: true,
      })
    },
    [editForm, remove]
  )

  const editDescription = multiAllPer
    ? scheduleMeta.editDescriptionMultiRoundEvent
    : isMultiRound
      ? scheduleMeta.editDescriptionMultiRound
      : scheduleMeta.editDescription

  return (
    <ProgramRegistrationDetailSection
      title={scheduleMeta.title}
      isFormEdit
      required
      highlightParagraphId={PROGRAM_REGISTRATION_IDS.educationCurriculum}
      editDescription={editDescription}
      titleTrailing={
        <div
          className="program-registration-paragraph__card-title-actions"
          onClick={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}
          role="presentation"
        >
          <Controller
            name="scheduleCurriculumPreEducation"
            control={editForm.control}
            render={({ field }) => (
              <CmsToggle
                label="사전 교육"
                checked={field.value ?? false}
                onChange={field.onChange}
              />
            )}
          />
          {multiAllPer ? (
            <CmsButton
              type="button"
              variant="secondary"
              size="medium"
              width={160}
              icon={<ButtonAddIcon aria-hidden />}
              onClick={handleAddDetail}
            >
              강의 행사 일정 추가
            </CmsButton>
          ) : isMultiRound || !allowProgressGroupAdd ? (
            <CmsButton
              type="button"
              variant="secondary"
              size="medium"
              width={160}
              icon={<ButtonAddIcon aria-hidden />}
              onClick={handleAddDetail}
            >
              강의 세부 일정 추가
            </CmsButton>
          ) : (
            <>
              <CmsButton
                type="button"
                variant="secondary"
                size="medium"
                width={160}
                disabled={
                  scheduleGroupCount >= PROGRAM_REGISTRATION_SCHEDULE_CURRICULUM_MAX_GROUP_COUNT
                }
                icon={<ButtonClockIcon />}
                onClick={handleAddGroup}
              >
                진행 그룹 구분 추가
              </CmsButton>
              <CmsButton
                type="button"
                variant="secondary"
                size="medium"
                width={160}
                icon={<ButtonAddIcon aria-hidden />}
                onClick={handleAddDetail}
              >
                강의 세부 일정 추가
              </CmsButton>
            </>
          )}
        </div>
      }
      bodyClassName="detail-common-info-view__section-body--schedule-curriculum"
    >
      {fields.map((field, index) => {
        const detailBlockKind =
          editForm.watch(`scheduleDetails.${index}.blockKind`) ??
          inferScheduleDetailBlockKind(
            editForm.watch(`scheduleDetails.${index}.scheduleLabel`) ?? ''
          )
        const scheduleLabel =
          editForm.watch(`scheduleDetails.${index}.scheduleLabel`) ??
          (detailBlockKind === 'preEducation'
            ? PRE_EDUCATION_SCHEDULE_LABEL
            : detailBlockKind === 'event'
              ? padEventScheduleLabel(index)
              : padScheduleDetailLabel(index))
        const isPreEducationBlock = detailBlockKind === 'preEducation'
        const highlightScheduleNo = isPreEducationBlock
          ? 0
          : fields.reduce((count, _, earlierIndex) => {
              if (earlierIndex > index) return count
              const earlierKind =
                editForm.watch(`scheduleDetails.${earlierIndex}.blockKind`) ??
                inferScheduleDetailBlockKind(
                  editForm.watch(`scheduleDetails.${earlierIndex}.scheduleLabel`) ?? ''
                )
              return earlierKind === 'preEducation' ? count : count + 1
            }, 0)
        const hasEarlierEvent = fields.some((_, earlierIndex) => {
          if (earlierIndex >= index) return false
          const earlierKind =
            editForm.watch(`scheduleDetails.${earlierIndex}.blockKind`) ??
            inferScheduleDetailBlockKind(
              editForm.watch(`scheduleDetails.${earlierIndex}.scheduleLabel`) ?? ''
            )
          return earlierKind === 'event'
        })

        if (detailBlockKind === 'event' || isPreEducationBlock) {
          return (
            <ScheduleEventDetailEditBlock
              key={field.id}
              index={index}
              scheduleLabel={scheduleLabel}
              formMode={formMode}
              editForm={editForm}
              onRemove={() => handleRemoveDetail(index)}
              isPreEducationBlock={isPreEducationBlock}
              showHeading={fields.length > 1 || isPreEducationBlock}
              canRemove={detailBlockKind === 'event' && hasEarlierEvent}
              highlightScheduleNo={highlightScheduleNo}
              participationMethodLocked={participationMethodLocked}
            />
          )
        }

        return (
          <ScheduleDetailEditBlock
            key={field.id}
            index={index}
            scheduleLabel={scheduleLabel}
            formMode={formMode}
            editForm={editForm}
            groupCount={effectiveScheduleGroupCount}
            sessionRound={sessionRound}
            ipsPerSchedule={ipsScheduleDetail === 'perSchedule'}
            isPreEducationBlock={scheduleCurriculumPreEducation && index === 0}
            onRemove={() => handleRemoveDetail(index)}
            onRemoveGroup={handleRemoveGroup}
            highlightScheduleNo={highlightScheduleNo}
            participationMethodLocked={participationMethodLocked}
          />
        )
      })}
    </ProgramRegistrationDetailSection>
  )
}

function ScheduleProgressSection({
  program,
  commonInfo,
  isEditMode = false,
  form,
}: {
  program: Program
  commonInfo: ReturnType<typeof resolveGeneralProgramCommonInfo>
  isEditMode?: boolean
  form?: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
}) {
  const isFormEdit = isEditMode && !!form
  const effectiveTypeFields = resolveEffectiveGeneralProgramTypeFields({
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    curriculumSessions: commonInfo.curriculumSessions,
    registrationOverlay: program.registrationOverlay,
  })
  const watchedStructure = isFormEdit
    ? form!.watch('educationStructure')
    : effectiveTypeFields.educationStructure

  if (watchedStructure !== 'schedule') return null

  const scheduleDetailsView = isFormEdit
    ? (commonInfo.scheduleDetails ?? [])
    : resolveGeneralProgramScheduleDetailsForView(program, commonInfo)
  if (scheduleDetailsView.length === 0 && !isFormEdit) return null

  const scheduleMeta = PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationScheduleCurriculum

  if (isFormEdit && form) {
    const scheduleSectionKey = [
      form.watch('sessionRound'),
      form.watch('educationFormScheduleDetail'),
      form.watch('participationScheduleDetail'),
      form.watch('ipsScheduleDetail'),
      form.watch('scheduleCurriculumPreEducation'),
    ].join('-')
    return (
      <ScheduleProgressEditSection
        key={scheduleSectionKey}
        editForm={form}
        scheduleMeta={scheduleMeta}
        participationMethodLocked={!isProgramStructureEditPeriodOpen(program)}
      />
    )
  }

  const ipsScheduleDetail =
    commonInfo.ipsScheduleDetail ??
    (commonInfo.ipsTypeSummary?.includes('별') ? 'perSchedule' : 'common')
  const ipsPerSchedule = ipsScheduleDetail === 'perSchedule'
  const eventExtraPlan = getScheduleEventPerScheduleExtraPlan({
    educationFormScheduleDetail: commonInfo.educationFormScheduleDetail ?? 'common',
    participationScheduleDetail: commonInfo.participationScheduleDetail ?? 'common',
    ipsScheduleDetail,
    participantOrganization: program.generalProgramAudience === 'organization',
  })
  const useEventLayout = shouldUseScheduleEventBlockLayout({
    sessionRound: effectiveTypeFields.sessionRound,
    participantOrganization: program.generalProgramAudience === 'organization',
    educationFormScheduleDetail: commonInfo.educationFormScheduleDetail ?? 'common',
    participationScheduleDetail: commonInfo.participationScheduleDetail ?? 'common',
    ipsScheduleDetail,
  })

  return (
    <ProgramRegistrationDetailSection
      title={scheduleMeta.title}
      bodyClassName="detail-common-info-view__section-body--schedule-curriculum"
    >
      {scheduleDetailsView.map((detail, index) => {
        const detailBlockKind = inferScheduleDetailBlockKind(detail.scheduleLabel)
        const isPreEducationBlock = detailBlockKind === 'preEducation'
        const eventIndex = scheduleDetailsView
          .slice(0, index)
          .filter(row => inferScheduleDetailBlockKind(row.scheduleLabel) !== 'preEducation').length
        const isEventSchedule = isPreEducationBlock || useEventLayout || detailBlockKind === 'event'
        const overlayIndex = overlayIpsIndexForScheduleDetail(scheduleDetailsView, index)
        const ipsTypeSummary = resolveScheduleDetailIpsTypeSummaryForView({
          ipsPerSchedule,
          ipsTypeSummary: detail.ipsTypeSummary,
          overlay: program.registrationOverlay,
          overlayIndex,
        })
        const educationFormLabel = resolveScheduleDetailEducationFormLabelForView({
          educationFormLabel: detail.educationFormLabel,
          overlay: program.registrationOverlay,
          overlayIndex,
        })
        if (isEventSchedule) {
          return (
            <ScheduleEventDetailViewBlock
              key={detail.scheduleLabel}
              scheduleLabel={
                isPreEducationBlock
                  ? PRE_EDUCATION_SCHEDULE_LABEL
                  : useEventLayout
                    ? padEventScheduleLabel(eventIndex)
                    : detail.scheduleLabel
              }
              name={detail.name}
              scheduleDateLabel={detail.scheduleDateLabel}
              assignmentEnabled={detail.assignmentEnabled}
              assignmentPeriod={detail.assignmentPeriod}
              extraPlan={eventExtraPlan}
              educationFormLabel={educationFormLabel}
              participationMethodLabel={detail.participationMethodLabel}
              ipsTypeSummary={ipsTypeSummary}
              showHeading={scheduleDetailsView.length > 1 || isPreEducationBlock}
              isPreEducationBlock={isPreEducationBlock}
            />
          )
        }
        return (
          <ScheduleDetailViewBlock
            key={detail.scheduleLabel}
            scheduleLabel={detail.scheduleLabel}
            name={detail.name}
            progressTimeSummary={
              detail.progressTimeSummary?.trim() ||
              resolveScheduleDetailProgressTimeSummaryForView({
                overlay: program.registrationOverlay as Record<string, unknown> | undefined,
                overlayIndex,
              }) ||
              '-'
            }
            ipsPerSchedule={ipsPerSchedule}
            ipsTypeSummary={ipsTypeSummary}
          />
        )
      })}
    </ProgramRegistrationDetailSection>
  )
}

function ScheduleSettingsEditFields({
  form,
}: {
  form: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
}) {
  const [singleDate, setSingleDate] = useState<Dayjs | null>(null)
  const [periodDate, setPeriodDate] = useState<Dayjs | null>(null)
  const swapScheduleLinesForMode = useEducationScheduleModeLineStash()

  const lines = form.watch('educationScheduleLines') ?? []
  const scheduleMode = form.watch('educationScheduleMode') ?? 'date'
  const educationStructure = form.watch('educationStructure')
  const sessionRound = form.watch('sessionRound')
  const participantOrganization = form.watch('participantOrganization')
  const autoFillFromScheduleGroupTimes = shouldAutoFillEducationScheduleFromGroupTimes({
    educationStructure: educationStructure === 'schedule' ? 'schedule' : 'curriculum',
    sessionRound: sessionRound === 'multi' ? 'multi' : 'single',
  })
  const educationStructureKind = educationStructure === 'schedule' ? 'schedule' : 'curriculum'
  const lockDateMode = shouldLockEducationScheduleDateMode({
    participantOrganization: Boolean(participantOrganization),
    educationStructure: educationStructureKind,
    sessionRound: sessionRound === 'multi' ? 'multi' : 'single',
  })
  const disableSchedulePeriodTime = shouldDisableEducationSchedulePeriodTimeInput({
    educationScheduleMode: scheduleMode,
  })
  const scheduleSelectionPickerProps = getEducationScheduleSelectionDatePickerProps({
    educationStructure: educationStructureKind,
    participantOrganization: Boolean(participantOrganization),
    sessionRound: sessionRound === 'multi' ? 'multi' : 'single',
    scheduleMode,
  })
  const autoFillDatePicker = autoFillFromScheduleGroupTimes && scheduleMode === 'date'
  const previewScheduleLines = useMemo(
    () =>
      disableSchedulePeriodTime
        ? lines.map(line => normalizeEducationSchedulePeriodLineDateOnly(line)).filter(Boolean)
        : lines,
    [disableSchedulePeriodTime, lines]
  )
  const resolveGroupTimeSlots = useCallback(() => {
    const details = form.getValues('scheduleDetails') ?? []
    return resolveEducationScheduleGroupTimeSlots({
      scheduleDetails: details,
      overlay: getProgramRegistrationOverlayRecord(),
    })
  }, [form])

  const groupTimeSlotsKey = JSON.stringify(resolveGroupTimeSlots())

  useEffect(() => {
    if (!autoFillDatePicker) return
    const slots = resolveGroupTimeSlots()
    if (slots.length === 0) return
    const current = form.getValues('educationScheduleLines') ?? []
    if (current.length === 0) return
    const next = rebuildEducationScheduleLinesFromGroupTimes(current, slots)
    if (educationScheduleLinesEqual(current, next)) return
    form.setValue('educationScheduleLines', next, { shouldDirty: true })
  }, [autoFillDatePicker, form, groupTimeSlotsKey, resolveGroupTimeSlots])

  useEffect(() => {
    if (scheduleMode !== 'period') return
    const current = form.getValues('educationScheduleLines') ?? []
    const next = current.map(normalizeEducationSchedulePeriodLineDateOnly).filter(Boolean)
    if (educationScheduleLinesEqual(current, next)) return
    form.setValue('educationScheduleLines', next, { shouldDirty: true })
  }, [form, lines, scheduleMode])

  useEffect(() => {
    if (!lockDateMode) return
    const currentMode = form.getValues('educationScheduleMode') ?? 'date'
    if (currentMode === 'date') return
    const nextLines = swapScheduleLinesForMode(
      currentMode,
      'date',
      form.getValues('educationScheduleLines') ?? []
    )
    form.setValue('educationScheduleLines', nextLines, { shouldDirty: true })
    form.setValue('educationScheduleMode', 'date', { shouldDirty: true })
  }, [lockDateMode, form, swapScheduleLinesForMode])

  useEffect(() => {
    if (scheduleMode !== 'date') return
    setPeriodDate(null)
  }, [scheduleMode])

  useEffect(() => {
    if (scheduleMode !== 'period') return
    setSingleDate(null)
  }, [scheduleMode])

  const removeLine = useCallback(
    (index: number) => {
      const current = form.getValues('educationScheduleLines') ?? []
      const target = current[index]
      if (target != null && !canRemoveEducationSchedulePreviewLine(target)) return
      form.setValue(
        'educationScheduleLines',
        current.filter((_, i) => i !== index),
        { shouldDirty: true }
      )
    },
    [form]
  )

  const handleScheduleRangeApply = useCallback(
    (range: [Dayjs, Dayjs]) => {
      const slots = resolveGroupTimeSlots()
      const newLines = educationScheduleLinesFromSelectionRangeApply({
        range,
        autoFillFromScheduleGroupTimes,
        educationScheduleMode: scheduleMode,
        groupTimeSlots: slots,
        dateOnlyPeriodRange: disableSchedulePeriodTime,
      })
      const current = form.getValues('educationScheduleLines') ?? []
      form.setValue(
        'educationScheduleLines',
        mergeUniqueEducationScheduleLines(current, newLines),
        { shouldDirty: true }
      )
      setSingleDate(null)
      setPeriodDate(null)
    },
    [
      autoFillFromScheduleGroupTimes,
      disableSchedulePeriodTime,
      form,
      resolveGroupTimeSlots,
      scheduleMode,
    ]
  )

  const handleDateApply = useCallback(
    (next: Dayjs | null) => {
      if (!next) {
        setSingleDate(null)
        return
      }
      handleScheduleRangeApply([next.startOf('day'), next.startOf('day')])
    },
    [handleScheduleRangeApply]
  )

  return (
    <DetailInfoForm
      title="교육 진행 일정 설정"
      hideHeader
      mode="edit"
      className="program-registration-paragraph"
    >
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="교육 진행 일정 유형"
          edit={
            <div className="program-registration-paragraph__schedule-inline">
              <Controller
                name="educationScheduleMode"
                control={form.control}
                render={({ field }) => (
                  <CmsRadioGroup
                    size="medium"
                    value={lockDateMode ? 'date' : (field.value ?? 'date')}
                    onChange={e => {
                      const next = e.target.value as 'date' | 'period'
                      if (lockDateMode && next === 'period') return
                      const currentMode = (field.value ?? 'date') as 'date' | 'period'
                      if (next !== currentMode) {
                        const nextLines = swapScheduleLinesForMode(
                          currentMode,
                          next,
                          form.getValues('educationScheduleLines') ?? []
                        )
                        form.setValue('educationScheduleLines', nextLines, { shouldDirty: true })
                      }
                      field.onChange(next)
                    }}
                  >
                    <CmsRadio size="medium" value="date">
                      날짜 지정
                    </CmsRadio>
                    <CmsRadio size="medium" value="period" disabled={lockDateMode}>
                      기간 지정
                    </CmsRadio>
                  </CmsRadioGroup>
                )}
              />
            </div>
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="교육 진행 일정 선택"
          validationKey={[
            'educationScheduleSettings.singleDateIso',
            'educationScheduleSettings.periodDateIso',
          ]}
          edit={
            <ParagraphDatePicker
              inputSize="small"
              mode="single"
              customizable={false}
              showPeriodToggle={false}
              showTimeToggle={false}
              {...scheduleSelectionPickerProps}
              suppressAutoTodayWhenEmpty
              value={scheduleMode === 'date' ? singleDate : periodDate}
              onChange={scheduleMode === 'date' ? handleDateApply : setPeriodDate}
              onRangeChange={handleScheduleRangeApply}
              width={scheduleMode === 'date' ? 240 : 360}
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="교육 진행 예정일"
          fullRow
          readOnlyDisplay
          view={
            <EducationSchedulePreviewLines lines={previewScheduleLines} onRemove={removeLine} />
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}

function ScheduleSettingsSection({
  program,
  commonInfo,
  isEditMode = false,
  form,
}: {
  program: Program
  commonInfo: ReturnType<typeof resolveGeneralProgramCommonInfo>
  isEditMode?: boolean
  form?: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
}) {
  const isFormEdit = isEditMode && !!form
  const effectiveTypeFields = resolveEffectiveGeneralProgramTypeFields({
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    curriculumSessions: commonInfo.curriculumSessions,
    registrationOverlay: program.registrationOverlay,
  })
  const educationStructure = isFormEdit
    ? (form!.watch('educationStructure') ?? effectiveTypeFields.educationStructure)
    : effectiveTypeFields.educationStructure
  const sessionRound = isFormEdit
    ? (form!.watch('sessionRound') ?? effectiveTypeFields.sessionRound)
    : effectiveTypeFields.sessionRound

  if (educationStructure === 'schedule' && sessionRound === 'multi') {
    return null
  }

  const editForm =
    form ??
    ({
      control: undefined,
      formState: { errors: {} },
    } as unknown as UseFormReturn<GeneralProgramCommonInfoEditFormValues>)

  const lines = isFormEdit
    ? (editForm.watch('educationScheduleLines') ?? [])
    : (commonInfo.educationScheduleLines ?? [])

  if (lines.length === 0 && !isFormEdit) return null

  const scheduleMeta = PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationScheduleSettings

  return (
    <ProgramRegistrationDetailSection
      title={scheduleMeta.title}
      isFormEdit={isFormEdit}
      editDescription={scheduleMeta.editDescription}
      highlightParagraphId={PROGRAM_REGISTRATION_IDS.educationScheduleSettings}
      required
      titleTrailing={
        isFormEdit ? (
          <EducationScheduleChangeTitleAction
            programId={program.id}
            scheduleLines={lines}
            educationScheduleMode={
              isFormEdit ? (editForm.watch('educationScheduleMode') ?? 'date') : 'date'
            }
            educationStructure={educationStructure === 'schedule' ? 'schedule' : 'curriculum'}
            participantOrganization={Boolean(
              isFormEdit && editForm.watch('participantOrganization')
            )}
            sessionRound={sessionRound === 'multi' ? 'multi' : 'single'}
            autoFillFromScheduleGroupTimes={shouldAutoFillEducationScheduleFromGroupTimes({
              educationStructure: educationStructure === 'schedule' ? 'schedule' : 'curriculum',
              sessionRound: sessionRound === 'multi' ? 'multi' : 'single',
            })}
            lockCalendarTogglesToScheduleMode={shouldLockEducationScheduleCalendarToggles({
              participantOrganization: Boolean(
                isFormEdit && editForm.watch('participantOrganization')
              ),
              educationStructure: educationStructure === 'curriculum' ? 'curriculum' : 'schedule',
            })}
            operationStart={isFormEdit ? editForm.watch('startDate') : program.startDate}
            operationEnd={isFormEdit ? editForm.watch('endDate') : program.endDate}
            persistedOperationStart={program.startDate}
            persistedOperationEnd={program.endDate}
            onApply={nextLines => {
              editForm.setValue('educationScheduleLines', nextLines, { shouldDirty: true })
            }}
          />
        ) : undefined
      }
    >
      {isFormEdit ? (
        <ScheduleSettingsEditFields form={editForm} />
      ) : (
        <DetailInfoForm
          title="교육 진행 일정 설정"
          hideHeader
          mode="view"
          className="program-registration-paragraph"
        >
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="교육 진행 예정일"
              fullRow
              view={<EducationSchedulePreviewLines lines={lines} />}
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      )}
    </ProgramRegistrationDetailSection>
  )
}

export interface GeneralProgramDetailCommonInfoViewProps {
  program: Program
  sponsorName?: string
  isEditMode?: boolean
  form?: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
  canWrite?: boolean
  /** 프로그램 진행 중/완료 등 — 「정보 수정」 비활성 */
  editDisabled?: boolean
  onEdit?: () => void
  onCancel?: () => void
  onSave?: () => void
}

export function GeneralProgramDetailCommonInfoView({
  program,
  sponsorName,
  isEditMode = false,
  form,
  canWrite = false,
  editDisabled = false,
  onEdit,
  onCancel,
  onSave,
}: GeneralProgramDetailCommonInfoViewProps) {
  const v = programToDetailEditValues(program)
  const operationRange = formatDateRange(program.startDate, program.endDate)
  const commonInfo = resolveGeneralProgramCommonInfo(program)

  return (
    <div className="detail-common-info-view program-detail-fullpage-modal__info-tab">
      {(canWrite || isEditMode) && (
        <div className="detail-common-info-view__header">
          <BusinessPeriodExtendToolbar program={program} editDisabled={editDisabled}>
            <ProgramEditInfoActions
              isEditing={isEditMode}
              idleVariant="secondary"
              disabled={editDisabled}
              onEdit={onEdit ?? (() => {})}
              onCancel={onCancel ?? (() => {})}
              onSave={onSave ?? (() => {})}
            />
          </BusinessPeriodExtendToolbar>
        </div>
      )}

      <BasicInfoSection
        program={program}
        sponsorName={sponsorName}
        v={v}
        operationRange={operationRange}
        commonInfo={commonInfo}
        isEditMode={isEditMode}
        form={form}
      />

      <KpiSection commonInfo={commonInfo} program={program} isEditMode={isEditMode} form={form} />
      <WageSection commonInfo={commonInfo} isEditMode={isEditMode} form={form} />
      <TypeSettingsSection program={program} isEditMode={isEditMode} form={form} />
      <CurriculumSection
        program={program}
        commonInfo={commonInfo}
        isEditMode={isEditMode}
        form={form}
      />
      <ScheduleProgressSection
        program={program}
        commonInfo={commonInfo}
        isEditMode={isEditMode}
        form={form}
      />
      <ScheduleSettingsSection
        program={program}
        commonInfo={commonInfo}
        isEditMode={isEditMode}
        form={form}
      />
    </div>
  )
}
