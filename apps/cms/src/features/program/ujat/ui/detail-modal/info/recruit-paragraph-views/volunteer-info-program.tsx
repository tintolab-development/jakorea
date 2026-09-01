import { Controller } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import {
  formatDateRange,
  getVolunteerRecruitmentLifecycle,
  INTERVIEW_METHOD_OPTIONS,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { getProgramLifecycleLabel } from '@/shared/constants/status'
import { resolveUjatAnnouncementTitle } from '@/features/program/ujat/lib/ujat-registration-basic-info-display'
import { TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS } from '@/features/template/lib/template-form-select-options'
import {
  getUjatVolunteerNoticeExposureReadLabel,
  UJAT_VOLUNTEER_NOTICE_EXPOSURE_OPTIONS,
} from '@/features/template/lib/ujat-volunteer-notice-exposure'
import { ProgramDetailContactReadRow } from '@/features/program/shared/ui/program-detail/project-info/recruitment/components/recruitment-form-parts'
import { recruitmentTargetLabelsToOptionValues } from '../recruit-lib/recruitment-target-values'
import { UjatRecruitSectionDescriptionHeader } from '../ujat-recruit-section-description-header'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { DividerVertical } from '@/shared/components/divider-vertical'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsPhoneInput } from '@/shared/ui/cms-phone-input'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { UjatVolunteerRecruitHalf } from '../ujat-recruit-paragraph-props'
import { getUjatVolunteerRecruitPeriod, getUjatVolunteerRound } from '../ujat-recruit-program-round'
import { UjatInlineDividedSegments } from '../../shared/ujat-inline-divided-segments'
import {
  UJAT_RECRUIT_FORM_MAX_SUFFIX_CLASS,
  UjatRecruitFormDateMethodRow,
  UjatRecruitFormInterviewPeriodRow,
  UjatRecruitFormPeriodDatePicker,
  UjatRecruitVolunteerNotesField,
} from '../recruit-lib/ujat-recruit-form-fields'
import dayjs from 'dayjs'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'

function LifecycleStatusView({ lifecycle }: { lifecycle: ProgramLifecycleStatus | null }) {
  if (!lifecycle) return <>-</>
  return (
    <span
      className={`program-detail-info-tab__lifecycle-status-text program-detail-info-tab__lifecycle-status-text--${lifecycle.replace(/_/g, '-')}`}
    >
      {getProgramLifecycleLabel(lifecycle)}
    </span>
  )
}

function resolveVolunteerNotesDisplay(program: Program): string {
  if (program.generalCommonInfo?.volunteerRecruitmentInfo?.notesNotApplicable) return '-'
  return (program.otherNotes ?? '').trim() || '-'
}

function dateMethodLine(date: string | Date | undefined, method: string | undefined, fallbackMethod: string) {
  if (!date) return '-'
  const methodLabel = method?.trim() || fallbackMethod
  return (
    <UjatInlineDividedSegments segments={[dayjs(date).format('YYYY.MM.DD(ddd)'), methodLabel]} />
  )
}

function resolveInterviewMethodLabel(method: string | undefined): string {
  const raw = method?.trim()
  if (!raw) return '-'
  return INTERVIEW_METHOD_OPTIONS.find(o => o.value === raw)?.label ?? raw
}

function resolveActivityTermDisplay(program: Program, half: UjatVolunteerRecruitHalf): string {
  const round = getUjatVolunteerRound(program, half)
  return round?.curriculum?.trim() || '-'
}

