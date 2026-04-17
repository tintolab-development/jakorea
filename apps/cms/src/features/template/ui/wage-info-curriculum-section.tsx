import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput, type CmsInputProps } from '@/shared/ui/cms-input'
import { CmsRadio } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'
import { INSTRUCTOR_FEE_GRADE_OPTIONS } from '@/data/mock/program-wage-info'

const paymentItemOptions = [
  { value: 'transport', label: '교통비' },
  { value: 'lodging', label: '숙박비' },
]

const deductionItemOptions = [
  { value: 'biz33', label: '사업소득 3.3%' },
  { value: 'other88', label: '기타 소득 8.8%' },
]

const wageBasisOptions = [
  { value: 'time', label: '시간' },
  { value: 'manual', label: '직접 입력' },
  { value: 'standard', label: '기준(당)' },
  { value: 'over', label: '초과' },
  { value: 'under', label: '이하' },
]

type WonSuffixInputProps = Pick<CmsInputProps, 'width'>

function WonSuffixInput({ width }: WonSuffixInputProps) {
  return (
    <div className="detail-info-form-inputs-wrapper">
      <CmsInput
        inputSize="medium"
        type="number"
        inputMode="numeric"
        placeholder="금액"
        min={0}
        width={width}
        style={{ flex: 1, minWidth: 0 }}
      />
      <span style={{ marginLeft: 6 }}>원</span>
    </div>
  )
}

export function WageInfoCurriculumSection() {
  return (
    <DetailInfoForm title="임금 정보" hideHeader mode="edit">
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="강사비 유형"
          edit={
            <CmsSelect
              inputSize="medium"
              width={'100%'}
              placeholder="선택"
              options={INSTRUCTOR_FEE_GRADE_OPTIONS}
            />
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="임금 책정 기준"
          edit={<CmsRadio.Group options={wageBasisOptions} />}
          view="-"
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="기본 강사비"
          edit={<WonSuffixInput width={'100%'} />}
          view="-"
        />
        <DetailInfoForm.Field
          label="장거리 강사비"
          edit={<WonSuffixInput width={'100%'} />}
          view="-"
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="지급 항목"
          edit={
            <CmsSelect
              inputSize="medium"
              mode="multiple"
              placeholder="선택 (복수)"
              options={paymentItemOptions}
              allowClear
            />
          }
          view="-"
        />
        <DetailInfoForm.Field
          label="공제 항목"
          edit={
            <CmsSelect
              inputSize="medium"
              mode="multiple"
              placeholder="선택 (복수)"
              options={deductionItemOptions}
              allowClear
            />
          }
          view="-"
        />
      </DetailInfoForm.Row>
    </DetailInfoForm>
  )
}
