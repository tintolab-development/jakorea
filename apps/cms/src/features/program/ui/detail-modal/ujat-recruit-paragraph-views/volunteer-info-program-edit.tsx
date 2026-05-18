import { useMemo } from 'react'
import { Controller, type UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/model/program-detail-edit-schema'
import { TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS } from '@/features/template/lib/template-form-select-options'
import {
  isUjatVolunteerNoticeExposureValue,
  UJAT_VOLUNTEER_NOTICE_EXPOSURE_OPTIONS,
} from '@/features/template/lib/ujat-volunteer-notice-exposure'
import { UjatRecruitSectionDescriptionHeader } from '../ujat-recruit-section-description-header'
import { recruitmentTargetLabelsToOptionValues } from '../ujat-recruit-lib/recruitment-target-values'
import {
  UJAT_RECRUIT_FORM_MAX_SUFFIX_CLASS,
  UJAT_RECRUIT_PROGRESS_HINT,
  UjatRecruitFormDateMethodRow,
  UjatRecruitFormPeriodDatePicker,
  UjatRecruitInquiryContactField,
} from '../ujat-recruit-lib/ujat-recruit-form-fields'
import type { UjatVolunteerRecruitHalf } from '../ujat-recruit-paragraph-props'
import { UJAT_RECRUIT_TAB_LABELS } from '../ujat-program-detail-recruitment-tabs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import { AppMultiSelect } from '@/shared/ui/app-multi-select'
import '@/features/template/ui/form-editor/form-editor.css'
const UJAT_TEMPLATE_INTERVIEW_METHOD_OPTIONS = [
  { label: '대면', value: 'offline' },
  { label: '비대면', value: 'online' },
] as const
export function UjatRecruitVolunteerInfoProgramEdit({
  program,
  form,
  volunteerHalf,
  showNoticeExposure,
  sectionTitle }: {
  program: Program
  form: UseFormReturn<ProgramDetailEditFormValues>
  volunteerHalf: UjatVolunteerRecruitHalf
  showNoticeExposure: boolean
  sectionTitle?: string
}) {
  const resolvedSectionTitle =
    sectionTitle ??
    (volunteerHalf === 'h1'
      ? UJAT_RECRUIT_TAB_LABELS.recruit_volunteer_h1
      : UJAT_RECRUIT_TAB_LABELS.recruit_volunteer_h2)
  const activityTermLabel = volunteerHalf === 'h1' ? '상반기 (1학기)' : '하반기 (2학기)'
  const recruitTargets = useMemo(
    () => recruitmentTargetLabelsToOptionValues(program.volunteerTarget),
    [program.volunteerTarget]
  )
  const roundIndex = volunteerHalf === 'h1' ? 0 : 1
  const hasRound = form.watch(`rounds.${roundIndex}`) != null
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
  const noticeExposureSetting: string | undefined = undefined /* TODO(api) */
  const noticeExposureValue = isUjatVolunteerNoticeExposureValue(noticeExposureSetting)
    ? noticeExposureSetting
    : 'start-day'
  return (
    <>
      <UjatRecruitSectionDescriptionHeader title={resolvedSectionTitle} />
      {showNoticeExposure && (
        <DetailInfoForm title="봉사자 모집 공고 노출 시점" hideHeader mode="edit">
          <DetailInfoForm.Row type="single">
            <DetailInfoForm.Field
              label="모집 공고 노출 시점"
              fullRow
              edit={
                <CmsRadioGroup value={noticeExposureValue} disabled>
                  {UJAT_VOLUNTEER_NOTICE_EXPOSURE_OPTIONS.map(o => (
                    <CmsRadio key={o.value} value={o.value}>
                      {o.label}
                    </CmsRadio>
                  ))}
                </CmsRadioGroup>
              }
              view="-"
            />
          </DetailInfoForm.Row>
        </DetailInfoForm>
      )}
      <DetailInfoForm title="봉사자 모집 정보" hideHeader mode="edit">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="공고용 프로그램명"
            edit={
              <Controller
                name="mainTitle"
                control={form.control}
                render={({ field }) => (
                  <CmsInput
                    {...field}
                    value={field.value ?? program.title ?? ''}
                    inputSize="medium"
                    width="100%"
                    placeholder="공고용 프로그램명을 입력하세요"
                  />
                )}
              />
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="활동 기수"
            edit={
              <CmsInput
                inputSize="medium"
                width="100%"
                value={activityTermLabel}
                disabled
                placeholder="활동 기수를 입력하세요"
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="프로그램 운영 기간"
            edit={
              <div className={UJAT_RECRUIT_FORM_MAX_SUFFIX_CLASS}>
                <UjatRecruitFormPeriodDatePicker
                  form={form}
                  startName="startDate"
                  endName="endDate"
                  placeholder="프로그램 운영 기간을 선택하세요"
                />
              </div>
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="봉사자 모집 현황"
            readOnlyDisplay
            view={
              <span className="form-editor-template-field-hint-text">{UJAT_RECRUIT_PROGRESS_HINT}</span>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="모집 대상"
            edit={
              <AppMultiSelect
                style={{ width: 240 }}
                value={recruitTargets}
                onChange={() => undefined}
                disabled
                placeholder="모집 대상을 선택하세요"
                options={TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS}
              />
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="모집 대상 상세"
            edit={
              <Controller
                name="volunteerTargetDetail"
                control={form.control}
                render={({ field }) => (
                  <CmsInput
                    {...field}
                    value={field.value ?? ''}
                    inputSize="medium"
                    width="100%"
                    placeholder="모집 대상 상세를 입력하세요"
                  />
                )}
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="봉사자 모집 기간"
            edit={
              <div className={UJAT_RECRUIT_FORM_MAX_SUFFIX_CLASS}>
                <UjatRecruitFormPeriodDatePicker
                  form={form}
                  startName={recruitStartName}
                  endName={recruitEndName}
                  placeholder="모집 기간을 선택하세요"
                  clearToUndefined
                />
              </div>
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="1차 서류합격 발표"
            edit={
              <UjatRecruitFormDateMethodRow
                form={form}
                dateName="documentPassAnnouncementDate"
                methodName="documentPassAnnouncementMethod"
                datePlaceholder="합격자 발표일"
                methodPlaceholder="발표 방법 안내"
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="2차 면접 기간"
            edit={
              <div className={UJAT_RECRUIT_FORM_MAX_SUFFIX_CLASS}>
                <UjatRecruitFormPeriodDatePicker
                  form={form}
                  startName="interviewStartDate"
                  endName="interviewEndDate"
                  placeholder="면접 기간을 선택하세요"
                  clearToUndefined
                />
                <DetailInfoForm.InputsSeparator />
                <Controller
                  name="interviewMethod"
                  control={form.control}
                  render={({ field }) => (
                    <CmsSelect
                      inputSize="medium"
                      style={{ flex: '1 1 0', minWidth: 0 }}
                      placeholder="면접 유형"
                      value={field.value ?? undefined}
                      options={[...UJAT_TEMPLATE_INTERVIEW_METHOD_OPTIONS]}
                      onChange={v => field.onChange(v ?? undefined)}
                    />
                  )}
                />
              </div>
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="최종 합격자 발표"
            edit={
              <UjatRecruitFormDateMethodRow
                form={form}
                dateName="finalPassAnnouncementDate"
                methodName="finalPassAnnouncementMethod"
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="문의처"
            fullRow
            edit={
              <div className={UJAT_RECRUIT_FORM_MAX_SUFFIX_CLASS}>
                <UjatRecruitInquiryContactField label="문의처" placeholder="담당 문의처" />
                <DetailInfoForm.InputsSeparator />
                <Controller
                  name="contactPhone"
                  control={form.control}
                  render={({ field }) => (
                    <UjatRecruitInquiryContactField
                      label="Tel"
                      placeholder="문의처 전화번호"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  )}
                />
                <DetailInfoForm.InputsSeparator />
                <Controller
                  name="contactEmail"
                  control={form.control}
                  render={({ field }) => (
                    <UjatRecruitInquiryContactField
                      label="E-mail"
                      placeholder="문의처 이메일"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  )}
                />
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="비고"
            edit={
              <Controller
                name="otherNotes"
                control={form.control}
                render={({ field }) => (
                  <CmsInput
                    {...field}
                    value={field.value ?? ''}
                    inputSize="medium"
                    width="100%"
                    placeholder="비고란을 작성하세요 (없으면 -로 입력)"
                  />
                )}
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </>
  )
}