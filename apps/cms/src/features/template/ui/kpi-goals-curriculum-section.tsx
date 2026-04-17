import { FORM_INPUTS_2_WIDTHS } from '@/features/template/constants'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'

const [educatorWidthA, educatorWidthB] = FORM_INPUTS_2_WIDTHS

export function KpiGoalsCurriculumSection() {
  return (
    <DetailInfoForm title="사업 KPI 목표" hideHeader mode="edit">
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="참여자 최종 인원"
          edit={
            <CmsInput
              inputSize="medium"
              type="number"
              inputMode="numeric"
              placeholder="인원 수 입력"
              width={'100%'}
              min={0}
            />
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="교육진행자 최종 인원"
          edit={
            <div className="detail-info-form-inputs-wrapper-no-gap">
              <CmsInput
                placeholder="강사"
                inputSize="medium"
                width={educatorWidthA}
                type="number"
                min={0}
              />
              <DetailInfoForm.InputsSeparator />
              <CmsInput
                placeholder="봉사자"
                inputSize="medium"
                width={educatorWidthB}
                type="number"
                min={0}
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
              inputSize="medium"
              type="number"
              inputMode="numeric"
              placeholder="학교 수 입력"
              width={'100%'}
              min={0}
            />
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="최종 파견 학급 수"
          edit={
            <CmsInput
              inputSize="medium"
              type="number"
              inputMode="numeric"
              placeholder="학급 수 입력"
              width={'100%'}
              min={0}
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
