/**
 * 일반 프로그램 상세 — 참여자 모집 정보 (등록 양식·스크린샷 2블록 레이아웃)
 */

import { useEffect } from 'react'
import { Controller } from 'react-hook-form'
import {
  patchInstitutionApplicationProgramBridge,
  resolveInstitutionApplicationProgramBridge,
} from '@/features/program/general/lib/institution-application-program-bridge'
import type { UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import {
  parseTargetLevelsSelectValue,
  TARGET_LEVEL_LABEL,
  INTERVIEW_METHOD_OPTIONS,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { getProgramLifecycleLabel } from '@/shared/constants/status'
import { FormParagraphSectionHeader } from '@/features/template/ui/shared/form-paragraph-section-header'
import { parsePositiveIntInput } from '@/features/template/lib/participant-recruitment-institution-limits'
import { ParagraphDatePicker } from '@/features/template/ui/shared/paragraph-date-picker'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import { DividerVertical } from '@/shared/components/divider-vertical'
import {
  ProgramDetailContactReadRow,
  ProgramDetailDateMethodReadRow,
  ProgramDetailInterviewReadRow,
} from '@/features/program/shared/ui/program-detail/project-info/recruitment/components/recruitment-form-parts'
import { renderDetailInfoPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { ParticipantRecruitmentAnnouncementPublishedRadios } from '@/features/program/shared/ui/participant-recruitment-announcement-published-radios'
import {
  resolveGeneralProgramParticipantRecruitmentDisplay,
  resolveParticipantRecruitmentInterviewEnabled,
} from '@/features/program/general/lib/participant-recruitment-display'
import { isGeneralIndividualProgram } from '@/features/program/general/lib/survey-audience'
import { isTrainedTeachersDetailProgram } from '@/features/program/trained-teachers/lib/is-trained-teachers-detail-program'
import dayjs from 'dayjs'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import './participant-recruitment-info-view.css'

const toDayjs = (d: string | Date | undefined) => (d ? dayjs(d) : null)

const RECRUIT_PROGRESS_HINT = '일정에 따라 진행 현황이 자동으로 반영됩니다.'
const MAX_SUFFIX_CLASS = 'detail-info-form-inputs-wrapper-no-gap'

const TARGET_LEVEL_OPTIONS = Object.entries(TARGET_LEVEL_LABEL).map(([value, label]) => ({
  value,
  label,
}))

const NEED_OR_NOT_OPTIONS = [
  { value: 'required' as const, label: '필요' },
  { value: 'not_required' as const, label: '불필요' },
]

const PARTICIPANT_INTERVIEW_OPTIONS = [
  { value: 'yes' as const, label: '필요' },
  { value: 'no' as const, label: '불필요' },
] as const

const RECRUITMENT_RADIO_CLASS = 'program-detail-info-tab__recruitment-radio'

const CERTIFICATE_OPTIONS = [
  { value: 'provided' as const, label: '제공' },
  { value: 'not_provided' as const, label: '미제공' },
]

const FORM_CLASS = 'program-registration-paragraph'

function isCompanySchoolRecruitmentProgram(program: Program): boolean {
  return (
    program.id.startsWith('economy-prog-') ||
    program.id.startsWith('company-school-prog-') ||
    program.id.startsWith('company-school-local-') ||
    program.mainTitle?.includes('1사1교') === true ||
    program.title?.includes('1사1교') === true
  )
}

function NumberWithSuffixEdit({
  form,
  name,
  placeholder,
  suffix,
}: {
  form: UseFormReturn<ProgramDetailEditFormValues>
  name:
    | 'participantRecruitmentMaxInstructors'
    | 'participantRecruitmentMaxClassCount'
    | 'participantRecruitmentMaxScheduleCount'
    | 'participantRecruitmentMaxSessionsPerDay'
  placeholder: string
  suffix: string
}) {
  return (
    <Controller
      name={name}
      control={form.control}
      render={({ field }) => (
        <div className={MAX_SUFFIX_CLASS}>
          <CmsNumericInput
            inputSize="medium"
            mode="integer"
            min={0}
            placeholder={placeholder}
            width={120}
            value={field.value == null ? '' : String(field.value)}
            onValueChange={raw => field.onChange(parsePositiveIntInput(raw))}
            className="program-detail-info-tab__max-class-count-input"
          />
          <span style={{ marginLeft: 6 }}>{suffix}</span>
        </div>
      )}
    />
  )
}

export function GeneralProgramParticipantRecruitmentInfoView({
  program,
  form,
  isEdit,
}: {
  program: Program
  form?: UseFormReturn<ProgramDetailEditFormValues>
  isEdit: boolean
}) {
  const display = resolveGeneralProgramParticipantRecruitmentDisplay(
    program,
    isEdit && form
      ? {
          applicationStartDate: form.watch('applicationStartDate'),
          applicationEndDate: form.watch('applicationEndDate'),
        }
      : undefined
  )

  const preEducationField = form?.watch('participantRecruitmentPreEducationRequired')
  const maxInstructorsField = form?.watch('participantRecruitmentMaxInstructors')
  const maxClassField = form?.watch('participantRecruitmentMaxClassCount')
  const maxScheduleField = form?.watch('participantRecruitmentMaxScheduleCount')
  const maxSessionsField = form?.watch('participantRecruitmentMaxSessionsPerDay')

  useEffect(() => {
    const base = resolveInstitutionApplicationProgramBridge(program)
    patchInstitutionApplicationProgramBridge({
      ...base,
      preEducationNoticeRequired:
        preEducationField === 'required'
          ? true
          : preEducationField === 'not_required'
            ? false
            : base.preEducationNoticeRequired,
      maxAssignableInstructors: maxInstructorsField ?? base.maxAssignableInstructors,
      maxClassCount: maxClassField ?? base.maxClassCount,
      maxScheduleCount: maxScheduleField ?? base.maxScheduleCount,
      maxSessionsPerDay: maxSessionsField ?? base.maxSessionsPerDay,
    })
  }, [
    program,
    preEducationField,
    maxInstructorsField,
    maxClassField,
    maxScheduleField,
    maxSessionsField,
  ])

  const formMode = isEdit && form ? 'edit' : 'view'
  const showLimits = display.showInstitutionApplicationLimits
  const lifecycle = display.recruitmentStatusLifecycle
  const statusView = lifecycle ? (
    <span
      className={`program-detail-info-tab__lifecycle-status-text program-detail-info-tab__lifecycle-status-text--${lifecycle.replace(/_/g, '-')}`}
    >
      {display.recruitmentStatusLabel || getProgramLifecycleLabel(lifecycle)}
    </span>
  ) : (
    display.recruitmentStatusLabel
  )

  const contactOrg = display.contactOrganizationName
  const isIndividual = isGeneralIndividualProgram(program)
  const isCompanySchool = isCompanySchoolRecruitmentProgram(program)
  // 교육받은 교사 — 공고 게시|학생 명단 1행, 사전 안내·수료증 비노출 (기존 유형 렌더 불변)
  const isTrainedTeachers = isTrainedTeachersDetailProgram(program)
  const editInterviewValue = form?.watch('participantRecruitmentInterviewEnabled')
  const interviewEnabled = resolveParticipantRecruitmentInterviewEnabled(
    program,
    isEdit && form ? editInterviewValue : undefined
  )

  const studentListField = (
    <DetailInfoForm.Field
      label="학생 명단 제출 여부"
      view={display.studentListLabel}
      edit={
        isEdit && form ? (
          <Controller
            name="studentListRequired"
            control={form.control}
            render={({ field }) => (
              <CmsRadio.Group
                {...field}
                size="large"
                value={field.value ?? undefined}
                onChange={e => field.onChange(e.target.value)}
                options={NEED_OR_NOT_OPTIONS}
                className={RECRUITMENT_RADIO_CLASS}
              />
            )}
          />
        ) : undefined
      }
    />
  )

  const recruitmentPeriodField = (
    <DetailInfoForm.Field
      label="참여자 모집 기간"
      fullRow={isIndividual && !interviewEnabled}
      view={display.recruitmentPeriodLabel}
      edit={
        isEdit && form ? (
          <Controller
            name="applicationStartDate"
            control={form.control}
            render={({ field }) => (
              <ParagraphDatePicker
                mode="range"
                value={[
                  toDayjs(field.value as string | Date | undefined),
                  toDayjs(form.watch('applicationEndDate') as string | Date | undefined),
                ]}
                onChange={([start, end]) => {
                  field.onChange(start ? start.toISOString() : '')
                  form.setValue('applicationEndDate', end ? end.toISOString() : '')
                }}
                placeholder={['모집 시작일', '모집 종료일']}
                width="100%"
                style={{ width: '100%' }}
              />
            )}
          />
        ) : undefined
      }
    />
  )

  const documentPassField = (
    <DetailInfoForm.Field
      label="1차 서류 합격자 발표"
      view={
        <ProgramDetailDateMethodReadRow
          dateIso={display.documentPassAnnouncementDate}
          method={display.documentPassAnnouncementMethod}
        />
      }
      edit={
        isEdit && form ? (
          <div className="program-detail-info-tab__result-row">
            <Controller
              name="documentPassAnnouncementDate"
              control={form.control}
              render={({ field }) => (
                <ParagraphDatePicker
                  mode="single"
                  presetMode="date"
                  customizable={false}
                  value={toDayjs(field.value)}
                  onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                  placeholder="합격자 발표일"
                  width={190}
                />
              )}
            />
            <DetailInfoForm.InputsSeparator />
            <Controller
              name="documentPassAnnouncementMethod"
              control={form.control}
              render={({ field }) => (
                <CmsInput
                  {...field}
                  value={field.value ?? ''}
                  placeholder="발표 방법 안내"
                  inputSize="medium"
                  width="100%"
                  className="program-detail-info-tab__result-method-input"
                />
              )}
            />
          </div>
        ) : undefined
      }
    />
  )

  const interviewPeriodField = (
    <DetailInfoForm.Field
      label="2차 면접 기간"
      view={
        <ProgramDetailInterviewReadRow
          start={display.interviewStartDate}
          end={display.interviewEndDate}
          method={display.interviewMethod}
        />
      }
      edit={
        isEdit && form ? (
          <div className="program-detail-info-tab__result-row">
            <Controller
              name="interviewStartDate"
              control={form.control}
              render={({ field }) => (
                <ParagraphDatePicker
                  mode="range"
                  value={[
                    toDayjs(field.value as string | Date | undefined),
                    toDayjs(form.watch('interviewEndDate') as string | Date | undefined),
                  ]}
                  onChange={([start, end]) => {
                    field.onChange(start ? start.toISOString() : undefined)
                    form.setValue('interviewEndDate', end ? end.toISOString() : undefined)
                  }}
                  placeholder={['면접 시작일', '면접 종료일']}
                  width="100%"
                  style={{ width: '100%', flex: '1 1 0', minWidth: 0 }}
                />
              )}
            />
            <DetailInfoForm.InputsSeparator />
            <Controller
              name="interviewMethod"
              control={form.control}
              render={({ field }) => (
                <CmsSelect
                  inputSize="medium"
                  width={140}
                  value={field.value ?? undefined}
                  options={INTERVIEW_METHOD_OPTIONS}
                  onChange={v => field.onChange(v ?? undefined)}
                  placeholder="면접 유형"
                />
              )}
            />
          </div>
        ) : undefined
      }
    />
  )

  const finalPassField = (
    <DetailInfoForm.Field
      label="최종 합격자 발표"
      fullRow={isIndividual && !interviewEnabled}
      view={
        isIndividual ? (
          <ProgramDetailDateMethodReadRow
            dateIso={program.resultAnnouncementDate}
            method={program.resultAnnouncementMethod}
          />
        ) : (
          renderDetailInfoPipeSeparated(display.finalAnnouncementLabel)
        )
      }
      edit={
        isEdit && form ? (
          <div className="program-detail-info-tab__result-row">
            <Controller
              name="resultAnnouncementDate"
              control={form.control}
              render={({ field }) => (
                <ParagraphDatePicker
                  mode="single"
                  presetMode="date"
                  customizable={false}
                  value={toDayjs(field.value)}
                  onChange={d => field.onChange(d ? d.toISOString() : undefined)}
                  placeholder="합격자 발표일"
                  width={190}
                />
              )}
            />
            <DetailInfoForm.InputsSeparator />
            <Controller
              name="resultAnnouncementMethod"
              control={form.control}
              render={({ field }) => (
                <CmsInput
                  {...field}
                  value={field.value ?? ''}
                  placeholder="발표 방법 안내"
                  inputSize="medium"
                  width="100%"
                  className="program-detail-info-tab__result-method-input"
                />
              )}
            />
          </div>
        ) : undefined
      }
    />
  )

  return (
    <section className="participant-recruitment-info-view" aria-label="참여자 모집 정보">
      <FormParagraphSectionHeader title="참여자 모집 정보" surface="responseEntry" titleAligned />
      <div className="participant-recruitment-info-view__forms">
        <DetailInfoForm
          title="참여자 모집 정보(설정)"
          hideHeader
          mode={formMode}
          className={FORM_CLASS}
        >
          <DetailInfoForm.Row type={isIndividual || isTrainedTeachers ? 'double' : 'single'}>
            <DetailInfoForm.Field
              label="공고 게시 여부"
              fullRow={!isIndividual && !isTrainedTeachers}
              view={display.announcementPublishedLabel}
              edit={
                isEdit && form ? (
                  <Controller
                    name="participantRecruitmentAnnouncementPublished"
                    control={form.control}
                    render={({ field }) => (
                      <ParticipantRecruitmentAnnouncementPublishedRadios
                        value={field.value}
                        onChange={field.onChange}
                      />
                    )}
                  />
                ) : undefined
              }
            />
            {isIndividual ? (
              <DetailInfoForm.Field
                label="참여자 면접 유무"
                view={display.interviewEnabledLabel ?? '-'}
                edit={
                  isEdit && form ? (
                    <Controller
                      name="participantRecruitmentInterviewEnabled"
                      control={form.control}
                      render={({ field }) => (
                        <CmsRadioGroup
                          size="large"
                          value={field.value ?? undefined}
                          onChange={e => field.onChange(e.target.value)}
                          className={RECRUITMENT_RADIO_CLASS}
                        >
                          {PARTICIPANT_INTERVIEW_OPTIONS.map(option => (
                            <CmsRadio key={option.value} value={option.value} size="large">
                              {option.label}
                            </CmsRadio>
                          ))}
                        </CmsRadioGroup>
                      )}
                    />
                  ) : undefined
                }
              />
            ) : null}
            {isTrainedTeachers ? studentListField : null}
          </DetailInfoForm.Row>

          {!isIndividual && !isCompanySchool && !isTrainedTeachers ? (
            <DetailInfoForm.Row type="double">
              {studentListField}
              <DetailInfoForm.Field
                label="사전 안내 사항 작성 여부"
                view={display.preEducationNoticeLabel}
                edit={
                  isEdit && form ? (
                    <Controller
                      name="participantRecruitmentPreEducationRequired"
                      control={form.control}
                      render={({ field }) => (
                        <CmsRadio.Group
                          {...field}
                          size="large"
                          value={field.value ?? undefined}
                          onChange={e => field.onChange(e.target.value)}
                          options={NEED_OR_NOT_OPTIONS}
                          className={RECRUITMENT_RADIO_CLASS}
                        />
                      )}
                    />
                  ) : undefined
                }
              />
            </DetailInfoForm.Row>
          ) : null}

          {showLimits ? (
            <>
              <DetailInfoForm.Row type="double">
                <DetailInfoForm.Field
                  label="배정 가능 최대 강사 수"
                  view={display.maxInstructorsLabel}
                  edit={
                    isEdit && form ? (
                      <NumberWithSuffixEdit
                        form={form}
                        name="participantRecruitmentMaxInstructors"
                        placeholder="최대값 입력"
                        suffix="명"
                      />
                    ) : undefined
                  }
                />
                <DetailInfoForm.Field
                  label="신청 가능 최대 학급 수"
                  view={display.maxClassLabel}
                  edit={
                    isEdit && form ? (
                      <NumberWithSuffixEdit
                        form={form}
                        name="participantRecruitmentMaxClassCount"
                        placeholder="최대값 입력"
                        suffix="개"
                      />
                    ) : undefined
                  }
                />
              </DetailInfoForm.Row>

              {!isCompanySchool &&
              (display.showMaxScheduleCountField || display.showMaxSessionsPerDayField) ? (
                <DetailInfoForm.Row
                  type={
                    display.showMaxScheduleCountField && display.showMaxSessionsPerDayField
                      ? 'double'
                      : 'single'
                  }
                >
                  {display.showMaxScheduleCountField ? (
                    <DetailInfoForm.Field
                      label="신청 가능 최대 일정 수"
                      fullRow={!display.showMaxSessionsPerDayField}
                      view={display.maxScheduleCountLabel}
                      edit={
                        isEdit && form ? (
                          <NumberWithSuffixEdit
                            form={form}
                            name="participantRecruitmentMaxScheduleCount"
                            placeholder="최대값 입력"
                            suffix="개"
                          />
                        ) : undefined
                      }
                    />
                  ) : null}
                  {display.showMaxSessionsPerDayField ? (
                    <DetailInfoForm.Field
                      label="신청 가능 1일 최대 차시"
                      fullRow={!display.showMaxScheduleCountField}
                      view={display.maxSessionsPerDayLabel}
                      edit={
                        isEdit && form ? (
                          <NumberWithSuffixEdit
                            form={form}
                            name="participantRecruitmentMaxSessionsPerDay"
                            placeholder="최대값 입력"
                            suffix="차시"
                          />
                        ) : undefined
                      }
                    />
                  ) : null}
                </DetailInfoForm.Row>
              ) : null}
            </>
          ) : null}
        </DetailInfoForm>

        <DetailInfoForm
          title="참여자 모집 정보(상세)"
          hideHeader
          mode={formMode}
          className={FORM_CLASS}
        >
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="프로그램 운영 기간"
              view={display.operationPeriodLabel}
              edit={
                isEdit && form ? (
                  <Controller
                    name="startDate"
                    control={form.control}
                    render={({ field }) => (
                      <ParagraphDatePicker
                        mode="range"
                        value={[
                          toDayjs(field.value as string | Date | undefined),
                          toDayjs(form.watch('endDate') as string | Date | undefined),
                        ]}
                        onChange={([start, end]) => {
                          field.onChange(start ? start.toISOString() : '')
                          form.setValue('endDate', end ? end.toISOString() : '')
                        }}
                        placeholder={['운영 시작일', '운영 종료일']}
                        width="100%"
                        style={{ width: '100%' }}
                      />
                    )}
                  />
                ) : undefined
              }
            />
            <DetailInfoForm.Field
              label="참여자 모집 현황"
              readOnlyDisplay={!(isEdit && form)}
              view={statusView}
              edit={
                isEdit && form ? (
                  <span className="form-editor-template-field-hint-text">
                    {RECRUIT_PROGRESS_HINT}
                  </span>
                ) : undefined
              }
            />
          </DetailInfoForm.Row>

          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="교육 대상"
              view={display.targetLabel}
              edit={
                isEdit && form ? (
                  <Controller
                    name="targetLevels"
                    control={form.control}
                    render={({ field }) => (
                      <CmsSelect
                        mode="multiple"
                        inputSize="medium"
                        width={240}
                        withAllOption={false}
                        value={field.value ?? []}
                        options={TARGET_LEVEL_OPTIONS}
                        onChange={v => field.onChange(parseTargetLevelsSelectValue(v))}
                        placeholder="교육 대상을 선택하세요"
                        className="program-detail-info-tab__target-select"
                      />
                    )}
                  />
                ) : undefined
              }
            />
            <DetailInfoForm.Field
              label="교육 대상 상세"
              view={display.targetDetailLabel}
              edit={
                isEdit && form ? (
                  <Controller
                    name="district"
                    control={form.control}
                    render={({ field }) => (
                      <CmsInput
                        {...field}
                        value={field.value ?? ''}
                        placeholder="상세 교육 대상을 입력하세요"
                        inputSize="medium"
                        width="100%"
                        className="program-detail-info-tab__district-input"
                      />
                    )}
                  />
                ) : undefined
              }
            />
          </DetailInfoForm.Row>

          {!isIndividual && !isCompanySchool && !isTrainedTeachers ? (
            <DetailInfoForm.Row type="single">
              <DetailInfoForm.Field
                label="수료증 발급 여부"
                fullRow
                view={display.certificateIssuanceLabel}
                edit={
                  isEdit && form ? (
                    <Controller
                      name="participantRecruitmentCertificateProvided"
                      control={form.control}
                      render={({ field }) => (
                        <CmsRadio.Group
                          {...field}
                          size="large"
                          value={field.value ?? undefined}
                          onChange={e => field.onChange(e.target.value)}
                          options={CERTIFICATE_OPTIONS}
                          className={RECRUITMENT_RADIO_CLASS}
                        />
                      )}
                    />
                  ) : undefined
                }
              />
            </DetailInfoForm.Row>
          ) : null}

          {isIndividual ? (
            interviewEnabled ? (
              <>
                <DetailInfoForm.Row type="double">
                  {recruitmentPeriodField}
                  {documentPassField}
                </DetailInfoForm.Row>
                <DetailInfoForm.Row type="double">
                  {interviewPeriodField}
                  {finalPassField}
                </DetailInfoForm.Row>
              </>
            ) : (
              <DetailInfoForm.Row type="double">
                {recruitmentPeriodField}
                {finalPassField}
              </DetailInfoForm.Row>
            )
          ) : (
            <DetailInfoForm.Row type="double">
              {recruitmentPeriodField}
              {finalPassField}
            </DetailInfoForm.Row>
          )}

          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="문의처"
              fullRow
              view={
                <ProgramDetailContactReadRow
                  contactName={contactOrg}
                  contactPhone={display.contactPhone}
                  contactEmail={display.contactEmail}
                  padEmptySegments
                />
              }
              edit={
                isEdit && form ? (
                  <div className="program-detail-info-tab__contact-inputs program-detail-info-tab__contact-inputs--even">
                    <div className="program-detail-info-tab__contact-group">
                      <span className="program-detail-info-tab__contact-label">문의처</span>
                      <CmsInput
                        placeholder="담당 문의처"
                        value={contactOrg}
                        readOnly
                        inputSize="medium"
                        className="program-detail-info-tab__contact-name-input"
                      />
                    </div>
                    <DividerVertical
                      height={13}
                      className="program-detail-info-tab__contact-inline-divider"
                    />
                    <div className="program-detail-info-tab__contact-group">
                      <span className="program-detail-info-tab__contact-label">Tel</span>
                      <Controller
                        name="contactPhone"
                        control={form.control}
                        render={({ field }) => (
                          <CmsInput
                            {...field}
                            value={field.value ?? ''}
                            placeholder="문의처 전화번호"
                            inputSize="medium"
                            className="program-detail-info-tab__contact-phone-input"
                          />
                        )}
                      />
                    </div>
                    <DividerVertical
                      height={13}
                      className="program-detail-info-tab__contact-inline-divider"
                    />
                    <div className="program-detail-info-tab__contact-group">
                      <span className="program-detail-info-tab__contact-label">E-mail</span>
                      <Controller
                        name="contactEmail"
                        control={form.control}
                        render={({ field }) => (
                          <CmsInput
                            {...field}
                            value={field.value ?? ''}
                            placeholder="문의처 이메일"
                            inputSize="medium"
                            className="program-detail-info-tab__contact-email-input"
                          />
                        )}
                      />
                    </div>
                  </div>
                ) : undefined
              }
            />
          </DetailInfoForm.Row>

          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="비고"
              view={display.notes}
              edit={
                isEdit && form ? (
                  <Controller
                    name="oneLineIntroduction"
                    control={form.control}
                    render={({ field }) => (
                      <CmsInput
                        {...field}
                        value={field.value ?? ''}
                        placeholder="비고란을 작성하세요 (없으면 -로 입력)"
                        inputSize="medium"
                        className="program-detail-info-tab__notes-input"
                      />
                    )}
                  />
                ) : undefined
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      </div>
    </section>
  )
}
