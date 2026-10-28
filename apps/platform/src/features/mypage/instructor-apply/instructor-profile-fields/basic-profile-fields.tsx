import { BUSINESS_INCOME_OPTIONS } from '@jakorea/domain/instructor/business-income'
import { INSTRUCTOR_FORM_PLACEHOLDERS as PH } from '@jakorea/domain/instructor/form-copy'
import type { InstructorSharedProfileFormValues } from '@jakorea/domain/instructor/profile-form-values'
import { formatKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'
import {
  PFCheckbox,
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormHomeAddressFields,
  PFFormInlineSeparatedFields,
  PFTextInput,
} from '@/shared/ui'
import { TeacherAffiliationDisplay } from '../ui/teacher-affiliation-display'
import { InstructorProfileRadioGroup } from './radio-group'

export type InstructorBasicProfileFieldsProps = {
  values: InstructorSharedProfileFormValues
  onValuesChange: (next: InstructorSharedProfileFormValues) => void
}

function patchValues(
  values: InstructorSharedProfileFormValues,
  onValuesChange: (next: InstructorSharedProfileFormValues) => void,
  key: keyof InstructorSharedProfileFormValues,
  value: InstructorSharedProfileFormValues[typeof key],
) {
  onValuesChange({ ...values, [key]: value })
}

/** 강사 신청 등 PFForm 테이블 레이아웃용 — 회원정보 설정 수정은 `SettingsInstructorBasicFields` */
export function InstructorBasicProfileFields({
  values,
  onValuesChange,
}: InstructorBasicProfileFieldsProps) {
  const affiliationLocked = true
  const homeEditable = false

  const patch = <K extends keyof InstructorSharedProfileFormValues>(
    key: K,
    value: InstructorSharedProfileFormValues[K],
  ) => patchValues(values, onValuesChange, key, value)

  const handleEmploymentStatusChange = (
    next: InstructorSharedProfileFormValues['employmentStatus'],
  ) => {
    onValuesChange({ ...values, employmentStatus: next })
  }

  return (
    <PFFormFieldTable>
      <PFFormFieldRow type="double">
        <PFFormField label="성명">
          <PFTextInput
            variant="formPage"
            size="large"
            width="200px"
            placeholder={PH.name}
            disabled
            value={values.name}
            onValueChange={value => patch('name', value)}
          />
        </PFFormField>
        <PFFormField label="연락처">
          <PFTextInput
            variant="formPage"
            size="large"
            width="200px"
            placeholder={PH.contact}
            disabled
            value={formatKoreanPhoneNumber(values.contact)}
            onValueChange={value => patch('contact', value)}
          />
        </PFFormField>
      </PFFormFieldRow>
      <PFFormFieldRow type="double">
        <PFFormField label="생년월일">
          <PFTextInput
            variant="formPage"
            size="large"
            width="200px"
            placeholder={PH.birthDate}
            disabled
            value={values.birthDate}
            onValueChange={value => patch('birthDate', value)}
          />
        </PFFormField>
        <PFFormField label="이메일">
          <PFTextInput
            variant="formPage"
            size="large"
            width="200px"
            placeholder={PH.email}
            disabled
            value={values.email}
            onValueChange={value => patch('email', value)}
          />
        </PFFormField>
      </PFFormFieldRow>
      {values.memberType === 'school_teacher' ? (
        <PFFormFieldRow type="single">
          <PFFormField label="자택 주소">
            <PFFormHomeAddressFields
              roadValue={values.homeAddress}
              detailValue={values.homeAddressDetail}
              onRoadChange={value => patch('homeAddress', value)}
              onDetailChange={value => patch('homeAddressDetail', value)}
              roadPlaceholder={PH.homeAddress}
              detailPlaceholder={PH.homeAddressDetail}
              roadDisabled={!homeEditable}
              detailDisabled={!homeEditable}
            />
          </PFFormField>
        </PFFormFieldRow>
      ) : null}
      <PFFormFieldRow type="single">
        <PFFormField label="소속">
          {values.memberType === 'school_teacher' ? (
            <TeacherAffiliationDisplay
              schoolName={values.schoolName}
              employmentStatus={values.employmentStatus}
              onEmploymentStatusChange={handleEmploymentStatusChange}
            />
          ) : (
            <PFFormInlineSeparatedFields>
              <PFTextInput
                variant="formPage"
                size="large"
                width={200}
                placeholder={PH.affiliationName}
                disabled={affiliationLocked}
                value={values.affiliationName}
                onValueChange={value => patch('affiliationName', value)}
              />
              <PFCheckbox
                size="large"
                checked={values.affiliationNone}
                disabled={affiliationLocked}
                onCheckedChange={checked => {
                  onValuesChange({
                    ...values,
                    affiliationNone: checked,
                    affiliationName: checked ? '' : values.affiliationName,
                  })
                }}
              >
                소속 없음
              </PFCheckbox>
            </PFFormInlineSeparatedFields>
          )}
        </PFFormField>
      </PFFormFieldRow>
      {values.memberType === 'school_teacher' ? null : (
        <PFFormFieldRow type="single">
          <PFFormField label="자택 주소">
            <PFFormHomeAddressFields
              roadValue={values.homeAddress}
              detailValue={values.homeAddressDetail}
              onRoadChange={value => patch('homeAddress', value)}
              onDetailChange={value => patch('homeAddressDetail', value)}
              roadPlaceholder={PH.homeAddress}
              detailPlaceholder={PH.homeAddressDetail}
              roadDisabled={!homeEditable}
              detailDisabled={!homeEditable}
            />
          </PFFormField>
        </PFFormFieldRow>
      )}
      <PFFormFieldRow type="single">
        <PFFormField label="강사 경력">
          <PFTextInput
            variant="formPage"
            size="large"
            width="200px"
            placeholder={PH.instructorCareer}
            value={values.instructorCareer}
            onValueChange={value => patch('instructorCareer', value)}
          />
        </PFFormField>
      </PFFormFieldRow>
      <PFFormFieldRow type="single">
        <PFFormField label="정산 계좌 정보">
          <PFFormInlineSeparatedFields>
            <PFTextInput
              variant="formPage"
              size="large"
              width={120}
              placeholder={PH.bankName}
              value={values.bankName}
              onValueChange={value => patch('bankName', value)}
            />
            <PFTextInput
              variant="formPage"
              size="large"
              width={240}
              placeholder={PH.accountNumber}
              value={values.accountNumber}
              onValueChange={value => patch('accountNumber', value)}
            />
            <PFTextInput
              variant="formPage"
              size="large"
              width={240}
              placeholder={PH.accountHolder}
              value={values.accountHolder}
              onValueChange={value => patch('accountHolder', value)}
            />
          </PFFormInlineSeparatedFields>
        </PFFormField>
      </PFFormFieldRow>
      <PFFormFieldRow type="single">
        <PFFormField label="사업소득자 여부">
          <InstructorProfileRadioGroup
            name="isBusinessIncome"
            value={values.isBusinessIncome}
            options={BUSINESS_INCOME_OPTIONS}
            onChange={value => patch('isBusinessIncome', value)}
          />
        </PFFormField>
      </PFFormFieldRow>
      <PFFormFieldRow type="single">
        <PFFormField label="한 줄 소개">
          <PFTextInput
            variant="formPage"
            size="large"
            width="100%"
            placeholder={PH.oneLineIntro}
            value={values.oneLineIntro}
            onValueChange={value => patch('oneLineIntro', value)}
          />
        </PFFormField>
      </PFFormFieldRow>
    </PFFormFieldTable>
  )
}
