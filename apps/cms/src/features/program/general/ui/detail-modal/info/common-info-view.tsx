/**
 * 일반 프로그램 상세 — 공통 정보 (조회 / 정보 수정)
 * 프로그램 등록 양식 overlay(단락 title + DetailInfoForm hideHeader)와 동일 레이아웃
 */

import { Fragment, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Controller, useFieldArray, type UseFormReturn } from 'react-hook-form'
import { PlusOutlined } from '@ant-design/icons'
import type { Program } from '@/types/domain'
import { mockSponsorManagementListRows } from '@/data/mock/sponsor-management-list'
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
import { getProgramProgressPhaseDisplay } from '@/shared/constants/status'
import { ProgramDetailSponsorLink } from '@/features/program/shared/ui/program-detail/program-detail-sponsor-link'
import { getSponsorDetailContactsNormalized } from '@/features/sponsor/lib/get-sponsor-detail-contacts'
import {
  isGeneralProgramMultiRoundCurriculum,
  resolveEffectiveGeneralProgramTypeFields,
} from '@/features/program/general/lib/curriculum-display'
import {
  GENERAL_PROGRAM_CURRICULUM_PROGRESS_SESSION_OPTIONS,
  formatGeneralProgramProgressSessionDisplay,
} from '@/features/program/general/lib/curriculum-progress-session-options'
import { CurriculumAssignmentSettingView } from '@/features/template/ui/shared/curriculum-assignment-setting-view'
import {
  formatGeneralParticipantTypesSummary,
  formatGeneralSurveyItemsSummary,
  resolveGeneralProgramCommonInfo,
} from '@/features/program/general/lib/detail-common-info-display'
import { getGeneralParticipantTypes } from '@/features/program/general/lib/detail-meta'
import {
  GENERAL_PROGRAM_EDUCATION_STRUCTURE_LABELS,
  GENERAL_PROGRAM_SESSION_ROUND_LABELS,
} from '@/features/program/general/lib/variant'
import {
  GENERAL_SURVEY_EDIT_FIELDS,
  getGeneralDetailedProgramSelectOptions,
  isGeneralProgramScheduleType,
  type GeneralProgramCommonInfoEditFormValues,
} from '@/features/program/general/model/common-info-edit-schema'
import { CmsButton } from '@/shared/ui'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsDateRangePicker } from '@/shared/ui/cms-datepicker'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import {
  TEMPLATE_FORM_BUSINESS_AREA_OPTIONS,
  TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS,
} from '@/features/template/lib/template-form-select-options'
import { PROGRAM_REGISTRATION_SURVEY_ITEM_LABELS } from '@/features/template/lib/program-registration-survey-items'
import { getTemplateRegistrationPaymentItemOptions } from '@/features/template/lib/template-registration-payment-item-options'
import {
  PROGRAM_REGISTRATION_COURSE_DELIVERED_BY_OPTIONS,
  PROGRAM_REGISTRATION_EDUCATION_COURSE_OPTIONS,
  PROGRAM_REGISTRATION_IP_OWNED_OPTIONS,
} from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-options'
import { ProgramRegistrationIpsTypeFields } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-ips-type-fields'
import { getProgramRegistrationEducationFormOptions } from '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-education-form-options'
import { PROGRAM_REGISTRATION_GENERAL_SECTION_META } from '@/features/template/ui/form-set/registration-form/general/program-registration-general-section-meta'
import {
  formatEducationScheduleLineFromRange,
  parseEducationScheduleLineToRange,
} from '@/features/template/lib/format-education-schedule-line'
import { EducationSchedulePreviewLines } from '@/features/template/ui/shared/education-schedule-preview-lines'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import '@/features/template/ui/shared/paragraph-date-picker.css'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import './common-info-view.css'

const PROGRAM_PROGRESS_STATIC_HINT = '일정에 따라 진행 현황이 자동으로 반영됩니다.'

const toDayjs = (d: string | Date | undefined) => (d ? dayjs(d) : null)
const toIso = (d: Dayjs | null) => (d ? d.toISOString() : '')

const PARTICIPANT_FORM_KEYS = {
  individual: 'participantIndividual',
  school_institution: 'participantOrganization',
  teacher_instructor: 'participantTeacherInstructor',
  volunteer: 'participantVolunteer',
} as const satisfies Record<
  (typeof TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS)[number]['value'],
  keyof GeneralProgramCommonInfoEditFormValues
