/**
 * 강사 추가 등록 — 학력사항
 * - 초기: 최종 학력 행만 노출
 * - 최종 학력 선택 후 학력 상세·하위 행 노출
 * - 최종 학력에 해당하는 상세 체크는 고정(체크·비활성)
 * - 최종 학력 상태가 재학이면 해당 학력의 졸업년도 비활성
 */

import { useEffect, useMemo } from 'react'
import { Form } from 'antd'
import type { Dayjs } from 'dayjs'
import {
  EDUCATION_DEGREE_OPTIONS,
  EDUCATION_DETAIL_OPTIONS as DOMAIN_EDUCATION_DETAIL_OPTIONS,
  EDUCATION_SCHOOL_TYPE_OPTIONS,
  EDUCATION_STATUS_OPTIONS,
  isEducationDetailKey,
  orderEducationDetailKeys,
  resolveAvailableEducationDetailKeys,
  type EducationDetailKey,
} from '@jakorea/domain/instructor/education-options'
import {
  INSTRUCTOR_FORM_PLACEHOLDERS,
  INSTRUCTOR_FORM_SECTION_DESCRIPTIONS,
} from '@jakorea/domain/instructor/form-copy'
import { CAREER_NET_UNIV_SCH1 } from '@jakorea/location/career-net'
import {
  CmsCheckbox,
  CmsCircleAddButton,
  CmsDatePicker,
  CmsInput,
  CmsSelect,
  SchoolSearch,
  UniversitySearch,
} from '@/shared/ui'
import { DetailInfoForm } from '@/shared/components/detail-info-form'
import { ItemDeleteButton } from '@/features/template/ui/shared/item-delete-button'
import './instructor-register-education-section.css'

const LABEL_WIDTH = 200 as const

const EDU_SCHOOL_TYPE_OPTIONS = EDUCATION_SCHOOL_TYPE_OPTIONS.map(option => ({
  label: option.label,
  value: option.value,
}))

const EDU_STATUS_OPTIONS = EDUCATION_STATUS_OPTIONS.map(option => ({
  label: option.label,
  value: option.value,
}))

const DEGREE_OPTIONS = EDUCATION_DEGREE_OPTIONS.map(option => ({
  label: option.label,
  value: option.value,
}))

export const EDUCATION_DETAIL_OPTIONS = DOMAIN_EDUCATION_DETAIL_OPTIONS.map(option => ({
  label: option.label,
  value: option.value,
})) as readonly { label: string; value: EducationDetailKey }[]

export type { EducationDetailKey }

export type EducationSchoolRow = {
  admitYear: Dayjs | null
  gradYear: Dayjs | null
  schoolName: string
  major: string
}

export type EducationGraduateRow = EducationSchoolRow & {
  degree: string
}

export const EMPTY_EDUCATION_SCHOOL_ROW: EducationSchoolRow = {
  admitYear: null,
  gradYear: null,
  schoolName: '',
  major: '',
}

export const EMPTY_EDUCATION_GRADUATE_ROW: EducationGraduateRow = {
  ...EMPTY_EDUCATION_SCHOOL_ROW,
  degree: '',
}

export { resolveAvailableEducationDetailKeys }

function YearRangeFields({
  admitName,
  gradName,
  gradDisabled = false,
}: {
  admitName: (string | number)[]
  gradName: (string | number)[]
  /** 최종 학력 재학 중 — 졸업년도 비활성 */
  gradDisabled?: boolean
}) {
  const form = Form.useFormInstance()
  const gradPathKey = gradName.join('.')

  useEffect(() => {
    if (!gradDisabled) return
    form.setFieldValue(gradName, null)
    // gradName은 렌더마다 새 배열일 수 있어 path key로 의존
    // eslint-disable-next-line react-hooks/exhaustive-deps -- path identity via gradPathKey
  }, [form, gradDisabled, gradPathKey])

  return (
    <div className="instructor-register-education__year-range">
      <Form.Item name={admitName} noStyle>
        <CmsDatePicker
          picker="year"
          inputSize="medium"
          placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.admitYear}
          format="YYYY"
          width={140}
        />
      </Form.Item>
      <span className="instructor-register-education__tilde" aria-hidden>
        ~
      </span>
      <Form.Item name={gradName} noStyle>
        <CmsDatePicker
          picker="year"
          inputSize="medium"
          placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.gradYear}
          format="YYYY"
          width={140}
          disabled={gradDisabled}
        />
      </Form.Item>
    </div>
  )
}

