/**
 * 강사 추가 모달 - 경력사항 섹션
 * - careerType: Form.useWatch로 Form 필드 값 구독 (외부 state 불필요)
 * - addCareerRef: Form.List 외부 버튼에서 항목 추가 트리거용 (add 함수가 Form.List 안에 있으므로 ref로 연결)
 * - Form.useFormInstance()로 부모 Form 컨텍스트 공유
 */

import { useRef } from 'react'
import { Form, Input, Radio, Checkbox, DatePicker } from 'antd'
import { AppButton } from '@/shared/ui/app-button'

/** 삭제용 X 아이콘 24×24 */
function CloseXIcon({ maskId }: { maskId: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <mask
        id={maskId}
        className="add-instructor-modal__close-x-mask"
        maskUnits="userSpaceOnUse"
        x="0"
        y="0"
        width="24"
        height="24"
      >
        <rect width="24" height="24" fill="#D9D9D9" />
      </mask>
      <g mask={`url(#${maskId})`}>
        <path
          d="M12 13.0538L15.073 16.127C15.2115 16.2653 15.3856 16.3362 15.5953 16.3395C15.8048 16.3427 15.982 16.2718 16.127 16.127C16.2718 15.982 16.3443 15.8063 16.3443 15.6C16.3443 15.3937 16.2718 15.218 16.127 15.073L13.0538 12L16.127 8.927C16.2653 8.7885 16.3362 8.61442 16.3395 8.40475C16.3427 8.19525 16.2718 8.018 16.127 7.873C15.982 7.72817 15.8063 7.65575 15.6 7.65575C15.3937 7.65575 15.218 7.72817 15.073 7.873L12 10.9462L8.927 7.873C8.7885 7.73467 8.61442 7.66383 8.40475 7.6605C8.19525 7.65733 8.018 7.72817 7.873 7.873C7.72817 8.018 7.65575 8.19367 7.65575 8.4C7.65575 8.60633 7.72817 8.782 7.873 8.927L10.9462 12L7.873 15.073C7.73467 15.2115 7.66383 15.3856 7.6605 15.5953C7.65733 15.8048 7.72817 15.982 7.873 16.127C8.018 16.2718 8.19367 16.3443 8.4 16.3443C8.60633 16.3443 8.782 16.2718 8.927 16.127L12 13.0538ZM12.0017 21.5C10.6877 21.5 9.45267 21.2507 8.2965 20.752C7.14033 20.2533 6.13467 19.5766 5.2795 18.7218C4.42433 17.8669 3.74725 16.8617 3.24825 15.706C2.74942 14.5503 2.5 13.3156 2.5 12.0017C2.5 10.6877 2.74933 9.45267 3.248 8.2965C3.74667 7.14033 4.42342 6.13467 5.27825 5.2795C6.13308 4.42433 7.13833 3.74725 8.294 3.24825C9.44967 2.74942 10.6844 2.5 11.9983 2.5C13.3123 2.5 14.5473 2.74933 15.7035 3.248C16.8597 3.74667 17.8653 4.42342 18.7205 5.27825C19.5757 6.13308 20.2528 7.13833 20.7518 8.294C21.2506 9.44967 21.5 10.6844 21.5 11.9983C21.5 13.3123 21.2507 14.5473 20.752 15.7035C20.2533 16.8597 19.5766 17.8653 18.7218 18.7205C17.8669 19.5757 16.8617 20.2528 15.706 20.7518C14.5503 21.2506 13.3156 21.5 12.0017 21.5ZM12 20C14.2333 20 16.125 19.225 17.675 17.675C19.225 16.125 20 14.2333 20 12C20 9.76667 19.225 7.875 17.675 6.325C16.125 4.775 14.2333 4 12 4C9.76667 4 7.875 4.775 6.325 6.325C4.775 7.875 4 9.76667 4 12C4 14.2333 4.775 16.125 6.325 17.675C7.875 19.225 9.76667 20 12 20Z"
          fill="currentColor"
        />
      </g>
    </svg>
  )
}

export function CareerDetailSection() {
  const form = Form.useFormInstance()
  /** Form 필드 값을 구독해 신입/경력 전환 시 즉시 반영 (외부 local state 불필요) */
  const careerType = (Form.useWatch('careerType', form) ?? 'new') as 'new' | 'experienced'
  /** Form.List 외부 버튼에서 항목 추가 트리거 — ops.add는 Form.List 렌더 안에서만 접근 가능 */
  const addCareerRef = useRef<((defaultValue?: unknown) => void) | null>(null)

  return (
    <section className="add-instructor-modal__section">
      <div className="add-instructor-modal__section-head add-instructor-modal__section-head--with-btn">
        <h3 className="add-instructor-modal__section-title">경력사항</h3>
        {careerType === 'experienced' && (
          <AppButton
            htmlType="button"
            variant="primary"
            size="middle"
            modalTeal
            className="add-instructor-modal__add-btn"
            onClick={() => {
              addCareerRef.current?.({})
              form.setFieldValue('careerType', 'experienced')
            }}
          >
            항목 추가
          </AppButton>
        )}
      </div>
      <div className="add-instructor-modal__career-table-wrap">
        <table className="add-instructor-modal__career-table add-instructor-modal__basic-table">
          <colgroup>
            <col className="add-instructor-modal__career-table-col-label" />
            <col className="add-instructor-modal__career-table-col-input" />
          </colgroup>
          <tbody>
            {/* 1행: 경력 구분 | 신입/경력 라디오 (Form.List 밖 → add 시 리셋 방지) */}
            <tr>
              <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--row-label">
                <span className="add-instructor-modal__basic-table-label">경력 구분</span>
              </td>
              <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                <Form.Item name="careerType" noStyle initialValue="new">
                  <Radio.Group size="large">
                    <Radio value="new">신입</Radio>
                    <Radio value="experienced">경력</Radio>
                  </Radio.Group>
                </Form.Item>
              </td>
            </tr>
            {/* 2행~: Form.List는 경력 행만 렌더, add는 ref로 바깥 버튼에서 호출 */}
            <Form.List name="careers">
              {(fields, ops) => {
                addCareerRef.current = ops.add
                const { remove } = ops
                const isExperienced = careerType === 'experienced'
                if (!isExperienced) return null
                return (
                  <>
                    {fields.map((field, idx) => {
                      const isFirstItem = idx === 0
                      const showDelete = fields.length > 1 && !isFirstItem
                      const careerRequired = isExperienced
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
                                    ? [{ required: true, message: '회사명을 입력해주세요' }]
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
                              <Form.Item
                                name={[field.name, 'role']}
                                noStyle
                                rules={
                                  careerRequired
                                    ? [{ required: true, message: '담당 업무를 입력해주세요' }]
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
                              <Form.Item
                                name={[field.name, 'startDate']}
                                noStyle
                                rules={
                                  careerRequired
                                    ? [{ required: true, message: '입사연월을 선택해주세요' }]
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
                              <Form.Item
                                name={[field.name, 'endDate']}
                                noStyle
                                rules={
                                  careerRequired
                                    ? [{ required: true, message: '퇴사연월을 선택해주세요' }]
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
