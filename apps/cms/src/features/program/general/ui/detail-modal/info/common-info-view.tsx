/**
 * 일반 프로그램 상세 — 공통 정보 (조회 / 정보 수정)
 * 프로그램 등록 양식 overlay(단락 title + DetailInfoForm hideHeader)와 동일 레이아웃
 */

import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Controller, useFieldArray, type UseFormReturn } from 'react-hook-form'
import { ClockCircleOutlined, PlusOutlined } from '@ant-design/icons'
import type { Program } from '@/types/domain'
import { useSponsorSelectOptions } from '@/features/sponsor/hooks/use-sponsor-options-query'
import { useGeneralProgramSponsorEditContext } from '@/features/program/general/hooks/use-general-program-sponsor-edit-context'
import type { SponsorManagementRow } from '@/features/sponsor/model/sponsor-management.types'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { programToDetailEditValues } from '@/features/program/shared/model/program-detail-edit-schema'
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
import { resolveEffectiveGeneralProgramTypeFields } from '@/features/program/general/lib/curriculum-display'
import {
  applyCurriculumTypeSettingsDetailChangeToForm,
  applyEducationStructureChangeToForm,
  applyScheduleTypeSettingsDetailChangeToForm,
  applySessionRoundChangeToForm,
  createEmptyScheduleDetailBlock,
  inferScheduleDetailBlockKind,
  isGeneralProgramMultiRoundForTypeSettings,
  isScheduleMultiAllPerSchedule,
  getScheduleDetailPerBlockLayoutPlan,
  isScheduleEducationAndIpsBothPerSchedule,
  padEventScheduleLabel,
} from '@/features/program/general/lib/schedule-detail-form'
import {
  GENERAL_PROGRAM_CURRICULUM_MAX_SESSION_COUNT,
  GENERAL_PROGRAM_CURRICULUM_PROGRESS_SESSION_OPTIONS,
  formatGeneralProgramProgressSessionDisplay,
} from '@/features/program/general/lib/curriculum-progress-session-options'
import { CurriculumAssignmentSettingView } from '@/features/template/ui/shared/curriculum-assignment-setting-view'
import {
  formatGeneralParticipantTypesSummary,
  formatGeneralSurveyItemsSummary,
  resolveGeneralProgramCommonInfo,
  resolveGeneralProgramDetailedProgramNameDisplay,
} from '@/features/program/general/lib/detail-common-info-display'
import { getGeneralParticipantTypes } from '@/features/program/general/lib/detail-meta'
import { applyGeneralParticipantAudienceToEditForm } from '@/features/program/general/lib/participant-audience-selection'
import { GeneralParticipantAudienceCheckboxGroup } from '@/features/program/general/ui/participant-audience-checkbox-group'
import { isGeneralIndividualParticipantTarget } from '@/features/program/general/lib/survey-audience'
import {
  getProgramWagePaymentItemOptions,
  normalizeProgramPaymentItemSelection,
  resolveProgramWageDeductionLabel,
} from '@/features/program/shared/lib/program-wage-payment-item-helpers'
import {
  GENERAL_PROGRAM_EDUCATION_STRUCTURE_LABELS,
  GENERAL_PROGRAM_SESSION_ROUND_LABELS,
} from '@/features/program/general/lib/variant'
import {
  encodeSponsorManagerContactRef,
  formatGeneralProgramVenueViewLine,
  getGeneralSurveyEditFieldsForAudience,
  getGeneralDetailedProgramSelectOptions,
  isGeneralProgramScheduleType,
  padScheduleDetailLabel,
  relabelScheduleDetailFormRows,
  buildSessionIpsTypeSummary,
  resolveSponsorManagementIds,
  type GeneralProgramCommonInfoEditFormValues,
} from '@/features/program/general/model/common-info-edit-schema'
import { PROGRAM_REGISTRATION_SCHEDULE_CURRICULUM_MAX_GROUP_COUNT } from '@/features/template/ui/form-set/registration-form/general/paragraph-body'
import { CmsButton } from '@/shared/ui'
import {
  PROGRAM_EDIT_INFO_BUTTON_LABEL,
  PROGRAM_EDIT_INFO_BUTTON_PROPS,
  resolveProgramEditInfoClick,
} from '@/features/program/shared/lib/program-edit-info-button'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsToggle } from '@/shared/ui'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import {
  TEMPLATE_FORM_BUSINESS_AREA_OPTIONS,
  TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS,
} from '@/features/template/lib/template-form-select-options'
import {
  PROGRAM_REGISTRATION_COURSE_DELIVERED_BY_OPTIONS,
  PROGRAM_REGISTRATION_EDUCATION_COURSE_OPTIONS,
  PROGRAM_REGISTRATION_IP_OWNED_OPTIONS,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import { ProgramRegistrationIpsTypeFields } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-type-fields'
import { getProgramRegistrationEducationFormOptions } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-form-options'
import {
  getProgramRegistrationCurriculumMultiSessionRowPlan,
  shouldHideCurriculumParticipationRowForCommonEduPartWithIpsPerSchedule,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/education-curriculum-paragraph'
import { PROGRAM_REGISTRATION_GENERAL_SECTION_META } from '@/features/template/ui/form-set/registration-form/general/program-registration-general-section-meta'
import {
  formatEducationScheduleLineFromRange,
  parseEducationScheduleLineToRange,
} from '@/features/template/lib/format-education-schedule-line'
import { EducationSchedulePreviewLines } from '@/features/template/ui/shared/education-schedule-preview-lines'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { dateRangeUsesClockTime } from '@/features/template/ui/shared/writing-form-period-date-picker-field'
import { ParagraphTimePicker } from '@/features/template/ui/shared/paragraph-time-picker'
import '@/features/template/ui/shared/paragraph-date-picker.css'
import '@/features/template/ui/shared/paragraph-time-picker.css'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import './common-info-view.css'

const PROGRAM_PROGRESS_STATIC_HINT = '일정에 따라 진행 현황이 자동으로 반영됩니다.'

const PARTICIPATION_METHOD_LABELS = {
  individual: '개인',
  team: '팀',
} as const

function ParticipationMethodRadioGroup({
  value,
  onChange,
}: {
  value: string | undefined
  onChange: (next: string) => void
}) {
  return (
    <CmsRadioGroup
      size="large"
      value={value ?? 'individual'}
      onChange={e => onChange(e.target.value)}
    >
      <CmsRadio value="individual">개인</CmsRadio>
      <CmsRadio value="team">팀</CmsRadio>
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
}: {
  title: string
  children: ReactNode
  bodyClassName?: string
  /** 수정 모드에서만 타이틀 하단에 노출 */
  editDescription?: string
  titleTrailing?: ReactNode
  isFormEdit?: boolean
}) {
  return (
    <section className="detail-common-info-view__section" aria-label={title}>
      <FormParagraphSectionHeader
        title={title}
        description={isFormEdit ? editDescription : undefined}
        titleTrailing={titleTrailing}
        surface="responseEntry"
        titleAligned
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
  const trimmed = text?.trim()
  if (!trimmed || trimmed === '-') return <>-</>
  const parts = trimmed.split(/\s*\|\s*/)
  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={`${part}-${index}`}>
          {index > 0 ? <DetailInfoForm.InputsSeparator /> : null}
          {part}
        </Fragment>
      ))}
    </>
  )
}

function ProgramProgressView({ program }: { program: Program }) {
  if (!program.lifecycleStatus && !program.ujatProgressStatus) return <>-</>
  return <ProgramProgressStatusText program={program} />
}