function SchoolNameField({
  name,
  width = 220,
}: {
  name: (string | number)[]
  width?: number | string
}) {
  const form = Form.useFormInstance()
  const value = (Form.useWatch(name, form) as string | undefined) ?? ''

  return (
    <Form.Item name={name} noStyle>
      <SchoolSearch
        value={value}
        onChange={next => form.setFieldValue(name, next)}
        placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.educationSchoolName}
        inputSize="medium"
        width={width}
        allowedSchoolLevels={['고등학교']}
      />
    </Form.Item>
  )
}

function UniversityNameField({
  name,
  width = 220,
  defaultSch1 = '',
}: {
  name: (string | number)[]
  width?: number | string
  defaultSch1?: string
}) {
  const form = Form.useFormInstance()
  const value = (Form.useWatch(name, form) as string | undefined) ?? ''

  return (
    <Form.Item name={name} noStyle>
      <UniversitySearch
        value={value}
        onChange={next => form.setFieldValue(name, next)}
        placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.universityName}
        inputSize="medium"
        width={width}
        defaultSch1={defaultSch1}
      />
    </Form.Item>
  )
}

export function InstructorRegisterEducationSection() {
  const form = Form.useFormInstance()
  const eduSchoolType = (Form.useWatch('eduSchoolType', form) as string | undefined) ?? ''
  const eduStatus = (Form.useWatch('eduStatus', form) as string | undefined) ?? ''
  const detailKeys =
    (Form.useWatch('educationDetailKeys', form) as EducationDetailKey[] | undefined) ?? []

  const availableDetailKeys = useMemo(
    () => resolveAvailableEducationDetailKeys(eduSchoolType),
    [eduSchoolType]
  )
  const hasFinalEducation = availableDetailKeys.length > 0
  const lockedDetailKey = isEducationDetailKey(eduSchoolType) ? eduSchoolType : null
  const finalEducationEnrolled = eduStatus === 'enrolled'

  const showHigh = detailKeys.includes('high')
  const showCollege23 = detailKeys.includes('college23')
  const showCollege4 = detailKeys.includes('college4')
  const showGraduate = detailKeys.includes('graduate')

  const detailCheckboxOptions = useMemo(
    () =>
      EDUCATION_DETAIL_OPTIONS.filter(option => availableDetailKeys.includes(option.value)).map(
        option => ({
          ...option,
          disabled: option.value === lockedDetailKey,
        })
      ),
    [availableDetailKeys, lockedDetailKey]
  )

  /** 최종 학력 변경 시: 하위 옵션만 유지 + 최종 학력 키 고정 체크 */
  useEffect(() => {
    if (!lockedDetailKey) {
      form.setFieldValue('educationDetailKeys', [])
      return
    }
    const current =
      (form.getFieldValue('educationDetailKeys') as EducationDetailKey[] | undefined) ?? []
    const available = new Set(availableDetailKeys)
    const next = orderEducationDetailKeys([
      lockedDetailKey,
      ...current.filter(key => available.has(key) && key !== lockedDetailKey),
    ]).filter(key => available.has(key))
    form.setFieldValue('educationDetailKeys', next)
  }, [availableDetailKeys, form, lockedDetailKey])

  /** 체크 시 Form.List가 비어 있으면 1행 보장 */
  useEffect(() => {
    if (showCollege23) {
      const rows = form.getFieldValue('college23Rows') as EducationSchoolRow[] | undefined
      if (!rows?.length) form.setFieldValue('college23Rows', [{ ...EMPTY_EDUCATION_SCHOOL_ROW }])
    }
    if (showCollege4) {
      const rows = form.getFieldValue('college4Rows') as EducationSchoolRow[] | undefined
      if (!rows?.length) form.setFieldValue('college4Rows', [{ ...EMPTY_EDUCATION_SCHOOL_ROW }])
    }
    if (showGraduate) {
      const rows = form.getFieldValue('graduateRows') as EducationGraduateRow[] | undefined
      if (!rows?.length) form.setFieldValue('graduateRows', [{ ...EMPTY_EDUCATION_GRADUATE_ROW }])
    }
  }, [form, showCollege23, showCollege4, showGraduate])

  return (
    <DetailInfoForm
      title="학력사항"
      mode="edit"
      description={INSTRUCTOR_FORM_SECTION_DESCRIPTIONS.education}
      className="instructor-register-education"
    >
      <DetailInfoForm.Row type="single">
        <DetailInfoForm.Field
          label="최종 학력"
          labelWidth={LABEL_WIDTH}
          fullRow
          view="-"
          edit={
            <div className="detail-info-form-inputs-wrapper-no-gap">
              <Form.Item name="eduSchoolType" noStyle>
                <CmsSelect
                  placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.eduSchoolType}
                  inputSize="medium"
                  width={160}
                  options={EDU_SCHOOL_TYPE_OPTIONS}
                  withAllOption={false}
                  allowClear
                />
              </Form.Item>
              <DetailInfoForm.InputsSeparator />
              <Form.Item name="eduStatus" noStyle>
                <CmsSelect
                  placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.eduStatus}
                  inputSize="medium"
                  width={120}
                  options={EDU_STATUS_OPTIONS}
                  withAllOption={false}
                  allowClear
                />
              </Form.Item>
            </div>
          }
        />
      </DetailInfoForm.Row>

      {hasFinalEducation ? (
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="학력 상세"
            labelWidth={LABEL_WIDTH}
            fullRow
            view="-"
            edit={
              <Form.Item
                name="educationDetailKeys"
                noStyle
                getValueFromEvent={(values: Array<string | number>) => {
                  if (!lockedDetailKey) return []
                  const available = new Set(availableDetailKeys)
                  const next = (values ?? [])
                    .map(String)
                    .filter(isEducationDetailKey)
                    .filter(key => available.has(key))
                  return orderEducationDetailKeys([
                    lockedDetailKey,
                    ...next.filter(key => key !== lockedDetailKey),
                  ])
                }}
              >
                <CmsCheckbox.Group checkboxSize="large" options={detailCheckboxOptions} />
              </Form.Item>
            }
          />
        </DetailInfoForm.Row>
      ) : null}

      {hasFinalEducation && showHigh ? (
        <DetailInfoForm.Row type="single">
          <DetailInfoForm.Field
            label="고등학교"
            labelWidth={LABEL_WIDTH}
            fullRow
            view="-"
            edit={
              <div className="detail-info-form-inputs-wrapper-no-gap instructor-register-education__row">
                <YearRangeFields
                  admitName={['highSchool', 'admitYear']}
                  gradName={['highSchool', 'gradYear']}
                  gradDisabled={finalEducationEnrolled && lockedDetailKey === 'high'}
                />
                <DetailInfoForm.InputsSeparator />
                <div className="instructor-register-education__school-grow">
                  <SchoolNameField name={['highSchool', 'schoolName']} width="100%" />
                </div>
              </div>
            }
          />
        </DetailInfoForm.Row>
      ) : null}

      {hasFinalEducation && showCollege23 ? (
        <DetailInfoForm.Row type="single" className="instructor-register-education__multi-row">
          <DetailInfoForm.Field
            label="대학교 2, 3년제"
            labelWidth={LABEL_WIDTH}
            fullRow
            view="-"
            edit={
              <div className="instructor-register-education__stack">
                <Form.List name="college23Rows">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map((field, index) => (
                        <div
                          key={field.key}
                          className="detail-info-form-inputs-wrapper-no-gap instructor-register-education__stack-row"
                        >
                          <YearRangeFields
                            admitName={[field.name, 'admitYear']}
                            gradName={[field.name, 'gradYear']}
                            gradDisabled={
                              finalEducationEnrolled && lockedDetailKey === 'college23'
                            }
                          />
                          <DetailInfoForm.InputsSeparator />
                          <div className="instructor-register-education__school-major">
                            <UniversityNameField
                              name={[field.name, 'schoolName']}
                              width={200}
                              defaultSch1={CAREER_NET_UNIV_SCH1.college}
                            />
                            <Form.Item name={[field.name, 'major']} noStyle>
                              <CmsInput placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.major} inputSize="medium" width={160} />
                            </Form.Item>
                            {index === 0 ? (
                              <CmsCircleAddButton
                                onClick={() => add({ ...EMPTY_EDUCATION_SCHOOL_ROW })}
                              />
                            ) : (
                              <ItemDeleteButton
                                className="item-delete-button"
                                aria-label="항목 삭제"
                                onClick={() => remove(field.name)}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </Form.List>
              </div>
            }
          />
        </DetailInfoForm.Row>
      ) : null}

      {hasFinalEducation && showCollege4 ? (
        <DetailInfoForm.Row type="single" className="instructor-register-education__multi-row">
          <DetailInfoForm.Field
            label="대학교 4년제"
            labelWidth={LABEL_WIDTH}
            fullRow
            view="-"
            edit={
              <div className="instructor-register-education__stack">
                <Form.List name="college4Rows">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map((field, index) => (
                        <div
                          key={field.key}
                          className="detail-info-form-inputs-wrapper-no-gap instructor-register-education__stack-row"
                        >
                          <YearRangeFields
                            admitName={[field.name, 'admitYear']}
                            gradName={[field.name, 'gradYear']}
                            gradDisabled={
                              finalEducationEnrolled && lockedDetailKey === 'college4'
                            }
                          />
                          <DetailInfoForm.InputsSeparator />
                          <div className="instructor-register-education__school-major">
                            <UniversityNameField
                              name={[field.name, 'schoolName']}
                              width={200}
                              defaultSch1={CAREER_NET_UNIV_SCH1.university4}
                            />
                            <Form.Item name={[field.name, 'major']} noStyle>
                              <CmsInput placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.major} inputSize="medium" width={160} />
                            </Form.Item>
                            {index === 0 ? (
                              <CmsCircleAddButton
                                onClick={() => add({ ...EMPTY_EDUCATION_SCHOOL_ROW })}
                              />
                            ) : (
                              <ItemDeleteButton
                                className="item-delete-button"
                                aria-label="항목 삭제"
                                onClick={() => remove(field.name)}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </Form.List>
              </div>
            }
          />
        </DetailInfoForm.Row>
      ) : null}

      {hasFinalEducation && showGraduate ? (
        <DetailInfoForm.Row type="single" className="instructor-register-education__multi-row">
          <DetailInfoForm.Field
            label="대학원"
            labelWidth={LABEL_WIDTH}
            fullRow
            view="-"
            edit={
              <div className="instructor-register-education__stack">
                <Form.List name="graduateRows">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map((field, index) => (
                        <div
                          key={field.key}
                          className="detail-info-form-inputs-wrapper-no-gap instructor-register-education__stack-row"
                        >
                          <div className="instructor-register-education__year-degree">
                            <YearRangeFields
                              admitName={[field.name, 'admitYear']}
                              gradName={[field.name, 'gradYear']}
                              gradDisabled={
                                finalEducationEnrolled && lockedDetailKey === 'graduate'
                              }
                            />
                            <Form.Item name={[field.name, 'degree']} noStyle>
                              <CmsSelect
                                placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.degree}
                                inputSize="medium"
                                width={120}
                                options={DEGREE_OPTIONS}
                                withAllOption={false}
                              />
                            </Form.Item>
                          </div>
                          <DetailInfoForm.InputsSeparator />
                          <div className="instructor-register-education__school-major">
                            <UniversityNameField name={[field.name, 'schoolName']} width={180} />
                            <Form.Item name={[field.name, 'major']} noStyle>
                              <CmsInput placeholder={INSTRUCTOR_FORM_PLACEHOLDERS.major} inputSize="medium" width={140} />
                            </Form.Item>
                            {index === 0 ? (
                              <CmsCircleAddButton
                                onClick={() => add({ ...EMPTY_EDUCATION_GRADUATE_ROW })}
                              />
                            ) : (
                              <ItemDeleteButton
                                className="item-delete-button"
                                aria-label="항목 삭제"
                                onClick={() => remove(field.name)}
                              />
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </Form.List>
              </div>
            }
          />
        </DetailInfoForm.Row>
      ) : null}
    </DetailInfoForm>
  )
}
