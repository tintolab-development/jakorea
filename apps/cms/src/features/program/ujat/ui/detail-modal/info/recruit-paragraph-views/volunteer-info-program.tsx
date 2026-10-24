import { Controller } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import {
  formatDateRange,
  formatVolunteerTargetsLabel,
  getRecruitmentStatusFromDates,
  getRecruitmentStatusLabelForStatus,
  VOLUNTEER_RECRUITMENT_STATUS_TO_LIFECYCLE,
  INTERVIEW_METHOD_OPTIONS,
  resolveProgramVolunteerTargets,
} from '@/features/program/shared/lib/program-detail-info-constants'
import {
  ANNOUNCEMENT_PUBLISHED_OPTIONS,
  announcementPublishedToFormValue,
} from '@/features/program/shared/lib/participant-recruitment-form-options'
import { ParticipantRecruitmentAnnouncementPublishedRadios } from '@/features/program/shared/ui/participant-recruitment-announcement-published-radios'
import { formatUjatDotDateWithWeekday } from '@/features/program/ujat/lib/ujat-date-display'
import {
  resolveUjatRecruitAnnouncementTitle,
  ujatRecruitDisplayKindFromVolunteerHalf,
} from '@/features/program/ujat/lib/ujat-recruit-display-program'
import {
  getUjatVolunteerNoticeExposureReadLabel,
  NOTICE_EXPOSURE_ERROR_STYLE,
  UJAT_VOLUNTEER_NOTICE_EXPOSURE_OPTIONS,
} from '@/features/template/lib/ujat-volunteer-notice-exposure'
import { ProgramDetailContactReadRow } from '@/features/program/shared/ui/program-detail/project-info/recruitment/components/recruitment-form-parts'
import {
  normalizeRecruitmentTargetSelectValues,
  recruitmentTargetOptionValuesToStored,
  UJAT_VOLUNTEER_RECRUIT_DEFAULT_TARGET_LABELS,
  UJAT_VOLUNTEER_RECRUIT_TARGET_OPTIONS,
} from '../recruit-lib/recruitment-target-values'
import { UjatRecruitSectionDescriptionHeader } from '../ujat-recruit-section-description-header'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { DividerVertical } from '@/shared/components/divider-vertical'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsPhoneInput } from '@/shared/ui/cms-phone-input'
import { CmsNumericInput } from '@/shared/ui/numeric-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { UjatVolunteerRecruitHalf } from '../ujat-recruit-paragraph-props'
import {
  getUjatVolunteerRecruitPeriod,
  resolveUjatVolunteerActivityTermDisplay,
} from '../ujat-recruit-program-round'
import { UjatInlineDividedSegments } from '../../shared/ujat-inline-divided-segments'
import {
  UJAT_RECRUIT_FORM_MAX_SUFFIX_CLASS,
  UJAT_RECRUIT_PROGRESS_HINT,
  UjatRecruitFormDateMethodRow,
  UjatRecruitFormInterviewPeriodRow,
  UjatRecruitFormPeriodDatePicker,
  UjatRecruitVolunteerNotesField,
} from '../recruit-lib/ujat-recruit-form-fields'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import '@/features/template/ui/form-editor/form-editor.css'
import './volunteer-info-program.css'

function LifecycleStatusView({
  lifecycle,
  status,
}: {
  lifecycle: ProgramLifecycleStatus | null
  status: ReturnType<typeof getRecruitmentStatusFromDates>
}) {
  if (!lifecycle) return <>-</>
  return (
    <span
      className={`program-detail-info-tab__lifecycle-status-text program-detail-info-tab__lifecycle-status-text--${lifecycle.replace(/_/g, '-')}`}
    >
      {getRecruitmentStatusLabelForStatus(status, 'volunteer')}
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
    <UjatInlineDividedSegments segments={[formatUjatDotDateWithWeekday(date), methodLabel]} />
  )
}

function resolveInterviewMethodLabel(method: string | undefined): string {
  const raw = method?.trim()
  if (!raw) return '-'
  return INTERVIEW_METHOD_OPTIONS.find(o => o.value === raw)?.label ?? raw
}

function resolveActivityTermDisplay(program: Program, half: UjatVolunteerRecruitHalf): string {
  return resolveUjatVolunteerActivityTermDisplay(program, half)
}

