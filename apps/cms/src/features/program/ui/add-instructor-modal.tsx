/**
 * 강사진 추가 모달
 * 프로그램 진행 현황 > 강사 정보 탭에서 "강사 추가" 클릭 시 노출
 * TealHeaderModal 사용, 1400×830(바디) 스펙
 * 섹션: 기본 정보(프로필 사진 + 2열 필드), 최종 학력, 경력 상세, 자격 및 면허, 수상 및 수료 내역
 */

import { useEffect, useState } from 'react'
import { Form, Input, Radio, DatePicker, Upload } from 'antd'
import { CameraOutlined, SearchOutlined } from '@ant-design/icons'
import type { InputHTMLAttributes } from 'react'

/** 주소 검색용: 아이콘 + 네이티브 input 한 묶음 220×40, Form.Item value/onChange는 input에 전달 */
function AddressSearchInput(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="add-instructor-modal__table-input-wrap add-instructor-modal__table-input-wrap--with-prefix">
      <SearchOutlined className="add-instructor-modal__table-input-prefix" />
      <input className="add-instructor-modal__table-input" {...props} />
    </div>
  )
}
import type { UploadProps } from 'antd'
import { TealHeaderModal } from '@/shared/ui/teal-header-modal'
import { AppButton } from '@/shared/ui/app-button'
import type {
  ParticipatingInstructorRow,
  SettlementStatusKey,
} from '@/data/mock/participating-instructors'
import { INSTRUCTOR_SCHOOL_OPTIONS } from '@/data/mock/participating-instructors'
import { EducationSection } from './add-instructor-education-section'
import { CareerDetailSection } from './add-instructor-career-section'
import { NativeSelect } from './add-instructor-native-select'
import './add-instructor-modal.css'

/** 삭제용 X 아이콘 24×24 (자격·수상 섹션 삭제 버튼) */
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

const BANK_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: '국민은행', value: 'kb' },
  { label: '신한은행', value: 'shinhan' },
  { label: '우리은행', value: 'woori' },
  { label: '하나은행', value: 'hana' },
  { label: '농협은행', value: 'nh' },
  { label: '기업은행', value: 'ibk' },
  { label: '카카오뱅크', value: 'kakao' },
]

/** 병역사항 라디오: 미필 / 군필 / 해당없음 */
const MILITARY_RADIO_OPTIONS = [
  { label: '미필', value: 'not_completed' },
  { label: '군필', value: 'completed' },
  { label: '해당없음', value: 'exempted' },
]
export interface EducationItem {
  schoolType?: string
  status?: string
  schoolName?: string
  major?: string
  enrollmentYear?: string
  graduationYear?: string
}

export interface CareerItem {
  companyName?: string
  role?: string
  startDate?: string
  endDate?: string
  isCurrent?: boolean
}

export interface QualificationItem {
  name?: string
  year?: string
}

export interface AwardItem {
  name?: string
  year?: string
}

export interface JaKoreaActivityItem {
  programName?: string
  startDate?: string
  endDate?: string
  remarks?: string
}

export interface AddInstructorFormValues {
  /** 기본 정보 - 목록 행 매핑용 */
  nameKorean?: string
  nameEnglish?: string
  /** 주민등록번호 앞 6자리 / 뒤 7자리 */
  residentRegistrationFirst?: string
  residentRegistrationLast?: string
  contact?: string
  email?: string
  address?: string
  detailAddress?: string
  militaryStatus?: string
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  schoolName?: string
  /** 반복 항목 */
  educations?: EducationItem[]
  careerType?: 'new' | 'experienced'
  careers?: CareerItem[]
  jaKoreaExperiences?: JaKoreaActivityItem[]
  qualifications?: QualificationItem[]
  awards?: AwardItem[]
  /** 자유 작성 항목 1~4번 (3장 이내) */
  freeWriting1?: string
  freeWriting2?: string
  freeWriting3?: string
  freeWriting4?: string
}

interface AddInstructorModalProps {
  open: boolean
  onCancel: () => void
  onAdd: (values: AddInstructorFormValues) => void
}

