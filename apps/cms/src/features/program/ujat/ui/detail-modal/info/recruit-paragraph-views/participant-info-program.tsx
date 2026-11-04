import { Controller } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import {
  formatDateRange,
  formatTargetLevelsLabel,
  getParticipantRecruitmentStatus,
  getParticipantRecruitmentLifecycle,
  getRecruitmentStatusLabelForStatus,
  parseTargetLevelsSelectValue,
  resolveProgramTargetLevels,
} from '@/features/program/shared/lib/program-detail-info-constants'
import {
  ANNOUNCEMENT_PUBLISHED_OPTIONS,
  announcementPublishedToFormValue,
} from '@/features/program/shared/lib/participant-recruitment-form-options'
import { ParticipantRecruitmentAnnouncementPublishedRadios } from '@/features/program/shared/ui/participant-recruitment-announcement-published-radios'
import { formatUjatDotDateWithWeekday } from '@/features/program/ujat/lib/ujat-date-display'
import { resolveUjatRecruitAnnouncementTitle } from '@/features/program/ujat/lib/ujat-recruit-display-program'
import { ProgramDetailContactReadRow } from '@/features/program/shared/ui/program-detail/project-info/recruitment/components/recruitment-form-parts'
import { TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS } from '@/features/template/lib/template-form-select-options'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { DividerVertical } from '@/shared/components/divider-vertical'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsPhoneInput } from '@/shared/ui/cms-phone-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import { UjatRecruitSectionDescriptionHeader } from '../ujat-recruit-section-description-header'
import { UjatInlineDividedSegments } from '../../shared/ujat-inline-divided-segments'
import {
  UJAT_RECRUIT_FORM_MAX_SUFFIX_CLASS,
  UJAT_RECRUIT_PROGRESS_HINT,
  UjatRecruitFormDateMethodRow,
  UjatRecruitFormPeriodDatePicker,
  UjatRecruitParticipantNotesField,
} from '../recruit-lib/ujat-recruit-form-fields'
import '@/features/program/shared/ui/program-detail/project-info/project-info-form-shared.css'
import '@/features/template/ui/form-editor/form-editor.css'
import './volunteer-info-program.css'
import './participant-info-program.css'

function LifecycleStatusView({
  lifecycle,
  status,
}: {
  lifecycle: ProgramLifecycleStatus | null
  status: ReturnType<typeof getParticipantRecruitmentStatus>
}) {
  if (!lifecycle) return <>-</>
  return (
    <span
      className={`program-detail-info-tab__lifecycle-status-text program-detail-info-tab__lifecycle-status-text--${lifecycle.replace(/_/g, '-')}`}
    >
      {getRecruitmentStatusLabelForStatus(status, 'participant')}
    </span>
  )
}

function resolveParticipantNotesDisplay(program: Program): string {
  if (program.generalCommonInfo?.participantRecruitmentInfo?.notesNotApplicable) return '-'
  return (program.oneLineIntroduction ?? '').trim() || '-'
}

function resolveEducationTargetLabel(program: Program, isTemplateAuthoring: boolean): string {
  const fromLevels = formatTargetLevelsLabel(resolveProgramTargetLevels(program))
  if (fromLevels !== '-') return fromLevels
  const nested =
    program.generalCommonInfo?.participantRecruitmentInfo?.educationTarget?.trim() ||
    program.generalCommonInfo?.participantRecruitmentInfo?.recruitmentTarget?.trim()
  if (nested) return nested
  return isTemplateAuthoring ? '초등학교' : '-'
}

