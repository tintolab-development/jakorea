/**
 * 기본 정보 섹션 (프로그램 상세 정보 탭)
 * - 상단 테이블: 최초 등록일, 마지막 수정일, 프로그램 진행 방식, 프로그램 진행 현황
 * - 하위 테이블: 썸네일, 프로그램명, 운영 기간, 수강자 유형, 교육 분야, 교육 대상, 교육 대상 상세, 후원사, 후원사 담당자, 문의처, 비고
 * - 수강자 모집 테이블: 모집 인원, 모집 현황, 모집 기간, 결과 발표일 및 방법
 * - 강사 모집 테이블: 모집 인원, 모집 현황, 기간, 1차/2차/최종 발표 (표시)
 * - 수정 모드: react-hook-form Controller, 기존 프로그램 값이 default로 채워짐
 */


import { CmsRadio } from '@/shared/ui/cms-radio'
import { CmsDateRangePicker } from '@/shared/ui/cms-datepicker'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { Controller } from 'react-hook-form'
import { useSponsorSelectOptions } from '@/features/sponsor/hooks/use-sponsor-options-query'
import { useSponsorContactsQuery } from '@/features/sponsor/hooks/use-sponsor-contacts-query'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import type { UseFormReturn } from 'react-hook-form'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { DetailInfoForm } from '@/shared/components/detail-info-form/detail-info-form'
import { ProgramDetailSponsorLink } from '@/features/program/shared/ui/program-detail/program-detail-sponsor-link'
import { mockSponsorManagementListRows } from '@/data/mock/sponsor-management-list'
import { getSponsorDetailContactsNormalized } from '@/features/sponsor/lib/get-sponsor-detail-contacts'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import {
  PROGRAM_REGISTRATION_SURVEY_ITEM_IDS,
  PROGRAM_REGISTRATION_SURVEY_ITEM_LABELS,
} from '@/features/template/lib/program-registration-survey-items'
import {
  formatDate,
  formatDateRange,
  CATEGORY_LABEL,
  CATEGORY_OPTIONS,
  BUSINESS_AREA_OPTIONS,
  EDUCATION_PROCESS_OPTIONS,
  IP_OWNED_OPTIONS,
  COURSE_DELIVERED_BY_OPTIONS,
  PARTNER_INVOLVEMENT_OPTIONS,
  IPS_OPTIONS,
  PROGRAM_CATEGORY_OPTIONS,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { ProgramLifecycleEnrollmentStatusText } from '@/shared/components/program-enrollment-status-text'
import dayjs from 'dayjs'
import type { Dayjs } from 'dayjs'

function ProgramProgressReadonlyCell({ status }: { status: ProgramLifecycleStatus }) {
  return <ProgramLifecycleEnrollmentStatusText lifecycleStatus={status} />
}

export interface BasicInfoSectionProps {
  program: Program
  sponsorName?: string
  createdByName?: string
  updatedByName?: string
  lifecycleStatus?: ProgramLifecycleStatus
  isEditMode?: boolean
  /** 수정 모드일 때만 전달, react-hook-form 인스턴스 */
  form?: UseFormReturn<ProgramDetailEditFormValues>
  /**
   * 1사1교 레이아웃 강제 (교육받은 교사 등 파생 유형 전용 opt-in).
   * 미지정 시 기존 id/타이틀 기반 판별 유지 — 다른 유형 동작 불변.
   */
  forceCompanySchoolLayout?: boolean
}

const toDayjs = (d: string | Date | undefined) => (d ? dayjs(d) : null)
const toIso = (d: Dayjs | null) => (d ? d.toISOString() : '')

const GENERAL_PARTICIPANT_TYPE_LABELS: Record<string, string> = {
  individual: '개인',
  school_institution: '학교/기관',
  teacher_instructor: '강사',
  volunteer: '봉사자',
}

const PARTNER_INVOLVEMENT_SELECT_OPTIONS = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
]

function isCompanySchoolProgram(program: Program): boolean {
  return (
    program.id.startsWith('economy-prog-') ||
    program.id.startsWith('company-school-prog-') ||
    program.id.startsWith('company-school-local-') ||
    program.mainTitle?.includes('1사1교') === true ||
    program.title.includes('1사1교')
  )
}

