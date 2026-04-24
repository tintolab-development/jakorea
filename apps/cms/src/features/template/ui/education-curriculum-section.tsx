import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsSelect } from '@/shared/ui/cms-select'
import './education-curriculum-section.css'

const educationTypeOptions = [
  { value: 'lecture', label: '강의형' },
  { value: 'activity', label: '체험·활동형' },
  { value: 'discussion', label: '토의·토론형' },
]

const ipsTypeOptions = [
  { value: 'type-a', label: 'IPS 유형 A' },
  { value: 'type-b', label: 'IPS 유형 B' },
]

function SessionBlock({ sessionIndex }: { sessionIndex: number }) {
  const n = sessionIndex + 1
  return (
    <DetailInfoForm.Row type="custom">
      <div className="education-curriculum-session">
        <DetailInfoForm.Row type="double">
          <DetailInfoForm.Field
            label={`${n}차시 강의 분량 및 내용`}
            edit={
              <div className="detail-info-form-inputs-wrapper-no-gap">
                <CmsSelect
                  width={'30%'}
                  inputSize="medium"
                  placeholder="교육 유형"
                  options={educationTypeOptions}
                />
                <DetailInfoForm.InputsSeparator />
                <CmsInput width={'30%'} placeholder="시간(분량)" inputSize="medium" />
                <DetailInfoForm.InputsSeparator />
                <CmsInput width={'30%'} placeholder="강의 설명 작성" inputSize="medium" />
              </div>
            }
            view="-"
          />
          <DetailInfoForm.Field
            label={`${n}차시 IPS 유형`}
            edit={
              <div className="detail-info-form-inputs-wrapper">
                <CmsSelect
                  inputSize="medium"
                  width={'48%'}
                  placeholder="IPS 유형"
                  options={ipsTypeOptions}
                />
                <CmsSelect
                  width={'48%'}
                  inputSize="medium"
                  placeholder="IPS 유형을 먼저 선택하세요"
                  disabled
                />
              </div>
            }
            view="-"
          />
        </DetailInfoForm.Row>
      </div>
    </DetailInfoForm.Row>
  )
}

export function EducationCurriculumSection() {
  return (
    <DetailInfoForm title="교육 커리큘럼" hideHeader mode="edit">
      {[0, 1, 2, 3].map(i => (
        <SessionBlock key={i} sessionIndex={i} />
      ))}
    </DetailInfoForm>
  )
}
