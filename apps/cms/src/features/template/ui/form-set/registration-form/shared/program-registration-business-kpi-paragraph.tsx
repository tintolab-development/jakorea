import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import '@/features/template/ui/form-set/registration-form/general/paragraphs/program-registration-paragraph.css'

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
}: ProgramRegistrationBusinessKpiParagraphProps = {}) {
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
            <div className="detail-info-form-inputs-wrapper">
              <span className="detail-info-form--text mr-6">강사</span>
              <CmsInput
                disabled={instructorDisabled}
                inputSize="medium"
                placeholder={instructorPlaceholder}
                width={120}
              />
              <DetailInfoForm.InputsSeparator />
              <span className="detail-info-form--text mr-6">봉사자</span>
              <CmsInput
                disabled={volunteerDisabled}
                inputSize="medium"
                placeholder={volunteerPlaceholder}
                width={120}
              />
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
