/**
 * 강사 추가 모달 - 경력사항 섹션
 * - careerType: Form.useWatch로 Form 필드 값 구독 (외부 state 불필요)
 * - addCareerRef: Form.List 외부 버튼에서 항목 추가 트리거용 (add 함수가 Form.List 안에 있으므로 ref로 연결)
 * - Form.useFormInstance()로 부모 Form 컨텍스트 공유
 */

import { useRef } from 'react'
import { Form, Input, Checkbox, DatePicker } from 'antd'
import { AppButton } from '@/shared/ui/app-button'
import { NativeSelect } from './add-instructor-native-select'

/** 삭제용 X 아이콘 28×28 */
function CloseXIcon({ maskId }: { maskId: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      aria-hidden
    >
      <g opacity="0.6">
        <mask
          id={maskId}
          className="add-instructor-modal__close-x-mask"
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="28"
          height="28"
        >
          <rect width="28" height="28" fill="#D9D9D9" />
        </mask>
        <g mask={`url(#${maskId})`}>
          <path
            d="M13.9985 15.083L17.5837 18.6685C17.7453 18.8299 17.924 18.9076 18.12 18.9018C18.3159 18.8958 18.4983 18.8083 18.6675 18.6393C18.8365 18.4701 18.921 18.2895 18.921 18.0974C18.921 17.9053 18.8365 17.7246 18.6675 17.5555L15.082 13.9995L18.6675 10.4143C18.8289 10.2527 18.9115 10.0739 18.9154 9.87794C18.9191 9.68213 18.8365 9.49965 18.6675 9.33048C18.4983 9.16151 18.3177 9.07702 18.1256 9.07702C17.9335 9.07702 17.7528 9.16151 17.5837 9.33048L13.9985 12.9159L10.4133 9.33048C10.2518 9.16909 10.0778 9.08645 9.89154 9.08256C9.70546 9.07887 9.52784 9.16151 9.35867 9.33048C9.1897 9.49965 9.10521 9.68028 9.10521 9.8724C9.10521 10.0645 9.1897 10.2451 9.35867 10.4143L12.915 13.9995L9.3295 17.5846C9.16811 17.7462 9.09034 17.9202 9.09617 18.1064C9.1022 18.2925 9.1897 18.4701 9.35867 18.6393C9.52784 18.8083 9.70847 18.8928 9.90059 18.8928C10.0927 18.8928 10.2733 18.8083 10.4425 18.6393L13.9985 15.083ZM14.0005 24.6161C12.5453 24.6161 11.1724 24.3398 9.88192 23.7872C8.59139 23.2346 7.46186 22.4742 6.49334 21.5061C5.52481 20.538 4.76404 19.4089 4.21104 18.119C3.65824 16.829 3.38184 15.4565 3.38184 14.0015C3.38184 12.5269 3.65814 11.1491 4.21075 9.86831C4.76336 8.58751 5.52374 7.46284 6.49188 6.49431C7.46002 5.52578 8.58906 4.76502 9.879 4.21202C11.1689 3.65922 12.5414 3.38281 13.9965 3.38281C15.4711 3.38281 16.8489 3.65912 18.1297 4.21173C19.4105 4.76434 20.5351 5.52472 21.5037 6.49285C22.4722 7.46099 23.233 8.58517 23.786 9.8654C24.3388 11.1456 24.6152 12.523 24.6152 13.9974C24.6152 15.4527 24.3389 16.8255 23.7863 18.1161C23.2336 19.4066 22.4733 20.5361 21.5051 21.5046C20.537 22.4732 19.4128 23.2339 18.1326 23.7869C16.8524 24.3397 15.475 24.6161 14.0005 24.6161Z"
            fill="#3D3D3D"
          />
        </g>
      </g>
    </svg>
  )
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
          <AppButton
            htmlType="button"
            variant="primary"
            size="middle"
            modalTeal
            className="add-instructor-modal__add-btn"
            onClick={() => {
              addCareerRef.current?.({})
            }}
          >
            항목 추가
          </AppButton>
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
                      const careerRequired = true
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
                                rules={
                                  careerRequired
                                    ? [{ required: true }]
                                    : undefined
                                }
                                className="add-instructor-modal__career-input-wrap"
                              >
                                <Input
                                  placeholder="회사명"
                                  size="large"
                                  allowClear
                                  className="add-instructor-modal__table-input add-instructor-modal__career-input"
                                />
                              </Form.Item>
                              <span className="add-instructor-modal__career-divider" aria-hidden />
                              <Form.Item
                                name={[field.name, 'role']}
                                noStyle
                                rules={
                                  careerRequired
                                    ? [{ required: true }]
                                    : undefined
                                }
                                className="add-instructor-modal__career-input-wrap"
                              >
                                <Input
                                  placeholder="담당 업무"
                                  size="large"
                                  allowClear
                                  className="add-instructor-modal__table-input add-instructor-modal__career-input"
                                />
                              </Form.Item>
                              <span className="add-instructor-modal__career-divider" aria-hidden />
                              <Form.Item
                                name={[field.name, 'startDate']}
                                noStyle
                                rules={
                                  careerRequired
                                    ? [{ required: true }]
                                    : undefined
                                }
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
                                rules={
                                  careerRequired
                                    ? [{ required: true }]
                                    : undefined
                                }
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
                                <Checkbox>재직중</Checkbox>
                              </Form.Item>
                              {showDelete && (
                                <button
                                  type="button"
                                  className="add-instructor-modal__remove-row add-instructor-modal__remove-row--table add-instructor-modal__remove-row--icon"
                                  onClick={() => remove(field.name)}
                                  aria-label="삭제"
                                  title="삭제"
                                >
                                  <CloseXIcon maskId={`career-delete-mask-${field.key}`} />
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