>

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
}: {
  title: string
  children: ReactNode
  bodyClassName?: string
  /** 수정 모드에서만 타이틀 하단에 노출 */
  editDescription?: string
  titleTrailing?: ReactNode
}) {
  return (
    <section className="general-program-detail-common-info-view__section" aria-label={title}>
      <FormParagraphSectionHeader
        title={title}
        description={editDescription}
        titleTrailing={titleTrailing}
        surface="responseEntry"
        titleAligned
        headerClassName="detail-info-form__header"
        titleClassName="detail-info-form__title"
      />
      <div
        className={['general-program-detail-common-info-view__section-body', bodyClassName]
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
  const status = program.lifecycleStatus
  if (!status) return <>-</>
  const { label, color } = getProgramProgressPhaseDisplay(status)
  return (
    <span className="general-program-detail-common-info-view__progress-status" style={{ color }}>
      {label}
    </span>
  )
}

function KpiBoldNumber({ value }: { value: number }) {
  return <span className="general-program-detail-common-info-view__kpi-number">{value}</span>
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
  const sponsorOptions = useMemo(
    () => mockSponsorManagementListRows.map(s => ({ value: s.id, label: s.name })),
    []
  )

  const announcementTitle = commonInfo.announcementTitle ?? program.title
  const detailedName =
    commonInfo.detailedProgramName?.trim() ||
    program.textbookName?.trim() ||
    program.teamDivision?.trim() ||
    (isScheduleType ? '해당없음' : '-')
  const venueType =
    program.institutionType === 'inside_school'
      ? '기관 안'
      : program.institutionType === 'outside_school'
        ? '기관 밖'
        : program.venue?.trim() || '기관 안'
  const venueLine = [venueType, commonInfo.venueDetail?.trim() || '-'].join(' | ')
  const resolvedSponsorName =
    commonInfo.sponsorDisplayName?.trim() || sponsorName?.trim() || ''
  const sponsorDisplay = resolvedSponsorName ? (
    <ProgramDetailSponsorLink
      name={resolvedSponsorName}
      sponsorId={program.sponsorId}
      sponsorName={resolvedSponsorName}
      sponsorManagementId={commonInfo.sponsorManagementId}
    />
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

  const watchedSponsorId = isFormEdit ? editForm.watch('sponsorManagementId') : ''
  const selectedSponsor = useMemo(
    () => mockSponsorManagementListRows.find(s => s.id === watchedSponsorId) ?? null,
    [watchedSponsorId]
  )
  const managerOptions = useMemo(() => {
    if (!selectedSponsor) return []
    return getSponsorDetailContactsNormalized(selectedSponsor).map(c => ({
      value: c.id,
      label: c.name,
    }))
  }, [selectedSponsor])

  useEffect(() => {
    if (!isFormEdit) return
    const currentManagerId = editForm.getValues('sponsorManagerContactId')
    if (!watchedSponsorId) {
      if (currentManagerId) editForm.setValue('sponsorManagerContactId', '')
      return
    }
    if (managerOptions.length === 0) {
      if (currentManagerId) editForm.setValue('sponsorManagerContactId', '')
      return
    }
    if (!managerOptions.some(o => o.value === currentManagerId)) {
      editForm.setValue('sponsorManagerContactId', managerOptions[0]?.value ?? '')
    }
  }, [editForm, isFormEdit, managerOptions, watchedSponsorId])

  const participantOrganization = isFormEdit ? editForm.watch('participantOrganization') : false
  const participantIndividual = isFormEdit ? editForm.watch('participantIndividual') : false

  const mainFormMode = isFormEdit ? 'edit' : 'view'
  const courseFormMode = isFormEdit ? 'edit' : 'view'

  return (
    <ProgramRegistrationDetailSection
      title="기본 정보"
      bodyClassName="general-program-detail-common-info-view__section-body--basic-info"
    >
      <DetailInfoForm
        title="기본 정보 — 등록 이력"
        hideHeader
        mode="view"
        className="program-registration-paragraph general-program-detail-common-info-view__basic-info-dates-form"
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
        className="program-registration-paragraph general-program-detail-common-info-view__basic-info-main-form"
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
                render={({ field }) => (
                  <CmsDateRangePicker
                    value={[toDayjs(field.value), toDayjs(editForm.watch('endDate'))]}
                    onChange={dates => {
                      const [start, end] = dates ?? [null, null]
                      field.onChange(toIso(start))
                      editForm.setValue('endDate', toIso(end))
                    }}
                    format="YYYY. MM. DD"
                    width="100%"
                    status={
                      editForm.formState.errors.startDate || editForm.formState.errors.endDate
                        ? 'error'
                        : undefined
                    }
                  />
                )}
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
                {TEMPLATE_FORM_PARTICIPANT_TYPE_OPTIONS.map(option => {
                  const formKey =
                    PARTICIPANT_FORM_KEYS[
                      option.value as keyof typeof PARTICIPANT_FORM_KEYS
                    ]
                  const disabled =
                    (option.value === 'individual' && participantOrganization) ||
                    (option.value === 'school_institution' && participantIndividual)
                  return (
                    <Controller
                      key={option.value}
                      name={formKey}
                      control={editForm.control}
                      render={({ field }) => (
                        <CmsCheckbox
                          checkboxSize="large"
                          checked={Boolean(field.value)}
                          disabled={disabled}
                          onChange={e => field.onChange(e.target.checked)}
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
                name="sponsorManagementId"
                control={editForm.control}
                render={({ field }) => (
                  <CmsSelect
                    withAllOption={false}
                    placeholder="후원사를 선택하세요"
                    width="100%"
                    showSearch
                    optionFilterProp="label"
                    options={sponsorOptions}
                    value={field.value || undefined}
                    onChange={v => {
                      field.onChange(String(v ?? ''))
                      editForm.setValue('sponsorManagerContactId', '')
                    }}
                    status={editForm.formState.errors.sponsorManagementId ? 'error' : undefined}
                  />
                )}
              />
            }
          />
          <DetailInfoForm.Field
            label="후원사 담당자"
            view={commonInfo.sponsorManagerLine?.trim() || program.managerName || '-'}
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
                    disabled={!watchedSponsorId || managerOptions.length === 0}
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
            view={venueLine}
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
                {GENERAL_SURVEY_EDIT_FIELDS.map(({ id, formKey }) => (
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
                        {PROGRAM_REGISTRATION_SURVEY_ITEM_LABELS[id]}
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
        className="program-registration-paragraph general-program-detail-common-info-view__basic-info-course-form"
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
  if (!kpi && !isEditMode) return null

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
                  <CmsInput
                    {...field}
                    value={field.value ?? ''}
                    onChange={e => field.onChange(Number(e.target.value) || 0)}
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
                <Controller
                  name="kpiInstructorCount"
                  control={editForm.control}
                  render={({ field }) => (
                    <CmsInput
                      {...field}
                      value={field.value ?? ''}
                      onChange={e => field.onChange(Number(e.target.value) || 0)}
                      disabled={!hasInstructor}
                      inputSize="medium"
                      placeholder={hasInstructor ? '목표값 입력' : '해당 없음'}
                      width={120}
                    />
                  )}
                />
                <DetailInfoForm.InputsSeparator />
                <span className="detail-info-form--text mr-6">봉사자</span>
                <Controller
                  name="kpiVolunteerCount"
                  control={editForm.control}
                  render={({ field }) => (
                    <CmsInput
                      {...field}
                      value={field.value ?? ''}
                      onChange={e => field.onChange(Number(e.target.value) || 0)}
                      disabled={!hasVolunteer}
                      inputSize="medium"
                      placeholder={hasVolunteer ? '목표값 입력' : '해당 없음'}
                      width={120}
                    />
                  )}
                />
              </div>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="최종 파견 학교 수"
            view={<KpiBoldNumber value={kpi?.finalSchools ?? 0} />}
            edit={
              <CmsInput
                disabled
                inputSize="medium"
                placeholder="해당 없음"
                width={120}
                value=""
              />
            }
          />
          <DetailInfoForm.Field
            label="최종 파견 학급 수"
            view={<KpiBoldNumber value={kpi?.finalClasses ?? 0} />}
            edit={
              <CmsInput
                disabled
                inputSize="medium"
                placeholder="해당 없음"
                width={120}
                value=""
              />
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
  const paymentItemOptions = useMemo(() => getTemplateRegistrationPaymentItemOptions(), [])

  const editForm =
    form ??
    ({
      control: undefined,
      formState: { errors: {} },
      watch: () => undefined,
    } as unknown as UseFormReturn<GeneralProgramCommonInfoEditFormValues>)

  const wageFields = [
    { label: '1급 강사비', name: 'wageGrade1Amount' as const, maxHint: '500,000' },
    { label: '2급 강사비', name: 'wageGrade2Amount' as const, maxHint: '400,000' },
    { label: '3급 강사비', name: 'wageGrade3Amount' as const, maxHint: '300,000' },
  ]

  return (
    <ProgramRegistrationDetailSection title="임금 정보">
      <DetailInfoForm title="임금 정보" hideHeader mode={formMode} className="program-registration-paragraph">
        {wageFields.map(({ label, name, maxHint }, index) => {
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
                        <CmsInput
                          {...field}
                          value={field.value ?? ''}
                          inputSize="medium"
                          placeholder="직접 입력"
                          width={120}
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
                    onChange={next => field.onChange(next as string[])}
                    options={paymentItemOptions}
                    placeholder="지급 항목을 선택하세요"
                    style={{ width: '100%', minWidth: 0 }}
                  />
                )}
              />
            }
          />
          <DetailInfoForm.Field
            label="공제 항목"
            view={commonInfo.deductionItems ?? '-'}
            edit={
              <Controller
                name="wageDeductionItems"
                control={editForm.control}
                render={({ field }) => (
                  <CmsInput
                    {...field}
                    value={field.value ?? ''}
                    inputSize="medium"
                    placeholder="공제 항목"
                    width="100%"
                  />
                )}
              />
            }
          />
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
                  onChange={e => field.onChange(e.target.value)}
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
                  onChange={e => field.onChange(e.target.value)}
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
  const isMultiRoundType = isGeneralProgramMultiRoundCurriculum({
    educationStructure: watchedStructure ?? effectiveTypeFields.educationStructure,
    sessionRound: watchedSessionRound ?? effectiveTypeFields.sessionRound,
    curriculumSessions: watchedCurriculumSessions ?? commonInfo.curriculumSessions,
  })
  const isSingle = !isMultiRoundType
  const isOrganization = participantOrganization

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

  return (
    <ProgramRegistrationDetailSection
      title="프로그램 유형 설정"
      bodyClassName="general-program-detail-common-info-view__section-body--type-settings"
    >
      <DetailInfoForm
        title="프로그램 유형 설정"
        hideHeader
        mode={formMode}
        className="program-registration-paragraph general-program-detail-common-info-view__type-settings-structure-form"
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
                    onChange={e => field.onChange(e.target.value)}
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
                    onChange={e => field.onChange(e.target.value)}
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
          className="program-registration-paragraph general-program-detail-common-info-view__type-settings-detail-form"
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
                view="개인"
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
          className="program-registration-paragraph general-program-detail-common-info-view__type-settings-detail-form"
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
              commonDetailView="개인"
              perScheduleHint="교육 진행 항목에서 회차 별로 입력해 주세요"
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
  showEducationAndIpsPerRound,
  educationFormOptions,
}: {
  index: number
  session: CurriculumSessionViewModel
  formMode: 'view' | 'edit'
  editForm: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
  isFormEdit: boolean
  onRemove: () => void
  showEducationAndIpsPerRound: boolean
  educationFormOptions: ReturnType<typeof getProgramRegistrationEducationFormOptions>
}) {
  const assignmentEnabled = editForm.watch(`curriculumSessions.${index}.assignmentEnabled`) ?? false
  const sessionIpsCategory =
    editForm.watch(`curriculumSessions.${index}.ipsCategory`) ?? ''
  const sessionIpsDetail = editForm.watch(`curriculumSessions.${index}.ipsDetail`) ?? ''
  const classFieldLabel = isFormEdit
    ? `${session.sessionLabel.replace(/회차$/, '')}회차 수업`
    : '차시 및 교육 내용'

  return (
    <div className="program-registration-curriculum__session-block">
      <div className="program-registration-curriculum__session-heading">■ {session.sessionLabel}</div>
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
                          value={appliedRange?.[0] ?? dayjs()}
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
          {showEducationAndIpsPerRound ? (
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
                fullRow
                view={<PipeSeparatedInlineView text={session.ipsTypeSummary} />}
                edit={
                  <ProgramRegistrationIpsTypeFields
                    value={{
                      category: sessionIpsCategory,
                      detail: sessionIpsDetail,
                    }}
                    onChange={next => {
                      editForm.setValue(`curriculumSessions.${index}.ipsCategory`, next.category)
                      editForm.setValue(`curriculumSessions.${index}.ipsDetail`, next.detail)
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
            aria-label={`${session.sessionLabel} 삭제`}
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
}: {
  index: number
  session: CurriculumSessionViewModel
  formMode: 'view' | 'edit'
  editForm: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
  isFormEdit: boolean
  onRemove: () => void
}) {
  return (
    <div className="program-registration-curriculum__session-block">
      <div className="program-registration-curriculum__session-heading">■ {session.sessionLabel}</div>
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
        </DetailInfoForm>
        {isFormEdit && index > 0 ? (
          <ItemDeleteButton
            className="item-delete-button program-registration-curriculum__session-delete"
            aria-label={`${session.sessionLabel} 삭제`}
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
  const isMultiRoundCurriculum = isGeneralProgramMultiRoundCurriculum({
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
  const showEducationAndIpsPerRound =
    isMultiRoundCurriculum && educationFormScheduleDetail === 'perSchedule'
  const educationFormOptions = getProgramRegistrationEducationFormOptions(
    Boolean(participantOrganization)
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
          educationFormLabel: showEducationAndIpsPerRound
            ? educationFormOptions.find(o => o.value === educationForm)?.label
            : undefined,
          ipsTypeSummary: showEducationAndIpsPerRound
            ? [ipsCategory, ipsDetail].filter(Boolean).join(' | ') || undefined
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

  if (watchedStructure === 'schedule' && !isFormEdit) return null
  if (watchedStructure === 'schedule' && isFormEdit && sessions.length === 0) return null
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
    append({
      sessionLabel: `${nextIndex}차시`,
      title: '',
      description: '',
    })
  }

  const sessionBlocks = sessions.map((session, index) =>
    isMultiRoundCurriculum ? (
      <MultiRoundCurriculumSessionForm
        key={fields[index]?.id ?? session.sessionLabel ?? index}
        index={index}
        session={session}
        formMode={formMode}
        editForm={editForm}
        isFormEdit={isFormEdit}
        onRemove={() => remove(index)}
        showEducationAndIpsPerRound={showEducationAndIpsPerRound}
        educationFormOptions={educationFormOptions}
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
      />
    )
  )

  const curriculumMeta = PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationCurriculum

  return (
    <ProgramRegistrationDetailSection
      title={isFormEdit ? `${curriculumMeta.title}*` : curriculumMeta.title}
      editDescription={
        isMultiRoundCurriculum
          ? PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationCurriculum.editDescriptionMultiRound
          : isFormEdit
            ? curriculumMeta.editDescription
            : undefined
      }
      titleTrailing={
        isFormEdit ? (
          <CmsButton
            type="button"
            variant="secondary"
            size="medium"
            width={180}
            icon={<PlusOutlined aria-hidden />}
            onClick={handleAddSession}
          >
            {isMultiRoundCurriculum ? '강의 진행 회차 추가' : '강의 진행 차시 추가'}
          </CmsButton>
        ) : undefined
      }
      bodyClassName="general-program-detail-common-info-view__section-body--curriculum"
    >
      {isFormEdit ? (
        <div className="program-registration-curriculum__sessions">{sessionBlocks}</div>
      ) : (
        sessionBlocks
      )}
    </ProgramRegistrationDetailSection>
  )
}

function ScheduleSettingsEditFields({
  form,
}: {
  form: UseFormReturn<GeneralProgramCommonInfoEditFormValues>
}) {
  const scheduleMode = form.watch('educationScheduleMode') ?? 'date'
  const [singleDate, setSingleDate] = useState<Dayjs | null>(null)
  const [periodDate, setPeriodDate] = useState<Dayjs | null>(null)

  const lines = form.watch('educationScheduleLines') ?? []

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

  useEffect(() => {
    if (scheduleMode !== 'date') return
    setPeriodDate(null)
  }, [scheduleMode])

  useEffect(() => {
    if (scheduleMode !== 'period') return
    setSingleDate(null)
  }, [scheduleMode])

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
  commonInfo,
  isEditMode = false,
  form,
}: {
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
    } as unknown as UseFormReturn<GeneralProgramCommonInfoEditFormValues>)

  const lines = isFormEdit
    ? (editForm.watch('educationScheduleLines') ?? [])
    : (commonInfo.educationScheduleLines ?? [])

  if (lines.length === 0 && !isFormEdit) return null

  const scheduleMeta = PROGRAM_REGISTRATION_GENERAL_SECTION_META.educationScheduleSettings

  return (
    <ProgramRegistrationDetailSection
      title={isFormEdit ? `${scheduleMeta.title}*` : scheduleMeta.title}
      editDescription={isFormEdit ? scheduleMeta.editDescription : undefined}
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
    <div className="general-program-detail-common-info-view program-detail-fullpage-modal__info-tab">
      {(canWrite || isEditMode) && (
        <div className="general-program-detail-common-info-view__header">
          <CmsButton
            onClick={isEditMode ? onSave : onEdit}
            aria-label={isEditMode ? '공통 정보 저장' : '공통 정보 수정'}
          >
            {isEditMode ? '정보 저장' : '정보 수정'}
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
      <ScheduleSettingsSection commonInfo={commonInfo} isEditMode={isEditMode} form={form} />
    </div>
  )
}
