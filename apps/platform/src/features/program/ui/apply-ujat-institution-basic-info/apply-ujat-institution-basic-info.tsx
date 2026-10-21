import { formatKoreanPhoneNumber } from '@jakorea/domain/shared/korean-phone'
import {
  PFCheckbox,
  PFFormControlCluster,
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormInlineRow,
  PFFormInlineSegment,
  PFFormInlineSeparator,
  PFText,
  PFTextarea,
  PFTextInput,
} from '@/shared/ui'
import hostStyles from '../apply-form-field-host.module.css'
import teacherStyles from '../apply-trained-teachers-basic-info/apply-trained-teachers-basic-info.module.css'
import styles from './apply-ujat-institution-basic-info.module.css'

export type ApplyUjatInstitutionBasicInfoValues = {
  schoolName: string
  regionLabel: string
  addressDetail: string
  teacherName: string
  teacherTel: string
  teacherMobile: string
  teacherEmail: string
  otherRequestsNotApplicable: boolean
  otherRequests: string
}

export type ApplyUjatInstitutionBasicInfoProfile = {
  schoolName?: string
  regionLabel?: string
  teacherName?: string
  teacherMobile?: string
  teacherEmail?: string
}

type ApplyUjatInstitutionBasicInfoProps = {
  value: ApplyUjatInstitutionBasicInfoValues
  onChange: (next: ApplyUjatInstitutionBasicInfoValues) => void
  profile?: ApplyUjatInstitutionBasicInfoProfile
  schoolNameLocked?: boolean
}

export function emptyUjatInstitutionBasicInfo(): ApplyUjatInstitutionBasicInfoValues {
  return {
    schoolName: '',
    regionLabel: '',
    addressDetail: '',
    teacherName: '',
    teacherTel: '',
    teacherMobile: '',
    teacherEmail: '',
    otherRequestsNotApplicable: false,
    otherRequests: '',
  }
}

export function findIncompleteUjatInstitutionBasicInfoMessage(
  values: ApplyUjatInstitutionBasicInfoValues,
): string | null {
  if (!values.schoolName.trim()) return '신청 기관명을 확인해 주세요.'
  if (!values.addressDetail.trim()) return '상세 주소를 입력해 주세요.'
  if (!values.teacherName.trim()) return '담당 교사 이름을 확인해 주세요.'
  if (!values.teacherTel.trim()) return '담당 교사 내선 번호를 입력해 주세요.'
  if (!values.teacherMobile.trim()) return '담당 교사 휴대폰 번호를 확인해 주세요.'
  if (!values.teacherEmail.trim()) return '담당 교사 이메일을 확인해 주세요.'
  if (!values.otherRequestsNotApplicable && !values.otherRequests.trim()) {
    return '기타 요청사항을 입력하거나 해당 없음을 선택해 주세요.'
  }
  return null
}

export function ujatInstitutionBasicInfoAnswerFromValues(
  values: ApplyUjatInstitutionBasicInfoValues,
): Record<string, unknown> {
  return {
    schoolName: values.schoolName.trim(),
    regionLabel: values.regionLabel.trim(),
    addressDetail: values.addressDetail.trim(),
    teacherName: values.teacherName.trim(),
    teacherTel: formatKoreanPhoneNumber(values.teacherTel.trim()) || values.teacherTel.trim(),
    teacherMobile:
      formatKoreanPhoneNumber(values.teacherMobile.trim()) || values.teacherMobile.trim(),
    teacherEmail: values.teacherEmail.trim(),
    otherRequests: values.otherRequestsNotApplicable ? '' : values.otherRequests.trim(),
    otherRequestsNotApplicable: values.otherRequestsNotApplicable,
  }
}

function readString(row: Record<string, unknown>, ...keys: string[]): string {
  for (const key of keys) {
    const raw = row[key]
    if (typeof raw === 'string' && raw.trim()) return raw.trim()
  }
  return ''
}

