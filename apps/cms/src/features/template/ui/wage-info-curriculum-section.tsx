import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { CmsInput } from '@/shared/ui/cms-input'
import { CmsRadio } from '@/shared/ui/cms-radio'
import { CmsSelect } from '@/shared/ui/cms-select'

const wageTypeOptions = [{ value: 'grade3', label: '3급 강사비' }]

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

function WonSuffixInput() {
  return (
    <div className="detail-info-form-inputs-wrapper" style={{ alignItems: 'center' }}>
      <CmsInput
        inputSize="medium"
        type="number"
        inputMode="numeric"
        placeholder="금액"
        min={0}
        style={{ flex: 1 }}
      />
      <span style={{ flexShrink: 0, paddingLeft: 8, color: 'var(--color-text-secondary, #666)' }}>원</span>
    </div>
  )
}

export function WageInfoCurriculumSection() {
  return (
    <DetailInfoForm title="임금 정보" hideHeader mode="edit">
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field
          label="강사비 유형"
          edit={<CmsSelect inputSize="medium" placeholder="선택" options={wageTypeOptions} />}
          view="-"
        />
        <DetailInfoForm.Field
          label="임금 책정 기준"
          edit={<CmsRadio.Group options={wageBasisOptions} />}
          view="-"
        />
      </DetailInfoForm.Row>
      <DetailInfoForm.Row type="double">
        <DetailInfoForm.Field label="기본 강사비" edit={<WonSuffixInput />} view="-" />
        <DetailInfoForm.Field label="장거리 강사비" edit={<WonSuffixInput />} view="-" />
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
