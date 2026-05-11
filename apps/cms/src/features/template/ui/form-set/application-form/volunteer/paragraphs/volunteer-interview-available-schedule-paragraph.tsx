import { ClockCircleOutlined } from '@ant-design/icons'
import { InstructorAvailableScheduleParagraph } from '@/features/template/ui/form-set/application-form/instructor/paragraphs/instructor-available-schedule-paragraph'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { DirectUnavailableDateAddButton } from '@/features/template/ui/form-set/shared/direct-unavailable-date-add-button'
import './volunteer-interview-available-schedule-paragraph.css'

function VolunteerInterviewScheduleTemplateUi() {
  return (
    <div className="volunteer-interview-available-schedule">
      <DetailInfoForm title="면접 진행 가능 일정" hideHeader mode="edit">
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="면접 전형 불가일"
            fullRow
            edit={
              <div className="detail-info-form-inputs-wrapper">
                <CmsCheckbox>토요일 제외</CmsCheckbox>
                <CmsCheckbox>일요일 제외</CmsCheckbox>
                <CmsCheckbox>공휴일 제외</CmsCheckbox>
                <DetailInfoForm.InputsSeparator />
                <DirectUnavailableDateAddButton />
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>

        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="면접 전형 가능 시간"
            fullRow
            edit={
              <div className="detail-info-form-inputs-wrapper">
                <CmsInput
                  inputSize="medium"
                  width={240}
                  placeholder="시간을 선택해 주세요"
                  icon={<ClockCircleOutlined aria-hidden />}
                />
                <DetailInfoForm.InputsSeparator />
                <CmsRadioGroup defaultValue="30">
                  <CmsRadio value="15">15분 단위</CmsRadio>
                  <CmsRadio value="30">30분 단위</CmsRadio>
                  <CmsRadio value="60">1시간 단위</CmsRadio>
                </CmsRadioGroup>
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>

      <div className="volunteer-interview-available-schedule__summary">
        <span className="volunteer-interview-available-schedule__summary-hint">
          진행 가능한 시간대를 선택해 주세요. 미선택 된 시간은 사용자가 신청 불가합니다.
        </span>
        <div className="volunteer-interview-available-schedule__empty">
          설정된 면접 시간이 없습니다. 면접 시간을 설정해 주세요.
        </div>
      </div>
    </div>
  )
}

/** 봉사자 신청 폼 — 면접 진행 가능 일정 */
export function VolunteerInterviewAvailableScheduleParagraph({
  isTemplateAuthoringMode = false,
}: {
  isTemplateAuthoringMode?: boolean
}) {
  if (isTemplateAuthoringMode) return <VolunteerInterviewScheduleTemplateUi />

  return <InstructorAvailableScheduleParagraph summaryFieldLabel="면접 진행 가능일" />
}