export function ujatInstitutionBasicInfoValuesFromDraftAnswer(
  answer: unknown,
): ApplyUjatInstitutionBasicInfoValues | null {
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return null
  const row = answer as Record<string, unknown>
  const schoolName = readString(row, 'schoolName')
  if (
    !schoolName &&
    !readString(row, 'addressDetail', 'detailAddress') &&
    !readString(row, 'teacherName')
  ) {
    return null
  }
  return {
    schoolName,
    regionLabel: readString(row, 'regionLabel', 'organizationRegion'),
    addressDetail: readString(row, 'addressDetail', 'detailAddress'),
    teacherName: readString(row, 'teacherName'),
    teacherTel: readString(row, 'teacherTel'),
    teacherMobile: readString(row, 'teacherMobile'),
    teacherEmail: readString(row, 'teacherEmail'),
    otherRequestsNotApplicable: row.otherRequestsNotApplicable === true,
    otherRequests: readString(row, 'otherRequests'),
  }
}

export function fillUjatInstitutionBasicInfoFromProfile(
  values: ApplyUjatInstitutionBasicInfoValues,
  profile?: ApplyUjatInstitutionBasicInfoProfile,
): ApplyUjatInstitutionBasicInfoValues {
  return {
    ...values,
    schoolName: profile?.schoolName?.trim() || values.schoolName,
    regionLabel: profile?.regionLabel?.trim() || values.regionLabel,
    teacherName: profile?.teacherName?.trim() || values.teacherName,
    teacherMobile: profile?.teacherMobile?.trim() || values.teacherMobile,
    teacherEmail: profile?.teacherEmail?.trim() || values.teacherEmail,
  }
}