function formatCompanySchoolParticipantTypes(program: Program): string {
  const labels = (program.generalParticipantTypes ?? [])
    .map(type => GENERAL_PARTICIPANT_TYPE_LABELS[type] ?? type)
    .filter(Boolean)
  if (labels.length > 0) return labels.join(', ')
  return '학교/기관, 강사'
}

function formatCompanySchoolSurveyItems(program: Program): string {
  const keys = new Set<string>(program.generalSurveyMenuKeys ?? [])
  const labels: string[] = []
  if (keys.has('survey')) labels.push('설문조사')
  if (
    keys.has('satisfaction') ||
    keys.has('student_satisfaction') ||
    keys.has('teacher_satisfaction')
  ) {
    labels.push('만족도조사')
  }
  if (keys.has('lecture_evaluation')) labels.push('강의평가')
  return labels.length > 0 ? labels.join(', ') : '-'
}

function formatCompanySchoolVenue(program: Program): string {
  const kindLabel =
    program.institutionType === 'inside_school'
      ? '기관 안'
      : program.institutionType === 'outside_school'
        ? '기관 밖'
        : '기관 안'
  const detail = program.generalCommonInfo?.venueDetail?.trim() || '-'
  return `${kindLabel} | ${detail}`
}

function optionLabel(
  options: readonly { value: string; label: string }[],
  value: string | undefined | null
): string {
  if (!value) return '-'
  return options.find(option => option.value === value)?.label ?? value
}

function dateRangeUsesClockTime(range: [Dayjs, Dayjs]): boolean {
  return range.some(d => d.hour() !== 0 || d.minute() !== 0 || d.second() !== 0)
}

