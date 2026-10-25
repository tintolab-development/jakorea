import {
  formatKoreanPhoneNumber,
  formatKoreanPhoneNumberPreservingMask,
} from '@jakorea/domain/shared/korean-phone'
import {
  PFFormControlCluster,
  PFFormControlSuffix,
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormInlineRow,
  PFFormInlineSegment,
  PFFormInlineSeparator,
  PFSelect,
  PFText,
  PFTextInput,
} from '@/shared/ui'
import styles from './apply-trained-teachers-basic-info.module.css'
import { normalizePortalEducationFormat } from './apply-trained-teachers-basic-info-answers'
import type {
  ApplyTrainedTeachersBasicInfoValues,
  PortalEducationFormat,
} from './apply-trained-teachers-basic-info-answers'

export {
  basicInfoAnswerFromValues,
  basicInfoValuesFromDraftAnswer,
  emptyTrainedTeachersBasicInfo,
  normalizePortalEducationFormat,
} from './apply-trained-teachers-basic-info-answers'
export type {
  ApplyTrainedTeachersBasicInfoValues,
  BasicInfoAnswerFromValuesOptions,
  PortalEducationFormat,
} from './apply-trained-teachers-basic-info-answers'

const APPLICATION_GRADE_OPTIONS = Array.from({ length: 6 }, (_, i) => ({
  value: String(i + 1),
  label: `${i + 1}학년`,
}))

const DEFAULT_MAX_CLASS_COUNT = 40

const EDUCATION_FORMAT_OPTIONS = [
  { value: 'online', label: '온라인' },
  { value: 'offline', label: '오프라인' },
  { value: 'hybrid', label: '온/오프라인' },
] as const satisfies ReadonlyArray<{ value: PortalEducationFormat; label: string }>

const EDUCATION_PLACE_OPTIONS = [
  { value: 'inside', label: '기관 안' },
  { value: 'outside', label: '기관 밖' },
  { value: 'custom', label: '기타(직접입력)' },
] as const

export type ApplyTrainedTeachersBasicInfoProfile = {
  schoolName?: string
  regionLabel?: string
  teacherName?: string
  teacherMobile?: string
  teacherEmail?: string
}

type ApplyTrainedTeachersBasicInfoProps = {
  value: ApplyTrainedTeachersBasicInfoValues
  onChange: (next: ApplyTrainedTeachersBasicInfoValues) => void
  /** 프로필 학교명 — 있으면 신청 기관명 잠금 */
  schoolNameLocked?: boolean
  /** 일반 기관 신청 — M·E-mail 로그인 회원 정보 고정 */
  teacherMobileEmailLocked?: boolean
  /** 프로그램 교육 형태가 참여자 선택일 때만 희망 교육 형태 노출 (CMS와 동일) */
  showPreferredEducationForm?: boolean
  /** educationFormat 서버 검증 실패 시 라디오 그룹 오류 상태 */
  educationFormatError?: boolean
  /** 교육받은 교사·1사1교만. 일반 기관 신청 폼에는 없음 */
  showEducationPlace?: boolean
  maxClassCount?: number
  profile?: ApplyTrainedTeachersBasicInfoProfile
  /** 자동입력(잠금·disabled) 칸 placeholder에 answers JSON 키 표시 */
  answerKeyPlaceholders?: boolean
}

function buildClassCountOptions(maxClassCount: number) {
  const cap = Math.min(Math.max(1, maxClassCount), DEFAULT_MAX_CLASS_COUNT)
  return Array.from({ length: cap }, (_, i) => {
    const n = String(i + 1)
    return { value: n, label: n }
  })
}

/** 강사 신청 `instructor-apply-form` RadioGroup과 동일 마크업 */
function RadioGroup({
  name,
  value,
  options,
  onChange,
  invalid = false,
}: {
  name: string
  value: string
  options: ReadonlyArray<{ value: string; label: string }>
  onChange: (next: string) => void
  invalid?: boolean
}) {
  return (
    <div
      className={styles.radioGroup}
      role="radiogroup"
      aria-label={name}
      aria-invalid={invalid || undefined}
    >
      {options.map(option => (
        <label key={option.value} className={styles.radioOption}>
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
          />
          <PFText
            as="span"
            typo="bd-md-rg"
            color={value === option.value ? 'primary-500' : 'black'}
          >
            {option.label}
          </PFText>
        </label>
      ))}
    </div>
  )
}

/**
 * 교육받은 교사 신청 — 기본 정보.
 * 강사 신청 페이지(`instructor-apply-form`)와 같은 `PFFormFieldTable` 표.
 */
