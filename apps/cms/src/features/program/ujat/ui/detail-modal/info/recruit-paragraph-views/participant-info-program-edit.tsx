import { Controller, type UseFormReturn } from 'react-hook-form'
import type { Program } from '@/types/domain'
import type { ProgramDetailEditFormValues } from '@/features/program/shared/model/program-detail-edit-schema'
import { parseTargetLevelsSelectValue } from '@/features/program/shared/lib/program-detail-info-constants'
import { TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS } from '@/features/template/lib/template-form-select-options'
import { detailInfoFormSectionTitleHeaderProps } from '@/features/template/lib/writing-form-paragraph-description'
import {
  UJAT_RECRUIT_FORM_MAX_SUFFIX_CLASS,
  UJAT_RECRUIT_PROGRESS_HINT,
  UjatRecruitFormDateMethodRow,
  UjatRecruitFormPeriodDatePicker,
  UjatRecruitInquiryContactField,
} from '../recruit-lib/ujat-recruit-form-fields'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import '@/features/template/ui/form-editor/form-editor.css'
export function UjatRecruitParticipantInfoProgramEdit({
  program,
  form,
  sectionTitle = '참여자 모집 정보' }: {
  program: Program
  form: UseFormReturn<ProgramDetailEditFormValues>
  sectionTitle?: string
}) {
  const headerProps = detailInfoFormSectionTitleHeaderProps(sectionTitle)
  return (
    <DetailInfoForm {...headerProps} mode="edit">
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="공고용 프로그램명"
          fullRow
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
                  placeholder="프로그램명을 입력하세요"
                />
              )}
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
          label="참여자 모집 현황"
          readOnlyDisplay
          view={
            <span className="form-editor-template-field-hint-text">{UJAT_RECRUIT_PROGRESS_HINT}</span>
          }
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="교육 대상"
          edit={
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
                  options={TEMPLATE_FORM_EDUCATION_RECRUITMENT_TARGET_OPTIONS}
                  onChange={v => field.onChange(parseTargetLevelsSelectValue(v))}
                  placeholder="교육 대상을 선택하세요"
                />
              )}
            />
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="교육 대상 상세"
          edit={
            <Controller
              name="district"
              control={form.control}
              render={({ field }) => (
                <CmsInput
                  {...field}
                  value={field.value ?? ''}
                  inputSize="medium"
                  width="100%"
                  placeholder="상세 교육 대상을 입력하세요"
                />
              )}
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="참여자 모집 기간"
          edit={
            <div className={UJAT_RECRUIT_FORM_MAX_SUFFIX_CLASS}>
              <UjatRecruitFormPeriodDatePicker
                form={form}
                startName="applicationStartDate"
                endName="applicationEndDate"
                placeholder="모집 기간을 선택하세요"
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
              dateName="resultAnnouncementDate"
              methodName="resultAnnouncementMethod"
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
  )
}