export function BasicInfoSection({
  program,
  sponsorName,
  createdByName,
  updatedByName,
  lifecycleStatus,
  isEditMode = false,
  form,
  forceCompanySchoolLayout = false,
}: BasicInfoSectionProps) {
  const isFormEdit = isEditMode && form
  const { options: sponsorOptions } = useSponsorSelectOptions(Boolean(isFormEdit || program.sponsorId))
  const watchedSponsorId = isFormEdit ? form?.watch('sponsorId') : program.sponsorId
  const contactsQuery = useSponsorContactsQuery(watchedSponsorId, Boolean(isFormEdit))
  const managers = contactsQuery.data ?? []
  const categoryLabel = CATEGORY_LABEL[program.category] ?? program.category ?? '-'

  /* 공통 정보 탭 기본 정보 */
  const BOOLEAN_LABEL: Record<string, string> = {
    true: 'Yes',
    false: 'No',
  }
  const partnerLabel =
    program.partnerInvolvement != null ? BOOLEAN_LABEL[String(program.partnerInvolvement)] : '-'

  const COURSE_DELIVERED_LABEL: Record<string, string> = {
    JA: 'JA',
    Jointly: 'Jointly',
    Partner: 'Partner',
  }
  const courseDeliveredLabel = program.courseDeliveredBy
    ? (COURSE_DELIVERED_LABEL[program.courseDeliveredBy] ?? program.courseDeliveredBy)
    : '-'

  const commonInfoFormEdit = isFormEdit && form
  const commonInfoForm =
    form ??
    ({
      control: undefined,
      formState: { errors: {} },
      watch: () => undefined,
      setValue: () => undefined,
      getValues: () => undefined,
    } as unknown as UseFormReturn<ProgramDetailEditFormValues>)

  if (forceCompanySchoolLayout || isCompanySchoolProgram(program)) {
    const commonInfo = program.generalCommonInfo
    const announcementTitle = commonInfo?.announcementTitle ?? program.title
    const detailedProgramName =
      commonInfo?.detailedProgramName ?? program.textbookName ?? program.title ?? '-'
    const educationProcessLabel = optionLabel(EDUCATION_PROCESS_OPTIONS, program.educationProcess)
    const ipOwnedLabel = optionLabel(IP_OWNED_OPTIONS, program.ipOwned ?? 'JA')
    const courseDeliveredByLabel = optionLabel(
      COURSE_DELIVERED_BY_OPTIONS,
      program.courseDeliveredBy ?? 'JA'
    )
    const ipsLabel = optionLabel(IPS_OPTIONS, program.ips ?? 'Prepare')
    const selectedSponsorManagementIds = commonInfoFormEdit
      ? (commonInfoForm.watch('sponsorManagementIds') ?? [])
      : (commonInfo?.sponsorManagementIds ?? [])
    const selectedSponsorManagementRows = selectedSponsorManagementIds
      .map(id => mockSponsorManagementListRows.find(row => row.id === id))
      .filter((row): row is NonNullable<typeof row> => row != null)
    const sponsorManagementOptions = mockSponsorManagementListRows.map(row => ({
      value: row.id,
      label: row.name,
    }))
    const sponsorManagerOptions = selectedSponsorManagementRows.flatMap(sponsor =>
      getSponsorDetailContactsNormalized(sponsor).map(contact => ({
        value: `${sponsor.id}:${contact.id}`,
        label:
          selectedSponsorManagementRows.length > 1
            ? `${sponsor.name} · ${contact.position ? `${contact.position} ` : ''}${contact.name}`
            : contact.position
              ? `${contact.position} ${contact.name}`
              : contact.name,
        sponsorId: sponsor.id,
        contactId: contact.id,
        name: contact.name,
        phone: contact.phone,
      }))
    )

    return (
      <div className="project-info-basic-info-section__company-school-forms">
        <DetailInfoForm title="기본 정보" mode="view">
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="최초 등록일"
              view={
                <>
                  {formatDate(program.createdAt)}
                  <DetailInfoForm.InputsSeparator />
                  {createdByName ?? '-'}
                </>
              }
            />
            <DetailInfoForm.Field
              label="마지막 수정일"
              view={
                <>
                  {formatDate(program.updatedAt)}
                  <DetailInfoForm.InputsSeparator />
                  {updatedByName ?? '-'}
                </>
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>

        <DetailInfoForm title="기본 정보" hideHeader mode={commonInfoFormEdit ? 'edit' : 'view'}>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="대표 프로그램명 (국문)"
              view={program.mainTitle ?? '-'}
              edit={
                <Controller
                  name="mainTitle"
                  control={commonInfoForm.control}
                  render={({ field }) => (
                    <CmsInput
                      {...field}
                      value={field.value ?? ''}
                      placeholder="대표 프로그램명을 입력하세요"
                      width="100%"
                    />
                  )}
                />
              }
            />
            <DetailInfoForm.Field
              label="대표 프로그램명 (영문)"
              view={program.titleEn ?? '-'}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="공고용 프로그램명"
              view={announcementTitle}
              edit={
                <Controller
                  name="title"
                  control={commonInfoForm.control}
                  render={({ field }) => (
                    <CmsInput
                      {...field}
                      value={field.value ?? ''}
                      placeholder="공고용 프로그램명을 입력하세요"
                      width="100%"
                    />
                  )}
                />
              }
            />
            <DetailInfoForm.Field
              label="세부 프로그램명"
              view={detailedProgramName}
              edit={
                <Controller
                  name="title"
                  control={commonInfoForm.control}
                  render={({ field }) => (
                    <CmsInput
                      {...field}
                      value={field.value ?? ''}
                      placeholder="세부 프로그램명을 입력하세요"
                      width="100%"
                    />
                  )}
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="사업 운영 기간"
              view={formatDateRange(program.startDate, program.endDate)}
              edit={
                <Controller
                  name="startDate"
                  control={commonInfoForm.control}
                  render={({ field }) => {
                    const start = toDayjs(field.value)
                    const end = toDayjs(commonInfoForm.watch('endDate'))
                    const operationRange = start && end ? ([start, end] as [Dayjs, Dayjs]) : null
                    const operationRangeWithTime =
                      operationRange != null ? dateRangeUsesClockTime(operationRange) : false

                    return (
                      <div className="detail-info-form-inputs-wrapper-no-gap">
                        <ParagraphDatePicker
                          mode="single"
                          presetMode="period"
                          value={start ?? null}
                          width="100%"
                          placeholder="사업 운영 기간을 선택하세요"
                          preferPeriodModeInPopover
                          appliedSurfaceRange={operationRange}
                          appliedSurfaceWithTime={operationRangeWithTime}
                          onRangeChange={range => {
                            field.onChange(toIso(range[0]))
                            commonInfoForm.setValue('endDate', toIso(range[1]), {
                              shouldValidate: true,
                              shouldDirty: true,
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
              view={lifecycleStatus ? <ProgramProgressReadonlyCell status={lifecycleStatus} /> : '-'}
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="참여자 유형"
              view={formatCompanySchoolParticipantTypes(program)}
            />
            <DetailInfoForm.Field
              label="사업 분야"
              view={program.businessArea ?? '-'}
              edit={
                <Controller
                  name="businessArea"
                  control={commonInfoForm.control}
                  render={({ field }) => (
                    <CmsSelect
                      value={field.value ?? undefined}
                      options={BUSINESS_AREA_OPTIONS}
                      onChange={v => field.onChange(v ?? undefined)}
                      width="100%"
                    />
                  )}
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="후원사"
              view={
                selectedSponsorManagementRows.length > 0 ? (
                  <>
                    {selectedSponsorManagementRows.map((row, index) => (
                      <span key={row.id}>
                        {index > 0 ? ', ' : null}
                        <ProgramDetailSponsorLink
                          name={row.name}
                          sponsorId={program.sponsorId}
                          sponsorName={row.name}
                          sponsorManagementId={row.id}
                        />
                      </span>
                    ))}
                  </>
                ) : sponsorName ? (
                  <ProgramDetailSponsorLink
                    name={sponsorName}
                    sponsorId={program.sponsorId}
                    sponsorName={sponsorName}
                  />
                ) : '-'
              }
              edit={
                <Controller
                  name="sponsorManagementIds"
                  control={commonInfoForm.control}
                  render={({ field }) => (
                    <CmsSelect
                      mode="multiple"
                      withAllOption={false}
                      placeholder="후원사를 선택하세요"
                      width="100%"
                      showSearch
                      optionFilterProp="label"
                      options={sponsorManagementOptions}
                      value={field.value ?? []}
                      onChange={next => {
                        field.onChange(Array.isArray(next) ? next.map(String) : [])
                        commonInfoForm.setValue('sponsorManagerContactId', undefined)
                      }}
                    />
                  )}
                />
              }
            />
            <DetailInfoForm.Field
              label="후원사 담당자"
              view={
                program.managerName || program.contactPhone ? (
                  <>
                    {program.managerName ?? ''}
                    {program.managerName && program.contactPhone ? (
                      <DetailInfoForm.InputsSeparator />
                    ) : null}
                    {program.contactPhone ? <span>{program.contactPhone}</span> : null}
                  </>
                ) : (
                  '-'
                )
              }
              edit={
                <Controller
                  name="sponsorManagerContactId"
                  control={commonInfoForm.control}
                  render={({ field }) => (
                    <CmsSelect
                      withAllOption={false}
                      placeholder="후원사 담당자를 선택하세요"
                      width="100%"
                      options={sponsorManagerOptions}
                      value={field.value ?? undefined}
                      disabled={sponsorManagerOptions.length === 0}
                      onChange={next => {
                        const value = next == null ? undefined : String(next)
                        field.onChange(value)
                        const selected = sponsorManagerOptions.find(option => option.value === value)
                        commonInfoForm.setValue('managerName', selected?.name ?? '')
                        commonInfoForm.setValue('contactPhone', selected?.phone)
                      }}
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
              view={formatCompanySchoolVenue(program)}
              edit={
                <div className="detail-info-form-inputs-wrapper">
                  <Controller
                    name="venueKind"
                    control={commonInfoForm.control}
                    render={({ field }) => (
                      <CmsRadio.Group
                        size="large"
                        value={field.value ?? 'inside'}
                        onChange={event => field.onChange(event.target.value)}
                      >
                        <CmsRadio value="inside">기관 안</CmsRadio>
                        <CmsRadio value="outside">기관 밖</CmsRadio>
                        <CmsRadio value="other">기타(직접입력)</CmsRadio>
                      </CmsRadio.Group>
                    )}
                  />
                  <DetailInfoForm.InputsSeparator />
                  <Controller
                    name="venueDetail"
                    control={commonInfoForm.control}
                    render={({ field }) => (
                      <CmsInput
                        inputSize="medium"
                        placeholder="교육이 진행될 상세 장소를 입력해 주세요"
                        width="100%"
                        style={{ flex: '1 1 0', minWidth: 0 }}
                        value={field.value ?? ''}
                        onChange={field.onChange}
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
              view={formatCompanySchoolSurveyItems(program)}
              edit={
                <div className="detail-info-form-inputs-wrapper">
                  {PROGRAM_REGISTRATION_SURVEY_ITEM_IDS.map(id => (
                    <Controller
                      key={id}
                      name={
                        id === 'survey'
                          ? 'surveySurvey'
                          : id === 'satisfaction'
                            ? 'surveySatisfaction'
                            : 'surveyLectureEvaluation'
                      }
                      control={commonInfoForm.control}
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

        <DetailInfoForm title="기본 정보 — 교육 과정" hideHeader mode={commonInfoFormEdit ? 'edit' : 'view'}>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="교육 과정"
              view={educationProcessLabel}
              edit={
                <Controller
                  name="educationProcess"
                  control={commonInfoForm.control}
                  render={({ field }) => (
                    <CmsSelect
                      withAllOption={false}
                      placeholder="교육 과정을 선택하세요"
                      width="100%"
                      options={[...EDUCATION_PROCESS_OPTIONS]}
                      value={field.value ?? undefined}
                      onChange={next => field.onChange(next == null ? undefined : String(next))}
                    />
                  )}
                />
              }
            />
            <DetailInfoForm.Field
              label="IP Owned"
              view={ipOwnedLabel}
              edit={
                <Controller
                  name="ipOwned"
                  control={commonInfoForm.control}
                  render={({ field }) => (
                    <CmsSelect
                      withAllOption={false}
                      placeholder="IP Owned를 선택하세요"
                      width="100%"
                      options={[...IP_OWNED_OPTIONS]}
                      value={field.value ?? 'JA'}
                      onChange={next => field.onChange(next == null ? undefined : String(next))}
                    />
                  )}
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="Course Delivered By"
              view={courseDeliveredByLabel}
              edit={
                <Controller
                  name="courseDeliveredBy"
                  control={commonInfoForm.control}
                  render={({ field }) => (
                    <CmsSelect
                      withAllOption={false}
                      placeholder="Course Delivered By를 선택하세요"
                      width="100%"
                      options={[...COURSE_DELIVERED_BY_OPTIONS]}
                      value={field.value ?? 'JA'}
                      onChange={next =>
                        field.onChange(
                          next === 'JA' || next === 'Jointly' || next === 'Partner'
                            ? next
                            : undefined
                        )
                      }
                    />
                  )}
                />
              }
            />
            <DetailInfoForm.Field
              label="Partner Involvement"
              view={partnerLabel}
              edit={
                <Controller
                  name="partnerInvolvement"
                  control={commonInfoForm.control}
                  render={({ field }) => (
                    <CmsSelect
                      withAllOption={false}
                      placeholder="Partner Involvement를 선택하세요"
                      width="100%"
                      options={PARTNER_INVOLVEMENT_SELECT_OPTIONS}
                      value={field.value ? 'yes' : 'no'}
                      onChange={next => field.onChange(next === 'yes')}
                    />
                  )}
                />
              }
            />
          </DetailInfoForm.Row>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="IPS 유형"
              fullRow
              view={ipsLabel}
              edit={
                <Controller
                  name="ips"
                  control={commonInfoForm.control}
                  render={({ field }) => (
                    <CmsSelect
                      withAllOption={false}
                      placeholder="IPS 유형을 선택하세요"
                      width="100%"
                      options={[...IPS_OPTIONS]}
                      value={field.value ?? 'Prepare'}
                      onChange={next =>
                        field.onChange(
                          next === 'Prepare' || next === 'Succeed' || next === 'Inspire'
                            ? next
                            : 'Prepare'
                        )
                      }
                    />
                  )}
                />
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>
    )
  }

  return (
    <DetailInfoForm title="기본 정보" mode={commonInfoFormEdit ? 'edit' : 'view'}>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="최초 등록일"
          view={
            <>
              {formatDate(program.createdAt)}
              <DetailInfoForm.InputsSeparator />
              {createdByName ?? '-'}
            </>
          }
        />
        <DetailInfoForm.Field
          label="마지막 수정일"
          view={
            <>
              {formatDate(program.updatedAt)}
              <DetailInfoForm.InputsSeparator />
              {updatedByName ?? '-'}
            </>
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="대표 프로그램명"
          required
          view={program.mainTitle ?? '-'}
          edit={
            <>
              <Controller
                name="mainTitle"
                control={commonInfoForm.control}
                render={({ field }) => (
                  <CmsInput
                    {...field}
                    value={field.value ?? ''}
                    placeholder="대표 프로그램명"
                    width={'100%'}
                  />
                )}
              />
            </>
          }
        />
        <DetailInfoForm.Field
          label="세부 프로그램명"
          required
          view={program.title}
          edit={
            <>
              <Controller
                name="title"
                control={commonInfoForm.control}
                render={({ field }) => (
                  <CmsInput
                    {...field}
                    value={field.value ?? ''}
                    placeholder="세부 프로그램명"
                    status={commonInfoForm.formState.errors.title ? 'error' : undefined}
                    width={'100%'}
                  />
                )}
              />
            </>
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="사업 운영 기간"
          required
          view={formatDateRange(program.startDate, program.endDate)}
          edit={
            <Controller
              name="startDate"
              control={commonInfoForm.control}
              render={({ field }) => (
                <CmsDateRangePicker
                  value={[toDayjs(field.value), toDayjs(commonInfoForm.watch('endDate'))]}
                  onChange={dates => {
                    const [start, end] = dates ?? [null, null]
                    field.onChange(toIso(start))
                    commonInfoForm.setValue('endDate', toIso(end))
                  }}
                  format="YYYY. MM. DD"
                  width={'100%'}
                />
              )}
            />
          }
        />
        <DetailInfoForm.Field
          label="프로그램 진행 현황"
          view={lifecycleStatus ? <ProgramProgressReadonlyCell status={lifecycleStatus} /> : '-'}
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="참여자 유형"
          required
          view={categoryLabel}
          edit={
            <Controller
              name="category"
              control={commonInfoForm.control}
              render={({ field }) => (
                <CmsSelect
                  {...field}
                  options={CATEGORY_OPTIONS}
                  width={'100%'}
                  onChange={v => field.onChange(v ? v : undefined)}
                />
              )}
            />
          }
        />
        <DetailInfoForm.Field
          label="사업 분야"
          required
          view={program.businessArea ?? '-'}
          edit={
            <Controller
              name="businessArea"
              control={commonInfoForm.control}
              render={({ field }) => (
                <CmsSelect
                  value={field.value ?? undefined}
                  options={BUSINESS_AREA_OPTIONS}
                  onChange={v => field.onChange(v ?? undefined)}
                  width={'100%'}
                />
              )}
            />
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="후원사"
          required
          view={
            sponsorName ? (
              <ProgramDetailSponsorLink
                name={sponsorName}
                sponsorId={program.sponsorId}
                sponsorName={sponsorName}
              />
            ) : (
              '-'
            )
          }
          edit={
            <>
              <Controller
                name="sponsorId"
                control={commonInfoForm.control}
                render={({ field }) => (
                  <CmsSelect
                    {...field}
                    placeholder="후원사 선택"
                    showSearch
                    optionFilterProp="label"
                    options={sponsorOptions}
                    onChange={v => field.onChange(v ?? '')}
                    width={'100%'}
                    status={commonInfoForm.formState.errors.sponsorId ? 'error' : undefined}
                  />
                )}
              />
            </>
          }
        />
        <DetailInfoForm.Field
          label="후원사 담당자"
          required
          view={
            program.managerName || program.contactPhone ? (
              <>
                {program.managerName ?? ''}
                {program.managerName && program.contactPhone ? (
                  <DetailInfoForm.InputsSeparator />
                ) : null}
                {program.contactPhone ? <span>{program.contactPhone}</span> : null}
              </>
            ) : (
              '-'
            )
          }
          edit={
            <div>
              {(() => {
                return (
                  <>
                    <div className="detail-info-form-inputs-wrapper">
                      <Controller
                        name="managerName"
                        control={commonInfoForm.control}
                        render={({ field }) => {
                          const currentName = field.value ?? ''
                          const currentPhone = commonInfoForm.watch('contactPhone') ?? ''
                          const selectedIndex =
                            managers.length > 0
                              ? managers.findIndex(
                                  m => m.name === currentName || m.phone === currentPhone
                                )
                              : -1
                          return (
                            <CmsSelect
                              placeholder="담당자 선택"
                              value={selectedIndex >= 0 ? selectedIndex : undefined}
                              options={managers.map((m, i) => ({
                                value: i,
                                label: m.name,
                              }))}
                              onChange={idx => {
                                if (idx === '' || idx == null) {
                                  commonInfoForm.setValue('managerName', '')
                                  commonInfoForm.setValue('contactPhone', undefined)
                                  return
                                }
                                if (typeof idx === 'number' && idx >= 0 && managers[idx]) {
                                  commonInfoForm.setValue('managerName', managers[idx].name)
                                  commonInfoForm.setValue('contactPhone', managers[idx].phone)
                                }
                              }}
                              width={'50%'}
                              status={
                                commonInfoForm.formState.errors.managerName ? 'error' : undefined
                              }
                            />
                          )
                        }}
                      />
                      <div>
                        <DetailInfoForm.InputsSeparator />
                        <span>{commonInfoForm.watch('contactPhone') || '-'}</span>
                      </div>
                    </div>
                  </>
                )
              })()}
            </div>
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="교육 과정"
          required
          view={program.educationProcess ?? '-'}
          edit={
            <Controller
              name="educationProcess"
              control={commonInfoForm.control}
              render={({ field }) => (
                <CmsSelect
                  value={field.value ?? undefined}
                  options={EDUCATION_PROCESS_OPTIONS}
                  onChange={v => field.onChange(v ?? undefined)}
                  width={'100%'}
                  placeholder="교육 과정 선택"
                />
              )}
            />
          }
        />
        <DetailInfoForm.Field
          label="IP Owned"
          required
          view={program.ipOwned ?? 'JA'}
          edit={
            <Controller
              name="ipOwned"
              control={commonInfoForm.control}
              render={({ field }) => (
                <CmsSelect
                  value={field.value ?? undefined}
                  options={IP_OWNED_OPTIONS}
                  onChange={v => field.onChange(v ?? undefined)}
                  width={'100%'}
                  placeholder="JA"
                />
              )}
            />
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="Course Delivered By"
          required
          view={courseDeliveredLabel}
          edit={
            <Controller
              name="courseDeliveredBy"
              control={commonInfoForm.control}
              render={({ field }) => (
                <CmsSelect
                  value={field.value ?? undefined}
                  options={COURSE_DELIVERED_BY_OPTIONS}
                  onChange={v => field.onChange(v ?? undefined)}
                  width={'100%'}
                  placeholder="JA"
                />
              )}
            />
          }
        />
        <DetailInfoForm.Field
          label="Partner Involvement"
          required
          view={partnerLabel}
          edit={
            <Controller
              name="partnerInvolvement"
              control={commonInfoForm.control}
              render={({ field }) => (
                <CmsRadio.Group
                  value={field.value}
                  options={PARTNER_INVOLVEMENT_OPTIONS}
                  onChange={e => field.onChange(e.target.value)}
                />
              )}
            />
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="IPS"
          required
          view={program.ips ?? '-'}
          edit={
            <Controller
              name="ips"
              control={commonInfoForm.control}
              render={({ field }) => (
                <CmsRadio.Group
                  value={field.value}
                  options={IPS_OPTIONS}
                  onChange={e => field.onChange(e.target.value)}
                />
              )}
            />
          }
        />
        <DetailInfoForm.Field
          label="프로그램 종류"
          required
          view={program.ips === 'Succeed' ? (program.programCategory ?? '-') : '-'}
          edit={
            <Controller
              name="programCategory"
              control={commonInfoForm.control}
              render={({ field }) => (
                <CmsSelect
                  value={field.value ?? undefined}
                  options={PROGRAM_CATEGORY_OPTIONS}
                  onChange={v => field.onChange(v ?? undefined)}
                  width={'100%'}
                  placeholder="프로그램 종류 선택"
                  disabled={commonInfoForm.watch('ips') !== 'Succeed'}
                />
              )}
            />
          }
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
