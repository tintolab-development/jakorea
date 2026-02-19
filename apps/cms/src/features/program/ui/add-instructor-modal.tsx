/**
 * 강사진 추가 모달
 * 프로그램 진행 현황 > 강사 정보 탭에서 "강사 추가" 클릭 시 노출
 * TealHeaderModal 사용, 1400×830(바디) 스펙
 * 섹션: 기본 정보(프로필 사진 + 2열 필드), 최종 학력, 경력 상세, 자격 및 면허, 수상 및 수료 내역
 */

import { useEffect, useState } from 'react'
import { Form, Input, Select, DatePicker, Upload } from 'antd'
import { CameraOutlined, SearchOutlined } from '@ant-design/icons'
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

const GENDER_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: '남', value: 'male' },
  { label: '여', value: 'female' },
]
const MILITARY_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: '군필', value: 'completed' },
  { label: '미필', value: 'not_completed' },
  { label: '면제', value: 'exempted' },
  { label: '재직중', value: 'serving' },
]
const EDUCATION_LEVEL_OPTIONS = [
  { label: '전체', value: 'all' },
  { label: '학교', value: 'school' },
  { label: '대학 4년제', value: 'bachelor' },
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

export interface AddInstructorFormValues {
  /** 기본 정보 - 목록 행 매핑용 */
  nameKorean?: string
  nameHanja?: string
  nameEnglish?: string
  birthDate?: string
  contact?: string
  email?: string
  address?: string
  gender?: string
  militaryStatus?: string
  bankName?: string
  accountNumber?: string
  accountHolder?: string
  educationLevel?: string
  educationSearch?: string
  schoolName?: string
  /** 반복 항목 */
  educations?: EducationItem[]
  careerType?: 'new' | 'experienced'
  careers?: CareerItem[]
  qualifications?: QualificationItem[]
  awards?: AwardItem[]
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
        qualifications: [{}],
        awards: [{}],
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
      <AppButton htmlType="submit" variant="primary" size="large" modalTeal form="add-instructor-form">
        저장
      </AppButton>
    </div>
  )

  return (
    <TealHeaderModal
      open={open}
      onCancel={handleCancel}
      title="강사진 추가"
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
          nameHanja: '',
          nameEnglish: '',
          contact: '',
          email: '',
          address: '',
          gender: 'all',
          militaryStatus: 'all',
          bankName: 'all',
          accountNumber: '',
          accountHolder: '',
          educationLevel: 'all',
          educationSearch: '',
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
          <h3 className="add-instructor-modal__section-title">기본 정보</h3>
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
            {/* 우측 테이블 1128×384: 행1–3 성명(한글/한자/영문) | 생년월일/연락처/이메일, 행4 주소 검색 | 성별·병역 select 2, 행5 정산 계좌, 행6 최종 학력 */}
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
                      rowSpan={3}
                      className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--name"
                    >
                      <span className="add-instructor-modal__basic-table-label">성명</span>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--name-sub">
                      <span className="add-instructor-modal__basic-table-label">한글</span>
                      <span className="add-instructor-modal__required-asterisk" aria-hidden>
                        {' '}
                        *
                      </span>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                      <Form.Item
                        name="nameKorean"
                        rules={[{ required: true, message: '한글 성명을 입력해주세요' }]}
                        noStyle
                      >
                        <Input
                          placeholder="한글 성명"
                          size="large"
                          allowClear
                          className="add-instructor-modal__table-input"
                        />
                      </Form.Item>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--label-right">
                      <span className="add-instructor-modal__basic-table-label">생년월일</span>
                      <span className="add-instructor-modal__required-asterisk" aria-hidden>
                        {' '}
                        *
                      </span>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                      <Form.Item
                        name="birthDate"
                        rules={[{ required: true, message: '생년월일을 입력해주세요' }]}
                        noStyle
                      >
                        <DatePicker
                          placeholder="생년월일"
                          size="large"
                          style={{ width: '100%' }}
                          className="add-instructor-modal__table-input"
                        />
                      </Form.Item>
                    </td>
                  </tr>
                  <tr>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--name-sub">
                      <span className="add-instructor-modal__basic-table-label">한자</span>
                      <span className="add-instructor-modal__required-asterisk" aria-hidden>
                        {' '}
                        *
                      </span>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                      <Form.Item
                        name="nameHanja"
                        rules={[{ required: true, message: '한자 성명을 입력해주세요' }]}
                        noStyle
                      >
                        <Input
                          placeholder="한자 성명"
                          size="large"
                          allowClear
                          className="add-instructor-modal__table-input"
                        />
                      </Form.Item>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--label-right">
                      <span className="add-instructor-modal__basic-table-label">연락처</span>
                      <span className="add-instructor-modal__required-asterisk" aria-hidden>
                        {' '}
                        *
                      </span>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                      <Form.Item
                        name="contact"
                        rules={[{ required: true, message: '연락처를 입력해주세요' }]}
                        noStyle
                      >
                        <Input
                          placeholder="연락처"
                          size="large"
                          allowClear
                          className="add-instructor-modal__table-input"
                        />
                      </Form.Item>
                    </td>
                  </tr>
                  <tr>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--name-sub">
                      <span className="add-instructor-modal__basic-table-label">영문</span>
                      <span className="add-instructor-modal__required-asterisk" aria-hidden>
                        {' '}
                        *
                      </span>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                      <Form.Item
                        name="nameEnglish"
                        rules={[{ required: true, message: '영문 성명을 입력해주세요' }]}
                        noStyle
                      >
                        <Input
                          placeholder="영문 성명"
                          size="large"
                          allowClear
                          className="add-instructor-modal__table-input"
                        />
                      </Form.Item>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--label-right">
                      <span className="add-instructor-modal__basic-table-label">이메일</span>
                      <span className="add-instructor-modal__required-asterisk" aria-hidden>
                        {' '}
                        *
                      </span>
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
                        <Input
                          placeholder="이메일"
                          size="large"
                          allowClear
                          className="add-instructor-modal__table-input"
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
                      <span className="add-instructor-modal__required-asterisk" aria-hidden>
                        {' '}
                        *
                      </span>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                      <Form.Item
                        name="address"
                        rules={[{ required: true, message: '주소를 입력해주세요' }]}
                        noStyle
                      >
                        <Input
                          placeholder="건물명, 도로명 또는 지번으로 검색"
                          size="large"
                          allowClear
                          prefix={
                            <SearchOutlined style={{ color: 'var(--color-text-tertiary)' }} />
                          }
                          className="add-instructor-modal__table-input"
                        />
                      </Form.Item>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--label-right">
                      <span className="add-instructor-modal__basic-table-label">
                        성별 및 병역사항
                      </span>
                      <span className="add-instructor-modal__required-asterisk" aria-hidden>
                        {' '}
                        *
                      </span>
                    </td>
                    <td className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input">
                      <div className="add-instructor-modal__gender-military-row">
                        <div className="add-instructor-modal__gender-military-wrap add-instructor-modal__gender-military-wrap--gender">
                          <Form.Item name="gender" rules={[{ required: true }]} noStyle className="add-instructor-modal__gender-military-input-wrap">
                            <Select
                              placeholder="전체"
                              size="large"
                              options={GENDER_OPTIONS}
                              className="add-instructor-modal__table-input add-instructor-modal__gender-military-select"
                            />
                          </Form.Item>
                        </div>
                        <div className="add-instructor-modal__gender-military-divider" aria-hidden />
                        <div className="add-instructor-modal__gender-military-wrap add-instructor-modal__gender-military-wrap--military">
                          <Form.Item name="militaryStatus" rules={[{ required: true }]} noStyle className="add-instructor-modal__gender-military-input-wrap">
                            <Select
                              placeholder="전체"
                              size="large"
                              options={MILITARY_OPTIONS}
                              className="add-instructor-modal__table-input add-instructor-modal__gender-military-select"
                            />
                          </Form.Item>
                        </div>
                      </div>
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
                      <span className="add-instructor-modal__required-asterisk" aria-hidden>
                        {' '}
                        *
                      </span>
                    </td>
                    <td
                      className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input"
                      colSpan={3}
                    >
                      <div className="add-instructor-modal__bank-account-row">
                        <Form.Item name="bankName" rules={[{ required: true }]} noStyle>
                          <Select
                            placeholder="은행명"
                            size="large"
                            options={BANK_OPTIONS}
                            className="add-instructor-modal__table-input"
                            style={{ width: 140 }}
                          />
                        </Form.Item>
                        <Form.Item name="accountNumber" rules={[{ required: true }]} noStyle>
                          <Input
                            placeholder="계좌번호"
                            size="large"
                            allowClear
                            className="add-instructor-modal__table-input"
                            style={{ width: 160 }}
                          />
                        </Form.Item>
                        <div className="add-instructor-modal__bank-account-divider" aria-hidden />
                        <Form.Item name="accountHolder" rules={[{ required: true }]} noStyle>
                          <Input
                            placeholder="예금주명"
                            size="large"
                            allowClear
                            className="add-instructor-modal__table-input"
                            style={{ width: 120 }}
                          />
                        </Form.Item>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td
                      colSpan={2}
                      className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--label add-instructor-modal__basic-table-cell--row-label"
                    >
                      <span className="add-instructor-modal__basic-table-label">최종 학력</span>
                      <span className="add-instructor-modal__required-asterisk" aria-hidden>
                        {' '}
                        *
                      </span>
                    </td>
                    <td
                      className="add-instructor-modal__basic-table-cell add-instructor-modal__basic-table-cell--input"
                      colSpan={3}
                    >
                      <div className="add-instructor-modal__education-level-row">
                        <Form.Item name="educationLevel" initialValue="all" noStyle>
                          <Select
                            placeholder="전체"
                            size="large"
                            options={EDUCATION_LEVEL_OPTIONS}
                            className="add-instructor-modal__table-input"
                            style={{ width: 220 }}
                          />
                        </Form.Item>
                        <div className="add-instructor-modal__education-level-divider" aria-hidden />
                        <Form.Item
                          name="educationSearch"
                          rules={[{ required: true, message: '학교명을 검색해주세요' }]}
                          noStyle
                        >
                          <Input
                            placeholder="학교명으로 검색"
                            size="large"
                            allowClear
                            prefix={
                              <SearchOutlined style={{ color: 'var(--color-text-tertiary)' }} />
                            }
                            className="add-instructor-modal__table-input add-instructor-modal__education-search-input"
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

        <div className="add-instructor-modal__divider" aria-hidden />

        <EducationSection />

        <div className="add-instructor-modal__divider" aria-hidden />

        {/* 경력 상세: careerType은 Form.useWatch로 구독, 항목 추가 버튼은 CareerDetailSection 내부에서 관리 */}
        <CareerDetailSection />

        <div className="add-instructor-modal__divider" aria-hidden />

        {/* 자격 및 면허: 경력 상세와 동일한 행목 테이블 스타일, 타이틀·항목 추가 버튼 같은 레벨 */}
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

        <div className="add-instructor-modal__divider" aria-hidden />

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
                                <div
                                  className="add-instructor-modal__award-divider"
                                  aria-hidden
                                />
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
      </Form>
    </TealHeaderModal>
  )
}

/** 폼 값으로 새 참여 강사 행 생성 (목록 추가용) */
export function buildInstructorRowFromForm(
  values: AddInstructorFormValues,
  nextNo: number,
  nextId: string
): ParticipatingInstructorRow {
  const instructorName =
    (values.nameKorean ?? '').trim() ||
    (values.nameEnglish ?? '').trim() ||
    (values.nameHanja ?? '').trim() ||
    '이름 없음'
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
  }
}
