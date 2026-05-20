/**
 * 강사 추가 모달 - 학력사항 섹션
 * Form.useFormInstance()로 부모 Form 컨텍스트 공유 (props 불필요)
 */

import { Form, Input, DatePicker } from 'antd'
import { NativeSelect } from './add-instructor-native-select'

/** 학력사항 섹션: 학교 유형 선택 옵션 */
const EDUCATION_SCHOOL_TYPE_OPTIONS = [
  { label: '고등학교', value: '고등학교' },
  { label: '중학교', value: '중학교' },
  { label: '대학 2・3년제', value: '대학 2・3년제' },
  { label: '대학 4년제', value: '대학 4년제' },
]

/** 중/고등학교 선택 시 전공 입력란 비노출 */
const SCHOOL_TYPES_WITHOUT_MAJOR = ['고등학교', '중학교']

const EDUCATION_STATUS_OPTIONS = [
  { label: '재학', value: 'enrolled' },
  { label: '졸업', value: 'graduated' },
]

export function EducationSection() {
  const form = Form.useFormInstance()
  const educationSchoolType = Form.useWatch(['educations', 0, 'schoolType'], form)
  const showMajorInput =
    !educationSchoolType || !SCHOOL_TYPES_WITHOUT_MAJOR.includes(educationSchoolType)
  const educationRowLabel = educationSchoolType || '학교'
  const educationSummaryText = educationSchoolType ?? '정보 없음'

  return (
    <section className="add-instructor-modal__section">
      <h3 className="add-instructor-modal__section-title">
        학력사항
        <span className="add-instructor-modal__required-asterisk" aria-hidden> *</span>
        <span className="add-instructor-modal__section-summary add-instructor-modal__section-summary--education">
          {educationSummaryText}
        </span>
      </h3>
      <Form.List name="educations">
        {(fields, { remove }) => (
          <>
            <div className="add-instructor-modal__education-table-wrap">
              <table className="add-instructor-modal__education-table add-instructor-modal__basic-table">
                <colgroup>
                  <col className="add-instructor-modal__education-table-col-label" />
                  <col className="add-instructor-modal__education-table-col-input" />
                </colgroup>
                <tbody>
                  {/* 1행: 최종 학력 * | 학교(220px) | 상태 */}
                  <tr>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--row-label">
                      <span className="add-instructor-modal__basic-table-label">최종 학력</span>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                      <div className="add-instructor-modal__basic-table-inline add-instructor-modal__education-first-row">
                        {fields.length > 0 ? (
                          <>
                            <Form.Item name={[fields[0].name, 'schoolType']} noStyle>
                              <NativeSelect
                                placeholder="학교"
                                options={EDUCATION_SCHOOL_TYPE_OPTIONS}
                                className="add-instructor-modal__table-input add-instructor-modal__education-school-type"
                              />
                            </Form.Item>
                            <span className="add-instructor-modal__education-divider" aria-hidden />
                            <Form.Item name={[fields[0].name, 'status']} noStyle>
                              <NativeSelect
                                placeholder="상태"
                                options={EDUCATION_STATUS_OPTIONS}
                                className="add-instructor-modal__table-input add-instructor-modal__education-status"
                              />
                            </Form.Item>
                          </>
                        ) : (
                          <>
                            <NativeSelect
                              placeholder="학교"
                              options={EDUCATION_SCHOOL_TYPE_OPTIONS}
                              className="add-instructor-modal__table-input add-instructor-modal__education-school-type"
                              disabled
                            />
                            <span className="add-instructor-modal__education-divider" aria-hidden />
                            <NativeSelect
                              placeholder="상태"
                              options={EDUCATION_STATUS_OPTIONS}
                              className="add-instructor-modal__table-input add-instructor-modal__education-status"
                              disabled
                            />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                  {/* 2행~: 선택한 최종 학력에 따라 라벨 표시, 중·고등학교 선택 시 전공 비노출 */}
                  {fields.map(field => (
                    <tr key={field.key}>
                      <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--row-label">
                        <span className="add-instructor-modal__basic-table-label">
                          {educationRowLabel}
                        </span>
                      </td>
                      <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                        <div className="add-instructor-modal__basic-table-inline add-instructor-modal__education-row-inputs">
                          <Form.Item name={[field.name, 'schoolName']} noStyle>
                            <Input
                              placeholder="학교명"
                              size="large"
                              allowClear
                              className="add-instructor-modal__table-input add-instructor-modal__education-school-input"
                            />
                          </Form.Item>
                          <span className="add-instructor-modal__education-divider" aria-hidden />
                          {showMajorInput && (
                            <Form.Item name={[field.name, 'major']} noStyle>
                              <Input
                                placeholder="전공"
                                size="large"
                                allowClear
                                className="add-instructor-modal__table-input add-instructor-modal__education-major"
                              />
                            </Form.Item>
                          )}
                          <span className="add-instructor-modal__education-divider" aria-hidden />
                          <Form.Item name={[field.name, 'enrollmentYear']} noStyle>
                            <DatePicker
                              picker="year"
                              placeholder="입학년도"
                              size="large"
                              className="add-instructor-modal__education-year"
                            />
                          </Form.Item>
                          <span className="add-instructor-modal__education-date-sep" aria-hidden>
                            ~
                          </span>
                          <Form.Item name={[field.name, 'graduationYear']} noStyle>
                            <DatePicker
                              picker="year"
                              placeholder="졸업년도"
                              size="large"
                              className="add-instructor-modal__education-year"
                            />
                          </Form.Item>
                          {fields.length > 1 ? (
                            <button
                              type="button"
                              className="add-instructor-modal__remove-row add-instructor-modal__remove-row--table"
                              onClick={() => remove(field.name)}
                              aria-label="삭제"
                            >
                              ×
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Form.List>
    </section>
  )
}
