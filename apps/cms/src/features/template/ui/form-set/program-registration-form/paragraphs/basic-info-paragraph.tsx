import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import type { ProgramRegistrationParticipantState } from '@/features/template/ui/form-set/program-registration-form/paragraph-body'
import './program-registration-paragraph.css'

type ProgramRegistrationBasicInfoParagraphProps = {
  participant: ProgramRegistrationParticipantState
  onIndividualChange: (checked: boolean) => void
  onOrganizationChange: (checked: boolean) => void
}

export function ProgramRegistrationBasicInfoParagraph({
  participant,
  onIndividualChange,
  onOrganizationChange,
}: ProgramRegistrationBasicInfoParagraphProps) {
  return (
    <>
      <DetailInfoForm
        title="기본 정보"
        hideHeader
        mode="edit"
        className="program-registration-paragraph"
      >
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="대표 프로그램(국문)"
            edit={
              <CmsInput
                disabled
                inputSize="large"
                placeholder="대표 프로그램명을 입력하세요"
                width="100%"
              />
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="대표 프로그램(영문)"
            edit={
              <CmsInput
                disabled
                inputSize="large"
                placeholder="상세 프로그램명을 입력하세요"
                width="100%"
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="공공 프로그램명"
            edit={
              <CmsInput
                disabled
                inputSize="large"
                placeholder="모집 시 노출할 프로그램명을 입력하세요"
                width="100%"
              />
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="세부 프로그램명"
            edit={
              <CmsSelect
                disabled
                withAllOption={false}
                inputSize="medium"
                placeholder="상세 프로그램명을 선택하세요"
                width="100%"
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="사업 운영 기간"
            edit={
              <CmsInput
                disabled
                inputSize="large"
                placeholder="사업 운영 기간을 선택하세요"
                width="100%"
              />
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="프로그램 진행 현황"
            edit={
              <CmsInput
                disabled
                inputSize="large"
                value="일정에 따라 진행 현황이 자동으로 반영됩니다."
                width="100%"
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="참여자 유형"
            edit={
              <div className="program-registration-paragraph__inline">
                <CmsCheckbox
                  checkboxSize="large"
                  checked={participant.individual}
                  disabled={participant.organization}
                  onChange={e => onIndividualChange(e.target.checked)}
                >
                  개인
                </CmsCheckbox>
                <CmsCheckbox
                  checkboxSize="large"
                  checked={participant.organization}
                  disabled={participant.individual}
                  onChange={e => onOrganizationChange(e.target.checked)}
                >
                  학교/기관
                </CmsCheckbox>
                <CmsCheckbox checkboxSize="large">강사</CmsCheckbox>
                <CmsCheckbox checkboxSize="large">봉사자</CmsCheckbox>
              </div>
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="사업 분야"
            edit={
              <div className="program-registration-paragraph__inline">
                <CmsSelect
                  disabled
                  withAllOption={false}
                  inputSize="medium"
                  placeholder="전체"
                  width={160}
                />
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="후원사"
            edit={
              <CmsSelect
                disabled
                withAllOption={false}
                inputSize="medium"
                placeholder="전체"
                width={160}
              />
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="후원사 담당자"
            edit={
              <CmsSelect
                disabled
                withAllOption={false}
                inputSize="medium"
                placeholder="전체"
                width={160}
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="교육 장소"
            fullRow
            edit={
              <div className="program-registration-paragraph__inline">
                <CmsRadioGroup size="large" value="existing">
                  <CmsRadio value="existing">기존 값</CmsRadio>
                  <CmsRadio value="new" disabled>
                    기본 값
                  </CmsRadio>
                  <CmsRadio value="other" disabled>
                    기타(직접입력)
                  </CmsRadio>
                </CmsRadioGroup>
                <CmsInput
                  disabled
                  inputSize="medium"
                  placeholder="교육이 진행될 상세 장소를 입력해 주세요"
                  width={360}
                />
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="설문 진행 항목"
            fullRow
            edit={
              <div className="program-registration-paragraph__inline">
                <CmsCheckbox checkboxSize="large" checked={true} disabled>
                  설문조사
                </CmsCheckbox>
                <CmsCheckbox checkboxSize="large" checked={true} disabled>
                  만족도조사
                </CmsCheckbox>
                <CmsCheckbox checkboxSize="large" checked={true} disabled>
                  강의평가
                </CmsCheckbox>
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
      <DetailInfoForm title="기본 정보" hideHeader mode="edit">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="교육 과정"
            edit={
              <CmsSelect
                disabled
                withAllOption={false}
                inputSize="medium"
                placeholder="전체"
                width={220}
              />
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="IP Owned"
            edit={
              <CmsSelect
                disabled
                withAllOption={false}
                inputSize="medium"
                placeholder="전체"
                width={220}
              />
            }
            view="-"
          />
        </DetailInfoForm.Row>
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label="Course Delivered By"
            edit={
              <CmsSelect
                disabled
                withAllOption={false}
                inputSize="medium"
                placeholder="전체"
                width={220}
              />
            }
            view="-"
          />
          <DetailInfoForm.Field
            label="Partner Involvement"
            edit={
              <CmsRadioGroup size="large" value="yes">
                <CmsRadio value="yes">Yes</CmsRadio>
                <CmsRadio value="no">No</CmsRadio>
              </CmsRadioGroup>
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </DetailInfoForm>
    </>
  )
}