export function UjatRecruitVolunteerInfoProgramView({
  program,
  sponsorName,
  form,
  isEdit,
  volunteerHalf,
  showNoticeExposure,
  sectionTitle = '봉사자 모집 정보',
  hideSectionHeader = false,
}: {
  program: Program
  sponsorName?: string
  form?: UseFormReturn<ProgramDetailEditFormValues>
  isEdit: boolean
  volunteerHalf: UjatVolunteerRecruitHalf
  showNoticeExposure: boolean
  sectionTitle?: string
  /** 폼 양식 편집기 — 바깥 단락 헤더(title·description)가 있을 때 중복 제거 */
  hideSectionHeader?: boolean
}) {
  const period = getUjatVolunteerRecruitPeriod(program, volunteerHalf)
  const roundIndex = volunteerHalf === 'h1' ? 0 : 1
  const hasRound = isEdit && form ? form.watch(`rounds.${roundIndex}`) != null : (program.rounds?.[roundIndex] != null)
  const recruitStartName = (
    hasRound
      ? volunteerHalf === 'h1'
        ? 'rounds.0.startDate'
        : 'rounds.1.startDate'
      : 'volunteerApplicationStartDate'
  ) as 'rounds.0.startDate' | 'volunteerApplicationStartDate'
  const recruitEndName = (
    hasRound
      ? volunteerHalf === 'h1'
        ? 'rounds.0.endDate'
        : 'rounds.1.endDate'
      : 'volunteerApplicationEndDate'
  ) as 'rounds.0.endDate' | 'volunteerApplicationEndDate'
  const recruitStartWatch =
    isEdit && form ? (form.watch(recruitStartName) as string | undefined) : period.start
  const recruitEndWatch =
    isEdit && form ? (form.watch(recruitEndName) as string | undefined) : period.end
  const lifecycle = getVolunteerRecruitmentLifecycle(
    program,
    isEdit && form
      ? {
          volunteerApplicationStartDate: recruitStartWatch,
          volunteerApplicationEndDate: recruitEndWatch,
        }
      : undefined
  )
  const publicTitle = resolveUjatAnnouncementTitle(program)
  const volunteerTarget = program.volunteerTarget ?? '대학(원)생'
  const volunteerTargetDetail = program.volunteerTargetDetail ?? '-'
  const notes = resolveVolunteerNotesDisplay(program)
  const activityTerm = resolveActivityTermDisplay(program, volunteerHalf)
  const noticeExposureSetting =
    program.generalCommonInfo?.volunteerRecruitmentInfo?.noticeExposureTiming ??
    (isEdit && form ? form.watch('volunteerRecruitmentNoticeExposure') : undefined)
  const noticeExposureLabel = getUjatVolunteerNoticeExposureReadLabel(
    typeof noticeExposureSetting === 'string' ? noticeExposureSetting : undefined
  )
  const volunteerPeriodLabel = formatDateRange(period.start, period.end)
  const interviewLine =
    program.interviewStartDate && program.interviewEndDate ? (
      <UjatInlineDividedSegments
        segments={[
          formatDateRange(program.interviewStartDate, program.interviewEndDate),
          resolveInterviewMethodLabel(program.interviewMethod),
        ]}
      />
    ) : (
      '-'
    )
  const formMode = isEdit && form ? 'edit' : 'view'
  const recruitTargets = recruitmentTargetLabelsToOptionValues(program.volunteerTarget)

  return (
    <>
      {!hideSectionHeader ? <UjatRecruitSectionDescriptionHeader title={sectionTitle} /> : null}
      {showNoticeExposure && (
        <DetailInfoForm title="봉사자 모집 공고 노출 시점" hideHeader mode={formMode}>
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="모집 공고 노출 시점"
              fullRow
              view={noticeExposureLabel}
              edit={
                isEdit && form ? (
                  <Controller
                    name="volunteerRecruitmentNoticeExposure"
                    control={form.control}
                    render={({ field }) => (
                      <CmsRadioGroup
                        value={field.value ?? 'start-day'}
                        onChange={e => field.onChange(String(e.target.value))}
                      >
                        {UJAT_VOLUNTEER_NOTICE_EXPOSURE_OPTIONS.map(o => (
                          <CmsRadio key={o.value} value={o.value}>
                            {o.label}
                          </CmsRadio>
                        ))}
                      </CmsRadioGroup>
                    )}
                  />
                ) : undefined
              }
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      )}

      <DetailInfoForm title="봉사자 모집 정보" hideHeader mode={formMode}>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="공고용 프로그램명"
            view={publicTitle}
            edit={
              isEdit && form ? (
                <Controller
                  name="mainTitle"
                  control={form.control}
                  render={({ field }) => (
                    <CmsInput
                      {...field}
                      value={field.value ?? program.title ?? ''}
                      inputSize="medium"
                      width="100%"
                      placeholder="공고용 프로그램명"
                    />
                  )}
                />
              ) : undefined
            }
          />
          <DetailInfoForm.Field
            label="활동 기수"
            view={activityTerm}
            edit={
              isEdit && form ? (
                <Controller
                  name={`rounds.${roundIndex}.curriculum` as 'rounds.0.curriculum'}
                  control={form.control}
                  render={({ field }) => (
                    <CmsNumericInput
                      {...field}
                      mode="numericText"
                      value={(field.value as string | undefined) ?? ''}
                      inputSize="medium"
                      width="100%"
                      placeholder="활동 기수"
                      onValueChange={field.onChange}
                    />
                  )}
                />
              ) : undefined
            }
          />
        </DetailInfoForm.Row>

        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="프로그램 운영 기간"
            view={formatDateRange(program.startDate, program.endDate)}
            edit={
              isEdit && form ? (
                <div className={UJAT_RECRUIT_FORM_MAX_SUFFIX_CLASS}>
                  <UjatRecruitFormPeriodDatePicker
                    form={form}
                    startName="startDate"
                    endName="endDate"
                    placeholder="프로그램 운영 기간을 선택하세요"
                  />
                </div>
              ) : undefined
            }
          />
          <DetailInfoForm.Field
            label="봉사자 모집 현황"
            readOnlyDisplay
            view={<LifecycleStatusView lifecycle={lifecycle} />}
          />
        </DetailInfoForm.Row>

        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="모집 대상"
            view={volunteerTarget}
            edit={
              isEdit && form ? (
                <CmsSelect
                  mode="multiple"
                  withAllOption={false}
                  inputSize="medium"
                  width="100%"
                  value={recruitTargets}
                  onChange={() => undefined}
                  disabled
                  placeholder="모집 대상"
                  options={TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS}
                />
              ) : undefined
            }
          />
          <DetailInfoForm.Field
            label="모집 대상 상세"
            view={volunteerTargetDetail}
            edit={
              isEdit && form ? (
                <Controller
                  name="volunteerTargetDetail"
                  control={form.control}
                  render={({ field }) => (
                    <CmsInput
                      {...field}
                      value={field.value ?? ''}
                      inputSize="medium"
                      width="100%"
                      placeholder="모집 대상 상세"
                    />
                  )}
                />
              ) : undefined
            }
          />
        </DetailInfoForm.Row>

        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="봉사자 모집 기간"
            view={volunteerPeriodLabel}
            edit={
              isEdit && form ? (
                <div className={UJAT_RECRUIT_FORM_MAX_SUFFIX_CLASS}>
                  <UjatRecruitFormPeriodDatePicker
                    form={form}
                    startName={recruitStartName}
                    endName={recruitEndName}
                    placeholder="봉사자 모집 기간을 선택하세요"
                    clearToUndefined
                  />
                </div>
              ) : undefined
            }
          />
          <DetailInfoForm.Field
            label="1차 서류 합격자 발표"
            view={dateMethodLine(
              program.documentPassAnnouncementDate,
              program.documentPassAnnouncementMethod,
              '홈페이지 공지'
            )}
            edit={
              isEdit && form ? (
                <UjatRecruitFormDateMethodRow
                  form={form}
                  dateName="documentPassAnnouncementDate"
                  methodName="documentPassAnnouncementMethod"
                  datePlaceholder="합격자 발표일"
                  methodPlaceholder="공지 방법"
                />
              ) : undefined
            }
          />
        </DetailInfoForm.Row>

        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="2차 면접 기간"
            view={interviewLine}
            edit={
              isEdit && form ? (
                <UjatRecruitFormInterviewPeriodRow
                  form={form}
                  startName="interviewStartDate"
                  endName="interviewEndDate"
                  methodName="interviewMethod"
                />
              ) : undefined
            }
          />
          <DetailInfoForm.Field
            label="최종 합격자 발표"
            view={dateMethodLine(
              program.finalPassAnnouncementDate ?? program.resultAnnouncementDate,
              program.finalPassAnnouncementMethod ?? program.resultAnnouncementMethod,
              '홈페이지 공지'
            )}
            edit={
              isEdit && form ? (
                <UjatRecruitFormDateMethodRow
                  form={form}
                  dateName="finalPassAnnouncementDate"
                  methodName="finalPassAnnouncementMethod"
                  datePlaceholder="합격자 발표일"
                  methodPlaceholder="공지 방법"
                />
              ) : undefined
            }
          />
        </DetailInfoForm.Row>

        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="문의처"
            fullRow
            view={
              <ProgramDetailContactReadRow
                contactName={sponsorName}
                contactPhone={program.contactPhone}
                contactEmail={program.contactEmail}
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
                      value={sponsorName ?? ''}
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
                        <CmsPhoneInput
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
            view={notes}
            edit={isEdit && form ? <UjatRecruitVolunteerNotesField form={form} /> : undefined}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </>
  )
}
