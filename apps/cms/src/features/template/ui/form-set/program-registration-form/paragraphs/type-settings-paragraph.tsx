import { DetailInfoForm } from '@/shared/components/detail-info-form'
import type { ProgramRegistrationType } from '@/features/template/ui/form-set/program-registration-form/paragraph-body'
import { CmsRadio, CmsRadioGroup } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import './program-registration-paragraph.css'

type ProgramRegistrationTypeSettingsParagraphProps = {
  programType: ProgramRegistrationType
}

export function ProgramRegistrationTypeSettingsParagraph({
  programType,
}: ProgramRegistrationTypeSettingsParagraphProps) {
  return (
    <DetailInfoForm title="프로그램 유형 설정" hideHeader mode="edit" className="program-registration-paragraph">
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="교육 진행 구조"
          edit={
            <CmsRadioGroup size="large" value={programType}>
              <CmsRadio value="curriculum">커리큘럼형</CmsRadio>
              <CmsRadio value="schedule" disabled>
                일정형
              </CmsRadio>
            </CmsRadioGroup>
          }
          view={programType === 'curriculum' ? '커리큘럼형' : '일정형'}
        />
        <DetailInfoForm.Field
          label="수업 회차 유형"
          edit={
            <CmsRadioGroup size="large" value="single">
              <CmsRadio value="single">단일 회차</CmsRadio>
              <CmsRadio value="multi">복수 차시</CmsRadio>
            </CmsRadioGroup>
          }
          view="-"
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="교육 형태"
          edit={
            <CmsRadioGroup size="large" value="online">
              <CmsRadio value="online">온라인</CmsRadio>
              <CmsRadio value="offline">오프라인</CmsRadio>
              <CmsRadio value="hybrid">온/오프라인</CmsRadio>
            </CmsRadioGroup>
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="참여 방식"
          edit={
            <CmsRadioGroup size="large" value="individual">
              <CmsRadio value="individual">개인</CmsRadio>
              <CmsRadio value="team">팀</CmsRadio>
            </CmsRadioGroup>
          }
          view="-"
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="IPS 유형"
          fullRow
          edit={
            <div className="program-registration-paragraph__inline">
              <CmsRadioGroup size="large" value="respect-schedule">
                <CmsRadio value="respect-schedule">일정 준용</CmsRadio>
                <CmsRadio value="create-schedule">일정 생성</CmsRadio>
              </CmsRadioGroup>
              <CmsSelect
                disabled
                inputSize="medium"
                withAllOption={false}
                placeholder="IPS 유형"
                width={120}
              />
              <CmsSelect
                disabled
                inputSize="medium"
                withAllOption={false}
                placeholder="IPS 유형을 먼저 선택하세요"
                width={220}
              />
            </div>
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
