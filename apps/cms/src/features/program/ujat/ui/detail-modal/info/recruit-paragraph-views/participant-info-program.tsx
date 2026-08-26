import { Controller } from 'react-hook-form'
import type { UseFormReturn } from 'react-hook-form'
import type { Program, ProgramLifecycleStatus } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import {
  formatDateRange,
  getParticipantRecruitmentLifecycle,
  parseTargetLevelsSelectValue,
  TARGET_LEVEL_LABEL,
} from '@/features/program/shared/lib/program-detail-info-constants'
import { getProgramLifecycleLabel } from '@/shared/constants/status'
import { ProgramDetailContactReadRow } from '@/features/program/shared/ui/program-detail/project-info/recruitment/components/recruitment-form-parts'
import { detailInfoFormSectionTitleHeaderProps } from '@/features/template/lib/writing-form-paragraph-description'
import { TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS } from '@/features/template/lib/template-form-select-options'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { DividerVertical } from '@/shared/components/divider-vertical'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsPhoneInput } from '@/shared/ui/cms-phone-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import { UjatInlineDividedSegments } from '../../shared/ujat-inline-divided-segments'
import {
  UJAT_RECRUIT_FORM_MAX_SUFFIX_CLASS,
  UjatRecruitFormDateMethodRow,
  UjatRecruitFormPeriodDatePicker,
  UjatRecruitParticipantNotesField,
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

function resolveParticipantNotesDisplay(program: Program): string {
  if (program.generalCommonInfo?.participantRecruitmentInfo?.notesNotApplicable) return '-'
  return (program.oneLineIntroduction ?? '').trim() || '-'
}

function resolveEducationTargetLabel(program: Program): string {
  const level = program.targetLevel ?? program.targetLevels?.[0]
  if (!level) return '초등학교'
  return TARGET_LEVEL_LABEL[level] ?? level
}

export function UjatRecruitParticipantInfoProgramView({
  program,
  sponsorName,
  form,
  isEdit,
  sectionTitle = '참여자 모집 정보',
  hideSectionHeader = false,
}: {
  program: Program
  sponsorName?: string
  form?: UseFormReturn<ProgramDetailEditFormValues>
  isEdit: boolean
  sectionTitle?: string
  /** 폼 양식 편집기 — 바깥 단락 헤더가 있을 때 중복 제거 */
  hideSectionHeader?: boolean
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
  const resultDate = program.resultAnnouncementDate ?? program.applicationEndDate
  const resultMethod = program.resultAnnouncementMethod ?? '홈페이지 공지 및 담당교사 개별 안내'
  const resultLine = resultDate ? (
    <UjatInlineDividedSegments
      segments={[dayjs(resultDate).format('YYYY.MM.DD(ddd)'), resultMethod]}
    />
  ) : (
    '-'
  )
  const publicTitle = program.mainTitle?.trim() || program.title
  const notes = resolveParticipantNotesDisplay(program)

  const formMode = isEdit && form ? 'edit' : 'view'
  const headerProps = hideSectionHeader
    ? { title: sectionTitle, hideHeader: true as const }
    : detailInfoFormSectionTitleHeaderProps(sectionTitle)

  return (
    <DetailInfoForm {...headerProps} mode={formMode}>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="공고용 프로그램명"
          fullRow
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
          label="참여자 모집 현황"
          readOnlyDisplay
          view={<LifecycleStatusView lifecycle={lifecycle} />}
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="교육 대상"
          view={resolveEducationTargetLabel(program)}
          edit={
            isEdit && form ? (
              <Controller
                name="targetLevels"
                control={form.control}
                render={({ field }) => (
                  <CmsSelect
                    mode="multiple"
                    inputSize="medium"
                    width="100%"
                    withAllOption={false}
                    value={field.value ?? []}
                    options={TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS}
                    onChange={v => field.onChange(parseTargetLevelsSelectValue(v))}
                    placeholder="교육 대상을 선택하세요"
                  />
                )}
              />
            ) : undefined
          }
        />
        <DetailInfoForm.Field
          label="교육 대상 상세"
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
                    inputSize="medium"
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
          view={formatDateRange(program.applicationStartDate, program.applicationEndDate)}
          edit={
            isEdit && form ? (
              <div className={UJAT_RECRUIT_FORM_MAX_SUFFIX_CLASS}>
                <UjatRecruitFormPeriodDatePicker
                  form={form}
                  startName="applicationStartDate"
                  endName="applicationEndDate"
                  placeholder="참여자 모집 기간을 선택하세요"
                />
              </div>
            ) : undefined
          }
        />
        <DetailInfoForm.Field
          label="최종 합격자 발표"
          view={resultLine}
          edit={
            isEdit && form ? (
              <UjatRecruitFormDateMethodRow
                form={form}
                dateName="resultAnnouncementDate"
                methodName="resultAnnouncementMethod"
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
          edit={isEdit && form ? <UjatRecruitParticipantNotesField form={form} /> : undefined}
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