const requiredMark = (labelNode: React.ReactNode, { required }: { required?: boolean }) =>
  required ? (
    <>
      {labelNode}
      <span className="add-instructor-modal__required-asterisk" aria-hidden>
        {' '}
        *
      </span>
    </>
  ) : (
    labelNode
  )

export function AddInstructorModal({ open, onCancel, onAdd }: AddInstructorModalProps) {
  const [form] = Form.useForm<AddInstructorFormValues>()
  const [profilePreviewUrl, setProfilePreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      form.resetFields()
      form.setFieldsValue({
        educations: [{}],
        careerType: 'new',
        careers: [{}],
        jaKoreaExperiences: [{}],
        qualifications: [{}],
        awards: [{}],
        freeWriting1: '',
        freeWriting2: '',
        freeWriting3: '',
        freeWriting4: '',
      })
      setProfilePreviewUrl(prev => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
  }, [open, form])

  useEffect(() => {
    return () => {
      setProfilePreviewUrl(prev => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
  }, [])

  const handleSubmit = (values: AddInstructorFormValues) => {
    onAdd(values)
    form.resetFields()
    setProfilePreviewUrl(prev => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    onCancel()
  }

  const handleCancel = () => {
    form.resetFields()
    setProfilePreviewUrl(prev => {
      if (prev) URL.revokeObjectURL(prev)
      return null
    })
    onCancel()
  }

  const profileUploadProps: UploadProps = {
    name: 'profile',
    listType: 'picture-card',
    showUploadList: false,
    accept: 'image/*',
    beforeUpload: file => {
      setProfilePreviewUrl(prev => {
        if (prev) URL.revokeObjectURL(prev)
        return URL.createObjectURL(file)
      })
      return false
    },
  }

  const footer = (
    <div className="add-instructor-modal__footer-actions">
      <AppButton variant="cancel" size="large" onClick={handleCancel}>
        닫기
      </AppButton>
      <AppButton
        htmlType="submit"
        variant="primary"
        size="large"
        modalTeal
        form="add-instructor-form"
      >
        저장
      </AppButton>
    </div>
  )

  return (
    <TealHeaderModal
      open={open}
      onCancel={handleCancel}
      title="강사진 등록"
      footer={footer}
      width={1400}
      size="large"
      className="teal-header-modal--instructor-add"
    >
      <Form
        id="add-instructor-form"
        form={form}
        layout="vertical"
        className="add-instructor-modal__form"
        onFinish={handleSubmit}
        requiredMark={requiredMark}
        initialValues={{
          nameKorean: '',
          nameEnglish: '',
          residentRegistrationFirst: '',
          residentRegistrationLast: '',
          contact: '',
          email: '',
          address: '',
          detailAddress: '',
          militaryStatus: 'not_completed',
          bankName: 'all',
          accountNumber: '',
          accountHolder: '',
          schoolName: undefined,
          educations: [{}],
          careerType: 'new',
          careers: [{}],
          qualifications: [{}],
          awards: [{}],
        }}
      >
        {/* 기본 정보: 1340×384, 프로필 192×256, 우측 테이블 */}
        <section className="add-instructor-modal__section add-instructor-modal__section--basic">
          <h3 className="add-instructor-modal__section-title">
            기본 정보
            <span className="add-instructor-modal__required-asterisk" aria-hidden>
              {' '}
              *
            </span>
          </h3>
          <div className="add-instructor-modal__basic-info">
            <div className="add-instructor-modal__profile-area">
              <Upload {...profileUploadProps}>
                {profilePreviewUrl ? (
                  <div className="add-instructor-modal__profile-preview-wrap">
                    <img
                      src={profilePreviewUrl}
                      alt="프로필 미리보기"
                      className="add-instructor-modal__profile-preview"
                    />
                  </div>
                ) : (
                  <div className="add-instructor-modal__profile-placeholder">
                    <CameraOutlined className="add-instructor-modal__profile-icon" />
                  </div>
                )}
              </Upload>
            </div>
            {/* 우측 테이블: 스크린샷 기준 — 좌(성명 한글/영문, 연락처, 주소, 정산 계좌) | 우(주민등록번호, 병역사항 라디오, 이메일, 상세 주소) */}
            <div className="add-instructor-modal__basic-table-wrap">
              <table className="add-instructor-modal__basic-table">
                <colgroup>
                  <col className="add-instructor-modal__basic-table-col-label-left" />
                  <col className="add-instructor-modal__basic-table-col-name-sub" />
                  <col className="add-instructor-modal__basic-table-col-input-left" />
                  <col className="add-instructor-modal__basic-table-col-label-right" />
                  <col className="add-instructor-modal__basic-table-col-input-right" />
                </colgroup>
                <tbody>
                  <tr>
                    <td
                      rowSpan={2}
                      className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--name"
                    >
                      <span className="add-instructor-modal__basic-table-label">성명</span>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--name-sub">
                      <span className="add-instructor-modal__basic-table-label">한글</span>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                      <Form.Item
                        name="nameKorean"
                        rules={[{ required: true, message: '한글 성명을 입력해주세요' }]}
                        noStyle
                      >
                        <input
                          className="add-instructor-modal__table-input"
                          placeholder="한글 성명"
                        />
                      </Form.Item>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--label-right">
                      <span className="add-instructor-modal__basic-table-label">주민등록번호</span>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                      <div className="add-instructor-modal__resident-registration-row">
                        <Form.Item
                          name="residentRegistrationFirst"
                          rules={[
                            { required: true, message: '주민등록 앞 6자리를 입력해주세요' },
                            { len: 6, message: '6자리를 입력해주세요' },
                          ]}
                          noStyle
                        >
                          <input
                            className="add-instructor-modal__table-input add-instructor-modal__resident-registration-input"
                            placeholder="주민등록 앞 6자리"
                            maxLength={6}
                          />
                        </Form.Item>
                        <span
                          className="add-instructor-modal__resident-registration-divider"
                          aria-hidden
                        >
                          -
                        </span>
                        <Form.Item
                          name="residentRegistrationLast"
                          rules={[
                            { required: true, message: '주민등록 뒤 7자리를 입력해주세요' },
                            { len: 7, message: '7자리를 입력해주세요' },
                          ]}
                          noStyle
                        >
                          <input
                            className="add-instructor-modal__table-input add-instructor-modal__resident-registration-input"
                            placeholder="주민등록 뒤 7자리"
                            maxLength={7}
                          />
                        </Form.Item>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--name-sub">
                      <span className="add-instructor-modal__basic-table-label">영문</span>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                      <Form.Item
                        name="nameEnglish"
                        rules={[{ required: true, message: '영문 성명을 입력해주세요' }]}
                        noStyle
                      >
                        <input
                          className="add-instructor-modal__table-input"
                          placeholder="영문 성명"
                        />
                      </Form.Item>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--label-right">
                      <span className="add-instructor-modal__basic-table-label">병역사항</span>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                      <Form.Item name="militaryStatus" rules={[{ required: true }]} noStyle>
                        <Radio.Group
                          options={MILITARY_RADIO_OPTIONS}
                          className="add-instructor-modal__military-radio-group"
                        />
                      </Form.Item>
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan={2}
                      className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--row-label"
                    >
                      <span className="add-instructor-modal__basic-table-label">연락처</span>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                      <Form.Item
                        name="contact"
                        rules={[{ required: true, message: '연락처를 입력해주세요' }]}
                        noStyle
                      >
                        <input className="add-instructor-modal__table-input" placeholder="연락처" />
                      </Form.Item>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--label-right">
                      <span className="add-instructor-modal__basic-table-label">이메일</span>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                      <Form.Item
                        name="email"
                        rules={[
                          { required: true, message: '이메일을 입력해주세요' },
                          { type: 'email', message: '올바른 이메일 형식이 아닙니다' },
                        ]}
                        noStyle
                      >
                        <input
                          type="email"
                          className="add-instructor-modal__table-input"
                          placeholder="이메일"
                        />
                      </Form.Item>
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan={2}
                      className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--row-label"
                    >
                      <span className="add-instructor-modal__basic-table-label">주소</span>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                      <Form.Item
                        name="address"
                        rules={[{ required: true, message: '주소를 입력해주세요' }]}
                        noStyle
                      >
                        <AddressSearchInput placeholder="건물명, 도로명 또는 지번" />
                      </Form.Item>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--label-right">
                      <span className="add-instructor-modal__basic-table-label">상세 주소</span>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                      <Form.Item name="detailAddress" noStyle>
                        <input
                          className="add-instructor-modal__table-input"
                          placeholder="상세 주소"
                        />
                      </Form.Item>
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan={2}
                      className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--row-label"
                    >
                      <span className="add-instructor-modal__basic-table-label">
                        정산 계좌 정보
                      </span>
                    </td>
                    <td
                      className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input"
                      colSpan={3}
                    >
                      <div className="add-instructor-modal__bank-account-row">
                        <Form.Item name="bankName" rules={[{ required: true }]} noStyle>
                          <NativeSelect
                            placeholder="은행명"
                            options={BANK_OPTIONS}
                            className="add-instructor-modal__table-input add-instructor-modal__bank-account-select"
                          />
                        </Form.Item>
                        <Form.Item name="accountNumber" rules={[{ required: true }]} noStyle>
                          <input
                            className="add-instructor-modal__table-input add-instructor-modal__bank-account-input--number"
                            placeholder="계좌번호"
                          />
                        </Form.Item>
                        <div className="add-instructor-modal__bank-account-divider" aria-hidden />
                        <Form.Item name="accountHolder" rules={[{ required: true }]} noStyle>
                          <input
                            className="add-instructor-modal__table-input add-instructor-modal__bank-account-input--holder"
                            placeholder="예금주명"
                          />
                        </Form.Item>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <EducationSection />

        {/* 경력사항: careerType은 Form.useWatch로 구독, 항목 추가 버튼은 CareerDetailSection 내부에서 관리 */}
        <CareerDetailSection />

        {/* JA Korea 활동 경험: 자격 및 면허와 동일한 UI, 프로그램명·활동시작일·활동종료일·비고 */}
        <section className="add-instructor-modal__section">
          <Form.List name="jaKoreaExperiences">
            {(fields, { add, remove }) => (
              <>
                <div className="add-instructor-modal__section-head add-instructor-modal__section-head--with-btn">
                  <h3 className="add-instructor-modal__section-title">JA Korea 활동 경험</h3>
                  <AppButton
                    htmlType="button"
                    variant="primary"
                    size="middle"
                    modalTeal
                    className="add-instructor-modal__add-btn"
                    onClick={() => add({})}
                  >
                    항목 추가
                  </AppButton>
                </div>
                <div className="add-instructor-modal__ja-activity-table-wrap">
                  <table className="add-instructor-modal__ja-activity-table add-instructor-modal__basic-table">
                    <colgroup>
                      <col className="add-instructor-modal__ja-activity-table-col-label" />
                      <col className="add-instructor-modal__ja-activity-table-col-input" />
                    </colgroup>
                    <tbody>
                      {fields.map((field, idx) => {
                        const showDelete = fields.length > 1 && idx > 0
                        return (
                          <tr key={field.key}>
                            <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--row-label">
                              <span className="add-instructor-modal__basic-table-label">
                                활동 {String(idx + 1).padStart(2, '0')}
                              </span>
                            </td>
                            <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                              <div className="add-instructor-modal__ja-activity-row-inputs">
                                <Form.Item
                                  name={[field.name, 'programName']}
                                  noStyle
                                  className="add-instructor-modal__ja-activity-input-wrap"
                                >
                                  <Input
                                    placeholder="프로그램명"
                                    size="large"
                                    allowClear
                                    className="add-instructor-modal__table-input add-instructor-modal__ja-activity-input"
                                  />
                                </Form.Item>
                                <div
                                  className="add-instructor-modal__ja-activity-divider"
                                  aria-hidden
                                />
                                <Form.Item
                                  name={[field.name, 'startDate']}
                                  noStyle
                                  className="add-instructor-modal__ja-activity-input-wrap"
                                >
                                  <DatePicker
                                    placeholder="활동시작일"
                                    size="large"
                                    className="add-instructor-modal__table-input add-instructor-modal__ja-activity-input"
                                  />
                                </Form.Item>
                                <span
                                  className="add-instructor-modal__ja-activity-date-sep"
                                  aria-hidden
                                >
                                  -
                                </span>
                                <Form.Item
                                  name={[field.name, 'endDate']}
                                  noStyle
                                  className="add-instructor-modal__ja-activity-input-wrap"
                                >
                                  <DatePicker
                                    placeholder="활동종료일"
                                    size="large"
                                    className="add-instructor-modal__table-input add-instructor-modal__ja-activity-input"
                                  />
                                </Form.Item>
                                <div
                                  className="add-instructor-modal__ja-activity-divider"
                                  aria-hidden
                                />
                                <Form.Item
                                  name={[field.name, 'remarks']}
                                  noStyle
                                  className="add-instructor-modal__ja-activity-input-wrap"
                                >
                                  <Input
                                    placeholder="비고"
                                    size="large"
                                    allowClear
                                    className="add-instructor-modal__table-input add-instructor-modal__ja-activity-input"
                                  />
                                </Form.Item>
                                {showDelete && (
                                  <button
                                    type="button"
                                    className="add-instructor-modal__remove-row add-instructor-modal__remove-row--table add-instructor-modal__remove-row--icon"
                                    onClick={() => remove(field.name)}
                                    aria-label="삭제"
                                    title="삭제"
                                  >
                                    <CloseXIcon maskId={`ja-activity-delete-mask-${field.key}`} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Form.List>
        </section>

        {/* 자격 및 면허: 경력사항과 동일한 행목 테이블 스타일, 타이틀·항목 추가 버튼 같은 레벨 */}
        <section className="add-instructor-modal__section">
          <Form.List name="qualifications">
            {(fields, { add, remove }) => (
              <>
                <div className="add-instructor-modal__section-head add-instructor-modal__section-head--with-btn">
                  <h3 className="add-instructor-modal__section-title">자격 및 면허</h3>
                  <AppButton
                    htmlType="button"
                    variant="primary"
                    size="middle"
                    modalTeal
                    className="add-instructor-modal__add-btn"
                    onClick={() => add({})}
                  >
                    항목 추가
                  </AppButton>
                </div>
                <div className="add-instructor-modal__qualification-table-wrap">
                  <table className="add-instructor-modal__qualification-table add-instructor-modal__basic-table">
                    <colgroup>
                      <col className="add-instructor-modal__qualification-table-col-label" />
                      <col className="add-instructor-modal__qualification-table-col-input" />
                    </colgroup>
                    <tbody>
                      {fields.map((field, idx) => {
                        const showDelete = fields.length > 1 && idx > 0
                        return (
                          <tr key={field.key}>
                            <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--row-label">
                              <span className="add-instructor-modal__basic-table-label">
                                자격 및 면허 {String(idx + 1).padStart(2, '0')}
                              </span>
                            </td>
                            <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                              <div className="add-instructor-modal__qualification-row-inputs">
                                <Form.Item
                                  name={[field.name, 'name']}
                                  noStyle
                                  className="add-instructor-modal__qualification-input-wrap"
                                >
                                  <Input
                                    placeholder="자격증/면허"
                                    size="large"
                                    allowClear
                                    className="add-instructor-modal__table-input add-instructor-modal__qualification-input"
                                  />
                                </Form.Item>
                                <div
                                  className="add-instructor-modal__qualification-divider"
                                  aria-hidden
                                />
                                <Form.Item
                                  name={[field.name, 'year']}
                                  noStyle
                                  className="add-instructor-modal__qualification-input-wrap"
                                >
                                  <DatePicker
                                    picker="year"
                                    placeholder="취득연도"
                                    size="large"
                                    className="add-instructor-modal__table-input add-instructor-modal__qualification-input"
                                  />
                                </Form.Item>
                                {showDelete && (
                                  <button
                                    type="button"
                                    className="add-instructor-modal__remove-row add-instructor-modal__remove-row--table add-instructor-modal__remove-row--icon"
                                    onClick={() => remove(field.name)}
                                    aria-label="삭제"
                                    title="삭제"
                                  >
                                    <CloseXIcon maskId={`qualification-delete-mask-${field.key}`} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Form.List>
        </section>

        {/* 수상 및 수료 내역: 자격 및 면허와 동일한 행목 테이블, 타이틀·항목 추가 같은 레벨, 인풋 220×40, 2개 이상 시 삭제 아이콘 맨 끝 */}
        <section className="add-instructor-modal__section">
          <Form.List name="awards">
            {(fields, { add, remove }) => (
              <>
                <div className="add-instructor-modal__section-head add-instructor-modal__section-head--with-btn">
                  <h3 className="add-instructor-modal__section-title">수상 및 수료 내역</h3>
                  <AppButton
                    htmlType="button"
                    variant="primary"
                    size="middle"
                    modalTeal
                    className="add-instructor-modal__add-btn"
                    onClick={() => add({})}
                  >
                    항목 추가
                  </AppButton>
                </div>
                <div className="add-instructor-modal__award-table-wrap">
                  <table className="add-instructor-modal__award-table add-instructor-modal__basic-table">
                    <colgroup>
                      <col className="add-instructor-modal__award-table-col-label" />
                      <col className="add-instructor-modal__award-table-col-input" />
                    </colgroup>
                    <tbody>
                      {fields.map((field, idx) => {
                        const showDelete = fields.length > 1 && idx > 0
                        return (
                          <tr key={field.key}>
                            <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--row-label">
                              <span className="add-instructor-modal__basic-table-label">
                                수상 및 수료 {String(idx + 1).padStart(2, '0')}
                              </span>
                            </td>
                            <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                              <div className="add-instructor-modal__award-row-inputs">
                                <Form.Item
                                  name={[field.name, 'name']}
                                  noStyle
                                  className="add-instructor-modal__award-input-wrap"
                                >
                                  <Input
                                    placeholder="수상/수료"
                                    size="large"
                                    allowClear
                                    className="add-instructor-modal__table-input add-instructor-modal__award-input"
                                  />
                                </Form.Item>
                                <div className="add-instructor-modal__award-divider" aria-hidden />
                                <Form.Item
                                  name={[field.name, 'year']}
                                  noStyle
                                  className="add-instructor-modal__award-input-wrap"
                                >
                                  <DatePicker
                                    picker="year"
                                    placeholder="수상/수료연도"
                                    size="large"
                                    className="add-instructor-modal__table-input add-instructor-modal__award-input"
                                  />
                                </Form.Item>
                                {showDelete && (
                                  <button
                                    type="button"
                                    className="add-instructor-modal__remove-row add-instructor-modal__remove-row--table add-instructor-modal__remove-row--icon"
                                    onClick={() => remove(field.name)}
                                    aria-label="삭제"
                                    title="삭제"
                                  >
                                    <CloseXIcon maskId={`award-delete-mask-${field.key}`} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </Form.List>
        </section>

        {/* 자유 작성 항목: 1~4번 문항 3장 이내, 타이틀·설명 row 정렬 */}
        <section className="add-instructor-modal__section add-instructor-modal__section--free-writing">
          <div className="add-instructor-modal__free-writing-head">
            <h3 className="add-instructor-modal__section-title add-instructor-modal__free-writing-title">자유 작성 항목</h3>
            <p className="add-instructor-modal__free-writing-description">
              1~4번 문항은 3장 이내 분량으로 작성, 내용과 형식은 자유롭게 기재 가능합니다.
            </p>
          </div>
          <div className="add-instructor-modal__free-writing-list">
            <div className="add-instructor-modal__free-writing-item">
              <div className="add-instructor-modal__free-writing-question-bar">
                1. 자기소개 및 지원동기
              </div>
              <Form.Item name="freeWriting1" noStyle>
                <Input.TextArea
                  placeholder="자유롭게 작성해주세요"
                  rows={5}
                  className="add-instructor-modal__free-writing-textarea"
                />
              </Form.Item>
            </div>
            <div className="add-instructor-modal__free-writing-item">
              <div className="add-instructor-modal__free-writing-question-bar">
                2. 청소년 경제 교육의 중요성에 대해 본인의 생각을 구체적으로 작성해주세요.
              </div>
              <Form.Item name="freeWriting2" noStyle>
                <Input.TextArea
                  placeholder="자유롭게 작성해주세요"
                  rows={5}
                  className="add-instructor-modal__free-writing-textarea"
                />
              </Form.Item>
            </div>
            <div className="add-instructor-modal__free-writing-item">
              <div className="add-instructor-modal__free-writing-question-bar">
                3. 청소년과 소통할 때 가장 중요하다고 생각하는 점은 무엇이며, 이를 실천하기 위해 어떤 노력을 하는지 작성해주세요.
              </div>
              <Form.Item name="freeWriting3" noStyle>
                <Input.TextArea
                  placeholder="자유롭게 작성해주세요"
                  rows={5}
                  className="add-instructor-modal__free-writing-textarea"
                />
              </Form.Item>
            </div>
            <div className="add-instructor-modal__free-writing-item">
              <div className="add-instructor-modal__free-writing-question-bar">
                4. 교육 중 예기치 않은 상황(예: 수업 분위기 저하, 참여도 부족 등)이 발생했을 때 대처한 사례가 있다면 공유해주세요.
              </div>
              <Form.Item name="freeWriting4" noStyle>
                <Input.TextArea
                  placeholder="자유롭게 작성해주세요"
                  rows={5}
                  className="add-instructor-modal__free-writing-textarea"
                />
              </Form.Item>
            </div>
          </div>
        </section>
      </Form>
    </TealHeaderModal>
  )
}

/** 폼 연/월 값(dayjs 또는 문자열)을 YYYY.MM 문자열로 변환 */
function formatYearMonth(val: unknown): string {
  if (val == null) return ''
  if (typeof val === 'string') return val
  const d = val as { format?: (s: string) => string }
  if (typeof d?.format === 'function') return d.format('YYYY.MM')
  return String(val)
}

/** 폼 값으로 새 참여 강사 행 생성 (목록 추가용). 학력·경력·자격·수상·자유작성은 상세 모달 강사 이력서 탭 연동용 */
export function buildInstructorRowFromForm(
  values: AddInstructorFormValues,
  nextNo: number,
  nextId: string
): ParticipatingInstructorRow {
  const instructorName =
    (values.nameKorean ?? '').trim() || (values.nameEnglish ?? '').trim() || '이름 없음'
  const firstEdu = values.educations?.[0]
  const educationLevel = firstEdu?.schoolType ?? '-'
  const educationSchoolName = firstEdu?.schoolName ?? '-'
  const educations = values.educations?.map((e) => ({
    schoolType: e.schoolType,
    status: e.status,
    schoolName: e.schoolName,
    major: e.major,
    enrollmentYear: formatYearMonth(e.enrollmentYear),
    graduationYear: formatYearMonth(e.graduationYear),
  }))
  return {
    id: nextId,
    no: nextNo,
    instructorName,
    schoolName: values.schoolName ?? INSTRUCTOR_SCHOOL_OPTIONS[0],
    educationGrade: '1학년',
    classCount: 0,
    studentCount: 0,
    lectureRound: '진행 전',
    settlementStatus: 'pending' as SettlementStatusKey,
    teacherName: '-',
    educationLevel,
    educationSchoolName,
    lectureExperienceYears: 0,
    careerDetails: values.careers?.map((c) => ({
      companyName: c.companyName,
      role: c.role,
      startDate: c.startDate,
      endDate: c.endDate,
      isCurrent: c.isCurrent,
    })),
    qualifications: values.qualifications,
    awards: values.awards,
    educations,
    freeWriting1: values.freeWriting1,
    freeWriting2: values.freeWriting2,
    freeWriting3: values.freeWriting3,
    freeWriting4: values.freeWriting4,
  }
}