export function ApplyUjatInstitutionBasicInfo({
  value,
  onChange,
  profile,
  schoolNameLocked,
}: ApplyUjatInstitutionBasicInfoProps) {
  const patch = (partial: Partial<ApplyUjatInstitutionBasicInfoValues>) => {
    onChange({ ...value, ...partial })
  }
  const schoolDisplay = value.schoolName || profile?.schoolName || ''
  const regionDisplay = value.regionLabel || profile?.regionLabel || ''
  const teacherNameDisplay = value.teacherName || profile?.teacherName || ''
  const teacherMobileDisplay = value.teacherMobile || profile?.teacherMobile || ''
  const teacherEmailDisplay = value.teacherEmail || profile?.teacherEmail || ''

  return (
    <PFFormFieldTable className={[styles.root, hostStyles.root, teacherStyles.root].join(' ')}>
      <PFFormFieldRow type="single">
        <PFFormField label="신청 기관명">
          <PFTextInput
            variant="formPage"
            size="large"
            width="100%"
            value={schoolDisplay}
            disabled={schoolNameLocked}
            placeholder="로그인 교사의 소속 학교"
            onValueChange={next => patch({ schoolName: next })}
          />
        </PFFormField>
      </PFFormFieldRow>
      <PFFormFieldRow type="double">
        <PFFormField label="기관 소재지">
          <PFTextInput
            variant="formPage"
            size="large"
            width="100%"
            value={regionDisplay}
            disabled
            placeholder="기관 등록 주소"
            onValueChange={() => {}}
          />
        </PFFormField>
        <PFFormField label="상세 주소">
          <PFTextInput
            variant="formPage"
            size="large"
            width="100%"
            value={value.addressDetail}
            placeholder="교구재 등 택배 발송을 위한 정확한 주소를 입력해 주세요"
            onValueChange={next => patch({ addressDetail: next })}
          />
        </PFFormField>
      </PFFormFieldRow>
      <PFFormFieldRow type="single">
        <PFFormField label="담당 교사 정보">
          <PFFormInlineRow className={teacherStyles.teacherContactRow}>
            <PFFormInlineSegment className={teacherStyles.teacherContactSegment}>
              <PFFormControlCluster className={teacherStyles.teacherContactCluster}>
                <PFText
                  as="span"
                  typo="bd-md-rg"
                  color="neutral-cool-700"
                  className={teacherStyles.teacherContactLabel}
                >
                  담당 교사
                </PFText>
                <PFTextInput
                  variant="formPage"
                  size="large"
                  width={120}
                  placeholder="교사명"
                  value={teacherNameDisplay}
                  disabled
                  onValueChange={() => {}}
                />
              </PFFormControlCluster>
            </PFFormInlineSegment>
            <PFFormInlineSeparator className={teacherStyles.teacherContactSeparator} />
            <PFFormInlineSegment className={teacherStyles.teacherContactSegment}>
              <PFFormControlCluster className={teacherStyles.teacherContactCluster}>
                <PFText
                  as="span"
                  typo="bd-md-rg"
                  color="neutral-cool-700"
                  className={teacherStyles.teacherContactLabel}
                >
                  Tel
                </PFText>
                <PFTextInput
                  variant="formPage"
                  size="large"
                  width={240}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="담당 교사의 내선 번호(직통 번호)"
                  value={formatKoreanPhoneNumber(value.teacherTel)}
                  onValueChange={next => patch({ teacherTel: formatKoreanPhoneNumber(next) })}
                />
              </PFFormControlCluster>
            </PFFormInlineSegment>
            <PFFormInlineSeparator className={teacherStyles.teacherContactSeparator} />
            <PFFormInlineSegment className={teacherStyles.teacherContactSegment}>
              <PFFormControlCluster className={teacherStyles.teacherContactCluster}>
                <PFText
                  as="span"
                  typo="bd-md-rg"
                  color="neutral-cool-700"
                  className={teacherStyles.teacherContactLabel}
                >
                  M
                </PFText>
                <PFTextInput
                  variant="formPage"
                  size="large"
                  width={240}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="담당 교사의 휴대폰 번호"
                  value={formatKoreanPhoneNumber(teacherMobileDisplay)}
                  disabled
                  onValueChange={() => {}}
                />
              </PFFormControlCluster>
            </PFFormInlineSegment>
            <PFFormInlineSeparator className={teacherStyles.teacherContactSeparator} />
            <PFFormInlineSegment className={teacherStyles.teacherContactSegment}>
              <PFFormControlCluster className={teacherStyles.teacherContactCluster}>
                <PFText
                  as="span"
                  typo="bd-md-rg"
                  color="neutral-cool-700"
                  className={teacherStyles.teacherContactLabel}
                >
                  E-mail
                </PFText>
                <PFTextInput
                  variant="formPage"
                  size="large"
                  width={240}
                  inputMode="email"
                  autoComplete="email"
                  placeholder="담당 교사의 이메일"
                  value={teacherEmailDisplay}
                  disabled
                  onValueChange={() => {}}
                />
              </PFFormControlCluster>
            </PFFormInlineSegment>
          </PFFormInlineRow>
        </PFFormField>
      </PFFormFieldRow>
      <PFFormFieldRow type="single">
        <PFFormField label="기타 요청사항">
          <div className="detail-info-form-inputs-wrapper detail-info-form-inputs-wrapper-no-gap">
            <PFCheckbox
              checked={value.otherRequestsNotApplicable}
              onCheckedChange={checked =>
                patch({
                  otherRequestsNotApplicable: checked,
                  otherRequests: checked ? '' : value.otherRequests,
                })
              }
            >
              해당 없음
            </PFCheckbox>
            <PFFormInlineSeparator />
            <PFTextarea
              variant="formPage"
              width="100%"
              rows={1}
              disabled={value.otherRequestsNotApplicable}
              placeholder="기타 요청사항을 입력해 주세요."
              value={value.otherRequests}
              onValueChange={next => patch({ otherRequests: next })}
            />
          </div>
        </PFFormField>
      </PFFormFieldRow>
    </PFFormFieldTable>
  )
}