function KpiBoldNumber({ value }: { value: number }) {
  return <span className="detail-common-info-view__kpi-number">{value}</span>
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
  const isScheduleType = isGeneralProgramScheduleType(program)
  const detailedProgramOptions = useMemo(() => getGeneralDetailedProgramSelectOptions(), [])
  const { options: sponsorOptions, data: sponsorRows = [] } = useSponsorSelectOptions(true)
  const viewSponsorContext = useMemo(
    () => ({
      sponsors: sponsorRows,
      contactsBySponsorId: {},
    }),
    [sponsorRows]
  )

  const announcementTitle = commonInfo.announcementTitle ?? program.title
  const detailedName = resolveGeneralProgramDetailedProgramNameDisplay(program, commonInfo)
  const sponsorManagementIds = resolveSponsorManagementIds(program, viewSponsorContext)
  const sponsorDisplay =
    sponsorManagementIds.length > 0 ? (
      <>
        {sponsorManagementIds.map((sponsorManagementId, index) => {
          const sponsorRow =
            sponsorRows.find(row => row.id === sponsorManagementId) ?? null
          const name =
            sponsorRow?.name?.trim() ||
            (index === 0 ? sponsorName?.trim() : '') ||
            ''
          if (!name) return null
          return (
            <Fragment key={sponsorManagementId}>
              {index > 0 ? ', ' : null}
              <ProgramDetailSponsorLink
                name={name}
                sponsorId={program.sponsorId}
                sponsorName={name}
                sponsorManagementId={sponsorManagementId}
              />
            </Fragment>
          )
        })}
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
  const sponsorEditContext = useGeneralProgramSponsorEditContext(watchedSponsorIds)
  const selectedSponsors = useMemo(
    () =>
      watchedSponsorIds
        .map(id => sponsorEditContext.sponsors.find(s => s.id === id))
        .filter((sponsor): sponsor is SponsorManagementRow => sponsor != null),
    [watchedSponsorIds, sponsorEditContext.sponsors]
  )
  const managerOptions = useMemo(() => {
    const options: Array<{ value: string; label: string }> = []
    for (const sponsor of selectedSponsors) {
      const contacts = sponsorEditContext.contactsBySponsorId[sponsor.id] ?? []
      for (const contact of contacts) {
        const label =
          selectedSponsors.length > 1
            ? `${sponsor.name} · ${contact.position ? `${contact.position} ` : ''}${contact.name}`
            : contact.position
              ? `${contact.position} ${contact.name}`
              : contact.name
        options.push({
          value: encodeSponsorManagerContactRef(sponsor.id, contact.id),
          label,
        })
      }
    }
    return options
  }, [selectedSponsors, sponsorEditContext.contactsBySponsorId])

  useEffect(() => {
    if (!isFormEdit) return
    const currentManagerId = editForm.getValues('sponsorManagerContactId')
    if (watchedSponsorIds.length === 0) {
      if (currentManagerId) editForm.setValue('sponsorManagerContactId', '')
      return
    }
    if (managerOptions.length === 0) {
      if (currentManagerId) editForm.setValue('sponsorManagerContactId', '')
      return
    }
    if (!managerOptions.some(option => option.value === currentManagerId)) {
      editForm.setValue('sponsorManagerContactId', managerOptions[0]?.value ?? '')
    }
  }, [editForm, isFormEdit, managerOptions, watchedSponsorIds])

  const participantIndividual = isFormEdit ? editForm.watch('participantIndividual') : false
  const participantOrganization = isFormEdit ? editForm.watch('participantOrganization') : false
  const isIndividualTarget = isFormEdit
    ? isGeneralIndividualParticipantTarget(program, participantIndividual, participantOrganization)
    : isGeneralIndividualParticipantTarget(program)
  const surveyEditFields = getGeneralSurveyEditFieldsForAudience(isIndividualTarget)

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
            view={v.mainTitle?.trim() || '-'}
            edit={
              <Controller
                name="mainTitle"
                control={editForm.control}
                render={({ field }) => (
                  <CmsInput
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
            view={program.titleEn?.trim() || '-'}
            edit={
              <Controller
                name="titleEn"
                control={editForm.control}
                render={({ field }) => (
                  <CmsInput
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
            view={announcementTitle}
            edit={
              <Controller
                name="announcementTitle"
                control={editForm.control}
                render={({ field }) => (
                  <CmsInput
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
            view={detailedName}
            readOnlyDisplay={isFormEdit && isScheduleType}
            edit={
              isScheduleType ? (
                '해당없음'
              ) : (
                <Controller
                  name="detailedProgramId"
                  control={editForm.control}
                  render={({ field }) => (
                    <CmsSelect
                      withAllOption={false}
                      placeholder="세부 프로그램명을 선택하세요"
                      width="100%"
                      options={detailedProgramOptions}
                      value={field.value || undefined}
                      onChange={v => field.onChange(String(v ?? ''))}
                    />
                  )}
                />
              )
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="사업 운영 기간"
            view={operationRange}
            edit={
              <Controller
                name="startDate"
                control={editForm.control}
                render={({ field }) => {
                  const endDateValue = editForm.watch('endDate')
                  const start = toDayjs(field.value)
                  const end = toDayjs(endDateValue)
                  const operationRange =
                    start && end ? ([start, end] as [Dayjs, Dayjs]) : null
                  const operationRangeWithTime =
                    operationRange == null
                      ? false
                      : dateRangeUsesClockTime(operationRange[0], operationRange[1])

                  return (
                    <div className="detail-info-form-inputs-wrapper-no-gap">
                      <ParagraphDatePicker
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
            view={formatGeneralParticipantTypesSummary(program)}
            edit={
              <div className="detail-info-form-inputs-wrapper">
                <GeneralParticipantAudienceCheckboxGroup
                  individual={Boolean(participantIndividual)}
                  organization={Boolean(participantOrganization)}
                  onIndividualChange={handleParticipantIndividualChange}
                  onOrganizationChange={handleParticipantOrganizationChange}
                />
                {SECONDARY_PARTICIPANT_TYPE_OPTIONS.map(option => {
                  const formKey =
                    PARTICIPANT_FORM_KEYS[
                      option.value as keyof typeof PARTICIPANT_FORM_KEYS
                    ]
                  return (
                    <Controller
                      key={option.value}
                      name={formKey}
                      control={editForm.control}
                      render={({ field }) => (
                        <CmsCheckbox
                          checkboxSize="large"
                          checked={Boolean(field.value)}
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
            view={optionLabel(BUSINESS_AREA_OPTIONS, v.businessArea)}
            edit={
              <Controller
                name="businessArea"
                control={editForm.control}
                render={({ field }) => (
                  <CmsSelect
                    withAllOption={false}
                    placeholder="사업 분야를 선택하세요"
                    width="100%"
                    options={[...TEMPLATE_FORM_BUSINESS_AREA_OPTIONS]}
                    value={field.value || undefined}
                    onChange={v => field.onChange(String(v ?? ''))}
                    status={editForm.formState.errors.businessArea ? 'error' : undefined}
                  />
                )}
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="후원사"
            view={sponsorDisplay}
            edit={
              <Controller
                name="sponsorManagementIds"
                control={editForm.control}
                render={({ field }) => (
                  <CmsSelect
                    mode="multiple"
                    withAllOption={false}
                    placeholder="후원사를 선택하세요"
                    width="100%"
                    showSearch
                    optionFilterProp="label"
                    options={sponsorOptions}
                    value={field.value ?? []}
                    onChange={v => {
                      const next = Array.isArray(v) ? v.map(String) : []
                      field.onChange(next)
                      editForm.setValue('sponsorManagerContactId', '')
                    }}
                    status={editForm.formState.errors.sponsorManagementIds ? 'error' : undefined}
                  />
                )}
              />
            }
          />
          <DetailInfoForm.Field
            label="후원사 담당자"
            view={
              <PipeSeparatedInlineView
                text={commonInfo.sponsorManagerLine?.trim() || program.managerName || '-'}
              />
            }
            edit={
              <Controller
                name="sponsorManagerContactId"
                control={editForm.control}
                render={({ field }) => (
                  <CmsSelect
                    placeholder="후원사 담당자를 선택하세요"
                    width="100%"
                    options={managerOptions}
                    value={field.value || undefined}
                    disabled={watchedSponsorIds.length === 0 || managerOptions.length === 0}
                    onChange={v => field.onChange(String(v ?? ''))}
                    status={editForm.formState.errors.sponsorManagerContactId ? 'error' : undefined}
                  />
                )}
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육 장소"
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
                    <CmsRadioGroup size="large" value={field.value} onChange={e => field.onChange(e.target.value)}>
                      <CmsRadio value="inside">기관 안</CmsRadio>
                      <CmsRadio value="outside">기관 밖</CmsRadio>
                      <CmsRadio value="other">기타(직접입력)</CmsRadio>
                    </CmsRadioGroup>
                  )}
                />
                <DetailInfoForm.InputsSeparator />
                <Controller
                  name="venueDetail"
                  control={editForm.control}
                  render={({ field }) => (
                    <CmsInput
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
                        checkboxSize="large"
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
            view={optionLabel(
              EDUCATION_PROCESS_OPTIONS,
              v.educationProcess ?? program.educationProcess
            )}
            edit={
              <Controller
                name="educationProcess"
                control={editForm.control}
                render={({ field }) => (
                  <CmsSelect
                    withAllOption={false}
                    placeholder="교육 과정을 선택하세요"
                    width="100%"
                    options={[...PROGRAM_REGISTRATION_EDUCATION_COURSE_OPTIONS]}
                    value={field.value || undefined}
                    onChange={v => field.onChange(String(v ?? ''))}
                    status={editForm.formState.errors.educationProcess ? 'error' : undefined}
                  />
                )}
              />
            }
          />
          <DetailInfoForm.Field
            label="IP Owned"
            view={optionLabel(IP_OWNED_OPTIONS, v.ipOwned)}
            edit={
              <Controller
                name="ipOwned"
                control={editForm.control}
                render={({ field }) => (
                  <CmsSelect
                    withAllOption={false}
                    placeholder="IP Owned를 선택하세요"
                    width="100%"
                    options={[...PROGRAM_REGISTRATION_IP_OWNED_OPTIONS]}
                    value={field.value || undefined}
                    onChange={v => field.onChange(String(v ?? ''))}
                    status={editForm.formState.errors.ipOwned ? 'error' : undefined}
                  />
                )}
              />
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="Course Delivered By"
            view={optionLabel(COURSE_DELIVERED_BY_OPTIONS, v.courseDeliveredBy ?? undefined)}
            edit={
              <Controller
                name="courseDeliveredBy"
                control={editForm.control}
                render={({ field }) => (
                  <CmsSelect
                    withAllOption={false}
                    placeholder="Course Delivered By를 선택하세요"
                    width="100%"
                    options={[...PROGRAM_REGISTRATION_COURSE_DELIVERED_BY_OPTIONS]}
                    value={field.value || undefined}
                    onChange={v => field.onChange(String(v ?? ''))}
                    status={editForm.formState.errors.courseDeliveredBy ? 'error' : undefined}
                  />
                )}
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
                    size="large"
                    value={field.value}
                    onChange={e => field.onChange(e.target.value as 'yes' | 'no')}
                  >
                    <CmsRadio value="yes">Yes</CmsRadio>
                    <CmsRadio value="no">No</CmsRadio>
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
  const participantIndividual = isFormEdit ? editForm.watch('participantIndividual') : false
  const participantOrganization = isFormEdit ? editForm.watch('participantOrganization') : false
  const isIndividualTarget = isFormEdit
    ? isGeneralIndividualParticipantTarget(program, participantIndividual, participantOrganization)
    : isGeneralIndividualParticipantTarget(program)

  useEffect(() => {
    if (!isFormEdit || !isIndividualTarget) return
    editForm.setValue('kpiFinalSchools', 0)
    editForm.setValue('kpiFinalClasses', 0)
  }, [editForm, isFormEdit, isIndividualTarget])

  if (!kpi && !isEditMode) return null

  const dispatchedSchoolClassView = isIndividualTarget ? (
    <span className="detail-info-form--text">해당 없음</span>
  ) : null

  const formMode = isFormEdit ? 'edit' : 'view'

  return (
    <ProgramRegistrationDetailSection title="사업 KPI 목표">
      <DetailInfoForm title="사업 KPI 목표" hideHeader mode={formMode} className="program-registration-paragraph">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="참여자 최종 인원"
            view={<KpiBoldNumber value={kpi?.finalParticipants ?? 0} />}
            edit={
              <Controller
                name="kpiFinalParticipants"
                control={editForm.control}
                render={({ field }) => (
                  <CmsNumericInput
                    {...field}
                    mode="integer"
                    min={0}
                    value={field.value == null ? '' : String(field.value)}
                    onValueChange={value =>
                      field.onChange(value === '' ? undefined : Number(value))
                    }
                    inputSize="medium"
                    placeholder="목표값 입력"
                    width={120}
                  />
                )}
              />
            }
          />
          <DetailInfoForm.Field
            label="교육진행자 최종 인원"
            view={
              <div className="detail-info-form-inputs-wrapper">
                <span className="detail-info-form--text">강사 :</span>
                <KpiBoldNumber value={kpi?.instructorCount ?? 0} />
                <DetailInfoForm.InputsSeparator />
                <span className="detail-info-form--text">봉사자 :</span>
                <KpiBoldNumber value={kpi?.volunteerCount ?? 0} />
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
                        {...field}
                        mode="integer"
                        min={0}
                        value={field.value == null ? '' : String(field.value)}
                        onValueChange={value =>
                          field.onChange(value === '' ? undefined : Number(value))
                        }
                        inputSize="medium"
                        placeholder="목표값 입력"
                        width={120}
                      />
                    )}
                  />
                ) : (
                  <span className="detail-info-form--text">해당 없음</span>
                )}
                <DetailInfoForm.InputsSeparator />
                <span className="detail-info-form--text mr-6">봉사자</span>
                {hasVolunteer ? (
                  <Controller
                    name="kpiVolunteerCount"
                    control={editForm.control}
                    render={({ field }) => (
                      <CmsNumericInput
                        {...field}
                        mode="integer"
                        min={0}
                        value={field.value == null ? '' : String(field.value)}
                        onValueChange={value =>
                          field.onChange(value === '' ? undefined : Number(value))
                        }
                        inputSize="medium"
                        placeholder="목표값 입력"
                        width={120}
                      />
                    )}
                  />
                ) : (
                  <span className="detail-info-form--text">해당 없음</span>
                )}
              </div>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="최종 파견 학교 수"
            view={
              isIndividualTarget ? (
                dispatchedSchoolClassView
              ) : (
                <KpiBoldNumber value={kpi?.finalSchools ?? 0} />
              )
            }
            edit={
              isIndividualTarget ? (
                <CmsInput
                  disabled
                  inputSize="medium"
                  placeholder="해당 없음"
                  width={120}
                  value=""
                />
              ) : (
                <Controller
                  name="kpiFinalSchools"
                  control={editForm.control}
                  render={({ field }) => (
                    <CmsNumericInput
                      {...field}
                      mode="integer"
                      min={0}
                      value={field.value == null ? '' : String(field.value)}
                      onValueChange={value =>
                        field.onChange(value === '' ? undefined : Number(value))
                      }
                      inputSize="medium"
                      placeholder="목표값 입력"
                      width={120}
                    />
                  )}
                />
              )
            }
          />
          <DetailInfoForm.Field
            label="최종 파견 학급 수"
            view={
              isIndividualTarget ? (
                dispatchedSchoolClassView
              ) : (
                <KpiBoldNumber value={kpi?.finalClasses ?? 0} />
              )
            }
            edit={
              isIndividualTarget ? (
                <CmsInput
                  disabled
                  inputSize="medium"
                  placeholder="해당 없음"
                  width={120}
                  value=""
                />
              ) : (
                <Controller
                  name="kpiFinalClasses"
                  control={editForm.control}
                  render={({ field }) => (
                    <CmsNumericInput
                      {...field}
                      mode="integer"
                      min={0}
                      value={field.value == null ? '' : String(field.value)}
                      onValueChange={value =>
                        field.onChange(value === '' ? undefined : Number(value))
                      }
                      inputSize="medium"
                      placeholder="목표값 입력"
                      width={120}
                    />
                  )}
                />
              )
            }
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </ProgramRegistrationDetailSection>
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
  const rows = commonInfo.wageGradeRows ?? []
  const isFormEdit = isEditMode && !!form
  const formMode = isFormEdit ? 'edit' : 'view'
  const paymentItemOptions = useMemo(() => getProgramWagePaymentItemOptions(), [])

  const editForm =
    form ??
    ({
      control: undefined,
      formState: { errors: {} },
      watch: () => undefined,
    } as unknown as UseFormReturn<GeneralProgramCommonInfoEditFormValues>)

  const watchedPaymentItemIds = isFormEdit
    ? (editForm.watch('wagePaymentItemIds') ?? [])
    : []
  const deductionLabel = isFormEdit
    ? resolveProgramWageDeductionLabel(watchedPaymentItemIds)
    : (commonInfo.deductionItems ?? resolveProgramWageDeductionLabel([]))

  const wageFields = [
    { label: '1급 강사비', name: 'wageGrade1Amount' as const, max: 500_000, maxHint: '500,000' },
    { label: '2급 강사비', name: 'wageGrade2Amount' as const, max: 400_000, maxHint: '400,000' },
    { label: '3급 강사비', name: 'wageGrade3Amount' as const, max: 300_000, maxHint: '300,000' },
  ]

  return (
    <ProgramRegistrationDetailSection
      title={PROGRAM_REGISTRATION_GENERAL_SECTION_META.wageInfo.title}
      isFormEdit={isFormEdit}
      editDescription={PROGRAM_REGISTRATION_GENERAL_SECTION_META.wageInfo.editDescription}
    >
      <DetailInfoForm title="임금 정보" hideHeader mode={formMode} className="program-registration-paragraph">
        {wageFields.map(({ label, name, max, maxHint }, index) => {
          const row = rows[index]
          return (
            <DetailInfoForm.Row key={label} type="single">
              <DetailInfoForm.Field
                label={label}
                fullRow
                view={row ? <PipeSeparatedInlineView text={row.pricing} /> : '-'}
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
                          inputSize="medium"
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
          )
        })}
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="지급 항목"
            view={commonInfo.paymentItems ?? '-'}
            edit={
              <Controller
                name="wagePaymentItemIds"
                control={editForm.control}
                render={({ field }) => (
                  <CmsSelect
                    mode="multiple"
                    withAllOption={false}
                    value={field.value ?? []}
                    onChange={next =>
                      field.onChange(
                        normalizeProgramPaymentItemSelection(
                          next as string[],
                          field.value ?? []
                        )
                      )
                    }
                    options={paymentItemOptions}
                    placeholder="지급 항목을 선택하세요"
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
  perScheduleHint = '교육 진행 항목에서 회차 별로 입력해 주세요',
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
          view={
            scheduleDetail === 'perSchedule' ? (
              <div className="detail-info-form-inputs-wrapper">
                일정 별 상이
                <DetailInfoForm.InputsSeparator />
                <span className="program-registration-paragraph__schedule-hint">{perScheduleHint}</span>
              </div>
            ) : (
              (commonDetailView ?? '-')
            )
          }
        />
      </DetailInfoForm.Row>
    )
  }

  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label={label}
        fullRow
        edit={
          <div className="detail-info-form-inputs-wrapper program-registration-paragraph__schedule-detail-row">
            <Controller
              name={scheduleDetailName}
              control={editForm.control}
              render={({ field }) => (
                <CmsRadioGroup
                  size="large"
                  value={field.value ?? 'common'}
                  onChange={e => {
                    field.onChange(e.target.value)
                    applyCurriculumTypeSettingsDetailChangeToForm(
                      editForm.setValue,
                      editForm.getValues
                    )
                  }}
                >
                  <CmsRadio value="common">일정 공통</CmsRadio>
                  <CmsRadio value="perSchedule">일정 별 상이</CmsRadio>
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
                <span className="program-registration-paragraph__schedule-hint">{perScheduleHint}</span>
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
}: {
  editForm: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
  isFormEdit: boolean
}) {
  const ipsScheduleDetail = isFormEdit ? editForm.watch('ipsScheduleDetail') : 'common'
  const ipsCategory = isFormEdit ? editForm.watch('ipsCategory') : ''
  const ipsDetail = isFormEdit ? editForm.watch('ipsDetail') : ''

  return (
    <DetailInfoForm.Row type="single">
      <DetailInfoForm.Field
        label="IPS 유형"
        fullRow
        edit={
          <div className="detail-info-form-inputs-wrapper program-registration-paragraph__schedule-detail-row">
            <Controller
              name="ipsScheduleDetail"
              control={editForm.control}
              render={({ field }) => (
                <CmsRadioGroup
                  size="large"
                  value={field.value}
                  onChange={e => {
                    field.onChange(e.target.value)
                    applyCurriculumTypeSettingsDetailChangeToForm(
                      editForm.setValue,
                      editForm.getValues
                    )
                  }}
                >
                  <CmsRadio value="common">일정 공통</CmsRadio>
                  <CmsRadio value="perSchedule">일정 별 상이</CmsRadio>
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
                  교육 일정 항목에서 차시 별로 입력해 주세요
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
  const effectiveTypeFields = resolveEffectiveGeneralProgramTypeFields({
    generalProgramAudience: program.generalProgramAudience,
    generalProgramEducationStructure: program.generalProgramEducationStructure,
    generalProgramSessionRound: program.generalProgramSessionRound,
    curriculumSessions: commonInfo.curriculumSessions,
  })
  const isFormEdit = isEditMode && !!form
  const formMode = isFormEdit ? 'edit' : 'view'

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
    GENERAL_PROGRAM_SESSION_ROUND_LABELS[
      watchedSessionRound ?? effectiveTypeFields.sessionRound
    ] ?? '-'
  const isMultiRoundType = isGeneralProgramMultiRoundForTypeSettings({
    educationStructure: watchedStructure ?? effectiveTypeFields.educationStructure,
    sessionRound: watchedSessionRound ?? effectiveTypeFields.sessionRound,
    curriculumSessions: watchedCurriculumSessions ?? commonInfo.curriculumSessions,
  })
  const isScheduleStructure = (watchedStructure ?? effectiveTypeFields.educationStructure) === 'schedule'
  const schedulePerScheduleHint = isScheduleStructure
    ? '교육 일정 항목에서 차시 별로 입력해 주세요'
    : '교육 진행 항목에서 회차 별로 입력해 주세요'
  const isSingle = !isMultiRoundType
  const isOrganization = participantOrganization
  const participationMethod = isFormEdit
    ? editForm.watch('participationMethod') ?? 'individual'
    : commonInfo.participationMethod ?? 'individual'
  const participationMethodLabel =
    PARTICIPATION_METHOD_LABELS[
      participationMethod as keyof typeof PARTICIPATION_METHOD_LABELS
    ] ?? PARTICIPATION_METHOD_LABELS.individual

  const educationFormOptions = getProgramRegistrationEducationFormOptions(Boolean(participantOrganization))
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
  }, [
    scheduleTypeSettingsKey,
    isFormEdit,
    isScheduleStructure,
    isMultiRoundType,
    editForm,
  ])

  return (
    <ProgramRegistrationDetailSection
      title={PROGRAM_REGISTRATION_GENERAL_SECTION_META.typeSettings.title}
      isFormEdit={isFormEdit}
      editDescription={PROGRAM_REGISTRATION_GENERAL_SECTION_META.typeSettings.editDescription}
      bodyClassName="detail-common-info-view__section-body--type-settings"
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
                    size="large"
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
                    <CmsRadio value="curriculum">커리큘럼형</CmsRadio>
                    <CmsRadio value="schedule">일정형</CmsRadio>
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
                    size="large"
                    value={field.value}
                    onChange={e => {
                      const next = e.target.value as 'single' | 'multi'
                      field.onChange(next)
                      if (isFormEdit) {
                        applySessionRoundChangeToForm(
                          editForm.setValue,
                          editForm.getValues,
                          next
                        )
                      }
                    }}
                  >
                    <CmsRadio value="single">단일 회차</CmsRadio>
                    <CmsRadio value="multi">복수 회차</CmsRadio>
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
              fullRow={isOrganization}
              view={commonInfo.educationFormLabel ?? '-'}
              edit={
                <Controller
                  name="educationForm"
                  control={editForm.control}
                  render={({ field }) => (
                    <CmsRadioGroup
                      size="large"
                      value={field.value ?? 'online'}
                      onChange={e => field.onChange(e.target.value)}
                    >
                      {educationFormOptions.map(opt => (
                        <CmsRadio key={opt.value} value={opt.value}>
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
                view={participationMethodLabel}
                edit={
                  <Controller
                    name="participationMethod"
                    control={editForm.control}
                    render={({ field }) => (
                      <CmsRadioGroup
                        size="large"
                        value={field.value ?? 'individual'}
                        onChange={e => field.onChange(e.target.value)}
                      >
                        <CmsRadio value="individual">개인</CmsRadio>
                        <CmsRadio value="team">팀</CmsRadio>
                      </CmsRadioGroup>
                    )}
                  />
                }
              />
            ) : null}
          </DetailInfoForm.Row>
          {isFormEdit ? (
            <TypeSettingsIpsRow editForm={editForm} isFormEdit={isFormEdit} />
          ) : (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="IPS 유형"
                fullRow
                view={<PipeSeparatedInlineView text={commonInfo.ipsTypeSummary} />}
              />
            </DetailInfoForm.Row>
          )}
        </DetailInfoForm>
      ) : (
        <DetailInfoForm
          title={isOrganization ? '교육 형태, IPS 유형 설정' : '교육 형태, 참여 방식, IPS 유형 설정'}
          hideHeader
          mode={formMode}
          className="program-registration-paragraph detail-common-info-view__type-settings-detail-form"
        >
          <TypeSettingsScheduleDetailRow
            label="교육 형태"
            scheduleDetailName="educationFormScheduleDetail"
            scheduleDetailValue={educationFormScheduleDetail}
            editForm={editForm}
            formMode={formMode}
            commonDetailView={commonInfo.educationFormLabel ?? '-'}
            commonDetailEdit={
              <Controller
                name="educationForm"
                control={editForm.control}
                render={({ field }) => (
                  <CmsSelect
                    inputSize="medium"
                    withAllOption={false}
                    placeholder="교육 형태"
                    width={160}
                    options={educationFormOptions}
                    value={field.value || undefined}
                    onChange={v => field.onChange(String(v ?? ''))}
                  />
                )}
              />
            }
          />
          {!isOrganization ? (
            <TypeSettingsScheduleDetailRow
              label="참여 방식"
              scheduleDetailName="participationScheduleDetail"
              scheduleDetailValue={participationScheduleDetail}
              editForm={editForm}
              formMode={formMode}
              commonDetailView={participationMethodLabel}
              perScheduleHint={schedulePerScheduleHint}
              commonDetailEdit={
                <Controller
                  name="participationMethod"
                  control={editForm.control}
                  render={({ field }) => (
                    <CmsSelect
                      inputSize="medium"
                      withAllOption={false}
                      placeholder="참여 방식"
                      width={160}
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
  ipsTypeSummary?: string
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
  educationFormOptions,
  isPreEducationBlock = false,
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
  educationFormOptions: ReturnType<typeof getProgramRegistrationEducationFormOptions>
  isPreEducationBlock?: boolean
}) {
  const assignmentEnabled = editForm.watch(`curriculumSessions.${index}.assignmentEnabled`) ?? false
  const sessionIpsCategory =
    editForm.watch(`curriculumSessions.${index}.ipsCategory`) ?? ''
  const sessionIpsDetail = editForm.watch(`curriculumSessions.${index}.ipsDetail`) ?? ''
  const headingLabel = isPreEducationBlock ? '사전 교육' : session.sessionLabel
  const classFieldLabel = isFormEdit
    ? `${session.sessionLabel.replace(/회차$/, '')}회차 수업`
    : '차시 및 교육 내용'

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
                        inputSize="medium"
                        withAllOption={false}
                        placeholder="진행 차시"
                        width={120}
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
                        inputSize="medium"
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
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="과제 설정"
              fullRow
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
                        size="large"
                        value={field.value ? 'yes' : 'no'}
                        onChange={e => {
                          const enabled = e.target.value === 'yes'
                          field.onChange(enabled)
                          if (!enabled) {
                            editForm.setValue(`curriculumSessions.${index}.assignmentPeriod`, '')
                          }
                        }}
                      >
                        <CmsRadio value="yes">있음</CmsRadio>
                        <CmsRadio value="no">없음</CmsRadio>
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
                          mode="single"
                          presetMode="period"
                          customizable={false}
                          suppressAutoTodayWhenEmpty
                          disabled={!assignmentEnabled}
                          value={appliedRange?.[0] ?? null}
                          onChange={() => {}}
                          appliedSurfaceRange={appliedRange}
                          onRangeChange={([start, end]) => {
                            periodField.onChange(
                              formatEducationScheduleLineFromRange([start, end])
                            )
                            if (!assignmentEnabled) {
                              editForm.setValue(
                                `curriculumSessions.${index}.assignmentEnabled`,
                                true
                              )
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
          </DetailInfoForm.Row>
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
                          size="large"
                          value={field.value ?? 'online'}
                          onChange={e => field.onChange(e.target.value)}
                        >
                          {educationFormOptions.map(opt => (
                            <CmsRadio key={opt.value} value={opt.value}>
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
                          size="large"
                          value={field.value ?? 'online'}
                          onChange={e => field.onChange(e.target.value)}
                        >
                          {educationFormOptions.map(opt => (
                            <CmsRadio key={opt.value} value={opt.value}>
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
          {(showIpsOnlyPerRound || isPreEducationBlock) && !showIpsPerRoundWithEducation ? (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="IPS 유형"
                fullRow
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
        {isFormEdit && index > 0 && !isPreEducationBlock ? (
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
}: {
  index: number
  session: CurriculumSessionViewModel
  formMode: 'view' | 'edit'
  editForm: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
  isFormEdit: boolean
  onRemove: () => void
  showIpsPerSession: boolean
  isPreEducationBlock?: boolean
}) {
  const sessionIpsCategory = editForm.watch(`curriculumSessions.${index}.ipsCategory`) ?? ''
  const sessionIpsDetail = editForm.watch(`curriculumSessions.${index}.ipsDetail`) ?? ''
  const headingLabel = isPreEducationBlock ? '사전 교육' : session.sessionLabel
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
              label="단원명 및 교육 내용"
              fullRow
              view={
                <>
                  {session.title}
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
                      <CmsInput
                        {...field}
                        value={field.value ?? ''}
                        inputSize="medium"
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
                        inputSize="medium"
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
          {showIpsPerSession || isPreEducationBlock ? (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="IPS 유형"
                fullRow
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
        {isFormEdit && index > 0 ? (
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
  const showIpsPerRoundWithEducation =
    showEducationPerRound && ipsScheduleDetail === 'perSchedule'
  const showIpsOnlyPerRound =
    isMultiRoundCurriculum && multiCurriculumRowPlan === 'c_allCommon_piBothPer'
  const showIpsPerSession =
    !isMultiRoundCurriculum && ipsScheduleDetail === 'perSchedule'
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
        const ipsCategory = editForm.watch(`curriculumSessions.${i}.ipsCategory`) ?? ''
        const ipsDetail = editForm.watch(`curriculumSessions.${i}.ipsDetail`) ?? ''
        return {
          sessionLabel: f.sessionLabel,
          title: editForm.watch(`curriculumSessions.${i}.title`) ?? '',
          description: editForm.watch(`curriculumSessions.${i}.description`) ?? '',
          assignmentEnabled: editForm.watch(`curriculumSessions.${i}.assignmentEnabled`) ?? false,
          assignmentPeriod: editForm.watch(`curriculumSessions.${i}.assignmentPeriod`) ?? '',
          educationFormLabel: showEducationPerRound
            ? perScheduleEducationFormOptions.find(o => o.value === educationForm)?.label
            : undefined,
          ipsTypeSummary:
            (showIpsPerRoundWithEducation || showIpsOnlyPerRound || showIpsPerSession) && ipsCategory
              ? buildSessionIpsTypeSummary(
                  ipsCategory as 'inspire' | 'prepare' | 'succeed',
                  ipsDetail
                )
              : undefined,
        }
      })
    : (commonInfo.curriculumSessions ?? []).map(session => ({
        sessionLabel: session.sessionLabel,
        title: session.title,
        description: session.description,
        assignmentEnabled: session.assignmentEnabled ?? false,
        assignmentPeriod: session.assignmentPeriod ?? '',
        educationFormLabel: session.educationFormLabel,
        ipsTypeSummary: session.ipsTypeSummary,
      }))

  const curriculumPreEducation = isFormEdit
    ? (editForm.watch('scheduleCurriculumPreEducation') ?? false)
    : (commonInfo.scheduleCurriculumPreEducation ?? false)

  useEffect(() => {
    if (!isFormEdit || !curriculumPreEducation) return
    const currentSessions = editForm.getValues('curriculumSessions') ?? []
    if (currentSessions.length === 0) return
    editForm.setValue('curriculumSessions.0.ipsCategory', 'prepare', { shouldDirty: true })
    editForm.setValue('curriculumSessions.0.ipsDetail', 'none', { shouldDirty: true })
  }, [curriculumPreEducation, editForm, isFormEdit])

  if (watchedStructure === 'schedule') return null
  if (sessions.length === 0 && !isFormEdit) return null

  const formMode = isFormEdit ? 'edit' : 'view'

  const handleAddSession = () => {
    const nextIndex = fields.length + 1
    if (isMultiRoundCurriculum) {
      append({
        sessionLabel: `${nextIndex}회차`,
        title: '1',
        description: '',
        assignmentEnabled: false,
        assignmentPeriod: '',
        educationForm: 'online',
        ipsCategory: 'prepare',
        ipsDetail: 'none',
      })
      return
    }
    if (fields.length >= GENERAL_PROGRAM_CURRICULUM_MAX_SESSION_COUNT) return
    const values = editForm.getValues()
    const topIpsCategory = values.ipsCategory || 'prepare'
    const topIpsDetail = values.ipsDetail || (topIpsCategory === 'prepare' ? 'none' : '')
    append({
      sessionLabel: `${nextIndex}차시`,
      title: '',
      description: '',
      assignmentEnabled: false,
      assignmentPeriod: '',
      educationForm: values.educationForm ?? 'online',
      ipsCategory: values.ipsScheduleDetail === 'perSchedule' ? topIpsCategory : '',
      ipsDetail: values.ipsScheduleDetail === 'perSchedule' ? topIpsDetail : '',
    })
  }

  const curriculumChartSessionAtMax =
    !isMultiRoundCurriculum && fields.length >= GENERAL_PROGRAM_CURRICULUM_MAX_SESSION_COUNT

  const sessionBlocks = sessions.map((session, index) => {
    const isPreEducationBlock = curriculumPreEducation && index === 0
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
        educationFormOptions={perScheduleEducationFormOptions}
        isPreEducationBlock={isPreEducationBlock}
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
      />
    )
  })

  const curriculumMeta = PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationCurriculum

  return (
    <ProgramRegistrationDetailSection
      title={isFormEdit ? `${curriculumMeta.title}*` : curriculumMeta.title}
      isFormEdit={isFormEdit}
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
              icon={<PlusOutlined aria-hidden />}
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
        <div className="program-registration-curriculum__sessions">
          {!isMultiRoundCurriculum && fields.length > 0 && !participantOrganization ? (
            <DetailInfoForm
              title="교육 진행 (커리큘럼)"
              hideHeader
              mode={formMode}
              className="program-registration-paragraph"
            >
              <DetailInfoForm.Row type="single">
                <DetailInfoForm.Field
                  label="참여 방식"
                  fullRow
                  edit={
                    <Controller
                      name="participationMethod"
                      control={editForm.control}
                      render={({ field }) => (
                        <ParticipationMethodRadioGroup
                          value={field.value}
                          onChange={field.onChange}
                        />
                      )}
                    />
                  }
                  view="-"
                />
              </DetailInfoForm.Row>
            </DetailInfoForm>
          ) : null}
          {sessionBlocks}
        </div>
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
}: {
  scheduleLabel: string
  name: string
  progressTimeSummary?: string
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
              view={<PipeSeparatedInlineView text={progressTimeSummary ?? '-'} />}
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>
    </div>
  )
}

function ScheduleEventDetailViewBlock({
  scheduleLabel,
  name,
  scheduleDateLabel,
  assignmentEnabled,
  assignmentPeriod,
}: {
  scheduleLabel: string
  name: string
  scheduleDateLabel?: string
  assignmentEnabled?: boolean
  assignmentPeriod?: string
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
              label="진행 일정"
              fullRow
              view={scheduleDateLabel?.trim() || '-'}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="과제 설정"
              fullRow
              view={
                <CurriculumAssignmentSettingView
                  assignmentEnabled={assignmentEnabled}
                  assignmentPeriod={assignmentPeriod}
                />
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>
    </div>
  )
}

function ScheduleEventDetailEditBlock({
  index,
  scheduleLabel,
  formMode,
  editForm,
  onRemove,
  isPreEducationBlock = false,
}: {
  index: number
  scheduleLabel: string
  formMode: 'view' | 'edit'
  editForm: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
  onRemove: () => void
  isPreEducationBlock?: boolean
}) {
  const assignmentEnabled =
    editForm.watch(`scheduleDetails.${index}.assignmentEnabled`) ?? false
  const assignmentPeriod = editForm.watch(`scheduleDetails.${index}.assignmentPeriod`) ?? ''
  const headingLabel = isPreEducationBlock ? '사전 교육' : scheduleLabel

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
                label="일정명"
                fullRow
                edit={
                  <Controller
                    name={`scheduleDetails.${index}.name`}
                    control={editForm.control}
                    render={({ field }) => (
                      <CmsInput
                        {...field}
                        value={isPreEducationBlock ? '사전 교육' : (field.value ?? '')}
                        inputSize="medium"
                        placeholder={
                          isPreEducationBlock ? '사전 교육' : '행사 일정명을 작성하세요'
                        }
                        width="100%"
                        style={{ minWidth: 0, flex: '1 1 0' }}
                        disabled={isPreEducationBlock}
                        readOnly={isPreEducationBlock}
                      />
                    )}
                  />
                }
                view="-"
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="진행 일정"
                edit={
                  <div className="detail-info-form-inputs-wrapper-no-gap">
                    <Controller
                      name={`scheduleDetails.${index}.scheduleDate`}
                      control={editForm.control}
                      render={({ field }) => {
                        const appliedRange = parseEducationScheduleLineToRange(field.value)
                        const appliedWithTime = Boolean(
                          appliedRange?.[0] &&
                            (appliedRange[0].hour() !== 0 || appliedRange[0].minute() !== 0)
                        )
                        return (
                          <ParagraphDatePicker
                            mode="single"
                            presetMode="date"
                            customizable={false}
                            suppressAutoTodayWhenEmpty
                            value={appliedRange?.[0] ?? null}
                            onChange={next => {
                              field.onChange(
                                next
                                  ? formatEducationScheduleLineFromRange([next, next])
                                  : ''
                              )
                            }}
                            appliedSurfaceRange={appliedRange}
                            appliedSurfaceWithTime={appliedWithTime}
                            width="100%"
                            placeholder="일정을 선택하세요"
                          />
                        )
                      }}
                    />
                  </div>
                }
                view="-"
              />
            </DetailInfoForm.Row>
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="과제 설정"
                fullRow
                view={
                  <CurriculumAssignmentSettingView
                    assignmentEnabled={assignmentEnabled}
                    assignmentPeriod={assignmentPeriod}
                  />
                }
                edit={
                  <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap program-registration-paragraph__assignment-row">
                    <Controller
                      name={`scheduleDetails.${index}.assignmentEnabled`}
                      control={editForm.control}
                      render={({ field }) => (
                        <CmsRadioGroup
                          size="large"
                          value={field.value ? 'yes' : 'no'}
                          onChange={e => {
                            const enabled = e.target.value === 'yes'
                            field.onChange(enabled)
                            if (!enabled) {
                              editForm.setValue(`scheduleDetails.${index}.assignmentPeriod`, '')
                            }
                          }}
                        >
                          <CmsRadio value="yes">있음</CmsRadio>
                          <CmsRadio value="no">없음</CmsRadio>
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
                            mode="single"
                            presetMode="period"
                            customizable={false}
                            suppressAutoTodayWhenEmpty
                            disabled={!assignmentEnabled}
                            value={appliedRange?.[0] ?? null}
                            onChange={() => {}}
                            appliedSurfaceRange={appliedRange}
                            onRangeChange={([start, end]) => {
                              periodField.onChange(
                                formatEducationScheduleLineFromRange([start, end])
                              )
                              if (!assignmentEnabled) {
                                editForm.setValue(
                                  `scheduleDetails.${index}.assignmentEnabled`,
                                  true
                                )
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
            </DetailInfoForm.Row>
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
                  render={({ field }) => (
                    <ParagraphTimePicker
                      endTimeAlwaysOn
                      placeholder="시간 선택"
                      width={200}
                      value={scheduleTimeStringToDayjs(field.value?.startTime)}
                      onTimeRangeChange={range => {
                        field.onChange({
                          startTime: range[0].format('HH:mm'),
                          endTime: range[1].format('HH:mm'),
                        })
                      }}
                    />
                  )}
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
            size="large"
            value={field.value ? 'yes' : 'no'}
            onChange={e => {
              const enabled = e.target.value === 'yes'
              field.onChange(enabled)
              if (!enabled) {
                editForm.setValue(`scheduleDetails.${index}.assignmentPeriod`, '')
              }
            }}
          >
            <CmsRadio value="yes">있음</CmsRadio>
            <CmsRadio value="no">없음</CmsRadio>
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
              size="large"
              value={field.value ?? 'online'}
              onChange={e => field.onChange(e.target.value)}
            >
              {perScheduleEducationFormOptions.map(opt => (
                <CmsRadio key={opt.value} value={opt.value}>
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

    if (perBlockLayoutPlan === 'assignment_education_then_ips') {
      return (
        <>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field label="과제 설정" edit={renderAssignmentFieldEdit()} view="-" />
            {renderEducationFormField()}
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">{renderIpsFormField({ fullRow: true })}</DetailInfoForm.Row>
        </>
      )
    }

    if (perBlockLayoutPlan === 'assignment_with_education') {
      return (
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field label="과제 설정" edit={renderAssignmentFieldEdit()} view="-" />
          {renderEducationFormField()}
        </DetailInfoForm.Row>
      )
    }

    if (perBlockLayoutPlan === 'assignment_with_ips') {
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
                      size="large"
                      value={field.value ?? 'individual'}
                      onChange={e => field.onChange(e.target.value)}
                    >
                      <CmsRadio value="individual">개인</CmsRadio>
                      <CmsRadio value="team">팀</CmsRadio>
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
                      size="large"
                      value={field.value ?? 'individual'}
                      onChange={e => field.onChange(e.target.value)}
                    >
                      <CmsRadio value="individual">개인</CmsRadio>
                      <CmsRadio value="team">팀</CmsRadio>
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
                        size="large"
                        value={field.value ?? 'individual'}
                        onChange={e => field.onChange(e.target.value)}
                      >
                        <CmsRadio value="individual">개인</CmsRadio>
                        <CmsRadio value="team">팀</CmsRadio>
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
                        size="large"
                        value={field.value ?? 'individual'}
                        onChange={e => field.onChange(e.target.value)}
                      >
                        <CmsRadio value="individual">개인</CmsRadio>
                        <CmsRadio value="team">팀</CmsRadio>
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
            {isSingleRound ? (
              <DetailInfoForm.Row type="double">
                <DetailInfoForm.Field
                  label="일정명"
                  edit={
                    <Controller
                      name={`scheduleDetails.${index}.name`}
                      control={editForm.control}
                      render={({ field }) => (
                        <CmsInput
                          {...field}
                          value={isPreEducationBlock ? '사전 교육' : (field.value ?? '')}
                          inputSize="medium"
                          placeholder="세부 일정명을 작성하세요"
                          width="100%"
                          style={{ minWidth: 0, flex: '1 1 0' }}
                          disabled={isPreEducationBlock}
                          readOnly={isPreEducationBlock}
                        />
                      )}
                    />
                  }
                  view="-"
                />
                <DetailInfoForm.Field label="진행 시간" edit={renderGroupTimeField()} view="-" />
              </DetailInfoForm.Row>
            ) : (
              <>
                <DetailInfoForm.Row type="single">
                  <DetailInfoForm.Field
                    label="일정명"
                    fullRow
                    edit={
                      <Controller
                        name={`scheduleDetails.${index}.name`}
                        control={editForm.control}
                        render={({ field }) => (
                          <CmsInput
                            {...field}
                            value={isPreEducationBlock ? '사전 교육' : (field.value ?? '')}
                            inputSize="medium"
                            placeholder="세부 일정명을 작성하세요"
                            width="100%"
                            style={{ minWidth: 0, flex: '1 1 0' }}
                            disabled={isPreEducationBlock}
                            readOnly={isPreEducationBlock}
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
                    edit={renderGroupTimeField()}
                    view="-"
                  />
                </DetailInfoForm.Row>
              </>
            )}
            {isSingleRound && (ipsPerSchedule || isPreEducationBlock) ? (
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
}: {
  editForm: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
  scheduleMeta: (typeof PROGRAM_REGISTRATION_GENERAL_SECTION_META)['educationScheduleCurriculum']
}) {
  const formMode = 'edit' as const
  const sessionRound = editForm.watch('sessionRound') ?? 'single'
  const educationFormScheduleDetail = editForm.watch('educationFormScheduleDetail') ?? 'common'
  const participationScheduleDetail = editForm.watch('participationScheduleDetail') ?? 'common'
  const ipsScheduleDetail = editForm.watch('ipsScheduleDetail') ?? 'common'
  const isMultiRound = sessionRound === 'multi'
  const multiAllPer = isScheduleMultiAllPerSchedule(
    sessionRound,
    educationFormScheduleDetail,
    participationScheduleDetail,
    ipsScheduleDetail
  )
  const blockKind: 'sub' | 'event' = multiAllPer ? 'event' : 'sub'
  const participantOrganization = editForm.watch('participantOrganization')
  const scheduleCurriculumPreEducation = editForm.watch('scheduleCurriculumPreEducation') ?? false

  useEffect(() => {
    if (!scheduleCurriculumPreEducation) return
    const details = editForm.getValues('scheduleDetails') ?? []
    if (details.length === 0) return
    editForm.setValue('scheduleDetails.0.name', '사전 교육', { shouldDirty: true })
    editForm.setValue('scheduleDetails.0.ipsCategory', 'prepare', { shouldDirty: true })
    editForm.setValue('scheduleDetails.0.ipsDetail', 'none', { shouldDirty: true })
  }, [editForm, scheduleCurriculumPreEducation])

  const { fields, append, remove } = useFieldArray({
    control: editForm.control,
    name: 'scheduleDetails',
  })

  const scheduleGroupCount = Math.min(
    Math.max(1, editForm.watch('scheduleGroupCount') ?? 2),
    PROGRAM_REGISTRATION_SCHEDULE_CURRICULUM_MAX_GROUP_COUNT
  )
  const effectiveScheduleGroupCount = isMultiRound ? 1 : scheduleGroupCount

  const handleAddGroup = useCallback(() => {
    if (
      isMultiRound ||
      multiAllPer ||
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
  }, [editForm, isMultiRound, multiAllPer, scheduleGroupCount])

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
    append(
      createEmptyScheduleDetailBlock(fields.length, {
        blockKind,
        groupCount: effectiveScheduleGroupCount,
      })
    )
  }, [append, blockKind, effectiveScheduleGroupCount, fields.length])

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
      title={`${scheduleMeta.title}*`}
      isFormEdit
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
              icon={<PlusOutlined aria-hidden />}
              onClick={handleAddDetail}
            >
              강의 행사 일정 추가
            </CmsButton>
          ) : isMultiRound ? (
            <CmsButton
              type="button"
              variant="secondary"
              size="medium"
              width={160}
              icon={<PlusOutlined aria-hidden />}
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
                icon={<ClockCircleOutlined aria-hidden />}
                onClick={handleAddGroup}
              >
                진행 그룹 구분 추가
              </CmsButton>
              <CmsButton
                type="button"
                variant="secondary"
                size="medium"
                width={160}
                icon={<PlusOutlined aria-hidden />}
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
      {!isMultiRound && !multiAllPer && fields.length > 0 && !participantOrganization ? (
        <DetailInfoForm
          title="교육 진행 (일정형)"
          hideHeader
          mode={formMode}
          className="program-registration-paragraph"
        >
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="참여 방식"
              fullRow
              edit={
                <Controller
                  name="participationMethod"
                  control={editForm.control}
                  render={({ field }) => (
                    <ParticipationMethodRadioGroup
                      value={field.value}
                      onChange={field.onChange}
                    />
                  )}
                />
              }
              view="-"
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      ) : null}
      {fields.map((field, index) => {
        const detailBlockKind =
          editForm.watch(`scheduleDetails.${index}.blockKind`) ??
          inferScheduleDetailBlockKind(
            editForm.watch(`scheduleDetails.${index}.scheduleLabel`) ?? ''
          )
        const scheduleLabel =
          editForm.watch(`scheduleDetails.${index}.scheduleLabel`) ??
          (detailBlockKind === 'event' ? padEventScheduleLabel(index) : padScheduleDetailLabel(index))

        if (detailBlockKind === 'event') {
          return (
            <ScheduleEventDetailEditBlock
              key={field.id}
              index={index}
              scheduleLabel={scheduleLabel}
              formMode={formMode}
              editForm={editForm}
              onRemove={() => handleRemoveDetail(index)}
              isPreEducationBlock={scheduleCurriculumPreEducation && index === 0}
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
  })
  const watchedStructure = isFormEdit
    ? form!.watch('educationStructure')
    : effectiveTypeFields.educationStructure

  if (watchedStructure !== 'schedule') return null

  const scheduleDetailsView = commonInfo.scheduleDetails ?? []
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
      />
    )
  }

  return (
    <ProgramRegistrationDetailSection
      title={scheduleMeta.title}
      bodyClassName="detail-common-info-view__section-body--schedule-curriculum"
    >
      {scheduleDetailsView.map(detail => {
        const isEventSchedule = detail.scheduleLabel.includes('행사 일정')
        if (isEventSchedule) {
          return (
            <ScheduleEventDetailViewBlock
              key={detail.scheduleLabel}
              scheduleLabel={detail.scheduleLabel}
              name={detail.name}
              scheduleDateLabel={detail.scheduleDateLabel}
              assignmentEnabled={detail.assignmentEnabled}
              assignmentPeriod={detail.assignmentPeriod}
            />
          )
        }
        return (
          <ScheduleDetailViewBlock
            key={detail.scheduleLabel}
            scheduleLabel={detail.scheduleLabel}
            name={detail.name}
            progressTimeSummary={detail.progressTimeSummary ?? '-'}
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

  const lines = form.watch('educationScheduleLines') ?? []
  const scheduleMode = form.watch('educationScheduleMode') ?? 'date'

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
      form.setValue(
        'educationScheduleLines',
        current.filter((_, i) => i !== index),
        { shouldDirty: true }
      )
    },
    [form]
  )

  const appendLineIfNew = useCallback(
    (line: string) => {
      const trimmed = line.trim()
      if (!trimmed) return
      const current = form.getValues('educationScheduleLines') ?? []
      if (current.includes(trimmed)) return
      form.setValue('educationScheduleLines', [...current, trimmed], { shouldDirty: true })
    },
    [form]
  )

  const handleScheduleRangeApply = useCallback(
    (range: [Dayjs, Dayjs]) => {
      appendLineIfNew(formatEducationScheduleLineFromRange(range))
      setSingleDate(null)
      setPeriodDate(null)
    },
    [appendLineIfNew]
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
                    size="large"
                    value={field.value ?? 'date'}
                    onChange={e => field.onChange(e.target.value)}
                  >
                    <CmsRadio value="date">날짜 지정</CmsRadio>
                    <CmsRadio value="period">기간 지정</CmsRadio>
                  </CmsRadioGroup>
                )}
              />
            </div>
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="교육 진행 일정 선택"
          edit={
            scheduleMode === 'date' ? (
              <ParagraphDatePicker
                mode="single"
                presetMode="schedule"
                customizable={false}
                suppressAutoTodayWhenEmpty
                value={singleDate}
                onChange={setSingleDate}
                onRangeChange={handleScheduleRangeApply}
                width={240}
              />
            ) : (
              <ParagraphDatePicker
                mode="single"
                presetMode="period"
                customizable={false}
                suppressAutoTodayWhenEmpty
                value={periodDate}
                onChange={setPeriodDate}
                onRangeChange={handleScheduleRangeApply}
                width={360}
              />
            )
          }
          view="-"
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="교육 진행 예정일"
          fullRow
          readOnlyDisplay
          view={<EducationSchedulePreviewLines lines={lines} onRemove={removeLine} />}
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
      title={isFormEdit ? `${scheduleMeta.title}*` : scheduleMeta.title}
      isFormEdit={isFormEdit}
      editDescription={scheduleMeta.editDescription}
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
  onEdit?: () => void
  onSave?: () => void
}

export function GeneralProgramDetailCommonInfoView({
  program,
  sponsorName,
  isEditMode = false,
  form,
  canWrite = false,
  onEdit,
  onSave,
}: GeneralProgramDetailCommonInfoViewProps) {
  const v = programToDetailEditValues(program)
  const operationRange = formatDateRange(program.startDate, program.endDate)
  const commonInfo = resolveGeneralProgramCommonInfo(program)

  return (
    <div className="detail-common-info-view program-detail-fullpage-modal__info-tab">
      {(canWrite || isEditMode) && (
        <div className="detail-common-info-view__header">
          <CmsButton
            {...PROGRAM_EDIT_INFO_BUTTON_PROPS}
            onClick={resolveProgramEditInfoClick(isEditMode, {
              onEnterEdit: onEdit ?? (() => {}),
              onSaveEdit: onSave ?? (() => {}),
            })}
            aria-label={PROGRAM_EDIT_INFO_BUTTON_LABEL}
          >
            {PROGRAM_EDIT_INFO_BUTTON_LABEL}
          </CmsButton>
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

      <KpiSection
        commonInfo={commonInfo}
        program={program}
        isEditMode={isEditMode}
        form={form}
      />
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
