/**
 * 강사 추가 모달 - 경력사항 섹션
 * - careerType: Form.useWatch로 Form 필드 값 구독 (외부 state 불필요)
 * - addCareerRef: Form.List 외부 버튼에서 항목 추가 트리거용 (add 함수가 Form.List 안에 있으므로 ref로 연결)
 * - Form.useFormInstance()로 부모 Form 컨텍스트 공유
 */

import cellAddOffUrl from '@/shared/assets/icons/buttons/cell-add-off.svg'
import { useRef } from 'react'
import { DatePicker, Form } from 'antd'
import { CmsCheckbox } from '@/shared/ui/cms-checkbox'
import { CmsButton, CmsInput } from '@/shared/ui'
import { NativeSelect } from './add-instructor-native-select'

/** 행 삭제 X — 시안 `Button / Etc / Cell Add` off 원본(28 프레임) */
function CloseXIcon() {
  return <img src={cellAddOffUrl} width={28} height={28} alt="" aria-hidden draggable={false} />
}

export function CareerDetailSection() {
  const form = Form.useFormInstance()
  const careers = (Form.useWatch('careers', form) ?? []) as Array<{
    startDate?: unknown
    endDate?: unknown
    isCurrent?: boolean
  }>
  const totalCareerYears = calculateTotalCareerYears(careers)
  /** Form.List 외부 버튼에서 항목 추가 트리거 — ops.add는 Form.List 렌더 안에서만 접근 가능 */
  const addCareerRef = useRef<((defaultValue?: unknown) => void) | null>(null)

  const CAREER_TYPE_SCHOOL_OPTIONS = [
    { label: '고등학교', value: 'high-school' },
    { label: '대학교', value: 'university' },
    { label: '대학원', value: 'graduate-school' },
  ]
  const CAREER_TYPE_STATUS_OPTIONS = [
    { label: '재학', value: 'enrolled' },
    { label: '졸업', value: 'graduated' },
    { label: '수료', value: 'completed' },
  ]

  return (
    <section className="add-instructor-modal__section">
      <div className="add-instructor-modal__section-head add-instructor-modal__section-head--with-btn">
        <h3 className="add-instructor-modal__section-title">
          경력사항
          <span className="add-instructor-modal__section-summary">총 경력 {totalCareerYears}년</span>
        </h3>
        <div className="add-instructor-modal__section-right">
          <CmsButton
            type="button"
            variant="primary"
            size="medium" className="add-instructor-modal__add-btn"
            onClick={() => {
              addCareerRef.current?.({})
            }} >
            항목 추가
          </CmsButton>
        </div>
      </div>
      <div className="add-instructor-modal__career-table-wrap">
        <table className="add-instructor-modal__career-table add-instructor-modal__basic-table">
          <colgroup>
            <col className="add-instructor-modal__career-table-col-label" />
            <col className="add-instructor-modal__career-table-col-input" />
          </colgroup>
          <tbody>
            {/* 1행: 경력 구분 | 학교/상태 셀렉터 */}
            <tr>
              <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--row-label">
                <span className="add-instructor-modal__basic-table-label">경력 구분</span>
              </td>
              <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                <div className="add-instructor-modal__career-type-row">
                  <Form.Item name="careerTypeSchool" noStyle>
                    <NativeSelect
                      placeholder="학교"
                      options={CAREER_TYPE_SCHOOL_OPTIONS}
                      className="add-instructor-modal__table-input add-instructor-modal__career-input"
                    />
                  </Form.Item>
                  <span className="add-instructor-modal__career-divider" aria-hidden />
                  <Form.Item name="careerTypeStatus" noStyle>
                    <NativeSelect
                      placeholder="상태"
                      options={CAREER_TYPE_STATUS_OPTIONS}
                      className="add-instructor-modal__table-input add-instructor-modal__career-input"
                    />
                  </Form.Item>
                </div>
              </td>
            </tr>
            {/* 2행~: Form.List는 경력 행만 렌더, add는 ref로 바깥 버튼에서 호출 */}
            <Form.List name="careers">
              {(fields, ops) => {
                addCareerRef.current = ops.add
                const { remove } = ops
                return (
                  <>
                    {fields.map((field, idx) => {
                      const isFirstItem = idx === 0
                      const showDelete = fields.length > 1 && !isFirstItem
                      return (
                        <tr key={field.key}>
                          <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--row-label">
                            <span className="add-instructor-modal__basic-table-label">
                              경력 {String(idx + 1).padStart(2, '0')}
                            </span>
                          </td>
                          <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                            <div className="add-instructor-modal__career-row-inputs">
                              <Form.Item
                                name={[field.name, 'companyName']}
                                noStyle
                                className="add-instructor-modal__career-input-wrap"
                              >
                                <CmsInput
                                  placeholder="회사명"
                                  inputSize="medium"
                                  width={190}
                                  className="add-instructor-modal__career-input"
                                />
                              </Form.Item>
                              <span className="add-instructor-modal__career-divider" aria-hidden />
                              <Form.Item
                                name={[field.name, 'role']}
                                noStyle
                                className="add-instructor-modal__career-input-wrap"
                              >
                                <CmsInput
                                  placeholder="담당 업무"
                                  inputSize="medium"
                                  width={190}
                                  className="add-instructor-modal__career-input"
                                />
                              </Form.Item>
                              <span className="add-instructor-modal__career-divider" aria-hidden />
                              <Form.Item
                                name={[field.name, 'startDate']}
                                noStyle
                                className="add-instructor-modal__career-input-wrap"
                              >
                                <DatePicker
                                  picker="month"
                                  placeholder="입사연월"
                                  size="large"
                                  className="add-instructor-modal__table-input add-instructor-modal__career-input"
                                />
                              </Form.Item>
                              <span className="add-instructor-modal__career-date-sep" aria-hidden>
                                ~
                              </span>
                              <Form.Item
                                name={[field.name, 'endDate']}
                                noStyle
                                className="add-instructor-modal__career-input-wrap"
                              >
                                <DatePicker
                                  picker="month"
                                  placeholder="퇴사연월"
                                  size="large"
                                  className="add-instructor-modal__table-input add-instructor-modal__career-input"
                                />
                              </Form.Item>
                              <Form.Item
                                name={[field.name, 'isCurrent']}
                                noStyle
                                valuePropName="checked"
                                className="add-instructor-modal__career-check-wrap"
                              >
                                <CmsCheckbox checkboxSize="medium">재직중</CmsCheckbox>
                              </Form.Item>
                              {showDelete && (
                                <button
                                  type="button"
                                  className="add-instructor-modal__remove-row add-instructor-modal__remove-row--table add-instructor-modal__remove-row--icon"
                                  onClick={() => remove(field.name)}
                                  aria-label="삭제"
                                  title="삭제"
                                >
                                  <CloseXIcon />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </>
                )
              }}
            </Form.List>
          </tbody>
        </table>
      </div>
    </section>
  )
}

function parseYearMonth(value: unknown): { year: number; month: number } | null {
  if (!value) return null
  if (typeof value === 'string') {
    const parts = value.split('.')
    if (parts.length !== 2) return null
    const year = Number(parts[0])
    const month = Number(parts[1])
    if (!Number.isFinite(year) || !Number.isFinite(month)) return null
    return { year, month }
  }
  const maybeDayjs = value as { format?: (format: string) => string }
  if (typeof maybeDayjs.format === 'function') {
    const formatted = maybeDayjs.format('YYYY.MM')
    const parts = formatted.split('.')
    if (parts.length !== 2) return null
    return { year: Number(parts[0]), month: Number(parts[1]) }
  }
  return null
}

function calculateTotalCareerYears(
  items: Array<{ startDate?: unknown; endDate?: unknown; isCurrent?: boolean }>
): number {
  if (!items.length) return 0
  const today = new Date()
  let totalMonths = 0

  for (const item of items) {
    const start = parseYearMonth(item.startDate)
    if (!start) continue

    const end = item.isCurrent
      ? { year: today.getFullYear(), month: today.getMonth() + 1 }
      : parseYearMonth(item.endDate)
    if (!end) continue

    totalMonths += (end.year - start.year) * 12 + (end.month - start.month)
  }

  return Math.max(0, Math.floor(totalMonths / 12))
}