export function UjatRecruitParticipantInfoProgramView({
  program,
  form,
  isEdit,
  sectionTitle,
  highlightParagraphId,
  hideSectionHeader = false,
  isTemplateAuthoring = false,
}: {
  program: Program
  sponsorName?: string
  form?: UseFormReturn<ProgramDetailEditFormValues>
  isEdit: boolean
  sectionTitle?: string
  highlightParagraphId?: string
  /** 폼 양식 편집기 — 바깥 단락 헤더가 있을 때 중복 제거 */
  hideSectionHeader?: boolean
  /** 양식 작성 화면 — 프로그램 연동 값 대신 placeholder·힌트 */
  isTemplateAuthoring?: boolean
}) {
  const lifecycle = getParticipantRecruitmentLifecycle(
    program,
    isEdit && form
      ? {
          applicationStartDate: form.watch('applicationStartDate'),
          applicationEndDate: form.watch('applicationEndDate'),
        }
      : undefined
  )
  const recruitmentStatus = getParticipantRecruitmentStatus(
    program,
    isEdit && form
      ? {
          applicationStartDate: form.watch('applicationStartDate'),
          applicationEndDate: form.watch('applicationEndDate'),
        }
      : undefined
  )
  const resultDate = program.resultAnnouncementDate
  const resultMethod = program.resultAnnouncementMethod?.trim()
  const resultLine = resultDate ? (
    <UjatInlineDividedSegments
      segments={[formatUjatDotDateWithWeekday(resultDate), resultMethod || '-']}
    />
  ) : (
    '-'
  )
  const publicTitle = resolveUjatRecruitAnnouncementTitle(program, 'institution', {
    allowOverlayFallback: isTemplateAuthoring,
  })
  const notes = resolveParticipantNotesDisplay(program)
  const announcementPublishedValue =
    (isEdit && form ? form.watch('participantRecruitmentAnnouncementPublished') : undefined) ??
    announcementPublishedToFormValue(
      program.generalCommonInfo?.participantRecruitmentInfo?.announcementPublished
    )
  const announcementPublishedLabel =
    ANNOUNCEMENT_PUBLISHED_OPTIONS.find(option => option.value === announcementPublishedValue)
      ?.label ?? '게시'

  const formMode = isEdit && form ? 'edit' : 'view'
  const recruitmentContactName =
    program.generalCommonInfo?.participantRecruitmentInfo?.contactOrganizationName?.trim() ||
    program.generalCommonInfo?.participantRecruitmentInfo?.contactName?.trim() ||
    program.contactName?.trim() ||
    ''

  return (
    <div className="ujat-recruit-participant-info-program">
      {!hideSectionHeader && sectionTitle?.trim() ? (
        <UjatRecruitSectionDescriptionHeader
          title={sectionTitle.trim()}
          highlightParagraphId={highlightParagraphId}
        />
      ) : null}
      <DetailInfoForm title="참여 기관 모집 정보" hideHeader mode={formMode}>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="공고 게시 여부"
            validationKey="recruit.institution.announcementPublished"
            fullRow
            view={announcementPublishedLabel}
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
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="공고용 프로그램명"
            fullRow
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
        </DetailInfoForm.Row>

        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="프로그램 운영 기간"
            validationKey="recruit.institution.programRangeSeal"
            view={formatDateRange(program.startDate, program.endDate)}
            edit={
              isEdit && form ? (
                <div className={UJAT_RECRUIT_FORM_MAX_SUFFIX_CLASS}>
                  <UjatRecruitFormPeriodDatePicker
                    form={form}
                    startName="startDate"
                    endName="endDate"
                    placeholder="프로그램 운영 기간을 선택해 주세요"
                  />
                </div>
              ) : undefined
            }
          />
          <DetailInfoForm.Field
            label="참여자 모집 현황"
            readOnlyDisplay
            view={
              isTemplateAuthoring ? (
                <span className="form-editor-template-field-hint-text">
                  {UJAT_RECRUIT_PROGRESS_HINT}
                </span>
              ) : (
                <LifecycleStatusView lifecycle={lifecycle} status={recruitmentStatus} />
              )
            }
          />
        </DetailInfoForm.Row>

        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="교육 대상"
            validationKey="recruit.institution.targetLevels"
            view={resolveEducationTargetLabel(program, isTemplateAuthoring)}
            edit={
              isEdit && form ? (
                <Controller
                  name="targetLevels"
                  control={form.control}
                  render={({ field }) => (
                    <CmsSelect
                      mode="multiple"
                      inputSize="small"
                      width={240}
                      withAllOption={false}
                      value={field.value ?? []}
                      options={TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS}
                      onChange={v => field.onChange(parseTargetLevelsSelectValue(v))}
                      placeholder="교육 대상을 선택해 주세요"
                    />
                  )}
                />
              ) : undefined
            }
          />
          <DetailInfoForm.Field
            label="교육 대상 상세"
            validationKey="recruit.institution.targetLevelDetail"
            view={program.district ?? '-'}
            edit={
              isEdit && form ? (
                <Controller
                  name="district"
                  control={form.control}
                  render={({ field }) => (
                    <CmsInput
                      {...field}
                      value={field.value ?? ''}
                      inputSize="small"
                      width="100%"
                      placeholder="교육 대상 상세"
                    />
                  )}
                />
              ) : undefined
            }
          />
        </DetailInfoForm.Row>

        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="참여자 모집 기간"
            validationKey="recruit.institution.recruitRangeSeal"
            view={formatDateRange(program.applicationStartDate, program.applicationEndDate)}
            edit={
              isEdit && form ? (
                <div className={UJAT_RECRUIT_FORM_MAX_SUFFIX_CLASS}>
                  <UjatRecruitFormPeriodDatePicker
                    form={form}
                    startName="applicationStartDate"
                    endName="applicationEndDate"
                    placeholder="참여자 모집 기간을 선택해 주세요"
                    dateOnly
                  />
                </div>
              ) : undefined
            }
          />
          <DetailInfoForm.Field
            label="최종 합격자 발표"
            validationKey={[
              'recruit.institution.finalAnnounceIso',
              'recruit.institution.finalAnnounceMethod',
            ]}
            view={resultLine}
            edit={
              isEdit && form ? (
                <UjatRecruitFormDateMethodRow
                  form={form}
                  dateName="resultAnnouncementDate"
                  methodName="resultAnnouncementMethod"
                  datePlaceholder="합격자 발표일"
                  methodPlaceholder="발표 방법 안내"
                />
              ) : undefined
            }
          />
        </DetailInfoForm.Row>

        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="문의처"
            validationKey={[
              'recruit.institution.inquiryContact',
              'recruit.institution.inquiryTel',
              'recruit.institution.inquiryEmail',
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
                      name="recruitmentContactOrganizationName"
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
            validationKey="recruit.institution.notes"
            fullRow
            view={notes}
            edit={isEdit && form ? <UjatRecruitParticipantNotesField form={form} /> : undefined}
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </div>
  )
}
