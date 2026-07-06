import type { CSSProperties } from 'react'
import type { Dayjs } from 'dayjs'
import { ParticipantRecruitmentAnnouncementPublishedRadios } from '@/features/program/shared/ui/participant-recruitment-announcement-published-radios'
import {
  GEMINI_RECRUITMENT_EDUCATION_FORM_OPTIONS,
  GEMINI_RECRUITMENT_EDUCATION_TARGET_OPTIONS,
  type GeminiRecruitmentEducationForm,
} from '../../lib/recruitment/add-form-options'
import type { GeminiRecruitmentFormFieldValues } from '../../lib/recruitment/format-recruitment-fields'
import {
  formatEducationForm,
  formatEducationTargetLevels,
  formatInquiryContact,
  formatMinStudentCount,
  formatNotes,
  formatOptionalText,
} from '../../lib/recruitment/format-recruitment-fields'
import { formatRecruitmentPeriodRange } from '../../lib/recruitment/format-period'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { renderDetailInfoPipeSeparated } from '@/features/program/shared/ui/program-detail-td-divider'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import { GeminiRecruitmentPeriodDatePicker } from './gemini-recruitment-period-date-picker'

const MAX_SUFFIX_CLASS = 'detail-info-form-inputs-wrapper-no-gap'
const RECRUITMENT_RADIO_CLASS = 'program-detail-info-tab__recruitment-radio'

const inquiryColumnStyle: CSSProperties = {
  display: 'flex',
  minWidth: 0,
  alignItems: 'center',
  gap: 8,
}

function InquiryContactColumn({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string
  placeholder: string
  value: string
  onChange: (next: string) => void
}) {
  return (
    <div style={inquiryColumnStyle}>
      <span className="nowrap" style={{ flexShrink: 0 }}>
        {label}
      </span>
      <CmsInput
        inputSize="medium"
        width={240}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
      />
    </div>
  )
}

export type GeminiRecruitmentInstitutionFieldsProps = {
  mode: 'view' | 'edit'
  values: GeminiRecruitmentFormFieldValues
  onChange?: (patch: Partial<GeminiRecruitmentFormFieldValues>) => void
  showAnnouncementRow?: boolean
  applicationPeriod?: [Dayjs | null, Dayjs | null] | null
  onApplicationPeriodChange?: (dates: [Dayjs | null, Dayjs | null] | null) => void
  trainingRequestPeriod?: [Dayjs | null, Dayjs | null] | null
  onTrainingRequestPeriodChange?: (dates: [Dayjs | null, Dayjs | null] | null) => void
  onMinStudentCountChange?: (value: string) => void
}

