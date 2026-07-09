import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

export type ProgramRegistrationBusinessKpiProgressItem = {
  label: string
  disabled?: boolean
  placeholder?: string
  defaultValue?: string
}

export type ProgramRegistrationBusinessKpiParagraphProps = {
  /** 교육진행자 최종 인원 — 강사 입력란 */
  instructorDisabled?: boolean
  instructorPlaceholder?: string
  /** 교육진행자 최종 인원 — 봉사자 입력란 */
  volunteerDisabled?: boolean
  volunteerPlaceholder?: string
  /** 최종 파견 학교 수 입력란 */
  dispatchedSchoolDisabled?: boolean
  dispatchedSchoolPlaceholder?: string
  /** 최종 파견 학급 수 입력란 */
  dispatchedClassDisabled?: boolean
  dispatchedClassPlaceholder?: string
  /** 교육진행자 최종 인원 항목 오버라이드 — 미지정 시 강사/봉사자 */
  educationProgressItems?: readonly ProgramRegistrationBusinessKpiProgressItem[]
}

export function ProgramRegistrationBusinessKpiParagraph({
  instructorDisabled = false,
  instructorPlaceholder = '목표값 입력',
  volunteerDisabled = false,
  volunteerPlaceholder = '목표값 입력',
  dispatchedSchoolDisabled = false,
  dispatchedSchoolPlaceholder = '목표값 입력',
  dispatchedClassDisabled = false,
  dispatchedClassPlaceholder = '목표값 입력',
  educationProgressItems,
}: ProgramRegistrationBusinessKpiParagraphProps = {}) {
  const progressItems = educationProgressItems ?? [
    {
      label: '강사',
      disabled: instructorDisabled,
      placeholder: instructorPlaceholder,
    },
    {
      label: '봉사자',
      disabled: volunteerDisabled,
      placeholder: volunteerPlaceholder,
    },
  ]

  return (
    <DetailInfoForm
      title="사업 KPI 목표"
      hideHeader
      mode="edit"
      className="program-registration-paragraph"
    >
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="참여자 최종 인원"
          edit={<CmsInput inputSize="medium" placeholder="목표값 입력" width={120} />}
          view="-"
        />
        <DetailInfoForm.Field
          label="교육진행자 최종 인원"
          edit={
            <div className="detail-info-form-inputs-wrapper program-registration-paragraph__instructor-kpi-row">
              {progressItems.map((item, index) => (
                <div
                  key={item.label}
                  className="program-registration-paragraph__instructor-kpi-group"
                >
                  {index > 0 ? <DetailInfoForm.InputsSeparator /> : null}
                  <span className="detail-info-form--text">{item.label}</span>
                  <CmsInput
                    disabled={item.disabled}
                    inputSize="medium"
                    placeholder={item.placeholder ?? '목표값 입력'}
                    defaultValue={item.defaultValue}
                    width={120}
                  />
                </div>
              ))}
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="최종 파견 학교 수"
          edit={
            <CmsInput
              disabled={dispatchedSchoolDisabled}
              inputSize="medium"
              placeholder={dispatchedSchoolPlaceholder}
              width={120}
            />
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="최종 파견 학급 수"
          edit={
            <CmsInput
              disabled={dispatchedClassDisabled}
              inputSize="medium"
              placeholder={dispatchedClassPlaceholder}
              width={120}
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
