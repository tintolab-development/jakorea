import {
  UJAT_PROGRAM_APPLICATION_VOLUNTEER_APPLICATION_TYPE_OPTIONS,
  UJAT_PROGRAM_APPLICATION_VOLUNTEER_GRADE_OPTIONS,
  UJAT_PROGRAM_APPLICATION_VOLUNTEER_ROUTE_OPTIONS,
  UJAT_PROGRAM_APPLICATION_VOLUNTEER_ROUTE_OTHER_VALUE,
  type UjatProgramApplicationVolunteerApplicationType,
} from '@jakorea/form-schema/paragraph-ids/ujat-program-application-form-volunteer-draft'
import { EducationSchoolNameField } from '@/features/mypage/instructor-apply/education-school-name-field'
import {
  PFFormField,
  PFFormFieldRow,
  PFFormFieldTable,
  PFFormInlineRow,
  PFFormInlineSegment,
  PFFormInlineSeparator,
  PFSelect,
  PFTextInput,
} from '@/shared/ui'
import hostStyles from '../apply-form-field-host.module.css'
import { ApplyFormRadioGroup } from '../apply-form-radio'
import styles from './apply-ujat-volunteer-basic-info.module.css'

/** CMS `ujatVolunteerApplication.*` overlay 와 같은 값 코드 */
export type ApplyUjatVolunteerBasicInfoValues = {
  universityName: string
  grade: string
  major: string
  applicationRoute: string
  applicationRouteOther: string
  applicationType: UjatProgramApplicationVolunteerApplicationType | ''
}

type ApplyUjatVolunteerBasicInfoProps = {
  value: ApplyUjatVolunteerBasicInfoValues
  onChange: (next: ApplyUjatVolunteerBasicInfoValues) => void
}

const GRADE_SELECT_OPTIONS = UJAT_PROGRAM_APPLICATION_VOLUNTEER_GRADE_OPTIONS.map(option => ({
  ...option,
}))
const ROUTE_SELECT_OPTIONS = UJAT_PROGRAM_APPLICATION_VOLUNTEER_ROUTE_OPTIONS.map(option => ({
  ...option,
}))

function labelOf(options: ReadonlyArray<{ value: string; label: string }>, value: string): string {
  return options.find(option => option.value === value)?.label ?? ''
}

export function emptyUjatVolunteerBasicInfo(): ApplyUjatVolunteerBasicInfoValues {
  return {
    universityName: '',
    grade: '',
    major: '',
    applicationRoute: '',
    applicationRouteOther: '',
    applicationType: '',
  }
}

export function findIncompleteUjatVolunteerBasicInfoMessage(
  values: ApplyUjatVolunteerBasicInfoValues,
): string | null {
  if (!values.universityName.trim()) return '대학교를 검색해 선택해 주세요.'
  if (!values.grade) return '학년을 선택해 주세요.'
  if (!values.major.trim()) return '대학 전공을 입력해 주세요.'
  if (!values.applicationRoute) return '지원 경로를 선택해 주세요.'
  if (
    values.applicationRoute === UJAT_PROGRAM_APPLICATION_VOLUNTEER_ROUTE_OTHER_VALUE &&
    !values.applicationRouteOther.trim()
  ) {
    return '기타 지원 경로를 입력해 주세요.'
  }
  if (!values.applicationType) return '지원 형태를 선택해 주세요.'
  return null
}

export function ujatVolunteerBasicInfoAnswerFromValues(
  values: ApplyUjatVolunteerBasicInfoValues,
): Record<string, unknown> {
  const isOtherRoute =
    values.applicationRoute === UJAT_PROGRAM_APPLICATION_VOLUNTEER_ROUTE_OTHER_VALUE
  return {
    universityName: values.universityName.trim(),
    grade: values.grade,
    gradeLabel: labelOf(UJAT_PROGRAM_APPLICATION_VOLUNTEER_GRADE_OPTIONS, values.grade),
    major: values.major.trim(),
    applicationRoute: values.applicationRoute,
    applicationRouteLabel: labelOf(
      UJAT_PROGRAM_APPLICATION_VOLUNTEER_ROUTE_OPTIONS,
      values.applicationRoute,
    ),
    applicationRouteOther: isOtherRoute ? values.applicationRouteOther.trim() : '',
    applicationType: values.applicationType,
  }
}

