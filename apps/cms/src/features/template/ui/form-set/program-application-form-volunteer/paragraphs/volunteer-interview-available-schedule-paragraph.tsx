import { ClockCircleOutlined } from '@ant-design/icons'
import { InstructorAvailableScheduleParagraph } from '@/features/template/ui/form-set/program-application-form-instructor/paragraphs/instructor-available-schedule-paragraph'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsButton } from '@/shared/ui/cms-button'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import './volunteer-interview-available-schedule-paragraph.css'

function DirectUnavailableDateAddIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden
    >
      <mask
        id="volunteer-interview-unavailable-date-add-icon-mask"
        style={{ maskType: 'alpha' }}
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="20"
        height="20"
      >
        <rect width="20" height="20" fill="#D9D9D9" />
      </mask>
      <g mask="url(#volunteer-interview-unavailable-date-add-icon-mask)">
        <path
          d="M4.7872 16.6673C4.39366 16.6673 4.06056 16.531 3.7879 16.2583C3.51524 15.9857 3.37891 15.6526 3.37891 15.259V6.39013C3.37891 5.99659 3.51524 5.66349 3.7879 5.39082C4.06056 5.11816 4.39366 4.98183 4.7872 4.98183H5.86577V3.93306C5.86577 3.76232 5.92297 3.61976 6.03735 3.50537C6.15174 3.39111 6.2943 3.33398 6.46504 3.33398C6.63591 3.33398 6.77847 3.39111 6.89273 3.50537C7.00712 3.61976 7.06431 3.76232 7.06431 3.93306V4.98183H12.967V3.91826C12.967 3.75245 13.0229 3.61359 13.1347 3.50167C13.2466 3.38988 13.3855 3.33398 13.5513 3.33398C13.7171 3.33398 13.8559 3.38988 13.9677 3.50167C14.0796 3.61359 14.1356 3.75245 14.1356 3.91826V4.98183H15.2142C15.6077 4.98183 15.9408 5.11816 16.2135 5.39082C16.4861 5.66349 16.6225 5.99659 16.6225 6.39013V15.259C16.6225 15.6526 16.4861 15.9857 16.2135 16.2583C15.9408 16.531 15.6077 16.6673 15.2142 16.6673H4.7872ZM4.7872 15.4988H15.2142C15.2741 15.4988 15.3291 15.4738 15.3789 15.4238C15.4289 15.3739 15.4539 15.319 15.4539 15.259V9.50626H4.54745V15.259C4.54745 15.319 4.57245 15.3739 4.62244 15.4238C4.67229 15.4738 4.72722 15.4988 4.7872 15.4988ZM4.54745 8.33771H15.4539V6.39013C15.4539 6.33014 15.4289 6.27522 15.3789 6.22536C15.3291 6.17537 15.2741 6.15038 15.2142 6.15038H4.7872C4.72722 6.15038 4.67229 6.17537 4.62244 6.22536C4.57245 6.27522 4.54745 6.33014 4.54745 6.39013V8.33771Z"
          fill="white"
        />
      </g>
    </svg>
  )
}

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
                <CmsButton size="medium" width={180} icon={<DirectUnavailableDateAddIcon />}>
                  진행 불가일 직접 추가
                </CmsButton>
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
