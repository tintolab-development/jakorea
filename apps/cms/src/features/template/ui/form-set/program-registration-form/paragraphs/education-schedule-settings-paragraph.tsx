import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import './program-registration-paragraph.css'

export function ProgramRegistrationEducationScheduleSettingsParagraph() {
  return (
    <DetailInfoForm
      title="교육 진행 일정 설정"
      hideHeader
      mode="edit"
      className="program-registration-paragraph"
    >
      <p className="program-registration-paragraph__guide">
        교육이 실행되는 일정을 상세하게 정해주세요.
      </p>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="교육 진행 방식"
          edit={
            <div className="program-registration-paragraph__schedule-inline">
              <CmsRadioGroup size="large" value="weekly">
                <CmsRadio value="weekly">주기 지정</CmsRadio>
                <CmsRadio value="period">기간 지정</CmsRadio>
              </CmsRadioGroup>
            </div>
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="교육 진행 일정 선택"
          edit={
            <CmsSelect disabled withAllOption={false} inputSize="medium" placeholder="날짜를 선택하세요" width="100%" />
          }
          view="-"
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="교육 진행 예정일"
          fullRow
          edit={
            <CmsInput
              disabled
              inputSize="large"
              value="26년 4월 20일(월) 9:30 ~ 12:20   |   26년 4월 27일(월) 13:00 ~ 15:50"
              width="100%"
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