export function UjatRecruitVolunteerInfoProgramView({
  program,
  form,
  isEdit,
  volunteerHalf,
  showNoticeExposure,
  sectionTitle = '봉사자 모집 정보',
  highlightParagraphId,
  hideSectionHeader = false,
  isTemplateAuthoring = false,
}: {
  program: Program
  sponsorName?: string
  form?: UseFormReturn<ProgramDetailEditFormValues>
  isEdit: boolean
  volunteerHalf: UjatVolunteerRecruitHalf
  showNoticeExposure: boolean
  sectionTitle?: string
  highlightParagraphId?: string
  /** 폼 양식 편집기 — 바깥 단락 헤더(title·description)가 있을 때 중복 제거 */
  hideSectionHeader?: boolean
  /** 양식 작성 화면 — 프로그램 연동 값 대신 placeholder·힌트 */
  isTemplateAuthoring?: boolean
}) {
  const recruitKey = (suffix: string) => `recruit.volunteer.${volunteerHalf}.${suffix}`
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
  const recruitmentStatus = getRecruitmentStatusFromDates(recruitStartWatch, recruitEndWatch)
  const lifecycle = recruitmentStatus
    ? VOLUNTEER_RECRUITMENT_STATUS_TO_LIFECYCLE[recruitmentStatus]
    : null
  const publicTitle = resolveUjatRecruitAnnouncementTitle(
    program,
    ujatRecruitDisplayKindFromVolunteerHalf(volunteerHalf)
  )
  const watchedTargets = isEdit && form ? form.watch('volunteerTargets') : undefined
  const savedTargets = resolveProgramVolunteerTargets(program)
  const volunteerTarget =
    isEdit && watchedTargets
      ? watchedTargets.length
        ? formatVolunteerTargetsLabel(watchedTargets)
        : '-'
      : savedTargets.length
        ? formatVolunteerTargetsLabel(savedTargets)
        : isTemplateAuthoring
          ? UJAT_VOLUNTEER_RECRUIT_DEFAULT_TARGET_LABELS.join(', ')
          : '-'
  const volunteerTargetDetail =
    program.volunteerTargetDetail?.trim() ||
    program.generalCommonInfo?.volunteerRecruitmentInfo?.recruitmentTargetDetail?.trim() ||
    '-'
  const notes = resolveVolunteerNotesDisplay(program)
  const activityTerm = resolveActivityTermDisplay(program, volunteerHalf)
  const noticeExposureSetting =
    program.generalCommonInfo?.volunteerRecruitmentInfo?.noticeExposureTiming ??
    (isEdit && form ? form.watch('volunteerRecruitmentNoticeExposure') : undefined)
  const noticeExposureLabel = getUjatVolunteerNoticeExposureReadLabel(
    typeof noticeExposureSetting === 'string' ? noticeExposureSetting : undefined
  )
  const announcementPublishedValue =
    (isEdit && form ? form.watch('volunteerRecruitmentAnnouncementPublished') : undefined) ??
    announcementPublishedToFormValue(
      program.generalCommonInfo?.volunteerRecruitmentInfo?.announcementPublished
    )
  const announcementPublishedLabel =
    ANNOUNCEMENT_PUBLISHED_OPTIONS.find(option => option.value === announcementPublishedValue)
      ?.label ?? '게시'
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
  const recruitmentContactName =
    program.generalCommonInfo?.volunteerRecruitmentInfo?.contactOrganizationName?.trim() ||
    program.contactName?.trim() ||
    ''
  const announcementPublishedEdit =
    isEdit && form ? (
      <Controller
        name="volunteerRecruitmentAnnouncementPublished"
        control={form.control}
        render={({ field }) => (
          <ParticipantRecruitmentAnnouncementPublishedRadios
            value={field.value}
            onChange={field.onChange}
          />
        )}
      />
    ) : undefined
  const noticeExposureEdit =
    isEdit && form ? (
      <Controller
        name="volunteerRecruitmentNoticeExposure"
        control={form.control}
        render={({ field, fieldState }) => (
          <>
            <CmsRadioGroup size="medium"
              value={field.value ?? undefined}
              onChange={e => field.onChange(String(e.target.value))}
            >
              {UJAT_VOLUNTEER_NOTICE_EXPOSURE_OPTIONS.map(o => (
                <CmsRadio size="medium" key={o.value} value={o.value}>
                  {o.label}
                </CmsRadio>
              ))}
            </CmsRadioGroup>
            {fieldState.error?.message ? (
              <span role="alert" style={NOTICE_EXPOSURE_ERROR_STYLE}>
                {fieldState.error.message}
              </span>
            ) : null}
          </>
        )}
      />
    ) : undefined

  return (
    <div className="ujat-recruit-volunteer-info-program">
      {!hideSectionHeader ? (
        <UjatRecruitSectionDescriptionHeader
          title={sectionTitle}
          highlightParagraphId={highlightParagraphId}
        />
      ) : null}
      <DetailInfoForm title="봉사자 모집 정보" hideHeader mode={formMode}>
        {showNoticeExposure ? (
          <DetailInfoForm.Row type="double">
            <DetailInfoForm.Field
              label="공고 게시 여부"
              validationKey={recruitKey('announcementPublished')}
              view={announcementPublishedLabel}
              edit={announcementPublishedEdit}
            />
            <DetailInfoForm.Field
              label="모집 공고 노출 시점"
              validationKey={recruitKey('noticeExposure')}
              view={noticeExposureLabel}
              edit={noticeExposureEdit}
            />
          </DetailInfoForm.Row>
        ) : (
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="공고 게시 여부"
              validationKey={recruitKey('announcementPublished')}
              fullRow
              view={announcementPublishedLabel}
              edit={announcementPublishedEdit}
            />
          </DetailInfoForm.Row>
        )}
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="공고용 프로그램명"
            view={publicTitle}
            edit={
              isEdit && form ? (
                <Controller
                  name="announcementTitle"
                  control={form.control}
                  render={({ field }) => (
                    <CmsInput
                      {...field}
                      value={field.value ?? (isTemplateAuthoring ? '' : '')}
                      inputSize="small"
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
            validationKey={recruitKey('activityTerm')}
            view={activityTerm}
            edit={
              isEdit && form ? (
                <Controller
                  name={`rounds.${roundIndex}.curriculum` as 'rounds.0.curriculum'}
                  control={form.control}
                  render={({ field }) => (
                    <div className={`${UJAT_RECRUIT_FORM_MAX_SUFFIX_CLASS} ujat-recruit-activity-term-field`}>
                      <CmsNumericInput
                        {...field}
                        mode="numericText"
                        value={(field.value as string | undefined) ?? ''}
                        inputSize="small"
                        width="100%"
                        placeholder="활동 기수"
                        onValueChange={field.onChange}
                      />
                      <span className="ujat-recruit-activity-term-field__suffix">기</span>
                    </div>
                  )}
                />
              ) : undefined
            }
          />
        </DetailInfoForm.Row>

        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="프로그램 운영 기간"
            validationKey={recruitKey('programRangeSeal')}
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
            view={
              isTemplateAuthoring ? (
                <span className="form-editor-template-field-hint-text">{UJAT_RECRUIT_PROGRESS_HINT}</span>
              ) : (
                <LifecycleStatusView lifecycle={lifecycle} status={recruitmentStatus} />
              )
            }
          />
        </DetailInfoForm.Row>

        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="모집 대상"
            validationKey={recruitKey('volunteerTargets')}
            view={volunteerTarget}
            edit={
              isEdit && form ? (
                <Controller
                  name="volunteerTargets"
                  control={form.control}
                  render={({ field }) => (
                    <CmsSelect
                      mode="multiple"
                      withAllOption={false}
                      inputSize="small"
                      width={240}
                      value={normalizeRecruitmentTargetSelectValues(field.value)}
                      onChange={next => field.onChange(recruitmentTargetOptionValuesToStored(next))}
                      placeholder="모집 대상을 선택하세요"
                      options={[...UJAT_VOLUNTEER_RECRUIT_TARGET_OPTIONS]}
                    />
                  )}
                />
              ) : undefined
            }
          />
          <DetailInfoForm.Field
            label="모집 대상 상세"
            validationKey={recruitKey('volunteerTargetDetail')}
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
                      inputSize="small"
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
            validationKey={recruitKey('recruitRangeSeal')}
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
                    dateOnly
                  />
                </div>
              ) : undefined
            }
          />
          <DetailInfoForm.Field
            label="1차 서류 합격자 발표"
            validationKey={recruitKey('docAnnounce')}
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
            validationKey={[recruitKey('interviewRangeSeal'), recruitKey('interviewMethod')]}
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
            validationKey={[recruitKey('finalAnnounceIso'), recruitKey('finalAnnounceMethod')]}
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
            validationKey={[
              recruitKey('inquiryContact'),
              recruitKey('inquiryTel'),
              recruitKey('inquiryEmail'),
            ]}
            fullRow
            view={
              <ProgramDetailContactReadRow
                contactName={recruitmentContactName}
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
                    <Controller
                      name="volunteerRecruitmentContactOrganizationName"
                      control={form.control}
                      render={({ field }) => (
                        <CmsInput
                          {...field}
                          value={field.value ?? ''}
                          placeholder="담당 문의처"
                          inputSize="small"
                          className="program-detail-info-tab__contact-name-input"
                        />
                      )}
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
                          inputSize="small"
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
                          inputSize="small"
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
            validationKey={[recruitKey('notes'), recruitKey('otherNotes')]}
            fullRow
            view={notes}
            edit={isEdit && form ? <UjatRecruitVolunteerNotesField form={form} /> : undefined}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}