export function ujatVolunteerBasicInfoValuesFromDraftAnswer(
  answer: unknown,
): ApplyUjatVolunteerBasicInfoValues | null {
  if (!answer || typeof answer !== 'object' || Array.isArray(answer)) return null
  const row = answer as Record<string, unknown>
  const text = (key: string) => (typeof row[key] === 'string' ? (row[key] as string) : '')
  const universityName = text('universityName')
  if (!universityName && !text('major') && !text('grade')) return null
  return {
    universityName,
    grade: text('grade'),
    major: text('major'),
    applicationRoute: text('applicationRoute'),
    applicationRouteOther: text('applicationRouteOther'),
    applicationType: row.applicationType === 'ujat-graduate' ? 'ujat-graduate' : 'new',
  }
}

/** CMS `UjatProgramApplicationVolunteerBasicInfoParagraph` 2×2 격자 */
export function ApplyUjatVolunteerBasicInfo({ value, onChange }: ApplyUjatVolunteerBasicInfoProps) {
  const patch = (partial: Partial<ApplyUjatVolunteerBasicInfoValues>) => {
    onChange({ ...value, ...partial })
  }
  const isOtherRoute = value.applicationRoute === UJAT_PROGRAM_APPLICATION_VOLUNTEER_ROUTE_OTHER_VALUE

  return (
    <PFFormFieldTable className={[styles.root, hostStyles.root].join(' ')}>
      <PFFormFieldRow type="double">
        <PFFormField label="대학교 및 학년">
          <PFFormInlineRow>
            <PFFormInlineSegment>
              <EducationSchoolNameField
                detailKey="college4"
                value={value.universityName}
                modalTitle="대학교 검색"
                placeholder="학교명을 입력해 보세요"
                ariaLabel="대학교 검색"
                onChange={universityName => patch({ universityName })}
              />
            </PFFormInlineSegment>
            <PFFormInlineSeparator />
            <PFFormInlineSegment>
              <PFSelect
                variant="formPage"
                size="large"
                width={120}
                placeholder="학년 선택"
                options={GRADE_SELECT_OPTIONS}
                value={value.grade || undefined}
                onValueChange={next => patch({ grade: next })}
              />
            </PFFormInlineSegment>
          </PFFormInlineRow>
        </PFFormField>
        <PFFormField label="대학 전공">
          <PFTextInput
            variant="formPage"
            size="large"
            width="100%"
            placeholder="복수전공이나 부전공이 있을 경우, 함께 기재해 주세요"
            value={value.major}
            onValueChange={next => patch({ major: next })}
          />
        </PFFormField>
      </PFFormFieldRow>

      <PFFormFieldRow type="double">
        <PFFormField label="지원 경로">
          <PFFormInlineRow>
            <PFFormInlineSegment>
              <PFSelect
                variant="formPage"
                size="large"
                width={160}
                placeholder="지원 경로"
                options={ROUTE_SELECT_OPTIONS}
                value={value.applicationRoute || undefined}
                onValueChange={next => patch({ applicationRoute: next })}
              />
            </PFFormInlineSegment>
            <PFFormInlineSeparator />
            <PFFormInlineSegment className={styles.growSegment}>
              <PFTextInput
                variant="formPage"
                size="large"
                width="100%"
                placeholder="직접 입력"
                disabled={!isOtherRoute}
                value={value.applicationRouteOther}
                onValueChange={next => patch({ applicationRouteOther: next })}
              />
            </PFFormInlineSegment>
          </PFFormInlineRow>
        </PFFormField>
        <PFFormField label="지원 형태">
          <ApplyFormRadioGroup
            name="apply-ujat-volunteer-application-type"
            value={value.applicationType}
            options={UJAT_PROGRAM_APPLICATION_VOLUNTEER_APPLICATION_TYPE_OPTIONS}
            onChange={next =>
              patch({ applicationType: next as UjatProgramApplicationVolunteerApplicationType })
            }
          />
        </PFFormField>
      </PFFormFieldRow>
    </PFFormFieldTable>
  )
}