export function GeminiRecruitmentInstitutionFields({
  mode,
  values,
  onChange,
  showAnnouncementRow = true,
  applicationPeriod = null,
  onApplicationPeriodChange,
  trainingRequestPeriod = null,
  onTrainingRequestPeriodChange,
  onMinStudentCountChange,
}: GeminiRecruitmentInstitutionFieldsProps) {
  const isEdit = mode === 'edit' && onChange != null
  const minStudentCountInput =
    values.minStudentCount != null ? String(values.minStudentCount) : ''

  return (
    <>
      {showAnnouncementRow ? (
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="공고 게시 여부"
            fullRow
            view="-"
            edit={
              isEdit ? (
                <ParticipantRecruitmentAnnouncementPublishedRadios
                  value={values.announcementPublished}
                  onChange={next => onChange({ announcementPublished: next })}
                />
              ) : undefined
            }
          />
        </DetailInfoForm.Row>
      ) : null}

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="공고명"
          fullRow
          view={formatOptionalText(values.title)}
          edit={
            isEdit ? (
              <CmsInput
                inputSize="medium"
                width="100%"
                placeholder="대표 프로그램명(국문)을 입력하세요"
                value={values.title}
                onChange={e => onChange({ title: e.target.value })}
              />
            ) : undefined
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="교육 대상"
          view={formatEducationTargetLevels(values.educationTargetLevels)}
          edit={
            isEdit ? (
              <CmsSelect
                mode="multiple"
                inputSize="medium"
                width={240}
                withAllOption={false}
                placeholder="교육 대상을 선택하세요"
                options={GEMINI_RECRUITMENT_EDUCATION_TARGET_OPTIONS}
                value={values.educationTargetLevels}
                onChange={v =>
                  onChange({
                    educationTargetLevels: Array.isArray(v) ? v.map(String) : [],
                  })
                }
              />
            ) : undefined
          }
        />
        <DetailInfoForm.Field
          label="교육 대상 상세"
          view={formatOptionalText(values.educationTargetDetail)}
          edit={
            isEdit ? (
              <CmsInput
                inputSize="medium"
                width="100%"
                placeholder="상세 교육 대상을 입력하세요"
                value={values.educationTargetDetail}
                onChange={e => onChange({ educationTargetDetail: e.target.value })}
              />
            ) : undefined
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="기관 모집 기간"
          view={formatRecruitmentPeriodRange(
            values.applicationPeriodStart ?? '',
            values.applicationPeriodEnd ?? ''
          )}
          edit={
            isEdit && onApplicationPeriodChange ? (
              <div className={MAX_SUFFIX_CLASS}>
                <GeminiRecruitmentPeriodDatePicker
                  value={applicationPeriod}
                  onChange={onApplicationPeriodChange}
                  placeholder="기관 모집 기간을 선택하세요"
                />
              </div>
            ) : undefined
          }
        />
        <DetailInfoForm.Field
          label="연수 요청 가능기간"
          view={formatRecruitmentPeriodRange(
            values.trainingRequestPeriodStart ?? '',
            values.trainingRequestPeriodEnd ?? ''
          )}
          edit={
            isEdit && onTrainingRequestPeriodChange ? (
              <div className={MAX_SUFFIX_CLASS}>
                <GeminiRecruitmentPeriodDatePicker
                  value={trainingRequestPeriod}
                  onChange={onTrainingRequestPeriodChange}
                  placeholder="연수 요청 가능기간을 선택하세요"
                />
              </div>
            ) : undefined
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="최소 수강 인원"
          view={formatMinStudentCount(values.minStudentCount)}
          edit={
            isEdit && onMinStudentCountChange ? (
              <div className={MAX_SUFFIX_CLASS}>
                <CmsInput
                  inputSize="medium"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  placeholder="최소 수강 인원을 입력하세요"
                  width={120}
                  value={minStudentCountInput}
                  onChange={e => onMinStudentCountChange(e.target.value)}
                />
                <span style={{ marginLeft: 6 }}>명</span>
              </div>
            ) : undefined
          }
        />
        <DetailInfoForm.Field
          label="교육 형태"
          view={formatEducationForm(values.educationForm)}
          edit={
            isEdit ? (
              <CmsRadioGroup
                size="large"
                value={values.educationForm}
                onChange={e =>
                  onChange({ educationForm: e.target.value as GeminiRecruitmentEducationForm })
                }
                className={RECRUITMENT_RADIO_CLASS}
              >
                {GEMINI_RECRUITMENT_EDUCATION_FORM_OPTIONS.map(option => (
                  <CmsRadio key={option.value} value={option.value} size="large">
                    {option.label}
                  </CmsRadio>
                ))}
              </CmsRadioGroup>
            ) : undefined
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="문의처"
          fullRow
          view={renderDetailInfoPipeSeparated(formatInquiryContact(values))}
          edit={
            isEdit ? (
              <div className={MAX_SUFFIX_CLASS}>
                <InquiryContactColumn
                  label="문의처"
                  placeholder="담당 문의처"
                  value={values.inquiryContactName}
                  onChange={next => onChange({ inquiryContactName: next })}
                />
                <DetailInfoForm.InputsSeparator />
                <InquiryContactColumn
                  label="Tel"
                  placeholder="문의처 전화번호"
                  value={values.inquiryTel}
                  onChange={next => onChange({ inquiryTel: next })}
                />
                <DetailInfoForm.InputsSeparator />
                <InquiryContactColumn
                  label="E-mail"
                  placeholder="문의처 이메일"
                  value={values.inquiryEmail}
                  onChange={next => onChange({ inquiryEmail: next })}
                />
              </div>
            ) : undefined
          }
        />
      </DetailInfoForm.Row>

      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="비고"
          fullRow
          view={formatNotes(values.notesNotApplicable, values.notes)}
          edit={
            isEdit ? (
              <div className={MAX_SUFFIX_CLASS}>
                <CmsCheckbox
                  checkboxSize="medium"
                  checked={values.notesNotApplicable}
                  onChange={e => {
                    const checked = e.target.checked
                    onChange({
                      notesNotApplicable: checked,
                      ...(checked ? { notes: '' } : {}),
                    })
                  }}
                >
                  해당 없음
                </CmsCheckbox>
                <DetailInfoForm.InputsSeparator />
                <CmsInput
                  inputSize="medium"
                  width="100%"
                  style={{ flex: '1 1 0', minWidth: 0 }}
                  placeholder="비고란을 작성하세요"
                  value={values.notes}
                  disabled={values.notesNotApplicable}
                  onChange={e => onChange({ notes: e.target.value })}
                />
              </div>
            ) : undefined
          }
        />
      </DetailInfoForm.Row>
    </>
  )
}