export function ApplyTrainedTeachersBasicInfo({
  value,
  onChange,
  schoolNameLocked = false,
  teacherMobileEmailLocked = false,
  showPreferredEducationForm = false,
  educationFormatError = false,
  showEducationPlace = true,
  maxClassCount = DEFAULT_MAX_CLASS_COUNT,
  profile,
  answerKeyPlaceholders = false,
}: ApplyTrainedTeachersBasicInfoProps) {
  const patch = (partial: Partial<ApplyTrainedTeachersBasicInfoValues>) => {
    onChange({ ...value, ...partial })
  }

  const classCountOptions = buildClassCountOptions(maxClassCount)
  const schoolDisplay = value.schoolName || profile?.schoolName || ''
  const regionDisplay = value.regionLabel || profile?.regionLabel || ''
  const teacherNameDisplay = value.teacherName || profile?.teacherName || ''
  const teacherMobileDisplay =
    value.teacherMobile || profile?.teacherMobile || ''
  const teacherEmailDisplay = value.teacherEmail || profile?.teacherEmail || ''

  return (
    <PFFormFieldTable className={styles.root}>
      <PFFormFieldRow type="double">
        <PFFormField label="신청 기관명">
          <span data-field="schoolName">
            <PFTextInput
              variant="formPage"
              size="large"
              width="100%"
              placeholder={
                answerKeyPlaceholders && schoolNameLocked ? 'schoolName' : '로그인 교사의 소속 학교'
              }
              value={schoolDisplay}
              disabled={schoolNameLocked}
              onValueChange={next => patch({ schoolName: next })}
            />
          </span>
        </PFFormField>
        <PFFormField label="신청 학년">
          <PFSelect
            variant="formPage"
            size="large"
            width={200}
            placeholder="학년 선택"
            options={APPLICATION_GRADE_OPTIONS}
            value={value.applicationGrade || undefined}
            onValueChange={next => patch({ applicationGrade: next })}
          />
        </PFFormField>
      </PFFormFieldRow>

      <PFFormFieldRow type="double">
        <PFFormField label="기관 소재지">
          <PFTextInput
            variant="formPage"
            size="large"
            width="100%"
            placeholder={answerKeyPlaceholders ? 'regionLabel' : '기관 등록 주소'}
            value={regionDisplay}
            disabled
            onValueChange={() => {}}
          />
        </PFFormField>
        <PFFormField label="상세 주소">
          <PFTextInput
            variant="formPage"
            size="large"
            width="100%"
            placeholder="교구재 등 택배 발송을 위한 정확한 주소를 입력해 주세요"
            value={value.addressDetail}
            onValueChange={next => patch({ addressDetail: next })}
          />
        </PFFormField>
      </PFFormFieldRow>

      <PFFormFieldRow type={showPreferredEducationForm ? 'double' : 'single'}>
        <PFFormField label="신청 학급 수 및 총 인원" fullWidth={!showPreferredEducationForm}>
          <PFFormInlineRow>
            <PFFormInlineSegment>
              <PFFormControlCluster>
                <span data-field="classCount">
                  <PFSelect
                    variant="formPage"
                    size="large"
                    width={120}
                    placeholder="신청 학급"
                    options={classCountOptions}
                    value={value.classCount || undefined}
                    onValueChange={next => patch({ classCount: next })}
                  />
                </span>
                <PFFormControlSuffix>개 학급</PFFormControlSuffix>
              </PFFormControlCluster>
            </PFFormInlineSegment>
            <PFFormInlineSeparator />
            <PFFormInlineSegment>
              <PFFormControlCluster>
                <span data-field="studentCount">
                  <PFTextInput
                    variant="formPage"
                    size="large"
                    width={120}
                    inputMode="numeric"
                    placeholder="총 학생 수"
                    value={value.studentCount}
                    onValueChange={next => patch({ studentCount: next.replace(/[^\d]/g, '') })}
                  />
                </span>
                <PFFormControlSuffix>명</PFFormControlSuffix>
              </PFFormControlCluster>
            </PFFormInlineSegment>
          </PFFormInlineRow>
        </PFFormField>
        {showPreferredEducationForm ? (
          <PFFormField label="희망 교육 형태">
            <RadioGroup
              name="tt-education-format"
              value={value.educationFormat}
              options={EDUCATION_FORMAT_OPTIONS}
              invalid={educationFormatError}
              onChange={next => patch({ educationFormat: normalizePortalEducationFormat(next) })}
            />
            {educationFormatError ? (
              <PFText as="span" typo="bd-sm-rg" color="error" role="alert">
                희망 교육 형태를 다시 확인해 주세요.
              </PFText>
            ) : null}
          </PFFormField>
        ) : null}
      </PFFormFieldRow>

      {showEducationPlace ? (
        <PFFormFieldRow type="single">
          <PFFormField label="교육 장소">
            <PFFormInlineRow>
              <PFFormInlineSegment>
                <RadioGroup
                  name="tt-education-place"
                  value={value.educationPlace || 'inside'}
                  options={EDUCATION_PLACE_OPTIONS}
                  onChange={next => patch({ educationPlace: next })}
                />
              </PFFormInlineSegment>
              <PFFormInlineSeparator />
              <PFFormInlineSegment>
                <PFTextInput
                  variant="formPage"
                  size="large"
                  width={240}
                  placeholder="교육이 진행될 상세 장소를 입력해 주세요"
                  value={value.educationPlaceDetail}
                  onValueChange={next => patch({ educationPlaceDetail: next })}
                />
              </PFFormInlineSegment>
            </PFFormInlineRow>
          </PFFormField>
        </PFFormFieldRow>
      ) : null}

      <PFFormFieldRow type="single">
        <PFFormField label="담당 교사 정보">
          <PFFormInlineRow className={styles.teacherContactRow}>
            <PFFormInlineSegment className={styles.teacherContactSegment}>
              <PFFormControlCluster className={styles.teacherContactCluster}>
                <PFText
                  as="span"
                  typo="bd-md-rg"
                  color="neutral-cool-700"
                  className={styles.teacherContactLabel}
                >
                  담당 교사
                </PFText>
                <PFTextInput
                  variant="formPage"
                  size="large"
                  width={120}
                  placeholder={answerKeyPlaceholders ? 'teacherName' : '교사명'}
                  value={teacherNameDisplay}
                  disabled
                  onValueChange={() => {}}
                />
              </PFFormControlCluster>
            </PFFormInlineSegment>
            <PFFormInlineSeparator className={styles.teacherContactSeparator} />
            <PFFormInlineSegment className={styles.teacherContactSegment}>
              <PFFormControlCluster className={styles.teacherContactCluster}>
                <PFText
                  as="span"
                  typo="bd-md-rg"
                  color="neutral-cool-700"
                  className={styles.teacherContactLabel}
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
            <PFFormInlineSeparator className={styles.teacherContactSeparator} />
            <PFFormInlineSegment className={styles.teacherContactSegment}>
              <PFFormControlCluster className={styles.teacherContactCluster}>
                <PFText
                  as="span"
                  typo="bd-md-rg"
                  color="neutral-cool-700"
                  className={styles.teacherContactLabel}
                >
                  M
                </PFText>
                <PFTextInput
                  variant="formPage"
                  size="large"
                  width={240}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder={
                    answerKeyPlaceholders && teacherMobileEmailLocked
                      ? 'teacherMobile'
                      : '담당 교사의 휴대폰 번호'
                  }
                  value={formatKoreanPhoneNumberPreservingMask(teacherMobileDisplay)}
                  disabled={teacherMobileEmailLocked}
                  onValueChange={next =>
                    patch({ teacherMobile: formatKoreanPhoneNumber(next) })
                  }
                />
              </PFFormControlCluster>
            </PFFormInlineSegment>
            <PFFormInlineSeparator className={styles.teacherContactSeparator} />
            <PFFormInlineSegment className={styles.teacherContactSegment}>
              <PFFormControlCluster className={styles.teacherContactCluster}>
                <PFText
                  as="span"
                  typo="bd-md-rg"
                  color="neutral-cool-700"
                  className={styles.teacherContactLabel}
                >
                  E-mail
                </PFText>
                <PFTextInput
                  variant="formPage"
                  size="large"
                  width={240}
                  placeholder={
                    answerKeyPlaceholders && teacherMobileEmailLocked
                      ? 'teacherEmail'
                      : '담당 교사의 이메일'
                  }
                  value={teacherEmailDisplay}
                  disabled={teacherMobileEmailLocked}
                  onValueChange={next => patch({ teacherEmail: next })}
                />
              </PFFormControlCluster>
            </PFFormInlineSegment>
          </PFFormInlineRow>
        </PFFormField>
      </PFFormFieldRow>

      <PFFormFieldRow type="single">
        <PFFormField label="신청 사유">
          <PFTextInput
            variant="formPage"
            size="large"
            width="100%"
            placeholder="신청 사유를 입력해 주세요."
            value={value.applicationReason}
            onValueChange={next => patch({ applicationReason: next })}
          />
        </PFFormField>
      </PFFormFieldRow>

      <PFFormFieldRow type="single">
        <PFFormField label="기타 요청사항">
          <PFTextInput
            variant="formPage"
            size="large"
            width="100%"
            placeholder="기타 요청사항을 입력해 주세요."
            value={value.otherRequests}
            onValueChange={next => patch({ otherRequests: next })}
          />
        </PFFormField>
      </PFFormFieldRow>
    </PFFormFieldTable>
  )
}

export { findIncompleteTrainedTeachersBasicInfoMessage } from './apply-trained-teachers-basic-info-incomplete'
