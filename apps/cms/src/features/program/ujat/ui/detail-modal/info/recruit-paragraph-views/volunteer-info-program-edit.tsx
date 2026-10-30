import { Controller, type UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { resolveProgramVolunteerTargets } from '@/features/program/shared/lib/program-detail-info-constants'
import {
  isUjatVolunteerNoticeExposureValue,
  NOTICE_EXPOSURE_ERROR_STYLE,
  UJAT_VOLUNTEER_NOTICE_EXPOSURE_OPTIONS,
} from '@/features/template/lib/ujat-volunteer-notice-exposure'
import { UjatRecruitSectionDescriptionHeader } from '../ujat-recruit-section-description-header'
import {
  normalizeRecruitmentTargetSelectValues,
  recruitmentTargetOptionValuesToStored,
  UJAT_VOLUNTEER_RECRUIT_TARGET_OPTIONS,
} from '../recruit-lib/recruitment-target-values'
import {
  UJAT_RECRUIT_FORM_MAX_SUFFIX_CLASS,
  UJAT_RECRUIT_PROGRESS_HINT,
  UjatRecruitFormDateMethodRow,
  UjatRecruitFormPeriodDatePicker,
  UjatRecruitInquiryContactField,
} from '../recruit-lib/ujat-recruit-form-fields'
import type { UjatVolunteerRecruitHalf } from '../ujat-recruit-paragraph-props'
import { UJAT_RECRUIT_TAB_LABELS } from '../ujat-program-detail-recruitment-tabs'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
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
  sectionTitle,
}: {
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
  const recruitStartName = 'volunteerApplicationStartDate' as const
  const recruitEndName = 'volunteerApplicationEndDate' as const
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
                <Controller
                  name="volunteerRecruitmentNoticeExposure"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <>
                      <CmsRadioGroup
                        size="medium"
                        value={
                          isUjatVolunteerNoticeExposureValue(field.value) ? field.value : undefined
                        }
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
                name="announcementTitle"
                control={form.control}
                render={({ field }) => (
                  <CmsInput
                    {...field}
                    value={field.value ?? ''}
                    inputSize="small"
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
                inputSize="small"
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
              <span className="form-editor-template-field-hint-text">
                {UJAT_RECRUIT_PROGRESS_HINT}
              </span>
            }
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="모집 대상"
            edit={
              <Controller
                name="volunteerTargets"
                control={form.control}
                render={({ field }) => (
                  <CmsSelect
                    mode="multiple"
                    withAllOption={false}
                    inputSize="small"
                    width={240}
                    value={normalizeRecruitmentTargetSelectValues(
                      field.value?.length
                        ? field.value
                        : resolveProgramVolunteerTargets(program).length
                          ? resolveProgramVolunteerTargets(program)
                          : (field.value ?? null)
                    )}
                    onChange={next => field.onChange(recruitmentTargetOptionValuesToStored(next))}
                    placeholder="모집 대상을 선택하세요"
                    options={[...UJAT_VOLUNTEER_RECRUIT_TARGET_OPTIONS]}
                  />
                )}
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
                    inputSize="small"
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
                  dateOnly
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
                      inputSize="small"
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
                <Controller
                  name="volunteerRecruitmentContactOrganizationName"
                  control={form.control}
                  render={({ field }) => (
                    <UjatRecruitInquiryContactField
                      label="문의처"
                      placeholder="담당 문의처"
                      value={field.value ?? ''}
                      onChange={field.onChange}
                    />
                  )}
                />
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
                      phone
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
                name="oneLineIntroduction"
                control={form.control}
                render={({ field }) => (
                  <CmsInput
                    {...field}
                    value={field.value ?? ''}
                    inputSize="small"
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
